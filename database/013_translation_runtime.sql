-- Async machine translation runtime; keeps the original 007 migration checksum intact.
ALTER TABLE translation_jobs ADD COLUMN error_message text;
ALTER TABLE translation_jobs ADD COLUMN target_translation_id uuid;
ALTER TABLE translation_jobs ADD COLUMN attempt_count integer NOT NULL DEFAULT 0 CHECK(attempt_count>=0);
CREATE INDEX ix_translation_jobs_status_created ON translation_jobs(status,created_at);
CREATE UNIQUE INDEX uq_translation_job_active ON translation_jobs(entity_type,entity_id,target_locale_id) WHERE status IN ('pending','processing');
