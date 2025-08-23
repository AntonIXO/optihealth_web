-- Migration: 20250821214000_create_goal_engine_schema.sql
-- Description: Adds tables and types required for the Goal Adherence & Streaks Engine.

BEGIN;

-- Create a custom ENUM type for the comparison operator to ensure data integrity.
CREATE TYPE public.goal_comparison_operator AS ENUM (
    '>=',
    '<=',
    '>',
    '<'
);

-- Create the table to store user-defined goals.
CREATE TABLE IF NOT EXISTS public.user_goals (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    metric_id BIGINT NOT NULL REFERENCES public.metric_definitions(id) ON DELETE CASCADE,
    
    target_value DOUBLE PRECISION NOT NULL,
    operator goal_comparison_operator NOT NULL,
    
    goal_name TEXT NOT NULL, -- e.g., "Daily Steps Goal", "Sleep Target"
    is_active BOOLEAN DEFAULT true NOT NULL,
    
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,

    -- A user should only have one active goal per metric.
    UNIQUE (user_id, metric_id, is_active)
);

-- Add Row-Level Security (RLS) to the new table.
ALTER TABLE public.user_goals ENABLE ROW LEVEL SECURITY;

-- Define policies for RLS.
CREATE POLICY "Users can manage their own goals." 
ON public.user_goals 
FOR ALL 
USING (auth.uid() = user_id);

-- Create indexes for faster querying.
CREATE INDEX idx_user_goals_user_id_active ON public.user_goals(user_id, is_active);

-- Add a trigger to automatically update the 'updated_at' timestamp.
CREATE TRIGGER on_user_goals_updated 
BEFORE UPDATE ON public.user_goals 
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

COMMIT;

