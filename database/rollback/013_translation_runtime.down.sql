DROP INDEX IF EXISTS uq_translation_job_active;
DROP INDEX IF EXISTS ix_translation_jobs_status_created;
ALTER TABLE translation_jobs DROP COLUMN attempt_count;
ALTER TABLE translation_jobs DROP COLUMN target_translation_id;
ALTER TABLE translation_jobs DROP COLUMN error_message;
