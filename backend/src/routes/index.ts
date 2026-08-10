import { Router } from 'express';
import { getStats, getTimeline } from '../controllers/dashboard';
import { getPartners, getPartner, createPartner, updatePartner } from '../controllers/partners';
import { getContent, updateContent, getWorkflow, updateWorkflowStep } from '../controllers/content';
import { getIssues, createIssue, updateIssue, getReportByPartner } from '../controllers/issues';

const router = Router();

// Dashboard
router.get('/dashboard/stats', getStats);
router.get('/dashboard/timeline', getTimeline);

// Partners
router.get('/partners', getPartners);
router.post('/partners', createPartner);
router.get('/partners/:id', getPartner);
router.patch('/partners/:id', updatePartner);

// Reports
router.get('/reports/partner/:partnerId', getReportByPartner);

// Content
router.get('/content', getContent);
router.patch('/content/:id', updateContent);
router.get('/content/:contentId/workflow', getWorkflow);
router.patch('/workflow/:id', updateWorkflowStep);

// Issues
router.get('/issues', getIssues);
router.post('/issues', createIssue);
router.patch('/issues/:id', updateIssue);

export default router;
