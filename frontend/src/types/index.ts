export type OnboardingStatus = 'pending' | 'in_progress' | 'review' | 'blocked' | 'completed';
export type ContentStatus = 'draft' | 'in_review' | 'approved' | 'scheduled' | 'live' | 'blocked' | 'cancelled';
export type IssueSeverity = 'critical' | 'high' | 'medium' | 'low';
export type IssueStatus = 'open' | 'in_progress' | 'resolved' | 'wont_fix' | 'escalated';
export type WorkflowStatus = 'pending' | 'in_progress' | 'completed' | 'blocked' | 'skipped';
export type PartnerTier = 'premium' | 'standard' | 'basic';
export type Priority = 'critical' | 'high' | 'medium' | 'low';

export interface Partner {
  id: string;
  name: string;
  slug: string;
  tier: PartnerTier;
  region: string;
  contact_email?: string;
  contact_name?: string;
  onboarding_status: OnboardingStatus;
  notes?: string;
  content_count?: number;
  open_issues?: number;
  blocked_count?: number;
  created_at: string;
  updated_at: string;
}

export interface Content {
  id: string;
  partner_id: string;
  partner_name?: string;
  partner_tier?: PartnerTier;
  title: string;
  content_type: string;
  genre?: string;
  launch_date?: string;
  status: ContentStatus;
  priority: Priority;
  blocker_count: number;
  steps_total?: number;
  steps_done?: number;
  issue_count?: number;
  created_at: string;
  updated_at: string;
}

export interface Issue {
  id: string;
  content_id?: string;
  partner_id: string;
  partner_name?: string;
  content_title?: string;
  issue_type: string;
  severity: IssueSeverity;
  title: string;
  description?: string;
  owner?: string;
  status: IssueStatus;
  notes?: string;
  due_date?: string;
  resolved_at?: string;
  created_at: string;
  updated_at: string;
}

export interface WorkflowStep {
  id: string;
  content_id: string;
  step_name: string;
  step_order: number;
  status: WorkflowStatus;
  assigned_to?: string;
  due_date?: string;
  completed_at?: string;
  notes?: string;
}

export interface DashboardStats {
  totalPartners: number;
  totalContent: number;
  openIssues: number;
  criticalIssues: number;
  blockedContent: number;
  liveContent: number;
  completedOnboarding: number;
  avgWorkflowCompletion: number;
  recentActivity: Array<{ id: string; entity_type: string; entity_name: string; new_status: string; timestamp: string }>;
  statusBreakdown: Array<{ status: string; count: number }>;
  contentByType: Array<{ content_type: string; count: number }>;
  issuesByType: Array<{ issue_type: string; count: number }>;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}
