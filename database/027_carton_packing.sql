-- Carton packing facts, used to derive CBM and container-loading estimates.
-- Units are explicit in the column names (mm, kg). The legacy per-item
-- length_value/width_value/height_value/weight_value columns are left untouched:
-- they describe one piece, these describe the export carton.
--
-- completeness rule: the four columns needed for a volume (carton_quantity,
-- carton_length_mm, carton_width_mm, carton_height_mm) are either all filled or
-- all empty. A partially filled carton spec would silently produce a wrong CBM,
-- which is worse than no number at all. gross_weight_kg stays independent:
-- without it the loading estimate simply ignores the weight limit.
ALTER TABLE products
  ADD COLUMN carton_quantity numeric(14,3) CHECK (carton_quantity IS NULL OR carton_quantity > 0),
  ADD COLUMN carton_length_mm numeric(10,1) CHECK (carton_length_mm IS NULL OR carton_length_mm > 0),
  ADD COLUMN carton_width_mm numeric(10,1) CHECK (carton_width_mm IS NULL OR carton_width_mm > 0),
  ADD COLUMN carton_height_mm numeric(10,1) CHECK (carton_height_mm IS NULL OR carton_height_mm > 0),
  ADD COLUMN gross_weight_kg numeric(12,3) CHECK (gross_weight_kg IS NULL OR gross_weight_kg > 0);

ALTER TABLE products
  ADD CONSTRAINT products_carton_spec_complete CHECK (
    num_nonnulls(carton_quantity,carton_length_mm,carton_width_mm,carton_height_mm) IN (0,4)
  );
