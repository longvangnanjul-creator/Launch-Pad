-- 004_modules_and_service_requests.sql
-- Adds columns for Brand, Website, Marketing, and Tools modules.
-- Also creates the service_requests table so the admin can receive requests.

-- 1. Add module columns to projects
ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS business_brand JSONB,
  ADD COLUMN IF NOT EXISTS business_website JSONB,
  ADD COLUMN IF NOT EXISTS business_marketing JSONB,
  ADD COLUMN IF NOT EXISTS business_tools JSONB;

-- 2. Create service_requests table
CREATE TABLE IF NOT EXISTS service_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  service_type TEXT NOT NULL,
  description TEXT NOT NULL,
  budget TEXT,
  timeline TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_service_requests_user_id ON service_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_service_requests_status ON service_requests(status);

-- 3. Row Level Security
ALTER TABLE service_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own service requests" ON service_requests
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create own service requests" ON service_requests
  FOR INSERT WITH CHECK (user_id = auth.uid());
