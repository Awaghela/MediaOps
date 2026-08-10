import { Request, Response } from 'express';
import { query } from '../db/connection';

export async function getIssues(req: Request, res: Response) {
  try {
    const { search, status, severity, issue_type, owner, partner_id, page = 1, limit = 20 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);
    const conditions: string[] = [];
    const params: unknown[] = [];
    let idx = 1;

    if (search) { conditions.push(`(i.title ILIKE $${idx} OR i.description ILIKE $${idx})`); params.push(`%${search}%`); idx++; }
    if (status) { conditions.push(`i.status = $${idx}`); params.push(status); idx++; }
    if (severity) { conditions.push(`i.severity = $${idx}`); params.push(severity); idx++; }
    if (issue_type) { conditions.push(`i.issue_type = $${idx}`); params.push(issue_type); idx++; }
    if (owner) { conditions.push(`i.owner ILIKE $${idx}`); params.push(`%${owner}%`); idx++; }
    if (partner_id) { conditions.push(`i.partner_id = $${idx}`); params.push(partner_id); idx++; }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const [dataRes, countRes] = await Promise.all([
      query(`
        SELECT i.*, p.name as partner_name, c.title as content_title
        FROM issues i
        JOIN partners p ON p.id = i.partner_id
        LEFT JOIN content c ON c.id = i.content_id
        ${where}
        ORDER BY
          CASE i.severity WHEN 'critical' THEN 1 WHEN 'high' THEN 2 WHEN 'medium' THEN 3 ELSE 4 END,
          i.created_at DESC
        LIMIT $${idx} OFFSET $${idx + 1}
      `, [...params, limit, offset]),
      query(`SELECT COUNT(*) FROM issues i ${where}`, params),
    ]);

    res.json({ data: dataRes.rows, total: parseInt(countRes.rows[0].count), page: Number(page), limit: Number(limit) });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch issues' });
  }
}

export async function createIssue(req: Request, res: Response) {
  try {
    const { partner_id, content_id, issue_type, severity, title, description, owner, notes, due_date } = req.body;
    const result = await query(
      `INSERT INTO issues (partner_id, content_id, issue_type, severity, title, description, owner, notes, due_date)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
      [partner_id, content_id, issue_type, severity, title, description, owner, notes, due_date]
    );
    if (content_id) {
      await query(`UPDATE content SET blocker_count = blocker_count + 1 WHERE id=$1`, [content_id]);
    }
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create issue' });
  }
}

export async function updateIssue(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { status, notes, owner, severity, due_date } = req.body;
    const updated = await query(
      `UPDATE issues SET
         status=COALESCE($2,status), notes=COALESCE($3,notes), owner=COALESCE($4,owner),
         severity=COALESCE($5,severity), due_date=COALESCE($6,due_date),
         resolved_at=CASE WHEN $2='resolved' THEN NOW() ELSE resolved_at END
       WHERE id=$1 RETURNING *`,
      [id, status, notes, owner, severity, due_date]
    );
    if (!updated.rows[0]) return res.status(404).json({ error: 'Issue not found' });
    res.json(updated.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update issue' });
  }
}

export async function getReportByPartner(req: Request, res: Response) {
  try {
    const { partnerId } = req.params;
    const [summary, issueBreakdown, workflowHealth] = await Promise.all([
      query(`
        SELECT p.name, p.tier, p.onboarding_status,
          COUNT(DISTINCT c.id)::int as total_content,
          COUNT(DISTINCT c.id) FILTER (WHERE c.status='live')::int as live_content,
          COUNT(DISTINCT c.id) FILTER (WHERE c.status='blocked')::int as blocked_content,
          COUNT(DISTINCT i.id) FILTER (WHERE i.status NOT IN ('resolved','wont_fix'))::int as open_issues,
          COUNT(DISTINCT i.id) FILTER (WHERE i.severity='critical')::int as critical_issues
        FROM partners p
        LEFT JOIN content c ON c.partner_id=p.id
        LEFT JOIN issues i ON i.partner_id=p.id
        WHERE p.id=$1 GROUP BY p.id`, [partnerId]),
      query(`SELECT issue_type, severity, COUNT(*)::int as count FROM issues WHERE partner_id=$1 GROUP BY issue_type, severity ORDER BY count DESC`, [partnerId]),
      query(`
        SELECT ws.step_name,
          ROUND(100.0*COUNT(*) FILTER (WHERE ws.status='completed') / NULLIF(COUNT(*),0), 1) as completion_pct
        FROM workflow_steps ws JOIN content c ON ws.content_id=c.id
        WHERE c.partner_id=$1 GROUP BY ws.step_name ORDER BY MIN(ws.step_order)`, [partnerId]),
    ]);
    res.json({ summary: summary.rows[0], issueBreakdown: issueBreakdown.rows, workflowHealth: workflowHealth.rows });
  } catch (err) {
    res.status(500).json({ error: 'Failed to generate report' });
  }
}
