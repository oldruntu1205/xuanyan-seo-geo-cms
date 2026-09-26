-- Additional runtime constraints, indexes and initial settings; no credentials or sample products.
CREATE INDEX ix_published_search ON published_documents USING gin(to_tsvector('simple',coalesce(snapshot->>'title','')||' '||coalesce(snapshot->>'description','')));
CREATE INDEX ix_published_documents_json ON published_documents USING gin(snapshot jsonb_path_ops);
CREATE INDEX ix_content_body_json ON content_item_translations USING gin(body jsonb_path_ops);
CREATE INDEX ix_rate_window ON api_rate_limits(window_start);
ALTER TABLE locales ADD CONSTRAINT ck_locale_code CHECK(code ~ '^[a-z]{2,3}(-[a-z0-9]{2,4})?$');
ALTER TABLE content_item_translations ADD CONSTRAINT ck_content_body_array CHECK(jsonb_typeof(body)='array');
ALTER TABLE content_blocks ADD CONSTRAINT ck_content_block_data CHECK(jsonb_typeof(data)='object');
ALTER TABLE product_translations ADD CONSTRAINT ck_features_array CHECK(jsonb_typeof(features)='array' AND jsonb_typeof(applications)='array');
ALTER TABLE inquiries ADD COLUMN consent_at timestamptz;
-- Every FK receives an index with its leading column(s), including low-volume admin relations.
DO $$ DECLARE r record; BEGIN
 FOR r IN SELECT c.conrelid::regclass AS tab,c.conname,string_agg(quote_ident(a.attname),',' ORDER BY u.n) AS cols FROM pg_constraint c CROSS JOIN LATERAL unnest(c.conkey) WITH ORDINALITY u(attnum,n) JOIN pg_attribute a ON a.attrelid=c.conrelid AND a.attnum=u.attnum JOIN pg_namespace ns ON ns.oid=c.connamespace WHERE c.contype='f' AND ns.nspname='public' GROUP BY c.conrelid,c.conname LOOP
  EXECUTE format('CREATE INDEX %I ON %s (%s)','ix_fk_'||substr(md5(r.tab::text||r.conname),1,20),r.tab,r.cols);
 END LOOP;
END $$;
INSERT INTO permissions(code,name,module)
 SELECT g||'.'||a,g||' '||a,g FROM unnest(ARRAY['content','product','seo','media','appearance','leads','publishing','translation','history','system']) g CROSS JOIN unnest(ARRAY['read','write']) a ON CONFLICT(code) DO NOTHING;
INSERT INTO role_permissions(role_id,permission_id)
 SELECT r.id,p.id FROM roles r CROSS JOIN permissions p WHERE
 r.code IN ('admin','super_admin') OR
 (r.code IN('editor','seo_manager','translator','reviewer') AND p.code LIKE '%.read' AND p.module NOT IN('system','leads','history')) OR
 (r.code='editor' AND p.code IN('content.write','product.write','media.write','appearance.write')) OR
 (r.code='seo_manager' AND p.code='seo.write') OR
 (r.code='translator' AND p.code='translation.write') OR
 (r.code='reviewer' AND p.code IN('publishing.write','history.read')) ON CONFLICT DO NOTHING;
INSERT INTO site_settings(id,site_name,primary_domain,default_locale_id,enable_indexing)
 SELECT '00000000-0000-4000-a000-000000000001','SUNS Glassware','http://localhost:3000',id,false FROM locales WHERE is_default ON CONFLICT DO NOTHING;
INSERT INTO publish_jobs(id,job_type,entity_type,metadata)
 VALUES('00000000-0000-4000-a000-000000000002','rebuild','site','{"reason":"Initial empty site"}');
