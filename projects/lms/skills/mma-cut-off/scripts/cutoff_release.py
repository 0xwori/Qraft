#!/usr/bin/env python3
"""Monthly LMS Cut-Off helper for Jira release batches.

Default mode is dry-run. Use --execute only after reviewing the output.
"""

from __future__ import annotations

import argparse
import json
import os
import ssl
import sys
from dataclasses import dataclass
from pathlib import Path
from typing import Any
from urllib.error import HTTPError, URLError
from urllib.parse import quote
from urllib.request import Request, urlopen


LMS_ROOT = Path(__file__).resolve().parents[3]
ENV_PATH = LMS_ROOT / "mcp" / "jira-mcp-codex" / ".env"
PROJECT_KEY = "LMSMMA"

DEFAULT_APPS = ["112NL", "Burgernet", "NLAlert"]
DEFAULT_PLATFORMS = ["iOS", "Android"]

APP_ALIASES = {
    "112NL": ["112nl", "112"],
    "Burgernet": ["burgernet"],
    "NLAlert": ["nlalert", "nl-alert", "nl alert"],
}

PLATFORM_ALIASES = {
    "iOS": ["ios", "iphone", "ipad"],
    "Android": ["android"],
}


@dataclass(frozen=True)
class Batch:
    app: str
    platform: str
    version_name: str


@dataclass
class ClassifiedIssue:
    key: str
    summary: str
    status: str
    app: str | None
    platform: str | None
    reasons: list[str]
    raw: dict[str, Any]


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Prepare or execute monthly LMS Cut-Off Jira version changes.")
    parser.add_argument("--month", required=True, help="Two-digit month, for example 06.")
    parser.add_argument("--year", required=True, help="Two-digit year, for example 26.")
    parser.add_argument("--apps", default=",".join(DEFAULT_APPS), help="Comma-separated apps. Default: 112NL,Burgernet,NLAlert.")
    parser.add_argument("--platforms", default=",".join(DEFAULT_PLATFORMS), help="Comma-separated platforms. Default: iOS,Android.")
    parser.add_argument("--create-release-task", action="store_true", help="Prepare/create a Jira Task in the active sprint with release notes and checklist.")
    parser.add_argument("--task-version", default="XXX", help="Release version to place in the Jira task. Default: XXX.")
    parser.add_argument("--release-date", default="XXX", help="Release date to place in the Jira task. Default: XXX.")
    parser.add_argument("--client-contact", default="[CLIENT_CONTACT]", help="Client contact person for the Jira task.")
    parser.add_argument("--tech-lead", default="[TECH_LEAD]", help="Tech lead for the Jira task.")
    parser.add_argument("--developers", default="[DEVELOPERS]", help="Developers for the Jira task.")
    parser.add_argument("--ios-ticket-url", default="https://jira.example.com/projects/LMSMMA/versions/IOS_VERSION_ID", help="iOS Jira release notes URL.")
    parser.add_argument("--android-ticket-url", default="https://jira.example.com/projects/LMSMMA/versions/ANDROID_VERSION_ID", help="Android Jira release notes URL.")
    parser.add_argument("--execute", action="store_true", help="Create missing versions and update Jira issues.")
    return parser.parse_args()


def validate_period(month: str, year: str) -> tuple[str, str]:
    if not (month.isdigit() and len(month) == 2 and 1 <= int(month) <= 12):
        raise SystemExit("--month must be a two-digit month, for example 06.")
    if not (year.isdigit() and len(year) == 2):
        raise SystemExit("--year must be a two-digit year, for example 26.")
    return month, year


def parse_list(value: str, allowed: list[str], option_name: str) -> list[str]:
    items = [item.strip() for item in value.split(",") if item.strip()]
    unknown = [item for item in items if item not in allowed]
    if unknown:
        raise SystemExit(f"{option_name} contains unsupported values: {', '.join(unknown)}")
    return items


def read_env(path: Path) -> dict[str, str]:
    if not path.exists():
        raise SystemExit(f"Jira .env not found at {path}")

    values: dict[str, str] = {}
    for line in path.read_text(encoding="utf-8").splitlines():
        stripped = line.strip()
        if not stripped or stripped.startswith("#") or "=" not in stripped:
            continue
        key, raw_value = stripped.split("=", 1)
        value = raw_value.strip()
        if (value.startswith('"') and value.endswith('"')) or (value.startswith("'") and value.endswith("'")):
            value = value[1:-1]
        values[key.strip()] = value
    return values


class JiraClient:
    def __init__(self, env: dict[str, str]) -> None:
        jira_url = env.get("JIRA_URL") or env.get("JIRA_BASE_URL")
        token = env.get("JIRA_PAT") or env.get("ATLASSIAN_PAT")
        if not jira_url:
            raise SystemExit("JIRA_URL or JIRA_BASE_URL is missing in Jira .env")
        if not token:
            raise SystemExit("JIRA_PAT or ATLASSIAN_PAT is missing in Jira .env")

        self.base_url = jira_url.rstrip("/")
        self.token = token
        self.api_version = env.get("JIRA_API_VERSION", "2")
        self.context = None
        if env.get("VERIFY_TLS", "true").lower() == "false":
            self.context = ssl._create_unverified_context()

    def request(self, method: str, route: str, body: dict[str, Any] | None = None) -> Any:
        data = json.dumps(body).encode("utf-8") if body is not None else None
        request = Request(
            f"{self.base_url}{route}",
            data=data,
            method=method,
            headers={
                "Accept": "application/json",
                "Authorization": f"Bearer {self.token}",
                **({"Content-Type": "application/json"} if body is not None else {}),
            },
        )
        try:
            with urlopen(request, timeout=30, context=self.context) as response:
                payload = response.read().decode("utf-8")
        except HTTPError as exc:
            details = exc.read().decode("utf-8", errors="replace")
            raise RuntimeError(f"{method} {route} failed with HTTP {exc.code}: {details}") from exc
        except URLError as exc:
            raise RuntimeError(f"{method} {route} failed: {exc.reason}") from exc

        return json.loads(payload) if payload.strip() else None

    @property
    def api(self) -> str:
        return f"/rest/api/{self.api_version}"

    def search_all(self, jql: str, fields: list[str]) -> list[dict[str, Any]]:
        issues: list[dict[str, Any]] = []
        start_at = 0
        while True:
            response = self.request(
                "POST",
                f"{self.api}/search",
                {
                    "jql": jql,
                    "fields": fields,
                    "startAt": start_at,
                    "maxResults": 100,
                },
            )
            page = response.get("issues", [])
            issues.extend(page)
            start_at += len(page)
            if start_at >= response.get("total", 0) or not page:
                return issues

    def project_versions(self, project_key: str) -> set[str]:
        versions = self.request("GET", f"{self.api}/project/{quote(project_key)}/versions")
        return {version["name"] for version in versions}

    def create_version(self, project_key: str, name: str) -> None:
        self.request(
            "POST",
            f"{self.api}/version",
            {"name": name, "project": project_key, "archived": False, "released": False},
        )

    def set_issue_fix_version(self, issue_key: str, version_name: str) -> None:
        self.request(
            "PUT",
            f"{self.api}/issue/{quote(issue_key)}",
            {"fields": {"fixVersions": [{"name": version_name}]}},
        )

    def fields(self) -> list[dict[str, Any]]:
        return self.request("GET", f"{self.api}/field")

    def create_issue(self, fields: dict[str, Any]) -> dict[str, Any]:
        return self.request("POST", f"{self.api}/issue", {"fields": fields})

    def agile_boards(self, project_key: str) -> list[dict[str, Any]]:
        response = self.request("GET", f"/rest/agile/1.0/board?projectKeyOrId={quote(project_key)}")
        return response.get("values", [])

    def active_sprints(self, board_id: int) -> list[dict[str, Any]]:
        response = self.request("GET", f"/rest/agile/1.0/board/{board_id}/sprint?state=active")
        return response.get("values", [])

    def active_sprint_for_project(self, project_key: str) -> tuple[dict[str, Any], dict[str, Any]] | None:
        for board in self.agile_boards(project_key):
            for sprint in self.active_sprints(board["id"]):
                return board, sprint
        return None

    def add_issue_to_sprint(self, sprint_id: int, issue_key: str) -> None:
        self.request("POST", f"/rest/agile/1.0/sprint/{sprint_id}/issue", {"issues": [issue_key]})


def build_batches(apps: list[str], platforms: list[str], month: str, year: str) -> list[Batch]:
    return [
        Batch(app=app, platform=platform, version_name=f"{app}_{platform}_RC_{month}.{year}")
        for app in apps
        for platform in platforms
    ]


def issue_text(issue: dict[str, Any]) -> str:
    fields = issue.get("fields", {})
    platform = fields.get("customfield_10801")
    platform_value = platform.get("value") if isinstance(platform, dict) else platform
    parts = [
        fields.get("summary", ""),
        platform_value or "",
        " ".join(fields.get("labels") or []),
        " ".join(version.get("name", "") for version in fields.get("fixVersions") or []),
    ]
    return " ".join(str(part).lower() for part in parts if part)


def exact_alias_match(text: str, alias: str) -> bool:
    lowered = text.lower()
    if alias == "112":
        return "112" in lowered
    return alias in lowered


def matching_values(text: str, aliases_by_value: dict[str, list[str]]) -> list[str]:
    matches: list[str] = []
    for value, aliases in aliases_by_value.items():
        if any(exact_alias_match(text, alias) for alias in aliases):
            matches.append(value)
    return matches


def classify_issue(issue: dict[str, Any]) -> ClassifiedIssue:
    fields = issue.get("fields", {})
    text = issue_text(issue)
    app_matches = matching_values(text, APP_ALIASES)
    platform_matches = matching_values(text, PLATFORM_ALIASES)

    reasons: list[str] = []
    app = app_matches[0] if len(app_matches) == 1 else None
    platform = platform_matches[0] if len(platform_matches) == 1 else None
    if not app_matches:
        reasons.append("no clear app match")
    if len(app_matches) > 1:
        reasons.append(f"multiple app matches: {', '.join(app_matches)}")
    if not platform_matches:
        reasons.append("no clear platform match")
    if len(platform_matches) > 1:
        reasons.append(f"multiple platform matches: {', '.join(platform_matches)}")

    return ClassifiedIssue(
        key=issue["key"],
        summary=fields.get("summary", ""),
        status=(fields.get("status") or {}).get("name", ""),
        app=app,
        platform=platform,
        reasons=reasons,
        raw=issue,
    )


def eligible_jql(project_key: str) -> str:
    return (
        f'project = {project_key} '
        'AND fixVersion = "NEXT" '
        'AND (status in ("Ready for Release", "Released") OR statusCategory = Done) '
        "ORDER BY key ASC"
    )


def print_plan(
    batches: list[Batch],
    existing_versions: set[str],
    classified: list[ClassifiedIssue],
    execute: bool,
) -> None:
    print("MMA Cut-Off")
    print(f"Mode: {'EXECUTE' if execute else 'DRY-RUN'}")
    print("")

    by_batch: dict[tuple[str, str], list[ClassifiedIssue]] = {
        (batch.app, batch.platform): [] for batch in batches
    }
    manual_review: list[ClassifiedIssue] = []
    selected_apps = {batch.app for batch in batches}
    selected_platforms = {batch.platform for batch in batches}

    for issue in classified:
        if issue.reasons or issue.app not in selected_apps or issue.platform not in selected_platforms:
            manual_review.append(issue)
            continue
        by_batch[(issue.app, issue.platform)].append(issue)

    for batch in batches:
        issues = by_batch[(batch.app, batch.platform)]
        version_state = "exists" if batch.version_name in existing_versions else "missing"
        print(f"## {batch.version_name} ({version_state})")
        print(f"Tickets: {len(issues)}")
        for issue in issues:
            print(f"- {issue.key} [{issue.status}] {issue.summary}")
        print("")

    print("## Manual review")
    print(f"Tickets: {len(manual_review)}")
    for issue in manual_review:
        reason = "; ".join(issue.reasons) if issue.reasons else "outside selected app/platform"
        print(f"- {issue.key} [{issue.status}] {reason}: {issue.summary}")


def execute_changes(
    jira: JiraClient,
    batches: list[Batch],
    existing_versions: set[str],
    classified: list[ClassifiedIssue],
) -> None:
    selected_apps = {batch.app for batch in batches}
    selected_platforms = {batch.platform for batch in batches}
    version_by_target = {(batch.app, batch.platform): batch.version_name for batch in batches}

    for batch in batches:
        if batch.version_name not in existing_versions:
            print(f"Creating version {batch.version_name}")
            jira.create_version(PROJECT_KEY, batch.version_name)

    for issue in classified:
        if issue.reasons or issue.app not in selected_apps or issue.platform not in selected_platforms:
            continue
        version_name = version_by_target[(issue.app, issue.platform)]
        print(f"Updating {issue.key} -> {version_name}")
        jira.set_issue_fix_version(issue.key, version_name)


def release_task_summary(task_version: str) -> str:
    return f"Release checklist and advice - {task_version}"


def release_task_description(args: argparse.Namespace) -> str:
    version = args.task_version
    return f"""h2. Release information

||Field||Value||
|Version|{version}|
|Release date|{args.release_date}|
|Client contact person|{args.client_contact}|
|Tech Lead|{args.tech_lead}|
|Developers|{args.developers}|

h2. Release notes

h3. What's New in {version}

This update introduces Try Me Out, a safe way to practice how 112NL works without calling the real emergency number. You can now walk through a simulated call and chat flow to see how contacting 112 would look and feel.

h3. Wat is nieuw in {version}

Deze update bevat Probeer het uit, een veilige manier om te oefenen met 112NL zonder het echte noodnummer te bellen. Je kunt nu een gesimuleerde bel- en chatflow doorlopen om te zien hoe het contact met 112 eruitziet.

h2. Jira tickets

||Platform||Release notes||
|iOS|{args.ios_ticket_url}|
|Android|{args.android_ticket_url}|

h2. Release advice

h3. TeK Team Release advice

||Date||File||Platform||
|n/a|||
|||||

h3. Release checklist

||Phase||Subtask||Status||
|Build & QA|Latest iOS & Android builds created and verified|Completed / N/A / Failed|
|Build & QA|Functional + regression test passed (QA)||
|Build & QA|Smoke test passed (Acceptance)||
|Build & QA|No critical bugs open in Jira||
|Content & Communication|Release notes reviewed and approved||
|Content & Communication|Screenshots & store metadata updated||
|Content & Communication|Changelog shared with stakeholders||
|Store & Deployment|Build submitted for Apple & Google review||
|Store & Deployment|App Store approval received (Apple + Google)|[APP_STORE_CONTACTS]|
|Pre-Go-Live Validation|Testing - sign-off||
|Pre-Go-Live Validation|PO sign-off||
|Pre-Go-Live Validation|TeK sign-off||
|Pre-Go-Live Validation|Go/No-Go confirmed||
|Go-Live Preparation|Rollback plan validated and documented||
|Go-Live Preparation|Crash & analytics monitoring active (Firebase / Sentry)||
|Post-Go-Live|Smoke test on production version||
|Post-Go-Live|Update release overview / Jira / plan retrospective||
|Post-Go-Live|Monitor crash rate & feedback for 3 days||
"""


def print_release_task_preview(
    jira: JiraClient,
    args: argparse.Namespace,
    active_sprint: tuple[dict[str, Any], dict[str, Any]] | None,
) -> None:
    print("")
    print("## Release task")
    print(f"Summary: {release_task_summary(args.task_version)}")
    if active_sprint:
        board, sprint = active_sprint
        print(f"Current sprint: {sprint.get('name')} (board: {board.get('name')})")
    else:
        print("Current sprint: not found")
    print("Issue type: Task")
    print("Project: LMSMMA")
    print("Description preview:")
    print(release_task_description(args))


def create_release_task(
    jira: JiraClient,
    args: argparse.Namespace,
    active_sprint: tuple[dict[str, Any], dict[str, Any]] | None,
) -> None:
    fields: dict[str, Any] = {
        "project": {"key": PROJECT_KEY},
        "issuetype": {"name": "Task"},
        "summary": release_task_summary(args.task_version),
        "description": release_task_description(args),
    }
    created = jira.create_issue(fields)
    issue_key = created.get("key")
    print(f"Created release task: {issue_key}")

    if active_sprint and issue_key:
        sprint_id = active_sprint[1].get("id")
        if sprint_id:
            jira.add_issue_to_sprint(sprint_id, issue_key)
            print(f"Added {issue_key} to sprint: {active_sprint[1].get('name')}")
    else:
        print("Warning: Active sprint not found; task was created without sprint assignment.")


def main() -> int:
    args = parse_args()
    month, year = validate_period(args.month, args.year)
    apps = parse_list(args.apps, DEFAULT_APPS, "--apps")
    platforms = parse_list(args.platforms, DEFAULT_PLATFORMS, "--platforms")

    jira = JiraClient(read_env(ENV_PATH))
    batches = build_batches(apps, platforms, month, year)
    existing_versions = jira.project_versions(PROJECT_KEY)

    fields = ["summary", "status", "labels", "fixVersions", "customfield_10801"]
    issues = jira.search_all(eligible_jql(PROJECT_KEY), fields)
    classified = [classify_issue(issue) for issue in issues]
    active_sprint = None
    if args.create_release_task:
        try:
            active_sprint = jira.active_sprint_for_project(PROJECT_KEY)
        except RuntimeError as error:
            print(f"Warning: active sprint lookup failed: {error}", file=sys.stderr)

    print_plan(batches, existing_versions, classified, args.execute)

    if args.create_release_task:
        print_release_task_preview(jira, args, active_sprint)

    if args.execute:
        print("")
        execute_changes(jira, batches, existing_versions, classified)
        if args.create_release_task:
            print("")
            create_release_task(jira, args, active_sprint)

    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except RuntimeError as error:
        print(f"Error: {error}", file=sys.stderr)
        raise SystemExit(1)
