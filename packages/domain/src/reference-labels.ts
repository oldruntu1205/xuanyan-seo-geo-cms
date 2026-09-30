import {identifier,query} from './db';
import {canRead,getResource} from './registry';
import type {Actor} from './types';

const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const primary:Record<string,string[]>={
 locales:['native_name','name','code'],media_assets:['original_filename'],
 products:['sku'],content_items:['content_type'],taxonomy_terms:['code'],
 taxonomies:['name','code'],faq_items:['code'],site_settings:['site_name'],
 menus:['code'],customer_service_channels:['name'],users:['display_name','email'],
 hero_slide_translations:['title'],content_item_translations:['title'],
 product_translations:['name'],taxonomy_term_translations:['name'],
 media_asset_translations:['alt_text','title'],menu_item_translations:['label'],
 faq_item_translations:['question'],product_spec_definitions:['code','name'],
 product_spec_definition_translations:['name'],permissions:['name','code'],
 roles:['name','code'],publish_jobs:['job_type']
};
const translated:Record<string,{table:string;fk:string;field:string}>={
 products:{table:'product_translations',fk:'product_id',field:'name'},
 content_items:{table:'content_item_translations',fk:'content_item_id',field:'title'},
 taxonomy_terms:{table:'taxonomy_term_translations',fk:'term_id',field:'name'},
 faq_items:{table:'faq_item_translations',fk:'faq_id',field:'question'},
 hero_slides:{table:'hero_slide_translations',fk:'hero_slide_id',field:'title'},
 menu_items:{table:'menu_item_translations',fk:'menu_item_id',field:'label'}
};
const visibleThrough:Record<string,string>={
 media_assets:'media_asset_translations',products:'product_translations',
 content_items:'content_item_translations',taxonomy_terms:'taxonomy_term_translations',
 faq_items:'faq_item_translations',hero_slides:'hero_slide_translations',
 menu_items:'menu_item_translations',site_settings:'site_setting_translations'
};
// 文字存在翻译表里的表，一旦对应翻译还没填，就只能退化成「记录 #xxxx」——在「轮播翻译」里选轮播时
// 根本认不出是哪张图。这里给出与语言无关的兜底名称（轮播 → 「第 N 张 · 图片文件名」）。
const fallbackLabel:Record<string,{join:string;expr:string}>={
 hero_slides:{join:'LEFT JOIN media_assets m ON m.id=t.desktop_media_id',expr:"'第 ' || COALESCE(t.sort_order,0) || ' 张' || COALESCE(' · ' || NULLIF(m.original_filename,''), '')"},
};

export function canResolveReference(actor:Actor,table:string){
 const target=getResource(table);
 return table==='locales'||canRead(actor,target)||!!(visibleThrough[table]&&canRead(actor,getResource(visibleThrough[table])));
}

/** Resolve only IDs already visible in the current admin page, with the same read permissions. */
export async function referenceLabels(actor:Actor,requested:unknown){
 if(!requested||typeof requested!=='object'||Array.isArray(requested))throw new Error('Invalid references');
 const result:Record<string,Record<string,string>>={};
 const entries=Object.entries(requested);
 if(entries.length>25)throw new Error('Too many reference groups');
 for(const [table,input] of entries){
  if(!canResolveReference(actor,table)){result[table]={};continue;}
  if(!Array.isArray(input)||input.length>100||input.some(id=>typeof id!=='string'||!uuid.test(id)))throw new Error('Invalid reference IDs');
  const ids=[...new Set(input)];if(!ids.length){result[table]={};continue;}
  const cols=await query<{column_name:string}>('SELECT column_name FROM information_schema.columns WHERE table_schema=$1 AND table_name=$2',['public',table]);
  const names=new Set(cols.map(c=>c.column_name));
  if(!names.has('id')){result[table]={};continue;}
  const fields=(primary[table]||['title','name','code','sku','original_filename','email','path','label','question','job_type']).filter(x=>names.has(x));
  const direct=fields.length?'COALESCE('+fields.map(x=>`NULLIF(t.${identifier(x)}::text,'')`).join(',')+',NULL)':'NULL::text';
  const translation=translated[table];
  const join=translation?`LEFT JOIN LATERAL (SELECT ${identifier(translation.field)}::text AS label FROM ${identifier(translation.table)} x WHERE x.${identifier(translation.fk)}=t.id ORDER BY (x.locale_id=(SELECT id FROM locales WHERE is_default)) DESC LIMIT 1) translated ON true`:'';
  const base=translation?`COALESCE(NULLIF(translated.label,''),${direct})`:direct;
  const fallback=fallbackLabel[table];
  const expr=fallback?`COALESCE(NULLIF(${base},''),${fallback.expr})`:base;
  const rows=await query<{id:string;label:string|null}>(`SELECT t.id,${expr} AS label FROM ${identifier(table)} t ${fallback?fallback.join:''} ${join} WHERE t.id=ANY($1::uuid[])`,[ids]);
  result[table]=Object.fromEntries(rows.filter(r=>r.label).map(r=>[r.id,String(r.label)]));
 }
 return result;
}
