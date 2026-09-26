import assert from 'node:assert/strict';import {randomUUID} from 'node:crypto';import fs from 'node:fs/promises';import path from 'node:path';
if(process.env.VERIFY_DATABASE!=='1'||!new URL(process.env.DATABASE_URL!).pathname.startsWith('/suns_verify_'))throw Error('Run through db:verify in its isolated database');
process.env.STATIC_OUTPUT_DIR=path.resolve('.runtime/verify-output',randomUUID());
const {query,pool,save,ensureActor,requestPublish,released,remove,sourceDocument,list,restoreRevision,jobAction}=await import('../packages/domain/src/index');
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
 console.log('PASS: CRUD, RBAC, published snapshots, static rendering, version restore, scheduling, cancellation, failure state and unpublish.');
 // Remove fixture records so full rollback verifies only migration ownership.
 await query('TRUNCATE published_documents,site_paths,public_submissions,publish_jobs,content_revisions,audit_logs,content_item_translations,content_items,users RESTART IDENTITY CASCADE');
}finally{await pool.end();}
