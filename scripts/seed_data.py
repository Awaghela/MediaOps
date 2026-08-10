#!/usr/bin/env python3
"""
MediaOps Seed Script
Generates 300 partner-content records with realistic data.
Run: python seed_data.py
Requires: pip install psycopg2-binary python-dotenv faker
"""

import os
import random
import uuid
from datetime import datetime, timedelta
from dotenv import load_dotenv
import psycopg2
from psycopg2.extras import execute_values

load_dotenv()
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://localhost:5432/mediaops")

# ─── Seed Data ────────────────────────────────────────────────────────────────

PARTNERS = [
    ("Apex Studios", "north_america", "premium"),
    ("Blue Horizon Media", "europe", "premium"),
    ("Crestline Entertainment", "asia_pacific", "standard"),
    ("Dawnbreak Films", "latin_america", "standard"),
    ("Echo Point Productions", "north_america", "basic"),
    ("Frontier Digital", "europe", "premium"),
    ("Goldwing Media", "middle_east", "standard"),
    ("Harbor Light Studios", "north_america", "basic"),
    ("Ironclad Entertainment", "asia_pacific", "premium"),
    ("Jade River Films", "asia_pacific", "standard"),
    ("Keystone Productions", "europe", "standard"),
    ("Lunar Arc Media", "north_america", "premium"),
    ("Meridian Pictures", "africa", "basic"),
    ("Northgate Studios", "europe", "standard"),
    ("Orbit Media Group", "latin_america", "basic"),
    ("Pinnacle Content", "north_america", "premium"),
    ("Quartz Stream", "asia_pacific", "standard"),
    ("Redstone Films", "europe", "basic"),
    ("Skyfall Productions", "middle_east", "premium"),
    ("Titan Media Works", "north_america", "standard"),
]

CONTENT_TITLES = [
    "The Last Signal", "Midnight Protocol", "Edge of Tomorrow", "Dark Waters Rising",
    "Neon City Chronicles", "The Final Frontier", "Beneath the Surface", "Crimson Dawn",
    "The Quantum Files", "Shadow Protocol", "Beyond Limits", "The Reckoning",
    "Starfall", "Iron Resolve", "The Long Game",
]

CONTENT_TYPES = ["series", "movie", "documentary", "short", "live_event", "podcast"]
GENRES = ["Drama", "Thriller", "Action", "Documentary", "Comedy", "Sci-Fi", "Crime"]
CONTENT_STATUSES = ["draft", "in_review", "approved", "scheduled", "live", "blocked", "cancelled"]
ONBOARDING_STATUSES = ["pending", "in_progress", "review", "blocked", "completed"]
PRIORITIES = ["critical", "high", "medium", "low"]
ISSUE_TYPES = ["metadata", "rights", "technical", "legal", "content_quality", "scheduling", "billing", "escalation"]
ISSUE_STATUSES = ["open", "in_progress", "resolved", "escalated"]
SEVERITIES = ["critical", "high", "medium", "low"]
OWNERS = ["Alex Chen", "Sarah Kim", "Marcus Johnson", "Priya Patel", "Tom Nguyen", "Lisa Park", "James Wilson"]
STEP_NAMES = ["Metadata Review", "Rights Clearance", "Quality Check", "Legal Approval",
               "Scheduling", "Technical Encoding", "Final Publish"]


def future_date(days_ahead: int) -> str:
    return (datetime.now() + timedelta(days=days_ahead)).strftime("%Y-%m-%d")


def past_date(days_ago: int) -> str:
    return (datetime.now() - timedelta(days=days_ago)).strftime("%Y-%m-%d")


def slug(name: str) -> str:
    import re
    return re.sub(r"[^a-z0-9]+", "-", name.lower()).strip("-")


def main():
    conn = psycopg2.connect(DATABASE_URL)
    cur = conn.cursor()
    print("🌱 Python seed script running…")

    # Clear existing
    for table in ["status_history", "workflow_steps", "issues", "content", "partners"]:
        cur.execute(f"DELETE FROM {table}")
    print("  ✓ Cleared existing data")

    # ── Partners ──────────────────────────────────────────────────────────────
    partner_ids = []
    partner_rows = []
    for name, region, tier in PARTNERS:
        pid = str(uuid.uuid4())
        partner_ids.append(pid)
        partner_rows.append((
            pid, name, slug(name) + "-" + pid[:8], tier, region,
            f"ops@{slug(name)}.com", random.choice(OWNERS),
            random.choice(ONBOARDING_STATUSES),
            f"Onboarded via {random.choice(['direct', 'referral', 'agency'])} channel." if random.random() > 0.4 else None,
        ))

    execute_values(cur, """
        INSERT INTO partners (id, name, slug, tier, region, contact_email, contact_name, onboarding_status, notes)
        VALUES %s
    """, partner_rows)
    print(f"  ✓ {len(partner_ids)} partners inserted")

    # ── Content (300 records = 15 per partner) ────────────────────────────────
    content_ids = []
    content_rows = []
    for pid in partner_ids:
        for j in range(15):
            cid = str(uuid.uuid4())
            content_ids.append((cid, pid))
            status = random.choice(CONTENT_STATUSES)
            title = f"{CONTENT_TITLES[j % len(CONTENT_TITLES)]}{' II' if j >= 15 else ''}"
            content_rows.append((
                cid, pid, title,
                random.choice(CONTENT_TYPES),
                random.choice(GENRES),
                future_date(random.randint(7, 180)) if random.random() > 0.3 else None,
                status,
                random.choice(PRIORITIES),
                random.randint(1, 5) if status == "blocked" else 0,
            ))

    execute_values(cur, """
        INSERT INTO content (id, partner_id, title, content_type, genre, launch_date, status, priority, blocker_count)
        VALUES %s
    """, content_rows)
    print(f"  ✓ {len(content_ids)} content records (300 = 15 per partner)")

    # ── Issues ────────────────────────────────────────────────────────────────
    issue_rows = []
    for cid, pid in content_ids:
        if random.random() > 0.4:
            for _ in range(random.randint(1, 3)):
                status = random.choice(ISSUE_STATUSES)
                issue_rows.append((
                    str(uuid.uuid4()), cid, pid,
                    random.choice(ISSUE_TYPES), random.choice(SEVERITIES),
                    f"{random.choice(ISSUE_TYPES).replace('_', ' ').title()} issue",
                    "Issue requires ops team review and partner coordination.",
                    random.choice(OWNERS), status,
                    "Partner notified. Awaiting response." if random.random() > 0.5 else None,
                    future_date(random.randint(1, 30)) if random.random() > 0.5 else None,
                    past_date(random.randint(1, 14)) if status == "resolved" else None,
                ))

    execute_values(cur, """
        INSERT INTO issues (id, content_id, partner_id, issue_type, severity, title, description,
                             owner, status, notes, due_date, resolved_at)
        VALUES %s
    """, issue_rows)
    print(f"  ✓ {len(issue_rows)} issues inserted")

    # ── Workflow Steps ─────────────────────────────────────────────────────────
    step_rows = []
    for cid, _ in content_ids:
        for order, step in enumerate(STEP_NAMES, 1):
            done = random.random() > 0.45
            step_rows.append((
                str(uuid.uuid4()), cid, step, order,
                "completed" if done else random.choice(["pending", "in_progress", "blocked"]),
                random.choice(OWNERS),
                future_date(order * 7),
                past_date(random.randint(1, 30)) if done else None,
            ))

    execute_values(cur, """
        INSERT INTO workflow_steps (id, content_id, step_name, step_order, status, assigned_to, due_date, completed_at)
        VALUES %s
    """, step_rows)
    print(f"  ✓ {len(step_rows)} workflow steps inserted")

    # ── 35 Status History Cases ───────────────────────────────────────────────
    history_rows = []
    for cid, _ in content_ids[:35]:
        statuses = ["draft", "in_review", "approved", "scheduled"]
        for i in range(1, len(statuses)):
            history_rows.append((
                str(uuid.uuid4()), "content", cid,
                statuses[i - 1], statuses[i], random.choice(OWNERS),
                "Status updated during onboarding workflow.",
            ))

    execute_values(cur, """
        INSERT INTO status_history (id, entity_type, entity_id, old_status, new_status, changed_by, reason)
        VALUES %s
    """, history_rows)
    print(f"  ✓ 35 workflow status history cases")

    conn.commit()
    cur.close()
    conn.close()
    print("\n✅ Python seed complete!")
    print(f"   Partners:  {len(partner_ids)}")
    print(f"   Content:   {len(content_ids)} (300 records)")
    print(f"   Issues:    {len(issue_rows)}")
    print(f"   Steps:     {len(step_rows)}")
    print(f"   History:   {len(history_rows)} (35 workflow cases)")


if __name__ == "__main__":
    main()
