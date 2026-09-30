DROP TABLE IF EXISTS inquiry_attachments;
ALTER TABLE inquiries DROP COLUMN IF EXISTS preferred_incoterm, DROP COLUMN IF EXISTS specification_notes, DROP COLUMN IF EXISTS target_delivery_on;
ALTER TABLE product_translations DROP COLUMN IF EXISTS sample_policy, DROP COLUMN IF EXISTS customization_details, DROP COLUMN IF EXISTS packaging_details, DROP COLUMN IF EXISTS order_unit;
ALTER TABLE products DROP COLUMN IF EXISTS lead_time_days, DROP COLUMN IF EXISTS min_order_quantity;
