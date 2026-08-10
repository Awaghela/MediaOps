import { Request, Response } from 'express';
import { query } from '../db/connection';

export async function getStats(req: Request, res: Response) {
  try {
    const [
      partnersRes, contentRes, issuesRes, criticalRes,
      blockedRes, liveRes, completedRes, workflowRes, activityRes,
      statusBreakdown, contentByType, issuesByType,
    ] = await Promise.all([
      query('SELECT COUNT(*) FROM partners'),
      query('SELECT COUNT(*) FROM content'),
      query("SELECT COUNT(*) FROM issues WHERE status IN ('open','in_progress','escalated')"),
      query("SELECT COUNT(*) FROM issues WHERE severity='critical' AND status NOT IN ('resolved','wont_fix')"),
      query("SELECT COUNT(*) FROM content WHERE status='blocked'"),
      query("SELECT COUNT(*) FROM content WHERE status='live'"),
      query("SELECT COUNT(*) FROM partners WHERE onboarding_status='completed'"),
      query(`SELECT ROUND(AVG(completion)::numeric,1) as avg_completion FROM (
        SELECT content_id,
          ROUND(100.0 * COUNT(*) FILTER (WHERE status='completed') / NULLIF(COUNT(*),0), 1) as completion
        FROM workflow_steps GROUP BY content_id
      ) t`),
      query(`
        SELECT sh.id, sh.entity_type, sh.new_status,
               COALESCE(p.name, c.title) as entity_name, sh.changed_at as timestamp
        FROM status_history sh
        LEFT JOIN partners p ON sh.entity_type='partner' AND sh.entity_id=p.id
        LEFT JOIN content c ON sh.entity_type='content' AND sh.entity_id=c.id
        ORDER BY sh.changed_at DESC LIMIT 10
      `),
      query(`SELECT onboarding_status as status, COUNT(*)::int as count FROM partners GROUP BY onboarding_status`),
      query(`SELECT content_type, COUNT(*)::int as count FROM content GROUP BY content_type ORDER BY count DESC`),
      query(`SELECT issue_type, COUNT(*)::int as count FROM issues WHERE status != 'resolved' GROUP BY issue_type ORDER BY count DESC LIMIT 5`),
    ]);

    res.json({
      totalPartners: parseInt(partnersRes.rows[0].count),
      totalContent: parseInt(contentRes.rows[0].count),
      openIssues: parseInt(issuesRes.rows[0].count),
      criticalIssues: parseInt(criticalRes.rows[0].count),
      blockedContent: parseInt(blockedRes.rows[0].count),
      liveContent: parseInt(liveRes.rows[0].count),
      completedOnboarding: parseInt(completedRes.rows[0].count),
      avgWorkflowCompletion: parseFloat(workflowRes.rows[0]?.avg_completion || '0'),
      recentActivity: activityRes.rows,
      statusBreakdown: statusBreakdown.rows,
      contentByType: contentByType.rows,
      issuesByType: issuesByType.rows,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch dashboard stats' });
  }
}

export async function getTimeline(req: Request, res: Response) {
  try {
    const result = await query(`
      SELECT DATE_TRUNC('week', created_at)::date as week,
             COUNT(*) FILTER (WHERE status = 'live') as live_count,
             COUNT(*) FILTER (WHERE status = 'blocked') as blocked_count,
             COUNT(*) as total_count
      FROM content
      WHERE created_at > NOW() - INTERVAL '12 weeks'
      GROUP BY week ORDER BY week ASC
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch timeline' });
  }
}
