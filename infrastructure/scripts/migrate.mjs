import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import pg from 'pg';
import {config} from 'dotenv';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');config({path:path.join(root,'.env')});
const direction=process.argv[2]||'up',target=process.argv[3];
if(!['up','down','status'].includes(direction))throw Error('Usage: migrate.mjs up|down|status [target version]');
if(!process.env.DATABASE_URL)throw Error('DATABASE_URL is required');
const c=new pg.Client({connectionString:process.env.DATABASE_URL});await c.connect();
try{
 const v=(await c.query('SHOW server_version_num')).rows[0].server_version_num;if(Number(v)<160000)throw Error('PostgreSQL 16+ required');
 await c.query('SELECT pg_advisory_lock(837611,2)');
 await c.query(`CREATE TABLE IF NOT EXISTS public.schema_migrations(version text PRIMARY KEY,checksum text NOT NULL,applied_at timestamptz NOT NULL DEFAULT now())`);
 const names=(await fs.readdir(path.join(root,'database'))).filter(n=>/^\d{3}_.*\.sql$/.test(n)).sort();
 const applied=(await c.query('SELECT * FROM schema_migrations ORDER BY version')).rows;
 for(const entry of applied){if(!names.includes(entry.version))throw Error('Applied migration missing: '+entry.version);const data=await fs.readFile(path.join(root,'database',entry.version));if(createHash('sha256').update(data).digest('hex')!==entry.checksum)throw Error('Applied migration changed: '+entry.version);}
 if(direction==='status'){console.table(names.map(n=>({version:n,applied:applied.some(a=>a.version===n)})));}
 else{
  const chosen=direction==='up'?names.filter(n=>!applied.some(a=>a.version===n)&&(!target||n.slice(0,3)<=target.padStart(3,'0'))):applied.map(a=>a.version).reverse().filter((n,i)=>target?n.slice(0,3)>target.padStart(3,'0'):i===0);
  for(const name of chosen){const file=direction==='up'?path.join(root,'database',name):path.join(root,'database/rollback',name.replace('.sql','.down.sql'));const data=await fs.readFile(file);await c.query('BEGIN');try{await c.query("SET LOCAL timezone='UTC'");await c.query(data.toString('utf8').replace(/^\uFEFF/,''));if(direction==='up')await c.query('INSERT INTO schema_migrations(version,checksum) VALUES($1,$2)',[name,createHash('sha256').update(data).digest('hex')]);else await c.query('DELETE FROM schema_migrations WHERE version=$1',[name]);await c.query('COMMIT');console.log(direction,name);}catch(e){await c.query('ROLLBACK');throw e;}}
 }
}finally{await c.query('SELECT pg_advisory_unlock(837611,2)').catch(()=>{});await c.end();}
