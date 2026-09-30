-- Explicit marketing consent is separate from inquiry privacy consent.
CREATE TABLE marketing_consents (
 contact_id uuid PRIMARY KEY REFERENCES crm_contacts(id) ON DELETE CASCADE,
 state text NOT NULL DEFAULT 'unknown' CHECK(state IN ('unknown','granted','revoked')),
 source text, evidence text,granted_at timestamptz,revoked_at timestamptz,
 updated_by uuid REFERENCES users(id) ON DELETE SET NULL,
 created_at timestamptz NOT NULL DEFAULT now(),updated_at timestamptz NOT NULL DEFAULT now(),
 CHECK(state<>'granted' OR (length(btrim(coalesce(source,'')))>=2 AND length(btrim(coalesce(evidence,'')))>=5 AND granted_at IS NOT NULL))
);
CREATE INDEX ix_marketing_consents_state ON marketing_consents(state,updated_at DESC);
CREATE TRIGGER trg_marketing_consents_updated_at BEFORE UPDATE ON marketing_consents FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TABLE marketing_consent_events (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),contact_id uuid NOT NULL REFERENCES crm_contacts(id) ON DELETE CASCADE,
 previous_state text NOT NULL,new_state text NOT NULL,source text,evidence text,
 changed_by uuid REFERENCES users(id) ON DELETE SET NULL,created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ix_marketing_consent_events_contact ON marketing_consent_events(contact_id,created_at DESC);

CREATE TABLE marketing_segments (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),name text NOT NULL UNIQUE CHECK(length(btrim(name)) BETWEEN 2 AND 120),
 criteria jsonb NOT NULL DEFAULT '{}'::jsonb CHECK(jsonb_typeof(criteria)='object'),
 is_enabled boolean NOT NULL DEFAULT true,created_by uuid REFERENCES users(id) ON DELETE SET NULL,
 created_at timestamptz NOT NULL DEFAULT now(),updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TRIGGER trg_marketing_segments_updated_at BEFORE UPDATE ON marketing_segments FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE marketing_settings (
 singleton_key boolean PRIMARY KEY DEFAULT true CHECK(singleton_key),
 is_enabled boolean NOT NULL DEFAULT false,
 max_per_7_days integer NOT NULL DEFAULT 1 CHECK(max_per_7_days BETWEEN 0 AND 10),
 max_per_30_days integer NOT NULL DEFAULT 4 CHECK(max_per_30_days BETWEEN 0 AND 30),
 global_daily_cap integer NOT NULL DEFAULT 100 CHECK(global_daily_cap BETWEEN 0 AND 100000),
 updated_by uuid REFERENCES users(id) ON DELETE SET NULL,updated_at timestamptz NOT NULL DEFAULT now()
);
INSERT INTO marketing_settings(singleton_key) VALUES(true);
CREATE TRIGGER trg_marketing_settings_updated_at BEFORE UPDATE ON marketing_settings FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE marketing_campaigns (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),code text NOT NULL UNIQUE CHECK(code ~ '^[a-z0-9][a-z0-9_-]{1,59}$'),
 name text NOT NULL CHECK(length(btrim(name)) BETWEEN 2 AND 160),
 segment_id uuid NOT NULL REFERENCES marketing_segments(id) ON DELETE RESTRICT,
 trigger_type text NOT NULL CHECK(trigger_type IN ('manual','lead_received','stage_changed')),
 subject text NOT NULL CHECK(length(btrim(subject)) BETWEEN 2 AND 200),
 body text NOT NULL CHECK(length(btrim(body)) BETWEEN 10 AND 10000),
 status text NOT NULL DEFAULT 'draft' CHECK(status IN ('draft','active','paused','completed')),
 cooldown_days integer NOT NULL DEFAULT 7 CHECK(cooldown_days BETWEEN 0 AND 365),
 daily_cap integer NOT NULL DEFAULT 50 CHECK(daily_cap BETWEEN 0 AND 100000),
 activated_at timestamptz,manual_cursor uuid,manual_done boolean NOT NULL DEFAULT false,next_scan_at timestamptz NOT NULL DEFAULT now(),
 event_cursor_at timestamptz,event_cursor_id uuid,
 created_by uuid REFERENCES users(id) ON DELETE SET NULL,
 created_at timestamptz NOT NULL DEFAULT now(),updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ix_marketing_campaigns_active ON marketing_campaigns(trigger_type,created_at) WHERE status='active';
CREATE TRIGGER trg_marketing_campaigns_updated_at BEFORE UPDATE ON marketing_campaigns FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE marketing_deliveries (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),campaign_id uuid NOT NULL REFERENCES marketing_campaigns(id) ON DELETE RESTRICT,
 contact_id uuid NOT NULL REFERENCES crm_contacts(id) ON DELETE CASCADE,
 source_event_id uuid REFERENCES crm_history(id) ON DELETE SET NULL,
 dedupe_key text NOT NULL UNIQUE,
 status text NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','sending','sent','failed','skipped')),
 attempt_count integer NOT NULL DEFAULT 0 CHECK(attempt_count BETWEEN 0 AND 5),
 scheduled_at timestamptz NOT NULL DEFAULT now(),next_attempt_at timestamptz NOT NULL DEFAULT now(),
 started_at timestamptz,sent_at timestamptz,error_message text,skip_reason text,provider_response jsonb,
 created_at timestamptz NOT NULL DEFAULT now(),updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ix_marketing_deliveries_queue ON marketing_deliveries(next_attempt_at,created_at) WHERE status IN ('pending','failed');
CREATE INDEX ix_marketing_deliveries_contact_sent ON marketing_deliveries(contact_id,sent_at DESC) WHERE status='sent';
CREATE INDEX ix_marketing_deliveries_campaign ON marketing_deliveries(campaign_id,status,created_at DESC);
CREATE TRIGGER trg_marketing_deliveries_updated_at BEFORE UPDATE ON marketing_deliveries FOR EACH ROW EXECUTE FUNCTION set_updated_at();
