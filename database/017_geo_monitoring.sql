-- V3 GEO monitoring. Existing geo_prompts/geo_samples remain available for legacy views.
CREATE TABLE geo_model_profiles (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),code text NOT NULL UNIQUE CHECK(code ~ '^[a-z0-9][a-z0-9_-]{1,39}$'),
 display_name text NOT NULL CHECK(length(trim(display_name)) BETWEEN 2 AND 100),provider text NOT NULL CHECK(length(trim(provider)) BETWEEN 2 AND 80),
 model text NOT NULL,endpoint text NOT NULL,credential_source text NOT NULL CHECK(credential_source IN ('site_default','profile')),
 key_cipher text,has_credential boolean NOT NULL DEFAULT false,
 input_usd_per_million numeric(12,6) NOT NULL CHECK(input_usd_per_million>=0),
 output_usd_per_million numeric(12,6) NOT NULL CHECK(output_usd_per_million>=0),
 max_output_tokens integer NOT NULL DEFAULT 1200 CHECK(max_output_tokens BETWEEN 300 AND 3000),
 is_enabled boolean NOT NULL DEFAULT false,created_by uuid REFERENCES users(id) ON DELETE SET NULL,
 created_at timestamptz NOT NULL DEFAULT now(),updated_at timestamptz NOT NULL DEFAULT now(),
 CHECK(credential_source='site_default' OR has_credential)
);
CREATE TRIGGER trg_geo_model_profiles_updated_at BEFORE UPDATE ON geo_model_profiles FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE geo_regions (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),code text NOT NULL UNIQUE CHECK(code ~ '^[a-z0-9][a-z0-9_-]{1,39}$'),
 display_name text NOT NULL CHECK(length(trim(display_name)) BETWEEN 2 AND 100),
 country_code text CHECK(country_code IS NULL OR country_code ~ '^[A-Z]{2}$'),
 description text,is_enabled boolean NOT NULL DEFAULT true,
 created_by uuid REFERENCES users(id) ON DELETE SET NULL,created_at timestamptz NOT NULL DEFAULT now(),updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TRIGGER trg_geo_regions_updated_at BEFORE UPDATE ON geo_regions FOR EACH ROW EXECUTE FUNCTION set_updated_at();
INSERT INTO geo_regions(code,display_name,description) VALUES('local','本地服务器','使用当前 Worker 的出站网络；不代表目标市场所在地区。');

CREATE TABLE geo_worker_heartbeats (
 worker_id text PRIMARY KEY CHECK(length(worker_id) BETWEEN 2 AND 120),
 region_id uuid NOT NULL REFERENCES geo_regions(id) ON DELETE CASCADE,
 last_seen_at timestamptz NOT NULL DEFAULT now(),started_at timestamptz NOT NULL DEFAULT now(),
 CHECK(worker_id !~ '[[:space:]]')
);
CREATE INDEX ix_geo_worker_heartbeats_region ON geo_worker_heartbeats(region_id,last_seen_at DESC);

CREATE TABLE geo_monitor_targets (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),prompt_id uuid NOT NULL REFERENCES geo_prompts(id) ON DELETE CASCADE,
 model_profile_id uuid NOT NULL REFERENCES geo_model_profiles(id) ON DELETE RESTRICT,
 region_id uuid NOT NULL REFERENCES geo_regions(id) ON DELETE RESTRICT,
 interval_minutes integer NOT NULL DEFAULT 1440 CHECK(interval_minutes BETWEEN 60 AND 10080),
 is_enabled boolean NOT NULL DEFAULT false,next_run_at timestamptz NOT NULL DEFAULT now(),
 last_run_at timestamptz,last_error text,created_by uuid REFERENCES users(id) ON DELETE SET NULL,
 created_at timestamptz NOT NULL DEFAULT now(),updated_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE(prompt_id,model_profile_id,region_id)
);
CREATE INDEX ix_geo_monitor_targets_due ON geo_monitor_targets(next_run_at) WHERE is_enabled;
CREATE TRIGGER trg_geo_monitor_targets_updated_at BEFORE UPDATE ON geo_monitor_targets FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE geo_monitor_budget (
 singleton_key boolean PRIMARY KEY DEFAULT true CHECK(singleton_key),
 daily_limit_usd numeric(12,4) NOT NULL DEFAULT 5 CHECK(daily_limit_usd BETWEEN 0 AND 1000000),
 monthly_limit_usd numeric(12,4) NOT NULL DEFAULT 50 CHECK(monthly_limit_usd BETWEEN 0 AND 10000000),
 max_queued_jobs integer NOT NULL DEFAULT 500 CHECK(max_queued_jobs BETWEEN 1 AND 100000),
 is_enabled boolean NOT NULL DEFAULT false,updated_by uuid REFERENCES users(id) ON DELETE SET NULL,
 updated_at timestamptz NOT NULL DEFAULT now()
);
INSERT INTO geo_monitor_budget(singleton_key) VALUES(true);
CREATE TRIGGER trg_geo_monitor_budget_updated_at BEFORE UPDATE ON geo_monitor_budget FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE geo_budget_windows (
 period text NOT NULL CHECK(period IN ('day','month')),starts_on date NOT NULL,
 spent_usd numeric(16,8) NOT NULL DEFAULT 0 CHECK(spent_usd>=0),
 reserved_usd numeric(16,8) NOT NULL DEFAULT 0 CHECK(reserved_usd>=0),
 sample_count bigint NOT NULL DEFAULT 0 CHECK(sample_count>=0),updated_at timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY(period,starts_on)
);

CREATE TABLE geo_sample_jobs (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),target_id uuid NOT NULL REFERENCES geo_monitor_targets(id) ON DELETE CASCADE,
 kind text NOT NULL CHECK(kind IN ('manual','scheduled')),
 status text NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','processing','completed','failed','blocked_budget')),
 scheduled_at timestamptz NOT NULL DEFAULT now(),attempt_count integer NOT NULL DEFAULT 0 CHECK(attempt_count BETWEEN 0 AND 3),
 reserved_usd numeric(16,8) NOT NULL DEFAULT 0 CHECK(reserved_usd>=0),
 input_rate_usd numeric(12,6),output_rate_usd numeric(12,6),budget_day date,budget_month date,
 runner_id text,region_code text,error_message text,
 started_at timestamptz,finished_at timestamptz,created_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE(target_id,scheduled_at)
);
CREATE INDEX ix_geo_sample_jobs_due ON geo_sample_jobs(scheduled_at,created_at) WHERE status='pending';
CREATE INDEX ix_geo_sample_jobs_target ON geo_sample_jobs(target_id,created_at DESC);
CREATE INDEX ix_geo_sample_jobs_running ON geo_sample_jobs(started_at) WHERE status='processing';

ALTER TABLE geo_samples ADD COLUMN monitor_target_id uuid REFERENCES geo_monitor_targets(id) ON DELETE SET NULL;
ALTER TABLE geo_samples ADD COLUMN monitor_job_id uuid UNIQUE REFERENCES geo_sample_jobs(id) ON DELETE SET NULL;
ALTER TABLE geo_samples ADD COLUMN model_profile_id uuid REFERENCES geo_model_profiles(id) ON DELETE SET NULL;
ALTER TABLE geo_samples ADD COLUMN region_id uuid REFERENCES geo_regions(id) ON DELETE SET NULL;
ALTER TABLE geo_samples ADD COLUMN provider_snapshot text;
ALTER TABLE geo_samples ADD COLUMN runner_id text;
ALTER TABLE geo_samples ADD COLUMN input_tokens integer CHECK(input_tokens IS NULL OR input_tokens>=0);
ALTER TABLE geo_samples ADD COLUMN output_tokens integer CHECK(output_tokens IS NULL OR output_tokens>=0);
ALTER TABLE geo_samples ADD COLUMN usage_source text CHECK(usage_source IS NULL OR usage_source IN ('provider','estimated'));
ALTER TABLE geo_samples ADD COLUMN cost_usd numeric(16,8) CHECK(cost_usd IS NULL OR cost_usd>=0);
ALTER TABLE geo_samples ADD COLUMN input_rate_usd numeric(12,6);
ALTER TABLE geo_samples ADD COLUMN output_rate_usd numeric(12,6);
CREATE INDEX ix_geo_samples_monitor_time ON geo_samples(monitor_target_id,sampled_at DESC) WHERE monitor_target_id IS NOT NULL;
CREATE INDEX ix_geo_samples_region_model ON geo_samples(region_id,model_profile_id,sampled_at DESC) WHERE monitor_target_id IS NOT NULL;

CREATE TABLE geo_daily_rollups (
 day date NOT NULL,target_id uuid NOT NULL REFERENCES geo_monitor_targets(id) ON DELETE CASCADE,
 config_hash char(64) NOT NULL,samples integer NOT NULL DEFAULT 0,
 mentions integer NOT NULL DEFAULT 0,citations integer NOT NULL DEFAULT 0,
 input_tokens bigint NOT NULL DEFAULT 0,output_tokens bigint NOT NULL DEFAULT 0,
 cost_usd numeric(16,8) NOT NULL DEFAULT 0,duration_ms bigint NOT NULL DEFAULT 0,
 PRIMARY KEY(day,target_id,config_hash)
);
CREATE INDEX ix_geo_daily_rollups_target ON geo_daily_rollups(target_id,day DESC);

-- Stop legacy unbudgeted schedules. Operators recreate each prompt/model/region combination as a monitored target.
UPDATE geo_sampling_schedules SET is_enabled=false,last_error='已升级至 GEO 监测中心；请建立带预算的采样目标' WHERE is_enabled;
