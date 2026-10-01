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
 // 夹具自清本身也是不变量
 assert.equal((await query("SELECT count(*)::int AS n FROM products WHERE sku LIKE 'PROBE-CARTON-%'"))[0].n,0,'箱规探针夹具必须自清');
 console.log('PASS carton packing ('+cartonChecks.length+'): '+cartonChecks.join('; '));
 console.log('PASS: CRUD, RBAC, published snapshots, static rendering, version restore, scheduling, cancellation, failure state and unpublish.');
 // Remove fixture records so full rollback verifies only migration ownership.
 await query('TRUNCATE published_documents,site_paths,public_submissions,publish_jobs,content_revisions,audit_logs,content_item_translations,content_items,users RESTART IDENTITY CASCADE');
}finally{await pool.end();}
