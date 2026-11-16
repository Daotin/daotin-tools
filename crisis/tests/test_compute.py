import os
import sys
import unittest

sys.path.insert(0, os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "pipeline"))
import backtest as bt
import compute

NODES = {n["id"]: n for n in bt.load_json("nodes.json")["nodes"]}
AS_OF = "2026-11-16"


def st(level=None, missing=None):
    return {"value": 1.0, "date": "2026-10-01", "level": level, "label": None, "missing_reason": missing}


def node(node_id, states, prev=None):
    return compute.node_state(NODES[node_id], states, prev, AS_OF)


def nodes_with(**status):
    return [{"id": "N%d" % i, "status": status.get("N%d" % i, "ok"), "watch_unknown": False} for i in range(1, 7)]


class NodeStateTest(unittest.TestCase):
    def test_main_triggered_even_if_aux_missing(self):
        result = node("N3", {"12": st("hit"), "10": st(missing="下载失败"), "11": st("ok")})
        self.assertEqual((result["status"], result["label"], result["watch_unknown"]), ("trigger", "衰退信号触发", False))

    def test_watch_when_all_aux_hit(self):
        self.assertEqual(node("N3", {"12": st("ok"), "10": st("hit"), "11": st("hit")})["status"], "watch")

    def test_watch_from_main_level(self):
        self.assertEqual(node("N5", {"17": st("watch")})["status"], "watch")

    def test_not_triggered(self):
        result = node("N3", {"12": st("ok"), "10": st("hit"), "11": st("ok")})
        self.assertEqual((result["status"], result["watch_unknown"]), ("ok", False))

    def test_watch_unknown_when_aux_missing(self):
        result = node("N3", {"12": st("ok"), "10": st(missing="已过期"), "11": st("hit")})
        self.assertEqual((result["status"], result["label"], result["watch_unknown"]), ("ok", "未触发", True))

    def test_main_missing_is_insufficient(self):
        result = node("N5", {"17": st(missing="已过期")})
        self.assertEqual((result["status"], result["label"]), ("insufficient", "数据不足"))

    def test_n1_missing_item_same_result_both_ways(self):
        result = node("N1", {"1": st("hit"), "2": st("hit"), "3": st(missing="历史不足 5 年")})
        self.assertEqual(result["trials"], {"as_hit": "trigger", "as_not_hit": "trigger"})
        self.assertEqual((result["status"], result["label"]), ("trigger", "已出现"))

    def test_n1_missing_item_different_results_is_insufficient(self):
        result = node("N1", {"1": st("hit"), "2": st("ok"), "3": st(missing="历史不足 5 年")})
        self.assertEqual(result["trials"], {"as_hit": "trigger", "as_not_hit": "watch"})
        self.assertEqual(result["status"], "insufficient")


class PreviousStepTest(unittest.TestCase):
    def test_previous_trigger_does_not_change_next_status(self):
        rounds = [{"start": "2026-08", "visible": "2026-09-10", "end": "2026-10", "close": None, "unknown_start": False}]
        result = node("N4", {"14": st("ok"), "16": st("ok")}, ("N3", rounds))
        self.assertEqual(result["status"], "ok")
        self.assertEqual(result["prev_hint"], {"prev": "N3", "start": "2026-08", "visible": "2026-09-10", "end": "2026-10"})


class WarningLevelTest(unittest.TestCase):
    def test_danger_when_domestic_node_triggered(self):
        result = compute.warning_level(nodes_with(N5="trigger"))
        self.assertEqual((result["level"], result["decided_by"]), ("危险", ["N5"]))

    def test_alert_when_n2_to_n4_triggered(self):
        result = compute.warning_level(nodes_with(N2="trigger", N4="trigger"))
        self.assertEqual((result["level"], result["decided_by"]), ("警惕", ["N2", "N4"]))

    def test_attention_when_n1_appeared(self):
        self.assertEqual(compute.warning_level(nodes_with(N1="trigger"))["level"], "留意")

    def test_n1_watch_alone_not_counted(self):
        self.assertEqual(compute.warning_level(nodes_with(N1="watch"))["level"], "正常")

    def test_insufficient_when_all_main_missing(self):
        result = compute.warning_level(nodes_with(**{"N%d" % i: "insufficient" for i in range(1, 7)}))
        self.assertEqual((result["level"], result["insufficient_nodes"]), ("数据不足", ["N1", "N2", "N3", "N4", "N5", "N6"]))

    def test_confirmed_warning_kept_when_other_node_insufficient(self):
        result = compute.warning_level(nodes_with(N2="trigger", N6="insufficient"))
        self.assertEqual((result["level"], result["decided_by"], result["insufficient_nodes"]), ("警惕", ["N2"], ["N6"]))

    def test_aux_missing_does_not_lower_level(self):
        n3 = node("N3", {"12": st("hit"), "10": st(missing="下载失败"), "11": st(missing="下载失败")})
        others = [n for n in nodes_with() if n["id"] != "N3"]
        self.assertEqual(compute.warning_level(others + [n3])["level"], "警惕")


class MonthTriggerTest(unittest.TestCase):
    def test_month_hit_then_recovered(self):
        item = {"frequency": "daily", "valid_days": 10, "rule": {"type": "drawdown_from_high", "lookback_obs": 3, "watch_pct": 10, "trigger_pct": 20, "record_month_trigger": True}}
        obs = [("2026-10-30", 100.0), ("2026-11-02", 100.0), ("2026-11-03", 78.0), ("2026-11-04", 92.0)]
        state = compute.auto_state(item, obs, "ok", "2026-11-05", None)
        self.assertEqual(state["measure"], 8.0)
        result = node("N2", {"5": state})
        self.assertEqual((result["status"], result["month_trigger_day"]), ("ok", "2026-11-03"))


class EventsMissingTest(unittest.TestCase):
    def test_not_classified_when_events_missing(self):
        periods = [("2020-01", False, "2020-02-01"), ("2020-02", True, "2020-03-01"), ("2020-03", False, "2020-04-01")]
        entry = bt.Backtest(AS_OF).signal_entry(NODES["N3"], "indicator", "10", "N3", None, periods, 24)
        self.assertEqual((entry["summary"], entry["unclassified_reason"]), (None, "对照数据缺失，没有分类"))
        self.assertEqual([(r["start"], r.get("category")) for r in entry["rounds"]], [("2020-02", None)])


class ExternalProbabilityTest(unittest.TestCase):
    def test_external_probability_not_used(self):
        config = bt.load_json("indicators.json")["indicators"]
        nodes = bt.load_json("nodes.json")["nodes"]
        obs = {"12": [("2026-09-01", 0.6)]}
        rows = {"13": [{"id": "13", "date": "2026-11-01", "value": 90.0, "source": "某机构", "scope": "未来 12 个月内开始衰退", "link": "https://example.com", "published": None, "note": None}]}
        with_rows = compute.evaluate(config, nodes, obs, {}, rows, {}, {}, AS_OF)
        without_rows = compute.evaluate(config, nodes, obs, {}, {}, {}, {}, AS_OF)
        self.assertEqual([n["status"] for n in with_rows["nodes"]], [n["status"] for n in without_rows["nodes"]])
        self.assertEqual(with_rows["level"], without_rows["level"])
        self.assertEqual(with_rows["level"]["level"], "警惕")


if __name__ == "__main__":
    unittest.main()
