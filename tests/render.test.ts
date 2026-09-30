import {test} from 'node:test';import assert from 'node:assert/strict';
import {safeURL,escape,renderHTML,systemDocument,siteJS} from '../packages/ui/src/index';import {routeFile} from '../packages/publisher/src/files';
test('HTML and URLs are escaped',()=>{assert.equal(escape('<script>'),'&lt;script&gt;');for(const u of ['javascript:alert(1)','//evil.test','/\\evil.test','data:text/html,test'])assert.equal(safeURL(u),'#');assert.equal(safeURL('/en/products'),'/en/products');});
test('static routes reject traversal and absolute paths',()=>{for(const v of ['/en/../secret','C:/secret','//host/path','/en/%2e%2e'])assert.throws(()=>routeFile(v));assert.equal(routeFile('/en/products/item'),'en/products/item/index.html');});
test('shared rendering produces crawlable content without executable input',()=>{const doc=systemDocument({id:'x',code:'en'},{site:{site_name:'Test',primary_domain:'https://example.test',enable_indexing:false},menus:[],heroes:[],channels:[]},'/en','Test <title>',[{type:'rich_text',data:{html:'<p>Visible</p><script>alert(1)</script><img src=x onerror=alert(1)>'}}]);const html=renderHTML(doc);assert.match(html,/Visible/);assert.match(html,/noindex,follow/);assert.ok(!html.includes('<script>alert'));assert.ok(!html.includes('onerror='));assert.match(html,/<h1>Test &lt;title&gt;<\/h1>/);});

test('Browser script parses',()=>{assert.doesNotThrow(()=>new Function(siteJS));});

test('premium home features a published product with escaped caption',()=>{
 const doc=systemDocument({id:'x',code:'en'},{site:{site_name:'Glass',primary_domain:'https://example.test'},menus:[],heroes:[],channels:[]},'/en','Glass collection',[{type:'product_grid',data:{title:'Collection',items:[{title:'Glass <cup>',route:'/en/products/cup',media:[{url:'/media/cup.png',width:1200,height:1200}]}]}}]);
 const html=renderHTML(doc);
 assert.match(html,/hero-visual product-visual/);
 // 2026-09-28 编辑式首页改版后：hero 的 caption 从「指向产品的链接」改为编号标签（线上自 9/28 00:35 起即为此形态），
 // 产品链接下移到 home-collection 的产品卡。测试意图不变：产品被展示、可点、标题转义。
 assert.match(html,/class="hero-caption"/);
 assert.match(html,/<a href="\/en\/products\/cup" class="home-product-image"/);
 assert.match(html,/Glass &lt;cup&gt;/);
 assert.match(html,/home-collection/);
 assert.equal((html.match(/<h1>/g)||[]).length,1);
});

test('premium carousel keeps configured slide controls and safe URLs',()=>{
 const doc=systemDocument({id:'x',code:'zh'},{site:{site_name:'Glass',primary_domain:'https://example.test'},menus:[],heroes:[{title:'第一张',desktopURL:'/media/scene.jpg',primary_button_text:'联系',primary_button_url:'javascript:alert(1)'},{title:'第二张',desktopURL:'/media/second.jpg'}],channels:[]},'/zh','Glass',[]);
 const html=renderHTML(doc);
 assert.match(html,/hero-visual scene-visual/);
 assert.match(html,/data-slide-count>01 \/ 02/);
 assert.match(html,/data-pause/);
 assert.ok(!html.includes('javascript:'));
 assert.equal((html.match(/<h1>/g)||[]).length,1);
});

