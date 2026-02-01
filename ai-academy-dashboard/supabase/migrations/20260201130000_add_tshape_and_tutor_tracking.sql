-- =============================================
-- Migration: Add T-Shape Explorer Achievement and Tutor Session Tracking
-- Date: 2026-02-01
-- =============================================

-- Ensure UUID extension is enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Add T-Shape Explorer achievement
INSERT INTO achievements (code, name, description, icon, points_bonus) VALUES
('t_shape_explorer', 'T-Shape Explorer', 'Interacted with AI Tutors across all 8 roles during Role Expo (Day 4)', '🎯', 50)
ON CONFLICT (code) DO NOTHING;

-- Add additional Day 4 specific achievements
INSERT INTO achievements (code, name, description, icon, points_bonus) VALUES
('role_decider', 'Role Decider', 'Submitted Role Reflection with thoughtful justification', '🎭', 25),
('cross_role_learner', 'Cross-Role Learner', 'Documented learnings about a role you did not choose', '🔄', 15)
ON CONFLICT (code) DO NOTHING;

-- =============================================
-- Tutor Session Tracking Table
-- =============================================

CREATE TABLE IF NOT EXISTS tutor_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    participant_id UUID REFERENCES participants(id) ON DELETE CASCADE,

    -- Session info
    session_date DATE NOT NULL DEFAULT CURRENT_DATE,
    day_number INTEGER NOT NULL CHECK (day_number BETWEEN 1 AND 25),
    role_context TEXT, -- Which role's tutor was used (NULL for general)

    -- Interaction metrics
    message_count INTEGER DEFAULT 0,
    question_count INTEGER DEFAULT 0, -- Messages ending with ?
    session_duration_minutes INTEGER,

    -- Quality indicators
    depth_score INTEGER CHECK (depth_score BETWEEN 1 AND 5), -- AI-assessed conversation depth
    iteration_count INTEGER DEFAULT 0, -- How many times they refined their approach

    -- Context
    topic TEXT, -- Main topic of conversation
    insights_captured TEXT[], -- Key insights noted by participant

    -- Metadata
    tutor_model TEXT, -- claude-opus-4.5, gpt-5.2, etc.
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- Constraints
    UNIQUE(participant_id, session_date, day_number, role_context)
);

-- Index for efficient queries
CREATE INDEX IF NOT EXISTS idx_tutor_sessions_participant ON tutor_sessions(participant_id);
CREATE INDEX IF NOT EXISTS idx_tutor_sessions_day ON tutor_sessions(day_number);
CREATE INDEX IF NOT EXISTS idx_tutor_sessions_date ON tutor_sessions(session_date);

-- =============================================
-- Role Interaction Tracking for T-Shape Achievement
-- =============================================

CREATE TABLE IF NOT EXISTS role_expo_interactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    participant_id UUID REFERENCES participants(id) ON DELETE CASCADE,
    role_code TEXT NOT NULL, -- AI-PM, FDE, AI-SE, etc.
    interaction_type TEXT NOT NULL, -- 'mini_challenge', 'ai_tutor', 'reflection'
    completed_at TIMESTAMPTZ DEFAULT NOW(),
    notes TEXT,

    UNIQUE(participant_id, role_code, interaction_type)
);

CREATE INDEX IF NOT EXISTS idx_role_expo_participant ON role_expo_interactions(participant_id);

-- =============================================
-- Function: Check and Award T-Shape Explorer Achievement
-- =============================================

CREATE OR REPLACE FUNCTION check_tshape_achievement()
RETURNS TRIGGER AS $$
DECLARE
    role_count INTEGER;
    achievement_id UUID;
BEGIN
    -- Count distinct roles the participant has interacted with
    SELECT COUNT(DISTINCT role_code) INTO role_count
    FROM role_expo_interactions
    WHERE participant_id = NEW.participant_id;

    -- If they've interacted with all 8 roles, award achievement
    IF role_count >= 8 THEN
        SELECT id INTO achievement_id FROM achievements WHERE code = 't_shape_explorer';

        IF achievement_id IS NOT NULL THEN
            INSERT INTO participant_achievements (participant_id, achievement_id)
            VALUES (NEW.participant_id, achievement_id)
            ON CONFLICT DO NOTHING;

            -- Log the achievement
            IF FOUND THEN
                INSERT INTO activity_log (participant_id, action, details)
                VALUES (
                    NEW.participant_id,
                    'achievement',
                    jsonb_build_object(
                        'achievement_code', 't_shape_explorer',
                        'achievement_name', 'T-Shape Explorer',
                        'roles_explored', role_count
                    )
                );
            END IF;
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to check T-Shape achievement on role interaction
DROP TRIGGER IF EXISTS trigger_check_tshape ON role_expo_interactions;
CREATE TRIGGER trigger_check_tshape
AFTER INSERT ON role_expo_interactions
FOR EACH ROW EXECUTE FUNCTION check_tshape_achievement();

-- =============================================
-- Function: Log Tutor Session Activity
-- =============================================

CREATE OR REPLACE FUNCTION log_tutor_session_activity()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO activity_log (participant_id, action, details)
    VALUES (
        NEW.participant_id,
        'tutor_session',
        jsonb_build_object(
            'day_number', NEW.day_number,
            'role_context', NEW.role_context,
            'message_count', NEW.message_count,
            'question_count', NEW.question_count,
            'duration_minutes', NEW.session_duration_minutes
        )
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_log_tutor_session ON tutor_sessions;
CREATE TRIGGER trigger_log_tutor_session
AFTER INSERT ON tutor_sessions
FOR EACH ROW EXECUTE FUNCTION log_tutor_session_activity();

-- =============================================
-- Views for Tutor Analytics
-- =============================================

CREATE OR REPLACE VIEW tutor_engagement_summary AS
SELECT
    p.id as participant_id,
    p.name,
    p.role,
    COUNT(DISTINCT ts.id) as total_sessions,
    SUM(ts.message_count) as total_messages,
    SUM(ts.question_count) as total_questions,
    AVG(ts.depth_score) as avg_depth_score,
    SUM(ts.session_duration_minutes) as total_minutes
FROM participants p
LEFT JOIN tutor_sessions ts ON p.id = ts.participant_id
GROUP BY p.id, p.name, p.role;

-- =============================================
-- RLS Policies
-- =============================================

ALTER TABLE tutor_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_expo_interactions ENABLE ROW LEVEL SECURITY;

-- Tutor sessions: participants can see their own, admins can see all
CREATE POLICY "Users can view their own tutor sessions"
ON tutor_sessions FOR SELECT
USING (auth.uid()::text = participant_id::text OR auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Users can insert their own tutor sessions"
ON tutor_sessions FOR INSERT
WITH CHECK (auth.uid()::text = participant_id::text);

-- Role expo interactions: same pattern
CREATE POLICY "Users can view their own role interactions"
ON role_expo_interactions FOR SELECT
USING (auth.uid()::text = participant_id::text OR auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Users can insert their own role interactions"
ON role_expo_interactions FOR INSERT
WITH CHECK (auth.uid()::text = participant_id::text);
