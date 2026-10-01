-- 027 要求「每箱数量 + 外箱长宽高」四件套同时填或同时空。实际业务里最先拿到的
-- 往往只有「每箱数量」（报价单/装箱单上就有），四件套规则会把这份唯一可用的数据也拒之门外。
--
-- 028 把它放宽为：**每箱数量独立**，**三个外箱尺寸仍然 0 或 3**。
-- 理由：两个尺寸缺一个是永远算不出体积的半截数据，只会制造脏数据；而「只有每箱数量」
-- 是真实且有用的商业事实（报价时要告诉客户整箱多少只）。
--
-- CBM 的安全网不在这一层，而在代码层：packingSummary() 在四件套不全时**不输出任何数字**，
-- 只返回一条说明。这条不变量没有因为 028 而改变。
ALTER TABLE products
  DROP CONSTRAINT IF EXISTS products_carton_spec_complete;

ALTER TABLE products
  ADD CONSTRAINT products_carton_dimensions_complete CHECK (
    num_nonnulls(carton_length_mm,carton_width_mm,carton_height_mm) IN (0,3)
  );
