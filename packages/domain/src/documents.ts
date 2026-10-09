import { query } from './db';
import { DomainError } from './crud';
import type { Document, Row } from './types';
export function assetURL(m:Row|undefined|null){if(!m?.object_key)return '';const prefix=m.storage_provider==='local'?'/media/':(process.env.MEDIA_PUBLIC_URL||'/media/').replace(/\/$/,'')+'/';return prefix+m.object_key.split('/').map(encodeURIComponent).join('/');}
export async function siteContext(localeId:string){
 const site=(await query(`SELECT s.*,t.site_title,t.company_name,t.company_description,t.footer_description,t.copyright_text FROM site_settings s LEFT JOIN site_setting_translations t ON t.site_setting_id=s.id AND t.locale_id=$1 LIMIT 1`,[localeId]))[0]??{site_name:'SUNS Glassware',primary_domain:process.env.NEXT_PUBLIC_SITE_URL||'http://localhost:3000',enable_indexing:false};
 // Public rendering receives only public configuration, never integration secrets.
 const publicSite={default_locale_code:(await query('SELECT code FROM locales WHERE id=$1',[site.default_locale_id]))[0]?.code,google_site_verification:site.settings_json?.google_site_verification,site_name:site.site_name,primary_domain:site.primary_domain,site_title:site.site_title,company_name:site.company_name,company_description:site.company_description,footer_description:site.footer_description,copyright_text:site.copyright_text,company_email:site.company_email,company_phone:site.company_phone,enable_indexing:site.enable_indexing,ga_measurement_id:site.ga_measurement_id,default_locale_id:site.default_locale_id};
 const menus=await query(`SELECT i.id,i.parent_id,i.link_type,i.linked_entity_id,i.linked_entity_type,i.custom_url,i.target,m.code,m.location,t.label,t.custom_url_override FROM menus m JOIN menu_items i ON i.menu_id=m.id JOIN menu_item_translations t ON t.menu_item_id=i.id AND t.locale_id=$1 WHERE m.is_enabled AND i.is_enabled ORDER BY i.sort_order,i.id`,[localeId]);
 for(const menu of menus){menu.url=menu.custom_url_override||menu.custom_url;if(!menu.url&&menu.linked_entity_id){const types:Record<string,string>={content:'content_item_translations',product:'product_translations',term:'taxonomy_term_translations'};const type=types[menu.link_type];const target=type?(await query(`SELECT route FROM published_documents WHERE locale_id=$1 AND entity_type=$2 AND (entity_id=$3 OR snapshot->>'groupId'=$3::text) LIMIT 1`,[localeId,type,menu.linked_entity_id]))[0]:null;menu.url=target?.route;}}
 const heroes=await query(`SELECT h.*,t.title,t.subtitle,t.description,t.primary_button_text,t.primary_button_url,t.secondary_button_text,t.secondary_button_url,to_jsonb(d) AS desktop,to_jsonb(m) AS mobile FROM hero_slides h JOIN hero_slide_translations t ON t.hero_slide_id=h.id AND t.locale_id=$1 LEFT JOIN media_assets d ON d.id=h.desktop_media_id LEFT JOIN media_assets m ON m.id=h.mobile_media_id WHERE h.is_enabled AND (h.start_at IS NULL OR h.start_at<=now()) AND (h.end_at IS NULL OR h.end_at>now()) ORDER BY h.sort_order`,[localeId]);
 for(const h of heroes){h.desktopURL=assetURL(h.desktop);h.mobileURL=assetURL(h.mobile)||h.desktopURL;delete h.desktop;delete h.mobile;}
 const channels=await query(`SELECT c.id,c.channel_type,c.name,c.config,r.welcome_text,r.working_hours,r.country_code FROM customer_service_channels c LEFT JOIN customer_service_rules r ON r.channel_id=c.id AND r.is_enabled AND (r.locale_id=$1 OR r.locale_id IS NULL) WHERE c.is_enabled AND (NOT EXISTS(SELECT 1 FROM customer_service_rules x WHERE x.channel_id=c.id) OR r.id IS NOT NULL) ORDER BY c.sort_order,r.priority DESC`,[localeId]);
 for(const c of channels){const cfg=c.config||{};c.config={email:cfg.email,phone:cfg.phone,url:cfg.url};}
 return {site:publicSite,menus,heroes,channels};
}
export async function sourceDocument(table:string,id:string):Promise<Document>{
 const tables:Record<string,{parent:string;fk:string;title:string}>={content_item_translations:{parent:'content_items',fk:'content_item_id',title:'title'},product_translations:{parent:'products',fk:'product_id',title:'name'},taxonomy_term_translations:{parent:'taxonomy_terms',fk:'term_id',title:'name'}};
 const t=tables[table];if(!t)throw new DomainError('Unsupported publish entity');
 const row=(await query(`SELECT t.*,to_jsonb(p) AS parent,l.code AS locale,l.hreflang FROM ${table} t JOIN ${t.parent} p ON p.id=t.${t.fk} JOIN locales l ON l.id=t.locale_id WHERE t.id=$1 AND l.is_enabled`,[id]))[0];
 if(!row||row.deleted_at||row.parent.deleted_at)throw new DomainError('可发布内容不存在',404);
 const ctx=await siteContext(row.locale_id);
 const seo=row.seo_id?(await query('SELECT * FROM seo_metadata WHERE id=$1',[row.seo_id]))[0]??{}:{};
 const geo=row.geo_profile_id?(await query('SELECT * FROM geo_profiles WHERE id=$1',[row.geo_profile_id]))[0]??{}:{};
 if(geo.id){geo.facts=await query('SELECT * FROM geo_key_facts WHERE geo_profile_id=$1 ORDER BY sort_order',[geo.id]);geo.references=await query('SELECT * FROM geo_references WHERE geo_profile_id=$1 ORDER BY sort_order',[geo.id]);}
 const schema=row.schema_markup_id?(await query('SELECT * FROM schema_markup WHERE id=$1',[row.schema_markup_id]))[0]??{}:{};
 let body=Array.isArray(row.body)?row.body:[];
 // 2026-10-09 L1 终审 Q4：块表的「所有权」语义 —— 该译文**当前存在块表行**时，块表就是唯一来源。
 // 旧写法只查 is_enabled，于是「最后一条启用块被禁用」时查询退化为零行，导致 jsonb 里的旧 body
 // 复活（同一事实两个 owner）。现在改为取全部行、再在内存里筛启用行：
 //   · 有行（哪怕全禁用）⇒ 以块表为准；全禁用 ⇒ body 为空，**不回退**到 jsonb；
 //   · 当前没有块表行 ⇒ 使用 jsonb body。
 //
 // ⚠️ 能力边界（L1 要求明示，勿把它写成"永久所有权"）：本查询只能判断「**当前**没有块表行」，
 //    无法判断「从未有过」。因此**删除最后一条块表行**会把来源切回 jsonb body。这是**受控切换**：
 //      ① 写路径有守卫（crud.ts `save()`）：该译文存在块表行时，保存 body 会被拒绝并提示改用
 //         「页面区块」编辑 —— 所以"改 body 悄悄生效"这条隐式路径被堵住，切换只能靠显式删除；
 //      ② tests/integration.ts 的 A20 把这个行为钉住：删除最后一行 ⇒ 回退 body（按契约，不是意外）。
 if(table==='content_item_translations'){
  const blocks=await query('SELECT block_type,data,is_enabled FROM content_blocks WHERE content_translation_id=$1 ORDER BY sort_order,id',[id]);
  if(blocks.length)body=blocks.filter((b:Row)=>b.is_enabled).map((b:Row)=>({type:b.block_type,data:b.data}));
 }
 const result:Document={route:row.path,locale:row.locale,localeId:row.locale_id,entityType:table,entityId:id,groupId:row[t.fk],contentType:row.parent.content_type,title:row[t.title],description:row.excerpt||row.short_description||row.description||'',body,seo,geo,schema,...ctx,faqs:[],media:[],documents:[],related:[],alternates:[],updatedAt:new Date(row.updated_at).toISOString()};
 if(table==='product_translations')result.termIds=(await query('SELECT term_id FROM product_term_links WHERE product_id=$1',[row.product_id])).map(r=>r.term_id);if(table==='content_item_translations')result.termIds=(await query('SELECT term_id FROM content_term_links WHERE content_item_id=$1',[row.content_item_id])).map(r=>r.term_id);
 const alts=await query(`SELECT t.path,l.code AS locale,l.hreflang FROM ${table} t JOIN locales l ON l.id=t.locale_id WHERE t.${t.fk}=$1 AND l.is_enabled AND EXISTS(SELECT 1 FROM published_documents d WHERE d.entity_id=t.id AND d.entity_type=$2)`,[row[t.fk],table]);result.alternates=alts.filter(a=>a.locale!==row.locale).concat([{path:row.path,locale:row.locale,hreflang:row.hreflang}]);
 if(table==='product_translations'){
  result.product={...row.parent,description:row.description,features:row.features,applications:row.applications,order_unit:row.order_unit,packaging_details:row.packaging_details,customization_details:row.customization_details,sample_policy:row.sample_policy};
  result.product!.specs=await query(`SELECT coalesce(t.name,d.code) AS name,v.value_text,v.value_number,v.value_boolean,v.unit FROM product_spec_values v JOIN product_spec_definitions d ON d.id=v.spec_definition_id LEFT JOIN product_spec_definition_translations t ON t.spec_definition_id=d.id AND t.locale_id=$2 WHERE v.product_id=$1 ORDER BY v.sort_order`,[row.product_id,row.locale_id]);
  result.media=await query(`SELECT m.*,t.alt_text,t.caption FROM product_media p JOIN media_assets m ON m.id=p.media_id LEFT JOIN media_asset_translations t ON t.media_id=m.id AND t.locale_id=$2 WHERE p.product_id=$1 AND m.deleted_at IS NULL ORDER BY p.sort_order`,[row.product_id,row.locale_id]);
  result.documents=await query(`SELECT d.*,m.object_key,m.storage_provider FROM product_documents d JOIN media_assets m ON m.id=d.media_id WHERE d.product_id=$1 AND (d.locale_id=$2 OR d.locale_id IS NULL) AND m.deleted_at IS NULL ORDER BY d.sort_order`,[row.product_id,row.locale_id]);
  result.related=await query(`SELECT p.route,p.snapshot->>'title' AS title FROM product_relations r JOIN product_translations t ON t.product_id=r.related_product_id AND t.locale_id=$2 JOIN published_documents p ON p.entity_id=t.id AND p.entity_type='product_translations' WHERE r.product_id=$1 ORDER BY r.sort_order`,[row.product_id,row.locale_id]);
 }else if(table==='content_item_translations'){
  result.faqs=await query(`SELECT t.question,t.answer FROM content_faq_links l JOIN faq_items f ON f.id=l.faq_id JOIN faq_item_translations t ON t.faq_id=f.id AND t.locale_id=$2 WHERE l.content_item_id=$1 AND f.status='published' AND f.deleted_at IS NULL ORDER BY l.sort_order`,[row.content_item_id,row.locale_id]);
 }
 if(row.parent.featured_media_id&&!result.media.length){const media=(await query('SELECT * FROM media_assets WHERE id=$1 AND deleted_at IS NULL',[row.parent.featured_media_id]))[0];if(media)result.media.push(media);}
 for(const m of result.media){m.url=assetURL(m);m.variants=(await query('SELECT * FROM media_variants WHERE media_id=$1 ORDER BY width',[m.id])).map(v=>({...v,url:assetURL({...m,object_key:v.object_key})}));}
 if(seo.og_image_id){const m=(await query('SELECT * FROM media_assets WHERE id=$1 AND deleted_at IS NULL',[seo.og_image_id]))[0];seo.og_image_url=assetURL(m);}result.documents=result.documents.map(m=>({...m,url:assetURL(m)}));
 if(table==='taxonomy_term_translations')result.related=await query(`SELECT DISTINCT p.route,p.snapshot->>'title' AS title FROM published_documents p WHERE p.locale_id=$1 AND (p.entity_id IN(SELECT t.id FROM product_translations t JOIN product_term_links l ON l.product_id=t.product_id WHERE l.term_id=$2) OR p.entity_id IN(SELECT t.id FROM content_item_translations t JOIN content_term_links l ON l.content_item_id=t.content_item_id WHERE l.term_id=$2))`,[row.locale_id,row.term_id]);
 return result;
}
export async function released(route:string){const d=(await query('SELECT snapshot FROM published_documents WHERE route=$1',[route.replace(/\/$/,'')]))[0];return d?.snapshot as Document|undefined;}
