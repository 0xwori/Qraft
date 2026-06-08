from __future__ import annotations

import importlib.util
import json
import sys
import tempfile
import unittest
from email import policy
from email.parser import BytesParser
from pathlib import Path


SCRIPT_PATH = Path(__file__).resolve().parents[1] / "scripts" / "release_advice.py"
SPEC = importlib.util.spec_from_file_location("release_advice", SCRIPT_PATH)
release_advice = importlib.util.module_from_spec(SPEC)
assert SPEC and SPEC.loader
sys.modules["release_advice"] = release_advice
SPEC.loader.exec_module(release_advice)


def attachment_names(path: Path) -> list[str]:
    message = BytesParser(policy=policy.default).parsebytes(path.read_bytes())
    return [part.get_filename() for part in message.iter_attachments()]


class ReleaseAdviceTests(unittest.TestCase):
    def test_extracts_jira_version_id(self) -> None:
        link = "https://jira.example.com/projects/LMSMMA/versions/15203"
        self.assertEqual(release_advice.extract_version_id(link), "15203")

    def test_requires_fix_version_without_version_id(self) -> None:
        with self.assertRaises(SystemExit):
            release_advice.resolve_fix_versions(None, None, [("Release 1", "https://jira.example.com/browse/LMSMMA")])

    def test_keeps_all_issue_types_from_fixture(self) -> None:
        issues = [
            {"key": "LMSMMA-1", "fields": {"issuetype": {"name": "Story"}, "summary": "Story item"}},
            {"key": "LMSMMA-2", "fields": {"issuetype": {"name": "Task"}, "summary": "Task item"}},
            {"key": "LMSMMA-3", "fields": {"issuetype": {"name": "Bug"}, "summary": "Bug item"}},
        ]
        with tempfile.TemporaryDirectory() as tmp:
            fixture = Path(tmp) / "issues.json"
            fixture.write_text(json.dumps({"issues": issues}), encoding="utf-8")
            loaded = release_advice.load_fixture_issues(fixture)
        self.assertEqual([row["key"] for row in loaded], ["LMSMMA-1", "LMSMMA-2", "LMSMMA-3"])

    def test_generates_pdf_and_eml_from_fixture(self) -> None:
        issues = [
            {
                "key": "LMSMMA-1",
                "fields": {
                    "issuetype": {"name": "Story"},
                    "status": {"name": "Ready for Release"},
                    "priority": {"name": "Medium"},
                    "summary": "Example release item & PDF-safe <summary>",
                    "description": "Adds a concise release description from Jira. Extra details should not create another PDF sentence.",
                    "assignee": {"displayName": "Example User"},
                },
            }
        ]
        with tempfile.TemporaryDirectory() as tmp:
            tmp_path = Path(tmp)
            fixture = tmp_path / "issues.json"
            fixture.write_text(json.dumps({"issues": issues}), encoding="utf-8")
            args = type(
                "Args",
                (),
                {
                    "product": "NL-Alert",
                    "version": "1.5.0",
                    "jira_version_link": "https://jira.example.com/projects/LMSMMA/versions/15203",
                    "reply_ticket": "LMSMMA-896",
                    "go_live": "ASAP after green light.",
                    "platform": ["Android=1591", "iOS=215"],
                    "fix_version": "NLAlert_Android_RC_06.26",
                    "output_dir": str(tmp_path),
                    "issues_json": str(fixture),
                    "no_open": True,
                },
            )()
            artifacts = release_advice.create_release_advice(args)
            self.assertEqual(artifacts.issue_count, 1)
            self.assertEqual(len(artifacts.pdf_paths), 1)
            self.assertTrue(artifacts.pdf_paths[0].exists())
            self.assertTrue(artifacts.eml_path.exists())
            eml_text = artifacts.eml_path.read_text(encoding="utf-8")
            self.assertIn("release-advice-recipient@example.com", eml_text)
            self.assertIn(artifacts.pdf_paths[0].name, attachment_names(artifacts.eml_path))

    def test_summary_prefers_first_description_sentence(self) -> None:
        issue = {
            "key": "LMSMMA-1",
            "fields": {
                "issuetype": {"name": "Story"},
                "summary": "Fallback title",
                "description": "First clear sentence. Second sentence should be omitted.",
            },
        }
        self.assertEqual(
            release_advice.issue_row(issue),
            ["LMSMMA-1", "Story", "Fallback title"],
        )

    def test_summary_falls_back_to_title(self) -> None:
        issue = {
            "key": "LMSMMA-1",
            "fields": {
                "issuetype": {"name": "Bug"},
                "summary": "Fix alert details",
                "description": "",
            },
        }
        self.assertEqual(
            release_advice.issue_row(issue),
            ["LMSMMA-1", "Bug", "Fix alert details"],
        )

    def test_generates_combined_platform_links(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            tmp_path = Path(tmp)
            fixture = tmp_path / "issues.json"
            fixture.write_text(json.dumps({"issues": []}), encoding="utf-8")
            args = type(
                "Args",
                (),
                {
                    "product": "NL-Alert",
                    "version": "1.5.0",
                    "jira_version_link": [
                        "Android=https://jira.example.com/projects/LMSMMA/versions/15207",
                        "iOS=https://jira.example.com/projects/LMSMMA/versions/15206",
                    ],
                    "reply_ticket": "LMSMMA-896",
                    "go_live": "ASAP after green light.",
                    "platform": ["Android=1591", "iOS=215"],
                    "fix_version": ["[Android] - NL-Alert v1.5.0", "[iOS] - NL-Alert v1.5.0"],
                    "output_dir": str(tmp_path),
                    "issues_json": str(fixture),
                    "no_open": True,
                },
            )()
            artifacts = release_advice.create_release_advice(args)
            eml_text = artifacts.eml_path.read_text(encoding="utf-8")
            self.assertIn("/versions/15207", eml_text)
            self.assertIn("/versions/15206", eml_text)
            self.assertEqual(len(artifacts.pdf_paths), 2)
            self.assertTrue(all(path.exists() for path in artifacts.pdf_paths))

    def test_empty_release_scope_still_generates_artifacts(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            tmp_path = Path(tmp)
            fixture = tmp_path / "issues.json"
            fixture.write_text(json.dumps({"issues": []}), encoding="utf-8")
            args = type(
                "Args",
                (),
                {
                    "product": "Burgernet",
                    "version": "2.0.0",
                    "jira_version_link": "https://jira.example.com/projects/LMSMMA/versions/15203",
                    "reply_ticket": "LMSMMA-900",
                    "go_live": "After green light.",
                    "platform": [],
                    "fix_version": "Burgernet_iOS_RC_06.26",
                    "output_dir": str(tmp_path),
                    "issues_json": str(fixture),
                    "no_open": True,
                },
            )()
            artifacts = release_advice.create_release_advice(args)
            self.assertEqual(artifacts.issue_count, 0)
            self.assertTrue(artifacts.pdf_paths[0].exists())
            self.assertTrue(artifacts.eml_path.exists())


if __name__ == "__main__":
    unittest.main()
