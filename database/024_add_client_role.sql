-- 新增「客户运营」角色：面向 B 端商家自助运营。
-- 只开放内容/产品/媒体/外观（改首页）的读写 + 询盘读取 + 自助发布（publishing.write）。
-- publishing.write 同时赋予全站重建能力（rebuildSite 仅重渲染公开页，无破坏性），
-- 这是「AI 生成 → 一键发布」闭环成立的前提（见 docs/后台易用性改造方案.md 第 8.3 节）。
INSERT INTO roles(code,name,description,is_system) VALUES
 ('client','客户运营','Self-service storefront operator',true)
ON CONFLICT(code) DO NOTHING;

INSERT INTO role_permissions(role_id,permission_id)
SELECT r.id,p.id FROM roles r CROSS JOIN permissions p
WHERE r.code='client' AND p.code IN (
 'content.read','content.write',
 'product.read','product.write',
 'media.read','media.write',
 'appearance.read','appearance.write',
 'leads.read',
 'publishing.read','publishing.write'
)
ON CONFLICT DO NOTHING;
