-- 002_business_creation.sql
-- Adds business creation columns to projects table.
-- These columns store the business blueprint, form details, and launch checklist
-- generated when a user creates a business via the Business Creation form.

ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS business_details JSONB,
  ADD COLUMN IF NOT EXISTS business_blueprint JSONB,
  ADD COLUMN IF NOT EXISTS launch_checklist JSONB;

-- Create index for JSONB queries on business_blueprint
CREATE INDEX IF NOT EXISTS idx_projects_business_blueprint ON projects USING GIN (business_blueprint);
