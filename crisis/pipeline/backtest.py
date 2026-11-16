import argparse
import csv
import datetime
import json
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import signals as sg

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CONFIG_DIR = os.path.join(ROOT, "config")
RAW_DIR = os.path.join(ROOT, "data", "raw")
OUT_PATH = os.path.join(ROOT, "data", "backtest.json")
CASE_WINDOW_MONTHS = 24
PAIRS = [("N2", "N3"), ("N3", "N4"), ("N4", "N5"), ("N5", "N6")]
REFERENCE_ITEM = {"frequency": "monthly", "publish_lag_days": 0}
UNCLASSIFIED = "对照数据缺失，没有分类"


def load_json(name):
    with open(os.path.join(CONFIG_DIR, name), encoding="utf-8") as f:
        return json.load(f)


def load_raw(series_id):
    path = os.path.join(RAW_DIR, "%s.csv" % series_id)
    if not os.path.exists(path):
        return None
    with open(path, newline="") as f:
        reader = csv.reader(f)
        next(reader, None)
        return [(line[0], float(line[1])) for line in reader if line]


class Backtest:
    def __init__(self, as_of):
        self.as_of = as_of
        self.indicators = {i["id"]: i for i in load_json("indicators.json")["indicators"]}
        self.nodes = load_json("nodes.json")["nodes"]
        self.node_map = {n["id"]: n for n in self.nodes}
        self.cases_config = load_json("cases.json")
        self.skipped = []
        self.warned = set()
        self.obs_cache = {}

    def skip(self, what, reason):
        self.skipped.append({"what": what, "reason": reason})

    def load(self, item_id, transform):
        item = self.indicators[item_id]
        raw = load_raw(item["source"]["from"] if item["source"]["type"] == "derived" else item_id)
        if raw is None:
            return None, []
        obs = sg.apply_transform(raw, transform, item["frequency"])
        return obs, sg.gap_dates(raw, obs)

    def obs(self, item_id):
        if item_id not in self.obs_cache:
            self.obs_cache[item_id] = self.load(item_id, self.indicators[item_id]["transform"])
        return self.obs_cache[item_id][0]

    def gaps(self, item_id):
        self.obs(item_id)
        return self.obs_cache[item_id][1]

    def periods(self, item_id, cond, transform=None, rule=None):
        item = self.indicators[item_id]
        obs, gaps = (self.obs(item_id), self.gaps(item_id)) if transform is None else self.load(item_id, transform)
        if obs is None:
            return None
        levels = sg.rule_levels(obs, item, rule)
        periods, missing = sg.period_flags(sg.condition_flags(levels, cond), item)
        missing = sorted(set(missing) | {d[:7] for d in gaps + sg.comparison_gaps(levels, rule or item["rule"])})
        if missing and item_id not in self.warned:
            self.warned.add(item_id)
            self.skip("%s %s 的 %s" % (item_id, item["name"], "、".join(missing)), "这些月份没有数据，按不判断处理")
        return periods

    def monthly(self, item_id, periods):
        return sg.expand_quarters(periods) if self.indicators[item_id]["frequency"] == "quarterly" else periods

    def end_after(self, item_id):
        return sg.ROUND_END_PERIODS["quarterly" if item_id and self.indicators[item_id]["frequency"] == "quarterly" else "monthly"]

    def condition_periods(self, node, which):
        cond = node[which]
        kind = cond["type"]
        main = node["main"]
        if kind == "main_level":
            periods = self.periods(main[0], cond["level"])
            if cond["level"] == "watch" and periods is not None:
                periods = sg.exclude(periods, self.periods(main[0], "trigger"))
            return periods, main[0]
        if kind == "count_at_least":
            parts = [self.part(node, which, i, "hit") for i in main]
            return sg.combine(parts, sg.count_at_least(cond["n"])), None
        if kind == "aux_all_hit":
            parts = [self.part(node, which, i, "hit") for i in cond["indicators"]]
            parts.append(sg.negate(self.part(node, which, main[0], "trigger")))
            return sg.combine(parts, sg.all_of), None
        raise ValueError("不认识的条件类型 %s" % kind)

    def part(self, node, which, item_id, cond):
        periods = self.periods(item_id, cond)
        if periods is None:
            self.skip("%s %s" % (item_id, self.indicators[item_id]["name"]), "没有原始数据文件，%s 的“%s”条件里这一项按缺失计算" % (node["id"], node[which]["label"]))
            return []
        return self.monthly(item_id, periods)

    def run(self):
        self.trigger = {}
        self.trigger_rounds = {}
        no_trigger_data = set()
        for node in self.nodes:
            periods, item_id = self.condition_periods(node, "trigger")
            if periods is None:
                self.skip("%s %s 的触发规则" % (node["id"], node["name"]), "主指标没有原始数据文件，不统计轮次")
                no_trigger_data.add(node["id"])
                periods = []
            self.trigger[node["id"]] = periods
            self.trigger_rounds[node["id"]] = sg.find_rounds(periods, self.end_after(item_id))
        usrec = load_raw("USREC")
        if usrec is None:
            self.skip("USREC 美国衰退月份", "没有原始数据文件，N3 不做分类")
        recessions = None if usrec is None else sg.find_rounds(sg.period_flags([(d, v == 1) for d, v in usrec], REFERENCE_ITEM)[0], 1)
        self.events = {}
        for node in self.nodes:
            kind = node["event"]["type"]
            if kind == "trigger":
                self.events[node["id"]] = None if node["id"] in no_trigger_data else self.trigger_rounds[node["id"]]
            elif kind == "reference":
                self.events[node["id"]] = recessions
        return {
            "generated_at": datetime.datetime.now().astimezone().isoformat(timespec="seconds"),
            "as_of": self.as_of,
            "nodes": self.node_results(),
            "signals": self.signal_results(),
            "n4_rule_comparison": self.n4_comparison(),
            "cases": self.case_results(),
            "periods": self.period_results(),
            "skipped": self.skipped,
        }

    def classified(self, rounds, events, window):
        return [dict(r, **sg.classify(r, events, window, self.as_of)) for r in rounds]

    def node_results(self):
        results = []
        for node in self.nodes:
            first, last = sg.judged_range(self.trigger[node["id"]])
            starts = [self.obs(i)[0][0] for i in node["main"] if self.obs(i)]
            rounds = self.trigger_rounds[node["id"]]
            entry = {
                "id": node["id"],
                "name": node["name"],
                "main": node["main"],
                "rule": node["trigger"]["text"],
                "data_start": min(starts) if starts else None,
                "judged_start": first,
                "judged_end": last,
            }
            if node["event"]["type"] == "reference":
                events = self.events[node["id"]]
                entry["event_source"] = node["event"]["series"]
                entry["events"] = events
                if events is None:
                    entry["summary"] = None
                    entry["unclassified_reason"] = UNCLASSIFIED
                else:
                    rounds = self.classified(rounds, events, self.indicators[node["main"][0]]["window_months"])
                    for r in rounds:
                        r["in_recession"] = any(sg.in_progress(e, r["start"]) for e in events)
                    entry["summary"] = sg.summarize(rounds)
            entry["rounds"] = rounds
            entry["round_count"] = len(rounds)
            entry["unknown_start_count"] = sum(1 for r in rounds if r["unknown_start"])
            results.append(entry)
        return results

    def signal_results(self):
        results = []
        for node in self.nodes:
            against = node["event"].get("classify_against", node["id"])
            events = self.events[against]
            if node["event"]["type"] == "none":
                for item_id in node["main"]:
                    results.append(self.signal_entry(node, "indicator", item_id, against, events, self.periods(item_id, "hit"), self.indicators[item_id]["window_months"]))
                results.append(self.signal_entry(node, "trigger", None, against, events, self.trigger[node["id"]], node["trigger"]["window_months"]))
                self.skip("%s 的“%s”条件（%s）" % (node["id"], node["watch"]["label"], node["watch"]["text"]), "%s 是状态，没有自己的事件，方案只要求它的 %d 项和“%s”条件做分类统计" % (node["id"], len(node["main"]), node["trigger"]["label"]))
                continue
            for item_id, item in self.indicators.items():
                if item["node"] == node["id"] and item["role"] == "aux":
                    results.append(self.signal_entry(node, "indicator", item_id, against, events, self.periods(item_id, "hit"), item["window_months"]))
            periods, item_id = self.condition_periods(node, "watch")
            results.append(self.signal_entry(node, "watch", item_id, against, events, periods, node["watch"]["window_months"]))
        return results

    def signal_entry(self, node, kind, item_id, against, events, periods, window):
        if kind == "indicator":
            name = "%s %s %s" % (item_id, self.indicators[item_id]["name"], self.indicators[item_id]["rule"].get("label", "越线"))
        else:
            cond = node[kind]
            name = "%s“%s”：%s" % (node["id"], cond["label"], cond["text"])
        entry = {"node": node["id"], "kind": kind, "indicator": item_id if kind == "indicator" else None, "name": name, "against": against, "window_months": window}
        if periods is None:
            self.skip(name, "没有原始数据文件，不做分类统计")
            entry.update({"judged_start": None, "rounds": [], "summary": None})
            return entry
        rounds = sg.find_rounds(periods, self.end_after(item_id))
        entry["judged_start"] = sg.judged_range(periods)[0]
        if events is None:
            self.skip(name, "对照的 %s 事件数据缺失，没有分类" % against)
            entry.update({"rounds": rounds, "summary": None, "unclassified_reason": UNCLASSIFIED})
            return entry
        rounds = self.classified(rounds, events, window)
        entry.update({"rounds": rounds, "summary": sg.summarize(rounds)})
        return entry

    def n4_comparison(self):
        item = self.indicators["14"]
        main_rounds = self.trigger_rounds["N4"]
        result = [{"rule": self.node_map["N4"]["trigger"]["text"], "rounds": main_rounds}]
        for alt in item.get("alt_rules", []):
            periods = self.periods("14", "trigger", alt["transform"], alt["rule"])
            if periods is None:
                self.skip("N4 对照规则：%s" % alt["name"], "没有原始数据文件，不统计轮次")
                periods = []
            result.append({"rule": alt["name"], "rounds": sg.find_rounds(periods, sg.ROUND_END_PERIODS["monthly"])})
        return result

    def case_results(self):
        results = []
        for prev_id, next_id in PAIRS:
            next_range = sg.judged_range(self.trigger[next_id])
            items = []
            for r in self.trigger_rounds[prev_id]:
                if r["unknown_start"]:
                    self.skip("%s→%s 案例：%s 始于 %s 的一轮" % (prev_id, next_id, prev_id, r["start"]), "这一轮是历史第一条数据就满足，起点未知，不列案例")
                    continue
                case = {"prev_start": r["start"], "prev_visible": r["visible"]}
                case.update(sg.case_label(r["start"], self.trigger_rounds[next_id], next_range, self.as_of, CASE_WINDOW_MONTHS))
                items.append(case)
            manual = [dict(c, label="人工案例") for c in self.cases_config["cases"] if c["pair"] == [prev_id, next_id]]
            results.append({"pair": [prev_id, next_id], "window_months": CASE_WINDOW_MONTHS, "next_judged_start": next_range[0], "items": items, "manual": manual})
        return results

    def period_results(self):
        results = []
        for period in self.cases_config["periods"]:
            nodes = []
            for node in self.nodes:
                first, last = sg.judged_range(self.trigger[node["id"]])
                if first is None or first > period["start"] or last < period["end"]:
                    nodes.append({"node": node["id"], "status": "数据不足", "judged_start": first, "rounds": []})
                    continue
                rounds = [r for r in self.trigger_rounds[node["id"]] if r["start"] <= period["end"] and (r["close"] is None or r["close"] > period["start"])]
                nodes.append({"node": node["id"], "status": "有数据", "judged_start": first, "rounds": rounds})
            results.append(dict(period, nodes=nodes))
        return results


def round_text(r, cols):
    parts = [("起点未知 " if r["unknown_start"] else "") + r["start"], r["visible"] or "-", r["end"], r["close"] or "未结束"]
    if "category" in cols:
        cat = r.get("category") or ("起点未知，不分类" if r["unknown_start"] else UNCLASSIFIED)
        if r.get("lead_months") is not None:
            cat += "，提前 %d 个月（估算）" % r["lead_months"]
        if r.get("lag_months") is not None:
            cat += "，晚 %d 个月（对照事件始于 %s）" % (r["lag_months"], r["event_start"])
        parts.append(cat)
    if "in_recession" in cols:
        parts.insert(4, "是" if r["in_recession"] else "否")
    return parts


def print_table(header, rows):
    print("    " + " | ".join(header))
    for i, row in enumerate(rows, 1):
        print("    %d. " % i + " | ".join(row))
    if not rows:
        print("    （没有）")


def summary_text(s):
    if s is None:
        return "跳过"
    return "提前命中 %d 轮、同期或滞后确认 %d 轮、误报 %d 轮、待观察 %d 轮、起点未知 %d 轮" % (
        s["提前命中"], s["同期或滞后确认"], s["误报"], s["待观察"], s["起点未知"])


ROUND_HEADER = ["开始月份", "估计可见日", "最后满足月份", "结束确认月份"]


def print_report(result):
    print("回测计算日期：%s" % result["as_of"])
    print()
    print("一、每个节点的历史触发轮次")
    for n in result["nodes"]:
        print()
        print("  %s %s：%s。主指标数据 %s 起，判断 %s 至 %s；共 %d 轮，其中起点未知 %d 轮" % (
            n["id"], n["name"], n["rule"], (n["data_start"] or "-")[:7], n["judged_start"], n["judged_end"], n["round_count"], n["unknown_start_count"]))
        if n["id"] == "N1":
            print("    N1 是状态，不定义事件；“已出现”的轮次和分类见第二段")
        if n.get("unclassified_reason"):
            print("    %s" % n["unclassified_reason"])
        if n.get("events") is not None:
            print("    对照：%s 衰退期 %d 段（1990 年以后：%s）" % (n["event_source"], len(n["events"]), "、".join(
                "%s 至 %s" % (e["start"], e["end"]) for e in n["events"] if e["start"] >= "1990")))
            print("    分类：%s" % summary_text(n["summary"]))
            print_table(ROUND_HEADER[:4] + ["数据所属月份在衰退期内", "分类"], [round_text(r, ("category", "in_recession")) for r in n["rounds"]])
        else:
            print_table(ROUND_HEADER, [round_text(r, ()) for r in n["rounds"]])
    print()
    print("二、N1 的 3 项和“已出现”条件、各辅助指标、“有苗头”条件的分类统计")
    for s in result["signals"]:
        print()
        print("  [%s] %s。对照 %s 的事件，观察窗口 %d 个月，判断 %s 起" % (s["node"], s["name"], s["against"], s["window_months"], s["judged_start"]))
        print("    %s" % (s.get("unclassified_reason") or summary_text(s["summary"])))
        print_table(ROUND_HEADER + ["分类"], [round_text(r, ("category",)) for r in s["rounds"]])
    print()
    print("三、N4 两条规则的历史轮次对照")
    main, alt = result["n4_rule_comparison"][0], result["n4_rule_comparison"][1]
    used = set()
    rows = []
    for r in main["rounds"]:
        match = [a for a in alt["rounds"] if a["start"] <= (r["close"] or "9999") and r["start"] <= (a["close"] or "9999")]
        used.update(a["start"] for a in match)
        rows.append(round_text(r, ()) + ["；".join("%s 至 %s（%s）" % (a["start"], a["end"], a["close"] or "未结束") for a in match) or "无"])
    print("  规则甲：%s，%d 轮；规则乙：%s，%d 轮" % (main["rule"], len(main["rounds"]), alt["rule"], len(alt["rounds"])))
    print("  规则甲的每一轮，以及同一时间段内规则乙的轮次：")
    print_table(ROUND_HEADER + ["规则乙同期的轮次（开始 至 最后满足（结束确认））"], rows)
    print("  规则乙有、规则甲同一时间段没有的轮次：")
    print_table(ROUND_HEADER, [round_text(a, ()) for a in alt["rounds"] if a["start"] not in used])
    print()
    print("四、相邻节点的历史案例（上一步每一轮开始后 %d 个月内，下一步的情况）" % CASE_WINDOW_MONTHS)
    for c in result["cases"]:
        print()
        print("  %s → %s（下一步从 %s 起有判断）" % (c["pair"][0], c["pair"][1], c["next_judged_start"]))
        rows = []
        for item in c["items"]:
            months = "" if "months" not in item else "相差 %d 个月" % item["months"]
            rows.append([item["prev_start"], item["prev_visible"], item["label"], item.get("next_start", "-"), item.get("next_visible", "-"), months or "-"])
        print_table(["上一步开始月份", "上一步估计可见日", "情况", "下一步开始月份", "下一步估计可见日", "数据所属月份相差"], rows)
        for m in c["manual"]:
            print("    人工案例：%s %s。%s。出处 %s" % (m["time"], m["title"], m["note"], m["source_url"]))
            print("      出处核对：%s" % m["source_check"])
    print()
    print("五、数据不足的案例")
    print()
    print("  相邻节点案例里标“数据不足”的：")
    rows = [["%s → %s" % tuple(c["pair"]), item["prev_start"], item["prev_visible"], "下一步从 %s 起才有判断" % c["next_judged_start"]] for c in result["cases"] for item in c["items"] if item["label"] == "数据不足"]
    print_table(["节点", "上一步开始月份", "上一步估计可见日", "原因"], rows)
    for p in result["periods"]:
        print()
        print("  人工定义的时间段“%s”（%s 至 %s）各节点的触发月份：" % (p["name"], p["start"], p["end"]))
        rows = []
        for n in p["nodes"]:
            if n["status"] == "数据不足":
                rows.append([n["node"], "数据不足（判断从 %s 起）" % n["judged_start"]])
            else:
                rows.append([n["node"], "、".join("%s 起（最后满足 %s）" % (r["start"], r["end"]) for r in n["rounds"]) or "这段时间没有触发"])
        print_table(["节点", "触发月份"], rows)
    print()
    print("  跳过统计的指标或条件：")
    print_table(["对象", "原因"], [[s["what"], s["reason"]] for s in result["skipped"]])


def run(as_of):
    result = Backtest(as_of).run()
    tmp = OUT_PATH + ".tmp"
    with open(tmp, "w", encoding="utf-8") as f:
        json.dump(result, f, ensure_ascii=False, indent=2)
        f.write("\n")
    os.replace(tmp, OUT_PATH)
    return result


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--as-of", default=datetime.date.today().isoformat())
    args = parser.parse_args()
    print_report(run(datetime.date.fromisoformat(args.as_of).isoformat()))
    return 0


if __name__ == "__main__":
    sys.exit(main())
