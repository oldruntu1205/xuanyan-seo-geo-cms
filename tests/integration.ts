import assert from 'node:assert/strict';import {randomUUID} from 'node:crypto';import fs from 'node:fs/promises';import path from 'node:path';
if(process.env.VERIFY_DATABASE!=='1'||!new URL(process.env.DATABASE_URL!).pathname.startsWith('/suns_verify_'))throw Error('Run through db:verify in its isolated database');
process.env.STATIC_OUTPUT_DIR=path.resolve('.runtime/verify-output',randomUUID());
const {query,pool,save,ensureActor,requestPublish,released,remove,sourceDocument,list,restoreRevision,jobAction,packingSummary,packingSpecFromRow}=await import('../packages/domain/src/index');
const {processPublishJob}=await import('../packages/publisher/src/index');
const actor={id:randomUUID(),email:'verification@example.invalid',role:'super_admin',displayName:'Verification'};
try{
 await ensureActor(actor);const locale=(await query("SELECT id FROM locales WHERE code='en'"))[0].id;
 const parent=await save(actor,'content_items',{content_type:'article'});
 const doc=await save(actor,'content_item_translations',{content_item_id:parent.id,locale_id:locale,title:'Original published title',slug:'integration',path:'/en/integration',body:[{type:'rich_text',data:{text:'Safe body <script>unsafe</script>'}}]});
 assert.equal(await released(doc.path),undefined,'Draft must not leak');
 await assert.rejects(()=>save({...actor,role:'translator'},'products',{sku:'DENIED'}),/权限/);
 const j=await requestPublish(actor,'content_item_translations',doc.id);await processPublishJob({data:{jobId:j.id}} as any);
 assert.equal((await released(doc.path))?.title,'Original published title');
 const before=(await fs.stat(path.join(process.env.STATIC_OUTPUT_DIR,'en/integration/index.html'))).mtimeMs;const same=await requestPublish(actor,'content_item_translations',doc.id);await processPublishJob({data:{jobId:same.id}} as any);assert.equal((await fs.stat(path.join(process.env.STATIC_OUTPUT_DIR,'en/integration/index.html'))).mtimeMs,before,'Unchanged HTML should not be rewritten');
 const html=await fs.readFile(path.join(process.env.STATIC_OUTPUT_DIR,'en/integration/index.html'),'utf8');assert.match(html,/application\/ld\+json/);assert.match(html,/rel="canonical"/);assert.ok(!html.includes('<script>unsafe</script>'));
 await save(actor,'content_item_translations',{title:'Unpublished revision'},{id:doc.id});assert.equal((await released(doc.path))?.title,'Original published title');
 const rev=(await list(actor,'content_revisions',{filter:{entity_id:doc.id}})).rows.find(r=>r.snapshot.title==='Original published title');assert.ok(rev);await restoreRevision(actor,rev.id);
 await save(actor,'content_item_translations',{title:'Scheduled snapshot'},{id:doc.id});const scheduled=await requestPublish(actor,'content_item_translations',doc.id,'publish',new Date(Date.now()+60000).toISOString());await save(actor,'content_item_translations',{title:'Later draft'},{id:doc.id});await query('UPDATE publish_jobs SET scheduled_at=now() WHERE id=$1',[scheduled.id]);await processPublishJob({data:{jobId:scheduled.id}} as any);assert.equal((await released(doc.path))?.title,'Scheduled snapshot');
 const cancel=await requestPublish(actor,'content_item_translations',doc.id);await jobAction(actor,cancel.id,'cancel');await processPublishJob({data:{jobId:cancel.id}} as any);assert.equal((await query('SELECT status FROM publish_jobs WHERE id=$1',[cancel.id]))[0].status,'cancelled');
 const invalid=await requestPublish(actor,'content_item_translations',doc.id);await query("UPDATE publish_jobs SET metadata='{}',max_attempts=1 WHERE id=$1",[invalid.id]);await assert.rejects(()=>processPublishJob({data:{jobId:invalid.id}} as any),/snapshot missing/);assert.equal((await query('SELECT status FROM publish_jobs WHERE id=$1',[invalid.id]))[0].status,'failed');
 await remove(actor,'content_item_translations',{id:doc.id});const unpublish=(await query("SELECT id FROM publish_jobs WHERE entity_id=$1 AND job_type='unpublish' ORDER BY created_at DESC LIMIT 1",[doc.id]))[0];await processPublishJob({data:{jobId:unpublish.id}} as any);assert.equal(await released(doc.path),undefined);await assert.rejects(()=>fs.access(path.join(process.env.STATIC_OUTPUT_DIR,'en/integration/index.html')));
 // ── A14–A17 · 027/028 箱规约束（L1 裁定：真库必测；每个预期失败的 CHECK 用 SAVEPOINT 隔离）──
 const cartonClient=await pool.connect();const cartonChecks:string[]=[];
 try{
  await cartonClient.query('BEGIN');
  const probeSku='PROBE-CARTON-'+randomUUID().slice(0,8);
  const probeId=(await cartonClient.query('INSERT INTO products(sku) VALUES($1) RETURNING id',[probeSku])).rows[0].id;
  const setCarton='UPDATE products SET carton_quantity=$2,carton_length_mm=$3,carton_width_mm=$4,carton_height_mm=$5,gross_weight_kg=$6 WHERE id=$1';
  // 预期失败：必须在 SAVEPOINT 内，因为它们会把当前事务打成 aborted
  const reject=async(label:string,sql:string,values:unknown[],expectedConstraint?:string)=>{
   await cartonClient.query('SAVEPOINT carton_case');let error:any=null;
   try{await cartonClient.query(sql,values);}catch(e){error=e;}
   await cartonClient.query('ROLLBACK TO SAVEPOINT carton_case');
   assert.ok(error,label+' 本应被数据库拒绝');
   assert.equal(error.code,'23514',label+' 期望 SQLSTATE 23514，实际 '+error.code+'：'+(error.message||''));
   if(expectedConstraint)assert.equal(error.constraint,expectedConstraint,label+' 期望约束名 '+expectedConstraint+'，实际 '+error.constraint);
   cartonChecks.push(label);
  };
  // 预期成功：RELEASE 保住效果，让 A16 能真正累积出「箱规在、毛重被清」的状态
  const accept=async(label:string,sql:string,values:unknown[])=>{
   await cartonClient.query('SAVEPOINT carton_accept');
   try{await cartonClient.query(sql,values);await cartonClient.query('RELEASE SAVEPOINT carton_accept');}
   catch(e:any){await cartonClient.query('ROLLBACK TO SAVEPOINT carton_accept');assert.fail(label+' 本应通过，却抛出 '+(e&&e.message));}
   cartonChecks.push(label);
  };
  // A14 半截外箱尺寸必须被拦住，且报出约束名（028 后的规则：尺寸 0 或 3，每箱数量独立）
  await reject('A14 只填外箱长','UPDATE products SET carton_length_mm=500 WHERE id=$1',[probeId],'products_carton_dimensions_complete');
  await reject('A14 只有长宽（缺高）','UPDATE products SET carton_length_mm=500,carton_width_mm=400 WHERE id=$1',[probeId],'products_carton_dimensions_complete');
  await reject('A14 只有长高（缺宽）','UPDATE products SET carton_length_mm=500,carton_height_mm=300 WHERE id=$1',[probeId],'products_carton_dimensions_complete');
  // A14b 028 的核心放宽：每箱数量可以单独记录
  await accept('A14b 只填每箱数量（028 放宽）','UPDATE products SET carton_quantity=288 WHERE id=$1',[probeId]);
  await accept('A14b 尺寸齐全但没填数量','UPDATE products SET carton_quantity=NULL,carton_length_mm=500,carton_width_mm=400,carton_height_mm=300 WHERE id=$1',[probeId]);
  await reject('A14b 每箱数量 + 半截尺寸仍被拒','UPDATE products SET carton_quantity=12,carton_length_mm=500,carton_width_mm=400,carton_height_mm=NULL WHERE id=$1',[probeId],'products_carton_dimensions_complete');
  // A15 数值越界
  await reject('A15 每箱数量 0',setCarton,[probeId,0,500,400,300,null]);
  await reject('A15 外箱长为负',setCarton,[probeId,12,-500,400,300,null]);
  await reject('A15 毛重为负',setCarton,[probeId,12,500,400,300,-1]);
  // A16 四种合法形态必须真正写入成功，不是静态检查 SQL
  await accept('A16 全部留空',setCarton,[probeId,null,null,null,null,null]);
  await accept('A16 四件套齐',setCarton,[probeId,12,500,400,300,8.5]);
  await accept('A16 毛重可单独改动','UPDATE products SET gross_weight_kg=9.2 WHERE id=$1',[probeId]);
  await accept('A16 只清毛重保留箱规','UPDATE products SET gross_weight_kg=NULL WHERE id=$1',[probeId]);
  const kept=(await cartonClient.query('SELECT carton_quantity,carton_length_mm,carton_width_mm,carton_height_mm,gross_weight_kg FROM products WHERE id=$1',[probeId])).rows[0];
  assert.equal(kept.gross_weight_kg,null,'清毛重后毛重应为 null');
  assert.ok(kept.carton_quantity!==null&&kept.carton_length_mm!==null&&kept.carton_width_mm!==null&&kept.carton_height_mm!==null,'清除毛重不得影响箱规四件套');
  // A17 真库往返 → 解析 → 计算（numeric 以字符串返回）
  await cartonClient.query(setCarton,[probeId,12,500,400,300,8.5]);
  const stored=(await cartonClient.query('SELECT carton_quantity,carton_length_mm,carton_width_mm,carton_height_mm,gross_weight_kg FROM products WHERE id=$1',[probeId])).rows[0];
  assert.equal(typeof stored.carton_quantity,'string','前提：node-postgres 把 numeric 以字符串返回');
  const summary=packingSummary(packingSpecFromRow(stored));
  assert.equal(summary.complete,true);
  assert.ok(Math.abs(summary.cartonVolumeCbm-0.06)<=1e-9,'每箱体积应为 0.06 CBM');
  assert.deepEqual(summary.containers.map(c=>c.boxes),[470,959,1082]);
  cartonChecks.push('A17 真库往返→解析→计算');
  await cartonClient.query('ROLLBACK');
 }finally{cartonClient.release();}
 // ── A18–A20 · S1 首页板块：显式隐藏 / 未配置 / 块表所有权（L1 终审回执指定）──────────
 // 要求：① 排序与隐藏经「保存→重读→发布」保持一致；② 显式隐藏不被兜底补回；
 // ③ 用真实旧版形状的实体首页走完整发布链路（不得先替换成八块夹具）；
 // ④ 块表全部禁用后旧 body 不得复活。
 {
  const blocksChecks:string[]=[];
  const legacyBody=[
   {type:'product_grid',data:{title:'Legacy products',items:[{title:'Cup',route:'/en/products/cup',media:[{url:'/media/cup.png'}]}]}},
   {type:'latest_articles',data:{title:'Legacy articles',items:[{title:'Old post',route:'/en/blog/old'}],hidden:true}},
   {type:'cta',data:{title:'Legacy cta',label:'Legacy label',url:'/en/contact'}},
  ];
  const homeParent=await save(actor,'content_items',{content_type:'page'});
  const homeDoc=await save(actor,'content_item_translations',{content_item_id:homeParent.id,locale_id:locale,title:'Legacy home',slug:'home',path:'/en',body:legacyBody});

  // ① 保存 → 重读：顺序与 hidden 必须原样保留
  const snap=await sourceDocument('content_item_translations',homeDoc.id);
  assert.deepEqual(snap.body.map((b:any)=>b.type),['product_grid','latest_articles','cta'],'板块顺序必须按 body 数组保留');
  assert.equal(snap.body[1].data.hidden,true,'显式隐藏标记必须原样保留');

  // ② 走真实发布链路（旧版形状的实体首页，不替换为系统八块夹具）
  const hjob=await requestPublish(actor,'content_item_translations',homeDoc.id);await processPublishJob({data:{jobId:hjob.id}} as any);
  const homeHtml=await fs.readFile(path.join(process.env.STATIC_OUTPUT_DIR,'en/index.html'),'utf8');
  assert.equal((homeHtml.match(/<h1>/g)||[]).length,1,'实体首页仍须恰好 1 个 h1');
  assert.match(homeHtml,/Legacy label/,'块数据里的自定义 CTA 文案必须生效');
  assert.ok(!homeHtml.includes('Legacy articles'),'显式隐藏的文章块不得渲染');
  assert.ok(!/data-trade-public/.test(homeHtml),'未配置市场块时不渲染（且不再兜底补回）');
  assert.ok(!/class="creds"/.test(homeHtml)&&!/class="process"/.test(homeHtml),'旧版实体首页不得被系统八块序列（信任带/流程）替换');
  assert.equal((await released('/en'))?.title,'Legacy home','实体首页应接管 /en 路由');
  // L1 终审第二轮 Q6-4：顺序必须在**发布产物**上直接断言，不能只断言 sourceDocument。
  // 本页配置顺序为 product_grid → (latest_articles 隐藏) → cta，故产物里产品区必须先于结尾 CTA。
  assert.ok(homeHtml.indexOf('home-collection')>=0&&homeHtml.indexOf('home-collection')<homeHtml.indexOf('Legacy label'),'发布产物中的相对顺序必须与 body 数组一致（产品区在结尾 CTA 之前）');

  // ③ 块表所有权：有行 ⇒ 以块表为准；全禁用 ⇒ body 为空，绝不回退到 jsonb
  await query('INSERT INTO content_blocks(content_translation_id,block_type,sort_order,is_enabled,data) VALUES($1,$2,$3,true,$4::jsonb),($1,$5,$6,true,$7::jsonb)',[homeDoc.id,'rich_text',0,JSON.stringify({title:'From block table'}),'cta',1,JSON.stringify({title:'Block cta'})]);
  const fromBlocks=await sourceDocument('content_item_translations',homeDoc.id);
  assert.deepEqual(fromBlocks.body.map((b:any)=>b.type),['rich_text','cta'],'有块表行时必须以块表为准（jsonb body 被忽略）');
  await query('UPDATE content_blocks SET is_enabled=false WHERE content_translation_id=$1',[homeDoc.id]);
  const allDisabled=await sourceDocument('content_item_translations',homeDoc.id);
  assert.equal(allDisabled.body.length,0,'块表全部禁用后 body 必须为空，不得回退到 jsonb 的旧 body（Q4 反复活）');

  // ④ L1 终审第二轮 Q4：写路径守卫 —— 有块表行时保存 body 必须被明确拒绝（而不是"改了不生效"）
  await assert.rejects(
   ()=>save(actor,'content_item_translations',{body:[{type:'rich_text',data:{text:'silently ignored'}}]},{id:homeDoc.id,content_item_id:homeParent.id,locale_id:locale}),
   /页面区块/,'存在块表行时保存正文字必须被拒绝并提示改用页面区块',
  );

  // ⑤ L1 终审第二轮 Q4：删除最后一条块表行 ⇒ 来源切回 jsonb body。
  // 这是**受控切换**（写路径已守卫，切换只能靠显式删除），把它钉住以免日后被当成意外行为改掉。
  await query('DELETE FROM content_blocks WHERE content_translation_id=$1',[homeDoc.id]);
  const switchedBack=await sourceDocument('content_item_translations',homeDoc.id);
  assert.deepEqual(switchedBack.body.map((b:any)=>b.type),['product_grid','latest_articles','cta'],'删除全部块表行后来源按契约切回 jsonb body');
  // 切回后写守卫不再拦截
  await save(actor,'content_item_translations',{body:[{type:'rich_text',data:{text:'back to jsonb'}}]},{id:homeDoc.id,content_item_id:homeParent.id,locale_id:locale});
  assert.deepEqual((await sourceDocument('content_item_translations',homeDoc.id)).body.map((b:any)=>b.type),['rich_text'],'无块表行时允许直接保存正文');

  blocksChecks.push('A18 排序/隐藏原样保留+发布产物顺序','A19 旧版实体首页发布链路','A20 块表全禁用不回退','A21 有块表行时拒绝保存正文','A22 删净块表行后受控切回 body');
  await remove(actor,'content_item_translations',{id:homeDoc.id});
  console.log('PASS home blocks ('+blocksChecks.length+'): '+blocksChecks.join('; '));
 }
 // ── A23–A28 · S3 分类主图（030）──────────────────────────────────────────────
 // L1 终审（2026-10-09）要求：把 .runtime 的实测升为**持久断言**并接入验证链。这些断言跑在
 // verify 的隔离库里，覆盖：当前语言 ALT / 缺译文仍保留图片 / 软删除图片不装配 /
 // 删除媒体后分类保留且关联置 NULL / 产品图库优先不变 / 分类主图经发布快照进入自动分类卡。
 {
  const s3Checks:string[]=[];
  const {autoBlockItems}=await import('../packages/publisher/src/index');
  const taxonomy=(await query("INSERT INTO taxonomies(code,name) VALUES('s3-verify','S3 verify') RETURNING id"))[0].id;
  const de=(await query("SELECT id FROM locales WHERE code='de' AND is_enabled"))[0]?.id;
  assert.ok(de,'前置：de 必须在 locales 里且启用 —— 否则证明不了 ALT 有语言作用域');
  const newMedia=async(objectKey:string)=>(await query("INSERT INTO media_assets(storage_provider,object_key,original_filename,mime_type,file_size,width,height) VALUES('local',$1,$1,'image/png',1024,800,600) RETURNING id",[objectKey]))[0].id;
  const mAlt=await newMedia('s3-verify/a shot.png');      // 有 en ALT
  const mSoft=await newMedia('s3-verify/soft-deleted.png');
  const mSetNull=await newMedia('s3-verify/set-null.png');
  const mGallery=await newMedia('s3-verify/gallery.png');
  const mFeatured=await newMedia('s3-verify/featured.png');
  await query("INSERT INTO media_asset_translations(media_id,locale_id,alt_text) VALUES($1,$2,'分类主图 EN ALT')",[mAlt,locale]);
  await query('UPDATE media_assets SET deleted_at=now() WHERE id=$1',[mSoft]);
  const newTerm=async(code:string,featured:string|null)=>(await query('INSERT INTO taxonomy_terms(taxonomy_id,code,featured_media_id) VALUES($1,$2,$3) RETURNING id',[taxonomy,code,featured]))[0].id;
  const newTr=async(termId:string,localeId:string,name:string,slug:string,route:string)=>(await query('INSERT INTO taxonomy_term_translations(term_id,locale_id,name,slug,path) VALUES($1,$2,$3,$4,$5) RETURNING id',[termId,localeId,name,slug,route]))[0].id;
  const termAlt=await newTerm('s3-alt',mAlt);
  const termSoft=await newTerm('s3-soft',mSoft);
  const termSetNull=await newTerm('s3-setnull',mSetNull);
  const trEn=await newTr(termAlt,locale,'Glass reactor','s3-verify-glass-reactor','/en/s3-verify/glass-reactor');
  const trDe=await newTr(termAlt,de,'Glasreaktor','s3-verify-glasreaktor','/de/s3-verify/glasreaktor');

  // A23/A24：ALT 是**按语言**取的（LEFT JOIN 不吞行）
  const docEn=await sourceDocument('taxonomy_term_translations',trEn);
  assert.equal(docEn.media.length,1,'分类主图必须进入 Document.media[0]（分类没有图库表，这是唯一路径）');
  assert.equal(docEn.media[0].alt_text,'分类主图 EN ALT','必须取当前语言 media_asset_translations 的 ALT');
  assert.equal(docEn.media[0].url,'/media/s3-verify/a%20shot.png','图片 URL 必须是 /media/ + 逐段转义的 object_key');
  const docDe=await sourceDocument('taxonomy_term_translations',trDe);
  assert.equal(docDe.media.length,1,'当前语言缺 ALT 译文时图片仍必须保留（LEFT JOIN）');
  assert.equal(docDe.media[0].alt_text,null,'缺该语言 ALT 时必须为 null，不得回落到别的语言的 ALT');
  s3Checks.push('A23 当前语言 ALT 命中 + URL 段转义','A24 缺译文仍保留图片且 alt 为 null');

  // A25：软删除的图片不得装配
  const trSoft=await newTr(termSoft,locale,'Soft deleted','s3-verify-soft','/en/s3-verify/soft');
  assert.equal((await sourceDocument('taxonomy_term_translations',trSoft)).media.length,0,'软删除（deleted_at 非空）的图片不得进入 Document.media');
  s3Checks.push('A25 软删除图片不装配');

  // A26：真库删除媒体 —— 分类保留、关联置 NULL（隔离库验证，生产不做这种测试性删除）
  await query('DELETE FROM media_assets WHERE id=$1',[mSetNull]);
  const afterDelete=await query('SELECT id,featured_media_id FROM taxonomy_terms WHERE id=$1',[termSetNull]);
  assert.equal(afterDelete.length,1,'删除图片后分类必须保留（不是级联删除）');
  assert.equal(afterDelete[0].featured_media_id,null,'删除图片后 featured_media_id 必须置 NULL（ON DELETE SET NULL）');
  s3Checks.push('A26 删除媒体→分类保留+关联置 NULL');

  // A27：产品图库优先，图库为空才回落到父表 featured_media_id（既有行为不得被 030 改动）
  const probeProduct=(await query("INSERT INTO products(sku,featured_media_id,status) VALUES('PROBE-S3-MEDIA',$1,'active') RETURNING id",[mFeatured]))[0].id;
  await query('INSERT INTO product_media(product_id,media_id,media_role,sort_order) VALUES($1,$2,$3,0)',[probeProduct,mGallery,'main']);
  const productTr=(await query("INSERT INTO product_translations(product_id,locale_id,name,slug,path) VALUES($1,$2,'Probe product','probe-s3-product','/en/s3-verify/probe-product') RETURNING id",[probeProduct,locale]))[0].id;
  assert.deepEqual((await sourceDocument('product_translations',productTr)).media.map((m:any)=>m.id),[mGallery],'有产品图库时必须用图库，featured_media_id 不参与');
  await query('DELETE FROM product_media WHERE product_id=$1',[probeProduct]);
  assert.deepEqual((await sourceDocument('product_translations',productTr)).media.map((m:any)=>m.id),[mFeatured],'图库为空时回落到父表 featured_media_id（既有兜底行为不变）');
  s3Checks.push('A27 产品图库优先/空图库回落（行为不变）');

  // A28：分类主图经**发布快照**进入自动分类卡的 items（发布链路端到端）
  const mediaJob=await requestPublish(actor,'taxonomy_term_translations',trEn);
  await processPublishJob({data:{jobId:mediaJob.id}} as any);
  const publishedCategory=await released('/en/s3-verify/glass-reactor');
  assert.ok(publishedCategory,'分类译文发布后必须出现在 published_documents');
  assert.equal(publishedCategory!.media[0]?.alt_text,'分类主图 EN ALT','发布快照必须带上当前语言的 ALT');
  const categoryItems=autoBlockItems('category_grid','/xx',[],[],[publishedCategory]);
  assert.equal(categoryItems?.[0]?.media?.[0]?.url,'/media/s3-verify/a%20shot.png','分类主图必须经发布快照进入自动分类卡（publisher 的 cardOf 形状）');
  s3Checks.push('A28 分类主图经发布快照进入自动分类卡');

  // 夹具自清（分类 / 译文 / 媒体 / 产品），并断言清干净
  await query('DELETE FROM taxonomy_term_translations WHERE term_id=ANY($1::uuid[])',[[termAlt,termSoft,termSetNull]]);
  await query('DELETE FROM taxonomy_terms WHERE taxonomy_id=$1',[taxonomy]);
  await query('DELETE FROM taxonomies WHERE id=$1',[taxonomy]);
  await query('DELETE FROM product_translations WHERE product_id=$1',[probeProduct]);
  await query('DELETE FROM products WHERE id=$1',[probeProduct]);
  await query('DELETE FROM media_asset_translations WHERE media_id=ANY($1::uuid[])',[[mAlt,mSoft,mSetNull,mGallery,mFeatured]]);
  await query('DELETE FROM media_assets WHERE id=ANY($1::uuid[])',[[mAlt,mSoft,mSetNull,mGallery,mFeatured]]);
  assert.equal((await query("SELECT count(*)::int AS n FROM taxonomy_terms WHERE code LIKE 's3-%'"))[0].n,0,'分类主图夹具必须自清');
  assert.equal((await query("SELECT count(*)::int AS n FROM media_assets WHERE object_key LIKE 's3-verify/%'"))[0].n,0,'分类主图媒体夹具必须自清');
  assert.equal((await query("SELECT count(*)::int AS n FROM products WHERE sku='PROBE-S3-MEDIA'"))[0].n,0,'产品图库探针必须自清');
  console.log('PASS category media ('+s3Checks.length+'): '+s3Checks.join('; '));
 }
 // 夹具自清本身也是不变量
 assert.equal((await query("SELECT count(*)::int AS n FROM products WHERE sku LIKE 'PROBE-CARTON-%'"))[0].n,0,'箱规探针夹具必须自清');
 console.log('PASS carton packing ('+cartonChecks.length+'): '+cartonChecks.join('; '));
 console.log('PASS: CRUD, RBAC, published snapshots, static rendering, version restore, scheduling, cancellation, failure state and unpublish.');
 // Remove fixture records so full rollback verifies only migration ownership.
 // 这一条是**夹具卫生**，不是断言；但本机 HDD 在繁忙时这条 CASCADE TRUNCATE 的 fsync 会远超连接池的
 // statement_timeout=30s（2026-10-09 实测：030 已应用 101.9s；**无 030 对照 156.5s**；空库 98–105s；
 // wait_event=DataFileImmediateSync 且 blockers 为空，磁盘队列 16–24）⇒ 清理改用一条独立连接并单独放宽超时。
 // 放宽的只是这条清理语句：生产连接参数（db.ts 的 30s）与所有断言一字未改，清理失败依旧抛错、不吞异常。
 const {Client}=await import('pg');
 const cleanup=new Client({connectionString:process.env.DATABASE_URL,statement_timeout:600000});
 await cleanup.connect();
 try{await cleanup.query('TRUNCATE published_documents,site_paths,public_submissions,publish_jobs,content_revisions,audit_logs,content_item_translations,content_items,users RESTART IDENTITY CASCADE');}finally{await cleanup.end();}
}finally{await pool.end();}
