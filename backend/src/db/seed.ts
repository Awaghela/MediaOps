import { pool } from './connection';

const PARTNERS = [
  { name: 'Apex Studios', region: 'North America', tier: 'premium' },
  { name: 'Blue Horizon Media', region: 'Europe', tier: 'premium' },
  { name: 'Crestline Entertainment', region: 'Asia Pacific', tier: 'standard' },
  { name: 'Dawnbreak Films', region: 'Latin America', tier: 'standard' },
  { name: 'Echo Point Productions', region: 'North America', tier: 'basic' },
  { name: 'Frontier Digital', region: 'Europe', tier: 'premium' },
  { name: 'Goldwing Media', region: 'Middle East', tier: 'standard' },
  { name: 'Harbor Light Studios', region: 'North America', tier: 'basic' },
  { name: 'Ironclad Entertainment', region: 'Asia Pacific', tier: 'premium' },
  { name: 'Jade River Films', region: 'Asia Pacific', tier: 'standard' },
  { name: 'Keystone Productions', region: 'Europe', tier: 'standard' },
  { name: 'Lunar Arc Media', region: 'North America', tier: 'premium' },
  { name: 'Meridian Pictures', region: 'Africa', tier: 'basic' },
  { name: 'Northgate Studios', region: 'Europe', tier: 'standard' },
  { name: 'Orbit Media Group', region: 'Latin America', tier: 'basic' },
  { name: 'Pinnacle Content', region: 'North America', tier: 'premium' },
  { name: 'Quartz Stream', region: 'Asia Pacific', tier: 'standard' },
  { name: 'Redstone Films', region: 'Europe', tier: 'basic' },
  { name: 'Skyfall Productions', region: 'Middle East', tier: 'premium' },
  { name: 'Titan Media Works', region: 'North America', tier: 'standard' },
];

const CONTENT_TITLES = [
  'The Last Signal', 'Midnight Protocol', 'Edge of Tomorrow', 'Dark Waters Rising',
  'Neon City Chronicles', 'The Final Frontier', 'Beneath the Surface', 'Crimson Dawn',
  'The Quantum Files', 'Shadow Protocol', 'Beyond Limits', 'The Reckoning',
  'Starfall', 'Iron Resolve', 'The Long Game',
];

const CONTENT_TYPES = ['series', 'movie', 'documentary', 'short', 'live_event', 'podcast'];
const GENRES = ['Drama', 'Thriller', 'Action', 'Documentary', 'Comedy', 'Sci-Fi', 'Crime', 'Reality'];
const STATUSES = ['draft', 'in_review', 'approved', 'scheduled', 'live', 'blocked', 'cancelled'];
const ONBOARDING_STATUSES = ['pending', 'in_progress', 'review', 'blocked', 'completed'];
const PRIORITIES = ['critical', 'high', 'medium', 'low'];
const ISSUE_TYPES = ['metadata', 'rights', 'technical', 'legal', 'content_quality', 'scheduling', 'billing', 'escalation'];
const ISSUE_STATUSES = ['open', 'in_progress', 'resolved', 'escalated'];
const SEVERITIES = ['critical', 'high', 'medium', 'low'];
const OWNERS = ['Alex Chen', 'Sarah Kim', 'Marcus Johnson', 'Priya Patel', 'Tom Nguyen', 'Lisa Park', 'James Wilson', 'Emma Davis'];
const STEP_NAMES = ['Metadata Review', 'Rights Clearance', 'Quality Check', 'Legal Approval', 'Scheduling', 'Technical Encoding', 'Final Publish'];

function rand<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)]; }
function randInt(min: number, max: number) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function futureDate(d: number) { const dt = new Date(); dt.setDate(dt.getDate() + d); return dt.toISOString().split('T')[0]; }
function pastDate(d: number) { const dt = new Date(); dt.setDate(dt.getDate() - d); return dt.toISOString().split('T')[0]; }
function slug(name: string) { return name.toLowerCase().replace(/[^a-z0-9]+/g, '-'); }

// Build VALUES string for bulk insert: ($1,$2,...),($n+1,$n+2,...) 
function buildValues(rows: unknown[][], colCount: number): [string, unknown[]] {
  const flat: unknown[] = [];
  const placeholders = rows.map((row, i) => {
    const start = i * colCount + 1;
    row.forEach(v => flat.push(v));
    return '(' + Array.from({ length: colCount }, (_, j) => `$${start + j}`).join(',') + ')';
  });
  return [placeholders.join(','), flat];
}

async function seed() {
  const client = await pool.connect();
  console.log('🌱 Seeding database (bulk mode)...');

  try {
    await client.query('BEGIN');
    await client.query('DELETE FROM status_history');
    await client.query('DELETE FROM workflow_steps');
    await client.query('DELETE FROM issues');
    await client.query('DELETE FROM content');
    await client.query('DELETE FROM partners');

    // ── Partners (20 rows, 1 query) ──────────────────────────────────────
    const partnerRows = PARTNERS.map(p => [
      p.name, slug(p.name), p.tier, p.region,
      `ops@${slug(p.name)}.com`, rand(OWNERS), rand(ONBOARDING_STATUSES),
      Math.random() > 0.5 ? `Onboarded via ${rand(['direct','referral','agency'])} channel.` : null,
    ]);
    const [pVals, pFlat] = buildValues(partnerRows, 8);
    const partnerRes = await client.query(
      `INSERT INTO partners (name, slug, tier, region, contact_email, contact_name, onboarding_status, notes)
       VALUES ${pVals} RETURNING id`,
      pFlat
    );
    const partnerIds = partnerRes.rows.map((r: { id: string }) => r.id);
    console.log(`  ✓ ${partnerIds.length} partners`);

    // ── Content (300 rows, 1 query) ──────────────────────────────────────
    const contentRows: unknown[][] = [];
    for (const pid of partnerIds) {
      for (let j = 0; j < 15; j++) {
        const status = rand(STATUSES);
        contentRows.push([
          pid,
          CONTENT_TITLES[j % CONTENT_TITLES.length],
          rand(CONTENT_TYPES), rand(GENRES),
          Math.random() > 0.3 ? (Math.random() > 0.5 ? futureDate(randInt(7,180)) : pastDate(randInt(1,90))) : null,
          status, rand(PRIORITIES),
          status === 'blocked' ? randInt(1,5) : 0,
        ]);
      }
    }
    const [cVals, cFlat] = buildValues(contentRows, 8);
    const contentRes = await client.query(
      `INSERT INTO content (partner_id, title, content_type, genre, launch_date, status, priority, blocker_count)
       VALUES ${cVals} RETURNING id`,
      cFlat
    );
    const contentIds = contentRes.rows.map((r: { id: string }) => r.id);
    console.log(`  ✓ ${contentIds.length} content records`);

    // ── Issues (~500 rows, 1 query) ──────────────────────────────────────
    // Pre-fetch partner_ids for content in one query
    const contentPartnerMap: Record<string, string> = {};
    const cpRes = await client.query('SELECT id, partner_id FROM content');
    for (const row of cpRes.rows) contentPartnerMap[row.id] = row.partner_id;

    const issueRows: unknown[][] = [];
    for (const cid of contentIds) {
      if (Math.random() > 0.4) {
        for (let k = 0; k < randInt(1, 3); k++) {
          const status = rand(ISSUE_STATUSES);
          issueRows.push([
            cid, contentPartnerMap[cid],
            rand(ISSUE_TYPES), rand(SEVERITIES),
            `${rand(ISSUE_TYPES).replace('_',' ')} issue`,
            'Requires ops team review and partner coordination.',
            rand(OWNERS), status,
            Math.random() > 0.4 ? 'Follow-up needed.' : null,
            Math.random() > 0.5 ? futureDate(randInt(1,30)) : null,
            status === 'resolved' ? pastDate(randInt(1,14)) : null,
          ]);
        }
      }
    }
    const [iVals, iFlat] = buildValues(issueRows, 11);
    await client.query(
      `INSERT INTO issues (content_id, partner_id, issue_type, severity, title, description, owner, status, notes, due_date, resolved_at)
       VALUES ${iVals}`,
      iFlat
    );
    console.log(`  ✓ ${issueRows.length} issues`);

    // ── Workflow steps (2100 rows, batched in 7 queries, 1 per step) ─────
    for (let s = 0; s < STEP_NAMES.length; s++) {
      const stepRows = contentIds.map(cid => {
        const done = Math.random() > 0.4;
        return [
          cid, STEP_NAMES[s], s + 1,
          done ? 'completed' : rand(['pending','in_progress','blocked']),
          rand(OWNERS),
          futureDate(randInt(s * 7, (s + 1) * 14)),
          done ? pastDate(randInt(1,30)) : null,
        ];
      });
      const [wVals, wFlat] = buildValues(stepRows, 7);
      await client.query(
        `INSERT INTO workflow_steps (content_id, step_name, step_order, status, assigned_to, due_date, completed_at)
         VALUES ${wVals}`,
        wFlat
      );
    }
    console.log(`  ✓ ${contentIds.length * STEP_NAMES.length} workflow steps`);

    // ── Status history (35 cases, 1 query) ───────────────────────────────
    const histRows: unknown[][] = [];
    const wfStatuses = ['draft','in_review','approved','scheduled'];
    for (const cid of contentIds.slice(0,35)) {
      for (let i = 1; i < wfStatuses.length; i++) {
        histRows.push(['content', cid, wfStatuses[i-1], wfStatuses[i], rand(OWNERS), 'Status progression during onboarding']);
      }
    }
    const [hVals, hFlat] = buildValues(histRows, 6);
    await client.query(
      `INSERT INTO status_history (entity_type, entity_id, old_status, new_status, changed_by, reason)
       VALUES ${hVals}`,
      hFlat
    );
    console.log(`  ✓ 35 workflow status cases`);

    await client.query('COMMIT');
    console.log('\n✅ Seed complete!');
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
    await pool.end();
  }
}

seed().catch((e) => { console.error(e); process.exit(1); });
