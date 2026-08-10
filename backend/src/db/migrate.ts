import { pool } from './connection';

async function migrate() {
  console.log('🚀 Running migrations...');

  await pool.query(`
    CREATE TABLE IF NOT EXISTS partners (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name VARCHAR(255) NOT NULL,
      slug VARCHAR(100) UNIQUE NOT NULL,
      tier VARCHAR(20) NOT NULL DEFAULT 'standard' CHECK (tier IN ('premium','standard','basic')),
      region VARCHAR(100) NOT NULL,
      contact_email VARCHAR(255),
      contact_name VARCHAR(255),
      onboarding_status VARCHAR(30) NOT NULL DEFAULT 'pending'
        CHECK (onboarding_status IN ('pending','in_progress','review','blocked','completed')),
      notes TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS content (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      partner_id UUID NOT NULL REFERENCES partners(id) ON DELETE CASCADE,
      title VARCHAR(500) NOT NULL,
      content_type VARCHAR(50) NOT NULL CHECK (content_type IN ('series','movie','documentary','short','live_event','podcast')),
      genre VARCHAR(100),
      launch_date DATE,
      status VARCHAR(30) NOT NULL DEFAULT 'draft'
        CHECK (status IN ('draft','in_review','approved','scheduled','live','blocked','cancelled')),
      priority VARCHAR(20) NOT NULL DEFAULT 'medium' CHECK (priority IN ('critical','high','medium','low')),
      blocker_count INT DEFAULT 0,
      metadata JSONB DEFAULT '{}',
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS issues (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      content_id UUID REFERENCES content(id) ON DELETE CASCADE,
      partner_id UUID NOT NULL REFERENCES partners(id) ON DELETE CASCADE,
      issue_type VARCHAR(50) NOT NULL CHECK (issue_type IN ('metadata','rights','technical','legal','content_quality','scheduling','billing','escalation')),
      severity VARCHAR(20) NOT NULL DEFAULT 'medium' CHECK (severity IN ('critical','high','medium','low')),
      title VARCHAR(500) NOT NULL,
      description TEXT,
      owner VARCHAR(255),
      status VARCHAR(20) NOT NULL DEFAULT 'open' CHECK (status IN ('open','in_progress','resolved','wont_fix','escalated')),
      notes TEXT,
      due_date DATE,
      resolved_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS workflow_steps (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      content_id UUID NOT NULL REFERENCES content(id) ON DELETE CASCADE,
      step_name VARCHAR(100) NOT NULL,
      step_order INT NOT NULL,
      status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','in_progress','completed','blocked','skipped')),
      assigned_to VARCHAR(255),
      due_date DATE,
      completed_at TIMESTAMPTZ,
      notes TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS status_history (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      entity_type VARCHAR(50) NOT NULL,
      entity_id UUID NOT NULL,
      old_status VARCHAR(50),
      new_status VARCHAR(50) NOT NULL,
      changed_by VARCHAR(255) DEFAULT 'system',
      reason TEXT,
      changed_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE OR REPLACE FUNCTION update_updated_at()
    RETURNS TRIGGER AS $$
    BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
    $$ LANGUAGE plpgsql;

    DROP TRIGGER IF EXISTS partners_updated_at ON partners;
    CREATE TRIGGER partners_updated_at BEFORE UPDATE ON partners
      FOR EACH ROW EXECUTE FUNCTION update_updated_at();

    DROP TRIGGER IF EXISTS content_updated_at ON content;
    CREATE TRIGGER content_updated_at BEFORE UPDATE ON content
      FOR EACH ROW EXECUTE FUNCTION update_updated_at();

    DROP TRIGGER IF EXISTS issues_updated_at ON issues;
    CREATE TRIGGER issues_updated_at BEFORE UPDATE ON issues
      FOR EACH ROW EXECUTE FUNCTION update_updated_at();

    DROP TRIGGER IF EXISTS workflow_steps_updated_at ON workflow_steps;
    CREATE TRIGGER workflow_steps_updated_at BEFORE UPDATE ON workflow_steps
      FOR EACH ROW EXECUTE FUNCTION update_updated_at();

    CREATE INDEX IF NOT EXISTS idx_content_partner ON content(partner_id);
    CREATE INDEX IF NOT EXISTS idx_content_status ON content(status);
    CREATE INDEX IF NOT EXISTS idx_issues_partner ON issues(partner_id);
    CREATE INDEX IF NOT EXISTS idx_issues_status ON issues(status);
    CREATE INDEX IF NOT EXISTS idx_workflow_content ON workflow_steps(content_id);
    CREATE INDEX IF NOT EXISTS idx_status_history_entity ON status_history(entity_type, entity_id);
  `);

  console.log('✅ Migrations complete');
  await pool.end();
}

migrate().catch((e) => { console.error(e); process.exit(1); });
