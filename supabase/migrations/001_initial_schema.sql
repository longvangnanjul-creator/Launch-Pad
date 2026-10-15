-- Initial schema for LaunchKit Market Analysis Framework

CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  objective TEXT NOT NULL DEFAULT 'validate_idea',
  asset_type TEXT NOT NULL DEFAULT 'idea',
  description TEXT NOT NULL DEFAULT '',
  current_stage TEXT NOT NULL DEFAULT 'onboarding',
  status TEXT NOT NULL DEFAULT 'draft',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS question_turns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  turn_index INT NOT NULL,
  question_text TEXT NOT NULL,
  answer_text TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(project_id, turn_index)
);

CREATE TABLE IF NOT EXISTS evidence_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  stage TEXT NOT NULL,
  url TEXT,
  quote_or_note TEXT NOT NULL,
  observed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  source_label TEXT NOT NULL DEFAULT 'user note'
);

CREATE TABLE IF NOT EXISTS findings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  stage TEXT NOT NULL,
  kind TEXT NOT NULL CHECK (kind IN ('evidence', 'interpretation', 'no_evidence')),
  text TEXT NOT NULL,
  gap_type TEXT CHECK (gap_type IN ('product', 'service', 'price', 'convenience', 'quality', 'accessibility', 'geographic', 'experience')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS opportunities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  customer TEXT NOT NULL,
  problem TEXT NOT NULL,
  proposed_solution TEXT NOT NULL,
  why_it_exists TEXT NOT NULL,
  alternatives TEXT NOT NULL,
  differentiation TEXT NOT NULL,
  required_skills TEXT NOT NULL,
  business_model TEXT NOT NULL,
  risks TEXT NOT NULL,
  validation_steps TEXT NOT NULL,
  demand_evidence TEXT NOT NULL,
  demand_evidence_kind TEXT NOT NULL CHECK (demand_evidence_kind IN ('evidence', 'interpretation', 'no_evidence')),
  problem_severity TEXT NOT NULL CHECK (problem_severity IN ('high', 'medium', 'low')),
  competition TEXT NOT NULL CHECK (competition IN ('high', 'medium', 'low')),
  market_gap TEXT NOT NULL,
  market_gap_kind TEXT NOT NULL CHECK (market_gap_kind IN ('evidence', 'interpretation', 'no_evidence')),
  monetization TEXT NOT NULL,
  skills TEXT NOT NULL,
  main_risks TEXT NOT NULL,
  evidence_strength TEXT NOT NULL CHECK (evidence_strength IN ('strong', 'moderate', 'limited')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  generated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  sections JSONB NOT NULL DEFAULT '[]',
  action_plan JSONB NOT NULL DEFAULT '[]'
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);
CREATE INDEX IF NOT EXISTS idx_question_turns_project_id ON question_turns(project_id);
CREATE INDEX IF NOT EXISTS idx_evidence_items_project_id ON evidence_items(project_id);
CREATE INDEX IF NOT EXISTS idx_findings_project_id ON findings(project_id);
CREATE INDEX IF NOT EXISTS idx_opportunities_project_id ON opportunities(project_id);
CREATE INDEX IF NOT EXISTS idx_reports_project_id ON reports(project_id);
