#!/usr/bin/env python3
"""Build an LMS release-advice PDF attachment and reviewable mail draft."""

from __future__ import annotations

import argparse
import json
import os
import re
import ssl
import subprocess
import sys
from dataclasses import dataclass
from datetime import datetime
from email.message import EmailMessage
from email.utils import formataddr, parseaddr
from pathlib import Path
from typing import Any
from urllib.error import HTTPError, URLError
from urllib.parse import quote
from urllib.request import Request, urlopen
from xml.sax.saxutils import escape as xml_escape


LMS_ROOT = Path(__file__).resolve().parents[3]
ENV_PATH = LMS_ROOT / "mcp" / "jira-mcp-codex" / ".env"
DEFAULT_OUTPUT_DIR = LMS_ROOT / "outputs" / "release-advice"
PROJECT_KEY = "LMSMMA"

DEFAULT_TO_RECIPIENT = ("Release advice recipient", "release-advice-recipient@example.com")
DEFAULT_CC_RECIPIENTS: list[tuple[str, str]] = []
DEFAULT_FROM_RECIPIENT = ("Sender", "sender@example.com")


@dataclass(frozen=True)
class ReleaseArtifacts:
    pdf_paths: list[Path]
    eml_path: Path
    issue_count: int
    fix_versions: list[str]
    opened: bool


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Generate a release-advice PDF from Jira and create a reviewable Outlook .eml draft.",
    )
    parser.add_argument("--product", required=True, help="Product name, for example NL-Alert.")
    parser.add_argument("--version", required=True, help="Release version, for example 1.5.0.")
    parser.add_argument(
        "--jira-version-link",
        action="append",
        required=True,
        help=(
            "Jira release/version link. Repeat for multiple platform releases. "
            "Use NAME=URL to map a link to a platform, for example --jira-version-link Android=https://..."
        ),
    )
    parser.add_argument("--reply-ticket", required=True, help="Jira ticket where TeK should reply.")
    parser.add_argument("--go-live", required=True, help="Planned go-live timing.")
    parser.add_argument(
        "--platform",
        action="append",
        default=[],
        help="Platform and build number as NAME=BUILD, for example --platform Android=1591.",
    )
    parser.add_argument(
        "--fix-version",
        action="append",
        help=(
            "Jira fixVersion name. Required when a --jira-version-link does not contain /versions/<id>. "
            "Repeat in the same order as --jira-version-link when needed."
        ),
    )
    parser.add_argument(
        "--output-dir",
        default=str(DEFAULT_OUTPUT_DIR),
        help=f"Output directory. Default: {DEFAULT_OUTPUT_DIR}",
    )
    parser.add_argument(
        "--issues-json",
        help="Read Jira search issues from a local JSON fixture instead of calling Jira.",
    )
    parser.add_argument(
        "--no-open",
        action="store_true",
        help="Create artifacts but do not try to open the .eml draft in Outlook.",
    )
    return parser.parse_args()


def parse_platforms(values: list[str]) -> list[tuple[str, str]]:
    platforms: list[tuple[str, str]] = []
    for value in values:
        if "=" not in value:
            raise SystemExit(f"--platform must use NAME=BUILD format, got: {value}")
        name, build = value.split("=", 1)
        name = name.strip()
        build = build.strip()
        if not name or not build:
            raise SystemExit(f"--platform must use NAME=BUILD format, got: {value}")
        platforms.append((name, build))
    return platforms


def parse_release_links(values: str | list[str]) -> list[tuple[str, str]]:
    raw_values = [values] if isinstance(values, str) else values
    links: list[tuple[str, str]] = []
    for index, value in enumerate(raw_values, start=1):
        if "=" in value and not value.startswith(("http://", "https://")):
            label, url = value.split("=", 1)
            label = label.strip()
            url = url.strip()
        else:
            label = f"Release {index}"
            url = value.strip()
        if not label or not url:
            raise SystemExit(f"--jira-version-link must be URL or NAME=URL format, got: {value}")
        links.append((label, url))
    return links


def extract_version_id(jira_version_link: str) -> str | None:
    match = re.search(r"/versions/(\d+)(?:\D|$)", jira_version_link)
    return match.group(1) if match else None


def sanitize_filename(value: str) -> str:
    sanitized = re.sub(r"[^A-Za-z0-9._-]+", "-", value.strip())
    return sanitized.strip("-") or "release-advice"


def quote_jql_text(value: str) -> str:
    return value.replace("\\", "\\\\").replace('"', '\\"')


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


def parse_recipient(value: str) -> tuple[str, str]:
    name, email = parseaddr(value)
    if not email:
        raise SystemExit(f"Invalid email recipient value: {value}")
    return (name, email)


def parse_recipient_list(value: str) -> list[tuple[str, str]]:
    return [parse_recipient(item.strip()) for item in value.split(";") if item.strip()]


def mail_recipients() -> tuple[tuple[str, str], tuple[str, str], list[tuple[str, str]]]:
    from_recipient = parse_recipient(os.environ["LMS_RELEASE_ADVICE_FROM"]) if os.environ.get("LMS_RELEASE_ADVICE_FROM") else DEFAULT_FROM_RECIPIENT
    to_recipient = parse_recipient(os.environ["LMS_RELEASE_ADVICE_TO"]) if os.environ.get("LMS_RELEASE_ADVICE_TO") else DEFAULT_TO_RECIPIENT
    cc_recipients = parse_recipient_list(os.environ["LMS_RELEASE_ADVICE_CC"]) if os.environ.get("LMS_RELEASE_ADVICE_CC") else DEFAULT_CC_RECIPIENTS
    return from_recipient, to_recipient, cc_recipients


class JiraClient:
    def __init__(self, env: dict[str, str]) -> None:
        jira_url = env.get("JIRA_URL") or env.get("JIRA_BASE_URL")
        token = env.get("JIRA_PAT") or env.get("ATLASSIAN_PAT") or env.get("JIRA_ACCESS_TOKEN")
        if not jira_url:
            raise SystemExit("JIRA_URL or JIRA_BASE_URL is missing in Jira .env")
        if not token:
            raise SystemExit("JIRA_PAT, ATLASSIAN_PAT, or JIRA_ACCESS_TOKEN is missing in Jira .env")

        self.base_url = jira_url.rstrip("/")
        self.token = token
        self.api_version = env.get("JIRA_API_VERSION", "2")
        self.context = None
        if env.get("VERIFY_TLS", "true").lower() == "false":
            self.context = ssl._create_unverified_context()

    @property
    def api(self) -> str:
        return f"/rest/api/{self.api_version}"

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

    def get_version_name(self, version_id: str) -> str:
        version = self.request("GET", f"{self.api}/version/{quote(version_id)}")
        name = version.get("name") if isinstance(version, dict) else None
        if not name:
            raise RuntimeError(f"Jira version {version_id} did not return a name.")
        return str(name)

    def search_all(self, jql: str, fields: list[str]) -> list[dict[str, Any]]:
        issues: list[dict[str, Any]] = []
        start_at = 0
        while True:
            response = self.request(
                "POST",
                f"{self.api}/search",
                {"jql": jql, "fields": fields, "startAt": start_at, "maxResults": 100},
            )
            page = response.get("issues", [])
            issues.extend(page)
            start_at += len(page)
            if start_at >= response.get("total", 0) or not page:
                return issues


def load_fixture_issues(path: Path) -> list[dict[str, Any]]:
    payload = json.loads(path.read_text(encoding="utf-8"))
    if isinstance(payload, dict):
        issues = payload.get("issues", [])
    else:
        issues = payload
    if not isinstance(issues, list):
        raise SystemExit(f"Fixture must be a Jira search response or issue list: {path}")
    return issues


def jira_value(value: Any, default: str = "") -> str:
    if isinstance(value, dict):
        return str(value.get("name") or value.get("displayName") or value.get("value") or default)
    if value is None:
        return default
    return str(value)


def clean_jira_text(value: Any) -> str:
    text = str(value or "")
    text = re.sub(r"\{[^}\n]+\}", " ", text)
    text = re.sub(r"!\S+!", " ", text)
    text = re.sub(r"\[(?:[^\]|]+)\|([^\]]+)\]", r"\1", text)
    text = re.sub(r"\[(.*?)\]", r"\1", text)
    text = re.sub(r"[*_#~^]+", "", text)
    text = re.sub(r"h\d+\.", " ", text, flags=re.IGNORECASE)
    text = re.sub(r"\|\|?", " ", text)
    text = re.sub(r"\s+", " ", text)
    return text.strip()


def one_sentence_summary(title: str, description: Any) -> str:
    cleaned_description = clean_jira_text(description)
    if cleaned_description:
        first_sentence = re.split(r"(?<=[.!?])\s+", cleaned_description, maxsplit=1)[0].strip()
        sentence = first_sentence if len(first_sentence) <= 220 else first_sentence[:217].rstrip() + "..."
        if sentence and sentence[-1] not in ".!?":
            sentence += "."
        return sentence

    cleaned_title = clean_jira_text(title)
    if cleaned_title:
        sentence = f"This release item covers {cleaned_title}."
        return sentence
    return "This release item is included in the release."


def issue_row(issue: dict[str, Any]) -> list[str]:
    fields = issue.get("fields") or {}
    title = str(fields.get("summary") or "")
    return [
        str(issue.get("key") or ""),
        jira_value(fields.get("issuetype"), "n/a"),
        title,
    ]


def pdf_text(value: str) -> str:
    return xml_escape(value, {'"': "&quot;", "'": "&apos;"})


def build_mail_body(
    product: str,
    version: str,
    platforms: list[tuple[str, str]],
    release_links: list[tuple[str, str]],
    pdf_names: list[str],
    reply_ticket: str,
    go_live: str,
) -> str:
    signature_name = os.environ.get("LMS_MAIL_SIGNATURE_NAME", "[SENDER_NAME]")
    release_link_by_label = {label.lower(): url for label, url in release_links}
    default_release_link = release_links[0][1]
    platform_blocks: list[str] = []
    for platform, build in platforms:
        release_link = release_link_by_label.get(platform.lower(), default_release_link)
        platform_blocks.append(
            f"{platform}:\n"
            f"Build number: {build}\n"
            f"Release notes: {release_link}"
        )
    if platform_blocks:
        platform_text = "\n\n".join(platform_blocks)
    else:
        platform_text = "\n".join(f"{label} release notes: {url}" for label, url in release_links)
    return (
        "Hi TeK-Team,\n\n"
        f"Hereby a request for release advice and chain testing - {product} v{version}\n\n"
        f"{platform_text}\n\n"
        f"Attachments: {', '.join(pdf_names)}\n\n"
        f"Release advice reply on the following ticket: {reply_ticket}\n\n"
        f"Planned go-live: {go_live}\n\n"
        "Kind regards,\n"
        f"{signature_name}\n"
    )


def build_pdf(
    path: Path,
    product: str,
    version: str,
    fix_versions: list[str],
    release_links: list[tuple[str, str]],
    issues: list[dict[str, Any]],
) -> None:
    try:
        from reportlab.lib import colors
        from reportlab.lib.enums import TA_LEFT
        from reportlab.lib.pagesizes import A4, landscape
        from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
        from reportlab.lib.units import mm
        from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle
    except ImportError as exc:
        raise SystemExit(
            "The reportlab package is required for PDF generation. "
            "Run this with the Codex bundled Python runtime or install reportlab."
        ) from exc

    styles = getSampleStyleSheet()
    title_style = styles["Title"]
    body_style = ParagraphStyle(
        "ReleaseAdviceBody",
        parent=styles["BodyText"],
        fontSize=8.5,
        leading=10.5,
        alignment=TA_LEFT,
    )
    header_style = ParagraphStyle(
        "ReleaseAdviceHeader",
        parent=body_style,
        fontName="Helvetica-Bold",
        textColor=colors.white,
    )

    doc = SimpleDocTemplate(
        str(path),
        pagesize=landscape(A4),
        leftMargin=12 * mm,
        rightMargin=12 * mm,
        topMargin=12 * mm,
        bottomMargin=12 * mm,
        title=f"{product} v{version} release items",
    )

    story: list[Any] = [
        Paragraph(pdf_text(f"{product} v{version} - Release Items"), title_style),
        Paragraph(pdf_text(f"Jira fixVersions: {', '.join(fix_versions)}"), body_style),
        Paragraph(f"Generated: {datetime.now().strftime('%Y-%m-%d %H:%M')}", body_style),
        Paragraph(f"Items included: {len(issues)}", body_style),
        Spacer(1, 2 * mm),
        *[
            Paragraph(pdf_text(f"{label} release link: {url}"), body_style)
            for label, url in release_links
        ],
        Spacer(1, 6 * mm),
    ]

    table_data: list[list[Any]] = [
        [Paragraph(pdf_text(label), header_style) for label in ["Ticket ID", "Type", "Story title"]]
    ]
    if issues:
        for issue in issues:
            table_data.append([Paragraph(pdf_text(cell), body_style) for cell in issue_row(issue)])
    else:
        table_data.append(
            [
                Paragraph("No Jira items found for this release version.", body_style),
                Paragraph("", body_style),
                Paragraph("", body_style),
            ]
        )

    table = Table(table_data, colWidths=[30 * mm, 28 * mm, 212 * mm], repeatRows=1)
    table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#2F4F4F")),
                ("GRID", (0, 0), (-1, -1), 0.25, colors.HexColor("#C9D1D9")),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#F6F8FA")]),
                ("LEFTPADDING", (0, 0), (-1, -1), 4),
                ("RIGHTPADDING", (0, 0), (-1, -1), 4),
                ("TOPPADDING", (0, 0), (-1, -1), 4),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
            ]
        )
    )
    story.append(table)
    doc.build(story)


def build_eml(path: Path, subject: str, body: str, pdf_paths: list[Path]) -> None:
    from_recipient, to_recipient, cc_recipients = mail_recipients()
    message = EmailMessage()
    message["From"] = formataddr(from_recipient)
    message["To"] = formataddr(to_recipient)
    if cc_recipients:
        message["Cc"] = ", ".join(formataddr(recipient) for recipient in cc_recipients)
    message["Subject"] = subject
    message.set_content(body)
    for pdf_path in pdf_paths:
        message.add_attachment(
            pdf_path.read_bytes(),
            maintype="application",
            subtype="pdf",
            filename=pdf_path.name,
        )
    path.write_bytes(message.as_bytes())


def try_open_in_outlook(eml_path: Path) -> bool:
    commands = [
        ["open", "-a", "Microsoft Outlook", str(eml_path)],
        ["open", str(eml_path)],
    ]
    for command in commands:
        try:
            subprocess.run(command, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
            return True
        except (FileNotFoundError, subprocess.CalledProcessError):
            continue
    return False


def resolve_fix_versions(
    fix_version_args: str | list[str] | None,
    jira: JiraClient | None,
    release_links: list[tuple[str, str]],
) -> list[str]:
    fix_version_values = (
        [fix_version_args]
        if isinstance(fix_version_args, str)
        else list(fix_version_args or [])
    )
    resolved: list[str] = []
    for index, (_, url) in enumerate(release_links):
        version_id = extract_version_id(url)
        if version_id and jira is not None:
            resolved.append(jira.get_version_name(version_id))
            continue
        if version_id and jira is None and index >= len(fix_version_values):
            resolved.append(f"version-id-{version_id}")
            continue
        if index < len(fix_version_values):
            resolved.append(fix_version_values[index])
            continue
        raise SystemExit("--fix-version is required when --jira-version-link does not contain /versions/<id>.")
    return resolved


def build_fix_version_jql(fix_versions: list[str]) -> str:
    quoted_versions = ", ".join(f'"{quote_jql_text(fix_version)}"' for fix_version in fix_versions)
    if len(fix_versions) == 1:
        return f"fixVersion = {quoted_versions}"
    return f"fixVersion in ({quoted_versions})"


def search_issues_for_fix_version(jira: JiraClient, fix_version: str) -> list[dict[str, Any]]:
    jql = f'project = {PROJECT_KEY} AND fixVersion = "{quote_jql_text(fix_version)}" ORDER BY issuetype, key'
    return jira.search_all(
        jql,
        ["summary", "description", "issuetype", "fixVersions"],
    )


def split_fixture_issues_by_fix_version(
    issues: list[dict[str, Any]],
    fix_versions: list[str],
) -> list[list[dict[str, Any]]]:
    if len(fix_versions) == 1:
        return [issues]

    grouped: list[list[dict[str, Any]]] = []
    for fix_version in fix_versions:
        grouped.append(
            [
                issue
                for issue in issues
                if any(
                    isinstance(version, dict) and version.get("name") == fix_version
                    for version in (issue.get("fields") or {}).get("fixVersions", [])
                )
            ]
        )
    if sum(len(group) for group in grouped) == 0 and issues:
        grouped[0].extend(issues)
    return grouped


def create_release_advice(args: argparse.Namespace) -> ReleaseArtifacts:
    platforms = parse_platforms(args.platform)
    release_links = parse_release_links(args.jira_version_link)
    output_dir = Path(args.output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)

    jira = None if args.issues_json else JiraClient(read_env(ENV_PATH))
    fix_versions = resolve_fix_versions(args.fix_version, jira, release_links)

    if args.issues_json:
        all_fixture_issues = load_fixture_issues(Path(args.issues_json))
        issues_by_release = split_fixture_issues_by_fix_version(all_fixture_issues, fix_versions)
    else:
        assert jira is not None
        issues_by_release = [search_issues_for_fix_version(jira, fix_version) for fix_version in fix_versions]

    timestamp = datetime.now().strftime("%Y%m%d-%H%M%S")
    base_name = sanitize_filename(f"release-advice-{args.product}-v{args.version}-{timestamp}")
    pdf_paths = [
        output_dir / f"{base_name}-{sanitize_filename(label)}-items.pdf"
        for label, _ in release_links
    ]
    eml_path = output_dir / f"{base_name}.eml"
    subject = f"Request for release advice and chain testing - {args.product} v{args.version}"
    body = build_mail_body(
        args.product,
        args.version,
        platforms,
        release_links,
        [pdf_path.name for pdf_path in pdf_paths],
        args.reply_ticket,
        args.go_live,
    )

    for index, pdf_path in enumerate(pdf_paths):
        label, url = release_links[index]
        fix_version = fix_versions[index]
        issues = issues_by_release[index] if index < len(issues_by_release) else []
        build_pdf(pdf_path, args.product, args.version, [fix_version], [(label, url)], issues)
    build_eml(eml_path, subject, body, pdf_paths)
    opened = False if args.no_open else try_open_in_outlook(eml_path)
    return ReleaseArtifacts(
        pdf_paths=pdf_paths,
        eml_path=eml_path,
        issue_count=sum(len(issues) for issues in issues_by_release),
        fix_versions=fix_versions,
        opened=opened,
    )


def main() -> int:
    args = parse_args()
    try:
        artifacts = create_release_advice(args)
    except RuntimeError as error:
        print(f"Error: {error}", file=sys.stderr)
        return 1

    print("Release advice draft created")
    print(f"Fix versions: {', '.join(artifacts.fix_versions)}")
    print(f"Jira items in PDF: {artifacts.issue_count}")
    for pdf_path in artifacts.pdf_paths:
        print(f"PDF: {pdf_path}")
    print(f"Draft: {artifacts.eml_path}")
    print(f"Opened in Outlook: {'yes' if artifacts.opened else 'no'}")
    if artifacts.issue_count == 0:
        print("Warning: no Jira items were found for this release version.", file=sys.stderr)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
