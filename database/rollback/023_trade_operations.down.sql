DROP INDEX IF EXISTS ix_inquiries_visit;
ALTER TABLE inquiries DROP COLUMN IF EXISTS visit_id;
DROP TABLE IF EXISTS trade_visits;
DROP TRIGGER IF EXISTS trg_trade_inquiry_sla ON inquiries;
DROP FUNCTION IF EXISTS trade_inquiry_sla();
ALTER TABLE inquiries DROP COLUMN IF EXISTS response_due_at, DROP COLUMN IF EXISTS first_response_at;
DROP TABLE IF EXISTS trade_service_rules,trade_market_cards,trade_portal_grants,trade_quote_events,trade_quotes;
DROP FUNCTION IF EXISTS trade_quote_immutable();
