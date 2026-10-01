-- Dropping these columns deletes every recorded carton spec; back up first.
ALTER TABLE products
  DROP CONSTRAINT IF EXISTS products_carton_spec_complete,
  DROP COLUMN IF EXISTS gross_weight_kg,
  DROP COLUMN IF EXISTS carton_height_mm,
  DROP COLUMN IF EXISTS carton_width_mm,
  DROP COLUMN IF EXISTS carton_length_mm,
  DROP COLUMN IF EXISTS carton_quantity;
