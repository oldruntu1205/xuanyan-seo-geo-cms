import fs from 'node:fs/promises';import path from 'node:path';import {fileURLToPath} from 'node:url';import {spawn} from 'node:child_process';import {randomBytes} from 'node:crypto';import assert from 'node:assert/strict';import pg from 'pg';import {config} from 'dotenv';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');config({path:path.join(root,'.env')});
if(process.argv.includes('--local-runtime'))Object.assign(process.env,JSON.parse(await fs.readFile(path.join(root,'.runtime/connection.json'),'utf8')));
if(!process.env.DATABASE_URL)throw Error('DATABASE_URL required. Verification creates and removes its own temporary database.');
const admin=new pg.Client({connectionString:process.env.DATABASE_URL});await admin.connect();const name='suns_verify_'+randomBytes(8).toString('hex');const url=new URL(process.env.DATABASE_URL);url.pathname='/'+name;let c;
async function run(args){await new Promise((resolve,reject)=>{const p=spawn(process.execPath,args,{cwd:root,env:{...process.env,DATABASE_URL:url.href,VERIFY_DATABASE:'1'},stdio:'inherit',windowsHide:true});p.on('exit',code=>code===0?resolve():reject(Error('Verification command failed: '+code)));p.on('error',reject);});}
try{
 await admin.query('CREATE DATABASE '+name);console.log('Isolated validation database created.');
 await run(['infrastructure/scripts/migrate.mjs','up']);c=new pg.Client({connectionString:url.href});await c.connect();await c.query(await fs.readFile(path.join(root,'database/verify.sql'),'utf8'));
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
 await run(['--import','tsx','tests/integration.ts']);
 await run(['infrastructure/scripts/migrate.mjs','down','000']);await run(['infrastructure/scripts/migrate.mjs','up']);await run(['infrastructure/scripts/migrate.mjs','up']);
 await fs.mkdir(path.join(root,'docs'),{recursive:true});await fs.writeFile(path.join(root,'docs/database-verification.json'),JSON.stringify({timestamp:new Date().toISOString(),postgres:version,forward:true,rollback:true,reapply:true,idempotentRunner:true,constraints:true,integration:true},null,2));console.log('PASS: forward → integration → full rollback → reapply → no-op migration.');
}finally{if(c)await c.end();await admin.query('DROP DATABASE IF EXISTS '+name+' WITH (FORCE)');await admin.end();}
