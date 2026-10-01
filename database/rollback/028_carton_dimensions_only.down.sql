-- ⚠️ 回滚前必须先清掉「只填了每箱数量、没有尺寸」的行，否则下面 ADD CONSTRAINT 会直接失败
--    （那些行不满足旧的「0 或 4」规则）：
--      UPDATE products SET carton_quantity=NULL WHERE carton_quantity IS NOT NULL AND carton_length_mm IS NULL;
ALTER TABLE products
  DROP CONSTRAINT IF EXISTS products_carton_dimensions_complete;

ALTER TABLE products
  ADD CONSTRAINT products_carton_spec_complete CHECK (
    num_nonnulls(carton_quantity,carton_length_mm,carton_width_mm,carton_height_mm) IN (0,4)
  );
