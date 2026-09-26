import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {config as loadEnv} from 'dotenv';
import sharp from 'sharp';
import {nodemailerAdapter} from '@payloadcms/email-nodemailer';
import {lexicalEditor} from '@payloadcms/richtext-lexical';
import {postgresAdapter} from '@payloadcms/db-postgres';
import {buildConfig} from 'payload';
import {AdminUsers} from './collections/AdminUsers';
loadEnv({path:path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../../../.env')});
const dirname=path.dirname(fileURLToPath(import.meta.url));
const secret=process.env.PAYLOAD_SECRET;
if(!secret || secret.length<32)throw new Error('PAYLOAD_SECRET must contain at least 32 characters. Run pnpm setup.');
export default buildConfig({
 secret,email:process.env.SMTP_HOST?nodemailerAdapter({defaultFromAddress:process.env.SMTP_FROM||'cms@localhost',defaultFromName:'SUNS CMS',transportOptions:{host:process.env.SMTP_HOST,port:Number(process.env.SMTP_PORT||587),secure:process.env.SMTP_SECURE==='true',auth:process.env.SMTP_USER?{user:process.env.SMTP_USER,pass:process.env.SMTP_PASSWORD}:undefined}}):undefined,admin:{user:AdminUsers.slug,importMap:{baseDir:dirname},components:{beforeNavLinks:['./components/ManageLink#default']}},
 editor:lexicalEditor(),collections:[AdminUsers],
 db:postgresAdapter({pool:{connectionString:process.env.DATABASE_URL},schemaName:'payload_internal',idType:'uuid',push:process.env.PAYLOAD_SCHEMA_PUSH==='true',migrationDir:path.resolve(dirname,'migrations')}),
 typescript:{outputFile:path.resolve(dirname,'payload-types.ts')},sharp,routes:{admin:'/admin'},
 csrf:(process.env.CORS_ORIGINS||'http://localhost:3000,http://localhost:3001').split(','),
 cors:(process.env.CORS_ORIGINS||'http://localhost:3000,http://localhost:3001').split(',')
});
