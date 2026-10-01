import fs from 'node:fs/promises';import path from 'node:path';import {fileURLToPath} from 'node:url';import {spawn} from 'node:child_process';import {randomBytes} from 'node:crypto';import assert from 'node:assert/strict';import pg from 'pg';import {config} from 'dotenv';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');config({path:path.join(root,'.env')});
if(process.argv.includes('--local-runtime'))Object.assign(process.env,JSON.parse(await fs.readFile(path.join(root,'.runtime/connection.json'),'utf8')));
if(!process.env.DATABASE_URL)throw Error('DATABASE_URL required. Verification creates and removes its own temporary database.');
const admin=new pg.Client({connectionString:process.env.DATABASE_URL});await admin.connect();const name='suns_verify_'+randomBytes(8).toString('hex');const url=new URL(process.env.DATABASE_URL);url.pathname='/'+name;let c;
async function run(args){await new Promise((resolve,reject)=>{const p=spawn(process.execPath,args,{cwd:root,env:{...process.env,DATABASE_URL:url.href,VERIFY_DATABASE:'1'},stdio:'inherit',windowsHide:true});p.on('exit',code=>code===0?resolve():reject(Error('Verification command failed: '+code)));p.on('error',reject);});}

// ─────────────────────────────────────────────────────────────────────────────
// E-1 修复（2026-09-30，L1 裁定方案 B）
// payload_internal 是 **Payload 自己拥有**的 schema：业务迁移 database/001–026 只消费它，
// 不负责创建它。所以临时库必须先用 Payload 官方迁移链 bootstrap，再跑业务迁移。
// 禁止在本 harness 里手工 CREATE SCHEMA / CREATE TYPE 复制 Payload 结构 —— 那会让 harness
// 维护第二份 schema 定义（drift），且下一条跨边界迁移会让验证链再次失守。
// 详见 docs/待验收与遗留清单.md 的 E-1。
// ─────────────────────────────────────────────────────────────────────────────
const REQUIRED_PAYLOAD_BRIDGE_MIGRATION='025_add_client_role_enum.sql';
// 已对齐 @payloadcms/drizzle 3.90.2 的真实文案（dist/migrate.js:35 的 message 含
// "data loss will occur. Would you like to proceed?"，dist/confirm.js 的默认选项是 (y/N)）。
// 这个守卫不是锦上添花：prompts 的 onCancel 是 process.exit(0)，而我们的 stdio 首项是 'ignore'，
// 一旦真弹窗会被当作取消 → **退出码 0**，看起来"成功"却一条迁移都没跑。只有扫输出才拦得住。
const INTERACTIVE_PROMPT=/data loss|would you like to proceed|do you want to continue|are you sure|\(y\/n\)|\[y\/n\]/i;
async function openClient(){const x=new pg.Client({connectionString:url.href});await x.connect();return x;}
async function assertVerificationDatabase(){const x=await openClient();try{const r=await x.query('SELECT current_database() AS d');if(r.rows[0].d!==name)throw Error(`Verification database mismatch: expected ${name}, got ${r.rows[0].d}（迁移没有作用在临时库上）`);}finally{await x.end();}}
async function assertMigrationApplied(filename){const x=await openClient();try{const r=await x.query('SELECT 1 FROM schema_migrations WHERE version=$1 LIMIT 1',[filename]);if(r.rowCount!==1)throw Error('Required migration was not applied: '+filename);}finally{await x.end();}}
async function assertPayloadBootstrap(){const x=await openClient();try{const r=await x.query("SELECT to_regnamespace('payload_internal') IS NOT NULL AS schema_exists,to_regtype('payload_internal.enum_cms_admin_users_role') IS NOT NULL AS role_enum_exists");const s=r.rows[0];if(!s.schema_exists||!s.role_enum_exists)throw Error(`Payload bootstrap incomplete in verification database. payload_internal schema: ${s.schema_exists}, enum_cms_admin_users_role: ${s.role_enum_exists}. auth:migrate must initialize Payload before database migrations run.`);console.log('Payload bootstrap verified.');}finally{await x.end();}}
async function assertClientRoleEnum(){const x=await openClient();try{const r=await x.query("SELECT EXISTS (SELECT 1 FROM pg_type t JOIN pg_namespace n ON n.oid=t.typnamespace JOIN pg_enum e ON e.enumtypid=t.oid WHERE n.nspname='payload_internal' AND t.typname='enum_cms_admin_users_role' AND e.enumlabel='client') AS exists");if(!r.rows[0].exists)throw Error('Migration 025 invariant failed: payload_internal.enum_cms_admin_users_role does not contain "client".');console.log('Verified Payload role enum contains client.');}finally{await x.end();}}
async function migrateBusinessUpAndVerify(){await run(['infrastructure/scripts/migrate.mjs','up']);await assertMigrationApplied(REQUIRED_PAYLOAD_BRIDGE_MIGRATION);await assertClientRoleEnum();}
async function runPayloadMigrations(){
 console.log('Bootstrapping Payload schema in isolated database...');
 const env={...process.env,DATABASE_URL:url.href,VERIFY_DATABASE:'1',PAYLOAD_SCHEMA_PUSH:'false',CI:'1'};
 const command=process.platform==='win32'?(process.env.ComSpec||'cmd.exe'):'pnpm';
 const args=process.platform==='win32'?['/d','/s','/c','pnpm auth:migrate']:['auth:migrate'];
 await new Promise((resolve,reject)=>{
  // stdio 首项必须是 'ignore'：绝不把父进程 stdin 交给迁移，否则 Payload 一旦询问
  // “Data loss will occur. Continue? (y/N)” 就会永久等待输入（CI 里等于挂死）。
  const child=spawn(command,args,{cwd:root,env,stdio:['ignore','pipe','pipe']});
  let tail='';let finished=false;
  const timer=setTimeout(()=>fail(Error('Payload migration timed out in verification database. Possible interactive migration prompt or stalled migration. Run `pnpm auth:migrate` against a clean isolated database and inspect the Payload migration state.')),180000);
  function fail(error){if(finished)return;finished=true;clearTimeout(timer);if(child.pid){if(process.platform==='win32')spawn('taskkill',['/PID',String(child.pid),'/T','/F'],{stdio:'ignore'}).unref();else child.kill('SIGTERM');}reject(error);}
  function inspect(chunk,sink){sink.write(chunk);tail=(tail+chunk.toString('utf8')).slice(-8192);if(INTERACTIVE_PROMPT.test(tail))fail(Error(`Payload migration requested interactive confirmation. Verification refuses to answer migration prompts automatically (db=${name}) —— 通常说明 auth:migrate 没有作用在新建的临时库上，或它读到了 dev 迁移标记（batch=-1）。`));}
  child.stdout.on('data',chunk=>inspect(chunk,process.stdout));
  child.stderr.on('data',chunk=>inspect(chunk,process.stderr));
  child.on('error',fail);
  child.on('close',code=>{if(finished)return;finished=true;clearTimeout(timer);if(code===0)resolve();else reject(Error('Payload migration failed in verification database with exit code '+code));});
 });
}

try{
 await admin.query('CREATE DATABASE '+name);console.log('Isolated validation database created.');
 // Payload 拥有 payload_internal，必须先 bootstrap；再做业务迁移并校验 025 的两个不变式。
 await assertVerificationDatabase();await runPayloadMigrations();await assertPayloadBootstrap();await migrateBusinessUpAndVerify();
 c=new pg.Client({connectionString:url.href});await c.connect();await c.query(await fs.readFile(path.join(root,'database/verify.sql'),'utf8'));
 const version=(await c.query('SELECT version() AS v')).rows[0].v;console.log(version);
 await c.query('BEGIN');
 const locale=(await c.query("SELECT id FROM locales WHERE code='en'")).rows[0].id;
 const content=(await c.query("INSERT INTO content_items(content_type) VALUES('article') RETURNING id")).rows[0].id;
 const translation=(await c.query("INSERT INTO content_item_translations(content_item_id,locale_id,title,slug,path) VALUES($1,$2,'Verification glass','verify','/en/verify') RETURNING *",[content,locale])).rows[0];assert.ok(translation.search_vector.includes('glass'));
 await c.query("UPDATE content_item_translations SET status='published' WHERE id=$1",[translation.id]);await c.query("UPDATE content_item_translations SET path='/en/verify-new' WHERE id=$1",[translation.id]);assert.equal((await c.query("SELECT target_url FROM redirects WHERE source_path='/en/verify'")).rows[0].target_url,'/en/verify-new');
 const product=(await c.query("INSERT INTO products(sku) VALUES('VERIFY') RETURNING id")).rows[0].id;
 await c.query('SAVEPOINT duplicate_path');await assert.rejects(()=>c.query("INSERT INTO product_translations(product_id,locale_id,name,slug,path) VALUES($1,$2,'Duplicate','verify-new','/en/verify-new')",[product,locale]),e=>e.code==='23505');await c.query('ROLLBACK TO duplicate_path');
 await c.query('SAVEPOINT redirect_cycle');await assert.rejects(()=>c.query("INSERT INTO redirects(source_path,target_url) VALUES('/en/cycle','/en/cycle')"),e=>e.code==='23514');await c.query('ROLLBACK TO redirect_cycle');
 await c.query('SAVEPOINT path_escape');await assert.rejects(()=>c.query("UPDATE content_item_translations SET path='/en/../../secret' WHERE id=$1",[translation.id]),e=>e.code==='23514');await c.query('ROLLBACK TO path_escape');
 const job=(await c.query("INSERT INTO publish_jobs(job_type,entity_type) VALUES('rebuild','site') RETURNING id")).rows[0];await c.query("UPDATE publish_jobs SET status='processing' WHERE id=$1",[job.id]);
 await c.query("UPDATE content_item_translations SET deleted_at=now() WHERE id=$1",[translation.id]);assert.equal((await c.query("SELECT count(*)::int AS n FROM site_paths WHERE path='/en/verify-new'")).rows[0].n,0);
 await c.query('ROLLBACK');await c.end();c=null;console.log('Constraints, FTS, soft delete, updated_at and 301 trigger checks passed.');
 await run(['--import','tsx','tests/geo-monitoring.integration.ts']);
 await run(['--import','tsx','tests/integration.ts']);
 await run(['infrastructure/scripts/migrate.mjs','down','000']);await migrateBusinessUpAndVerify();await migrateBusinessUpAndVerify();
 const record={timestamp:new Date().toISOString(),postgres:version,forward:true,payloadBootstrap:true,migration025:true,clientRoleEnum:true,rollback:true,reapply:true,idempotentRunner:true,constraints:true,integration:true};
 // 只在"验证结果"变化时才写这份记录：否则每次跑验证都会仅因 timestamp 不同而弄脏工作树，
 // 让人误以为有未提交改动。timestamp 的语义 = 该结果第一次被记录的时间；结果一致就不动它。
 const recordPath=path.join(root,'docs/database-verification.json');
 const canon=o=>JSON.stringify(Object.entries(o).sort(([a],[b])=>(a<b?-1:a>b?1:0)));
 const strip=({timestamp:ignored,...rest})=>rest;
 let previous=null;try{previous=JSON.parse(await fs.readFile(recordPath,'utf8'));}catch{}
 await fs.mkdir(path.join(root,'docs'),{recursive:true});
 if(previous&&canon(strip(previous))===canon(strip(record)))console.log('Verification record unchanged; existing timestamp kept.');
 else await fs.writeFile(recordPath,JSON.stringify(record,null,2));
 console.log('PASS: payload bootstrap → forward → integration → full rollback → reapply → no-op migration.');
}finally{if(c)await c.end();await admin.query('DROP DATABASE IF EXISTS '+name+' WITH (FORCE)');await admin.end();}
