-- V3 editorial agent: bounded plans, tool evidence and human decisions.
CREATE TABLE ai_agent_runs (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 entity_type text NOT NULL CHECK(entity_type IN ('content_item_translations','product_translations')),
 entity_id uuid NOT NULL,
 objective text NOT NULL CHECK(length(trim(objective)) BETWEEN 10 AND 1500),
 status text NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','planning','running','awaiting_approval','approved','applied','rejected','failed','cancelled')),
 max_steps integer NOT NULL DEFAULT 5 CHECK(max_steps BETWEEN 2 AND 8),
 token_budget integer NOT NULL DEFAULT 8000 CHECK(token_budget BETWEEN 3000 AND 16000),
 tokens_used integer NOT NULL DEFAULT 0 CHECK(tokens_used>=0),
 calls_used integer NOT NULL DEFAULT 0 CHECK(calls_used BETWEEN 0 AND 2),
 plan jsonb NOT NULL DEFAULT '[]' CHECK(jsonb_typeof(plan)='array'),
 proposal jsonb CHECK(proposal IS NULL OR jsonb_typeof(proposal)='object'),
 source_updated_at timestamptz,
 model text,error_message text,
 requested_by uuid NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
 reviewed_by uuid REFERENCES users(id) ON DELETE SET NULL,
 review_note text,reviewed_at timestamptz,
 applied_by uuid REFERENCES users(id) ON DELETE SET NULL,applied_at timestamptz,
 rating integer CHECK(rating BETWEEN 1 AND 5),outcome_note text CHECK(outcome_note IS NULL OR length(outcome_note)<=1000),
 started_at timestamptz,finished_at timestamptz,
 created_at timestamptz NOT NULL DEFAULT now(),updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ix_ai_agent_runs_queue ON ai_agent_runs(created_at) WHERE status='pending';
CREATE INDEX ix_ai_agent_runs_owner ON ai_agent_runs(requested_by,created_at DESC);
CREATE INDEX ix_ai_agent_runs_target ON ai_agent_runs(entity_type,entity_id,created_at DESC);
CREATE TRIGGER trg_ai_agent_runs_updated_at BEFORE UPDATE ON ai_agent_runs FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE ai_agent_steps (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),run_id uuid NOT NULL REFERENCES ai_agent_runs(id) ON DELETE CASCADE,
 ordinal integer NOT NULL CHECK(ordinal BETWEEN 1 AND 8),
 tool text NOT NULL CHECK(tool IN ('read_content','seo_review','keyword_evidence','competitor_evidence','geo_evidence','draft_proposal')),
 status text NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','running','completed','failed')),
 rationale text NOT NULL DEFAULT '',result jsonb,token_usage jsonb NOT NULL DEFAULT '{}',
 error_message text,started_at timestamptz,finished_at timestamptz,
 UNIQUE(run_id,ordinal)
);
CREATE INDEX ix_ai_agent_steps_run ON ai_agent_steps(run_id,ordinal);

CREATE TABLE ai_agent_decisions (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),run_id uuid NOT NULL REFERENCES ai_agent_runs(id) ON DELETE CASCADE,
 action text NOT NULL CHECK(action IN ('approve','reject','apply','cancel','publish','rate')),
 actor_id uuid REFERENCES users(id) ON DELETE SET NULL,note text,
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ix_ai_agent_decisions_run ON ai_agent_decisions(run_id,created_at);
