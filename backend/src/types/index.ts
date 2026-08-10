export interface Partner {
  id: string;
  name: string;
  slug: string;
  tier: 'premium' | 'standard' | 'basic';
  region: string;
  contact_email?: string;
  contact_name?: string;
  onboarding_status: 'pending' | 'in_progress' | 'review' | 'blocked' | 'completed';
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface Content {
  id: string;
  partner_id: string;
  title: string;
  content_type: 'series' | 'movie' | 'documentary' | 'short' | 'live_event' | 'podcast';
  genre?: string;
  launch_date?: string;
  status: 'draft' | 'in_review' | 'approved' | 'scheduled' | 'live' | 'blocked' | 'cancelled';
  priority: 'critical' | 'high' | 'medium' | 'low';
  blocker_count: number;
  metadata?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface Issue {
  id: string;
  content_id?: string;
  partner_id: string;
  issue_type: 'metadata' | 'rights' | 'technical' | 'legal' | 'content_quality' | 'scheduling' | 'billing' | 'escalation';
  severity: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  description?: string;
  owner?: string;
  status: 'open' | 'in_progress' | 'resolved' | 'wont_fix' | 'escalated';
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
  status: 'pending' | 'in_progress' | 'completed' | 'blocked' | 'skipped';
  assigned_to?: string;
  due_date?: string;
  completed_at?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
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
  recentActivity: ActivityItem[];
}

export interface ActivityItem {
  id: string;
  type: string;
  description: string;
  entity_name: string;
  timestamp: string;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  sort?: string;
  order?: 'asc' | 'desc';
}
