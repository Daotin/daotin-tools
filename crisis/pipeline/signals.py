import calendar
import datetime
import operator

OPS = {"<": operator.lt, "<=": operator.le, ">": operator.gt, ">=": operator.ge}
ROUND_END_PERIODS = {"monthly": 6, "quarterly": 2}
CATEGORIES = ["提前命中", "同期或滞后确认", "误报", "待观察"]
DIGITS = 6


def parse_day(text):
    return datetime.date(int(text[:4]), int(text[5:7]), int(text[8:10]))


def month_index(key):
    return int(key[:4]) * 12 + int(key[5:7]) - 1


def key_from_index(index):
    return "%04d-%02d" % (index // 12, index % 12 + 1)


def months_between(start_key, end_key):
    return month_index(end_key[:7]) - month_index(start_key[:7])


def add_months(day, n):
    index = day.year * 12 + day.month - 1 + n
    year, month = index // 12, index % 12 + 1
    return datetime.date(year, month, min(day.day, calendar.monthrange(year, month)[1]))


def period_step(frequency):
    return 3 if frequency == "quarterly" else 1


def period_end(day, frequency):
    if frequency in ("monthly", "quarterly"):
        last = add_months(day.replace(day=1), period_step(frequency) - 1)
        return last.replace(day=calendar.monthrange(last.year, last.month)[1])
    return day


def visible_date(date_text, item):
    day = parse_day(date_text)
    lag = item.get("publish_lag_days_by_month", {}).get(str(day.month), item["publish_lag_days"])
    return (period_end(day, item["frequency"]) + datetime.timedelta(days=lag)).isoformat()


def back_index(dates, frequency):
    if frequency not in ("monthly", "quarterly"):
        return lambda i, k: i - k if i >= k else None
    step = period_step(frequency)
    position = {month_index(d): j for j, d in enumerate(dates)}
    return lambda i, k: position.get(month_index(dates[i]) - k * step)


def gap_dates(raw, obs):
    if not obs:
        return []
    kept = {d for d, _ in obs}
    return [d for d, _ in raw if d >= obs[0][0] and d not in kept]


def apply_transform(obs, ops, frequency):
    dates = [d for d, _ in obs]
    values = [v for _, v in obs]
    for op in ops:
        kind = op["op"]
        back = back_index(dates, None if kind == "pct_change_obs" else frequency)
        result = []
        for i, value in enumerate(values):
            if value is None:
                result.append(None)
                continue
            if kind in ("yoy_pct", "yoy_diff", "pct_change_obs"):
                j = back(i, op["n"] if kind == "pct_change_obs" else op["periods"])
                base = None if j is None else values[j]
                if base is None:
                    result.append(None)
                elif kind == "yoy_diff":
                    result.append(round(value - base, DIGITS))
                else:
                    result.append(round((value / base - 1) * 100, DIGITS))
            elif kind in ("rolling_mean", "rolling_sum"):
                n = op["n"]
                window = [None if j is None else values[j] for j in (back(i, k) for k in range(n - 1, -1, -1))]
                if any(v is None for v in window):
                    result.append(None)
                else:
                    total = sum(window)
                    result.append(round(total / n if kind == "rolling_mean" else total, DIGITS))
            elif kind == "offset":
                result.append(round(value + op["value"], DIGITS))
            else:
                raise ValueError("不认识的预处理 %s" % kind)
        values = result
    return [(d, v) for d, v in zip(dates, values) if v is not None]


def extreme_change(window, kind):
    if kind == "drawdown_from_high":
        high = max(window)
        return round((high - window[-1]) / high * 100, DIGITS)
    low = min(window)
    return round((window[-1] - low) / low * 100, DIGITS)


def rule_levels(obs, item, rule=None):
    rule = rule or item["rule"]
    kind = rule["type"]
    values = [v for _, v in obs]
    back = back_index([d for d, _ in obs], item["frequency"])
    levels = []
    if kind == "threshold":
        skip = set(rule.get("skip_months", []))
        for d, v in obs:
            if parse_day(d).month in skip:
                levels.append(None)
            else:
                levels.append("hit" if OPS[rule["op"]](v, rule["value"]) else "ok")
    elif kind == "percentile":
        vis = [visible_date(d, item) for d, _ in obs]
        first = parse_day(obs[0][0]) if obs else None
        for i, (d, v) in enumerate(obs):
            day = parse_day(d)
            if day < add_months(first, 12 * rule["min_history_years"]):
                levels.append(None)
                continue
            history = [values[j] for j in range(len(obs)) if vis[j] <= vis[i]]
            if rule["side"] == "high":
                share = sum(1 for h in history if h >= v) / len(history)
            else:
                share = sum(1 for h in history if h <= v) / len(history)
            levels.append("hit" if share <= rule["pct"] / 100 else "ok")
    elif kind in ("drawdown_from_high", "rise_from_low"):
        n = rule["lookback_obs"]
        for i in range(len(values)):
            if i < n - 1:
                levels.append(None)
                continue
            change = extreme_change(values[i - n + 1:i + 1], kind)
            if kind == "drawdown_from_high":
                levels.append("trigger" if change >= rule["trigger_pct"] else "watch" if change >= rule["watch_pct"] else "ok")
            else:
                levels.append("hit" if change >= rule["pct"] else "ok")
    elif kind == "consecutive":
        cond = rule["cond"]
        watch = rule.get("watch_cond")
        streak = 0
        for i, v in enumerate(values):
            if back(i, 1) is None:
                streak = 0
            streak = streak + 1 if OPS[cond["op"]](v, cond["value"]) else 0
            if streak >= rule["trigger_n"]:
                levels.append("trigger")
            elif watch and OPS[watch["op"]](v, watch["value"]):
                levels.append("watch")
            else:
                levels.append("ok")
    elif kind == "compare_same_period":
        n = rule["periods"]
        trigger = rule["trigger"]
        for i, v in enumerate(values):
            j = back(i, n)
            if j is None:
                levels.append(None)
            elif OPS[trigger["op"]](v, trigger["value"]):
                levels.append("trigger")
            elif round(values[j] - v, DIGITS) >= rule["watch_drop"]:
                levels.append("watch")
            else:
                levels.append("ok")
    else:
        raise ValueError("规则类型 %s 不做历史判断" % kind)
    return [(d, level) for (d, _), level in zip(obs, levels)]


def comparison_gaps(levels, rule):
    if rule["type"] != "compare_same_period":
        return []
    judged = [i for i, (_, level) in enumerate(levels) if level is not None]
    return [d for d, level in levels[judged[0]:] if level is None] if judged else []


def condition_flags(levels, cond):
    wanted = {"hit": ("hit",), "trigger": ("hit", "trigger"), "watch": ("watch",)}[cond]
    return [(d, None if level is None else level in wanted) for d, level in levels]


def period_flags(flags, item):
    frequency = item["frequency"]
    groups = {}
    for d, flag in flags:
        groups.setdefault(d[:7], []).append((flag, visible_date(d, item)))
    if not groups:
        return [], []
    step = period_step(frequency)
    keys = sorted(groups)
    result = []
    missing = []
    for index in range(month_index(keys[0]), month_index(keys[-1]) + 1, step):
        key = key_from_index(index)
        entries = groups.get(key)
        if entries is None:
            missing.append(key)
            result.append((key, None, None))
            continue
        hits = [vis for flag, vis in entries if flag]
        known = [vis for flag, vis in entries if flag is not None]
        if hits:
            result.append((key, True, min(hits)))
        elif known:
            result.append((key, False, max(known)))
        else:
            result.append((key, None, None))
    return result, missing


def expand_quarters(periods):
    result = []
    for key, flag, vis in periods:
        for k in range(3):
            result.append((key_from_index(month_index(key) + k), flag, vis))
    return result


def negate(periods):
    return [(key, None if flag is None else not flag, vis) for key, flag, vis in periods]


def exclude(periods, other):
    hit = {key for key, flag, _ in other if flag}
    return [(key, False if flag and key in hit else flag, vis) for key, flag, vis in periods]


def all_of(flags):
    if any(f is None for f in flags):
        return None
    return all(flags)


def count_at_least(n):
    def judge(flags):
        known = sum(1 for f in flags if f is True)
        unknown = sum(1 for f in flags if f is None)
        if known >= n:
            return True
        if known + unknown < n:
            return False
        return None
    return judge


def combine(period_lists, judge):
    maps = [{key: (flag, vis) for key, flag, vis in periods} for periods in period_lists]
    keys = [k for m in maps for k in m]
    if not keys:
        return []
    result = []
    for index in range(month_index(min(keys)), month_index(max(keys)) + 1):
        key = key_from_index(index)
        parts = [m.get(key, (None, None)) for m in maps]
        flag = judge([p[0] for p in parts])
        vis = max([p[1] for p in parts if p[0] is not None], default=None)
        result.append((key, flag, vis if flag is not None else None))
    return result


def judged_range(periods):
    keys = [key for key, flag, _ in periods if flag is not None]
    return (keys[0], keys[-1]) if keys else (None, None)


def find_rounds(periods, end_after):
    rounds = []
    current = None
    misses = 0
    judged = False
    for key, flag, vis in periods:
        if flag is None:
            continue
        if flag:
            if current is None:
                current = {"start": key, "visible": vis, "end": key, "close": None, "unknown_start": not judged}
                rounds.append(current)
            else:
                current["end"] = key
            misses = 0
        elif current is not None:
            misses += 1
            if misses >= end_after:
                current["close"] = key
                current = None
                misses = 0
        judged = True
    return rounds


def in_progress(rnd, key):
    return rnd["start"] <= key[:7] and (rnd["close"] is None or key[:7] < rnd["close"])


def in_progress_on(rnd, day):
    return rnd["start"] + "-01" <= day and (rnd["close"] is None or day < rnd["close"] + "-01")


def active_round(rounds, key):
    for rnd in rounds:
        if in_progress(rnd, key):
            return rnd
    return None


def classify(rnd, events, window_months, as_of):
    if rnd["unknown_start"]:
        return {"category": None}
    start, vis = rnd["start"], rnd["visible"]
    for event in events:
        if in_progress(event, start) or in_progress_on(event, vis):
            return {"category": "同期或滞后确认", "event_start": event["start"], "lag_months": months_between(event["start"], vis)}
    for event in events:
        if event["start"] + "-01" > vis and months_between(vis, event["start"]) <= window_months:
            return {"category": "提前命中", "event_start": event["start"], "lead_months": months_between(vis, event["start"])}
    if as_of < add_months(parse_day(vis), window_months).isoformat():
        return {"category": "待观察"}
    return {"category": "误报"}


def summarize(rounds):
    summary = {c: 0 for c in CATEGORIES}
    summary["起点未知"] = 0
    for rnd in rounds:
        summary[rnd["category"] or "起点未知"] += 1
    return summary


def case_label(prev_start, next_rounds, next_range, as_of, window_months=24):
    active = active_round(next_rounds, prev_start)
    if active is not None and active["start"] < prev_start:
        return {"label": "下一步先触发", "next_start": active["start"], "next_visible": active["visible"], "months": months_between(active["start"], prev_start)}
    first, last = next_range
    if first is None or first > prev_start:
        return {"label": "数据不足"}
    for rnd in next_rounds:
        if rnd["start"] >= prev_start and months_between(prev_start, rnd["start"]) <= window_months:
            return {"label": "之后触发", "next_start": rnd["start"], "next_visible": rnd["visible"], "months": months_between(prev_start, rnd["start"])}
    if months_between(prev_start, as_of) < window_months:
        return {"label": "待观察"}
    if months_between(prev_start, last) < window_months:
        return {"label": "数据不足"}
    return {"label": "未触发"}
