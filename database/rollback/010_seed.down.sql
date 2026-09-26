DELETE FROM menus WHERE code IN ('main_header','mobile_menu','footer_products','footer_company');
DELETE FROM taxonomies WHERE code IN ('article_category','product_category','tag','industry','material');
DELETE FROM permissions WHERE code IN ('content.view','content.create','content.edit','content.publish','product.edit','product.publish','seo.edit','translation.edit','system.settings');
DELETE FROM roles WHERE code IN ('super_admin','admin','editor','seo_manager','translator','reviewer');
DELETE FROM locales WHERE code IN ('en','zh','de','fr','es','it','pt','ja','ko');
