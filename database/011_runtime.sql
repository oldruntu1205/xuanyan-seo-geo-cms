-- Business runtime support. Auth lives in payload_internal; public.users contains audit identities.
CREATE TABLE published_documents (
 route text PRIMARY KEY, locale_id uuid NOT NULL REFERENCES locales(id), entity_type text NOT NULL,
 entity_id uuid NOT NULL, snapshot jsonb NOT NULL, published_at timestamptz NOT NULL DEFAULT now(),
 job_id uuid REFERENCES publish_jobs(id) ON DELETE SET NULL
);
CREATE INDEX ix_published_locale_type ON published_documents(locale_id,entity_type);
CREATE TABLE site_paths (
 path text PRIMARY KEY, locale_id uuid NOT NULL REFERENCES locales(id), entity_type text NOT NULL,
 entity_id uuid NOT NULL, UNIQUE(entity_type,entity_id)
);
CREATE TABLE api_rate_limits (key text PRIMARY KEY, window_start timestamptz NOT NULL, count integer NOT NULL CHECK(count>0));
CREATE TABLE public_submissions (key uuid PRIMARY KEY, inquiry_id uuid NOT NULL REFERENCES inquiries(id) ON DELETE CASCADE, created_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE runtime_settings (key text PRIMARY KEY, value jsonb NOT NULL DEFAULT '{}');
CREATE FUNCTION guard_site_path() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE locale_code text; old_path text;
BEGIN
 IF TG_OP='DELETE' THEN DELETE FROM site_paths WHERE entity_type=TG_TABLE_NAME AND entity_id=OLD.id; RETURN OLD; END IF;
 IF (to_jsonb(NEW)->>'deleted_at') IS NOT NULL THEN DELETE FROM site_paths WHERE entity_type=TG_TABLE_NAME AND entity_id=NEW.id; RETURN NEW; END IF;
 SELECT code INTO locale_code FROM locales WHERE id=NEW.locale_id;
 NEW.path := rtrim(NEW.path,'/');
 IF NEW.path !~ '^/[a-z0-9][a-z0-9/_-]*$' OR NEW.path LIKE '%//%' OR NOT (NEW.path='/'||locale_code OR NEW.path LIKE '/'||locale_code||'/%') THEN
  RAISE EXCEPTION 'Path must be a lowercase ASCII path under /%',locale_code USING ERRCODE='23514';
 END IF;
 IF EXISTS(SELECT 1 FROM redirects WHERE source_path=NEW.path AND is_enabled) THEN RAISE EXCEPTION 'Path is reserved by an enabled redirect' USING ERRCODE='23505'; END IF;
 DELETE FROM site_paths WHERE entity_type=TG_TABLE_NAME AND entity_id=NEW.id AND path<>NEW.path;
 INSERT INTO site_paths(path,locale_id,entity_type,entity_id) VALUES(NEW.path,NEW.locale_id,TG_TABLE_NAME,NEW.id)
 ON CONFLICT(entity_type,entity_id) DO UPDATE SET path=EXCLUDED.path,locale_id=EXCLUDED.locale_id;
 RETURN NEW;
END $$;
CREATE TRIGGER trg_content_site_path BEFORE INSERT OR UPDATE OR DELETE ON content_item_translations FOR EACH ROW EXECUTE FUNCTION guard_site_path();
CREATE TRIGGER trg_product_site_path BEFORE INSERT OR UPDATE OR DELETE ON product_translations FOR EACH ROW EXECUTE FUNCTION guard_site_path();
CREATE TRIGGER trg_taxonomy_site_path BEFORE INSERT OR UPDATE OR DELETE ON taxonomy_term_translations FOR EACH ROW EXECUTE FUNCTION guard_site_path();
INSERT INTO site_paths SELECT path,locale_id,'content_item_translations',id FROM content_item_translations WHERE deleted_at IS NULL;
INSERT INTO site_paths SELECT path,locale_id,'product_translations',id FROM product_translations WHERE deleted_at IS NULL;
INSERT INTO site_paths SELECT path,locale_id,'taxonomy_term_translations',id FROM taxonomy_term_translations;
CREATE FUNCTION guard_redirect() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE cursor_path text; visited text[]; n integer;
BEGIN
 IF NOT NEW.is_enabled THEN RETURN NEW; END IF;
 NEW.source_path:=rtrim(NEW.source_path,'/');
 IF NEW.source_path !~ '^/[a-z0-9][a-z0-9/_-]*$' THEN RAISE EXCEPTION 'Invalid redirect source' USING ERRCODE='23514'; END IF;
 IF EXISTS(SELECT 1 FROM site_paths WHERE path=NEW.source_path) THEN RAISE EXCEPTION 'Redirect source is a live content path' USING ERRCODE='23505'; END IF;
 IF NEW.target_url LIKE '//%' OR NEW.target_url ~ '[[:cntrl:]]' THEN RAISE EXCEPTION 'Invalid redirect target' USING ERRCODE='23514'; END IF;
 cursor_path:=rtrim(NEW.target_url,'/'); visited:=ARRAY[NEW.source_path];
 FOR n IN 1..32 LOOP
  IF cursor_path=ANY(visited) THEN RAISE EXCEPTION 'Redirect cycle' USING ERRCODE='23514'; END IF;
  visited:=array_append(visited,cursor_path);
  SELECT rtrim(target_url,'/') INTO cursor_path FROM redirects WHERE source_path=cursor_path AND is_enabled AND id<>NEW.id LIMIT 1;
  IF cursor_path IS NULL THEN RETURN NEW; END IF;
 END LOOP;
 RAISE EXCEPTION 'Redirect chain too long' USING ERRCODE='23514';
END $$;
CREATE TRIGGER trg_guard_redirect BEFORE INSERT OR UPDATE ON redirects FOR EACH ROW EXECUTE FUNCTION guard_redirect();
CREATE UNIQUE INDEX uq_redirect_source ON redirects(source_path);
CREATE UNIQUE INDEX uq_media_location ON media_assets(storage_provider,coalesce(bucket,''),object_key);
CREATE UNIQUE INDEX uq_revisions_null_locale ON content_revisions(entity_type,entity_id,version_number) WHERE locale_id IS NULL;
ALTER TABLE product_spec_values DROP CONSTRAINT product_spec_values_check;
ALTER TABLE product_spec_values ADD CONSTRAINT ck_spec_one_value CHECK(num_nonnulls(value_text,value_number,value_boolean)=1);
CREATE FUNCTION guard_spec_value() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE kind text;
BEGIN
 SELECT data_type INTO kind FROM product_spec_definitions WHERE id=NEW.spec_definition_id FOR SHARE;
 IF (kind IN ('text','option') AND NEW.value_text IS NULL) OR (kind='number' AND NEW.value_number IS NULL) OR (kind='boolean' AND NEW.value_boolean IS NULL) THEN RAISE EXCEPTION 'Specification value has wrong type' USING ERRCODE='23514'; END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER trg_spec_type BEFORE INSERT OR UPDATE ON product_spec_values FOR EACH ROW EXECUTE FUNCTION guard_spec_value();
CREATE FUNCTION guard_spec_definition() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN IF OLD.data_type<>NEW.data_type AND EXISTS(SELECT 1 FROM product_spec_values WHERE spec_definition_id=NEW.id) THEN RAISE EXCEPTION 'Cannot change a populated specification type' USING ERRCODE='23514'; END IF; RETURN NEW; END $$;
CREATE TRIGGER trg_spec_definition_type BEFORE UPDATE ON product_spec_definitions FOR EACH ROW EXECUTE FUNCTION guard_spec_definition();
