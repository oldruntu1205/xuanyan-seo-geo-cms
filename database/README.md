# SEO/GEO CMS V1.0 PostgreSQL migrations

Target: PostgreSQL 16+. Run the numbered files in lexical order, in one database, with a role allowed to create extensions, tables, triggers, and indexes:

```powershell
Get-ChildItem .\outputs\0*.sql | Sort-Object Name | ForEach-Object { psql "$env:DATABASE_URL" -v ON_ERROR_STOP=1 -f $_.FullName }
```

Rollback is manual and destructive. Run `rollback/010_seed.down.sql` through `rollback/001_extensions.down.sql` in descending numeric order. The extension rollback may affect other applications in the same database; omit it when extensions are shared.

Each migration is intended to be applied once. PostgreSQL statements are transactional when executed by `psql` per file except extension operations and environments that wrap commands differently. Take a database backup before applying to a database containing existing data.

## Notes

- `content_item_translations.path` and `product_translations.path` are unique per locale while rows are live; soft-deleted records free their route.
- `static_routes.route` is globally unique because routes include the locale prefix.
- Updates to the path of published content or products register/update a 301 redirect. Application code should still validate that a redirect cannot form a loop.
- `search_vector` is maintained by triggers using PostgreSQL's `simple` text configuration. For language-specific stemming, replace it with locale-aware configurations in the search layer.
- Secrets are represented by `integration_connections.secret_ref`; credentials should be stored in a secrets manager, not in `config`.
- Polymorphic entity references (revision, menu links, publish jobs) intentionally do not use a single-table foreign key. Validate those references in the application layer.
- The database stores Hero scheduling, images, copy and links. Responsive rendering, first-slide preload, image conversion, CDN invalidation, static file generation, sitemap output and the Redis/BullMQ worker are application responsibilities.

## Rollback order

```text
010_seed → 009_indexes_constraints → 008_leads_integrations → 007_publishing →
006_media_appearance → 005_seo_geo → 004_product → 003_content →
002_core_system → 001_extensions
```
