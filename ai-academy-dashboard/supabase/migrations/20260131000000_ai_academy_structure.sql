-- Migration: AI Academy 2026 - Full Structure Update
-- Date: 2026-01-31
-- Changes:
--   1. Remove AI-DX role
--   2. Extend assignments to 25 days with role-specific deliverables
--   3. Add target_roles column for role-specific assignments

-- =============================================
-- UPDATE ROLE ENUM (remove AI-DX)
-- =============================================

-- Note: PostgreSQL doesn't support dropping enum values directly.
-- For production, you'd need to create a new type and migrate.
-- This migration assumes a fresh database or manual cleanup.

-- If you have existing AI-DX data, run this first:
-- UPDATE participants SET role = 'FDE' WHERE role = 'AI-DX';

-- =============================================
-- ALTER ASSIGNMENTS TABLE
-- =============================================

-- Extend day constraint and add target_roles
ALTER TABLE assignments
  DROP CONSTRAINT IF EXISTS assignments_day_check;

ALTER TABLE assignments
  ADD CONSTRAINT assignments_day_check CHECK (day BETWEEN 1 AND 25);

-- Add target_roles column (NULL = common for all, array = specific roles)
ALTER TABLE assignments
  ADD COLUMN IF NOT EXISTS target_roles TEXT[] DEFAULT NULL;

-- Add situation column for context
ALTER TABLE assignments
  ADD COLUMN IF NOT EXISTS situation TEXT DEFAULT NULL;

-- Add week column (derived)
ALTER TABLE assignments
  ADD COLUMN IF NOT EXISTS week INTEGER GENERATED ALWAYS AS (
    CASE
      WHEN day <= 5 THEN 1
      WHEN day <= 10 THEN 2
      WHEN day <= 15 THEN 4
      ELSE 5
    END
  ) STORED;

-- Drop the unique constraint that limits to day+type
ALTER TABLE assignments
  DROP CONSTRAINT IF EXISTS assignments_day_type_key;

-- =============================================
-- CLEAR OLD SEED DATA
-- =============================================

DELETE FROM submissions;
DELETE FROM assignments;

-- =============================================
-- SEED DATA - Common Foundations (Days 1-3)
-- =============================================

INSERT INTO assignments (day, type, title, folder_name, max_points, description, situation, target_roles) VALUES
-- Day 1: AI Landscape (Common)
(1, 'in_class', 'CEO Briefing', 'day-01-ceo-briefing', 15,
 'Draft an executive briefing on AI capabilities for Kyndryl leadership',
 'The CEO Asks: You have 15 minutes with the CEO. She wants to know what AI can and cannot do for Kyndryl.',
 NULL),

-- Day 2: Prompt Engineering (Common)
(2, 'in_class', 'Hallucination Fix', 'day-02-hallucination-fix', 15,
 'Identify and fix hallucinations in an AI assistant',
 'The Lying Bot: A client''s chatbot is making up information about their products. Fix it.',
 NULL),

-- Day 3: Agentic Patterns (Common)
(3, 'in_class', 'Architecture Simplification', 'day-03-architecture', 15,
 'Simplify an over-engineered multi-agent system',
 'Too Many Agents: Someone built a system with 12 agents for a simple task. Simplify it.',
 NULL);

-- =============================================
-- SEED DATA - Role Introduction (Days 4-5)
-- =============================================

-- Day 4: Role-specific introduction
INSERT INTO assignments (day, type, title, folder_name, max_points, description, situation, target_roles) VALUES
(4, 'in_class', 'Demo Plan', 'day-04-demo-plan', 15,
 'Create a 24-hour demo plan for a potential client',
 'Customer Wants a Demo: A potential client wants to see an AI agent that can answer questions about their internal documents. You have 24 hours.',
 ARRAY['FDE']),

(4, 'in_class', 'Service Architecture', 'day-04-service-arch', 15,
 'Design a clean service architecture for an AI system',
 'Refactor the Monolith: The FDE built a working demo but it''s all in one file. Design a proper architecture.',
 ARRAY['AI-SE']),

(4, 'in_class', 'MVP Definition', 'day-04-mvp-definition', 15,
 'Define MVP scope for an AI project with too many requirements',
 'Scope is Too Big: Client wants an AI that does 15 things. Sales promised delivery in 4 weeks. Define what''s actually achievable.',
 ARRAY['AI-PM']),

(4, 'in_class', 'Data Pipeline Design', 'day-04-data-pipeline', 15,
 'Design a data pipeline for AI analytics',
 'Data Won''t Flow: The AI system generates logs but nobody can analyze them. Design the pipeline.',
 ARRAY['AI-DA']),

(4, 'in_class', 'Evaluation Framework', 'day-04-evaluation', 15,
 'Create an evaluation framework for AI quality',
 'How Good Is It?: The demo works but nobody knows how well. Create metrics.',
 ARRAY['AI-DS']),

(4, 'in_class', 'Threat Model', 'day-04-threat-model', 15,
 'Create a threat model for an AI chatbot',
 'Map the Attacks: Before launching the chatbot, identify all potential attack vectors.',
 ARRAY['AI-SEC']),

(4, 'in_class', 'Streaming UI', 'day-04-streaming-ui', 15,
 'Build a streaming response UI component',
 'User Waits 30 Seconds: The AI takes 30 seconds to respond. Users think the app is broken. Fix the UX.',
 ARRAY['AI-FE']);

-- Day 5: Role deep dive + Week 1 Checkpoint
INSERT INTO assignments (day, type, title, folder_name, max_points, description, situation, target_roles) VALUES
(5, 'in_class', 'Week 1 Checkpoint', 'week-01-checkpoint', 25,
 'Weekly checkpoint: Artifacts + AI conversation export + Reflection',
 'Submit your Week 1 work: All artifacts from Days 1-4, key AI Tutor conversations, and 300-500 word reflection.',
 NULL);

-- =============================================
-- SEED DATA - Role Deep Dive (Days 6-10)
-- =============================================

-- Day 6
INSERT INTO assignments (day, type, title, folder_name, max_points, description, situation, target_roles) VALUES
(6, 'in_class', 'RAG Pipeline', 'day-06-rag-pipeline', 15,
 'Build a working RAG system with proper chunking and retrieval',
 'Documents Won''t Load: The client has 500 PDFs and the chatbot can''t find anything.',
 ARRAY['FDE']),

(6, 'in_class', 'Clean Architecture', 'day-06-clean-arch', 15,
 'Decompose a monolithic AI service into clean modules',
 'Refactor the Monolith: Break down a 2000-line AI service into maintainable components.',
 ARRAY['AI-SE']),

(6, 'in_class', 'Use Case Framing', 'day-06-use-case', 15,
 'Frame AI use cases in business terms with clear value propositions',
 'Scope is Too Big: Translate technical capabilities into business value.',
 ARRAY['AI-PM']),

(6, 'in_class', 'Data Pipeline', 'day-06-data-pipeline', 15,
 'Build a working data pipeline for AI system metrics',
 'Data Won''t Flow: Implement the pipeline you designed on Day 4.',
 ARRAY['AI-DA']),

(6, 'in_class', 'Metrics Dashboard', 'day-06-metrics', 15,
 'Build an evaluation metrics dashboard',
 'How Good Is It?: Implement the evaluation framework from Day 4.',
 ARRAY['AI-DS']),

(6, 'in_class', 'Threat Model Document', 'day-06-threat-doc', 15,
 'Complete threat model documentation with mitigations',
 'Map the Attacks: Finalize your threat model with specific mitigations.',
 ARRAY['AI-SEC']),

(6, 'in_class', 'Streaming Component', 'day-06-streaming', 15,
 'Implement a production-ready streaming response component',
 'User Waits 30 Seconds: Polish your streaming UI with proper states.',
 ARRAY['AI-FE']);

-- Day 7
INSERT INTO assignments (day, type, title, folder_name, max_points, description, situation, target_roles) VALUES
(7, 'in_class', 'Multi-Agent Orchestration', 'day-07-multi-agent', 15,
 'Build an orchestrated multi-agent workflow',
 'Agents Won''t Cooperate: Two agents need to work together but keep interfering.',
 ARRAY['FDE']),

(7, 'in_class', 'Test Suite', 'day-07-testing', 15,
 'Create a comprehensive test suite for AI systems',
 'Test This Agent: The FDE built an agent that "works". Prove it with tests.',
 ARRAY['AI-SE']),

(7, 'in_class', 'Business Case', 'day-07-business-case', 15,
 'Build a compelling ROI business case for an AI project',
 'Prove the ROI: CFO asks how you know this AI is worth $2M.',
 ARRAY['AI-PM']),

(7, 'in_class', 'KPI Framework', 'day-07-kpi', 15,
 'Design KPI framework with baselines and targets',
 'Where''s the Baseline?: Establish meaningful KPIs for AI success.',
 ARRAY['AI-DA']),

(7, 'in_class', 'A/B Test Design', 'day-07-ab-test', 15,
 'Design and run an A/B test comparing AI approaches',
 'Compare These Models: Two models claim to be better. Prove which one is.',
 ARRAY['AI-DS']),

(7, 'in_class', 'Red Team Report', 'day-07-red-team', 15,
 'Red team an AI chatbot and document vulnerabilities',
 'Red Team the Chatbot: Find every way to break it before attackers do.',
 ARRAY['AI-SEC']),

(7, 'in_class', 'Error Handling', 'day-07-errors', 15,
 'Implement comprehensive error handling patterns for AI UI',
 'Something Went Wrong: The AI fails. What does the user see?',
 ARRAY['AI-FE']);

-- Day 8
INSERT INTO assignments (day, type, title, folder_name, max_points, description, situation, target_roles) VALUES
(8, 'in_class', 'Container Deployment', 'day-08-deployment', 15,
 'Deploy AI solution to Azure Container Apps',
 'Works on My Machine: The demo works locally. Ship it to production.',
 ARRAY['FDE']),

(8, 'in_class', 'CI/CD Pipeline', 'day-08-cicd', 15,
 'Build a CI/CD pipeline for AI systems',
 'Pipeline is Broken: Automate testing and deployment for the AI service.',
 ARRAY['AI-SE']),

(8, 'in_class', 'Prioritized Backlog', 'day-08-backlog', 15,
 'Create a prioritized backlog with stakeholder buy-in',
 'Customer Wants Everything: Manage expectations and prioritize features.',
 ARRAY['AI-PM']),

(8, 'in_class', 'Executive Dashboard', 'day-08-dashboard', 15,
 'Build an executive dashboard showing AI impact',
 'Show Me the Numbers: Leadership wants to see the value.',
 ARRAY['AI-DA']),

(8, 'in_class', 'Bias Report', 'day-08-bias', 15,
 'Detect and document potential bias in AI outputs',
 'Is It Fair?: Check if the AI treats all user groups equally.',
 ARRAY['AI-DS']),

(8, 'in_class', 'Safety Implementation', 'day-08-guardrails', 15,
 'Implement guardrails and safety measures',
 'Build the Guardrails: Prevent the attack vectors you identified.',
 ARRAY['AI-SEC']),

(8, 'in_class', 'WCAG Compliance', 'day-08-accessibility', 15,
 'Make AI interface WCAG compliant',
 'Make It Accessible: Ensure the AI UI works for all users.',
 ARRAY['AI-FE']);

-- Day 9
INSERT INTO assignments (day, type, title, folder_name, max_points, description, situation, target_roles) VALUES
(9, 'in_class', 'Production Monitoring', 'day-09-monitoring', 15,
 'Implement monitoring and alerting for production AI',
 'Agent Crashed at 2AM: The client''s AI agent stopped responding. Set up monitoring.',
 ARRAY['FDE']),

(9, 'in_class', 'LLMOps Dashboard', 'day-09-llmops', 15,
 'Build an LLMOps observability dashboard',
 'Model Drift Detected: Production metrics show response quality dropping. Diagnose it.',
 ARRAY['AI-SE']),

(9, 'in_class', '90-Day Roadmap', 'day-09-roadmap', 15,
 'Create a 90-day AI implementation roadmap',
 'What''s Next?: Plan the next three months of AI development.',
 ARRAY['AI-PM']),

(9, 'in_class', 'Impact Report', 'day-09-impact', 15,
 'Create an ROI impact report with quantified benefits',
 'Prove the Value: Show the actual business impact with data.',
 ARRAY['AI-DA']),

(9, 'in_class', 'Quality Monitoring', 'day-09-quality', 15,
 'Build a quality monitoring system for AI outputs',
 'Performance Dropped: Track and alert on AI quality metrics.',
 ARRAY['AI-DS']),

(9, 'in_class', 'Compliance Checklist', 'day-09-compliance', 15,
 'Complete compliance audit checklist',
 'Audit This Agent: Ensure the AI meets regulatory requirements.',
 ARRAY['AI-SEC']),

(9, 'in_class', 'Performance Optimization', 'day-09-performance', 15,
 'Optimize AI UI performance for production',
 'It''s Too Slow: Optimize the frontend bundle and loading.',
 ARRAY['AI-FE']);

-- Day 10: Week 2 Checkpoint
INSERT INTO assignments (day, type, title, folder_name, max_points, description, situation, target_roles) VALUES
(10, 'in_class', 'Week 2 Checkpoint', 'week-02-checkpoint', 25,
 'Weekly checkpoint: Production-ready deliverable + Documentation + Reflection',
 'Final Presentation: Present your production-ready solution with documentation.',
 NULL);

-- =============================================
-- SEED DATA - Team Projects (Days 11-15, Week 4)
-- =============================================

INSERT INTO assignments (day, type, title, folder_name, max_points, description, situation, target_roles) VALUES
(11, 'in_class', 'Team Charter', 'day-11-team-charter', 15,
 'Form team and sign team charter',
 'Team Formation: Establish roles, communication norms, and decision-making processes.',
 NULL),

(12, 'in_class', 'Problem Statement', 'day-12-problem', 15,
 'Define clear problem statement for team project',
 'Problem Framing: What exactly are you solving? For whom?',
 NULL),

(13, 'in_class', 'Solution Design', 'day-13-design', 15,
 'Complete solution architecture design',
 'Architecture: How will all the pieces fit together?',
 NULL),

(14, 'in_class', 'Working Prototype', 'day-14-prototype', 20,
 'Build working MVP prototype',
 'MVP Build: Get something working end-to-end.',
 NULL),

(15, 'in_class', 'Week 4 Checkpoint', 'week-04-checkpoint', 25,
 'Team project checkpoint: Working MVP + Architecture doc + Individual contribution',
 'Present your MVP prototype with clear architecture documentation.',
 NULL);

-- =============================================
-- SEED DATA - Polish + Certification (Days 16-25, Week 5)
-- =============================================

INSERT INTO assignments (day, type, title, folder_name, max_points, description, situation, target_roles) VALUES
(16, 'in_class', 'Integration', 'day-16-integration', 15,
 'Connect all components end-to-end',
 'Components Connected: Make everything work together seamlessly.',
 NULL),

(17, 'in_class', 'Testing', 'day-17-testing', 15,
 'Complete testing and quality verification',
 'Quality Verified: Prove your solution works reliably.',
 NULL),

(18, 'in_class', 'Peer Review', 'day-18-peer-review', 15,
 'Cross-team peer review',
 'Cross-Team Feedback: Review another team''s work and incorporate feedback.',
 NULL),

(19, 'in_class', 'Iteration', 'day-19-iteration', 15,
 'Incorporate feedback from peer review',
 'Feedback Incorporated: Address the issues identified.',
 NULL),

(20, 'in_class', 'Certification Prep', 'day-20-cert-prep', 15,
 'Study day for certification preparation',
 'Study Day: Prepare for your role-specific certification exam.',
 NULL),

(21, 'in_class', 'Final Polish', 'day-21-polish', 15,
 'Final polish and demo preparation',
 'Demo Ready: Make it presentable to clients.',
 NULL),

(22, 'in_class', 'Documentation', 'day-22-docs', 15,
 'Complete project documentation',
 'README Complete: Document everything for handoff.',
 NULL),

(23, 'in_class', 'Presentation Prep', 'day-23-presentation', 15,
 'Prepare presentation slides',
 'Slides Ready: Create compelling presentation for graduation.',
 NULL),

(24, 'in_class', 'Dry Run', 'day-24-dry-run', 15,
 'Practice demo presentation',
 'Practice Demo: Run through your presentation with feedback.',
 NULL),

(25, 'in_class', 'Week 5 Checkpoint', 'week-05-checkpoint', 30,
 'Final checkpoint: Complete project + Presentation ready + Individual reflection',
 'Final Prep: Everything ready for graduation.',
 NULL);

-- =============================================
-- UPDATE VIEWS
-- =============================================

DROP VIEW IF EXISTS progress_matrix;

CREATE VIEW progress_matrix AS
SELECT
    p.role,
    a.day,
    a.type,
    a.week,
    COUNT(s.id) as submitted,
    COUNT(DISTINCT p.id) as total,
    ROUND(COUNT(s.id)::decimal / NULLIF(COUNT(DISTINCT p.id), 0) * 100, 0) as completion_pct
FROM participants p
CROSS JOIN assignments a
LEFT JOIN submissions s ON s.participant_id = p.id AND s.assignment_id = a.id
WHERE
    a.target_roles IS NULL
    OR p.role::text = ANY(a.target_roles)
GROUP BY p.role, a.day, a.type, a.week
ORDER BY p.role, a.day, a.type;
