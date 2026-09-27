-- V2.1: collaboration, monitored research, reviewed outreach, CRM bridge.
ALTER TABLE translation_terms ADD COLUMN approval_status text NOT NULL DEFAULT 'approved' CHECK (approval_status IN ('pending','approved','rejected'));
ALTER TABLE translation_terms ALTER COLUMN approval_status SET DEFAULT 'pending';
ALTER TABLE translation_terms ADD COLUMN reviewed_by uuid REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE translation_terms ADD COLUMN reviewed_at timestamptz;
ALTER TABLE translation_terms ADD COLUMN review_note text;
CREATE INDEX ix_translation_terms_approval ON translation_terms(approval_status,updated_at DESC);
CREATE TABLE translation_term_reviews (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),term_id uuid NOT NULL REFERENCES translation_terms(id) ON DELETE CASCADE,
 decision text NOT NULL CHECK(decision IN ('approved','rejected')),note text,reviewer_id uuid REFERENCES users(id) ON DELETE SET NULL,
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ix_translation_term_reviews_term ON translation_term_reviews(term_id,created_at DESC);

CREATE TABLE collaboration_tasks (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),kind text NOT NULL CHECK(kind IN ('translation','content_review','content_update')),
 entity_type text NOT NULL CHECK(entity_type IN ('content_item_translations','product_translations')),
 entity_id uuid NOT NULL,title text NOT NULL CHECK(length(trim(title)) BETWEEN 2 AND 200),instructions text,
 status text NOT NULL DEFAULT 'open' CHECK(status IN ('open','in_progress','in_review','done','cancelled')),
 assigned_to uuid REFERENCES users(id) ON DELETE SET NULL,created_by uuid REFERENCES users(id) ON DELETE SET NULL,
 reviewed_by uuid REFERENCES users(id) ON DELETE SET NULL,reviewed_at timestamptz,due_at timestamptz,
 created_at timestamptz NOT NULL DEFAULT now(),updated_at timestamptz NOT NULL DEFAULT now(),
 CHECK(instructions IS NULL OR length(instructions)<=4000)
);
CREATE INDEX ix_collaboration_tasks_assignee ON collaboration_tasks(assigned_to,status,due_at);
CREATE INDEX ix_collaboration_tasks_entity ON collaboration_tasks(entity_type,entity_id);
CREATE TRIGGER trg_collaboration_tasks_updated_at BEFORE UPDATE ON collaboration_tasks FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE competitor_change_events (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),page_id uuid NOT NULL REFERENCES competitor_pages(id) ON DELETE CASCADE,
 snapshot_id uuid NOT NULL UNIQUE REFERENCES competitor_snapshots(id) ON DELETE CASCADE,
 previous_snapshot_id uuid REFERENCES competitor_snapshots(id) ON DELETE SET NULL,
 changed_fields jsonb NOT NULL CHECK(jsonb_typeof(changed_fields)='array'),
 acknowledged_by uuid REFERENCES users(id) ON DELETE SET NULL,acknowledged_at timestamptz,
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ix_competitor_change_events_open ON competitor_change_events(created_at DESC) WHERE acknowledged_at IS NULL;

CREATE TABLE geo_sampling_schedules (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),prompt_id uuid NOT NULL UNIQUE REFERENCES geo_prompts(id) ON DELETE CASCADE,
 interval_minutes integer NOT NULL CHECK(interval_minutes BETWEEN 60 AND 10080),is_enabled boolean NOT NULL DEFAULT true,
 next_run_at timestamptz NOT NULL,last_run_at timestamptz,last_error text,
 created_by uuid REFERENCES users(id) ON DELETE SET NULL,updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ix_geo_sampling_schedules_due ON geo_sampling_schedules(next_run_at) WHERE is_enabled;
ALTER TABLE geo_samples ADD COLUMN sample_kind text NOT NULL DEFAULT 'manual' CHECK(sample_kind IN ('manual','scheduled'));
ALTER TABLE geo_samples ADD COLUMN prompt_snapshot text;
ALTER TABLE geo_samples ADD COLUMN market_snapshot text;
ALTER TABLE geo_samples ADD COLUMN brand_snapshot text;
ALTER TABLE geo_samples ADD COLUMN config_hash char(64);
UPDATE geo_samples s SET prompt_snapshot=p.prompt,market_snapshot=p.market,brand_snapshot=p.brand_name,
 config_hash=encode(digest(p.prompt||E'\n'||p.market||E'\n'||p.brand_name||E'\n'||s.model,'sha256'),'hex')
 FROM geo_prompts p WHERE p.id=s.prompt_id;
ALTER TABLE geo_samples ALTER COLUMN prompt_snapshot SET NOT NULL;
ALTER TABLE geo_samples ALTER COLUMN market_snapshot SET NOT NULL;
ALTER TABLE geo_samples ALTER COLUMN brand_snapshot SET NOT NULL;
ALTER TABLE geo_samples ALTER COLUMN config_hash SET NOT NULL;
CREATE INDEX ix_geo_samples_comparable ON geo_samples(prompt_id,config_hash,sampled_at DESC);

CREATE TABLE outreach_partners (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),organization text NOT NULL CHECK(length(trim(organization)) BETWEEN 2 AND 200),
 website_url text NOT NULL,contact_name text,contact_email citext,fit_note text,
 status text NOT NULL DEFAULT 'research' CHECK(status IN ('research','drafting','contacted','replied','linked','closed')),
 created_by uuid REFERENCES users(id) ON DELETE SET NULL,created_at timestamptz NOT NULL DEFAULT now(),updated_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE(website_url)
);
CREATE TABLE outreach_drafts (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),partner_id uuid NOT NULL REFERENCES outreach_partners(id) ON DELETE CASCADE,
 subject text NOT NULL CHECK(length(trim(subject)) BETWEEN 2 AND 250),body text NOT NULL CHECK(length(trim(body)) BETWEEN 10 AND 10000),
 status text NOT NULL DEFAULT 'draft' CHECK(status IN ('draft','approved','rejected','sent_manually')),
 author_id uuid REFERENCES users(id) ON DELETE SET NULL,reviewer_id uuid REFERENCES users(id) ON DELETE SET NULL,
 reviewed_at timestamptz,review_note text,manual_sent_at timestamptz,
 created_at timestamptz NOT NULL DEFAULT now(),updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ix_outreach_drafts_partner ON outreach_drafts(partner_id,created_at DESC);
CREATE TABLE outreach_replies (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),partner_id uuid NOT NULL REFERENCES outreach_partners(id) ON DELETE CASCADE,
 summary text NOT NULL CHECK(length(trim(summary)) BETWEEN 2 AND 4000),received_at timestamptz NOT NULL,
 recorded_by uuid REFERENCES users(id) ON DELETE SET NULL,created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE outreach_links (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),partner_id uuid NOT NULL REFERENCES outreach_partners(id) ON DELETE CASCADE,
 source_url text NOT NULL,target_url text NOT NULL,first_seen_at timestamptz NOT NULL DEFAULT now(),
 verification_status text NOT NULL DEFAULT 'unverified' CHECK(verification_status IN ('unverified','verified','lost')),
 recorded_by uuid REFERENCES users(id) ON DELETE SET NULL,created_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE(partner_id,source_url,target_url)
);
CREATE TRIGGER trg_outreach_partners_updated_at BEFORE UPDATE ON outreach_partners FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_outreach_drafts_updated_at BEFORE UPDATE ON outreach_drafts FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE crm_sync_links (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),inquiry_id uuid NOT NULL UNIQUE REFERENCES inquiries(id) ON DELETE CASCADE,
 external_id text UNIQUE,last_local_updated_at timestamptz,last_remote_updated_at timestamptz,
 last_synced_at timestamptz,created_at timestamptz NOT NULL DEFAULT now(),updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE crm_sync_jobs (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),direction text NOT NULL CHECK(direction IN ('push','pull')),
 inquiry_id uuid REFERENCES inquiries(id) ON DELETE CASCADE,status text NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','processing','completed','failed','conflict')),
 attempt_count integer NOT NULL DEFAULT 0 CHECK(attempt_count BETWEEN 0 AND 5),next_attempt_at timestamptz NOT NULL DEFAULT now(),
 error_message text,requested_by uuid REFERENCES users(id) ON DELETE SET NULL,created_at timestamptz NOT NULL DEFAULT now(),updated_at timestamptz NOT NULL DEFAULT now(),
 CHECK(direction='pull' OR inquiry_id IS NOT NULL)
);
CREATE INDEX ix_crm_sync_jobs_due ON crm_sync_jobs(next_attempt_at,created_at) WHERE status IN ('pending','failed');
CREATE TABLE crm_sync_conflicts (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),inquiry_id uuid REFERENCES inquiries(id) ON DELETE CASCADE,
 external_id text NOT NULL,remote_record jsonb NOT NULL CHECK(jsonb_typeof(remote_record)='object'),
 status text NOT NULL DEFAULT 'open' CHECK(status IN ('open','keep_local','use_remote')),
 resolved_by uuid REFERENCES users(id) ON DELETE SET NULL,resolved_at timestamptz,
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ix_crm_sync_conflicts_open ON crm_sync_conflicts(created_at DESC) WHERE status='open';
CREATE TRIGGER trg_crm_sync_links_updated_at BEFORE UPDATE ON crm_sync_links FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_crm_sync_jobs_updated_at BEFORE UPDATE ON crm_sync_jobs FOR EACH ROW EXECUTE FUNCTION set_updated_at();
