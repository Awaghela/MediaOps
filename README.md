# MediaOps — Internal Operations Dashboard

A full-stack operations dashboard for tracking partner onboarding status, content launch blockers, issue ownership, troubleshooting notes, and workflow progress.

## Tech Stack

| Layer      | Technology                          |
|------------|-------------------------------------|
| Frontend   | React 18, TypeScript, Vite, Tailwind CSS, Recharts, Framer Motion |
| Backend    | Node.js, Express, TypeScript        |
| Database   | PostgreSQL 16                       |
| Automation | Python 3.11, psycopg2               |
| Infra      | Docker, Railway (backend), Vercel (frontend) |

---

## Project Structure

```
mediaops/
├── backend/
│   ├── src/
│   │   ├── controllers/        # Business logic (dashboard, partners, content, issues)
│   │   ├── db/
│   │   │   ├── connection.ts   # pg Pool + query helper
│   │   │   ├── migrate.ts      # Schema migrations (run once)
│   │   │   └── seed.ts         # 300 partner-content records, 35 workflow cases
│   │   ├── routes/index.ts     # 15 REST endpoints
│   │   ├── types/index.ts      # Shared TS interfaces
│   │   └── index.ts            # Express server
│   ├── Dockerfile
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── api/client.ts       # Axios API layer
│   │   ├── components/
│   │   │   ├── layout/         # Sidebar, Header, AppLayout
│   │   │   └── ui/             # StatCard, StatusBadge, ProgressBar, Skeleton, Toast
│   │   ├── pages/
│   │   │   ├── Dashboard.tsx   # KPI cards + 5 charts
│   │   │   ├── Partners.tsx    # Searchable partner table
│   │   │   ├── PartnerDetail.tsx  # Drill-down: content, issues, workflow tabs
│   │   │   ├── ContentPage.tsx # Expandable content cards
│   │   │   ├── Issues.tsx      # Issue grid + edit modal
│   │   │   ├── Workflow.tsx    # Per-content step timelines
│   │   │   └── Reports.tsx     # Partner analytics + charts
│   │   ├── types/index.ts
│   │   └── utils/status.ts     # Status color maps + formatters
│   ├── Dockerfile
│   ├── nginx.conf
│   └── vercel.json
│
├── scripts/
│   ├── seed_data.py            # Bulk-insert 300 records via psycopg2
│   ├── automation.py           # Escalation, auto-approval, stale flags, weekly report
│   └── requirements.txt
│
├── docker-compose.yml
├── railway.toml
└── .github/workflows/ci.yml
```

---

## Database Schema

```sql
partners          id, name, slug, tier, region, contact_*, onboarding_status, notes
content           id, partner_id, title, content_type, genre, launch_date, status, priority, blocker_count
issues            id, content_id, partner_id, issue_type, severity, title, owner, status, due_date
workflow_steps    id, content_id, step_name, step_order, status, assigned_to, due_date, completed_at
status_history    id, entity_type, entity_id, old_status, new_status, changed_by, reason
```

**Metrics achieved:**
- ✅ 300 partner-content records (20 partners × 15 content each)
- ✅ 35 workflow status-change cases tracked in `status_history`
- ✅ Full issue lifecycle: open → in_progress → escalated / resolved
- ✅ 7-step workflow pipeline per content item

---

## Quick Start (Local)

### Prerequisites
- Node.js 20+, Docker Desktop, Python 3.11+

```bash
# 1. Clone and install
git clone https://github.com/you/mediaops
cd mediaops
npm run install:all

# 2. Start Postgres via Docker
npm run docker:up

# 3. Migrate + seed (TypeScript seeder)
cp backend/.env.example backend/.env
npm run db:reset

# 4. Start dev servers (runs both concurrently)
npm run dev
# → Backend:  http://localhost:3001
# → Frontend: http://localhost:5173
```

### Python Seeder (alternative)
```bash
cd scripts
pip install -r requirements.txt
DATABASE_URL=postgresql://mediaops:mediaops_dev@localhost:5432/mediaops python seed_data.py
```

### Automation Scripts
```bash
cd scripts
# Dry-run all automation tasks
python automation.py --dry-run --task all

# Run a specific task
python automation.py --task escalate     # escalate overdue critical issues
python automation.py --task complete     # auto-approve fully-completed content
python automation.py --task flag --days 7 # flag content blocked > 7 days
python automation.py --task report       # print weekly summary
```

---

## API Endpoints

| Method | Path                          | Description                    |
|--------|-------------------------------|--------------------------------|
| GET    | `/health`                     | Health check                   |
| GET    | `/api/dashboard/stats`        | All KPI metrics + charts data  |
| GET    | `/api/dashboard/timeline`     | Weekly launch activity         |
| GET    | `/api/partners`               | Partners list (filter, search, paginate) |
| POST   | `/api/partners`               | Create partner                 |
| GET    | `/api/partners/:id`           | Partner detail + content + issues |
| PATCH  | `/api/partners/:id`           | Update onboarding status, notes |
| GET    | `/api/content`                | Content list (filter, search, paginate) |
| PATCH  | `/api/content/:id`            | Update status, priority        |
| GET    | `/api/content/:id/workflow`   | Steps for a content item       |
| PATCH  | `/api/workflow/:id`           | Update step status             |
| GET    | `/api/issues`                 | Issues list (filter, search)   |
| POST   | `/api/issues`                 | Create issue                   |
| PATCH  | `/api/issues/:id`             | Resolve / update issue         |
| GET    | `/api/reports/partner/:id`    | Partner-level analytics        |

All list endpoints support `?search=&status=&page=&limit=`.

---

## Deployment

### Railway (Backend + DB)

1. Push to GitHub
2. New Railway project → **Deploy from GitHub repo**
3. Add **PostgreSQL** plugin → Railway auto-sets `DATABASE_URL`
4. Set environment variables:
   ```
   NODE_ENV=production
   FRONTEND_URL=https://your-app.vercel.app
   PORT=3001
   ```
5. Railway uses `backend/Dockerfile` automatically
6. After first deploy, run migrations via Railway CLI:
   ```bash
   railway run --service backend npm run db:migrate
   railway run --service backend npm run db:seed
   ```

### Vercel (Frontend)

```bash
cd frontend
npx vercel --prod
# Set env variable: VITE_API_URL=https://your-backend.railway.app
```

Or connect the repo in Vercel dashboard:
- Root Directory: `frontend`
- Build Command: `npm run build`
- Output Directory: `dist`
- Env: `VITE_API_URL=https://your-backend.railway.app`

### CI/CD Secrets (GitHub Actions)

| Secret             | Description                     |
|--------------------|---------------------------------|
| `RAILWAY_TOKEN`    | Railway project token           |
| `VERCEL_TOKEN`     | Vercel auth token               |
| `VERCEL_ORG_ID`    | Vercel org ID                   |
| `VERCEL_PROJECT_ID`| Vercel project ID               |
| `VITE_API_URL`     | Backend URL for production build |

---

## UI Design System

| Token    | Value      | Usage                      |
|----------|------------|----------------------------|
| Base     | `#080C18`  | Page background            |
| Surface  | `#141830`  | Cards                      |
| Elevated | `#1C2240`  | Hover / elevated surfaces  |
| Violet   | `#6C5FDE`  | Primary accent             |
| Cyan     | `#22EDD8`  | Success / live             |
| Rose     | `#FF4D6D`  | Errors / critical          |
| Amber    | `#FFD166`  | Warnings / pending         |
| Text     | `#CCD6F6`  | Primary text               |
| Muted    | `#8892B0`  | Secondary text             |
| Ghost    | `#4A5580`  | Placeholder / disabled     |

Animation: `float-up` entrance, count-up stat cards, shimmer skeletons, progress bar transitions.
