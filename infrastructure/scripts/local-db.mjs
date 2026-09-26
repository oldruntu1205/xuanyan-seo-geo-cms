// Optional local development helper. Install: npm install --prefix .runtime embedded-postgres@16.14.0-beta.17
import fs from 'node:fs/promises';import path from 'node:path';import {fileURLToPath,pathToFileURL} from 'node:url';import {config} from 'dotenv';import {execFile} from 'node:child_process';import {promisify} from 'node:util';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');config({path:path.join(root,'.env')});
const {default:EmbeddedPostgres}=await import(pathToFileURL(path.join(root,'.runtime/node_modules/embedded-postgres/dist/index.js')).href);
const password=process.env.POSTGRES_PASSWORD;if(!password)throw Error('Run pnpm run setup first');
const pg=new EmbeddedPostgres({databaseDir:path.join(root,'.runtime/pg-data'),user:'suns',password,port:55432,persistent:true,initdbFlags:['--encoding=UTF8','--locale=C'],postgresFlags:['-h','127.0.0.1'],onLog:()=>{},onError:()=>{}});
try{await fs.access(path.join(root,'.runtime/pg-data/PG_VERSION'));}catch{await pg.initialise();}
const ctl=path.join(root,'.runtime/node_modules/@embedded-postgres/windows-x64/native/bin/pg_ctl.exe');const exec=promisify(execFile);let owned=true;
if(process.platform==='win32'){try{await exec(ctl,['status','-D',path.join(root,'.runtime/pg-data')],{windowsHide:true});owned=false;}catch{await exec(ctl,['start','-D',path.join(root,'.runtime/pg-data'),'-l',path.join(root,'.runtime/postgres.log'),'-o','-p 55432 -h 127.0.0.1','-w'],{windowsHide:true});}}else await pg.start();
const c=pg.getPgClient();await c.connect();const db=await c.query("SELECT 1 FROM pg_database WHERE datname='suns'");if(!db.rowCount)await c.query('CREATE DATABASE suns');await c.end();
const url='postgresql://suns:'+encodeURIComponent(password)+'@127.0.0.1:55432/suns';await fs.writeFile(path.join(root,'.runtime/connection.json'),JSON.stringify({DATABASE_URL:url}),{mode:0o600});console.log('Temporary PostgreSQL 16 listening on 127.0.0.1:55432. Credentials saved in .runtime/connection.json.');
let stopping=false;async function stop(){if(stopping)return;stopping=true;if(owned){if(process.platform==='win32')await exec(ctl,['stop','-D',path.join(root,'.runtime/pg-data'),'-m','fast','-w'],{windowsHide:true});else await pg.stop();}process.exit(0);}process.on('SIGINT',stop);process.on('SIGTERM',stop);setInterval(()=>{},60000);
