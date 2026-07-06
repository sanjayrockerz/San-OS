-- Migration 0026: Project Manager Upgrade (Phase 8A.1)

-- 1. Extend the projects table to support AI Project Manager fields
ALTER TABLE public.projects 
ADD COLUMN IF NOT EXISTS health_score INTEGER DEFAULT 100,
ADD COLUMN IF NOT EXISTS github_repo_url TEXT,
ADD COLUMN IF NOT EXISTS ai_insights JSONB DEFAULT '{}'::jsonb;

-- 2. Create project_milestones table
CREATE TABLE IF NOT EXISTS public.project_milestones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    due_date TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Create project_deliverables table
CREATE TABLE IF NOT EXISTS public.project_deliverables (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    milestone_id UUID NOT NULL REFERENCES public.project_milestones(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    estimate_minutes INTEGER,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. Create project_risks table
CREATE TABLE IF NOT EXISTS public.project_risks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    severity TEXT NOT NULL DEFAULT 'medium',
    mitigation_plan TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS policies
ALTER TABLE public.project_milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_deliverables ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_risks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own milestones" ON public.project_milestones
    FOR ALL USING (project_id IN (SELECT id FROM public.projects WHERE user_id = auth.uid()));

CREATE POLICY "Users can manage their own deliverables" ON public.project_deliverables
    FOR ALL USING (milestone_id IN (SELECT id FROM public.project_milestones WHERE project_id IN (SELECT id FROM public.projects WHERE user_id = auth.uid())));

CREATE POLICY "Users can manage their own risks" ON public.project_risks
    FOR ALL USING (project_id IN (SELECT id FROM public.projects WHERE user_id = auth.uid()));

-- Triggers for updated_at
CREATE TRIGGER set_timestamp_project_milestones
BEFORE UPDATE ON public.project_milestones
FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();

CREATE TRIGGER set_timestamp_project_deliverables
BEFORE UPDATE ON public.project_deliverables
FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();

CREATE TRIGGER set_timestamp_project_risks
BEFORE UPDATE ON public.project_risks
FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();
