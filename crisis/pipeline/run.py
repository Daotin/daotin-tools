import argparse
import datetime
import json
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import backtest as bt
import compute
import fetch

LATEST_PATH = os.path.join(os.path.dirname(bt.ROOT), "public", "crisis", "data", "latest.js")
SUMMARY_PATH = os.path.join(os.path.dirname(LATEST_PATH), "summary.json")
LATEST_PREFIX = "window.CRISIS_DATA = "
VOLATILE_KEYS = ("generated_at", "data_fetched_at", "as_of")
TRIAL_TEXT = {"trigger": "已出现", "watch": "有苗头", "ok": "未触发"}


def stable_part(data):
    data = json.loads(json.dumps(data, ensure_ascii=False))
    for key in VOLATILE_KEYS:
        data.pop(key, None)
    data.get("backtest", {}).pop("as_of", None)
    return data


def read_latest():
    if not os.path.exists(LATEST_PATH):
        return None
    with open(LATEST_PATH, encoding="utf-8") as f:
        text = f.read()
    return json.loads(text[len(LATEST_PREFIX):].rstrip().rstrip(";"))


def write_text(path, text):
    tmp = path + ".tmp"
    with open(tmp, "w", encoding="utf-8") as f:
        f.write(text)
    os.replace(tmp, path)


def write_latest(current, history):
    data = dict(generated_at=datetime.datetime.now().astimezone().isoformat(timespec="seconds"), **current)
    data["backtest"] = {k: v for k, v in history.items() if k != "generated_at"}
    previous = read_latest()
    if previous is not None and stable_part(previous) == stable_part(data):
        return False
    summary = {
        "level": current["level"]["level"],
        "decided_by": current["level"]["decided_by"],
        "insufficient_nodes": current["level"]["insufficient_nodes"],
        "as_of": current["as_of"],
        "data_fetched_at": current["data_fetched_at"],
    }
    os.makedirs(os.path.dirname(LATEST_PATH), exist_ok=True)
    write_text(LATEST_PATH, LATEST_PREFIX + json.dumps(data, ensure_ascii=False, indent=2) + ";\n")
    write_text(SUMMARY_PATH, json.dumps(summary, ensure_ascii=False, indent=2) + "\n")
    return True


def value_text(state):
    value = state["value"]
    if value is None:
        return "-"
    text = fetch.format_value(value) if isinstance(value, float) else value
    return "%s（%s）" % (text, state["date"])


def print_summary(current):
    indicators = {i["id"]: i for i in current["indicators"]}
    print()
    print("当前状态（计算日期 %s）" % current["as_of"])
    for node in current["nodes"]:
        print()
        print("  %s %s：%s" % (node["id"], node["name"], node["label"]))
        for item_id in node["main"]:
            item = indicators[item_id]
            extra = "" if item.get("measure") is None else "，从一年内最高点下跌 %s%%" % fetch.format_value(item["measure"])
            print("    主指标 %s %s：%s%s，%s" % (item_id, item["name"], value_text(item), extra, item["label"]))
        if node["watch_unknown"]:
            print("    苗头无法判断：判断“%s”所需的辅助指标数据不足" % node["watch_text"])
        if node["trials"]:
            print("    缺失的项按偏高算：%s；按不偏高算：%s" % (TRIAL_TEXT[node["trials"]["as_hit"]], TRIAL_TEXT[node["trials"]["as_not_hit"]]))
        if node["month_trigger_day"]:
            print("    本月 %s 曾达到触发线" % node["month_trigger_day"])
        if node["prev_hint"]:
            hint = node["prev_hint"]
            print("    上一步已触发：%s 这一轮始于 %s（估计可见日 %s），还没有结束" % (hint["prev"], hint["start"], hint["visible"]))
    level = current["level"]
    print()
    print("预警等级：%s" % level["level"])
    print("  由哪几个节点决定：%s" % ("、".join(level["decided_by"]) or "无"))
    print("  数据不足的节点：%s" % ("、".join(level["insufficient_nodes"]) or "无"))
    print("  苗头无法判断的节点：%s" % ("、".join(level["watch_unknown_nodes"]) or "无"))
    print()
    print("人工录入文件的问题（%d 项）：" % len(current["warnings"]))
    for w in current["warnings"]:
        print("  %s" % w)
    if not current["warnings"]:
        print("  无")
    print()
    print("取数失败清单（%d 项，来自 data/fetch_status.json）：" % len(current["fetch_failures"]))
    for f in current["fetch_failures"]:
        kept = "保留了上次的数据，最后日期 %s" % f["end"] if f["kept_previous_file"] else "没有上次的数据"
        print("  %s %s：%s（%s）" % (f["id"], f["name"], f["error"], kept))
    if not current["fetch_failures"]:
        print("  无")
    gaps = [i for i in current["indicators"] if i["missing_reason"] == compute.GAP_REASON]
    if gaps:
        print()
        print("最新一期算不出值的指标（%d 项）：" % len(gaps))
        for i in gaps:
            print("  %s %s：%s 这一期计算要用到的更早数据有缺失，显示“%s”" % (i["id"], i["name"], i["date"], i["label"]))


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--as-of", default=datetime.date.today().isoformat())
    parser.add_argument("--skip-fetch", action="store_true")
    args = parser.parse_args()
    as_of = datetime.date.fromisoformat(args.as_of).isoformat()
    print("== 1 取数 ==")
    if args.skip_fetch:
        print("已跳过（--skip-fetch），使用现有的 data/raw/")
    else:
        fetch.main()
    print()
    print("== 2 回测 ==")
    history = bt.run(as_of)
    print("已写入 data/backtest.json。跳过统计的指标或条件（%d 项）：" % len(history["skipped"]))
    for s in history["skipped"]:
        print("  %s：%s" % (s["what"], s["reason"]))
    print()
    print("== 3 计算 ==")
    current = compute.run(as_of)
    print()
    print("== 4 生成 ==")
    if write_latest(current, history):
        print("已写入 public/crisis/data/latest.js 和 summary.json")
    else:
        print("数据没有变化，未改写 public/crisis/data/latest.js 和 summary.json")
    print_summary(current)
    return 0


if __name__ == "__main__":
    sys.exit(main())
