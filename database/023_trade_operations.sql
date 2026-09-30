-- Quotation content is an immutable revision; workflow state is separate.
CREATE TABLE trade_quotes (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), inquiry_id uuid NOT NULL REFERENCES inquiries(id),
 opportunity_id uuid REFERENCES crm_opportunities(id), version integer NOT NULL CHECK(version>0),
 currency text NOT NULL CHECK(currency ~ '^[A-Z]{3}$'),
 incoterm text NOT NULL CHECK(incoterm IN ('EXW','FCA','FOB','CFR','CIF','CPT','CIP','DAP','DPU','DDP')),
 valid_until date NOT NULL, terms text NOT NULL DEFAULT '' CHECK(length(terms)<=5000),
 lines jsonb NOT NULL CHECK(jsonb_typeof(lines)='array' AND jsonb_array_length(lines) BETWEEN 1 AND 50),
 total numeric(20,2) NOT NULL CHECK(total>=0),
 status text NOT NULL DEFAULT 'draft' CHECK(status IN ('draft','review','approved','sent','accepted','rejected','void')),
 created_by uuid NOT NULL REFERENCES users(id), reviewed_by uuid REFERENCES users(id),
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), sent_at timestamptz,
 UNIQUE(inquiry_id,version)
);
CREATE INDEX ix_trade_quotes_inquiry ON trade_quotes(inquiry_id,created_at DESC);
CREATE INDEX ix_trade_quotes_deal ON trade_quotes(opportunity_id);
CREATE FUNCTION trade_quote_immutable() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF ROW(NEW.inquiry_id,NEW.opportunity_id,NEW.version,NEW.currency,NEW.incoterm,NEW.valid_until,NEW.terms,NEW.lines,NEW.total,NEW.created_by,NEW.created_at)
 IS DISTINCT FROM ROW(OLD.inquiry_id,OLD.opportunity_id,OLD.version,OLD.currency,OLD.incoterm,OLD.valid_until,OLD.terms,OLD.lines,OLD.total,OLD.created_by,OLD.created_at) THEN
 RAISE EXCEPTION 'Create a new quote revision instead of changing its content'; END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER trg_trade_quote_immutable BEFORE UPDATE ON trade_quotes FOR EACH ROW EXECUTE FUNCTION trade_quote_immutable();
CREATE TRIGGER trg_trade_quotes_updated_at BEFORE UPDATE ON trade_quotes FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TABLE trade_quote_events (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), quote_id uuid NOT NULL REFERENCES trade_quotes(id),
 action text NOT NULL, note text NOT NULL DEFAULT '', actor_id uuid REFERENCES users(id),
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ix_trade_quote_events ON trade_quote_events(quote_id,created_at);
CREATE TABLE trade_portal_grants (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), inquiry_id uuid NOT NULL REFERENCES inquiries(id),
 token_hash text NOT NULL UNIQUE CHECK(token_hash ~ '^[a-f0-9]{64}$'),
 recipient text NOT NULL CHECK(length(recipient) BETWEEN 1 AND 254),
 role text NOT NULL CHECK(role IN ('customer','partner')), expires_at timestamptz NOT NULL,
 revoked_at timestamptz, created_by uuid NOT NULL REFERENCES users(id), created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ix_trade_grants_inquiry ON trade_portal_grants(inquiry_id);
CREATE TABLE trade_market_cards (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), locale_id uuid NOT NULL REFERENCES locales(id),
 country text NOT NULL DEFAULT '' CHECK(country='' OR country ~ '^[A-Z]{2}$'),
 kind text NOT NULL CHECK(kind IN ('market','certificate','case','service')),
 title text NOT NULL CHECK(length(btrim(title)) BETWEEN 2 AND 160),
 summary text NOT NULL CHECK(length(btrim(summary)) BETWEEN 2 AND 2000),
 source_url text NOT NULL CHECK(source_url ~ '^https://' OR source_url ~ '^/[^/]'),
 source_hash text, valid_until date, status text NOT NULL DEFAULT 'review' CHECK(status IN ('review','published','withdrawn')),
 created_by uuid NOT NULL REFERENCES users(id), reviewed_by uuid REFERENCES users(id),
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
 CHECK(kind<>'certificate' OR valid_until IS NOT NULL)
);
CREATE INDEX ix_trade_market_public ON trade_market_cards(locale_id,country,kind) WHERE status='published';
CREATE TRIGGER trg_trade_market_updated_at BEFORE UPDATE ON trade_market_cards FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TABLE trade_service_rules (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), locale_id uuid NOT NULL REFERENCES locales(id),
 country text NOT NULL DEFAULT '' CHECK(country='' OR country ~ '^[A-Z]{2}$'),
 response_hours integer NOT NULL CHECK(response_hours BETWEEN 1 AND 720),
 updated_by uuid REFERENCES users(id), updated_at timestamptz NOT NULL DEFAULT now(), UNIQUE(locale_id,country)
);
CREATE TRIGGER trg_trade_service_updated_at BEFORE UPDATE ON trade_service_rules FOR EACH ROW EXECUTE FUNCTION set_updated_at();
ALTER TABLE inquiries ADD COLUMN first_response_at timestamptz;
ALTER TABLE inquiries ADD COLUMN response_due_at timestamptz;
CREATE FUNCTION trade_inquiry_sla() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE hours integer;
BEGIN
 SELECT response_hours INTO hours FROM trade_service_rules WHERE locale_id=NEW.locale_id AND country IN ('',upper(coalesce(NEW.country,''))) ORDER BY length(country) DESC LIMIT 1;
 IF hours IS NOT NULL THEN NEW.response_due_at=NEW.created_at+make_interval(hours=>hours); END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER trg_trade_inquiry_sla BEFORE INSERT ON inquiries FOR EACH ROW EXECUTE FUNCTION trade_inquiry_sla();
CREATE TABLE trade_visits (
 id uuid PRIMARY KEY, locale_id uuid NOT NULL REFERENCES locales(id), source text NOT NULL DEFAULT '' CHECK(length(source)<=200),
 path text NOT NULL CHECK(length(path)<=1000), created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ix_trade_visits_created ON trade_visits(created_at,locale_id);
ALTER TABLE inquiries ADD COLUMN visit_id uuid REFERENCES trade_visits(id) ON DELETE SET NULL;
CREATE INDEX ix_inquiries_visit ON inquiries(visit_id) WHERE visit_id IS NOT NULL;
