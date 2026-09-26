-- Canonical path uniqueness is per locale and excludes soft-deleted records.
CREATE UNIQUE INDEX uq_content_locale_path_live ON content_item_translations(locale_id,path) WHERE deleted_at IS NULL;
CREATE UNIQUE INDEX uq_product_locale_path_live ON product_translations(locale_id,path) WHERE deleted_at IS NULL;
CREATE UNIQUE INDEX uq_term_locale_path_live ON taxonomy_term_translations(locale_id,path);
CREATE UNIQUE INDEX uq_redirect_locale_source_live ON redirects(COALESCE(locale_id,'00000000-0000-0000-0000-000000000000'::uuid),source_path);
CREATE INDEX ix_content_parent ON content_items(parent_id) WHERE deleted_at IS NULL;
CREATE INDEX ix_content_type_status ON content_items(content_type,status) WHERE deleted_at IS NULL;
CREATE INDEX ix_content_translation_schedule ON content_item_translations(status,scheduled_at) WHERE deleted_at IS NULL;
CREATE INDEX ix_content_search_vector ON content_item_translations USING gin(search_vector);
CREATE INDEX ix_content_title_trgm ON content_item_translations USING gin(title gin_trgm_ops);
CREATE INDEX ix_product_status ON products(status) WHERE deleted_at IS NULL;
CREATE INDEX ix_product_search_vector ON product_translations USING gin(search_vector);
CREATE INDEX ix_product_name_trgm ON product_translations USING gin(name gin_trgm_ops);
CREATE INDEX ix_product_specs_number ON product_spec_values(spec_definition_id,value_number) WHERE value_number IS NOT NULL;
CREATE INDEX ix_terms_parent ON taxonomy_terms(taxonomy_id,parent_id) WHERE deleted_at IS NULL;
CREATE INDEX ix_blocks_translation_order ON content_blocks(content_translation_id,sort_order) WHERE is_enabled;
CREATE INDEX ix_audit_entity ON audit_logs(entity_type,entity_id);
CREATE INDEX ix_audit_user_created ON audit_logs(user_id,created_at DESC);
CREATE INDEX ix_media_sha256 ON media_assets(sha256) WHERE sha256 IS NOT NULL;
CREATE INDEX ix_publish_queue ON publish_jobs(status,priority DESC,created_at) WHERE status IN ('pending','retrying');
CREATE INDEX ix_publish_scheduled ON publish_jobs(scheduled_at) WHERE status='pending' AND scheduled_at IS NOT NULL;
CREATE INDEX ix_publish_entity ON publish_jobs(entity_type,entity_id,created_at DESC);
CREATE INDEX ix_routes_entity ON static_routes(entity_type,entity_id);
CREATE INDEX ix_routes_status ON static_routes(status,updated_at);
CREATE INDEX ix_redirect_enabled_source ON redirects(source_path) WHERE is_enabled;
CREATE INDEX ix_inquiries_created ON inquiries(created_at DESC);
CREATE INDEX ix_inquiries_status_assigned ON inquiries(status,assigned_to,created_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX ix_inquiries_email ON inquiries(email);
CREATE INDEX ix_inquiry_items_product ON inquiry_items(product_id);
CREATE INDEX ix_download_media_created ON download_events(media_id,created_at DESC);
CREATE INDEX ix_geo_facts_profile ON geo_key_facts(geo_profile_id,sort_order);
CREATE INDEX ix_geo_refs_profile ON geo_references(geo_profile_id,sort_order);

-- Maintain searchable text vectors from human-readable content fields.
CREATE FUNCTION refresh_content_search_vector() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN NEW.search_vector := to_tsvector('simple', coalesce(NEW.title,'') || ' ' || coalesce(NEW.excerpt,'') || ' ' || coalesce(NEW.body::text,'')); RETURN NEW; END $$;
CREATE TRIGGER trg_content_search_vector BEFORE INSERT OR UPDATE OF title,excerpt,body ON content_item_translations FOR EACH ROW EXECUTE FUNCTION refresh_content_search_vector();
CREATE FUNCTION refresh_product_search_vector() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN NEW.search_vector := to_tsvector('simple', coalesce(NEW.name,'') || ' ' || coalesce(NEW.short_description,'') || ' ' || coalesce(NEW.description,'') || ' ' || coalesce(NEW.features::text,'') || ' ' || coalesce(NEW.applications::text,'')); RETURN NEW; END $$;
CREATE TRIGGER trg_product_search_vector BEFORE INSERT OR UPDATE OF name,short_description,description,features,applications ON product_translations FOR EACH ROW EXECUTE FUNCTION refresh_product_search_vector();

-- Preserve old public URLs as permanent redirects whenever an editor changes a path.
CREATE FUNCTION register_content_path_redirect() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF OLD.path IS DISTINCT FROM NEW.path
    AND OLD.deleted_at IS NULL
    AND ((TG_TABLE_NAME='content_item_translations' AND to_jsonb(OLD)->>'status'='published')
      OR (TG_TABLE_NAME='product_translations' AND to_jsonb(OLD)->>'publish_status'='published')) THEN
  UPDATE redirects SET target_url=NEW.path,redirect_type=301,is_enabled=true,updated_at=now()
  WHERE COALESCE(locale_id,'00000000-0000-0000-0000-000000000000'::uuid)=COALESCE(OLD.locale_id,'00000000-0000-0000-0000-000000000000'::uuid)
    AND source_path=OLD.path;
  IF NOT FOUND THEN
   INSERT INTO redirects(locale_id,source_path,target_url,redirect_type,is_enabled)
   VALUES(OLD.locale_id,OLD.path,NEW.path,301,true);
  END IF;
 END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER trg_content_path_redirect AFTER UPDATE OF path ON content_item_translations FOR EACH ROW EXECUTE FUNCTION register_content_path_redirect();
CREATE TRIGGER trg_product_path_redirect AFTER UPDATE OF path ON product_translations FOR EACH ROW EXECUTE FUNCTION register_content_path_redirect();

-- updated_at trigger on every table that has that column.
DO $$ DECLARE t text; BEGIN
 FOREACH t IN ARRAY ARRAY['locales','users','roles','site_settings','site_setting_translations','content_items','content_item_translations','content_blocks','taxonomies','taxonomy_terms','taxonomy_term_translations','faq_items','faq_item_translations','products','product_translations','product_spec_definitions','seo_metadata','geo_profiles','schema_markup','hero_slides','menus','menu_items','customer_service_channels','publish_jobs','static_routes','redirects','inquiries','integration_connections'] LOOP
  EXECUTE format('CREATE TRIGGER %I BEFORE UPDATE ON %I FOR EACH ROW EXECUTE FUNCTION set_updated_at()', 'trg_'||t||'_updated_at', t);
 END LOOP;
END $$;
