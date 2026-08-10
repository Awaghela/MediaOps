import { pool, query } from './connection';

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
  'Starfall', 'Iron Resolve', 'The Long Game', 'Breaking Ground',
  'Into the Void', 'Last Stand', 'The Power Play', 'Undercurrent',
  'Catalyst', 'Meridian', 'The Circuit', 'Resonance',
  'Fallout Protocol', 'Zero Hour', 'Code Red', 'The Drift',
  'Firestorm', 'Apex Theory',
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
function futureDate(daysAhead: number) {
  const d = new Date(); d.setDate(d.getDate() + daysAhead); return d.toISOString().split('T')[0];
}
function pastDate(daysAgo: number) {
  const d = new Date(); d.setDate(d.getDate() - daysAgo); return d.toISOString().split('T')[0];
}
function slug(name: string) { return name.toLowerCase().replace(/[^a-z0-9]+/g, '-'); }

async function seed() {
  console.log('🌱 Seeding database...');

  await query('DELETE FROM status_history');
  await query('DELETE FROM workflow_steps');
  await query('DELETE FROM issues');
  await query('DELETE FROM content');
  await query('DELETE FROM partners');

  // Insert 20 partners
  const partnerIds: string[] = [];
  for (const p of PARTNERS) {
    const res = await query(
      `INSERT INTO partners (name, slug, tier, region, contact_email, contact_name, onboarding_status, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id`,
      [
        p.name, slug(p.name), p.tier, p.region,
        `ops@${slug(p.name)}.com`,
        rand(OWNERS),
        rand(ONBOARDING_STATUSES),
        Math.random() > 0.5 ? `Partner onboarded via ${rand(['direct','referral','agency'])} channel.` : null,
      ]
    );
    partnerIds.push(res.rows[0].id);
  }
  console.log(`  ✓ ${partnerIds.length} partners`);

  // Insert 300 content records (15 per partner)
  const contentIds: string[] = [];
  for (let i = 0; i < partnerIds.length; i++) {
    const partnerId = partnerIds[i];
    for (let j = 0; j < 15; j++) {
      const title = `${CONTENT_TITLES[j % CONTENT_TITLES.length]} ${j > 14 ? 'II' : ''}`;
      const status = rand(STATUSES);
      const blockers = status === 'blocked' ? randInt(1, 5) : 0;
      const res = await query(
        `INSERT INTO content (partner_id, title, content_type, genre, launch_date, status, priority, blocker_count)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id`,
        [
          partnerId, title, rand(CONTENT_TYPES), rand(GENRES),
          Math.random() > 0.3 ? (Math.random() > 0.5 ? futureDate(randInt(7, 180)) : pastDate(randInt(1, 90))) : null,
          status, rand(PRIORITIES), blockers,
        ]
      );
      contentIds.push(res.rows[0].id);
    }
  }
  console.log(`  ✓ ${contentIds.length} content records`);

  // Insert issues for ~60% of content
  let issueCount = 0;
  for (const contentId of contentIds) {
    if (Math.random() > 0.4) {
      const numIssues = randInt(1, 4);
      for (let k = 0; k < numIssues; k++) {
        const status = rand(ISSUE_STATUSES);
        await query(
          `INSERT INTO issues (content_id, partner_id, issue_type, severity, title, description, owner, status, notes, due_date, resolved_at)
           VALUES ($1,(SELECT partner_id FROM content WHERE id=$1),$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
          [
            contentId, rand(ISSUE_TYPES), rand(SEVERITIES),
            `${rand(ISSUE_TYPES).replace('_',' ')} issue for content`,
            `Detailed description of this issue requiring attention from the operations team.`,
            rand(OWNERS), status,
            Math.random() > 0.4 ? 'Follow-up needed with partner contact.' : null,
            Math.random() > 0.5 ? futureDate(randInt(1, 30)) : null,
            status === 'resolved' ? pastDate(randInt(1, 14)) : null,
          ]
        );
        issueCount++;
      }
    }
  }
  console.log(`  ✓ ${issueCount} issues`);

  // Insert workflow steps for all content
  let stepCount = 0;
  for (const contentId of contentIds) {
    for (let s = 0; s < STEP_NAMES.length; s++) {
      const done = Math.random() > 0.4;
      await query(
        `INSERT INTO workflow_steps (content_id, step_name, step_order, status, assigned_to, due_date, completed_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7)`,
        [
          contentId, STEP_NAMES[s], s + 1,
          done ? 'completed' : rand(['pending', 'in_progress', 'blocked']),
          rand(OWNERS),
          futureDate(randInt(s * 7, (s + 1) * 14)),
          done ? pastDate(randInt(1, 30)) : null,
        ]
      );
      stepCount++;
    }
  }
  console.log(`  ✓ ${stepCount} workflow steps`);

  // Status history for 35 workflow cases
  const entityIds = contentIds.slice(0, 35);
  for (const eid of entityIds) {
    const statuses = ['draft', 'in_review', 'approved', 'scheduled'];
    for (let i = 1; i < statuses.length; i++) {
      await query(
        `INSERT INTO status_history (entity_type, entity_id, old_status, new_status, changed_by, reason)
         VALUES ('content',$1,$2,$3,$4,$5)`,
        [eid, statuses[i - 1], statuses[i], rand(OWNERS), 'Status progression during onboarding']
      );
    }
  }
  console.log(`  ✓ 35 workflow status cases tracked`);

  console.log('\n✅ Seed complete!');
  await pool.end();
}

seed().catch((e) => { console.error(e); process.exit(1); });
