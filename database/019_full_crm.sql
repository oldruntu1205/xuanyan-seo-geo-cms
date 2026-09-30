-- V3 CRM: customer identity, sales pipeline, collaboration and durable history.
CREATE TABLE crm_accounts (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 name text NOT NULL CHECK(length(btrim(name)) BETWEEN 2 AND 200),
 country text,
 dedupe_key text GENERATED ALWAYS AS (lower(btrim(name)) || '|' || lower(coalesce(btrim(country),''))) STORED UNIQUE,
 website text, phone text, description text,
 owner_id uuid REFERENCES users(id) ON DELETE SET NULL,
 status text NOT NULL DEFAULT 'active' CHECK(status IN ('active','archived')),
 created_at timestamptz NOT NULL DEFAULT now(),updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ix_crm_accounts_name ON crm_accounts USING gin(name gin_trgm_ops);
CREATE INDEX ix_crm_accounts_owner ON crm_accounts(owner_id,status);
CREATE TRIGGER trg_crm_accounts_updated_at BEFORE UPDATE ON crm_accounts FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE crm_contacts (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 email citext NOT NULL UNIQUE,name text NOT NULL CHECK(length(btrim(name)) BETWEEN 1 AND 160),
 phone text,title text,owner_id uuid REFERENCES users(id) ON DELETE SET NULL,
 status text NOT NULL DEFAULT 'active' CHECK(status IN ('active','archived')),
 created_at timestamptz NOT NULL DEFAULT now(),updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ix_crm_contacts_name ON crm_contacts USING gin(name gin_trgm_ops);
CREATE INDEX ix_crm_contacts_owner ON crm_contacts(owner_id,status);
CREATE TRIGGER trg_crm_contacts_updated_at BEFORE UPDATE ON crm_contacts FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE crm_account_contacts (
 account_id uuid NOT NULL REFERENCES crm_accounts(id) ON DELETE CASCADE,
 contact_id uuid NOT NULL REFERENCES crm_contacts(id) ON DELETE CASCADE,
 created_at timestamptz NOT NULL DEFAULT now(),PRIMARY KEY(account_id,contact_id)
);
CREATE INDEX ix_crm_account_contacts_contact ON crm_account_contacts(contact_id,account_id);

ALTER TABLE inquiries ADD COLUMN crm_account_id uuid REFERENCES crm_accounts(id) ON DELETE SET NULL;
ALTER TABLE inquiries ADD COLUMN crm_contact_id uuid REFERENCES crm_contacts(id) ON DELETE SET NULL;
CREATE INDEX ix_inquiries_crm_account ON inquiries(crm_account_id,created_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX ix_inquiries_crm_contact ON inquiries(crm_contact_id,created_at DESC) WHERE deleted_at IS NULL;

CREATE FUNCTION crm_link_inquiry() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE linked_account uuid;linked_contact uuid;
BEGIN
 IF length(btrim(coalesce(NEW.company,'')))>=2 THEN
  INSERT INTO crm_accounts(name,country) VALUES(btrim(NEW.company),nullif(btrim(NEW.country),''))
  ON CONFLICT(dedupe_key) DO NOTHING;
  SELECT id INTO linked_account FROM crm_accounts
   WHERE dedupe_key=lower(btrim(NEW.company)) || '|' || lower(coalesce(nullif(btrim(NEW.country),''),''));
 END IF;
 INSERT INTO crm_contacts(email,name,phone) VALUES(NEW.email,left(coalesce(nullif(btrim(NEW.name),''),NEW.email::text),160),NEW.phone)
 ON CONFLICT(email) DO NOTHING;
 SELECT id INTO linked_contact FROM crm_contacts WHERE email=NEW.email;
 NEW.crm_account_id=linked_account;NEW.crm_contact_id=linked_contact;
 IF linked_account IS NOT NULL AND linked_contact IS NOT NULL THEN
  INSERT INTO crm_account_contacts(account_id,contact_id) VALUES(linked_account,linked_contact) ON CONFLICT DO NOTHING;
 END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER trg_crm_link_inquiry BEFORE INSERT OR UPDATE OF email,name,company,country,phone ON inquiries
 FOR EACH ROW EXECUTE FUNCTION crm_link_inquiry();

-- Preserve the original inquiry timestamps while linking historical records.
ALTER TABLE inquiries DISABLE TRIGGER trg_inquiries_updated_at;
UPDATE inquiries SET email=email WHERE deleted_at IS NULL;
ALTER TABLE inquiries ENABLE TRIGGER trg_inquiries_updated_at;

CREATE TABLE crm_opportunities (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 title text NOT NULL CHECK(length(btrim(title)) BETWEEN 2 AND 200),
 account_id uuid REFERENCES crm_accounts(id) ON DELETE SET NULL,
 contact_id uuid NOT NULL REFERENCES crm_contacts(id) ON DELETE RESTRICT,
 inquiry_id uuid REFERENCES inquiries(id) ON DELETE SET NULL,
 stage text NOT NULL DEFAULT 'new' CHECK(stage IN ('new','qualified','proposal','negotiation','won','lost')),
 amount numeric(14,2) NOT NULL DEFAULT 0 CHECK(amount>=0),
 currency char(3) NOT NULL DEFAULT 'USD' CHECK(currency ~ '^[A-Z]{3}$'),
 probability integer NOT NULL DEFAULT 10 CHECK(probability BETWEEN 0 AND 100),
 owner_id uuid REFERENCES users(id) ON DELETE SET NULL,
 expected_close_on date,next_action text,next_action_at timestamptz,
 loss_reason text,closed_at timestamptz,
 created_at timestamptz NOT NULL DEFAULT now(),updated_at timestamptz NOT NULL DEFAULT now(),deleted_at timestamptz,
 CHECK(stage<>'lost' OR length(btrim(coalesce(loss_reason,'')))>=2)
);
CREATE INDEX ix_crm_opportunities_stage ON crm_opportunities(stage,updated_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX ix_crm_opportunities_owner ON crm_opportunities(owner_id,stage,next_action_at) WHERE deleted_at IS NULL;
CREATE INDEX ix_crm_opportunities_contact ON crm_opportunities(contact_id,created_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX ix_crm_opportunities_account ON crm_opportunities(account_id,created_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX ix_crm_opportunities_title ON crm_opportunities USING gin(title gin_trgm_ops);
CREATE TRIGGER trg_crm_opportunities_updated_at BEFORE UPDATE ON crm_opportunities FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE crm_opportunity_members (
 opportunity_id uuid NOT NULL REFERENCES crm_opportunities(id) ON DELETE CASCADE,
 user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 added_by uuid REFERENCES users(id) ON DELETE SET NULL,
 created_at timestamptz NOT NULL DEFAULT now(),PRIMARY KEY(opportunity_id,user_id)
);
CREATE INDEX ix_crm_members_user ON crm_opportunity_members(user_id,created_at DESC);

CREATE TABLE crm_tasks (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 opportunity_id uuid REFERENCES crm_opportunities(id) ON DELETE CASCADE,
 contact_id uuid REFERENCES crm_contacts(id) ON DELETE CASCADE,
 title text NOT NULL CHECK(length(btrim(title)) BETWEEN 2 AND 200),
 description text,assigned_to uuid NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
 due_at timestamptz,status text NOT NULL DEFAULT 'open' CHECK(status IN ('open','done','cancelled')),
 completed_at timestamptz,created_by uuid REFERENCES users(id) ON DELETE SET NULL,
 created_at timestamptz NOT NULL DEFAULT now(),updated_at timestamptz NOT NULL DEFAULT now(),
 CHECK(opportunity_id IS NOT NULL OR contact_id IS NOT NULL)
);
CREATE INDEX ix_crm_tasks_due ON crm_tasks(assigned_to,due_at) WHERE status='open';
CREATE INDEX ix_crm_tasks_opportunity ON crm_tasks(opportunity_id,created_at DESC);
CREATE INDEX ix_crm_tasks_contact ON crm_tasks(contact_id,created_at DESC);
CREATE TRIGGER trg_crm_tasks_updated_at BEFORE UPDATE ON crm_tasks FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE crm_activities (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 opportunity_id uuid REFERENCES crm_opportunities(id) ON DELETE CASCADE,
 contact_id uuid REFERENCES crm_contacts(id) ON DELETE CASCADE,
 account_id uuid REFERENCES crm_accounts(id) ON DELETE CASCADE,
 kind text NOT NULL CHECK(kind IN ('note','call','email','meeting')),
 summary text NOT NULL CHECK(length(btrim(summary)) BETWEEN 2 AND 200),
 detail text,occurred_at timestamptz NOT NULL DEFAULT now(),
 created_by uuid REFERENCES users(id) ON DELETE SET NULL,
 created_at timestamptz NOT NULL DEFAULT now(),
 CHECK(opportunity_id IS NOT NULL OR contact_id IS NOT NULL OR account_id IS NOT NULL)
);
CREATE INDEX ix_crm_activities_opportunity ON crm_activities(opportunity_id,occurred_at DESC);
CREATE INDEX ix_crm_activities_contact ON crm_activities(contact_id,occurred_at DESC);
CREATE INDEX ix_crm_activities_account ON crm_activities(account_id,occurred_at DESC);

CREATE TABLE crm_history (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 account_id uuid REFERENCES crm_accounts(id) ON DELETE SET NULL,
 contact_id uuid REFERENCES crm_contacts(id) ON DELETE SET NULL,
 opportunity_id uuid REFERENCES crm_opportunities(id) ON DELETE SET NULL,
 inquiry_id uuid REFERENCES inquiries(id) ON DELETE SET NULL,
 task_id uuid REFERENCES crm_tasks(id) ON DELETE SET NULL,
 event_type text NOT NULL,summary text NOT NULL,details jsonb NOT NULL DEFAULT '{}'::jsonb,
 actor_id uuid REFERENCES users(id) ON DELETE SET NULL,
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ix_crm_history_account ON crm_history(account_id,created_at DESC,id DESC);
CREATE INDEX ix_crm_history_contact ON crm_history(contact_id,created_at DESC,id DESC);
CREATE INDEX ix_crm_history_opportunity ON crm_history(opportunity_id,created_at DESC,id DESC);
CREATE INDEX ix_crm_history_inquiry ON crm_history(inquiry_id,created_at DESC,id DESC);

INSERT INTO crm_history(account_id,contact_id,inquiry_id,event_type,summary,details,created_at)
 SELECT crm_account_id,crm_contact_id,id,'lead_received','收到询盘',jsonb_build_object('number',inquiry_number,'status',status),created_at
 FROM inquiries WHERE deleted_at IS NULL;
INSERT INTO crm_history(account_id,contact_id,inquiry_id,event_type,summary,details,actor_id,created_at)
 SELECT i.crm_account_id,i.crm_contact_id,i.id,'lead_note','询盘跟进备注',jsonb_build_object('note',n.note),n.created_by,n.created_at
 FROM inquiry_notes n JOIN inquiries i ON i.id=n.inquiry_id WHERE i.deleted_at IS NULL;

CREATE FUNCTION crm_record_inquiry() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF TG_OP='INSERT' THEN
  INSERT INTO crm_history(account_id,contact_id,inquiry_id,event_type,summary,details,created_at)
  VALUES(NEW.crm_account_id,NEW.crm_contact_id,NEW.id,'lead_received','收到询盘',jsonb_build_object('number',NEW.inquiry_number,'status',NEW.status),NEW.created_at);
 ELSIF OLD.status IS DISTINCT FROM NEW.status OR OLD.assigned_to IS DISTINCT FROM NEW.assigned_to
   OR OLD.email IS DISTINCT FROM NEW.email OR OLD.company IS DISTINCT FROM NEW.company
   OR OLD.crm_contact_id IS DISTINCT FROM NEW.crm_contact_id OR OLD.crm_account_id IS DISTINCT FROM NEW.crm_account_id THEN
  INSERT INTO crm_history(account_id,contact_id,inquiry_id,event_type,summary,details)
  VALUES(NEW.crm_account_id,NEW.crm_contact_id,NEW.id,'lead_updated','询盘信息更新',
   jsonb_build_object('oldStatus',OLD.status,'status',NEW.status,'oldAssignee',OLD.assigned_to,'assignee',NEW.assigned_to));
 END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER trg_crm_record_inquiry AFTER INSERT OR UPDATE OF status,assigned_to,email,company,name,phone,crm_contact_id,crm_account_id ON inquiries
 FOR EACH ROW EXECUTE FUNCTION crm_record_inquiry();

CREATE FUNCTION crm_record_inquiry_note() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 INSERT INTO crm_history(account_id,contact_id,inquiry_id,event_type,summary,details,actor_id,created_at)
 SELECT i.crm_account_id,i.crm_contact_id,i.id,'lead_note','询盘跟进备注',jsonb_build_object('note',NEW.note),NEW.created_by,NEW.created_at
 FROM inquiries i WHERE i.id=NEW.inquiry_id;
 RETURN NEW;
END $$;
CREATE TRIGGER trg_crm_record_inquiry_note AFTER INSERT ON inquiry_notes FOR EACH ROW EXECUTE FUNCTION crm_record_inquiry_note();
