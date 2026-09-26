-- Run after 001..010. Raises an exception if expected schema features are missing.
DO $$
DECLARE missing text;
BEGIN
 SELECT string_agg(x.name, ', ') INTO missing
 FROM (VALUES
  ('locales'),('site_settings'),('users'),('roles'),('permissions'),('audit_logs'),
  ('content_items'),('content_item_translations'),('content_blocks'),('content_revisions'),
  ('taxonomies'),('taxonomy_terms'),('faq_items'),('products'),('product_translations'),
  ('product_spec_values'),('media_assets'),('seo_metadata'),('geo_profiles'),('schema_markup'),
  ('hero_slides'),('menus'),('customer_service_channels'),('publish_jobs'),('static_routes'),
  ('redirects'),('inquiries'),('inquiry_items'),('integration_connections')
 ) AS x(name)
 WHERE to_regclass('public.'||x.name) IS NULL;
 IF missing IS NOT NULL THEN RAISE EXCEPTION 'Missing required tables: %', missing; END IF;
 IF (SELECT count(*) FROM locales) < 9 THEN RAISE EXCEPTION 'Expected at least 9 seeded locales'; END IF;
 IF (SELECT count(*) FROM pg_trigger WHERE NOT tgisinternal AND tgname LIKE 'trg\_%\_updated\_at' ESCAPE '\') < 20 THEN RAISE EXCEPTION 'updated_at triggers are missing'; END IF;
 IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname='public' AND indexname='ix_content_search_vector') THEN RAISE EXCEPTION 'Content GIN search index is missing'; END IF;
 IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname='public' AND indexname='uq_content_locale_path_live') THEN RAISE EXCEPTION 'Content localized route uniqueness index is missing'; END IF;
 IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname='trg_product_path_redirect' AND NOT tgisinternal) THEN RAISE EXCEPTION 'Product path redirect trigger is missing'; END IF;
 RAISE NOTICE 'CMS schema verification passed';
END $$;
