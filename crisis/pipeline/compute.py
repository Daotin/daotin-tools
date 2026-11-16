import csv
import datetime
import json
import os
import re
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import backtest as bt
import fetch
import signals as sg

MANUAL_PATH = os.path.join(bt.ROOT, "data", "manual.csv")
STATUS_PATH = os.path.join(bt.ROOT, "data", "fetch_status.json")
MANUAL_FIELDS = ["id", "date", "value", "source", "scope", "link", "published", "note"]
MANUAL_REQUIRED = {"13": [("source", "来源"), ("scope", "口径"), ("link", "链接")]}
INDICATOR_FIELDS = ["id", "node", "role", "name", "explain", "frequency", "params", "rule_text", "url", "unit", "decimals", "measure_text", "measure_unit", "measure_decimals", "cumulative"]
TRIGGER_RULES = ("drawdown_from_high", "consecutive", "compare_same_period")
DANGER_NODES = ("N5", "N6")
ALERT_NODES = ("N2", "N3", "N4")
STATE_NODE = "N1"
DATE_PATTERN = re.compile(r"(\d{4})[-/](\d{1,2})[-/](\d{1,2})")
GAP_REASON = "中间缺数据"


def missing(reason, value=None, date=None):
    return {"value": value, "date": date, "level": None, "label": "数据不足（%s）" % reason, "missing_reason": reason}


def level_label(rule, level):
    if level == "hit":
        return rule.get("label", "越线")
    if level == "trigger":
        return rule.get("trigger_label", "已触发")
    if level == "watch":
        return rule.get("watch_label", "有苗头")
    return "未触发" if rule["type"] in TRIGGER_RULES else "未越线"


def expired(item, date, as_of):
    if item["valid_days"] is None:
        return False
    end = sg.period_end(sg.parse_day(date), item["frequency"])
    return (sg.parse_day(as_of) - end).days > item["valid_days"]


def auto_state(item, obs, fetch_result, as_of, gap_date):
    if "city" in item.get("params", {}) and not item["params"]["city"]:
        return missing("没有配置")
    if not obs:
        return missing("下载失败")
    if gap_date:
        return missing(GAP_REASON, None, gap_date)
    rule = item["rule"]
    levels = None
    if rule["type"] == "display":
        index, level = len(obs) - 1, None
        flag = rule.get("flag")
        label = flag["label"] if flag and sg.OPS[flag["op"]](obs[index][1], flag["value"]) else None
    else:
        levels = sg.rule_levels(obs, item)
        judged = [i for i, (_, level) in enumerate(levels) if level is not None]
        if not judged:
            reason = "历史不足 %d 年" % rule["min_history_years"] if rule["type"] == "percentile" else "没有历史"
            return missing(reason, obs[-1][1], obs[-1][0])
        if obs[-1][0] in sg.comparison_gaps(levels, rule):
            return missing(GAP_REASON, obs[-1][1], obs[-1][0])
        index = judged[-1]
        level = levels[index][1]
        label = level_label(rule, level)
    date, value = obs[index]
    state = {"value": value, "date": date, "level": level, "label": label, "missing_reason": None}
    if rule["type"] in ("drawdown_from_high", "rise_from_low"):
        state["measure"] = sg.extreme_change([v for _, v in obs[index - rule["lookback_obs"] + 1:index + 1]], rule["type"])
    if rule.get("record_month_trigger"):
        days = [d for d, lv in levels if d[:7] == date[:7] and lv == "trigger"]
        state["month_trigger_day"] = days[0] if days and level != "trigger" else None
    if expired(item, date, as_of):
        return dict(state, level=None, label="数据不足（已过期）", missing_reason="已过期")
    state["fetch_failed"] = fetch_result == "failed"
    return state


def find_prior(rows, rule):
    latest = sg.parse_day(rows[-1]["date"])
    low = sg.add_months(latest, -rule["max_months"])
    high = sg.add_months(latest, -rule["min_months"])
    target = sg.add_months(latest, -(rule["min_months"] + rule["max_months"]) // 2)
    candidates = [r for r in rows if low <= sg.parse_day(r["date"]) <= high]
    return min(candidates, key=lambda r: abs((sg.parse_day(r["date"]) - target).days), default=None)


def manual_state(item, rows):
    if not rows:
        return missing("没有录入")
    latest = rows[-1]
    state = {"value": latest["value"], "date": latest["date"], "level": None, "label": None, "missing_reason": None, "entries": rows}
    rule = item["rule"]
    if rule["type"] == "compare_manual_prior":
        prior = find_prior(rows, rule)
        if prior is None:
            return dict(state, label="数据不足（没有录入）", missing_reason="没有录入")
        flag = rule["flag"]
        state["prior"] = {"value": prior["value"], "date": prior["date"]}
        state["label"] = flag["label"] if sg.OPS[flag["op"]](latest["value"], prior["value"]) else None
    return state


def matches(state, cond):
    if state["missing_reason"]:
        return None
    return sg.condition_flags([(state["date"], state["level"])], cond)[0][1]


def count_status(node, flags):
    if sg.count_at_least(node["trigger"]["n"])(flags):
        return "trigger"
    return "watch" if sum(flags) == node["watch"]["n"] else "ok"


def node_state(node, states, prev, as_of):
    trigger, watch = node["trigger"], node["watch"]
    result = {
        "id": node["id"],
        "name": node["name"],
        "summary": node["summary"],
        "todo": node["todo"],
        "main": node["main"],
        "trigger_text": trigger["text"],
        "watch_text": watch["text"],
        "watch_unknown": False,
        "trials": None,
        "month_trigger_day": None,
        "prev_hint": None,
    }
    if trigger["type"] == "count_at_least":
        flags = [matches(states[i], "hit") for i in node["main"]]
        if None in flags:
            trials = {"as_hit": count_status(node, [f is not False for f in flags]), "as_not_hit": count_status(node, [f is True for f in flags])}
            result["trials"] = trials
            status = trials["as_hit"] if trials["as_hit"] == trials["as_not_hit"] else "insufficient"
        else:
            status = count_status(node, flags)
    else:
        main = states[node["main"][0]]
        result["month_trigger_day"] = main.get("month_trigger_day")
        if main["missing_reason"]:
            status = "insufficient"
        elif matches(main, "trigger"):
            status = "trigger"
        elif watch["type"] == "main_level":
            status = "watch" if matches(main, "watch") else "ok"
        else:
            hit = sg.all_of([matches(states[i], "hit") for i in watch["indicators"]])
            result["watch_unknown"] = hit is None
            status = "watch" if hit else "ok"
    result["status"] = status
    result["label"] = {"trigger": trigger["label"], "watch": watch["label"], "ok": node.get("ok_label", "未触发"), "insufficient": "数据不足"}[status]
    if prev is not None:
        prev_id, rounds = prev
        rnd = sg.active_round(rounds, as_of)
        if rnd is not None:
            result["prev_hint"] = {"prev": prev_id, "start": rnd["start"], "visible": rnd["visible"], "end": rnd["end"]}
    return result


def warning_level(nodes):
    status = {n["id"]: n["status"] for n in nodes}
    tiers = [
        ("危险", [i for i in DANGER_NODES if status.get(i) == "trigger"]),
        ("警惕", [i for i in ALERT_NODES if status.get(i) == "trigger"]),
        ("留意", [i for i, s in status.items() if s == ("trigger" if i == STATE_NODE else "watch")]),
    ]
    insufficient = [i for i, s in status.items() if s == "insufficient"]
    level, decided = next(((name, ids) for name, ids in tiers if ids), ("数据不足" if insufficient else "正常", insufficient))
    return {
        "level": level,
        "decided_by": decided,
        "insufficient_nodes": insufficient,
        "watch_unknown_nodes": [n["id"] for n in nodes if n["watch_unknown"]],
    }


def evaluate(indicators, nodes, obs_map, gap_map, manual_rows, fetch_status, trigger_rounds, as_of):
    states = {}
    entries = []
    for item in indicators:
        source = item["source"]
        if source["type"] == "manual":
            state = manual_state(item, manual_rows.get(item["id"], []))
        else:
            source_id = source["from"] if source["type"] == "derived" else item["id"]
            state = auto_state(item, obs_map.get(item["id"]), fetch_status.get(source_id, {}).get("result"), as_of, gap_map.get(item["id"]))
        states[item["id"]] = state
        entries.append(dict({k: item.get(k) for k in INDICATOR_FIELDS}, **state))
    prev_of = {b: a for a, b in bt.PAIRS}
    node_results = []
    for node in nodes:
        prev_id = prev_of.get(node["id"])
        prev = None if prev_id is None else (prev_id, trigger_rounds.get(prev_id, []))
        node_results.append(node_state(node, states, prev, as_of))
    return {"level": warning_level(node_results), "nodes": node_results, "indicators": entries}


def normalize_date(text):
    m = DATE_PATTERN.fullmatch(text)
    if not m:
        return None
    try:
        return datetime.date(int(m.group(1)), int(m.group(2)), int(m.group(3))).isoformat()
    except ValueError:
        return None


def parse_manual(line, manual_items):
    if len(line) > len(MANUAL_FIELDS):
        return "列数多于 %d 列" % len(MANUAL_FIELDS), None
    cells = [c.strip() for c in line] + [""] * (len(MANUAL_FIELDS) - len(line))
    row = dict(zip(MANUAL_FIELDS, cells))
    item = manual_items.get(row["id"])
    if item is None:
        return "编号 %r 不是人工录入的指标（只能填 %s）" % (row["id"], "、".join(manual_items)), None
    row["date"] = normalize_date(row["date"])
    if row["date"] is None:
        return "日期 %r 不是“年-月-日”格式" % cells[1], None
    if row["published"]:
        row["published"] = normalize_date(row["published"])
        if row["published"] is None:
            return "实际公布日 %r 不是“年-月-日”格式" % cells[6], None
    if not row["value"]:
        return "数值为空", None
    try:
        row["value"] = float(row["value"])
    except ValueError:
        if item["rule"]["type"] == "compare_manual_prior":
            return "数值 %r 不是数字" % row["value"], None
    for key, title in MANUAL_REQUIRED.get(row["id"], []):
        if not row[key]:
            return "编号 %s 必须填写%s" % (row["id"], title), None
    return None, {k: v if v != "" else None for k, v in row.items()}


def load_manual(manual_items, warnings):
    if not os.path.exists(MANUAL_PATH):
        warnings.append("没有 data/manual.csv，人工录入的指标按“没有录入”处理")
        return {}
    rows = {}
    with open(MANUAL_PATH, encoding="utf-8-sig", newline="") as f:
        reader = csv.reader(f)
        next(reader, None)
        for line_no, line in enumerate(reader, 2):
            if not any(c.strip() for c in line):
                continue
            problem, row = parse_manual(line, manual_items)
            if problem:
                warnings.append("data/manual.csv 第 %d 行：%s，这一行已跳过" % (line_no, problem))
                continue
            rows.setdefault(row["id"], []).append(row)
    for group in rows.values():
        group.sort(key=lambda r: r["date"])
    return rows


def run(as_of):
    backtest = bt.Backtest(as_of)
    with open(STATUS_PATH, encoding="utf-8") as f:
        status = json.load(f)
    with open(bt.OUT_PATH, encoding="utf-8") as f:
        history = json.load(f)
    warnings = []
    items = list(backtest.indicators.values())
    manual_items = {i["id"]: i for i in items if i["source"]["type"] == "manual"}
    obs_map = {i["id"]: backtest.obs(i["id"]) for i in items if i["source"]["type"] != "manual"}
    gap_map = {}
    for item_id, obs in obs_map.items():
        gaps = backtest.gaps(item_id)
        if gaps and gaps[-1] > obs[-1][0]:
            gap_map[item_id] = gaps[-1]
    trigger_rounds = {n["id"]: n["rounds"] for n in history["nodes"]}
    current = evaluate(items, backtest.nodes, obs_map, gap_map, load_manual(manual_items, warnings), status, trigger_rounds, as_of)
    fetched = [fetch.last_ok_at(s) for s in status.values()]
    failures = [
        {"id": s["id"], "name": s["name"], "error": s["error"], "kept_previous_file": s["kept_previous_file"], "end": s.get("end")}
        for s in status.values() if s["result"] == "failed"
    ]
    reference = [{"id": r["id"], "name": r["name"], "url": r["url"]} for r in bt.load_json("indicators.json")["reference_series"]]
    return dict(as_of=as_of, data_fetched_at=max((f for f in fetched if f), default=None), **current, reference_series=reference, fetch_failures=failures, warnings=warnings)
