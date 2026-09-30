-- V3.1 foreign-trade product facts and buyer RFQ details.
ALTER TABLE products
  ADD COLUMN min_order_quantity numeric(14,3) CHECK (min_order_quantity IS NULL OR min_order_quantity > 0),
  ADD COLUMN lead_time_days integer CHECK (lead_time_days IS NULL OR lead_time_days BETWEEN 1 AND 3650);

ALTER TABLE product_translations
  ADD COLUMN order_unit text CHECK (order_unit IS NULL OR char_length(order_unit) <= 40),
  ADD COLUMN packaging_details text,
  ADD COLUMN customization_details text,
  ADD COLUMN sample_policy text;

ALTER TABLE inquiries
  ADD COLUMN target_delivery_on date,
  ADD COLUMN specification_notes text CHECK (specification_notes IS NULL OR char_length(specification_notes) <= 2000),
  ADD COLUMN preferred_incoterm text CHECK (preferred_incoterm IS NULL OR preferred_incoterm IN ('EXW','FCA','FOB','CFR','CIF','CPT','CIP','DAP','DPU','DDP'));

CREATE TABLE inquiry_attachments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  inquiry_id uuid NOT NULL REFERENCES inquiries(id) ON DELETE CASCADE,
  original_filename text NOT NULL CHECK (char_length(original_filename) BETWEEN 1 AND 180),
  mime_type text NOT NULL CHECK (mime_type IN ('application/pdf','image/jpeg','image/png','image/webp')),
  file_size integer NOT NULL CHECK (file_size BETWEEN 1 AND 5242880),
  content bytea NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT inquiry_attachment_actual_size CHECK (octet_length(content) = file_size)
);
CREATE INDEX ix_inquiry_attachments_inquiry ON inquiry_attachments(inquiry_id,created_at);
