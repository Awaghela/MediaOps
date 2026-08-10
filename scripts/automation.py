#!/usr/bin/env python3
"""
MediaOps Automation Script
Runs periodic checks and updates:
  - Auto-escalate overdue critical issues
  - Update content status when all workflow steps complete
  - Generate weekly summary stats
  - Flag blocked content after 7 days

Run: python automation.py [--dry-run] [--task escalate|complete|report|flag]
"""

import os
import argparse
import json
from datetime import datetime, timedelta
from dotenv import load_dotenv
import psycopg2
from psycopg2.extras import RealDictCursor

load_dotenv()
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://localhost:5432/mediaops")


def get_conn():
    return psycopg2.connect(DATABASE_URL, cursor_factory=RealDictCursor)


# ─── Task 1: Escalate overdue critical issues ─────────────────────────────────

def escalate_overdue_issues(dry_run=False):
    """Escalate open critical/high issues past their due date."""
    conn = get_conn()
    cur = conn.cursor()

    cur.execute("""
        SELECT id, title, partner_id, severity, due_date, owner
        FROM issues
        WHERE status IN ('open', 'in_progress')
          AND severity IN ('critical', 'high')
          AND due_date IS NOT NULL
          AND due_date < CURRENT_DATE
    """)
    overdue = cur.fetchall()
    print(f"🔍 Found {len(overdue)} overdue critical/high issues")

    for issue in overdue:
        print(f"  → Escalating: {issue['title'][:50]} (due {issue['due_date']}, owner: {issue['owner']})")
        if not dry_run:
            cur.execute("""
                UPDATE issues SET status = 'escalated', notes = CONCAT(COALESCE(notes, ''), '\n[AUTO] Escalated due to overdue date: ', NOW()::text)
                WHERE id = %s
            """, (issue['id'],))
            cur.execute("""
                INSERT INTO status_history (entity_type, entity_id, old_status, new_status, changed_by, reason)
                VALUES ('issue', %s, %s, 'escalated', 'automation', 'Auto-escalated: past due date')
            """, (issue['id'], issue['status']))

    if not dry_run:
        conn.commit()
    cur.close()
    conn.close()
    print(f"✅ Escalated {len(overdue)} issues{'(dry run)' if dry_run else ''}")
    return len(overdue)


# ─── Task 2: Auto-complete content when all steps done ───────────────────────

def auto_complete_content(dry_run=False):
    """Set content to 'approved' when all workflow steps are completed."""
    conn = get_conn()
    cur = conn.cursor()

    cur.execute("""
        SELECT c.id, c.title, c.status,
               COUNT(ws.id) as total_steps,
               COUNT(ws.id) FILTER (WHERE ws.status = 'completed') as done_steps
        FROM content c
        JOIN workflow_steps ws ON ws.content_id = c.id
        WHERE c.status IN ('draft', 'in_review')
        GROUP BY c.id
        HAVING COUNT(ws.id) = COUNT(ws.id) FILTER (WHERE ws.status = 'completed')
           AND COUNT(ws.id) > 0
    """)
    ready = cur.fetchall()
    print(f"🔍 Found {len(ready)} content items ready for auto-approval")

    for item in ready:
        print(f"  → Auto-approving: {item['title'][:50]} ({item['done_steps']}/{item['total_steps']} steps)")
        if not dry_run:
            cur.execute("UPDATE content SET status = 'approved' WHERE id = %s", (item['id'],))
            cur.execute("""
                INSERT INTO status_history (entity_type, entity_id, old_status, new_status, changed_by, reason)
                VALUES ('content', %s, %s, 'approved', 'automation', 'All workflow steps completed')
            """, (item['id'], item['status']))

    if not dry_run:
        conn.commit()
    cur.close()
    conn.close()
    print(f"✅ Auto-approved {len(ready)} content items{'(dry run)' if dry_run else ''}")
    return len(ready)


# ─── Task 3: Flag stale blocked content ──────────────────────────────────────

def flag_stale_blocked(days=7, dry_run=False):
    """Report content blocked for more than N days."""
    conn = get_conn()
    cur = conn.cursor()

    cur.execute("""
        SELECT c.id, c.title, c.blocker_count, p.name as partner_name,
               c.updated_at,
               EXTRACT(DAY FROM NOW() - c.updated_at)::int as days_blocked
        FROM content c
        JOIN partners p ON p.id = c.partner_id
        WHERE c.status = 'blocked'
          AND c.updated_at < NOW() - INTERVAL '%s days'
        ORDER BY days_blocked DESC
    """, (days,))
    stale = cur.fetchall()
    print(f"🔍 Found {len(stale)} content items blocked > {days} days:")

    for item in stale:
        print(f"  ⚠ {item['title'][:45]:<45} | {item['partner_name']:<25} | {item['days_blocked']} days | {item['blocker_count']} blockers")

    cur.close()
    conn.close()
    return [dict(r) for r in stale]


# ─── Task 4: Weekly summary report ───────────────────────────────────────────

def generate_weekly_report():
    """Print a weekly ops summary to stdout (can be piped to Slack/email)."""
    conn = get_conn()
    cur = conn.cursor()

    week_ago = (datetime.now() - timedelta(days=7)).strftime("%Y-%m-%d")

    cur.execute("SELECT COUNT(*) as count FROM content WHERE status = 'live' AND updated_at > %s", (week_ago,))
    new_live = cur.fetchone()['count']

    cur.execute("SELECT COUNT(*) as count FROM issues WHERE status = 'resolved' AND resolved_at > %s", (week_ago,))
    resolved = cur.fetchone()['count']

    cur.execute("SELECT COUNT(*) as count FROM issues WHERE created_at > %s", (week_ago,))
    new_issues = cur.fetchone()['count']

    cur.execute("SELECT COUNT(*) as count FROM partners WHERE onboarding_status = 'completed' AND updated_at > %s", (week_ago,))
    completed_onboarding = cur.fetchone()['count']

    cur.execute("""
        SELECT COUNT(*) as count FROM issues
        WHERE severity = 'critical' AND status NOT IN ('resolved', 'wont_fix')
    """)
    open_critical = cur.fetchone()['count']

    report = {
        "week": week_ago,
        "new_live_content": new_live,
        "issues_resolved": resolved,
        "new_issues": new_issues,
        "partners_onboarded": completed_onboarding,
        "open_critical_issues": open_critical,
        "generated_at": datetime.now().isoformat(),
    }

    print("\n📊 WEEKLY OPS SUMMARY")
    print("=" * 40)
    print(f"  Period:               Last 7 days (since {week_ago})")
    print(f"  New Live Content:     {new_live}")
    print(f"  Issues Resolved:      {resolved}")
    print(f"  New Issues Created:   {new_issues}")
    print(f"  Partners Onboarded:   {completed_onboarding}")
    print(f"  Open Critical Issues: {open_critical}")
    print("=" * 40)
    print(json.dumps(report, indent=2))

    cur.close()
    conn.close()
    return report


# ─── CLI ─────────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="MediaOps Automation")
    parser.add_argument("--task", choices=["escalate", "complete", "report", "flag", "all"], default="all")
    parser.add_argument("--dry-run", action="store_true", help="Preview without making changes")
    parser.add_argument("--days", type=int, default=7, help="Days threshold for stale flag check")
    args = parser.parse_args()

    print(f"🤖 MediaOps Automation — Task: {args.task} {'(DRY RUN)' if args.dry_run else ''}\n")

    if args.task in ("escalate", "all"):
        escalate_overdue_issues(dry_run=args.dry_run)
    if args.task in ("complete", "all"):
        auto_complete_content(dry_run=args.dry_run)
    if args.task in ("flag", "all"):
        flag_stale_blocked(days=args.days, dry_run=args.dry_run)
    if args.task in ("report", "all"):
        generate_weekly_report()

    print("\n✅ Automation run complete.")
