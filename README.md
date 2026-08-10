# MediaOps — Internal Operations Dashboard

A production-grade internal dashboard built to bring visibility into partner onboarding pipelines, content launch workflows, and operational issue tracking across a media organization. Built with React, TypeScript, Node.js, PostgreSQL, and Python — deployed on Railway and Vercel.

---

## What It Does

Media operations teams manage hundreds of partner relationships, each with content in various stages of review, approval, and launch. Without a centralized tool, blockers go unnoticed, issue ownership is unclear, and reporting is manual. MediaOps solves this by giving ops teams a single place to:

- Track every partner's onboarding progress from pending to completed
- Monitor content across 7 workflow stages with real-time blocker visibility
- Own and resolve issues with severity triage, assignment, and escalation
- Pull partner-level reports showing workflow health and issue breakdowns
- Automate escalation of overdue critical issues and approval of completed pipelines

---

## Scale

- **300 partner-content records** across 20 partners — 15 content items per partner spanning series, movies, documentaries, podcasts, live events, and shorts
- **35 workflow status-change cases** captured in full audit history — covering status progressions, missing field scenarios, repeated blockers, and escalation paths
- **7-step content pipeline** per item: Metadata Review → Rights Clearance → Quality Check → Legal Approval → Scheduling → Technical Encoding → Final Publish
- **Full issue lifecycle** modeled: open → in_progress → escalated → resolved, with severity levels (critical / high / medium / low) and ownership tracking

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, TypeScript, Vite, Tailwind CSS, Recharts |
| Backend | Node.js, Express, TypeScript |
| Database | PostgreSQL 16 with triggers, indexes, and audit history |
| Automation | Python 3.11 with psycopg2 |
| Deployment | Railway (API + DB), Vercel (frontend) |
| CI/CD | GitHub Actions — type check, build, integration test, deploy |

---

## Features

**Dashboard** — Eight animated KPI cards with count-up animations, area charts for weekly content launch trends, pie chart for onboarding status distribution, bar charts for issue type breakdown, and a live activity feed showing recent status changes.

**Partner Management** — Searchable and filterable partner table with inline status updates, tier badges, content counts, and open issue indicators. Drill down into any partner for a full view of their content, issues, workflow completion radar chart, and issue severity breakdown.

**Content Tracking** — Expandable content rows showing priority indicators, workflow progress bars, blocker counts, and launch dates. Filter by status, priority, and content type. Update status and priority inline without leaving the list.

**Issue Tracker** — Card-based issue grid sorted by severity. Filter by type, severity, status, and assigned owner. Click any issue to open a detail modal with full edit capability — update status, reassign owner, and add resolution notes.

**Workflow View** — Per-content workflow cards showing all 7 pipeline steps with completion status, assigned team member, and due dates. Progress rings reflect real completion percentages.

**Reports** — Select any partner to generate a live analytics report: summary KPIs, issue breakdown by type and severity, and per-step workflow health progress bars.

---

## API

The backend exposes 15 REST endpoints covering the full data model. All list endpoints support `search`, `status`, `page`, and `limit` query parameters.

```
GET    /health
GET    /api/dashboard/stats
GET    /api/dashboard/timeline
GET    /api/partners
POST   /api/partners
GET    /api/partners/:id
PATCH  /api/partners/:id
GET    /api/content
PATCH  /api/content/:id
GET    /api/content/:id/workflow
PATCH  /api/workflow/:id
GET    /api/issues
POST   /api/issues
PATCH  /api/issues/:id
GET    /api/reports/partner/:id
```

Every status change on partners, content, and issues is written to `status_history` with the previous state, new state, actor, and reason — giving a full audit trail.

---

## Automation Scripts

Four Python automation tasks run against the live database:

```bash
python automation.py --task escalate   # auto-escalate overdue critical/high issues
python automation.py --task complete   # approve content where all 7 steps are done
python automation.py --task flag       # surface content blocked for more than N days
python automation.py --task report     # print weekly ops summary to stdout
```

All tasks support `--dry-run` to preview changes before committing.

---

## Local Setup

**Prerequisites:** Node.js 20+, Docker Desktop, Python 3.11+

```bash
# Install all dependencies
npm run install:all

# Start Postgres
docker-compose up postgres -d

# Configure environment
echo 'DATABASE_URL=postgresql://mediaops:mediaops_dev@localhost:5433/mediaops
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:5173' > backend/.env

# Run migrations and seed 300 records
sleep 4 && npm run db:reset

# Start backend + frontend
npm run dev
```

Frontend → `http://localhost:5173` · API → `http://localhost:3001` · Health → `http://localhost:3001/health`