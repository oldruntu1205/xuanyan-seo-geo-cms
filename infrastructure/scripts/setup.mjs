import fs from 'node:fs/promises';import path from 'node:path';import {fileURLToPath} from 'node:url';import {randomBytes} from 'node:crypto';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
const example=await fs.readFile(path.join(root,'.env.example'),'utf8');
const password=randomBytes(24).toString('hex');const text=example.replaceAll('GENERATE_POSTGRES_PASSWORD',password).replaceAll('GENERATE_PAYLOAD_SECRET',randomBytes(48).toString('hex')).replaceAll('GENERATE_GEO_MONITOR_SECRET',randomBytes(48).toString('hex')).replaceAll('GENERATE_MARKETING_UNSUBSCRIBE_SECRET',randomBytes(48).toString('hex'));
try{await fs.writeFile(path.join(root,'.env'),text,{flag:'wx',mode:0o600});console.log('Created .env with unique local secrets. Configure domain/storage before deployment.');}catch(e){if(e.code==='EEXIST')console.log('.env already exists; preserved.');else throw e;}
for(const name of ['media','static-site'])await fs.mkdir(path.join(root,name),{recursive:true});
