import { Request, Response } from 'express';
import { query } from '../db/connection';

export async function getPartners(req: Request, res: Response) {
  try {
    const { search, status, tier, page = 1, limit = 20, sort = 'created_at', order = 'desc' } = req.query;
    const offset = (Number(page) - 1) * Number(limit);
    const conditions: string[] = [];
    const params: unknown[] = [];
    let idx = 1;

    if (search) {
      conditions.push(`(p.name ILIKE $${idx} OR p.region ILIKE $${idx} OR p.contact_email ILIKE $${idx})`);
      params.push(`%${search}%`); idx++;
    }
    if (status) { conditions.push(`p.onboarding_status = $${idx}`); params.push(status); idx++; }
    if (tier) { conditions.push(`p.tier = $${idx}`); params.push(tier); idx++; }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const allowed = ['created_at', 'name', 'tier', 'onboarding_status', 'updated_at'];
    const sortCol = allowed.includes(sort as string) ? sort : 'created_at';
    const sortOrder = order === 'asc' ? 'ASC' : 'DESC';

    const [dataRes, countRes] = await Promise.all([
      query(`
        SELECT p.*,
          COUNT(DISTINCT c.id)::int as content_count,
          COUNT(DISTINCT i.id) FILTER (WHERE i.status NOT IN ('resolved','wont_fix'))::int as open_issues,
          COUNT(DISTINCT c.id) FILTER (WHERE c.status = 'blocked')::int as blocked_count
        FROM partners p
        LEFT JOIN content c ON c.partner_id = p.id
        LEFT JOIN issues i ON i.partner_id = p.id
        ${where}
        GROUP BY p.id
        ORDER BY p.${sortCol} ${sortOrder}
        LIMIT $${idx} OFFSET $${idx + 1}
      `, [...params, limit, offset]),
      query(`SELECT COUNT(*) FROM partners p ${where}`, params),
    ]);

    res.json({
      data: dataRes.rows,
      total: parseInt(countRes.rows[0].count),
      page: Number(page),
      limit: Number(limit),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch partners' });
  }
}

export async function getPartner(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const [partnerRes, contentRes, issuesRes, workflowRes] = await Promise.all([
      query('SELECT * FROM partners WHERE id = $1', [id]),
      query(`SELECT c.*, COUNT(ws.id) FILTER (WHERE ws.status='completed')::int as steps_done,
               COUNT(ws.id)::int as steps_total
             FROM content c LEFT JOIN workflow_steps ws ON ws.content_id=c.id
             WHERE c.partner_id=$1 GROUP BY c.id ORDER BY c.created_at DESC LIMIT 20`, [id]),
      query(`SELECT * FROM issues WHERE partner_id=$1 ORDER BY severity DESC, created_at DESC LIMIT 20`, [id]),
      query(`SELECT step_name, status, COUNT(*)::int as count
             FROM workflow_steps ws JOIN content c ON ws.content_id=c.id
             WHERE c.partner_id=$1 GROUP BY step_name, status`, [id]),
    ]);
    if (!partnerRes.rows[0]) return res.status(404).json({ error: 'Partner not found' });
    res.json({ partner: partnerRes.rows[0], content: contentRes.rows, issues: issuesRes.rows, workflow: workflowRes.rows });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch partner' });
  }
}

export async function createPartner(req: Request, res: Response) {
  try {
    const { name, tier, region, contact_email, contact_name, notes } = req.body;
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Date.now();
    const res2 = await query(
      `INSERT INTO partners (name, slug, tier, region, contact_email, contact_name, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [name, slug, tier || 'standard', region, contact_email, contact_name, notes]
    );
    res.status(201).json(res2.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create partner' });
  }
}

export async function updatePartner(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { onboarding_status, notes, contact_email, contact_name, tier } = req.body;

    const current = await query('SELECT * FROM partners WHERE id=$1', [id]);
    if (!current.rows[0]) return res.status(404).json({ error: 'Not found' });

    if (onboarding_status && current.rows[0].onboarding_status !== onboarding_status) {
      await query(
        `INSERT INTO status_history (entity_type, entity_id, old_status, new_status, changed_by)
         VALUES ('partner',$1,$2,$3,'api')`,
        [id, current.rows[0].onboarding_status, onboarding_status]
      );
    }

    const updated = await query(
      `UPDATE partners SET
         onboarding_status = COALESCE($2, onboarding_status),
         notes = COALESCE($3, notes),
         contact_email = COALESCE($4, contact_email),
         contact_name = COALESCE($5, contact_name),
         tier = COALESCE($6, tier)
       WHERE id=$1 RETURNING *`,
      [id, onboarding_status, notes, contact_email, contact_name, tier]
    );
    res.json(updated.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update partner' });
  }
}
