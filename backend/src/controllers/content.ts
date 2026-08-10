import { Request, Response } from 'express';
import { query } from '../db/connection';

export async function getContent(req: Request, res: Response) {
  try {
    const { search, status, priority, partner_id, page = 1, limit = 20 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);
    const conditions: string[] = [];
    const params: unknown[] = [];
    let idx = 1;

    if (search) { conditions.push(`c.title ILIKE $${idx}`); params.push(`%${search}%`); idx++; }
    if (status) { conditions.push(`c.status = $${idx}`); params.push(status); idx++; }
    if (priority) { conditions.push(`c.priority = $${idx}`); params.push(priority); idx++; }
    if (partner_id) { conditions.push(`c.partner_id = $${idx}`); params.push(partner_id); idx++; }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const [dataRes, countRes] = await Promise.all([
      query(`
        SELECT c.*, p.name as partner_name, p.tier as partner_tier,
          COUNT(ws.id)::int as steps_total,
          COUNT(ws.id) FILTER (WHERE ws.status='completed')::int as steps_done,
          COUNT(i.id) FILTER (WHERE i.status NOT IN ('resolved','wont_fix'))::int as issue_count
        FROM content c
        JOIN partners p ON p.id = c.partner_id
        LEFT JOIN workflow_steps ws ON ws.content_id = c.id
        LEFT JOIN issues i ON i.content_id = c.id
        ${where}
        GROUP BY c.id, p.name, p.tier
        ORDER BY c.priority DESC, c.created_at DESC
        LIMIT $${idx} OFFSET $${idx + 1}
      `, [...params, limit, offset]),
      query(`SELECT COUNT(*) FROM content c ${where}`, params),
    ]);

    res.json({ data: dataRes.rows, total: parseInt(countRes.rows[0].count), page: Number(page), limit: Number(limit) });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch content' });
  }
}

export async function updateContent(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { status, priority, launch_date, notes } = req.body;

    const current = await query('SELECT * FROM content WHERE id=$1', [id]);
    if (!current.rows[0]) return res.status(404).json({ error: 'Not found' });

    if (status && current.rows[0].status !== status) {
      await query(
        `INSERT INTO status_history (entity_type, entity_id, old_status, new_status, changed_by)
         VALUES ('content',$1,$2,$3,'api')`,
        [id, current.rows[0].status, status]
      );
    }

    const updated = await query(
      `UPDATE content SET
         status = COALESCE($2, status),
         priority = COALESCE($3, priority),
         launch_date = COALESCE($4, launch_date),
         blocker_count = CASE WHEN $2='blocked' THEN blocker_count+1 WHEN $2='live' THEN 0 ELSE blocker_count END
       WHERE id=$1 RETURNING *`,
      [id, status, priority, launch_date]
    );
    res.json(updated.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update content' });
  }
}

export async function getWorkflow(req: Request, res: Response) {
  try {
    const { contentId } = req.params;
    const steps = await query(
      'SELECT * FROM workflow_steps WHERE content_id=$1 ORDER BY step_order', [contentId]
    );
    res.json(steps.rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch workflow' });
  }
}

export async function updateWorkflowStep(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { status, assigned_to, notes, due_date } = req.body;
    const updated = await query(
      `UPDATE workflow_steps SET
         status=COALESCE($2,status), assigned_to=COALESCE($3,assigned_to),
         notes=COALESCE($4,notes), due_date=COALESCE($5,due_date),
         completed_at=CASE WHEN $2='completed' THEN NOW() ELSE completed_at END
       WHERE id=$1 RETURNING *`,
      [id, status, assigned_to, notes, due_date]
    );
    res.json(updated.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update workflow step' });
  }
}
