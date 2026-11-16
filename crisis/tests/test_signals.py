import os
import sys
import unittest

sys.path.insert(0, os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "pipeline"))
import signals as sg

MONTHLY = {"frequency": "monthly", "publish_lag_days": 10}


def months(start, count):
    return [sg.key_from_index(sg.month_index(start) + i) for i in range(count)]


def monthly_periods(start, flags):
    return [(k, f, None if f is None else k + "-15") for k, f in zip(months(start, len(flags)), flags)]


def levels(obs, item, rule):
    return [level for _, level in sg.rule_levels(obs, item, rule)]


class RuleTest(unittest.TestCase):
    def test_threshold_skips_listed_months(self):
        obs = [("2020-12-01", -1.0), ("2021-01-01", -2.0), ("2021-02-01", 1.0)]
        rule = {"type": "threshold", "op": "<", "value": 0, "skip_months": [1]}
        self.assertEqual(levels(obs, MONTHLY, rule), ["hit", None, "ok"])

    def test_percentile_uses_visible_history_and_needs_min_history(self):
        obs = [(k + "-01", float(i + 1)) for i, k in enumerate(months("2000-01", 11))]
        obs += [("2000-12-01", 100.0), ("2001-01-01", 50.0)]
        item = {"frequency": "monthly", "publish_lag_days": 10, "publish_lag_days_by_month": {"12": 100}}
        rule = {"type": "percentile", "side": "high", "pct": 10, "min_history_years": 1}
        result = levels(obs, item, rule)
        self.assertEqual(result[11], None)
        self.assertEqual(result[12], "hit")
        self.assertEqual(levels(obs, MONTHLY, rule)[12], "ok")

    def test_drawdown_from_high(self):
        obs = [("2020-01-0%d" % (i + 1), v) for i, v in enumerate([100.0, 90.0, 85.0, 70.0, 95.0])]
        rule = {"type": "drawdown_from_high", "lookback_obs": 3, "watch_pct": 10, "trigger_pct": 20}
        self.assertEqual(levels(obs, {"frequency": "daily", "publish_lag_days": 1}, rule), [None, None, "watch", "trigger", "ok"])

    def test_rise_from_low(self):
        obs = [("2020-01-0%d" % (i + 1), v) for i, v in enumerate([100.0, 110.0, 125.0, 130.0])]
        rule = {"type": "rise_from_low", "lookback_obs": 3, "pct": 20}
        self.assertEqual(levels(obs, {"frequency": "weekly", "publish_lag_days": 7}, rule), [None, None, "hit", "ok"])

    def test_consecutive(self):
        obs = [(k + "-01", v) for k, v in zip(months("2022-01", 7), [0.1, 0.3, 0.6, 0.4, 0.5, 0.5, 0.2])]
        rule = {"type": "consecutive", "cond": {"op": ">=", "value": 0.5}, "trigger_n": 2, "watch_cond": {"op": ">=", "value": 0.3}}
        self.assertEqual(levels(obs, MONTHLY, rule), ["ok", "watch", "watch", "watch", "watch", "trigger", "ok"])

    def test_consecutive_restarts_after_missing_month(self):
        obs = [("2022-01-01", 0.1), ("2022-02-01", 0.6), ("2022-04-01", 0.6), ("2022-05-01", 0.6)]
        rule = {"type": "consecutive", "cond": {"op": ">=", "value": 0.5}, "trigger_n": 2, "watch_cond": {"op": ">=", "value": 0.3}}
        self.assertEqual(levels(obs, MONTHLY, rule), ["ok", "watch", "watch", "trigger"])

    def test_compare_same_period(self):
        values = [8.0, 8.0, 8.0, 8.1, 7.0, 6.0, 2.9, 5.0, -1.0]
        obs = [("%d-%02d-01" % (2020 + i // 4, i % 4 * 3 + 1), v) for i, v in enumerate(values)]
        rule = {"type": "compare_same_period", "periods": 4, "watch_drop": 2, "trigger": {"op": "<", "value": 0}}
        self.assertEqual(levels(obs, {"frequency": "quarterly", "publish_lag_days": 25}, rule), [None] * 4 + ["ok", "watch", "watch", "watch", "trigger"])

    def test_daily_month_hit_if_any_observation_hits(self):
        item = {"frequency": "daily", "publish_lag_days": 1}
        flags = [("2020-01-02", False), ("2020-01-15", True), ("2020-01-20", True), ("2020-03-02", False)]
        periods, missing = sg.period_flags(flags, item)
        self.assertEqual(periods, [("2020-01", True, "2020-01-16"), ("2020-02", None, None), ("2020-03", False, "2020-03-03")])
        self.assertEqual(missing, ["2020-02"])


class TransformTest(unittest.TestCase):
    def test_yoy_has_no_value_when_same_month_last_year_missing(self):
        raw = [(k + "-01", 100.0) for k in months("2024-01", 12)]
        raw += [(k + "-01", 110.0) for k in months("2025-01", 15) if k != "2025-03"]
        result = dict(sg.apply_transform(raw, [{"op": "yoy_pct", "periods": 12}], "monthly"))
        self.assertEqual((result["2025-02-01"], result["2026-01-01"], result["2026-02-01"]), (10.0, 0.0, 0.0))
        self.assertNotIn("2026-03-01", result)


class RoundTest(unittest.TestCase):
    def test_start_merge_and_end_after_six_months(self):
        flags = [False, True, False, False, True] + [False] * 6 + [True]
        rounds = sg.find_rounds(monthly_periods("2020-01", flags), 6)
        self.assertEqual([(r["start"], r["end"], r["close"]) for r in rounds], [("2020-02", "2020-05", "2020-11"), ("2020-12", "2020-12", None)])

    def test_skipped_months_neither_satisfy_nor_break(self):
        flags = [True, None, True, False, False, False, None, False, False, False]
        rounds = sg.find_rounds(monthly_periods("2020-01", flags), 6)
        self.assertEqual([(r["start"], r["end"], r["close"]) for r in rounds], [("2020-01", "2020-03", "2020-10")])

    def test_unknown_start_when_first_judged_period_satisfies(self):
        self.assertTrue(sg.find_rounds(monthly_periods("2020-01", [None, True, False]), 6)[0]["unknown_start"])
        self.assertFalse(sg.find_rounds(monthly_periods("2020-01", [False, True]), 6)[0]["unknown_start"])

    def test_quarterly_round_ends_after_two_periods(self):
        periods = [(k, f, k + "-15") for k, f in zip(["2020-01", "2020-04", "2020-07", "2020-10", "2021-01"], [True, False, True, False, False])]
        rounds = sg.find_rounds(periods, 2)
        self.assertEqual([(r["start"], r["end"], r["close"]) for r in rounds], [("2020-01", "2020-07", "2021-01")])


def rnd(start, visible, unknown=False):
    return {"start": start, "visible": visible, "end": start, "close": None, "unknown_start": unknown}


EVENTS = [{"start": "2001-04", "end": "2001-11", "close": "2001-12"}]
AS_OF = "2026-11-16"


class ClassifyTest(unittest.TestCase):
    def test_early_hit_with_lead(self):
        result = sg.classify(rnd("2000-06", "2000-07-10"), EVENTS, 12, AS_OF)
        self.assertEqual((result["category"], result["lead_months"]), ("提前命中", 9))

    def test_window_12_and_24(self):
        signal = rnd("1999-06", "1999-07-10")
        self.assertEqual(sg.classify(signal, EVENTS, 12, AS_OF)["category"], "误报")
        result = sg.classify(signal, EVENTS, 24, AS_OF)
        self.assertEqual((result["category"], result["lead_months"]), ("提前命中", 21))

    def test_concurrent_when_data_month_in_event(self):
        result = sg.classify(rnd("2001-06", "2001-07-10"), EVENTS, 12, AS_OF)
        self.assertEqual((result["category"], result["lag_months"]), ("同期或滞后确认", 3))

    def test_concurrent_when_event_in_progress_on_visible_date(self):
        result = sg.classify(rnd("2001-03", "2001-04-10"), EVENTS, 12, AS_OF)
        self.assertEqual((result["category"], result["lag_months"]), ("同期或滞后确认", 0))

    def test_data_month_in_event_but_visible_after_event_end(self):
        events = [{"start": "2020-03", "end": "2020-04", "close": "2020-05"}]
        result = sg.classify(rnd("2020-04", "2020-05-10"), events, 12, AS_OF)
        self.assertEqual((result["category"], result["lag_months"]), ("同期或滞后确认", 2))

    def test_pending_is_not_false_alarm(self):
        signal = rnd("2026-02", "2026-03-10")
        self.assertEqual(sg.classify(signal, EVENTS, 12, AS_OF)["category"], "待观察")
        self.assertEqual(sg.classify(signal, EVENTS, 12, "2027-03-10")["category"], "误报")

    def test_unknown_start_not_classified(self):
        rounds = [dict(r, **sg.classify(r, EVENTS, 12, AS_OF)) for r in [rnd("1990-01", "1990-02-10", True), rnd("2000-06", "2000-07-10")]]
        self.assertEqual(sg.summarize(rounds), {"提前命中": 1, "同期或滞后确认": 0, "误报": 0, "待观察": 0, "起点未知": 1})


class VisibleDateTest(unittest.TestCase):
    def test_period_end_plus_lag(self):
        self.assertEqual(sg.visible_date("2024-07-01", MONTHLY), "2024-08-10")
        self.assertEqual(sg.visible_date("2024-04-01", {"frequency": "quarterly", "publish_lag_days": 25}), "2024-07-25")
        self.assertEqual(sg.visible_date("2024-02-29", {"frequency": "daily", "publish_lag_days": 1}), "2024-03-01")
        self.assertEqual(sg.visible_date("2024-11-02", {"frequency": "weekly", "publish_lag_days": 7}), "2024-11-09")

    def test_lag_override_by_data_month(self):
        item = {"frequency": "monthly", "publish_lag_days": 20, "publish_lag_days_by_month": {"1": 45}}
        self.assertEqual(sg.visible_date("2024-01-01", item), "2024-03-16")
        self.assertEqual(sg.visible_date("2024-02-01", item), "2024-03-20")

    def test_watch_month_with_trigger_day_is_not_watch(self):
        watch = monthly_periods("2020-01", [True, True, False, None])
        trigger = monthly_periods("2020-01", [False, True, True, None])
        self.assertEqual([f for _, f, _ in sg.exclude(watch, trigger)], [True, False, False, None])


NEXT_ROUNDS = [
    {"start": "2019-02", "visible": "2019-03-20", "end": "2020-06", "close": "2020-12", "unknown_start": False},
    {"start": "2022-11", "visible": "2022-12-20", "end": "2023-10", "close": "2024-04", "unknown_start": False},
]
NEXT_RANGE = ("1993-03", "2026-10")


class CaseTest(unittest.TestCase):
    def label(self, prev_start, next_range=NEXT_RANGE):
        return sg.case_label(prev_start, NEXT_ROUNDS, next_range, AS_OF, 24)

    def test_next_triggered_first(self):
        result = self.label("2020-04")
        self.assertEqual((result["label"], result["next_start"], result["months"]), ("下一步先触发", "2019-02", 14))

    def test_triggered_after_including_same_month(self):
        self.assertEqual((self.label("2021-03")["label"], self.label("2021-03")["months"]), ("之后触发", 20))
        self.assertEqual((self.label("2022-11")["label"], self.label("2022-11")["months"]), ("之后触发", 0))

    def test_not_triggered(self):
        self.assertEqual(self.label("2016-01")["label"], "未触发")

    def test_pending(self):
        self.assertEqual(self.label("2025-06")["label"], "待观察")

    def test_insufficient_data(self):
        self.assertEqual(self.label("2009-02", ("2019-01", "2026-10"))["label"], "数据不足")
        self.assertEqual(self.label("2016-01", ("1993-03", "2017-06"))["label"], "数据不足")

    def test_hint_stays_until_round_ends(self):
        self.assertIs(sg.active_round(NEXT_ROUNDS, "2020-10"), NEXT_ROUNDS[0])
        self.assertIsNone(sg.active_round(NEXT_ROUNDS, "2020-12"))


if __name__ == "__main__":
    unittest.main()
