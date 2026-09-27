-- V2.0 operational records. Historical migrations remain immutable.
CREATE TABLE translation_terms (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),source_locale_id uuid NOT NULL REFERENCES locales(id),target_locale_id uuid NOT NULL REFERENCES locales(id),
 source_term text NOT NULL,target_term text NOT NULL,note text,created_by uuid REFERENCES users(id) ON DELETE SET NULL,
 created_at timestamptz NOT NULL DEFAULT now(),updated_at timestamptz NOT NULL DEFAULT now(),
 CHECK(source_locale_id<>target_locale_id),CHECK(length(trim(source_term)) BETWEEN 1 AND 200),CHECK(length(trim(target_term)) BETWEEN 1 AND 200)
);
CREATE UNIQUE INDEX uq_translation_terms_pair ON translation_terms(source_locale_id,target_locale_id,lower(source_term));
CREATE TABLE translation_memory (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),source_locale_id uuid NOT NULL REFERENCES locales(id),target_locale_id uuid NOT NULL REFERENCES locales(id),
 source_hash char(64) NOT NULL,source_text text NOT NULL,target_text text NOT NULL,approved_by uuid REFERENCES users(id) ON DELETE SET NULL,
 created_at timestamptz NOT NULL DEFAULT now(),updated_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE(source_locale_id,target_locale_id,source_hash),CHECK(source_locale_id<>target_locale_id)
);
CREATE INDEX ix_translation_memory_lookup ON translation_memory(source_locale_id,target_locale_id,source_hash);

CREATE TABLE keyword_imports (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),property_url text NOT NULL,locale_id uuid NOT NULL REFERENCES locales(id),
 date_start date NOT NULL,date_end date NOT NULL,source text NOT NULL DEFAULT 'search_console_csv' CHECK(source='search_console_csv'),
 row_count integer NOT NULL DEFAULT 0 CHECK(row_count>=0),imported_by uuid REFERENCES users(id) ON DELETE SET NULL,
 created_at timestamptz NOT NULL DEFAULT now(),CHECK(date_end>=date_start)
);
CREATE TABLE keyword_observations (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),import_id uuid NOT NULL REFERENCES keyword_imports(id) ON DELETE CASCADE,
 query_text text NOT NULL,page_url text NOT NULL,clicks integer NOT NULL CHECK(clicks>=0),impressions integer NOT NULL CHECK(impressions>=0),
 ctr numeric(7,6) NOT NULL CHECK(ctr BETWEEN 0 AND 1),position numeric(8,3) NOT NULL CHECK(position>=0),
 UNIQUE(import_id,query_text,page_url)
);
CREATE INDEX ix_keyword_imports_date ON keyword_imports(created_at DESC);
CREATE INDEX ix_keyword_observations_query ON keyword_observations USING gin(query_text gin_trgm_ops);

CREATE TABLE competitor_pages (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),url text NOT NULL UNIQUE,label text NOT NULL,locale_id uuid REFERENCES locales(id),
 created_by uuid REFERENCES users(id) ON DELETE SET NULL,created_at timestamptz NOT NULL DEFAULT now(),last_checked_at timestamptz
);
CREATE TABLE competitor_snapshots (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),page_id uuid NOT NULL REFERENCES competitor_pages(id) ON DELETE CASCADE,
 title text,description text,canonical_url text,headings jsonb NOT NULL DEFAULT '[]',content_hash char(64) NOT NULL,
 fetched_at timestamptz NOT NULL DEFAULT now(),CHECK(jsonb_typeof(headings)='array')
);
CREATE INDEX ix_competitor_snapshots_page_time ON competitor_snapshots(page_id,fetched_at DESC);

CREATE TABLE geo_prompts (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),locale_id uuid NOT NULL REFERENCES locales(id),market text NOT NULL,prompt text NOT NULL,
 brand_name text NOT NULL,is_enabled boolean NOT NULL DEFAULT true,created_by uuid REFERENCES users(id) ON DELETE SET NULL,
 created_at timestamptz NOT NULL DEFAULT now(),updated_at timestamptz NOT NULL DEFAULT now(),
 CHECK(length(trim(market)) BETWEEN 2 AND 80),CHECK(length(trim(prompt)) BETWEEN 10 AND 1000)
);
CREATE TABLE geo_samples (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),prompt_id uuid NOT NULL REFERENCES geo_prompts(id) ON DELETE CASCADE,
 model text NOT NULL,answer text NOT NULL,citations jsonb NOT NULL DEFAULT '[]',brand_mentioned boolean NOT NULL,
 usage jsonb NOT NULL DEFAULT '{}',duration_ms integer NOT NULL CHECK(duration_ms>=0),sampled_at timestamptz NOT NULL DEFAULT now(),
 CHECK(jsonb_typeof(citations)='array')
);
CREATE INDEX ix_geo_samples_prompt_time ON geo_samples(prompt_id,sampled_at DESC);

ALTER TABLE inquiries ADD COLUMN next_follow_up_at timestamptz;
CREATE INDEX ix_inquiries_follow_up ON inquiries(next_follow_up_at) WHERE deleted_at IS NULL AND next_follow_up_at IS NOT NULL;
CREATE TABLE inquiry_notes (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),inquiry_id uuid NOT NULL REFERENCES inquiries(id) ON DELETE CASCADE,
 note text NOT NULL,created_by uuid REFERENCES users(id) ON DELETE SET NULL,created_at timestamptz NOT NULL DEFAULT now(),
 CHECK(length(trim(note)) BETWEEN 2 AND 4000)
);
CREATE INDEX ix_inquiry_notes_history ON inquiry_notes(inquiry_id,created_at DESC);

CREATE TABLE ai_assistant_runs (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),entity_type text NOT NULL CHECK(entity_type IN ('content_item_translations','product_translations')),
 entity_id uuid NOT NULL,task text NOT NULL CHECK(task IN ('writing','translation','seo')),
 instruction text NOT NULL,result text NOT NULL,model text NOT NULL,usage jsonb NOT NULL DEFAULT '{}',duration_ms integer NOT NULL CHECK(duration_ms>=0),
 requested_by uuid REFERENCES users(id) ON DELETE SET NULL,created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ix_ai_assistant_runs_actor_time ON ai_assistant_runs(requested_by,created_at DESC);

CREATE TABLE ai_writing_runs (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),locale_id uuid NOT NULL REFERENCES locales(id),product_translation_id uuid REFERENCES product_translations(id) ON DELETE SET NULL,
 topic text NOT NULL,source_notes text,keywords text,model text NOT NULL,usage jsonb NOT NULL DEFAULT '{}',duration_ms integer NOT NULL CHECK(duration_ms>=0),
 generated_draft jsonb NOT NULL,saved_translation_id uuid REFERENCES content_item_translations(id) ON DELETE SET NULL,
 requested_by uuid REFERENCES users(id) ON DELETE SET NULL,created_at timestamptz NOT NULL DEFAULT now(),
 CHECK(jsonb_typeof(generated_draft)='object')
);
CREATE INDEX ix_ai_writing_runs_actor_time ON ai_writing_runs(requested_by,created_at DESC);

CREATE TRIGGER trg_translation_terms_updated_at BEFORE UPDATE ON translation_terms FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_translation_memory_updated_at BEFORE UPDATE ON translation_memory FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_geo_prompts_updated_at BEFORE UPDATE ON geo_prompts FOR EACH ROW EXECUTE FUNCTION set_updated_at();
