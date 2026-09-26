INSERT INTO locales(code,hreflang,name,native_name,direction,is_default,is_enabled,sort_order) VALUES
 ('en','en','English','English','ltr',true,true,1),('zh','zh-CN','Chinese','简体中文','ltr',false,true,2),('de','de','German','Deutsch','ltr',false,true,3),('fr','fr','French','Français','ltr',false,true,4),('es','es','Spanish','Español','ltr',false,true,5),('it','it','Italian','Italiano','ltr',false,true,6),('pt','pt','Portuguese','Português','ltr',false,true,7),('ja','ja','Japanese','日本語','ltr',false,true,8),('ko','ko','Korean','한국어','ltr',false,true,9)
ON CONFLICT(code) DO NOTHING;
INSERT INTO roles(code,name,description,is_system) VALUES
 ('super_admin','Super Administrator','Unrestricted administration',true),('admin','Administrator','System administration',true),('editor','Editor','Content editing',true),('seo_manager','SEO Manager','SEO and search settings',true),('translator','Translator','Localized content',true),('reviewer','Reviewer','Content review and approval',true)
ON CONFLICT(code) DO NOTHING;
INSERT INTO permissions(code,name,module) VALUES
 ('content.view','View content','content'),('content.create','Create content','content'),('content.edit','Edit content','content'),('content.publish','Publish content','content'),('product.edit','Edit products','product'),('product.publish','Publish products','product'),('seo.edit','Edit SEO','seo'),('translation.edit','Edit translations','translation'),('system.settings','Manage settings','system')
ON CONFLICT(code) DO NOTHING;
INSERT INTO taxonomies(code,name,is_hierarchical) VALUES ('article_category','Article Categories',true),('product_category','Product Categories',true),('tag','Tags',false),('industry','Industries',true),('material','Materials',true)
ON CONFLICT(code) DO NOTHING;
INSERT INTO menus(code,location,is_enabled) VALUES ('main_header','header',true),('mobile_menu','mobile',true),('footer_products','footer',true),('footer_company','footer',true)
ON CONFLICT(code) DO NOTHING;
