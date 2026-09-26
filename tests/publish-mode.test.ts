import {test} from 'node:test';import assert from 'node:assert/strict';
import {resources,publishModeFor,getResource} from '../packages/domain/src/registry';

test('发布方式由 registry 单点声明',()=>{
 for(const table of ['content_item_translations','product_translations','taxonomy_term_translations'])
  assert.equal(publishModeFor(table),'record',table);
 for(const table of ['site_settings','site_setting_translations','menus','menu_items','menu_item_translations','hero_slides','hero_slide_translations','customer_service_channels','customer_service_rules','locales'])
  assert.equal(publishModeFor(table),'rebuild',table);
 for(const table of ['inquiries','media_assets','content_blocks','redirects','audit_logs'])
  assert.equal(publishModeFor(table),undefined,table);
});

test('每个资源都带上 publishMode，后台才能据此决定提示与按钮',()=>{
 assert.deepEqual(resources.filter(r=>!('publishMode' in r)).map(r=>r.table),[]);
 assert.equal(getResource('site_settings').publishMode,'rebuild');
 assert.equal(getResource('content_item_translations').publishMode,'record');
});

// 可单独发布的资源必须与后端 requestPublish 接受的集合一致：多一个是谎报，少一个是功能缺失。
test('可单独发布的集合恰好是 requestPublish 支持的三个',()=>{
 assert.deepEqual(resources.filter(r=>r.publishMode==='record').map(r=>r.table).sort(),['content_item_translations','product_translations','taxonomy_term_translations']);
});
