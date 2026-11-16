import os
import sys
import tempfile
import unittest
from unittest import mock

sys.path.insert(0, os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "pipeline"))
import run


def current(as_of, fetched_at, value):
    level = {"level": "正常", "decided_by": [], "insufficient_nodes": [], "watch_unknown_nodes": []}
    return {"as_of": as_of, "data_fetched_at": fetched_at, "level": level, "indicators": [{"id": "5", "value": value}]}


def history(as_of):
    return {"generated_at": as_of + "T08:00:00+08:00", "as_of": as_of, "nodes": []}


class WriteLatestTest(unittest.TestCase):
    def test_unchanged_data_does_not_rewrite_files(self):
        with tempfile.TemporaryDirectory() as tmp:
            latest = os.path.join(tmp, "latest.js")
            summary = os.path.join(tmp, "summary.json")
            with mock.patch.object(run, "LATEST_PATH", latest), mock.patch.object(run, "SUMMARY_PATH", summary):
                self.assertTrue(run.write_latest(current("2026-11-15", "2026-11-15T08:00:00+08:00", 1.5), history("2026-11-15")))
                with open(latest, encoding="utf-8") as f:
                    before = (f.read(), os.stat(latest).st_mtime_ns, os.stat(summary).st_mtime_ns)
                self.assertFalse(run.write_latest(current("2026-11-16", "2026-11-16T08:00:00+08:00", 1.5), history("2026-11-16")))
                with open(latest, encoding="utf-8") as f:
                    self.assertEqual((f.read(), os.stat(latest).st_mtime_ns, os.stat(summary).st_mtime_ns), before)
                self.assertTrue(run.write_latest(current("2026-11-16", "2026-11-16T08:00:00+08:00", 2.5), history("2026-11-16")))


if __name__ == "__main__":
    unittest.main()
