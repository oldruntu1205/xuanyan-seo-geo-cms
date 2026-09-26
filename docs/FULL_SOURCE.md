# V1.0 完整代码文件汇编

生成自实际项目文件；不包含密钥、依赖包、数据库或构建缓存。实际文件是运行入口。

## 目录

- `.dockerignore`
- `.env.example`
- `.github/workflows/ci.yml`
- `.gitignore`
- `apps/cms/next-env.d.ts`
- `apps/cms/next.config.mjs`
- `apps/cms/package.json`
- `apps/cms/src/app/(console)/manage/layout.tsx`
- `apps/cms/src/app/(console)/manage/manage.css`
- `apps/cms/src/app/(console)/manage/page.tsx`
- `apps/cms/src/app/(payload)/admin/[[...segments]]/not-found.tsx`
- `apps/cms/src/app/(payload)/admin/[[...segments]]/page.tsx`
- `apps/cms/src/app/(payload)/admin/importMap.js`
- `apps/cms/src/app/(payload)/admin/importMap.ts`
- `apps/cms/src/app/(payload)/api/[...slug]/route.ts`
- `apps/cms/src/app/(payload)/api/v1/[...path]/route.ts`
- `apps/cms/src/app/(payload)/graphql/route.ts`
- `apps/cms/src/app/(payload)/layout.tsx`
- `apps/cms/src/app/(payload)/media/[...key]/route.ts`
- `apps/cms/src/collections/AdminUsers.ts`
- `apps/cms/src/components/BlockEditor.tsx`
- `apps/cms/src/components/ManageLink.tsx`
- `apps/cms/src/migrations/20260926_101317_initial_auth.ts`
- `apps/cms/src/migrations/index.ts`
- `apps/cms/src/payload.config.ts`
- `apps/cms/src/server/api.ts`
- `apps/cms/src/server/auth.ts`
- `apps/cms/src/server/media.ts`
- `apps/cms/tsconfig.json`
- `apps/web/next-env.d.ts`
- `apps/web/next.config.ts`
- `apps/web/package.json`
- `apps/web/postcss.config.mjs`
- `apps/web/src/app/[locale]/[...slug]/page.tsx`
- `apps/web/src/app/[locale]/error.tsx`
- `apps/web/src/app/[locale]/layout.tsx`
- `apps/web/src/app/[locale]/not-found.tsx`
- `apps/web/src/app/[locale]/page.tsx`
- `apps/web/src/app/assets/site.css/route.ts`
- `apps/web/src/app/assets/site.js/route.ts`
- `apps/web/src/app/globals.css`
- `apps/web/src/app/page.tsx`
- `apps/web/src/lib/document.tsx`
- `apps/web/tsconfig.json`
- `apps/worker/package.json`
- `apps/worker/src/index.ts`
- `apps/worker/tsconfig.json`
- `database/001_extensions.sql`
- `database/002_core_system.sql`
- `database/003_content.sql`
- `database/004_product.sql`
- `database/005_seo_geo.sql`
- `database/006_media_appearance.sql`
- `database/007_publishing.sql`
- `database/008_leads_integrations.sql`
- `database/009_indexes_constraints.sql`
- `database/010_seed.sql`
- `database/011_runtime.sql`
- `database/012_operational_defaults.sql`
- `database/rollback/001_extensions.down.sql`
- `database/rollback/002_core_system.down.sql`
- `database/rollback/003_content.down.sql`
- `database/rollback/004_product.down.sql`
- `database/rollback/005_seo_geo.down.sql`
- `database/rollback/006_media_appearance.down.sql`
- `database/rollback/007_publishing.down.sql`
- `database/rollback/008_leads_integrations.down.sql`
- `database/rollback/009_indexes_constraints.down.sql`
- `database/rollback/010_seed.down.sql`
- `database/rollback/011_runtime.down.sql`
- `database/rollback/012_operational_defaults.down.sql`
- `database/verify.sql`
- `docker-compose.yml`
- `infrastructure/docker/Dockerfile.cms`
- `infrastructure/docker/Dockerfile.web`
- `infrastructure/docker/Dockerfile.worker`
- `infrastructure/nginx/default.conf`
- `infrastructure/scripts/export-source.mjs`
- `infrastructure/scripts/local-db.mjs`
- `infrastructure/scripts/migrate.mjs`
- `infrastructure/scripts/migrate.ps1`
- `infrastructure/scripts/setup.mjs`
- `infrastructure/scripts/verify.mjs`
- `infrastructure/scripts/verify.ps1`
- `package.json`
- `packages/domain/package.json`
- `packages/domain/src/crud.ts`
- `packages/domain/src/db.ts`
- `packages/domain/src/documents.ts`
- `packages/domain/src/index.ts`
- `packages/domain/src/publishing.ts`
- `packages/domain/src/registry.ts`
- `packages/domain/src/service.ts`
- `packages/domain/src/types.ts`
- `packages/domain/tsconfig.json`
- `packages/publisher/package.json`
- `packages/publisher/src/files.ts`
- `packages/publisher/src/index.ts`
- `packages/publisher/tsconfig.json`
- `packages/ui/package.json`
- `packages/ui/src/browser.ts`
- `packages/ui/src/index.ts`
- `packages/ui/src/styles.ts`
- `packages/ui/tsconfig.json`
- `pnpm-workspace.yaml`
- `tests/http-smoke.mjs`
- `tests/integration.ts`
- `tests/render.test.ts`
- `tsconfig.base.json`

## .dockerignore

````dockerignore
**/node_modules
**/.next
**/dist
**/*.tsbuildinfo
.env
.env.*
!.env.example
.runtime
.git
media
static-site
work
outputs

````

## .env.example

````example
# pnpm setup generates unique secrets. Never commit .env.
POSTGRES_USER=suns
POSTGRES_DB=suns
POSTGRES_PASSWORD=GENERATE_POSTGRES_PASSWORD
DATABASE_URL=postgresql://suns:GENERATE_POSTGRES_PASSWORD@localhost:5432/suns
REDIS_URL=redis://localhost:6379
PAYLOAD_SECRET=GENERATE_PAYLOAD_SECRET
CMS_INTERNAL_URL=http://localhost:3001
NEXT_PUBLIC_SITE_URL=http://localhost:3000
CORS_ORIGINS=http://localhost:3000,http://localhost:3001,http://localhost:8080
DEFAULT_LOCALE=en
DEPLOYMENT_ENV=development
TRUST_PROXY=0
STORAGE_PROVIDER=local
# MEDIA_DIR and STATIC_OUTPUT_DIR are resolved from each app's cwd; Docker sets absolute paths.
MEDIA_DIR=../../media
STATIC_OUTPUT_DIR=../../static-site
MEDIA_PUBLIC_URL=
S3_ENDPOINT=
S3_REGION=auto
S3_BUCKET=
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
CLOUDFLARE_ZONE_ID=
CLOUDFLARE_API_TOKEN=

# Optional password-reset mail. Use a verified sender in production.
SMTP_HOST=
SMTP_PORT=587
SMTP_SECURE=false
SMTP_FROM=
SMTP_USER=
SMTP_PASSWORD=
# Schema changes are deployed by migrations, never automatic production pushes.
PAYLOAD_SCHEMA_PUSH=false

````

## .github/workflows/ci.yml

````yaml
name: Validate CMS
on: [push, pull_request]
jobs:
  validate:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:16
        env: {POSTGRES_USER: suns, POSTGRES_PASSWORD: ci-only-password, POSTGRES_DB: suns}
        ports: ["5432:5432"]
        options: --health-cmd "pg_isready -U suns" --health-interval 5s --health-timeout 5s --health-retries 20
      redis:
        image: redis:7
        ports: ["6379:6379"]
    env:
      DATABASE_URL: postgresql://suns:ci-only-password@localhost:5432/suns
      REDIS_URL: redis://localhost:6379
      PAYLOAD_SECRET: ci-only-build-secret-not-a-production-credential-00000000
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with: {version: 10.17.1}
      - uses: actions/setup-node@v4
        with: {node-version: 22, cache: pnpm}
      - run: pnpm install --frozen-lockfile
      - run: pnpm run setup
      - run: pnpm db:verify
      - run: pnpm db:migrate
      - run: pnpm auth:migrate
        env: {NODE_ENV: production}
      - run: pnpm typecheck
      - run: pnpm test
      - run: pnpm build
      - run: docker compose config --quiet
        env: {POSTGRES_PASSWORD: ci-only-password}

````

## .gitignore

````gitignore
node_modules/
.next/
dist/
*.tsbuildinfo
.env
.env.*
!.env.example
.runtime/
# Anchored on purpose: an unanchored "media/" also matched the real CMS source directory
# apps/cms/src/app/(payload)/media/, which silently kept that route out of version control.
/media/
/static-site/
*.log

````

## apps/cms/next-env.d.ts

````ts
/// <reference types="next" />
/// <reference types="next/image-types/global" />
import "./.next/types/routes.d.ts";
import "./.next/types/root-params.d.ts";

// NOTE: This file should not be edited
// see https://nextjs.org/docs/app/api-reference/config/typescript for more information.

````

## apps/cms/next.config.mjs

````javascript
import {withPayload} from '@payloadcms/next/withPayload';
import {config} from 'dotenv';config({path:'../../.env'});
export default withPayload({reactStrictMode:true,outputFileTracingExcludes:{'/*':['../../.runtime/**/*','../../media/**/*','../../static-site/**/*','../../.env']},transpilePackages:['@suns/domain'],serverExternalPackages:['pg','sharp']});

````

## apps/cms/package.json

````json
{
  "name": "@suns/cms",
  "private": true,
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "cross-env next dev -p 3001",
    "build": "next build",
    "start": "next start -p 3001",
    "typecheck": "tsc --noEmit",
    "payload": "payload"
  },
  "dependencies": {
    "@payloadcms/db-postgres": "3.90.2",
    "@payloadcms/next": "3.90.2",
    "@payloadcms/richtext-lexical": "3.90.2",
    "cross-env": "^10.0.0",
    "dotenv": "^16.6.1",
    "payload": "3.90.2",
    "sharp": "^0.34.3",
    "next": "16.3.6",
    "react": "^19.2.0",
    "react-dom": "^19.2.0",
    "@suns/domain": "workspace:*",
    "@aws-sdk/client-s3": "^3.899.0",
    "zod": "^3.25.76",
    "@payloadcms/email-nodemailer": "3.90.2"
  },
  "devDependencies": {
    "typescript": "^5.9.2",
    "@types/react": "^19.1.13",
    "@types/react-dom": "^19.1.9"
  }
}

````

## apps/cms/src/app/(console)/manage/layout.tsx

````tsx
import './manage.css';
export const metadata={title:'SUNS 内容管理',robots:{index:false,follow:false}};
export default function Layout({children}:{children:React.ReactNode}){return <html lang="zh-CN"><body>{children}</body></html>;}

````

## apps/cms/src/app/(console)/manage/manage.css

````css
*{box-sizing:border-box}body{margin:0;font-family:'Segoe UI','Microsoft YaHei',sans-serif;background:#f3f4f1;color:#20372f}button,input,select,textarea{font:inherit}button,a{touch-action:manipulation}button{cursor:pointer;border:1px solid #cad5cb;background:white;border-radius:5px;padding:8px 13px;color:inherit}button:hover{background:#ecf3ec}button:disabled{opacity:.5;cursor:not-allowed}a{color:#196c52}.studio{display:grid;grid-template-columns:240px 1fr;min-height:100vh}aside{position:sticky;top:0;height:100vh;overflow:auto;background:#173e33;color:#e8f0e5;padding:27px 17px}aside button{display:block;width:100%;text-align:left;border:0;color:inherit;background:none;margin:2px 0;font-size:13px}aside button:hover,aside button.active{background:#315847}aside h2{font-size:10px;letter-spacing:2px;color:#a4bca8;margin:28px 12px 8px}aside a{color:#dcf2d7;display:block;margin:30px 12px}.brand{font-family:Georgia,serif;font-size:30px;letter-spacing:3px;margin:0 10px 30px}.brand span{font:9px 'Segoe UI',sans-serif;display:block;letter-spacing:3px;margin-top:4px}.workspace{padding:32px 38px;min-width:0}.workspace>header{display:flex;align-items:center;gap:20px;margin-bottom:30px}.workspace>header div{margin-right:auto}h1{font-size:26px;margin:3px 0}.eyebrow{font-size:10px;color:#687d70;letter-spacing:2px}.workspace>header>span{font-size:12px}.notice{background:#e7ecd7;padding:16px;border-left:4px solid #7c8a31;display:flex;justify-content:space-between;margin-bottom:22px}.stats{display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:16px}.stats>div{background:white;padding:25px;border:1px solid #dde3d9}.stats strong{display:block;font:38px Georgia,serif;margin-top:12px}.stats span{color:#67806e;font-size:12px}.panel{background:white;padding:30px;margin-top:28px;border:1px solid #dde3d9}.panel p{color:#627166;line-height:1.8}.job-list article{display:flex;flex-wrap:wrap;gap:20px;padding:18px 0;border-bottom:1px solid #e3e8df}.badge{padding:3px 8px;border-radius:20px;background:#eee;font-size:12px}.completed{background:#e1f2db}.failed{background:#ffe3df}.toolbar{display:flex;gap:10px;align-items:center;margin-bottom:20px;flex-wrap:wrap}.toolbar form{display:flex;gap:8px;margin-right:auto}.toolbar input{min-width:270px;padding:10px;border:1px solid #cbd4c9;border-radius:5px}.primary,.upload{background:#275c45;color:white;border:0}.upload{padding:10px 14px;border-radius:5px;cursor:pointer}.upload input{display:none}.table-wrap{overflow:auto;background:white;border:1px solid #dce4da}table{width:100%;border-collapse:collapse;font-size:12px}th{text-align:left;background:#eaf0e7;font-weight:600;padding:14px;white-space:nowrap}td{padding:14px;border-bottom:1px solid #e9eee6;max-width:190px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.actions{max-width:none;display:flex;gap:6px}.actions button{padding:5px 8px;font-size:11px}.danger{color:#a33d36}.empty{text-align:center;padding:70px;color:#7d887d}.pagination{display:flex;justify-content:flex-end;align-items:center;gap:12px;margin-top:18px;font-size:12px}.pagination>span:first-child{margin-right:auto}.modal-backdrop{position:fixed;inset:0;background:#18352988;display:flex;align-items:center;justify-content:center;z-index:20;padding:24px}.editor{background:#fcfdfb;border-radius:10px;max-width:980px;width:100%;max-height:94vh;overflow:auto;box-shadow:0 20px 70px #17382544}.editor>header{position:sticky;top:0;background:#fcfdfb;display:flex;align-items:center;justify-content:space-between;padding:18px 27px;border-bottom:1px solid #dbe5d6;z-index:1}.editor h2{font-size:18px}.editor form{padding:27px}.fields{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:23px}.fields label{display:flex;flex-direction:column;gap:7px;font-size:12px}.fields label:has(textarea){grid-column:1/-1}.fields input,.fields select,.fields textarea{width:100%;padding:10px;border:1px solid #ccd9c6;border-radius:4px;background:white}.fields input[type=checkbox]{align-self:start;width:22px;height:22px}.fields textarea{font-family:Consolas,'Microsoft YaHei',monospace;resize:vertical;line-height:1.6}.fields small{color:#788471;font-size:11px}.editor footer{display:flex;justify-content:flex-end;gap:12px;margin-top:30px}.editor details{margin-top:25px;color:#63715c;font-size:12px}.editor pre{overflow:auto;font-size:12px}.login{max-width:460px;margin:10vh auto;padding:35px;background:white;border:1px solid #dce7d4}.login label{display:flex;flex-direction:column;gap:8px;margin:18px 0}.login input{padding:12px;border:1px solid #bccaaf}.login p{line-height:1.7;color:#617457;font-size:13px}.login a{font-size:12px}:focus-visible{outline:3px solid #9bc754;outline-offset:3px}@media(max-width:900px){.studio{grid-template-columns:180px 1fr}.workspace{padding:20px}.fields{grid-template-columns:1fr}.workspace>header>span{display:none}}@media(max-width:600px){.studio{display:block}aside{position:relative;height:auto;max-height:220px}.workspace{padding:14px}.toolbar input{min-width:0;width:100%}.toolbar form{width:100%}.workspace>header h1{font-size:21px}.modal-backdrop{padding:8px}.editor form{padding:17px}}

.block-builder{grid-column:1/-1}.block-card{border:1px solid #cedbd4;padding:16px;margin:12px 0;background:#f7faf8}.block-card header{display:flex;gap:8px}.block-item{padding:10px;border-bottom:1px solid #ddd}.block-card span{display:block;margin-top:8px}

````

## apps/cms/src/app/(console)/manage/page.tsx

````tsx
'use client';
import { useEffect,useState } from 'react';
import {BlockEditor} from '../../../components/BlockEditor';
type Row=Record<string,any>;
const groups:Row={content:'内容',product:'产品',seo:'SEO / GEO',media:'媒体',appearance:'外观 / 客服',leads:'询盘',publishing:'发布',translation:'翻译',history:'版本 / 审计',system:'系统'};
const labels:Row={id:'编号',title:'标题',name:'名称',path:'完整 URL 路径',slug:'URL 标识',locale_id:'语言',status:'状态',publish_status:'发布状态',description:'描述',short_description:'摘要',excerpt:'摘要',content_type:'内容类型',parent_id:'父级',sort_order:'排序',is_enabled:'启用',sku:'SKU',meta_title:'SEO 标题',meta_description:'SEO 描述',canonical_url:'Canonical 地址',robots_index:'允许索引',robots_follow:'允许跟踪链接',entity_name:'知识实体名称',short_answer:'简洁回答',definition:'定义',fact_key:'事实名称',fact_value:'事实内容',source_url:'来源 URL',primary_domain:'网站地址',company_email:'联系邮箱',body:'正文区块',data:'区块内容',block_type:'区块类型'};
async function api(path:string,body?:Row,method?:string){const res=await fetch('/api/v1/'+path,{credentials:'include',method:method||(body?'POST':'GET'),headers:body?{'Content-Type':'application/json'}:undefined,body:body?JSON.stringify(body):undefined});const value=await res.json();if(!res.ok)throw Object.assign(new Error(value.error||'操作失败'),{status:res.status});return value;}
export default function Manage(){
 const [meta,setMeta]=useState<Row|null>(null),[resource,setResource]=useState(''),[listing,setListing]=useState<Row|null>(null),[page,setPage]=useState(1),[search,setSearch]=useState(''),[query,setQuery]=useState(''),[draft,setDraft]=useState<Row|null>(null),[editing,setEditing]=useState<Row|null>(null),[notice,setNotice]=useState(''),[busy,setBusy]=useState(false),[dashboard,setDashboard]=useState<Row|null>(null),[login,setLogin]=useState(false),[lookups,setLookups]=useState<Row>({}),[refresh,setRefresh]=useState(0);
 const notify=(e:any)=>{setNotice(e.message||String(e));if(e.status===401)setLogin(true);};
 useEffect(()=>{api('meta').then(x=>{setMeta(x);setLogin(false);}).catch(notify);},[refresh]);
 useEffect(()=>{if(!meta)return;let cancelled=false;if(resource)api('records?resource='+resource+'&page='+page+'&search='+encodeURIComponent(query)).then(x=>{if(!cancelled)setListing(x);}).catch(notify);else api('dashboard').then(setDashboard).catch(notify);return()=>{cancelled=true;};},[meta,resource,page,query,refresh]);
 async function act(fn:()=>Promise<any>){setBusy(true);setNotice('');try{await fn();setRefresh(x=>x+1);}catch(e){notify(e);}finally{setBusy(false);}}
 async function open(row:Row|null){setEditing(row);const data:Row={};for(const col of listing!.columns){if(col.readonly)continue;const value=row?.[col.name];data[col.name]=col.type==='jsonb'?JSON.stringify(value??(col.name==='body'||col.name==='features'||col.name==='applications'?[]:{}),null,2):(value??(col.type==='boolean'?col.default==='true':''));}setDraft(data);const refs=[...new Set<string>(listing!.columns.map((c:Row)=>c.reference).filter(Boolean))];for(const ref of refs){if(!lookups[ref]&&meta?.resources.some((r:Row)=>r.table===ref))api('records?resource='+ref).then(x=>setLookups(prev=>({...prev,[ref]:x.rows}))).catch(()=>{});}}
 function recordKey(row:Row){return Object.fromEntries(listing!.resource.key.map((k:string)=>[k,row[k]]));}
 async function submit(){if(!draft||!listing)return;await act(async()=>{const data:Row={};for(const c of listing.columns){if(c.readonly)continue;const value=draft[c.name];if(!editing&&value===''&&c.default)continue;if(value===''&&c.nullable){data[c.name]=null;continue;}data[c.name]=c.type==='jsonb'?JSON.parse(value):['integer','bigint','numeric','smallint','double precision'].includes(c.type)&&value!==''?Number(value):value;}if(editing&&['content_item_translations','product_translations'].includes(resource)){const k=resource==='product_translations'?'publish_status':'status';if(['published','scheduled'].includes(data[k]))data[k]='draft';}if(editing?.updated_at)data._expectedUpdatedAt=editing.updated_at;await api('records?resource='+resource,{data,key:editing?recordKey(editing):undefined},editing?'PATCH':'POST');setDraft(null);setNotice('已保存。公开页面在审核发布后更新。');});}
 if(login)return <main className="login"><div className="brand">SUNS<span>CONTENT STUDIO</span></div><h1>登录管理后台</h1><p>使用 Payload 管理员账号访问业务工作区。</p><form onSubmit={e=>{e.preventDefault();const f=new FormData(e.currentTarget);act(async()=>{const r=await fetch('/api/cms-admin-users/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:f.get('email'),password:f.get('password')})});if(!r.ok)throw new Error('邮箱或密码不正确，或账号已锁定');setLogin(false);});}}><label>邮箱<input name="email" type="email" required autoComplete="username"/></label><label>密码<input name="password" type="password" required autoComplete="current-password"/></label><button disabled={busy}>登录</button></form><p role="alert">{notice}</p><a href="/admin">首次使用：创建管理员账号 ↗</a></main>;
 if(!meta)return <main className="login" aria-busy="true">正在连接内容工作区…{notice&&<p role="alert">{notice}</p>}</main>;
 const active=meta.resources.find((r:Row)=>r.table===resource);
 return <div className="studio"><aside><div className="brand">SUNS<span>CONTENT STUDIO</span></div><button className={!resource?'active':''} onClick={()=>{setResource('');setListing(null);}}>工作台</button>{Object.entries(groups).map(([g,title])=><section key={g}><h2>{title}</h2>{meta.resources.filter((r:Row)=>r.group===g).map((r:Row)=><button className={resource===r.table?'active':''} key={r.table} onClick={()=>{setResource(r.table);setPage(1);setListing(null);setQuery('');setSearch('');setDraft(null);}}>{r.label}</button>)}</section>)}<a href="/admin">账号与密码管理 ↗</a></aside><main className="workspace"><header><div><p className="eyebrow">SUNS / OPERATIONS</p><h1>{active?.label||'内容工作台'}</h1></div><span>{meta.actor.displayName} · {meta.actor.role}</span><button onClick={()=>act(async()=>{await fetch('/api/cms-admin-users/logout',{method:'POST'});setLogin(true);setMeta(null);})}>退出</button></header>{notice&&<div className="notice" role="status">{notice}<button aria-label="关闭提示" onClick={()=>setNotice('')}>×</button></div>}
 {!resource&&dashboard&&<><div className="stats">{Object.entries(dashboard.counts).map(([k,v])=><div key={k}><span>{meta.resources.find((r:Row)=>r.table===k)?.label||k}</span><strong>{String(v)}</strong></div>)}</div><div className="panel"><h2>发布最近动态</h2><p>草稿 → 审核 → 发布任务 → 静态页面。发布完成后，公开网站才会更新。</p><button onClick={()=>act(async()=>{await api('publish',{resource:'site'});setNotice('全站重建已加入队列');})}>重建已发布站点</button><div className="job-list">{dashboard.jobs.map((j:Row)=><article key={j.id}><b>{j.job_type}</b><span>{j.entity_type}</span><span className={'badge '+j.status}>{j.status}</span><small>{j.error_message}</small></article>)}</div></div></>}
 {resource&&<><div className="toolbar"><form onSubmit={e=>{e.preventDefault();setQuery(search);setPage(1);}}><input aria-label="搜索记录" placeholder="搜索名称、标题、SKU…" value={search} onChange={e=>setSearch(e.target.value)}/><button>搜索</button></form>{active?.writable&&resource!=='media_assets'&&<button className="primary" disabled={!listing} onClick={()=>open(null)}>＋ 新建</button>}{resource==='media_assets'&&active?.writable&&<label className="upload">上传文件<input type="file" accept="image/jpeg,image/png,image/webp,image/avif,application/pdf,video/mp4" onChange={e=>{const file=e.target.files?.[0];if(file)act(async()=>{const form=new FormData();form.set('file',file);const res=await fetch('/api/v1/upload',{method:'POST',body:form});const value=await res.json();if(!res.ok)throw new Error(value.error);setNotice('上传成功，图片已生成 AVIF/WebP 版本');});}}/></label>}<button onClick={()=>setRefresh(x=>x+1)}>刷新</button></div>
 {!listing?<p>加载中…</p>:<><div className="table-wrap"><table><thead><tr>{listing.columns.filter((c:Row)=>!['jsonb','tsvector'].includes(c.type)).slice(0,8).map((c:Row)=><th key={c.name}>{labels[c.name]||c.name}</th>)}<th>操作</th></tr></thead><tbody>{listing.rows.map((r:Row)=><tr key={JSON.stringify(recordKey(r))}>{listing.columns.filter((c:Row)=>!['jsonb','tsvector'].includes(c.type)).slice(0,8).map((c:Row)=><td key={c.name} title={String(r[c.name]??'')}>{typeof r[c.name]==='boolean'?(r[c.name]?'是':'否'):String(r[c.name]??'—')}</td>)}<td className="actions"><button onClick={()=>open(r)}>{active.writable?'编辑':'查看'}</button>{['content_item_translations','product_translations','taxonomy_term_translations'].includes(resource)&&<><button onClick={()=>act(async()=>{await api('publish',{resource,id:r.id});setNotice('发布任务已入队');})}>发布</button><button onClick={()=>{const at=window.prompt('请输入发布时间（例如 2026-10-01T09:00:00+08:00）');if(at)act(async()=>{await api('publish',{resource,id:r.id,scheduledAt:at});setNotice('定时发布已安排');});}}>定时</button><button onClick={()=>act(async()=>{await api('publish',{resource,id:r.id,action:'unpublish'});setNotice('下线任务已入队');})}>下线</button></>}{resource==='publish_jobs'&&['pending','retrying','failed','cancelled'].includes(r.status)&&<button onClick={()=>act(()=>api('jobs',{id:r.id,action:['failed','cancelled'].includes(r.status)?'retry':'cancel'}))}>{['failed','cancelled'].includes(r.status)?'重试':'取消'}</button>}{resource==='content_revisions'&&<button onClick={()=>{if(confirm('恢复为草稿？公开版本将在重新发布后更新。'))act(()=>api('restore',{id:r.id}));}}>恢复版本</button>}{active.writable&&<button className="danger" onClick={()=>{if(confirm('确认删除这条记录？内容和产品将归档并排队下线。'))act(()=>api('records?resource='+resource,{key:recordKey(r)},'DELETE'));}}>删除</button>}</td></tr>)}</tbody></table>{!listing.rows.length&&<div className="empty">还没有记录。添加内容后，即可在这里管理。</div>}</div><div className="pagination"><span>共 {listing.total} 条</span><button disabled={page<=1} onClick={()=>setPage(x=>x-1)}>上一页</button><span>{page}</span><button disabled={page*listing.limit>=listing.total} onClick={()=>setPage(x=>x+1)}>下一页</button></div></>}
 </>}
 </main>{draft&&listing&&<div className="modal-backdrop" onClick={()=>setDraft(null)}><section className="editor" role="dialog" aria-modal="true" aria-label={active.label} onClick={e=>e.stopPropagation()}><header><h2>{editing?'编辑':'新建'} · {active.label}</h2><button onClick={()=>setDraft(null)} aria-label="关闭编辑器">×</button></header><form onSubmit={e=>{e.preventDefault();submit();}}><div className="fields">{listing.columns.filter((c:Row)=>!c.readonly).map((c:Row)=><label key={c.name}><span>{labels[c.name]||c.name}{!c.nullable&&!c.default?' *':''}</span>{c.type==='jsonb'&&(c.name==='body'||(resource==='content_blocks'&&c.name==='data'))?<BlockEditor value={draft[c.name]} singleType={resource==='content_blocks'?draft.block_type||'rich_text':undefined} onChange={v=>setDraft({...draft,[c.name]:v})}/>:c.type==='boolean'?<input type="checkbox" checked={!!draft[c.name]} onChange={e=>setDraft({...draft,[c.name]:e.target.checked})}/>:c.options?<select value={draft[c.name]??''} onChange={e=>setDraft({...draft,[c.name]:e.target.value})}><option value="">请选择</option>{c.options.filter((x:string)=>!['content_item_translations','product_translations','content_items'].includes(resource)||!['published','scheduled'].includes(x)||!['status','publish_status'].includes(c.name)).map((x:string)=><option key={x}>{x}</option>)}</select>:c.reference&&lookups[c.reference]?<><select value={draft[c.name]??''} onChange={e=>setDraft({...draft,[c.name]:e.target.value})}><option value="">请选择关联记录</option>{lookups[c.reference].map((r:Row)=><option key={r.id} value={r.id}>{r.name||r.title||r.code||r.email||r.question||r.original_filename||r.id}</option>)}</select><input aria-label="手动填写关联 UUID" value={draft[c.name]??''} placeholder="也可直接填写 UUID" onChange={e=>setDraft({...draft,[c.name]:e.target.value})}/></>:c.type==='jsonb'||['description','answer','message','excerpt','short_answer','definition','company_description'].includes(c.name)?<textarea rows={c.type==='jsonb'?9:4} spellCheck={c.type!=='jsonb'} value={draft[c.name]??''} onChange={e=>setDraft({...draft,[c.name]:e.target.value})}/>:<input type={c.type==='timestamp with time zone'?'text':c.type==='integer'||c.type==='numeric'?'number':'text'} step="any" value={draft[c.name]??''} onChange={e=>setDraft({...draft,[c.name]:e.target.value})}/>}<small>{c.type==='jsonb'?'使用有效 JSON。页面区块示例见下方帮助。':c.reference?'关联 '+(meta.resources.find((r:Row)=>r.table===c.reference)?.label||c.reference):c.name==='path'?'完整路径示例：/en/products/beaker。不同内容类型共享 URL 唯一约束。':c.name.includes('_at')?'ISO 时间，例如 2026-10-01T09:00:00+08:00':''}</small></label>)}</div><details><summary>页面区块格式帮助</summary><pre>{JSON.stringify([{type:'rich_text',data:{title:'Section title',text:'Your content'}},{type:'feature_grid',data:{title:'Features',items:[{title:'Precision',text:'Details'}]}},{type:'cta',data:{title:'Talk to our team',label:'Contact',url:'/en/contact'}}],null,2)}</pre><p>支持 Hero、图文、产品列表、特性、参数、FAQ、对比表、下载、视频、统计、时间线、客户评价和询盘区块。</p></details><footer><button type="button" onClick={()=>setDraft(null)}>关闭</button>{active.writable&&<button className="primary" disabled={busy}>{busy?'保存中…':'保存草稿'}</button>}</footer></form></section></div>}</div>;
}

````

## apps/cms/src/app/(payload)/admin/[[...segments]]/not-found.tsx

````tsx
import { NotFoundPage, generatePageMetadata } from "@payloadcms/next/views";
import config from "@payload-config";
type Args = { params: Promise<{ segments: string[] }>; searchParams: Promise<Record<string, string | string[]>> };
export const generateMetadata = ({ params, searchParams }: Args) => generatePageMetadata({ config, params, searchParams });
import { importMap } from "../importMap";
export default function NotFound({ params, searchParams }: Args) { return NotFoundPage({ config, params, searchParams, importMap }); }

````

## apps/cms/src/app/(payload)/admin/[[...segments]]/page.tsx

````tsx
import { RootPage, generatePageMetadata } from "@payloadcms/next/views";
import config from "@payload-config";
import { importMap } from "../importMap";
type Args = { params: Promise<{ segments: string[] }>; searchParams: Promise<Record<string, string | string[]>> };
export const generateMetadata = ({ params, searchParams }: Args) => generatePageMetadata({ config, params, searchParams });
export default function Page({ params, searchParams }: Args) { return RootPage({ config, params, searchParams, importMap }); }

````

## apps/cms/src/app/(payload)/admin/importMap.js

````js
import { default as default_7ce9212702fcc354ab26bf4bcea4d8b0 } from '../../../components/ManageLink'
import { CollectionCards as CollectionCards_f9c02e79a4aed9a3924487c0cd4cafb1 } from '@payloadcms/next/rsc'

/** @type import('payload').ImportMap */
export const importMap = {
  "./components/ManageLink#default": default_7ce9212702fcc354ab26bf4bcea4d8b0,
  "@payloadcms/next/rsc#CollectionCards": CollectionCards_f9c02e79a4aed9a3924487c0cd4cafb1
}

````

## apps/cms/src/app/(payload)/admin/importMap.ts

````ts
/** @type {import("payload").ImportMap} */
export const importMap = {};

````

## apps/cms/src/app/(payload)/api/[...slug]/route.ts

````ts
import config from "@payload-config";
import { REST_DELETE, REST_GET, REST_OPTIONS, REST_PATCH, REST_POST, REST_PUT } from "@payloadcms/next/routes";
export const GET = REST_GET(config); export const POST = REST_POST(config); export const DELETE = REST_DELETE(config);
export const PATCH = REST_PATCH(config); export const PUT = REST_PUT(config); export const OPTIONS = REST_OPTIONS(config);

````

## apps/cms/src/app/(payload)/api/v1/[...path]/route.ts

````ts
import { handle } from '../../../../../server/api';
export const runtime='nodejs';
export const dynamic='force-dynamic';
export { handle as GET,handle as POST,handle as PATCH,handle as DELETE };

````

## apps/cms/src/app/(payload)/graphql/route.ts

````ts
import config from "@payload-config";
import { GRAPHQL_POST, GRAPHQL_PLAYGROUND_GET } from "@payloadcms/next/routes";
export const POST = GRAPHQL_POST(config); export const GET = GRAPHQL_PLAYGROUND_GET(config);

````

## apps/cms/src/app/(payload)/layout.tsx

````tsx
import config from "@payload-config";
import "@payloadcms/next/css";
import type { ServerFunctionClient } from "payload";
import { handleServerFunctions, RootLayout } from "@payloadcms/next/layouts";
import React from "react";
import { importMap } from "./admin/importMap";
const serverFunction: ServerFunctionClient = async function (args) {
  "use server";
  return handleServerFunctions({ ...args, config, importMap });
};
export default function PayloadLayout({ children }: { children: React.ReactNode }) {
  return <RootLayout config={config} importMap={importMap} serverFunction={serverFunction}>{children}</RootLayout>;
}

````

## apps/cms/src/app/(payload)/media/[...key]/route.ts

````ts
import path from 'node:path';
import { readFile,realpath } from 'node:fs/promises';
export const runtime='nodejs';
export async function GET(_request:Request,{params}:{params:Promise<{key:string[]}>}){
 const {key}=await params;const name=key.join('/');if(!/^[a-f0-9-]+(?:-(?:1920|1280|768|480))?\.(?:jpg|png|webp|avif|pdf|mp4)$/.test(name))return new Response('Not found',{status:404});
 try{const root=await realpath(/* turbopackIgnore: true */ path.resolve(/* turbopackIgnore: true */ process.env.MEDIA_DIR||'../../media'));const file=await realpath(/* turbopackIgnore: true */ path.join(root,name));if(!file.startsWith(root+path.sep))return new Response('Not found',{status:404});const types:Record<string,string>={jpg:'image/jpeg',png:'image/png',webp:'image/webp',avif:'image/avif',pdf:'application/pdf',mp4:'video/mp4'};return new Response(await readFile(/* turbopackIgnore: true */ file),{headers:{'Content-Type':types[name.split('.').pop()!],'X-Content-Type-Options':'nosniff','Cache-Control':'public,max-age=31536000,immutable'}});}catch{return new Response('Not found',{status:404});}
}

````

## apps/cms/src/collections/AdminUsers.ts

````ts
import type { CollectionConfig } from 'payload';
const admin=(user:any)=>['admin','super_admin'].includes(user?.role);
export const AdminUsers:CollectionConfig={
 slug:'cms-admin-users',auth:{maxLoginAttempts:5,lockTime:600000},admin:{useAsTitle:'email',group:'System'},
 access:{create:({req})=>admin(req.user),read:({req})=>admin(req.user)?true:req.user?{id:{equals:req.user.id}}:false,update:({req})=>admin(req.user)?true:req.user?{id:{equals:req.user.id}}:false,delete:({req,id})=>admin(req.user)&&String(id)!==String(req.user?.id)},
 hooks:{beforeChange:[async({data,operation,req})=>{if(operation==='create'){const {totalDocs}=await req.payload.count({collection:'cms-admin-users',overrideAccess:true,req});if(totalDocs===0)data.role='super_admin';else if(!admin(req.user))data.role='editor';}return data;}]},
 fields:[{name:'displayName',type:'text',required:true},{name:'role',type:'select',defaultValue:'editor',required:true,access:{update:({req})=>admin(req.user)},options:['super_admin','admin','editor','seo_manager','translator','reviewer']}],
};

````

## apps/cms/src/components/BlockEditor.tsx

````tsx
'use client';
type Data=Record<string,any>;
const types:Record<string,string>={rich_text:'正文',image_text:'图文',product_grid:'产品列表',category_grid:'分类列表',feature_grid:'特性列表',application_grid:'应用列表',case_studies:'案例',latest_articles:'文章列表',technical_specs:'参数表',comparison_table:'对比表',faq:'常见问题',statistics:'数据统计',timeline:'时间线',testimonials:'客户评价',downloads:'下载',video:'视频',cta:'行动按钮',contact_form:'询盘表单',hero_banner:'横幅'};
const itemFields:Record<string,string[]>={faq:['question','answer'],statistics:['value','label'],timeline:['year','text'],testimonials:['quote','author'],downloads:['title','url'],technical_specs:['name','value'],comparison_table:['name','value']};
const names:Record<string,string>={title:'标题',text:'正文',description:'说明',url:'链接 / 视频地址',label:'按钮文字',image:'图片地址',alt:'图片描述',question:'问题',answer:'回答',value:'数值',year:'年份',quote:'评价',author:'姓名',name:'名称',limit:'显示数量'};
export function BlockEditor({value,onChange,singleType}:{value:string;onChange:(value:string)=>void;singleType?:string}){
 let parsed:any;try{parsed=JSON.parse(value|| (singleType?'{}':'[]'));}catch{return <div><p>区块格式有误，请在高级编辑中修正。</p><textarea value={value} onChange={e=>onChange(e.target.value)}/></div>}
 const blocks:Data[]=singleType?[{type:singleType,data:parsed}]:Array.isArray(parsed)?parsed:[];
 function update(next:Data[]){onChange(JSON.stringify(singleType?next[0]?.data||{}:next,null,2));}
 function change(i:number,key:string,v:any){update(blocks.map((b,j)=>i===j?{...b,data:{...b.data,[key]:v}}:b));}
 return <div className="block-builder">{blocks.map((b,i)=>{const data=b.data||{};const fields=['title',...(['rich_text','image_text','hero_banner','cta','contact_form'].includes(b.type)?['text']:[]),...(['image_text','hero_banner'].includes(b.type)?['image','alt']:[]),...(['image_text','cta','hero_banner','video'].includes(b.type)?['url','label']:[]),...(['product_grid','latest_articles'].includes(b.type)?['limit']:[])];const listFields=itemFields[b.type]||(['feature_grid','category_grid','application_grid','case_studies'].includes(b.type)?['title','text','url','image']:undefined);return <section className="block-card" key={i}><header><strong>{types[b.type]||b.type}</strong>{!singleType&&<><button type="button" disabled={!i} onClick={()=>{const a=[...blocks];[a[i-1],a[i]]=[a[i],a[i-1]];update(a);}}>↑</button><button type="button" disabled={i===blocks.length-1} onClick={()=>{const a=[...blocks];[a[i+1],a[i]]=[a[i],a[i+1]];update(a);}}>↓</button><button type="button" onClick={()=>update(blocks.filter((_,j)=>j!==i))}>移除</button></>}</header>{fields.map(k=><div key={k}><span>{names[k]||k}</span>{k==='text'?<textarea value={data[k]||''} onChange={e=>change(i,k,e.target.value)} rows={5}/>:<input value={data[k]??''} onChange={e=>change(i,k,k==='limit'?Number(e.target.value):e.target.value)}/>}</div>)}{listFields&&<div>{(Array.isArray(data.items)?data.items:[]).map((item:Data,n:number)=><div className="block-item" key={n}>{listFields.map(k=><div key={k}><span>{names[k]||k}</span><input value={item[k]??''} onChange={e=>change(i,'items',data.items.map((x:Data,j:number)=>j===n?{...x,[k]:e.target.value}:x))}/></div>)}<button type="button" onClick={()=>change(i,'items',data.items.filter((_:Data,j:number)=>j!==n))}>移除此项</button></div>)}<button type="button" onClick={()=>change(i,'items',[...(data.items||[]),{}])}>＋ 添加条目</button></div>}{['product_grid','latest_articles'].includes(b.type)&&<small>列表留空时自动显示已发布内容。</small>}</section>})}{!singleType&&<select value="" aria-label="添加页面区块" onChange={e=>{if(e.target.value)update([...blocks,{type:e.target.value,data:{}}]);}}><option value="">＋ 添加区块</option>{Object.entries(types).map(([key,name])=><option value={key} key={key}>{name}</option>)}</select>}<details><summary>高级数据编辑</summary><textarea rows={8} value={value} onChange={e=>onChange(e.target.value)}/></details></div>;
}

````

## apps/cms/src/components/ManageLink.tsx

````tsx
export default function ManageLink(){return <a href="/manage" style={{display:'block',padding:'16px 0',fontWeight:600}}>业务管理 / Content workspace ↗</a>;}

````

## apps/cms/src/migrations/20260926_101317_initial_auth.ts

````ts
import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE SCHEMA IF NOT EXISTS "payload_internal";
   CREATE TYPE "payload_internal"."enum_cms_admin_users_role" AS ENUM('super_admin', 'admin', 'editor', 'seo_manager', 'translator', 'reviewer');
  CREATE TABLE "payload_internal"."cms_admin_users_sessions" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"created_at" timestamp(3) with time zone,
  	"expires_at" timestamp(3) with time zone NOT NULL
  );
  
  CREATE TABLE "payload_internal"."cms_admin_users" (
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"display_name" varchar NOT NULL,
  	"role" "payload_internal"."enum_cms_admin_users_role" DEFAULT 'editor' NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"email" varchar NOT NULL,
  	"reset_password_token" varchar,
  	"reset_password_expiration" timestamp(3) with time zone,
  	"salt" varchar,
  	"hash" varchar,
  	"reset_password_requested_at" timestamp(3) with time zone,
  	"login_attempts" numeric DEFAULT 0,
  	"lock_until" timestamp(3) with time zone
  );
  
  CREATE TABLE "payload_internal"."payload_kv" (
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"key" varchar NOT NULL,
  	"data" jsonb NOT NULL
  );
  
  CREATE TABLE "payload_internal"."payload_locked_documents" (
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"global_slug" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_internal"."payload_locked_documents_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" uuid NOT NULL,
  	"path" varchar NOT NULL,
  	"cms_admin_users_id" uuid
  );
  
  CREATE TABLE "payload_internal"."payload_preferences" (
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"key" varchar,
  	"value" jsonb,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_internal"."payload_preferences_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" uuid NOT NULL,
  	"path" varchar NOT NULL,
  	"cms_admin_users_id" uuid
  );
  
  CREATE TABLE "payload_internal"."payload_migrations" (
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"name" varchar,
  	"batch" numeric,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "payload_internal"."cms_admin_users_sessions" ADD CONSTRAINT "cms_admin_users_sessions_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload_internal"."cms_admin_users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_internal"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "payload_internal"."payload_locked_documents"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_internal"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_cms_admin_users_fk" FOREIGN KEY ("cms_admin_users_id") REFERENCES "payload_internal"."cms_admin_users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_internal"."payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "payload_internal"."payload_preferences"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_internal"."payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_cms_admin_users_fk" FOREIGN KEY ("cms_admin_users_id") REFERENCES "payload_internal"."cms_admin_users"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "cms_admin_users_sessions_order_idx" ON "payload_internal"."cms_admin_users_sessions" USING btree ("_order");
  CREATE INDEX "cms_admin_users_sessions_parent_id_idx" ON "payload_internal"."cms_admin_users_sessions" USING btree ("_parent_id");
  CREATE INDEX "cms_admin_users_updated_at_idx" ON "payload_internal"."cms_admin_users" USING btree ("updated_at");
  CREATE INDEX "cms_admin_users_created_at_idx" ON "payload_internal"."cms_admin_users" USING btree ("created_at");
  CREATE UNIQUE INDEX "cms_admin_users_email_idx" ON "payload_internal"."cms_admin_users" USING btree ("email");
  CREATE UNIQUE INDEX "payload_kv_key_idx" ON "payload_internal"."payload_kv" USING btree ("key");
  CREATE INDEX "payload_locked_documents_global_slug_idx" ON "payload_internal"."payload_locked_documents" USING btree ("global_slug");
  CREATE INDEX "payload_locked_documents_updated_at_idx" ON "payload_internal"."payload_locked_documents" USING btree ("updated_at");
  CREATE INDEX "payload_locked_documents_created_at_idx" ON "payload_internal"."payload_locked_documents" USING btree ("created_at");
  CREATE INDEX "payload_locked_documents_rels_order_idx" ON "payload_internal"."payload_locked_documents_rels" USING btree ("order");
  CREATE INDEX "payload_locked_documents_rels_parent_idx" ON "payload_internal"."payload_locked_documents_rels" USING btree ("parent_id");
  CREATE INDEX "payload_locked_documents_rels_path_idx" ON "payload_internal"."payload_locked_documents_rels" USING btree ("path");
  CREATE INDEX "payload_locked_documents_rels_cms_admin_users_id_idx" ON "payload_internal"."payload_locked_documents_rels" USING btree ("cms_admin_users_id");
  CREATE INDEX "payload_preferences_key_idx" ON "payload_internal"."payload_preferences" USING btree ("key");
  CREATE INDEX "payload_preferences_updated_at_idx" ON "payload_internal"."payload_preferences" USING btree ("updated_at");
  CREATE INDEX "payload_preferences_created_at_idx" ON "payload_internal"."payload_preferences" USING btree ("created_at");
  CREATE INDEX "payload_preferences_rels_order_idx" ON "payload_internal"."payload_preferences_rels" USING btree ("order");
  CREATE INDEX "payload_preferences_rels_parent_idx" ON "payload_internal"."payload_preferences_rels" USING btree ("parent_id");
  CREATE INDEX "payload_preferences_rels_path_idx" ON "payload_internal"."payload_preferences_rels" USING btree ("path");
  CREATE INDEX "payload_preferences_rels_cms_admin_users_id_idx" ON "payload_internal"."payload_preferences_rels" USING btree ("cms_admin_users_id");
  CREATE INDEX "payload_migrations_updated_at_idx" ON "payload_internal"."payload_migrations" USING btree ("updated_at");
  CREATE INDEX "payload_migrations_created_at_idx" ON "payload_internal"."payload_migrations" USING btree ("created_at");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "payload_internal"."cms_admin_users_sessions" CASCADE;
  DROP TABLE "payload_internal"."cms_admin_users" CASCADE;
  DROP TABLE "payload_internal"."payload_kv" CASCADE;
  DROP TABLE "payload_internal"."payload_locked_documents" CASCADE;
  DROP TABLE "payload_internal"."payload_locked_documents_rels" CASCADE;
  DROP TABLE "payload_internal"."payload_preferences" CASCADE;
  DROP TABLE "payload_internal"."payload_preferences_rels" CASCADE;
  DROP TABLE "payload_internal"."payload_migrations" CASCADE;
  DROP TYPE "payload_internal"."enum_cms_admin_users_role";`)
}

````

## apps/cms/src/migrations/index.ts

````ts
import * as migration_20260926_101317_initial_auth from './20260926_101317_initial_auth';

export const migrations = [
  {
    up: migration_20260926_101317_initial_auth.up,
    down: migration_20260926_101317_initial_auth.down,
    name: '20260926_101317_initial_auth'
  },
];

````

## apps/cms/src/payload.config.ts

````ts
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

````

## apps/cms/src/server/api.ts

````ts
import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import { query,transaction,serviceForVisitor,resources,canRead,canWrite,list,save,remove,restoreRevision,requestPublish,rebuildSite,jobAction,siteContext,released,DomainError,assetURL,type Row } from '@suns/domain';
import { actorFor,checkOrigin } from './auth';
import { uploadMedia } from './media';

const response=(data:unknown,status=200)=>Response.json(data,{status,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
async function json(request:Request){const raw=await boundedBody(request,2_000_000);try{return JSON.parse(new TextDecoder().decode(raw));}catch{throw new DomainError('无效 JSON');}}
export async function boundedBody(request:Request,limit:number){const reader=request.body?.getReader();if(!reader)throw new DomainError('请求正文不能为空');const chunks:Uint8Array[]=[];let total=0;for(;;){const {value,done}=await reader.read();if(done)break;total+=value.byteLength;if(total>limit){await reader.cancel();throw new DomainError('请求过大',413);}chunks.push(value);}const b=new Uint8Array(total);let offset=0;for(const c of chunks){b.set(c,offset);offset+=c.length;}return b;}
let proxyWarningIssued=false;
// Forwarded headers are trustworthy only when the operator declares a proxy in front (TRUST_PROXY=1).
// Otherwise every visitor deliberately shares one bucket: trusting a client-supplied header would let anyone bypass rate limits.
function clientIP(request:Request){
 if(process.env.TRUST_PROXY!=='1'){if(process.env.DEPLOYMENT_ENV==='production'&&!proxyWarningIssued){proxyWarningIssued=true;console.warn('[rate-limit] TRUST_PROXY is not "1": all visitors share one bucket. Set TRUST_PROXY=1 behind a proxy that overwrites X-Real-IP.');}return 'local';}
 const real=(request.headers.get('x-real-ip')||'').trim();if(real)return real;
 return (request.headers.get('x-forwarded-for')||'').split(',')[0]?.trim()||'unknown';
}
async function rateLimit(request:Request,name:string,max:number){const rows=await query(`INSERT INTO api_rate_limits(key,window_start,count) VALUES($1,now(),1) ON CONFLICT(key) DO UPDATE SET count=CASE WHEN api_rate_limits.window_start<now()-interval '1 minute' THEN 1 ELSE api_rate_limits.count+1 END,window_start=CASE WHEN api_rate_limits.window_start<now()-interval '1 minute' THEN now() ELSE api_rate_limits.window_start END RETURNING count`,[name+':'+clientIP(request)]);if(rows[0].count>max)throw new DomainError('请求过于频繁，请稍后重试',429);}
const inquirySchema=z.object({key:z.string().uuid(),locale:z.string().min(2).max(10),name:z.string().trim().min(1).max(160),email:z.string().email().max(254),company:z.string().max(200).optional(),phone:z.string().max(80).optional(),country:z.string().max(80).optional(),message:z.string().trim().min(5).max(10000),inquiry_type:z.enum(['contact','rfq','product','sample','distributor']).default('contact'),website:z.string().max(200).optional(),source_url:z.string().max(2000).optional(),consent:z.literal(true),items:z.array(z.object({product_id:z.string().uuid(),quantity:z.number().positive().max(1e9)})).max(50).optional(),utm_source:z.string().max(200).optional(),utm_medium:z.string().max(200).optional(),utm_campaign:z.string().max(200).optional(),utm_term:z.string().max(200).optional(),utm_content:z.string().max(200).optional()});
async function publicApi(request:Request,parts:string[],url:URL):Promise<Response|undefined>{
 const action=parts[0];const locale=url.searchParams.get('locale')||'en';
 if(request.method==='GET'&&action==='service'){const l=(await query('SELECT id FROM locales WHERE code=$1 AND is_enabled',[locale]))[0];if(!l)return response({channels:[]});const country=(url.searchParams.get('country')||(process.env.TRUST_PROXY==='1'?request.headers.get('cf-ipcountry'):'')||'').toUpperCase();const ctx=await siteContext(l.id);return response({channels:serviceForVisitor(ctx.channels,/^[A-Z]{2}$/.test(country)?country:'')});}
 if(request.method==='GET'&&action==='health'){await query('SELECT 1');return response({ok:true});}
 if(request.method==='GET'&&action==='document'){const doc=await released(url.searchParams.get('path')||'');return doc?response(doc):response({error:'页面尚未发布'},404);}
 if(request.method==='GET'&&action==='catalog'){
  const type=url.searchParams.get('kind')==='products'?'product_translations':'content_item_translations';const page=Math.max(1,Number(url.searchParams.get('page'))||1);
  const rows=await query(`SELECT route,snapshot->>'title' AS title,snapshot->>'description' AS description,snapshot->'media' AS media FROM published_documents WHERE locale_id=(SELECT id FROM locales WHERE code=$1 AND is_enabled) AND entity_type=$2 ORDER BY published_at DESC LIMIT 24 OFFSET $3`,[locale,type,(page-1)*24]);return response({rows,page});
 }
 if(request.method==='GET'&&action==='search'){
  await rateLimit(request,'search',90);const term=(url.searchParams.get('q')||'').slice(0,150);const rows=term.trim()?await query(`SELECT route,snapshot->>'title' AS title,snapshot->>'description' AS description FROM published_documents WHERE locale_id=(SELECT id FROM locales WHERE code=$1 AND is_enabled) AND to_tsvector('simple',coalesce(snapshot->>'title','')||' '||coalesce(snapshot->>'description','')) @@ plainto_tsquery('simple',$2) ORDER BY published_at DESC LIMIT 30`,[locale,term]):[];return response({rows});
 }
 if(request.method==='GET'&&action==='resolve'){
  const path=(url.searchParams.get('path')||'').replace(/\/$/,'');const r=(await query('UPDATE redirects SET hit_count=hit_count+1,last_hit_at=now() WHERE source_path=$1 AND is_enabled RETURNING target_url,redirect_type',[path]))[0];return r?new Response(null,{status:r.redirect_type,headers:{Location:r.target_url}}):new Response('Not found',{status:404});
 }
 if(request.method==='POST'&&action==='inquiries'){
  checkOrigin(request);await rateLimit(request,'inquiry',6);const data=inquirySchema.parse(await json(request));if(data.website)return response({ok:true});
  const result=await transaction(async c=>{
   await c.query('SELECT pg_advisory_xact_lock(hashtext($1))',[data.key]);const existing=(await c.query('SELECT i.inquiry_number FROM public_submissions s JOIN inquiries i ON i.id=s.inquiry_id WHERE s.key=$1',[data.key])).rows[0];if(existing)return existing;
   const l=(await c.query('SELECT id FROM locales WHERE code=$1 AND is_enabled',[data.locale])).rows[0];if(!l)throw new DomainError('Unsupported locale');
   const number='RFQ-'+new Date().toISOString().slice(0,10).replaceAll('-','')+'-'+randomUUID().slice(0,8).toUpperCase();
   const item=(await c.query(`INSERT INTO inquiries(inquiry_number,inquiry_type,name,email,company,phone,country,locale_id,message,source_url,utm_source,utm_medium,utm_campaign,utm_term,utm_content,consent_at) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,now()) RETURNING id,inquiry_number`,[number,data.inquiry_type,data.name,data.email,data.company,data.phone,data.country,l.id,data.message,data.source_url,data.utm_source,data.utm_medium,data.utm_campaign,data.utm_term,data.utm_content])).rows[0];
   for(const entry of data.items||[]){const p=(await c.query(`SELECT p.sku,p.id,t.name FROM products p JOIN product_translations t ON t.product_id=p.id AND t.locale_id=$2 JOIN published_documents d ON d.entity_id=t.id AND d.entity_type='product_translations' WHERE p.id=$1 AND p.deleted_at IS NULL`,[entry.product_id,l.id])).rows[0];if(!p)throw new DomainError('Product is unavailable');await c.query(`INSERT INTO inquiry_items(inquiry_id,product_id,product_name_snapshot,sku_snapshot,quantity) VALUES($1,$2,$3,$4,$5)`,[item.id,p.id,p.name,p.sku,entry.quantity]);}
   await c.query('INSERT INTO public_submissions(key,inquiry_id) VALUES($1,$2)',[data.key,item.id]);return item;
  });return response({ok:true,inquiry_number:result.inquiry_number},201);
 }
 if(request.method==='GET'&&action==='download'){
  await rateLimit(request,'download',60);const id=z.string().uuid().parse(parts[1]);const m=(await query(`SELECT * FROM media_assets WHERE id=$1 AND deleted_at IS NULL AND EXISTS(SELECT 1 FROM published_documents WHERE snapshot->'documents' @> jsonb_build_array(jsonb_build_object('media_id',$1::text)))`,[id]))[0];if(!m)throw new DomainError('File not found',404);await query(`INSERT INTO download_events(media_id,locale_id,source_url) VALUES($1,(SELECT id FROM locales WHERE code=$2),$3)`,[id,locale,request.headers.get('referer')?.slice(0,2000)]);return new Response(null,{status:302,headers:{Location:assetURL(m),'Cache-Control':'no-store'}});
 }
 if(action==='chat'&&request.method==='POST')return response({error:'AI chat is not enabled. Please use the contact form.'},501);
 return undefined;
}
export async function handle(request:Request,{params}:{params:Promise<{path:string[]}>}){
 try{
  const {path}=await params;const url=new URL(request.url);const publicResponse=await publicApi(request,path,url);if(publicResponse)return publicResponse;
  checkOrigin(request);const actor=await actorFor(request);const table=url.searchParams.get('resource')||'';
  if(path[0]==='meta')return response({actor,resources:resources.filter(r=>canRead(actor,r)).map(r=>({...r,writable:canWrite(actor,r)}))});
  if(path[0]==='dashboard'){const names=['content_items','products','media_assets','publish_jobs',...(['admin','super_admin'].includes(actor.role)?['inquiries']:[])];const counts:Row={};for(const t of names)counts[t]=(await query(`SELECT count(*)::int AS n FROM ${t}`))[0].n;return response({counts,jobs:await query('SELECT id,job_type,entity_type,status,error_message,created_at FROM publish_jobs ORDER BY created_at DESC LIMIT 8')});}
  if(path[0]==='records'){
   if(request.method==='GET'){const filter=url.searchParams.get('filter');return response(await list(actor,table,{page:Number(url.searchParams.get('page')),search:url.searchParams.get('search')||'',filter:filter?JSON.parse(filter):undefined}));}
   const body=await json(request);if(request.method==='POST'||request.method==='PATCH')return response(await save(actor,table,body.data,body.key),request.method==='POST'?201:200);if(request.method==='DELETE')return response(await remove(actor,table,body.key));
  }
  if(path[0]==='upload'&&request.method==='POST'){
   if(!canWrite(actor,resources.find(r=>r.table==='media_assets')!))throw new DomainError('没有上传权限',403);
   const bytes=await boundedBody(request,26*1024*1024);const copy=new Request(request.url,{method:'POST',headers:request.headers,body:bytes as any});const form=await copy.formData();const file=form.get('file');if(!(file instanceof File))throw new DomainError('请选择文件');return response(await uploadMedia(file,actor),201);
  }
  if(path[0]==='publish'&&request.method==='POST'){const b=await json(request);return response(b.resource==='site'?await rebuildSite(actor):await requestPublish(actor,b.resource,b.id,b.action,b.scheduledAt),202);}
  if(path[0]==='jobs'&&request.method==='POST'){const b=await json(request);return response(await jobAction(actor,b.id,b.action));}
  if(path[0]==='restore'&&request.method==='POST'){const b=await json(request);return response(await restoreRevision(actor,b.id));}
  return response({error:'Not found'},404);
 }catch(error:any){if(error instanceof DomainError)return response({error:error.message},error.status);if(error instanceof z.ZodError)return response({error:error.errors.map(e=>e.path.join('.')+': '+e.message).join('; ')},400);if(error.code==='23505')return response({error:'记录或 URL 已存在，请检查唯一字段'},409);if(['23503','23514','23502','22P02','22007','22003'].includes(error.code))return response({error:'字段格式、必填值或关联记录不符合数据约束'},400);console.error('API failure',error);return response({error:'服务暂时不可用，请联系管理员'},503);}
}

````

## apps/cms/src/server/auth.ts

````ts
import { getPayload } from 'payload';
import config from '../payload.config';
import { DomainError, ensureActor, query, type Actor } from '@suns/domain';
export async function actorFor(request:Request):Promise<Actor>{
 const payload=await getPayload({config});const {user}=await payload.auth({headers:request.headers});
 if(!user)throw new DomainError('请先登录',401);
 const actor:Actor={id:String(user.id),email:String(user.email),role:String(user.role||'editor'),displayName:String(user.displayName||user.email)};
 await ensureActor(actor);
 const record=(await query('SELECT status,deleted_at FROM users WHERE id=$1',[actor.id]))[0];if(record?.status!=='active'||record.deleted_at)throw new DomainError('账号已停用',403);
 actor.permissions=(await query('SELECT DISTINCT p.code FROM permissions p JOIN role_permissions rp ON rp.permission_id=p.id JOIN roles r ON r.id=rp.role_id WHERE r.code=$1 OR r.id IN(SELECT role_id FROM user_roles WHERE user_id=$2)',[actor.role,actor.id])).map(r=>r.code);return actor;
}
export function checkOrigin(request:Request){
 if(['GET','HEAD','OPTIONS'].includes(request.method))return;
 const origin=request.headers.get('origin');
 const allowed=[new URL(request.url).origin,...(process.env.CORS_ORIGINS||'http://localhost:3000,http://localhost:3001').split(',')];
 if(!origin || !allowed.includes(origin))throw new DomainError('请求来源未获许可',403);
}

````

## apps/cms/src/server/media.ts

````ts
import { randomUUID,createHash } from 'node:crypto';
import { mkdir,writeFile,unlink } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
import { S3Client,PutObjectCommand,DeleteObjectCommand } from '@aws-sdk/client-s3';
import { transaction,DomainError,type Actor } from '@suns/domain';
const formats:Record<string,string>={'image/jpeg':'jpg','image/png':'png','image/webp':'webp','image/avif':'avif','application/pdf':'pdf','video/mp4':'mp4'};
export async function uploadMedia(file:File,actor:Actor){
 const ext=formats[file.type];if(!ext||file.size>25*1024*1024||!file.size)throw new DomainError('仅支持 25MB 内的 JPG/PNG/WebP/AVIF/PDF/MP4');
 const bytes=Buffer.from(await file.arrayBuffer());const provider=process.env.STORAGE_PROVIDER||'local';const bucket=process.env.S3_BUCKET||'';
 const s3=provider==='local'?null:new S3Client({region:process.env.S3_REGION||'auto',endpoint:process.env.S3_ENDPOINT,forcePathStyle:process.env.S3_FORCE_PATH_STYLE==='true'});
 if(s3&&(!bucket||!process.env.MEDIA_PUBLIC_URL))throw new DomainError('对象存储尚未配置',503);
 const key=randomUUID()+'.'+ext;let width:number|undefined,height:number|undefined;
 if(file.type.startsWith('image/')){const meta=await sharp(bytes,{limitInputPixels:50_000_000}).metadata();width=meta.width;height=meta.height;if(!width||!height)throw new DomainError('无效图片');}
 if(ext==='pdf'&&bytes.subarray(0,5).toString()!=='%PDF-')throw new DomainError('无效 PDF');if(ext==='mp4'&&bytes.subarray(4,8).toString()!=='ftyp')throw new DomainError('无效 MP4');
 const saved:string[]=[];const put=async(name:string,data:Buffer,type:string)=>{if(s3)await s3.send(new PutObjectCommand({Bucket:bucket,Key:name,Body:data,ContentType:type}));else{const root=path.resolve(/* turbopackIgnore: true */ process.env.MEDIA_DIR||'../../media');await mkdir(root,{recursive:true});await writeFile(/* turbopackIgnore: true */ path.join(root,name),data,{flag:'wx'});}saved.push(name);};
 try{
  await put(key,bytes,file.type);const variants:any[]=[];
  if(width)for(const size of [1920,1280,768,480])for(const format of ['avif','webp'] as const){const name=key.split('.')[0]+'-'+size+'.'+format;const image=await sharp(bytes,{limitInputPixels:50_000_000}).rotate().resize({width:size,withoutEnlargement:true}).toFormat(format,{quality:75}).toBuffer({resolveWithObject:true});await put(name,image.data,'image/'+format);variants.push({name:size+'_'+format,key:name,format,width:image.info.width,height:image.info.height,size:image.data.length});}
  return await transaction(async c=>{const m=(await c.query(`INSERT INTO media_assets(storage_provider,bucket,object_key,original_filename,mime_type,file_size,width,height,sha256,created_by) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,[provider,bucket||null,key,file.name.slice(0,200),file.type,file.size,width,height,createHash('sha256').update(bytes).digest('hex'),actor.id])).rows[0];for(const v of variants)await c.query('INSERT INTO media_variants(media_id,variant_name,width,height,format,file_size,object_key) VALUES($1,$2,$3,$4,$5,$6,$7)',[m.id,v.name,v.width,v.height,v.format,v.size,v.key]);return m;});
 }catch(error){for(const key of saved){try{if(s3)await s3.send(new DeleteObjectCommand({Bucket:bucket,Key:key}));else await unlink(/* turbopackIgnore: true */ path.join(path.resolve(/* turbopackIgnore: true */ process.env.MEDIA_DIR||'../../media'),key));}catch{}}throw error;}
}

````

## apps/cms/tsconfig.json

````json
{"extends":"../../tsconfig.base.json","compilerOptions":{"jsx":"react-jsx","allowJs":true,"incremental":true,"plugins":[{"name":"next"}],"paths":{"@/*":["./src/*"],"@payload-config":["./src/payload.config.ts"]}},"include":["next-env.d.ts","**/*.ts","**/*.tsx",".next/types/**/*.ts"],"exclude":["node_modules"]}

````

## apps/web/next-env.d.ts

````ts
/// <reference types="next" />
/// <reference types="next/image-types/global" />
import "./.next/types/routes.d.ts";
import "./.next/types/root-params.d.ts";

// NOTE: This file should not be edited
// see https://nextjs.org/docs/app/api-reference/config/typescript for more information.

````

## apps/web/next.config.ts

````ts
import type {NextConfig} from 'next';
import {config as env} from 'dotenv';env({path:'../../.env'});
const config:NextConfig={reactStrictMode:true,transpilePackages:['@suns/ui','@suns/domain'],async rewrites(){const cms=process.env.CMS_INTERNAL_URL||'http://localhost:3001';return [{source:'/api/v1/:path*',destination:cms+'/api/v1/:path*'},{source:'/media/:path*',destination:cms+'/media/:path*'}];}};
export default config;

````

## apps/web/package.json

````json
{
  "name": "@suns/web",
  "private": true,
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "next dev -p 3000",
    "build": "next build",
    "start": "next start -p 3000",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "next": "16.3.6",
    "react": "^19.2.0",
    "react-dom": "^19.2.0",
    "tailwindcss": "^4.3.0",
    "@tailwindcss/postcss": "^4.3.0",
    "@suns/domain": "workspace:*",
    "@suns/ui": "workspace:*",
    "dotenv": "^16.6.1"
  },
  "devDependencies": {
    "typescript": "^5.9.2",
    "@types/react": "^19.1.13",
    "@types/react-dom": "^19.1.9"
  }
}

````

## apps/web/postcss.config.mjs

````javascript
export default { plugins: { "@tailwindcss/postcss": {} } };

````

## apps/web/src/app/[locale]/[...slug]/page.tsx

````tsx
import {getDocument,DocumentView,documentMetadata} from '../../../lib/document';
export const dynamic='force-dynamic';
type Props={params:Promise<{locale:string;slug:string[]}>};
async function load(params:Props['params']){const p=await params;return getDocument('/'+[p.locale,...p.slug].join('/'));}
export async function generateMetadata({params}:Props){return documentMetadata(await load(params));}
export default async function Page({params}:Props){return <DocumentView doc={await load(params)}/>}

````

## apps/web/src/app/[locale]/error.tsx

````tsx
'use client';
export default function ErrorPage({reset}:{reset:()=>void}){return <main style={{padding:'12vh 8vw'}}><h1>Temporarily unavailable</h1><p>Please try again shortly.</p><button onClick={reset}>Try again</button></main>}

````

## apps/web/src/app/[locale]/layout.tsx

````tsx
import type {ReactNode} from 'react';
import Script from 'next/script';
export default async function Layout({children,params}:{children:ReactNode;params:Promise<{locale:string}>}){const {locale}=await params;return <html lang={locale}><head><link rel="stylesheet" href="/assets/site.css"/></head><body>{children}<Script src="/assets/site.js" strategy="afterInteractive"/></body></html>}

````

## apps/web/src/app/[locale]/not-found.tsx

````tsx
export default function NotFound(){return <main style={{padding:'12vh 8vw'}}><p>404</p><h1>Page not found</h1><p>This page may not have been published yet.</p><a href="/">Return home</a></main>}

````

## apps/web/src/app/[locale]/page.tsx

````tsx
import {getDocument,DocumentView,documentMetadata} from '../../lib/document';
export const dynamic='force-dynamic';
type Props={params:Promise<{locale:string}>};
export async function generateMetadata({params}:Props){return documentMetadata(await getDocument('/'+(await params).locale));}
export default async function Page({params}:Props){return <DocumentView doc={await getDocument('/'+(await params).locale)}/>}

````

## apps/web/src/app/assets/site.css/route.ts

````ts
import {siteCSS} from '@suns/ui';
export function GET(){return new Response(siteCSS,{headers:{'Content-Type':'text/css; charset=utf-8','Cache-Control':'public, max-age=300'}})}

````

## apps/web/src/app/assets/site.js/route.ts

````ts
import {siteJS} from '@suns/ui';
export function GET(){return new Response(siteJS,{headers:{'Content-Type':'application/javascript; charset=utf-8','Cache-Control':'public, max-age=300'}})}

````

## apps/web/src/app/globals.css

````css
@import "tailwindcss";
:root { color-scheme: light; --ink: #162a36; --muted: #536872; --paper: #f5f7f6; --brand: #087e83; }
* { box-sizing: border-box; }
html { scroll-behavior: smooth; }
body { margin: 0; color: var(--ink); background: var(--paper); font-family: Arial, Helvetica, sans-serif; }
a { color: inherit; text-decoration: none; }

````

## apps/web/src/app/page.tsx

````tsx
import {redirect} from 'next/navigation';
export const dynamic='force-dynamic';
export default function Page(){redirect('/'+(process.env.DEFAULT_LOCALE||'en'));}

````

## apps/web/src/lib/document.tsx

````tsx
import {cache} from 'react';
import {notFound,permanentRedirect,redirect} from 'next/navigation';
import type {Metadata} from 'next';
import type {Document} from '@suns/domain/types';
import {bodyHTML,schemaFor} from '@suns/ui';
const cms=()=>process.env.CMS_INTERNAL_URL||'http://localhost:3001';
export const getDocument=cache(async(path:string):Promise<Document>=>{
 const r=await fetch(cms()+'/api/v1/document?path='+encodeURIComponent(path),{cache:'no-store',signal:AbortSignal.timeout(15000)});
 if(r.status===404){const rr=await fetch(cms()+'/api/v1/resolve?path='+encodeURIComponent(path),{redirect:'manual',cache:'no-store'});const to=rr.headers.get('location');if(to&&rr.status===301)permanentRedirect(to);if(to&&rr.status===302)redirect(to);notFound();}
 if(!r.ok)throw new Error('Content service unavailable');return r.json();
});
export function documentMetadata(d:Document):Metadata{
 const origin=d.site.primary_domain,title=d.seo.meta_title||d.title+' | '+d.site.site_name;
 return {verification:d.site.google_site_verification?{google:d.site.google_site_verification}:undefined,metadataBase:new URL(origin),title,description:d.seo.meta_description||d.description,alternates:{canonical:d.seo.canonical_url||d.route,languages:Object.fromEntries([...d.alternates.map(a=>[a.hreflang,a.path]),...d.alternates.filter(a=>a.locale===d.site.default_locale_code).map(a=>['x-default',a.path])])},robots:{index:d.site.enable_indexing!==false&&d.seo.robots_index!==false,follow:d.seo.robots_follow!==false},openGraph:{title:d.seo.og_title||d.title,description:d.seo.og_description||d.description,url:d.route,type:'website',images:d.seo.og_image_url||d.media[0]?.url?[{url:d.seo.og_image_url||d.media[0].url}]:[]},twitter:{card:'summary_large_image',title}};
}
export function DocumentView({doc}:{doc:Document}){return <><script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(schemaFor(doc)).replaceAll('<','\\u003c')}}/><div dangerouslySetInnerHTML={{__html:bodyHTML(doc)}}/></>}

````

## apps/web/tsconfig.json

````json
{"extends":"../../tsconfig.base.json","compilerOptions":{"jsx":"react-jsx","incremental":true,"plugins":[{"name":"next"}]},"include":["next-env.d.ts","**/*.ts","**/*.tsx",".next/types/**/*.ts"],"exclude":["node_modules"]}

````

## apps/worker/package.json

````json
{
  "name": "@suns/worker",
  "private": true,
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsc --noEmit",
    "start": "tsx src/index.ts",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "@suns/domain": "workspace:*",
    "@suns/publisher": "workspace:*",
    "bullmq": "^5.58.5",
    "ioredis": "^5.7.0",
    "dotenv": "^16.6.1",
    "tsx": "^4.20.5"
  },
  "devDependencies": {
    "typescript": "^5.9.2"
  }
}

````

## apps/worker/src/index.ts

````ts
import { config } from 'dotenv';
config({path:'../../.env'});
const {Worker,Queue}=await import('bullmq');
const {default:IORedis}=await import('ioredis');
const {query,pool}=await import('@suns/domain');
const {processPublishJob}=await import('@suns/publisher');
const connection=new IORedis(process.env.REDIS_URL||'redis://localhost:6379',{maxRetriesPerRequest:null});
const queue=new Queue('static-publish',{connection});
const worker=new Worker('static-publish',processPublishJob,{connection,concurrency:1,lockDuration:120000});
let running=false,closing=false;
async function dispatch(){if(running||closing)return;running=true;try{const tasks=await query(`SELECT * FROM publish_jobs WHERE status IN('pending','retrying','processing') AND attempt_count<max_attempts AND (scheduled_at IS NULL OR scheduled_at<=now()) ORDER BY priority DESC,created_at LIMIT 100`);for(const t of tasks){const existing=await queue.getJob(t.id);if(existing){const state=await existing.getState();if(state==='failed'||state==='completed'){if(t.status==='processing'&&Date.now()-new Date(t.updated_at).getTime()<600000)continue;await existing.remove();}else continue;}await queue.add(t.job_type,{jobId:t.id},{jobId:t.id,priority:Math.max(1,Math.min(2097152,1000000-t.priority)),attempts:Math.max(1,t.max_attempts-t.attempt_count),delay:Math.max(0,new Date(t.scheduled_at||0).getTime()-Date.now()),backoff:{type:'exponential',delay:5000},removeOnComplete:{age:86400,count:1000},removeOnFail:{age:604800,count:1000}});}
 await query("DELETE FROM api_rate_limits WHERE window_start<now()-interval '1 day'");
 }catch(error){console.error('Queue dispatch failed',error);}finally{running=false;}}
worker.on('completed',job=>console.info('Published',job.id));worker.on('failed',(job,error)=>{console.error('Publish failed',job?.id,error.message);if(job)query("UPDATE publish_jobs SET status=CASE WHEN attempt_count>=max_attempts THEN 'failed' ELSE 'retrying' END,error_message=$2,finished_at=now() WHERE id=$1 AND status='processing'",[job.data.jobId,error.message]).catch(console.error);});worker.on('error',error=>console.error('Worker error',error));
const timer=setInterval(dispatch,3000);await dispatch();console.info('Static publisher online');
async function shutdown(){if(closing)return;closing=true;clearInterval(timer);await worker.close();await queue.close();await connection.quit();await pool.end();process.exit(0);}
process.on('SIGINT',shutdown);process.on('SIGTERM',shutdown);

````

## apps/worker/tsconfig.json

````json
{"extends":"../../tsconfig.base.json","include":["src/**/*.ts"]}

````

## database/001_extensions.sql

````sql
-- PostgreSQL 16+. Run once against the target database.
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS citext;
CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE OR REPLACE FUNCTION set_updated_at() RETURNS trigger
LANGUAGE plpgsql AS $$ BEGIN NEW.updated_at := now(); RETURN NEW; END; $$;

````

## database/002_core_system.sql

````sql
CREATE TABLE locales (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), code varchar(10) NOT NULL UNIQUE,
 hreflang varchar(20) NOT NULL, name varchar(100) NOT NULL, native_name varchar(100) NOT NULL,
 direction varchar(3) NOT NULL DEFAULT 'ltr' CHECK(direction IN ('ltr','rtl')),
 is_default boolean NOT NULL DEFAULT false, is_enabled boolean NOT NULL DEFAULT true,
 sort_order integer NOT NULL DEFAULT 0, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX uq_locales_one_default ON locales(is_default) WHERE is_default;
CREATE TABLE users (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), email citext NOT NULL UNIQUE, password_hash text NOT NULL,
 first_name text, last_name text, display_name text, avatar_media_id uuid,
 status text NOT NULL DEFAULT 'active' CHECK(status IN ('active','disabled','locked')),
 last_login_at timestamptz, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), deleted_at timestamptz
);
CREATE TABLE roles (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), code text NOT NULL UNIQUE, name text NOT NULL, description text, is_system boolean NOT NULL DEFAULT false, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE permissions (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), code text NOT NULL UNIQUE, name text NOT NULL, module text NOT NULL, description text);
CREATE TABLE user_roles (user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE, role_id uuid NOT NULL REFERENCES roles(id) ON DELETE CASCADE, PRIMARY KEY(user_id,role_id));
CREATE TABLE role_permissions (role_id uuid NOT NULL REFERENCES roles(id) ON DELETE CASCADE, permission_id uuid NOT NULL REFERENCES permissions(id) ON DELETE CASCADE, PRIMARY KEY(role_id,permission_id));
CREATE TABLE audit_logs (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid REFERENCES users(id) ON DELETE SET NULL, action text NOT NULL, entity_type text NOT NULL, entity_id uuid, locale_id uuid REFERENCES locales(id) ON DELETE SET NULL, old_data jsonb, new_data jsonb, ip_address inet, user_agent text, created_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE site_settings (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), singleton_key boolean NOT NULL DEFAULT true UNIQUE CHECK(singleton_key), site_name text NOT NULL, primary_domain text NOT NULL, default_locale_id uuid NOT NULL REFERENCES locales(id), logo_media_id uuid, favicon_media_id uuid, company_email citext, company_phone text, timezone text NOT NULL DEFAULT 'UTC', ga_measurement_id text, search_console_property text, enable_indexing boolean NOT NULL DEFAULT false, default_og_image_id uuid, settings_json jsonb NOT NULL DEFAULT '{}', created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE site_setting_translations (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), site_setting_id uuid NOT NULL REFERENCES site_settings(id) ON DELETE CASCADE, locale_id uuid NOT NULL REFERENCES locales(id), site_title text, company_name text, company_description text, footer_description text, customer_service_welcome text, copyright_text text, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), UNIQUE(site_setting_id,locale_id));

````

## database/003_content.sql

````sql
CREATE TABLE content_items (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), content_type text NOT NULL CHECK(content_type IN ('page','article','guide','case_study','application','solution','landing_page')), parent_id uuid REFERENCES content_items(id) ON DELETE SET NULL, template_key text, status text NOT NULL DEFAULT 'draft' CHECK(status IN ('draft','review','scheduled','published','archived')), sort_order integer NOT NULL DEFAULT 0, featured_media_id uuid, created_by uuid REFERENCES users(id) ON DELETE SET NULL, updated_by uuid REFERENCES users(id) ON DELETE SET NULL, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), deleted_at timestamptz);
CREATE TABLE content_item_translations (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), content_item_id uuid NOT NULL REFERENCES content_items(id) ON DELETE CASCADE, locale_id uuid NOT NULL REFERENCES locales(id), title text NOT NULL, slug text NOT NULL, path text NOT NULL, excerpt text, body jsonb NOT NULL DEFAULT '[]', status text NOT NULL DEFAULT 'draft' CHECK(status IN ('draft','review','scheduled','published','archived')), seo_id uuid, geo_profile_id uuid, schema_markup_id uuid, published_at timestamptz, scheduled_at timestamptz, last_generated_at timestamptz, search_vector tsvector NOT NULL DEFAULT ''::tsvector, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), deleted_at timestamptz, UNIQUE(content_item_id,locale_id));
CREATE TABLE content_blocks (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), content_translation_id uuid NOT NULL REFERENCES content_item_translations(id) ON DELETE CASCADE, block_type text NOT NULL, sort_order integer NOT NULL DEFAULT 0, anchor_id text, is_enabled boolean NOT NULL DEFAULT true, data jsonb NOT NULL DEFAULT '{}', created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE content_revisions (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), entity_type text NOT NULL, entity_id uuid NOT NULL, locale_id uuid REFERENCES locales(id) ON DELETE SET NULL, version_number integer NOT NULL CHECK(version_number>0), snapshot jsonb NOT NULL, created_by uuid REFERENCES users(id) ON DELETE SET NULL, created_at timestamptz NOT NULL DEFAULT now(), UNIQUE(entity_type,entity_id,locale_id,version_number));
CREATE TABLE taxonomies (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), code text NOT NULL UNIQUE, name text NOT NULL, description text, is_hierarchical boolean NOT NULL DEFAULT true, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE taxonomy_terms (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), taxonomy_id uuid NOT NULL REFERENCES taxonomies(id) ON DELETE CASCADE, parent_id uuid REFERENCES taxonomy_terms(id) ON DELETE SET NULL, code text NOT NULL, sort_order integer NOT NULL DEFAULT 0, is_enabled boolean NOT NULL DEFAULT true, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), deleted_at timestamptz, UNIQUE(taxonomy_id,code));
CREATE TABLE taxonomy_term_translations (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), term_id uuid NOT NULL REFERENCES taxonomy_terms(id) ON DELETE CASCADE, locale_id uuid NOT NULL REFERENCES locales(id), name text NOT NULL, slug text NOT NULL, path text NOT NULL, description text, seo_id uuid, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), UNIQUE(term_id,locale_id));
CREATE TABLE content_term_links (content_item_id uuid NOT NULL REFERENCES content_items(id) ON DELETE CASCADE, term_id uuid NOT NULL REFERENCES taxonomy_terms(id) ON DELETE CASCADE, sort_order integer NOT NULL DEFAULT 0, PRIMARY KEY(content_item_id,term_id));
CREATE TABLE faq_items (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), code text UNIQUE, status text NOT NULL DEFAULT 'draft' CHECK(status IN ('draft','published','archived')), sort_order integer NOT NULL DEFAULT 0, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), deleted_at timestamptz);
CREATE TABLE faq_item_translations (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), faq_id uuid NOT NULL REFERENCES faq_items(id) ON DELETE CASCADE, locale_id uuid NOT NULL REFERENCES locales(id), question text NOT NULL, answer text NOT NULL, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), UNIQUE(faq_id,locale_id));
CREATE TABLE content_faq_links (content_item_id uuid NOT NULL REFERENCES content_items(id) ON DELETE CASCADE, faq_id uuid NOT NULL REFERENCES faq_items(id) ON DELETE CASCADE, sort_order integer NOT NULL DEFAULT 0, PRIMARY KEY(content_item_id,faq_id));

````

## database/004_product.sql

````sql
CREATE TABLE products (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), sku text NOT NULL UNIQUE, model text, status text NOT NULL DEFAULT 'draft' CHECK(status IN ('draft','active','discontinued','archived')), brand text, material_code text, capacity_value numeric CHECK(capacity_value IS NULL OR capacity_value>=0), capacity_unit text, weight_value numeric CHECK(weight_value IS NULL OR weight_value>=0), weight_unit text, length_value numeric CHECK(length_value IS NULL OR length_value>=0), width_value numeric CHECK(width_value IS NULL OR width_value>=0), height_value numeric CHECK(height_value IS NULL OR height_value>=0), dimension_unit text, featured_media_id uuid, created_by uuid REFERENCES users(id) ON DELETE SET NULL, updated_by uuid REFERENCES users(id) ON DELETE SET NULL, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), deleted_at timestamptz);
CREATE TABLE product_translations (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE, locale_id uuid NOT NULL REFERENCES locales(id), name text NOT NULL, slug text NOT NULL, path text NOT NULL, short_description text, description text, features jsonb NOT NULL DEFAULT '[]', applications jsonb NOT NULL DEFAULT '[]', seo_id uuid, geo_profile_id uuid, schema_markup_id uuid, publish_status text NOT NULL DEFAULT 'draft' CHECK(publish_status IN ('draft','review','scheduled','published','archived')), published_at timestamptz, scheduled_at timestamptz, search_vector tsvector NOT NULL DEFAULT ''::tsvector, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), deleted_at timestamptz, UNIQUE(product_id,locale_id));
CREATE TABLE product_term_links (product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE, term_id uuid NOT NULL REFERENCES taxonomy_terms(id) ON DELETE CASCADE, is_primary boolean NOT NULL DEFAULT false, sort_order integer NOT NULL DEFAULT 0, PRIMARY KEY(product_id,term_id));
CREATE TABLE product_spec_definitions (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), code text NOT NULL UNIQUE, data_type text NOT NULL CHECK(data_type IN ('text','number','boolean','option')), unit_type text, sort_order integer NOT NULL DEFAULT 0, is_filterable boolean NOT NULL DEFAULT false, is_comparable boolean NOT NULL DEFAULT false, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE product_spec_definition_translations (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), spec_definition_id uuid NOT NULL REFERENCES product_spec_definitions(id) ON DELETE CASCADE, locale_id uuid NOT NULL REFERENCES locales(id), name text NOT NULL, description text, UNIQUE(spec_definition_id,locale_id));
CREATE TABLE product_spec_values (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE, spec_definition_id uuid NOT NULL REFERENCES product_spec_definitions(id) ON DELETE CASCADE, value_text text, value_number numeric, value_boolean boolean, unit text, sort_order integer NOT NULL DEFAULT 0, CHECK(num_nonnulls(value_text,value_number,value_boolean)<=1), UNIQUE(product_id,spec_definition_id));
CREATE TABLE product_media (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE, media_id uuid NOT NULL, media_role text NOT NULL CHECK(media_role IN ('main','gallery','diagram','certificate','application')), sort_order integer NOT NULL DEFAULT 0, UNIQUE(product_id,media_id,media_role));
CREATE TABLE product_documents (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE, media_id uuid NOT NULL, document_type text NOT NULL, locale_id uuid REFERENCES locales(id) ON DELETE SET NULL, title text, sort_order integer NOT NULL DEFAULT 0);
CREATE TABLE product_relations (product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE, related_product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE, relation_type text NOT NULL CHECK(relation_type IN ('related','alternative','accessory','replacement')), sort_order integer NOT NULL DEFAULT 0, PRIMARY KEY(product_id,related_product_id,relation_type), CHECK(product_id<>related_product_id));

````

## database/005_seo_geo.sql

````sql
CREATE TABLE seo_metadata (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), meta_title text, meta_description text, canonical_url text, robots_index boolean NOT NULL DEFAULT true, robots_follow boolean NOT NULL DEFAULT true, og_title text, og_description text, og_image_id uuid, twitter_title text, twitter_description text, twitter_image_id uuid, breadcrumb_title text, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE geo_profiles (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), entity_name text NOT NULL, entity_type text NOT NULL CHECK(entity_type IN ('product','technology','material','company','process','application')), short_answer text, definition text, expertise_summary text, author_id uuid REFERENCES users(id) ON DELETE SET NULL, reviewed_by uuid REFERENCES users(id) ON DELETE SET NULL, last_verified_at timestamptz, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), deleted_at timestamptz);
CREATE TABLE geo_key_facts (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), geo_profile_id uuid NOT NULL REFERENCES geo_profiles(id) ON DELETE CASCADE, fact_key text NOT NULL, fact_value text NOT NULL, source_type text, sort_order integer NOT NULL DEFAULT 0);
CREATE TABLE geo_references (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), geo_profile_id uuid NOT NULL REFERENCES geo_profiles(id) ON DELETE CASCADE, title text NOT NULL, source_url text, publisher text, published_at date, accessed_at date, notes text, sort_order integer NOT NULL DEFAULT 0, CHECK(source_url IS NULL OR source_url ~ '^https?://'));
CREATE TABLE schema_markup (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), schema_type text NOT NULL, auto_generated boolean NOT NULL DEFAULT true, schema_json jsonb NOT NULL DEFAULT '{}', override_json jsonb, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), CHECK(jsonb_typeof(schema_json)='object'), CHECK(override_json IS NULL OR jsonb_typeof(override_json)='object'));
ALTER TABLE content_item_translations ADD CONSTRAINT fk_content_translation_seo FOREIGN KEY(seo_id) REFERENCES seo_metadata(id) ON DELETE SET NULL;
ALTER TABLE content_item_translations ADD CONSTRAINT fk_content_translation_geo FOREIGN KEY(geo_profile_id) REFERENCES geo_profiles(id) ON DELETE SET NULL;
ALTER TABLE content_item_translations ADD CONSTRAINT fk_content_translation_schema FOREIGN KEY(schema_markup_id) REFERENCES schema_markup(id) ON DELETE SET NULL;
ALTER TABLE taxonomy_term_translations ADD CONSTRAINT fk_term_translation_seo FOREIGN KEY(seo_id) REFERENCES seo_metadata(id) ON DELETE SET NULL;
ALTER TABLE product_translations ADD CONSTRAINT fk_product_translation_seo FOREIGN KEY(seo_id) REFERENCES seo_metadata(id) ON DELETE SET NULL;
ALTER TABLE product_translations ADD CONSTRAINT fk_product_translation_geo FOREIGN KEY(geo_profile_id) REFERENCES geo_profiles(id) ON DELETE SET NULL;
ALTER TABLE product_translations ADD CONSTRAINT fk_product_translation_schema FOREIGN KEY(schema_markup_id) REFERENCES schema_markup(id) ON DELETE SET NULL;

````

## database/006_media_appearance.sql

````sql
CREATE TABLE media_assets (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), storage_provider text NOT NULL CHECK(storage_provider IN ('local','r2','s3')), bucket text, object_key text NOT NULL, original_filename text NOT NULL, mime_type text NOT NULL, file_size bigint NOT NULL CHECK(file_size>=0), width integer CHECK(width IS NULL OR width>0), height integer CHECK(height IS NULL OR height>0), sha256 char(64), created_by uuid REFERENCES users(id) ON DELETE SET NULL, created_at timestamptz NOT NULL DEFAULT now(), deleted_at timestamptz, UNIQUE(storage_provider,bucket,object_key));
CREATE TABLE media_variants (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), media_id uuid NOT NULL REFERENCES media_assets(id) ON DELETE CASCADE, variant_name text NOT NULL, width integer CHECK(width IS NULL OR width>0), height integer CHECK(height IS NULL OR height>0), format text NOT NULL, file_size bigint CHECK(file_size IS NULL OR file_size>=0), object_key text NOT NULL, created_at timestamptz NOT NULL DEFAULT now(), UNIQUE(media_id,variant_name));
CREATE TABLE media_asset_translations (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), media_id uuid NOT NULL REFERENCES media_assets(id) ON DELETE CASCADE, locale_id uuid NOT NULL REFERENCES locales(id), alt_text text, title text, caption text, UNIQUE(media_id,locale_id));
ALTER TABLE users ADD CONSTRAINT fk_users_avatar_media FOREIGN KEY(avatar_media_id) REFERENCES media_assets(id) ON DELETE SET NULL;
ALTER TABLE site_settings ADD CONSTRAINT fk_settings_logo FOREIGN KEY(logo_media_id) REFERENCES media_assets(id) ON DELETE SET NULL;
ALTER TABLE site_settings ADD CONSTRAINT fk_settings_favicon FOREIGN KEY(favicon_media_id) REFERENCES media_assets(id) ON DELETE SET NULL;
ALTER TABLE site_settings ADD CONSTRAINT fk_settings_og FOREIGN KEY(default_og_image_id) REFERENCES media_assets(id) ON DELETE SET NULL;
ALTER TABLE content_items ADD CONSTRAINT fk_content_featured_media FOREIGN KEY(featured_media_id) REFERENCES media_assets(id) ON DELETE SET NULL;
ALTER TABLE products ADD CONSTRAINT fk_products_featured_media FOREIGN KEY(featured_media_id) REFERENCES media_assets(id) ON DELETE SET NULL;
ALTER TABLE product_media ADD CONSTRAINT fk_product_media_asset FOREIGN KEY(media_id) REFERENCES media_assets(id) ON DELETE CASCADE;
ALTER TABLE product_documents ADD CONSTRAINT fk_product_document_media FOREIGN KEY(media_id) REFERENCES media_assets(id) ON DELETE CASCADE;
ALTER TABLE seo_metadata ADD CONSTRAINT fk_seo_og_media FOREIGN KEY(og_image_id) REFERENCES media_assets(id) ON DELETE SET NULL;
ALTER TABLE seo_metadata ADD CONSTRAINT fk_seo_twitter_media FOREIGN KEY(twitter_image_id) REFERENCES media_assets(id) ON DELETE SET NULL;
CREATE TABLE hero_slides (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), desktop_media_id uuid REFERENCES media_assets(id) ON DELETE SET NULL, mobile_media_id uuid REFERENCES media_assets(id) ON DELETE SET NULL, sort_order integer NOT NULL DEFAULT 0, duration_ms integer NOT NULL DEFAULT 5000 CHECK(duration_ms BETWEEN 1000 AND 60000), text_position text NOT NULL DEFAULT 'center' CHECK(text_position IN ('left','center','right')), overlay_opacity numeric(4,3) NOT NULL DEFAULT 0 CHECK(overlay_opacity BETWEEN 0 AND 1), is_enabled boolean NOT NULL DEFAULT true, start_at timestamptz, end_at timestamptz, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), CHECK(end_at IS NULL OR start_at IS NULL OR end_at>start_at));
CREATE TABLE hero_slide_translations (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), hero_slide_id uuid NOT NULL REFERENCES hero_slides(id) ON DELETE CASCADE, locale_id uuid NOT NULL REFERENCES locales(id), title text NOT NULL, subtitle text, description text, primary_button_text text, primary_button_url text, secondary_button_text text, secondary_button_url text, UNIQUE(hero_slide_id,locale_id));
CREATE TABLE menus (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), code text NOT NULL UNIQUE, location text NOT NULL, is_enabled boolean NOT NULL DEFAULT true, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE menu_items (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), menu_id uuid NOT NULL REFERENCES menus(id) ON DELETE CASCADE, parent_id uuid REFERENCES menu_items(id) ON DELETE CASCADE, link_type text NOT NULL CHECK(link_type IN ('custom','content','product','term')), linked_entity_type text, linked_entity_id uuid, custom_url text, target text NOT NULL DEFAULT '_self' CHECK(target IN ('_self','_blank')), sort_order integer NOT NULL DEFAULT 0, is_enabled boolean NOT NULL DEFAULT true, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), CHECK((link_type='custom' AND custom_url IS NOT NULL) OR link_type<>'custom'));
CREATE TABLE menu_item_translations (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), menu_item_id uuid NOT NULL REFERENCES menu_items(id) ON DELETE CASCADE, locale_id uuid NOT NULL REFERENCES locales(id), label text NOT NULL, custom_url_override text, UNIQUE(menu_item_id,locale_id));
CREATE TABLE customer_service_channels (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), channel_type text NOT NULL CHECK(channel_type IN ('ai_chat','whatsapp','wechat','line','messenger','email','phone','contact_form')), name text NOT NULL, icon_media_id uuid REFERENCES media_assets(id) ON DELETE SET NULL, config jsonb NOT NULL DEFAULT '{}', is_enabled boolean NOT NULL DEFAULT true, sort_order integer NOT NULL DEFAULT 0, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE customer_service_rules (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), channel_id uuid NOT NULL REFERENCES customer_service_channels(id) ON DELETE CASCADE, locale_id uuid REFERENCES locales(id) ON DELETE CASCADE, country_code char(2), welcome_text text, working_hours jsonb NOT NULL DEFAULT '{}', priority integer NOT NULL DEFAULT 0, is_enabled boolean NOT NULL DEFAULT true, CHECK(country_code IS NULL OR country_code ~ '^[A-Z]{2}$'));

````

## database/007_publishing.sql

````sql
CREATE TABLE publish_jobs (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), job_type text NOT NULL CHECK(job_type IN ('publish','unpublish','rebuild','sitemap','cdn_purge')), entity_type text NOT NULL, entity_id uuid, locale_id uuid REFERENCES locales(id) ON DELETE SET NULL, status text NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','processing','completed','failed','retrying','cancelled')), priority integer NOT NULL DEFAULT 0, attempt_count integer NOT NULL DEFAULT 0 CHECK(attempt_count>=0), max_attempts integer NOT NULL DEFAULT 5 CHECK(max_attempts>0), requested_by uuid REFERENCES users(id) ON DELETE SET NULL, scheduled_at timestamptz, started_at timestamptz, finished_at timestamptz, error_message text, metadata jsonb NOT NULL DEFAULT '{}', created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), CHECK(finished_at IS NULL OR started_at IS NULL OR finished_at>=started_at));
CREATE TABLE publish_job_routes (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), publish_job_id uuid NOT NULL REFERENCES publish_jobs(id) ON DELETE CASCADE, route text NOT NULL, action text NOT NULL CHECK(action IN ('generate','delete','purge')), status text NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','processing','completed','failed','skipped')), started_at timestamptz, finished_at timestamptz, error_message text, UNIQUE(publish_job_id,route,action));
CREATE TABLE static_routes (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), locale_id uuid REFERENCES locales(id) ON DELETE SET NULL, route text NOT NULL UNIQUE, entity_type text NOT NULL, entity_id uuid NOT NULL, output_path text NOT NULL UNIQUE, checksum text, etag text, status text NOT NULL DEFAULT 'active' CHECK(status IN ('active','stale','generating','failed','removed')), last_generated_at timestamptz, last_publish_job_id uuid REFERENCES publish_jobs(id) ON DELETE SET NULL, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), CHECK(route LIKE '/%'), CHECK(output_path !~ '(^|/)\.\.(/|$)'));
CREATE TABLE cdn_purge_logs (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), publish_job_id uuid REFERENCES publish_jobs(id) ON DELETE SET NULL, provider text NOT NULL, paths jsonb NOT NULL DEFAULT '[]', status text NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','completed','failed')), provider_response jsonb, created_at timestamptz NOT NULL DEFAULT now(), completed_at timestamptz);
CREATE TABLE sitemap_files (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), locale_id uuid REFERENCES locales(id) ON DELETE CASCADE, content_type text NOT NULL, file_path text NOT NULL UNIQUE, url_count integer NOT NULL DEFAULT 0 CHECK(url_count>=0), last_generated_at timestamptz, checksum text, status text NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','generating','completed','failed')), UNIQUE(locale_id,content_type));
CREATE TABLE redirects (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), locale_id uuid REFERENCES locales(id) ON DELETE SET NULL, source_path text NOT NULL, target_url text NOT NULL, redirect_type smallint NOT NULL DEFAULT 301 CHECK(redirect_type IN (301,302)), is_enabled boolean NOT NULL DEFAULT true, hit_count bigint NOT NULL DEFAULT 0 CHECK(hit_count>=0), last_hit_at timestamptz, created_by uuid REFERENCES users(id) ON DELETE SET NULL, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), UNIQUE(locale_id,source_path), CHECK(source_path LIKE '/%'), CHECK(target_url LIKE '/%' OR target_url ~ '^https?://'));
CREATE TABLE robots_rules (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), environment text NOT NULL CHECK(environment IN ('development','staging','production')), user_agent text NOT NULL DEFAULT '*', directive text NOT NULL CHECK(directive IN ('allow','disallow','sitemap')), path text NOT NULL, sort_order integer NOT NULL DEFAULT 0, is_enabled boolean NOT NULL DEFAULT true, created_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE translation_jobs (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), entity_type text NOT NULL, entity_id uuid NOT NULL, source_locale_id uuid NOT NULL REFERENCES locales(id), target_locale_id uuid NOT NULL REFERENCES locales(id), status text NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','processing','review','approved','failed')), provider text, requested_by uuid REFERENCES users(id) ON DELETE SET NULL, result_data jsonb, created_at timestamptz NOT NULL DEFAULT now(), started_at timestamptz, completed_at timestamptz, CHECK(source_locale_id<>target_locale_id));

````

## database/008_leads_integrations.sql

````sql
CREATE TABLE inquiries (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), inquiry_number text NOT NULL UNIQUE, inquiry_type text NOT NULL CHECK(inquiry_type IN ('contact','rfq','product','sample','distributor')), status text NOT NULL DEFAULT 'new' CHECK(status IN ('new','processing','qualified','replied','closed','spam')), name text NOT NULL, company text, email citext NOT NULL, phone text, country text, locale_id uuid REFERENCES locales(id) ON DELETE SET NULL, message text NOT NULL, source_url text, utm_source text, utm_medium text, utm_campaign text, utm_term text, utm_content text, ip_address inet, assigned_to uuid REFERENCES users(id) ON DELETE SET NULL, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), deleted_at timestamptz);
CREATE TABLE inquiry_items (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), inquiry_id uuid NOT NULL REFERENCES inquiries(id) ON DELETE CASCADE, product_id uuid REFERENCES products(id) ON DELETE SET NULL, product_name_snapshot text NOT NULL, sku_snapshot text, quantity numeric(14,3) NOT NULL DEFAULT 1 CHECK(quantity>0), unit text, notes text);
CREATE TABLE download_events (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), media_id uuid NOT NULL REFERENCES media_assets(id) ON DELETE RESTRICT, product_id uuid REFERENCES products(id) ON DELETE SET NULL, email citext, country text, locale_id uuid REFERENCES locales(id) ON DELETE SET NULL, source_url text, ip_address inet, created_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE integration_connections (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), provider text NOT NULL, connection_name text NOT NULL, status text NOT NULL DEFAULT 'disabled' CHECK(status IN ('active','disabled','error')), config jsonb NOT NULL DEFAULT '{}', secret_ref text, last_synced_at timestamptz, last_error text, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), UNIQUE(provider,connection_name));
CREATE TABLE integration_sync_logs (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), integration_id uuid NOT NULL REFERENCES integration_connections(id) ON DELETE CASCADE, sync_type text NOT NULL, status text NOT NULL CHECK(status IN ('running','completed','failed','partial')), started_at timestamptz NOT NULL DEFAULT now(), finished_at timestamptz, records_read integer NOT NULL DEFAULT 0 CHECK(records_read>=0), records_written integer NOT NULL DEFAULT 0 CHECK(records_written>=0), error_details jsonb, CHECK(finished_at IS NULL OR finished_at>=started_at));

````

## database/009_indexes_constraints.sql

````sql
-- Canonical path uniqueness is per locale and excludes soft-deleted records.
CREATE UNIQUE INDEX uq_content_locale_path_live ON content_item_translations(locale_id,path) WHERE deleted_at IS NULL;
CREATE UNIQUE INDEX uq_product_locale_path_live ON product_translations(locale_id,path) WHERE deleted_at IS NULL;
CREATE UNIQUE INDEX uq_term_locale_path_live ON taxonomy_term_translations(locale_id,path);
CREATE UNIQUE INDEX uq_redirect_locale_source_live ON redirects(COALESCE(locale_id,'00000000-0000-0000-0000-000000000000'::uuid),source_path);
CREATE INDEX ix_content_parent ON content_items(parent_id) WHERE deleted_at IS NULL;
CREATE INDEX ix_content_type_status ON content_items(content_type,status) WHERE deleted_at IS NULL;
CREATE INDEX ix_content_translation_schedule ON content_item_translations(status,scheduled_at) WHERE deleted_at IS NULL;
CREATE INDEX ix_content_search_vector ON content_item_translations USING gin(search_vector);
CREATE INDEX ix_content_title_trgm ON content_item_translations USING gin(title gin_trgm_ops);
CREATE INDEX ix_product_status ON products(status) WHERE deleted_at IS NULL;
CREATE INDEX ix_product_search_vector ON product_translations USING gin(search_vector);
CREATE INDEX ix_product_name_trgm ON product_translations USING gin(name gin_trgm_ops);
CREATE INDEX ix_product_specs_number ON product_spec_values(spec_definition_id,value_number) WHERE value_number IS NOT NULL;
CREATE INDEX ix_terms_parent ON taxonomy_terms(taxonomy_id,parent_id) WHERE deleted_at IS NULL;
CREATE INDEX ix_blocks_translation_order ON content_blocks(content_translation_id,sort_order) WHERE is_enabled;
CREATE INDEX ix_audit_entity ON audit_logs(entity_type,entity_id);
CREATE INDEX ix_audit_user_created ON audit_logs(user_id,created_at DESC);
CREATE INDEX ix_media_sha256 ON media_assets(sha256) WHERE sha256 IS NOT NULL;
CREATE INDEX ix_publish_queue ON publish_jobs(status,priority DESC,created_at) WHERE status IN ('pending','retrying');
CREATE INDEX ix_publish_scheduled ON publish_jobs(scheduled_at) WHERE status='pending' AND scheduled_at IS NOT NULL;
CREATE INDEX ix_publish_entity ON publish_jobs(entity_type,entity_id,created_at DESC);
CREATE INDEX ix_routes_entity ON static_routes(entity_type,entity_id);
CREATE INDEX ix_routes_status ON static_routes(status,updated_at);
CREATE INDEX ix_redirect_enabled_source ON redirects(source_path) WHERE is_enabled;
CREATE INDEX ix_inquiries_created ON inquiries(created_at DESC);
CREATE INDEX ix_inquiries_status_assigned ON inquiries(status,assigned_to,created_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX ix_inquiries_email ON inquiries(email);
CREATE INDEX ix_inquiry_items_product ON inquiry_items(product_id);
CREATE INDEX ix_download_media_created ON download_events(media_id,created_at DESC);
CREATE INDEX ix_geo_facts_profile ON geo_key_facts(geo_profile_id,sort_order);
CREATE INDEX ix_geo_refs_profile ON geo_references(geo_profile_id,sort_order);

-- Maintain searchable text vectors from human-readable content fields.
CREATE FUNCTION refresh_content_search_vector() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN NEW.search_vector := to_tsvector('simple', coalesce(NEW.title,'') || ' ' || coalesce(NEW.excerpt,'') || ' ' || coalesce(NEW.body::text,'')); RETURN NEW; END $$;
CREATE TRIGGER trg_content_search_vector BEFORE INSERT OR UPDATE OF title,excerpt,body ON content_item_translations FOR EACH ROW EXECUTE FUNCTION refresh_content_search_vector();
CREATE FUNCTION refresh_product_search_vector() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN NEW.search_vector := to_tsvector('simple', coalesce(NEW.name,'') || ' ' || coalesce(NEW.short_description,'') || ' ' || coalesce(NEW.description,'') || ' ' || coalesce(NEW.features::text,'') || ' ' || coalesce(NEW.applications::text,'')); RETURN NEW; END $$;
CREATE TRIGGER trg_product_search_vector BEFORE INSERT OR UPDATE OF name,short_description,description,features,applications ON product_translations FOR EACH ROW EXECUTE FUNCTION refresh_product_search_vector();

-- Preserve old public URLs as permanent redirects whenever an editor changes a path.
CREATE FUNCTION register_content_path_redirect() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF OLD.path IS DISTINCT FROM NEW.path
    AND OLD.deleted_at IS NULL
    AND ((TG_TABLE_NAME='content_item_translations' AND to_jsonb(OLD)->>'status'='published')
      OR (TG_TABLE_NAME='product_translations' AND to_jsonb(OLD)->>'publish_status'='published')) THEN
  UPDATE redirects SET target_url=NEW.path,redirect_type=301,is_enabled=true,updated_at=now()
  WHERE COALESCE(locale_id,'00000000-0000-0000-0000-000000000000'::uuid)=COALESCE(OLD.locale_id,'00000000-0000-0000-0000-000000000000'::uuid)
    AND source_path=OLD.path;
  IF NOT FOUND THEN
   INSERT INTO redirects(locale_id,source_path,target_url,redirect_type,is_enabled)
   VALUES(OLD.locale_id,OLD.path,NEW.path,301,true);
  END IF;
 END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER trg_content_path_redirect AFTER UPDATE OF path ON content_item_translations FOR EACH ROW EXECUTE FUNCTION register_content_path_redirect();
CREATE TRIGGER trg_product_path_redirect AFTER UPDATE OF path ON product_translations FOR EACH ROW EXECUTE FUNCTION register_content_path_redirect();

-- updated_at trigger on every table that has that column.
DO $$ DECLARE t text; BEGIN
 FOREACH t IN ARRAY ARRAY['locales','users','roles','site_settings','site_setting_translations','content_items','content_item_translations','content_blocks','taxonomies','taxonomy_terms','taxonomy_term_translations','faq_items','faq_item_translations','products','product_translations','product_spec_definitions','seo_metadata','geo_profiles','schema_markup','hero_slides','menus','menu_items','customer_service_channels','publish_jobs','static_routes','redirects','inquiries','integration_connections'] LOOP
  EXECUTE format('CREATE TRIGGER %I BEFORE UPDATE ON %I FOR EACH ROW EXECUTE FUNCTION set_updated_at()', 'trg_'||t||'_updated_at', t);
 END LOOP;
END $$;

````

## database/010_seed.sql

````sql
INSERT INTO locales(code,hreflang,name,native_name,direction,is_default,is_enabled,sort_order) VALUES
 ('en','en','English','English','ltr',true,true,1),('zh','zh-CN','Chinese','简体中文','ltr',false,true,2),('de','de','German','Deutsch','ltr',false,true,3),('fr','fr','French','Français','ltr',false,true,4),('es','es','Spanish','Español','ltr',false,true,5),('it','it','Italian','Italiano','ltr',false,true,6),('pt','pt','Portuguese','Português','ltr',false,true,7),('ja','ja','Japanese','日本語','ltr',false,true,8),('ko','ko','Korean','한국어','ltr',false,true,9)
ON CONFLICT(code) DO NOTHING;
INSERT INTO roles(code,name,description,is_system) VALUES
 ('super_admin','Super Administrator','Unrestricted administration',true),('admin','Administrator','System administration',true),('editor','Editor','Content editing',true),('seo_manager','SEO Manager','SEO and search settings',true),('translator','Translator','Localized content',true),('reviewer','Reviewer','Content review and approval',true)
ON CONFLICT(code) DO NOTHING;
INSERT INTO permissions(code,name,module) VALUES
 ('content.view','View content','content'),('content.create','Create content','content'),('content.edit','Edit content','content'),('content.publish','Publish content','content'),('product.edit','Edit products','product'),('product.publish','Publish products','product'),('seo.edit','Edit SEO','seo'),('translation.edit','Edit translations','translation'),('system.settings','Manage settings','system')
ON CONFLICT(code) DO NOTHING;
INSERT INTO taxonomies(code,name,is_hierarchical) VALUES ('article_category','Article Categories',true),('product_category','Product Categories',true),('tag','Tags',false),('industry','Industries',true),('material','Materials',true)
ON CONFLICT(code) DO NOTHING;
INSERT INTO menus(code,location,is_enabled) VALUES ('main_header','header',true),('mobile_menu','mobile',true),('footer_products','footer',true),('footer_company','footer',true)
ON CONFLICT(code) DO NOTHING;

````

## database/011_runtime.sql

````sql
-- Business runtime support. Auth lives in payload_internal; public.users contains audit identities.
CREATE TABLE published_documents (
 route text PRIMARY KEY, locale_id uuid NOT NULL REFERENCES locales(id), entity_type text NOT NULL,
 entity_id uuid NOT NULL, snapshot jsonb NOT NULL, published_at timestamptz NOT NULL DEFAULT now(),
 job_id uuid REFERENCES publish_jobs(id) ON DELETE SET NULL
);
CREATE INDEX ix_published_locale_type ON published_documents(locale_id,entity_type);
CREATE TABLE site_paths (
 path text PRIMARY KEY, locale_id uuid NOT NULL REFERENCES locales(id), entity_type text NOT NULL,
 entity_id uuid NOT NULL, UNIQUE(entity_type,entity_id)
);
CREATE TABLE api_rate_limits (key text PRIMARY KEY, window_start timestamptz NOT NULL, count integer NOT NULL CHECK(count>0));
CREATE TABLE public_submissions (key uuid PRIMARY KEY, inquiry_id uuid NOT NULL REFERENCES inquiries(id) ON DELETE CASCADE, created_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE runtime_settings (key text PRIMARY KEY, value jsonb NOT NULL DEFAULT '{}');
CREATE FUNCTION guard_site_path() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE locale_code text; old_path text;
BEGIN
 IF TG_OP='DELETE' THEN DELETE FROM site_paths WHERE entity_type=TG_TABLE_NAME AND entity_id=OLD.id; RETURN OLD; END IF;
 IF (to_jsonb(NEW)->>'deleted_at') IS NOT NULL THEN DELETE FROM site_paths WHERE entity_type=TG_TABLE_NAME AND entity_id=NEW.id; RETURN NEW; END IF;
 SELECT code INTO locale_code FROM locales WHERE id=NEW.locale_id;
 NEW.path := rtrim(NEW.path,'/');
 IF NEW.path !~ '^/[a-z0-9][a-z0-9/_-]*$' OR NEW.path LIKE '%//%' OR NOT (NEW.path='/'||locale_code OR NEW.path LIKE '/'||locale_code||'/%') THEN
  RAISE EXCEPTION 'Path must be a lowercase ASCII path under /%',locale_code USING ERRCODE='23514';
 END IF;
 IF EXISTS(SELECT 1 FROM redirects WHERE source_path=NEW.path AND is_enabled) THEN RAISE EXCEPTION 'Path is reserved by an enabled redirect' USING ERRCODE='23505'; END IF;
 DELETE FROM site_paths WHERE entity_type=TG_TABLE_NAME AND entity_id=NEW.id AND path<>NEW.path;
 INSERT INTO site_paths(path,locale_id,entity_type,entity_id) VALUES(NEW.path,NEW.locale_id,TG_TABLE_NAME,NEW.id)
 ON CONFLICT(entity_type,entity_id) DO UPDATE SET path=EXCLUDED.path,locale_id=EXCLUDED.locale_id;
 RETURN NEW;
END $$;
CREATE TRIGGER trg_content_site_path BEFORE INSERT OR UPDATE OR DELETE ON content_item_translations FOR EACH ROW EXECUTE FUNCTION guard_site_path();
CREATE TRIGGER trg_product_site_path BEFORE INSERT OR UPDATE OR DELETE ON product_translations FOR EACH ROW EXECUTE FUNCTION guard_site_path();
CREATE TRIGGER trg_taxonomy_site_path BEFORE INSERT OR UPDATE OR DELETE ON taxonomy_term_translations FOR EACH ROW EXECUTE FUNCTION guard_site_path();
INSERT INTO site_paths SELECT path,locale_id,'content_item_translations',id FROM content_item_translations WHERE deleted_at IS NULL;
INSERT INTO site_paths SELECT path,locale_id,'product_translations',id FROM product_translations WHERE deleted_at IS NULL;
INSERT INTO site_paths SELECT path,locale_id,'taxonomy_term_translations',id FROM taxonomy_term_translations;
CREATE FUNCTION guard_redirect() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE cursor_path text; visited text[]; n integer;
BEGIN
 IF NOT NEW.is_enabled THEN RETURN NEW; END IF;
 NEW.source_path:=rtrim(NEW.source_path,'/');
 IF NEW.source_path !~ '^/[a-z0-9][a-z0-9/_-]*$' THEN RAISE EXCEPTION 'Invalid redirect source' USING ERRCODE='23514'; END IF;
 IF EXISTS(SELECT 1 FROM site_paths WHERE path=NEW.source_path) THEN RAISE EXCEPTION 'Redirect source is a live content path' USING ERRCODE='23505'; END IF;
 IF NEW.target_url LIKE '//%' OR NEW.target_url ~ '[[:cntrl:]]' THEN RAISE EXCEPTION 'Invalid redirect target' USING ERRCODE='23514'; END IF;
 cursor_path:=rtrim(NEW.target_url,'/'); visited:=ARRAY[NEW.source_path];
 FOR n IN 1..32 LOOP
  IF cursor_path=ANY(visited) THEN RAISE EXCEPTION 'Redirect cycle' USING ERRCODE='23514'; END IF;
  visited:=array_append(visited,cursor_path);
  SELECT rtrim(target_url,'/') INTO cursor_path FROM redirects WHERE source_path=cursor_path AND is_enabled AND id<>NEW.id LIMIT 1;
  IF cursor_path IS NULL THEN RETURN NEW; END IF;
 END LOOP;
 RAISE EXCEPTION 'Redirect chain too long' USING ERRCODE='23514';
END $$;
CREATE TRIGGER trg_guard_redirect BEFORE INSERT OR UPDATE ON redirects FOR EACH ROW EXECUTE FUNCTION guard_redirect();
CREATE UNIQUE INDEX uq_redirect_source ON redirects(source_path);
CREATE UNIQUE INDEX uq_media_location ON media_assets(storage_provider,coalesce(bucket,''),object_key);
CREATE UNIQUE INDEX uq_revisions_null_locale ON content_revisions(entity_type,entity_id,version_number) WHERE locale_id IS NULL;
ALTER TABLE product_spec_values DROP CONSTRAINT product_spec_values_check;
ALTER TABLE product_spec_values ADD CONSTRAINT ck_spec_one_value CHECK(num_nonnulls(value_text,value_number,value_boolean)=1);
CREATE FUNCTION guard_spec_value() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE kind text;
BEGIN
 SELECT data_type INTO kind FROM product_spec_definitions WHERE id=NEW.spec_definition_id FOR SHARE;
 IF (kind IN ('text','option') AND NEW.value_text IS NULL) OR (kind='number' AND NEW.value_number IS NULL) OR (kind='boolean' AND NEW.value_boolean IS NULL) THEN RAISE EXCEPTION 'Specification value has wrong type' USING ERRCODE='23514'; END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER trg_spec_type BEFORE INSERT OR UPDATE ON product_spec_values FOR EACH ROW EXECUTE FUNCTION guard_spec_value();
CREATE FUNCTION guard_spec_definition() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN IF OLD.data_type<>NEW.data_type AND EXISTS(SELECT 1 FROM product_spec_values WHERE spec_definition_id=NEW.id) THEN RAISE EXCEPTION 'Cannot change a populated specification type' USING ERRCODE='23514'; END IF; RETURN NEW; END $$;
CREATE TRIGGER trg_spec_definition_type BEFORE UPDATE ON product_spec_definitions FOR EACH ROW EXECUTE FUNCTION guard_spec_definition();

````

## database/012_operational_defaults.sql

````sql
-- Additional runtime constraints, indexes and initial settings; no credentials or sample products.
CREATE INDEX ix_published_search ON published_documents USING gin(to_tsvector('simple',coalesce(snapshot->>'title','')||' '||coalesce(snapshot->>'description','')));
CREATE INDEX ix_published_documents_json ON published_documents USING gin(snapshot jsonb_path_ops);
CREATE INDEX ix_content_body_json ON content_item_translations USING gin(body jsonb_path_ops);
CREATE INDEX ix_rate_window ON api_rate_limits(window_start);
ALTER TABLE locales ADD CONSTRAINT ck_locale_code CHECK(code ~ '^[a-z]{2,3}(-[a-z0-9]{2,4})?$');
ALTER TABLE content_item_translations ADD CONSTRAINT ck_content_body_array CHECK(jsonb_typeof(body)='array');
ALTER TABLE content_blocks ADD CONSTRAINT ck_content_block_data CHECK(jsonb_typeof(data)='object');
ALTER TABLE product_translations ADD CONSTRAINT ck_features_array CHECK(jsonb_typeof(features)='array' AND jsonb_typeof(applications)='array');
ALTER TABLE inquiries ADD COLUMN consent_at timestamptz;
-- Every FK receives an index with its leading column(s), including low-volume admin relations.
DO $$ DECLARE r record; BEGIN
 FOR r IN SELECT c.conrelid::regclass AS tab,c.conname,string_agg(quote_ident(a.attname),',' ORDER BY u.n) AS cols FROM pg_constraint c CROSS JOIN LATERAL unnest(c.conkey) WITH ORDINALITY u(attnum,n) JOIN pg_attribute a ON a.attrelid=c.conrelid AND a.attnum=u.attnum JOIN pg_namespace ns ON ns.oid=c.connamespace WHERE c.contype='f' AND ns.nspname='public' GROUP BY c.conrelid,c.conname LOOP
  EXECUTE format('CREATE INDEX %I ON %s (%s)','ix_fk_'||substr(md5(r.tab::text||r.conname),1,20),r.tab,r.cols);
 END LOOP;
END $$;
INSERT INTO permissions(code,name,module)
 SELECT g||'.'||a,g||' '||a,g FROM unnest(ARRAY['content','product','seo','media','appearance','leads','publishing','translation','history','system']) g CROSS JOIN unnest(ARRAY['read','write']) a ON CONFLICT(code) DO NOTHING;
INSERT INTO role_permissions(role_id,permission_id)
 SELECT r.id,p.id FROM roles r CROSS JOIN permissions p WHERE
 r.code IN ('admin','super_admin') OR
 (r.code IN('editor','seo_manager','translator','reviewer') AND p.code LIKE '%.read' AND p.module NOT IN('system','leads','history')) OR
 (r.code='editor' AND p.code IN('content.write','product.write','media.write','appearance.write')) OR
 (r.code='seo_manager' AND p.code='seo.write') OR
 (r.code='translator' AND p.code='translation.write') OR
 (r.code='reviewer' AND p.code IN('publishing.write','history.read')) ON CONFLICT DO NOTHING;
INSERT INTO site_settings(id,site_name,primary_domain,default_locale_id,enable_indexing)
 SELECT '00000000-0000-4000-a000-000000000001','SUNS Glassware','http://localhost:3000',id,false FROM locales WHERE is_default ON CONFLICT DO NOTHING;
INSERT INTO publish_jobs(id,job_type,entity_type,metadata)
 VALUES('00000000-0000-4000-a000-000000000002','rebuild','site','{"reason":"Initial empty site"}');

````

## database/rollback/001_extensions.down.sql

````sql
-- Retain extensions: they may be shared with other schemas.
DROP FUNCTION IF EXISTS set_updated_at();

````

## database/rollback/002_core_system.down.sql

````sql
DROP TABLE IF EXISTS site_setting_translations;
DROP TABLE IF EXISTS site_settings;
DROP TABLE IF EXISTS audit_logs;
DROP TABLE IF EXISTS role_permissions;
DROP TABLE IF EXISTS user_roles;
DROP TABLE IF EXISTS permissions;
DROP TABLE IF EXISTS roles;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS locales;

````

## database/rollback/003_content.down.sql

````sql
DROP TABLE IF EXISTS content_faq_links;
DROP TABLE IF EXISTS faq_item_translations;
DROP TABLE IF EXISTS faq_items;
DROP TABLE IF EXISTS content_term_links;
DROP TABLE IF EXISTS taxonomy_term_translations;
DROP TABLE IF EXISTS taxonomy_terms;
DROP TABLE IF EXISTS taxonomies;
DROP TABLE IF EXISTS content_revisions;
DROP TABLE IF EXISTS content_blocks;
DROP TABLE IF EXISTS content_item_translations;
DROP TABLE IF EXISTS content_items;

````

## database/rollback/004_product.down.sql

````sql
DROP TABLE IF EXISTS product_relations;
DROP TABLE IF EXISTS product_documents;
DROP TABLE IF EXISTS product_media;
DROP TABLE IF EXISTS product_spec_values;
DROP TABLE IF EXISTS product_spec_definition_translations;
DROP TABLE IF EXISTS product_spec_definitions;
DROP TABLE IF EXISTS product_term_links;
DROP TABLE IF EXISTS product_translations;
DROP TABLE IF EXISTS products;

````

## database/rollback/005_seo_geo.down.sql

````sql
ALTER TABLE product_translations DROP CONSTRAINT IF EXISTS fk_product_translation_schema;
ALTER TABLE product_translations DROP CONSTRAINT IF EXISTS fk_product_translation_geo;
ALTER TABLE product_translations DROP CONSTRAINT IF EXISTS fk_product_translation_seo;
ALTER TABLE taxonomy_term_translations DROP CONSTRAINT IF EXISTS fk_term_translation_seo;
ALTER TABLE content_item_translations DROP CONSTRAINT IF EXISTS fk_content_translation_schema;
ALTER TABLE content_item_translations DROP CONSTRAINT IF EXISTS fk_content_translation_geo;
ALTER TABLE content_item_translations DROP CONSTRAINT IF EXISTS fk_content_translation_seo;
DROP TABLE IF EXISTS schema_markup;
DROP TABLE IF EXISTS geo_references;
DROP TABLE IF EXISTS geo_key_facts;
DROP TABLE IF EXISTS geo_profiles;
DROP TABLE IF EXISTS seo_metadata;

````

## database/rollback/006_media_appearance.down.sql

````sql
DROP TABLE IF EXISTS customer_service_rules;
DROP TABLE IF EXISTS customer_service_channels;
DROP TABLE IF EXISTS menu_item_translations;
DROP TABLE IF EXISTS menu_items;
DROP TABLE IF EXISTS menus;
DROP TABLE IF EXISTS hero_slide_translations;
DROP TABLE IF EXISTS hero_slides;
ALTER TABLE seo_metadata DROP CONSTRAINT IF EXISTS fk_seo_twitter_media;
ALTER TABLE seo_metadata DROP CONSTRAINT IF EXISTS fk_seo_og_media;
ALTER TABLE product_documents DROP CONSTRAINT IF EXISTS fk_product_document_media;
ALTER TABLE product_media DROP CONSTRAINT IF EXISTS fk_product_media_asset;
ALTER TABLE products DROP CONSTRAINT IF EXISTS fk_products_featured_media;
ALTER TABLE content_items DROP CONSTRAINT IF EXISTS fk_content_featured_media;
ALTER TABLE site_settings DROP CONSTRAINT IF EXISTS fk_settings_og;
ALTER TABLE site_settings DROP CONSTRAINT IF EXISTS fk_settings_favicon;
ALTER TABLE site_settings DROP CONSTRAINT IF EXISTS fk_settings_logo;
ALTER TABLE users DROP CONSTRAINT IF EXISTS fk_users_avatar_media;
DROP TABLE IF EXISTS media_asset_translations;
DROP TABLE IF EXISTS media_variants;
DROP TABLE IF EXISTS media_assets;

````

## database/rollback/007_publishing.down.sql

````sql
DROP TABLE IF EXISTS translation_jobs;
DROP TABLE IF EXISTS robots_rules;
DROP TABLE IF EXISTS redirects;
DROP TABLE IF EXISTS sitemap_files;
DROP TABLE IF EXISTS cdn_purge_logs;
DROP TABLE IF EXISTS static_routes;
DROP TABLE IF EXISTS publish_job_routes;
DROP TABLE IF EXISTS publish_jobs;

````

## database/rollback/008_leads_integrations.down.sql

````sql
DROP TABLE IF EXISTS integration_sync_logs;
DROP TABLE IF EXISTS integration_connections;
DROP TABLE IF EXISTS download_events;
DROP TABLE IF EXISTS inquiry_items;
DROP TABLE IF EXISTS inquiries;

````

## database/rollback/009_indexes_constraints.down.sql

````sql
DO $$ DECLARE t text; BEGIN FOREACH t IN ARRAY ARRAY['locales','users','roles','site_settings','site_setting_translations','content_items','content_item_translations','content_blocks','taxonomies','taxonomy_terms','taxonomy_term_translations','faq_items','faq_item_translations','products','product_translations','product_spec_definitions','seo_metadata','geo_profiles','schema_markup','hero_slides','menus','menu_items','customer_service_channels','publish_jobs','static_routes','redirects','inquiries','integration_connections'] LOOP EXECUTE format('DROP TRIGGER IF EXISTS %I ON %I','trg_'||t||'_updated_at',t); END LOOP; END $$;
DROP TRIGGER IF EXISTS trg_content_search_vector ON content_item_translations;
DROP TRIGGER IF EXISTS trg_product_search_vector ON product_translations;
DROP TRIGGER IF EXISTS trg_content_path_redirect ON content_item_translations;
DROP TRIGGER IF EXISTS trg_product_path_redirect ON product_translations;
DROP FUNCTION IF EXISTS register_content_path_redirect();
DROP FUNCTION IF EXISTS refresh_content_search_vector();
DROP FUNCTION IF EXISTS refresh_product_search_vector();
DROP INDEX IF EXISTS ix_geo_refs_profile,ix_geo_facts_profile,ix_download_media_created,ix_inquiry_items_product,ix_inquiries_email,ix_inquiries_status_assigned,ix_inquiries_created,ix_redirect_enabled_source,ix_routes_status,ix_routes_entity,ix_publish_entity,ix_publish_scheduled,ix_publish_queue,ix_media_sha256,ix_audit_user_created,ix_audit_entity,ix_blocks_translation_order,ix_terms_parent,ix_product_specs_number,ix_product_name_trgm,ix_product_search_vector,ix_product_status,ix_content_title_trgm,ix_content_search_vector,ix_content_translation_schedule,ix_content_type_status,ix_content_parent,uq_term_locale_path_live,uq_product_locale_path_live,uq_content_locale_path_live,uq_redirect_locale_source_live;

````

## database/rollback/010_seed.down.sql

````sql
DELETE FROM menus WHERE code IN ('main_header','mobile_menu','footer_products','footer_company');
DELETE FROM taxonomies WHERE code IN ('article_category','product_category','tag','industry','material');
DELETE FROM permissions WHERE code IN ('content.view','content.create','content.edit','content.publish','product.edit','product.publish','seo.edit','translation.edit','system.settings');
DELETE FROM roles WHERE code IN ('super_admin','admin','editor','seo_manager','translator','reviewer');
DELETE FROM locales WHERE code IN ('en','zh','de','fr','es','it','pt','ja','ko');

````

## database/rollback/011_runtime.down.sql

````sql
DROP TRIGGER trg_spec_definition_type ON product_spec_definitions;
DROP FUNCTION guard_spec_definition();
DROP TRIGGER trg_spec_type ON product_spec_values;
DROP FUNCTION guard_spec_value();
ALTER TABLE product_spec_values DROP CONSTRAINT ck_spec_one_value;
ALTER TABLE product_spec_values ADD CHECK(num_nonnulls(value_text,value_number,value_boolean)<=1);
DROP INDEX uq_revisions_null_locale,uq_media_location,uq_redirect_source;
DROP TRIGGER trg_guard_redirect ON redirects;
DROP FUNCTION guard_redirect();
DROP TRIGGER trg_content_site_path ON content_item_translations;
DROP TRIGGER trg_product_site_path ON product_translations;
DROP TRIGGER trg_taxonomy_site_path ON taxonomy_term_translations;
DROP FUNCTION guard_site_path();
DROP TABLE runtime_settings,public_submissions,api_rate_limits,site_paths,published_documents;

````

## database/rollback/012_operational_defaults.down.sql

````sql
DELETE FROM publish_jobs WHERE id='00000000-0000-4000-a000-000000000002';
DELETE FROM site_setting_translations WHERE site_setting_id='00000000-0000-4000-a000-000000000001';
DELETE FROM site_settings WHERE id='00000000-0000-4000-a000-000000000001';
DELETE FROM permissions WHERE code LIKE '%.read' OR code LIKE '%.write';
ALTER TABLE inquiries DROP COLUMN consent_at;
ALTER TABLE product_translations DROP CONSTRAINT ck_features_array;
ALTER TABLE content_blocks DROP CONSTRAINT ck_content_block_data;
ALTER TABLE content_item_translations DROP CONSTRAINT ck_content_body_array;
ALTER TABLE locales DROP CONSTRAINT ck_locale_code;
DO $$ DECLARE r record; BEGIN FOR r IN SELECT indexname FROM pg_indexes WHERE schemaname='public' AND indexname LIKE 'ix_fk_%' LOOP EXECUTE format('DROP INDEX %I',r.indexname); END LOOP; END $$;
DROP INDEX ix_rate_window,ix_content_body_json,ix_published_documents_json,ix_published_search;

````

## database/verify.sql

````sql
-- Run after 001..010. Raises an exception if expected schema features are missing.
DO $$
DECLARE missing text;
BEGIN
 SELECT string_agg(x.name, ', ') INTO missing
 FROM (VALUES
  ('locales'),('site_settings'),('users'),('roles'),('permissions'),('audit_logs'),
  ('content_items'),('content_item_translations'),('content_blocks'),('content_revisions'),
  ('taxonomies'),('taxonomy_terms'),('faq_items'),('products'),('product_translations'),
  ('product_spec_values'),('media_assets'),('seo_metadata'),('geo_profiles'),('schema_markup'),
  ('hero_slides'),('menus'),('customer_service_channels'),('publish_jobs'),('static_routes'),
  ('redirects'),('inquiries'),('inquiry_items'),('integration_connections')
 ) AS x(name)
 WHERE to_regclass('public.'||x.name) IS NULL;
 IF missing IS NOT NULL THEN RAISE EXCEPTION 'Missing required tables: %', missing; END IF;
 IF (SELECT count(*) FROM locales) < 9 THEN RAISE EXCEPTION 'Expected at least 9 seeded locales'; END IF;
 IF (SELECT count(*) FROM pg_trigger WHERE NOT tgisinternal AND tgname LIKE 'trg\_%\_updated\_at' ESCAPE '\') < 20 THEN RAISE EXCEPTION 'updated_at triggers are missing'; END IF;
 IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname='public' AND indexname='ix_content_search_vector') THEN RAISE EXCEPTION 'Content GIN search index is missing'; END IF;
 IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname='public' AND indexname='uq_content_locale_path_live') THEN RAISE EXCEPTION 'Content localized route uniqueness index is missing'; END IF;
 IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname='trg_product_path_redirect' AND NOT tgisinternal) THEN RAISE EXCEPTION 'Product path redirect trigger is missing'; END IF;
 RAISE NOTICE 'CMS schema verification passed';
END $$;

````

## docker-compose.yml

````yaml
x-app-env: &app-env
  DATABASE_URL: postgresql://${POSTGRES_USER:-suns}:${POSTGRES_PASSWORD:?Run pnpm run setup}@postgres:5432/${POSTGRES_DB:-suns}
  REDIS_URL: redis://redis:6379
  CMS_INTERNAL_URL: http://cms:3001
  MEDIA_DIR: /app/media
  STATIC_OUTPUT_DIR: /app/static-site
  TRUST_PROXY: "1"
services:
  postgres:
    image: postgres:16-alpine
    restart: unless-stopped
    environment:
      POSTGRES_DB: ${POSTGRES_DB:-suns}
      POSTGRES_USER: ${POSTGRES_USER:-suns}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:?Run pnpm run setup}
      TZ: UTC
    ports: ["127.0.0.1:5432:5432"]
    volumes: ["postgres_data:/var/lib/postgresql/data"]
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U $$POSTGRES_USER -d $$POSTGRES_DB"]
      interval: 5s
      timeout: 5s
      retries: 30
  redis:
    image: redis:7-alpine
    restart: unless-stopped
    command: ["redis-server", "--appendonly", "yes", "--maxmemory-policy", "noeviction"]
    ports: ["127.0.0.1:6379:6379"]
    volumes: ["redis_data:/data"]
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 5s
      timeout: 3s
      retries: 20
  init:
    image: suns-cms:local
    build: {context: ., dockerfile: infrastructure/docker/Dockerfile.cms}
    user: root
    env_file: .env
    environment: *app-env
    command: ["sh", "-c", "pnpm db:migrate && pnpm auth:migrate && mkdir -p /app/media /app/static-site && chown -R node:node /app/media /app/static-site"]
    volumes: ["media_data:/app/media", "static_data:/app/static-site"]
    depends_on:
      postgres: {condition: service_healthy}
  cms:
    image: suns-cms:local
    build: {context: ., dockerfile: infrastructure/docker/Dockerfile.cms}
    restart: unless-stopped
    env_file: .env
    environment: *app-env
    ports: ["127.0.0.1:3001:3001"]
    volumes: ["media_data:/app/media"]
    depends_on:
      init: {condition: service_completed_successfully}
    healthcheck:
      test: ["CMD", "node", "-e", "fetch('http://127.0.0.1:3001/api/v1/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"]
      interval: 15s
      timeout: 5s
      retries: 10
  web:
    build: {context: ., dockerfile: infrastructure/docker/Dockerfile.web}
    restart: unless-stopped
    env_file: .env
    environment: *app-env
    ports: ["127.0.0.1:3000:3000"]
    depends_on:
      cms: {condition: service_healthy}
  worker:
    build: {context: ., dockerfile: infrastructure/docker/Dockerfile.worker}
    restart: unless-stopped
    env_file: .env
    environment: *app-env
    volumes: ["media_data:/app/media:ro", "static_data:/app/static-site"]
    depends_on:
      init: {condition: service_completed_successfully}
      redis: {condition: service_healthy}
  nginx:
    image: nginx:stable-alpine
    restart: unless-stopped
    ports: ["8080:80"]
    environment:
      DEFAULT_LOCALE: ${DEFAULT_LOCALE:-en}
      NGINX_ENVSUBST_FILTER: DEFAULT_LOCALE
    volumes:
      - ./infrastructure/nginx/default.conf:/etc/nginx/templates/default.conf.template:ro
      - static_data:/usr/share/nginx/html:ro
    depends_on:
      cms: {condition: service_healthy}
volumes:
  postgres_data:
  redis_data:
  media_data:
  static_data:

````

## infrastructure/docker/Dockerfile.cms

````cms
FROM node:22-bookworm-slim
RUN corepack enable
WORKDIR /app
COPY . .
RUN pnpm install --frozen-lockfile
RUN PAYLOAD_SECRET=build-only-secret-not-used-at-runtime-000000000000 pnpm --filter @suns/cms exec payload generate:importmap
RUN PAYLOAD_SECRET=build-only-secret-not-used-at-runtime-000000000000 pnpm --filter @suns/cms build
ENV NODE_ENV=production
USER node
EXPOSE 3001
CMD ["pnpm","--filter","@suns/cms","start"]

````

## infrastructure/docker/Dockerfile.web

````web
FROM node:22-bookworm-slim
RUN corepack enable
WORKDIR /app
COPY . .
RUN pnpm install --frozen-lockfile && pnpm --filter @suns/web build
ENV NODE_ENV=production
ENV CMS_INTERNAL_URL=http://cms:3001
USER node
EXPOSE 3000
CMD ["pnpm","--filter","@suns/web","start"]

````

## infrastructure/docker/Dockerfile.worker

````worker
FROM node:22-bookworm-slim
RUN corepack enable
WORKDIR /app
COPY . .
RUN pnpm install --frozen-lockfile && pnpm --filter @suns/worker build
ENV NODE_ENV=production
USER node
CMD ["pnpm","--filter","@suns/worker","start"]

````

## infrastructure/nginx/default.conf

````conf
server {
 listen 80;
 server_name _;
 root /usr/share/nginx/html;
 charset utf-8;
 client_max_body_size 26m;
 add_header X-Content-Type-Options nosniff always;
 add_header Referrer-Policy strict-origin-when-cross-origin always;
 gzip on;
 gzip_types text/css application/javascript application/json application/xml image/svg+xml;
 location = / { return 302 /${DEFAULT_LOCALE}; }
 location ~ ^/(admin|manage|api|media|graphql|_next)(/|$) {
  proxy_pass http://cms:3001;
  proxy_http_version 1.1;
  proxy_set_header Host $http_host;
  proxy_set_header X-Real-IP $remote_addr;
  proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
  proxy_set_header X-Forwarded-Proto $scheme;
  proxy_read_timeout 120s;
  add_header Cache-Control "no-store" always;
 }
 location ~ /\. { deny all; }
 location = /_redirects.json { deny all; }
 location = /manifest.json { deny all; }
 location /assets/ { try_files $uri =404; add_header Cache-Control "public, max-age=300"; }
 location ~ ^/sitemap.*\.xml$ { try_files $uri =404; add_header Cache-Control "public, max-age=60"; }
 location = /robots.txt { try_files $uri =404; add_header Cache-Control "public, max-age=60"; }
 location / {
  try_files $uri/index.html $uri @resolve;
  add_header Cache-Control "public, max-age=0, s-maxage=600, must-revalidate";
 }
 location @resolve {
  rewrite ^ /api/v1/resolve?path=$uri break;
  proxy_pass http://cms:3001;
  proxy_set_header Host $http_host;
  add_header Cache-Control "no-store" always;
 }
}

````

## infrastructure/scripts/export-source.mjs

````javascript
import fs from 'node:fs/promises';import path from 'node:path';import {fileURLToPath} from 'node:url';import {createHash} from 'node:crypto';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
// Directory names are matched by location on purpose: output directories such as media/ and static-site/
// only exist at the project root, while matching those names at any depth silently dropped real source
// (packages/media/ and apps/cms/src/app/(payload)/media/).
const skipAnywhere=new Set(['node_modules','.next','.runtime','.git','dist']);
const skipAtRoot=new Set(['static-site','media','work','outputs']);const files=[];
async function walk(dir){const atRoot=dir===root;for(const e of await fs.readdir(dir,{withFileTypes:true})){if(skipAnywhere.has(e.name)||(atRoot&&skipAtRoot.has(e.name))||e.isSymbolicLink())continue;const abs=path.join(dir,e.name),relative=path.relative(root,abs).replaceAll('\\','/');if(e.isDirectory()){await walk(abs);continue;}if((e.name.startsWith('.env')&&e.name!=='.env.example')||/\.(log|tsbuildinfo)$/.test(e.name)||['FULL_SOURCE.md','FILE_MANIFEST.json','AGENTS.md','CLAUDE.md'].includes(e.name))continue;const content=await fs.readFile(abs);files.push({path:relative,bytes:content.length,sha256:createHash('sha256').update(content).digest('hex'),content:content.toString('utf8')});}}
await walk(root);files.sort((a,b)=>a.path.localeCompare(b.path));
await fs.writeFile(path.join(root,'docs/FILE_MANIFEST.json'),JSON.stringify({generatedAt:new Date().toISOString(),fileCount:files.length,files:files.map(({content,...f})=>f)},null,2));
const code=files.filter(f=>!f.path.startsWith('docs/')&&!f.path.endsWith('.md')&&!f.path.endsWith('pnpm-lock.yaml')&&!f.path.endsWith('payload-types.ts')&&!f.path.match(/migrations\/.*\.json$/));
let out='# V1.0 完整代码文件汇编\n\n生成自实际项目文件；不包含密钥、依赖包、数据库或构建缓存。实际文件是运行入口。\n\n## 目录\n\n'+code.map(f=>'- `'+f.path+'`').join('\n')+'\n\n';
for(const f of code){const ext=f.path.split('.').pop(),lang=ext==='mjs'?'javascript':ext==='ps1'?'powershell':ext==='yml'?'yaml':ext;out+='## '+f.path+'\n\n````'+lang+'\n'+f.content+'\n````\n\n';}
await fs.writeFile(path.join(root,'docs/FULL_SOURCE.md'),out);console.log('Exported',files.length,'files;',code.length,'complete code files. Secrets and runtime data excluded.');

````

## infrastructure/scripts/local-db.mjs

````javascript
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

````

## infrastructure/scripts/migrate.mjs

````javascript
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

````

## infrastructure/scripts/migrate.ps1

````powershell
param([ValidateSet('up','down','status')][string]$Direction='up',[string]$Target='')
$ErrorActionPreference='Stop'
$scriptPath=Join-Path $PSScriptRoot 'migrate.mjs'
if($Target){node $scriptPath $Direction $Target}else{node $scriptPath $Direction}
if($LASTEXITCODE -ne 0){throw 'Database migration failed'}

````

## infrastructure/scripts/setup.mjs

````javascript
import fs from 'node:fs/promises';import path from 'node:path';import {fileURLToPath} from 'node:url';import {randomBytes} from 'node:crypto';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
const example=await fs.readFile(path.join(root,'.env.example'),'utf8');
const password=randomBytes(24).toString('hex');const text=example.replaceAll('GENERATE_POSTGRES_PASSWORD',password).replaceAll('GENERATE_PAYLOAD_SECRET',randomBytes(48).toString('hex'));
try{await fs.writeFile(path.join(root,'.env'),text,{flag:'wx',mode:0o600});console.log('Created .env with unique local secrets. Configure domain/storage before deployment.');}catch(e){if(e.code==='EEXIST')console.log('.env already exists; preserved.');else throw e;}
for(const name of ['media','static-site'])await fs.mkdir(path.join(root,name),{recursive:true});

````

## infrastructure/scripts/verify.mjs

````javascript
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

````

## infrastructure/scripts/verify.ps1

````powershell
$ErrorActionPreference='Stop'
node (Join-Path $PSScriptRoot 'verify.mjs') @args
if($LASTEXITCODE -ne 0){throw 'Database verification failed'}

````

## package.json

````json
{
  "name": "suns-seo-geo-cms",
  "private": true,
  "version": "1.0.0",
  "packageManager": "pnpm@10.17.1",
  "scripts": {
    "dev": "pnpm --parallel --filter @suns/cms --filter @suns/web --filter @suns/worker dev",
    "build": "pnpm -r build",
    "typecheck": "pnpm -r typecheck",
    "db:up": "docker compose up -d postgres redis",
    "db:migrate": "node infrastructure/scripts/migrate.mjs up",
    "db:verify": "node infrastructure/scripts/verify.mjs",
    "db:rollback": "node infrastructure/scripts/migrate.mjs down",
    "setup": "node infrastructure/scripts/setup.mjs",
    "dev:worker": "pnpm --filter @suns/worker start",
    "auth:migrate": "pnpm --filter @suns/cms exec payload migrate",
    "test": "pnpm exec tsx --test tests/*.test.ts"
  },
  "devDependencies": {
    "typescript": "^5.9.2",
    "@types/node": "^24.5.2",
    "tsx": "^4.20.5",
    "@types/pg": "^8.15.5"
  },
  "dependencies": {
    "pg": "^8.16.3",
    "dotenv": "^16.6.1"
  },
  "type": "module"
}

````

## packages/domain/package.json

````json
{
  "name":"@suns/domain","version":"1.0.0","private":true,"type":"module",
  "exports":{".":"./src/index.ts","./registry":"./src/registry.ts","./types":"./src/types.ts"},
  "scripts":{"typecheck":"tsc --noEmit"},
  "dependencies":{"pg":"^8.16.3","zod":"^3.25.76"},
  "devDependencies":{"@types/pg":"^8.15.5","typescript":"^5.9.2"}
}

````

## packages/domain/src/crud.ts

````ts
import { query, transaction, identifier as q } from './db';
import { resources, getResource, canRead, canWrite } from './registry';
import type { Actor, Row } from './types';
import type { PoolClient } from 'pg';
export class DomainError extends Error { constructor(message:string,public status=400){super(message);} }
const privateColumns=new Set(['password_hash','search_vector']);
const immutable=new Set(['deleted_at','id','created_at','updated_at','search_vector','password_hash','created_by','updated_by']);
export async function columns(table:string) {
 getResource(table);
 const cols=await query(`SELECT c.column_name AS name,c.data_type AS type,c.is_nullable='YES' AS nullable,c.column_default AS default,
 (SELECT ccu.table_name FROM information_schema.constraint_column_usage ccu JOIN information_schema.table_constraints tc ON tc.constraint_name=ccu.constraint_name AND tc.constraint_schema=ccu.constraint_schema JOIN information_schema.key_column_usage kcu ON kcu.constraint_name=tc.constraint_name AND kcu.constraint_schema=tc.constraint_schema WHERE tc.table_schema='public' AND tc.table_name=c.table_name AND tc.constraint_type='FOREIGN KEY' AND kcu.column_name=c.column_name LIMIT 1) AS reference
 FROM information_schema.columns c WHERE c.table_schema='public' AND c.table_name=$1 ORDER BY c.ordinal_position`,[table]);
 // Bind each CHECK to its own column through conkey/attnum instead of substring-matching the definition text,
 // which would confuse "status" with "publish_status". Numeric literals are captured too (e.g. redirect_type IN (301,302)).
 // attname is cast to text so the result is a text[] the pg driver parses; name[] would arrive as a raw string.
 const checks=await query(`SELECT pg_get_constraintdef(con.oid) AS definition,array(SELECT a.attname::text FROM unnest(con.conkey) WITH ORDINALITY u(attnum,n) JOIN pg_attribute a ON a.attrelid=con.conrelid AND a.attnum=u.attnum ORDER BY u.n) AS columns FROM pg_constraint con WHERE con.conrelid=to_regclass($1) AND con.contype='c'`,['public.'+table]);
 return cols.filter(c=>!privateColumns.has(c.name)).map(c=>{const check=checks.find(x=>x.columns.length===1&&x.columns[0]===c.name&&x.definition.includes('= ANY'));return {...c,options:check?Array.from(check.definition.matchAll(/'([^']+)'|(-?\d+(?:\.\d+)?)/g),(m:any)=>m[1]??m[2]):undefined,readonly:immutable.has(c.name)};});
}
export function allowed(actor:Actor|undefined,table:string,write=false) {if(!actor)throw new DomainError('请先登录',401);const r=getResource(table);if(!(write?canWrite(actor,r):canRead(actor,r)))throw new DomainError('没有此操作权限',403);return r;}
export async function list(actor:Actor,table:string,options:{page?:number;limit?:number;search?:string;filter?:Row}={}){
 const r=allowed(actor,table);const cols=await columns(table);const names=cols.map(c=>c.name);const params:unknown[]=[];const where:string[]=[];
 if(names.includes('deleted_at'))where.push('deleted_at IS NULL');
 if(['audit_logs','content_revisions'].includes(table)&&!['admin','super_admin'].includes(actor.role)){params.push(resources.filter(r=>canRead(actor,r)&&!['history','system','leads'].includes(r.group)).map(r=>r.table));where.push(`entity_type=ANY(${params.length}::text[])`);}
 for(const [k,v] of Object.entries(options.filter??{})){if(!names.includes(k))throw new DomainError('Invalid filter');params.push(v);where.push(`${q(k)}=$${params.length}`);}
 if(options.search){const textCols=cols.filter(c=>['text','character varying','USER-DEFINED'].includes(c.type)&&!['id'].includes(c.name)&&!c.name.endsWith('_id')).map(c=>q(c.name)+'::text');if(textCols.length){params.push('%'+options.search.slice(0,200)+'%');where.push(`concat_ws(' ',${textCols.join(',')}) ILIKE $${params.length}`);}}
 const predicate=where.length?' WHERE '+where.join(' AND '):'';const count=await query(`SELECT count(*)::int AS count FROM ${q(table)}${predicate}`,params);
 const limit=Math.min(100,Math.max(1,options.limit||25)),page=Math.max(1,options.page||1);
 const rows=await query(`SELECT ${names.map(q).join(',')} FROM ${q(table)}${predicate} ORDER BY ${q(names.includes('updated_at')?'updated_at':names.includes('created_at')?'created_at':r.key![0])} DESC LIMIT $${params.length+1} OFFSET $${params.length+2}`,[...params,limit,(page-1)*limit]);
 return {rows,total:count[0].count,page,limit,columns:cols,resource:r};
}
export function keyWhere(table:string,key:Row,offset=0){const keys=getResource(table).key!;if(keys.some(k=>key[k]===undefined))throw new DomainError('Missing record key');return {sql:keys.map((k,i)=>`${q(k)}=$${i+1+offset}`).join(' AND '),values:keys.map(k=>key[k])};}
export async function audit(c:PoolClient,actor:Actor,table:string,action:string,old:Row|null,next:Row|null){
 const scrub=(x:Row|null)=>{if(!x)return null;const row={...x};privateColumns.forEach(k=>delete row[k]);return row;};
 await c.query('INSERT INTO audit_logs(user_id,action,entity_type,entity_id,old_data,new_data) VALUES($1,$2,$3,$4,$5,$6)',[actor.id,action,table,next?.id??old?.id??null,JSON.stringify(scrub(old)),JSON.stringify(scrub(next))]);
 if(old?.id && ['content_items','content_item_translations','products','product_translations'].includes(table))await c.query(`INSERT INTO content_revisions(entity_type,entity_id,locale_id,version_number,snapshot,created_by) SELECT $1,$2,$3,coalesce(max(version_number),0)+1,$4,$5 FROM content_revisions WHERE entity_type=$1 AND entity_id=$2`,[table,old.id,old.locale_id??null,JSON.stringify(scrub(old)),actor.id]);
}
export async function ensureActor(actor:Actor){await query(`INSERT INTO users(id,email,password_hash,display_name) VALUES($1,$2,'external:payload',$3) ON CONFLICT(id) DO UPDATE SET email=EXCLUDED.email,display_name=EXCLUDED.display_name`,[actor.id,actor.email,actor.displayName||actor.email]);}
export async function save(actor:Actor,table:string,input:Row,key?:Row){
 allowed(actor,table,true);const cols=await columns(table);const names=new Set(cols.map(c=>c.name));const expected=input._expectedUpdatedAt;const data:Row={};
 for(const [k,v] of Object.entries(input)){if(k.startsWith('_'))continue;if(!names.has(k)||immutable.has(k))continue;if(typeof v==='string'&&v.length>1000000)throw new DomainError('Field too large');data[k]=v;}
 if(['content_item_translations','product_translations','content_items'].includes(table)&&['published','scheduled'].includes(data.status??data.publish_status))throw new DomainError('请使用发布 / 定时发布操作');
 if(table==='media_assets'&&Object.keys(data).some(k=>!['deleted_at','original_filename'].includes(k)))throw new DomainError('媒体文件通过上传接口创建');
 if(table==='locales'&&key&&data.code){const old=await list(actor,table,{filter:key});if(old.rows[0]?.code!==data.code)throw new DomainError('已有语言代码不可重命名；请新建语言');}
 if(table==='site_settings'&&data.primary_domain){try{const u=new URL(data.primary_domain);if(!['http:','https:'].includes(u.protocol)||u.username||u.password)throw new Error();data.primary_domain=u.origin;}catch{throw new DomainError('请输入完整 http(s) 站点地址');}}
 if(data.body!==undefined&&(!Array.isArray(data.body)||data.body.some((b:any)=>!b||typeof b.type!=='string'||!b.data||typeof b.data!=='object'||Array.isArray(b.data))))throw new DomainError('正文必须是包含 type 和 data 的区块数组');
 if(names.has('updated_by'))data.updated_by=actor.id;
 if(!key&&names.has('created_by'))data.created_by=actor.id;
 return transaction(async c=>{
  let old:Row|null=null;if(key){const w=keyWhere(table,key);old=(await c.query(`SELECT * FROM ${q(table)} WHERE ${w.sql} FOR UPDATE`,w.values)).rows[0];if(!old)throw new DomainError('记录不存在',404);if(expected&&old.updated_at&&new Date(expected).getTime()!==new Date(old.updated_at).getTime())throw new DomainError('记录已被其他人修改，请重新加载',409);}
  const fields=Object.keys(data);if(!fields.length)throw new DomainError('没有可保存的字段');
  const values=fields.map(k=>cols.find(c=>c.name===k)?.type==='jsonb'?JSON.stringify(data[k]):data[k]);
  let result;if(key){const w=keyWhere(table,key,values.length);result=await c.query(`UPDATE ${q(table)} SET ${fields.map((f,i)=>`${q(f)}=$${i+1}`).join(',')} WHERE ${w.sql} RETURNING *`,[...values,...w.values]);}
  else result=await c.query(`INSERT INTO ${q(table)}(${fields.map(q).join(',')}) VALUES(${fields.map((_,i)=>'$'+(i+1)).join(',')}) RETURNING *`,values);
  await audit(c,actor,table,key?'update':'create',old,result.rows[0]);const row=result.rows[0];privateColumns.forEach(k=>delete row[k]);return row;
 });
}
export async function remove(actor:Actor,table:string,key:Row){
 allowed(actor,table,true);const cols=await columns(table);const w=keyWhere(table,key);
 return transaction(async c=>{const old=(await c.query(`SELECT * FROM ${q(table)} WHERE ${w.sql} FOR UPDATE`,w.values)).rows[0];if(!old)throw new DomainError('记录不存在',404);
  if(['content_items','products'].includes(table)){
   const child=table==='products'?'product_translations':'content_item_translations',fk=table==='products'?'product_id':'content_item_id';
   await c.query(`INSERT INTO publish_jobs(job_type,entity_type,entity_id,locale_id,requested_by,metadata) SELECT 'unpublish',$1,id,locale_id,$2,jsonb_build_object('route',path) FROM ${child} WHERE ${fk}=$3`,[child,actor.id,old.id]);
   await c.query(`UPDATE ${child} SET deleted_at=now() WHERE ${fk}=$1`,[old.id]);
  }
  if(['content_item_translations','product_translations','taxonomy_term_translations'].includes(table))await c.query(`INSERT INTO publish_jobs(job_type,entity_type,entity_id,locale_id,requested_by,metadata) VALUES('unpublish',$1,$2,$3,$4,jsonb_build_object('route',$5::text))`,[table,old.id,old.locale_id,actor.id,old.path]);
  await c.query(cols.some(x=>x.name==='deleted_at')?`UPDATE ${q(table)} SET deleted_at=now() WHERE ${w.sql}`:`DELETE FROM ${q(table)} WHERE ${w.sql}`,w.values);
  await audit(c,actor,table,'delete',old,null);return {ok:true};
 });
}
export async function restoreRevision(actor:Actor,id:string){
 const r=(await query('SELECT * FROM content_revisions WHERE id=$1',[id]))[0];if(!r)throw new DomainError('版本不存在',404);
 const data={...r.snapshot};if('status'in data)data.status='draft';if('publish_status'in data)data.publish_status='draft';return save(actor,r.entity_type,data,{id:r.entity_id});
}

````

## packages/domain/src/db.ts

````ts
import pg from 'pg';
import {AsyncLocalStorage} from 'node:async_hooks';
import type { PoolClient, QueryResultRow } from 'pg';
const globalDb = globalThis as unknown as { sunsPool?: pg.Pool };
export const pool = globalDb.sunsPool ??= new pg.Pool({connectionString:process.env.DATABASE_URL,max:10,statement_timeout:30000,options:'-c timezone=UTC'});
const scope=new AsyncLocalStorage<PoolClient>();
export async function query<T extends QueryResultRow = any>(sql:string,params:unknown[]=[]) {return (await (scope.getStore()||pool).query<T>(sql,params)).rows;}
export async function transaction<T>(fn:(client:PoolClient)=>Promise<T>):Promise<T> {const c=await pool.connect();try{await c.query('BEGIN');const result=await scope.run(c,()=>fn(c));await c.query('COMMIT');return result;}catch(e){await c.query('ROLLBACK');throw e;}finally{c.release();}}
export const identifier=(value:string)=>'"'+value.replaceAll('"','""')+'"';

````

## packages/domain/src/documents.ts

````ts
import { query } from './db';
import { DomainError } from './crud';
import type { Document, Row } from './types';
export function assetURL(m:Row|undefined|null){if(!m?.object_key)return '';const prefix=m.storage_provider==='local'?'/media/':(process.env.MEDIA_PUBLIC_URL||'/media/').replace(/\/$/,'')+'/';return prefix+m.object_key.split('/').map(encodeURIComponent).join('/');}
export async function siteContext(localeId:string){
 const site=(await query(`SELECT s.*,t.site_title,t.company_name,t.company_description,t.footer_description,t.copyright_text FROM site_settings s LEFT JOIN site_setting_translations t ON t.site_setting_id=s.id AND t.locale_id=$1 LIMIT 1`,[localeId]))[0]??{site_name:'SUNS Glassware',primary_domain:process.env.NEXT_PUBLIC_SITE_URL||'http://localhost:3000',enable_indexing:false};
 // Public rendering receives only public configuration, never integration secrets.
 const publicSite={default_locale_code:(await query('SELECT code FROM locales WHERE id=$1',[site.default_locale_id]))[0]?.code,google_site_verification:site.settings_json?.google_site_verification,site_name:site.site_name,primary_domain:site.primary_domain,site_title:site.site_title,company_name:site.company_name,company_description:site.company_description,footer_description:site.footer_description,copyright_text:site.copyright_text,company_email:site.company_email,company_phone:site.company_phone,enable_indexing:site.enable_indexing,ga_measurement_id:site.ga_measurement_id,default_locale_id:site.default_locale_id};
 const menus=await query(`SELECT i.id,i.parent_id,i.link_type,i.linked_entity_id,i.linked_entity_type,i.custom_url,i.target,m.code,m.location,t.label,t.custom_url_override FROM menus m JOIN menu_items i ON i.menu_id=m.id JOIN menu_item_translations t ON t.menu_item_id=i.id AND t.locale_id=$1 WHERE m.is_enabled AND i.is_enabled ORDER BY i.sort_order,i.id`,[localeId]);
 for(const menu of menus){menu.url=menu.custom_url_override||menu.custom_url;if(!menu.url&&menu.linked_entity_id){const types:Record<string,string>={content:'content_item_translations',product:'product_translations',term:'taxonomy_term_translations'};const type=types[menu.link_type];const target=type?(await query(`SELECT route FROM published_documents WHERE locale_id=$1 AND entity_type=$2 AND (entity_id=$3 OR snapshot->>'groupId'=$3::text) LIMIT 1`,[localeId,type,menu.linked_entity_id]))[0]:null;menu.url=target?.route;}}
 const heroes=await query(`SELECT h.*,t.title,t.subtitle,t.description,t.primary_button_text,t.primary_button_url,t.secondary_button_text,t.secondary_button_url,to_jsonb(d) AS desktop,to_jsonb(m) AS mobile FROM hero_slides h JOIN hero_slide_translations t ON t.hero_slide_id=h.id AND t.locale_id=$1 LEFT JOIN media_assets d ON d.id=h.desktop_media_id LEFT JOIN media_assets m ON m.id=h.mobile_media_id WHERE h.is_enabled AND (h.start_at IS NULL OR h.start_at<=now()) AND (h.end_at IS NULL OR h.end_at>now()) ORDER BY h.sort_order`,[localeId]);
 for(const h of heroes){h.desktopURL=assetURL(h.desktop);h.mobileURL=assetURL(h.mobile)||h.desktopURL;delete h.desktop;delete h.mobile;}
 const channels=await query(`SELECT c.id,c.channel_type,c.name,c.config,r.welcome_text,r.working_hours,r.country_code FROM customer_service_channels c LEFT JOIN customer_service_rules r ON r.channel_id=c.id AND r.is_enabled AND (r.locale_id=$1 OR r.locale_id IS NULL) WHERE c.is_enabled AND (NOT EXISTS(SELECT 1 FROM customer_service_rules x WHERE x.channel_id=c.id) OR r.id IS NOT NULL) ORDER BY c.sort_order,r.priority DESC`,[localeId]);
 for(const c of channels){const cfg=c.config||{};c.config={email:cfg.email,phone:cfg.phone,url:cfg.url};}
 return {site:publicSite,menus,heroes,channels};
}
export async function sourceDocument(table:string,id:string):Promise<Document>{
 const tables:Record<string,{parent:string;fk:string;title:string}>={content_item_translations:{parent:'content_items',fk:'content_item_id',title:'title'},product_translations:{parent:'products',fk:'product_id',title:'name'},taxonomy_term_translations:{parent:'taxonomy_terms',fk:'term_id',title:'name'}};
 const t=tables[table];if(!t)throw new DomainError('Unsupported publish entity');
 const row=(await query(`SELECT t.*,to_jsonb(p) AS parent,l.code AS locale,l.hreflang FROM ${table} t JOIN ${t.parent} p ON p.id=t.${t.fk} JOIN locales l ON l.id=t.locale_id WHERE t.id=$1 AND l.is_enabled`,[id]))[0];
 if(!row||row.deleted_at||row.parent.deleted_at)throw new DomainError('可发布内容不存在',404);
 const ctx=await siteContext(row.locale_id);
 const seo=row.seo_id?(await query('SELECT * FROM seo_metadata WHERE id=$1',[row.seo_id]))[0]??{}:{};
 const geo=row.geo_profile_id?(await query('SELECT * FROM geo_profiles WHERE id=$1',[row.geo_profile_id]))[0]??{}:{};
 if(geo.id){geo.facts=await query('SELECT * FROM geo_key_facts WHERE geo_profile_id=$1 ORDER BY sort_order',[geo.id]);geo.references=await query('SELECT * FROM geo_references WHERE geo_profile_id=$1 ORDER BY sort_order',[geo.id]);}
 const schema=row.schema_markup_id?(await query('SELECT * FROM schema_markup WHERE id=$1',[row.schema_markup_id]))[0]??{}:{};
 let body=Array.isArray(row.body)?row.body:[];
 if(table==='content_item_translations'){const blocks=await query('SELECT block_type AS type,data FROM content_blocks WHERE content_translation_id=$1 AND is_enabled ORDER BY sort_order,id',[id]);if(blocks.length)body=blocks;}
 const result:Document={route:row.path,locale:row.locale,localeId:row.locale_id,entityType:table,entityId:id,groupId:row[t.fk],contentType:row.parent.content_type,title:row[t.title],description:row.excerpt||row.short_description||row.description||'',body,seo,geo,schema,...ctx,faqs:[],media:[],documents:[],related:[],alternates:[],updatedAt:new Date(row.updated_at).toISOString()};
 if(table==='product_translations')result.termIds=(await query('SELECT term_id FROM product_term_links WHERE product_id=$1',[row.product_id])).map(r=>r.term_id);if(table==='content_item_translations')result.termIds=(await query('SELECT term_id FROM content_term_links WHERE content_item_id=$1',[row.content_item_id])).map(r=>r.term_id);
 const alts=await query(`SELECT t.path,l.code AS locale,l.hreflang FROM ${table} t JOIN locales l ON l.id=t.locale_id WHERE t.${t.fk}=$1 AND l.is_enabled AND EXISTS(SELECT 1 FROM published_documents d WHERE d.entity_id=t.id AND d.entity_type=$2)`,[row[t.fk],table]);result.alternates=alts.filter(a=>a.locale!==row.locale).concat([{path:row.path,locale:row.locale,hreflang:row.hreflang}]);
 if(table==='product_translations'){
  result.product={...row.parent,description:row.description,features:row.features,applications:row.applications};
  result.product!.specs=await query(`SELECT coalesce(t.name,d.code) AS name,v.value_text,v.value_number,v.value_boolean,v.unit FROM product_spec_values v JOIN product_spec_definitions d ON d.id=v.spec_definition_id LEFT JOIN product_spec_definition_translations t ON t.spec_definition_id=d.id AND t.locale_id=$2 WHERE v.product_id=$1 ORDER BY v.sort_order`,[row.product_id,row.locale_id]);
  result.media=await query(`SELECT m.*,t.alt_text,t.caption FROM product_media p JOIN media_assets m ON m.id=p.media_id LEFT JOIN media_asset_translations t ON t.media_id=m.id AND t.locale_id=$2 WHERE p.product_id=$1 AND m.deleted_at IS NULL ORDER BY p.sort_order`,[row.product_id,row.locale_id]);
  result.documents=await query(`SELECT d.*,m.object_key,m.storage_provider FROM product_documents d JOIN media_assets m ON m.id=d.media_id WHERE d.product_id=$1 AND (d.locale_id=$2 OR d.locale_id IS NULL) AND m.deleted_at IS NULL ORDER BY d.sort_order`,[row.product_id,row.locale_id]);
  result.related=await query(`SELECT p.route,p.snapshot->>'title' AS title FROM product_relations r JOIN product_translations t ON t.product_id=r.related_product_id AND t.locale_id=$2 JOIN published_documents p ON p.entity_id=t.id AND p.entity_type='product_translations' WHERE r.product_id=$1 ORDER BY r.sort_order`,[row.product_id,row.locale_id]);
 }else if(table==='content_item_translations'){
  result.faqs=await query(`SELECT t.question,t.answer FROM content_faq_links l JOIN faq_items f ON f.id=l.faq_id JOIN faq_item_translations t ON t.faq_id=f.id AND t.locale_id=$2 WHERE l.content_item_id=$1 AND f.status='published' AND f.deleted_at IS NULL ORDER BY l.sort_order`,[row.content_item_id,row.locale_id]);
 }
 if(row.parent.featured_media_id&&!result.media.length){const media=(await query('SELECT * FROM media_assets WHERE id=$1 AND deleted_at IS NULL',[row.parent.featured_media_id]))[0];if(media)result.media.push(media);}
 for(const m of result.media){m.url=assetURL(m);m.variants=(await query('SELECT * FROM media_variants WHERE media_id=$1 ORDER BY width',[m.id])).map(v=>({...v,url:assetURL({...m,object_key:v.object_key})}));}
 if(seo.og_image_id){const m=(await query('SELECT * FROM media_assets WHERE id=$1 AND deleted_at IS NULL',[seo.og_image_id]))[0];seo.og_image_url=assetURL(m);}result.documents=result.documents.map(m=>({...m,url:assetURL(m)}));
 if(table==='taxonomy_term_translations')result.related=await query(`SELECT DISTINCT p.route,p.snapshot->>'title' AS title FROM published_documents p WHERE p.locale_id=$1 AND (p.entity_id IN(SELECT t.id FROM product_translations t JOIN product_term_links l ON l.product_id=t.product_id WHERE l.term_id=$2) OR p.entity_id IN(SELECT t.id FROM content_item_translations t JOIN content_term_links l ON l.content_item_id=t.content_item_id WHERE l.term_id=$2))`,[row.locale_id,row.term_id]);
 return result;
}
export async function released(route:string){const d=(await query('SELECT snapshot FROM published_documents WHERE route=$1',[route.replace(/\/$/,'')]))[0];return d?.snapshot as Document|undefined;}

````

## packages/domain/src/index.ts

````ts
export * from './types';
export * from './db';
export * from './registry';
export * from './crud';
export * from './documents';
export * from './publishing';

export * from './service';

````

## packages/domain/src/publishing.ts

````ts
import { query, transaction } from './db';
import { sourceDocument } from './documents';
import { DomainError, audit } from './crud';
import type { Actor } from './types';
export async function requestPublish(actor:Actor,table:string,id:string,action='publish',scheduledAt?:string){
 if(!(['admin','super_admin'].includes(actor.role)||(actor.permissions?actor.permissions.includes('publishing.write'):actor.role==='reviewer')))throw new DomainError('需要审核或管理员发布权限',403);
 if(!['content_item_translations','product_translations','taxonomy_term_translations'].includes(table))throw new DomainError('不支持发布此类型');
 if(!['publish','unpublish','rebuild'].includes(action))throw new DomainError('Invalid publish action');
 const at=scheduledAt?new Date(scheduledAt):null;if(at&&(!Number.isFinite(at.getTime())||at.getTime()<Date.now()))throw new DomainError('定时发布时间必须在未来');
 return transaction(async c=>{
  await c.query('SET TRANSACTION ISOLATION LEVEL REPEATABLE READ');
  const old=(await c.query(`SELECT * FROM ${table} WHERE id=$1 FOR UPDATE`,[id])).rows[0];
  const snapshot=await sourceDocument(table,id);
  if(!old||new Date(old.updated_at).getTime()!==new Date(snapshot.updatedAt).getTime())throw new DomainError('内容已修改，请重新提交发布',409);
  const task=(await c.query(`INSERT INTO publish_jobs(job_type,entity_type,entity_id,locale_id,requested_by,scheduled_at,metadata) VALUES($1,$2,$3,$4,$5,$6,$7) RETURNING *`,[action,table,id,snapshot.localeId,actor.id,at,JSON.stringify({snapshot,route:snapshot.route})])).rows[0];
  if(at&&table!=='taxonomy_term_translations'){const status=table==='product_translations'?'publish_status':'status';await c.query(`UPDATE ${table} SET ${status}='scheduled',scheduled_at=$2 WHERE id=$1`,[id,at]);}
  await audit(c,actor,table,action==='unpublish'?'unpublish.requested':'publish.requested',old,{id,job_id:task.id,scheduled_at:at});return task;
 });
}
export async function rebuildSite(actor:Actor){if(!(['admin','super_admin'].includes(actor.role)||(actor.permissions?actor.permissions.includes('publishing.write'):actor.role==='reviewer')))throw new DomainError('没有发布权限',403);return(await query(`INSERT INTO publish_jobs(job_type,entity_type,requested_by,metadata) VALUES('rebuild','site',$1,'{}') RETURNING *`,[actor.id]))[0];}
export async function jobAction(actor:Actor,id:string,action:string){
 if(!(['admin','super_admin'].includes(actor.role)||(actor.permissions?actor.permissions.includes('publishing.write'):actor.role==='reviewer')))throw new DomainError('没有发布权限',403);
 return transaction(async c=>{const j=(await c.query('SELECT * FROM publish_jobs WHERE id=$1 FOR UPDATE',[id])).rows[0];if(!j)throw new DomainError('Task not found',404);
  if(action==='cancel'){if(!['pending','retrying'].includes(j.status))throw new DomainError('只能取消尚未处理的任务',409);return(await c.query("UPDATE publish_jobs SET status='cancelled',finished_at=now() WHERE id=$1 RETURNING *",[id])).rows[0];}
  if(action==='retry'&&['failed','cancelled'].includes(j.status))return(await c.query(`INSERT INTO publish_jobs(job_type,entity_type,entity_id,locale_id,requested_by,metadata) VALUES($1,$2,$3,$4,$5,$6) RETURNING *`,[j.job_type,j.entity_type,j.entity_id,j.locale_id,actor.id,j.metadata])).rows[0];throw new DomainError('Invalid job action');
 });
}

````

## packages/domain/src/registry.ts

````ts
export type Resource = { table: string; label: string; group: string; permission: string; readonly?: boolean; key?: string[] };
const resource = (table:string,label:string,group:string,permission=group,readonly=false,key=['id']):Resource => ({table,label,group,permission,readonly,key});
export const resources: Resource[] = [
 resource('content_items','页面 / 文章','content'), resource('content_item_translations','内容翻译','content'), resource('content_blocks','页面区块','content'),
 resource('taxonomies','分类体系','content'),resource('taxonomy_terms','分类','content'),resource('taxonomy_term_translations','分类翻译','content'),resource('content_term_links','内容分类关联','content','content',false,['content_item_id','term_id']),
 resource('faq_items','常见问题','content'),resource('faq_item_translations','FAQ 翻译','content'),resource('content_faq_links','内容 FAQ 关联','content','content',false,['content_item_id','faq_id']),
 resource('products','产品','product'),resource('product_translations','产品翻译','product'),resource('product_spec_definitions','规格定义','product'),resource('product_spec_definition_translations','规格名称翻译','product'),resource('product_spec_values','产品规格值','product'),
 resource('product_term_links','产品分类','product','product',false,['product_id','term_id']),resource('product_media','产品图库','product'),resource('product_documents','产品资料','product'),resource('product_relations','关联产品','product','product',false,['product_id','related_product_id','relation_type']),
 resource('seo_metadata','SEO 元数据','seo'),resource('geo_profiles','GEO 知识实体','seo'),resource('geo_key_facts','知识事实','seo'),resource('geo_references','证据与引用','seo'),resource('schema_markup','JSON-LD','seo'),resource('redirects','301 / 302','seo'),resource('robots_rules','Robots 规则','seo'),resource('sitemap_files','站点地图','seo','seo',true),
 resource('media_assets','媒体库','media'),resource('media_variants','图片版本','media','media',true),resource('media_asset_translations','图片 ALT 翻译','media'),
 resource('hero_slides','首页轮播','appearance'),resource('hero_slide_translations','轮播翻译','appearance'),resource('menus','导航菜单','appearance'),resource('menu_items','导航项目','appearance'),resource('menu_item_translations','导航翻译','appearance'),resource('customer_service_channels','客服渠道','appearance'),resource('customer_service_rules','客服市场规则','appearance'),
 resource('inquiries','询盘 / RFQ','leads'),resource('inquiry_items','询盘产品','leads'),resource('download_events','下载记录','leads','leads',true),
 resource('publish_jobs','发布任务','publishing','publishing',true),resource('publish_job_routes','任务路由','publishing','publishing',true),resource('static_routes','静态路由','publishing','publishing',true),resource('cdn_purge_logs','CDN 刷新日志','publishing','publishing',true),
 resource('translation_jobs','翻译工作流','translation'),resource('content_revisions','内容版本','history','history',true),resource('audit_logs','审计记录','history','history',true),
 resource('locales','语言','system'),resource('site_settings','站点配置','system'),resource('site_setting_translations','站点翻译','system'),resource('users','业务用户映射','system','system',true),resource('roles','角色','system'),resource('permissions','权限定义','system'),resource('user_roles','用户角色','system','system',false,['user_id','role_id']),resource('role_permissions','角色权限','system','system',false,['role_id','permission_id']),resource('integration_connections','集成配置','system'),resource('integration_sync_logs','同步日志','system','system',true),
];
export function getResource(table:string) { const r=resources.find(r=>r.table===table); if(!r)throw new Error('Unknown resource');return r; }
export const roleGroups:Record<string,string[]>={admin:['*'],super_admin:['*'],editor:['content','product','media','appearance'],seo_manager:['seo'],translator:['translation'],reviewer:['publishing']};
export function canWrite(subject:string|{role:string;permissions?:string[]}, r:Resource) {const role=typeof subject==='string'?subject:subject.role;if(typeof subject!=='string'&&subject.permissions&&!['admin','super_admin'].includes(role))return !r.readonly&&(subject.permissions.includes(r.permission+'.write')||(role==='translator'&&r.table.endsWith('_translations')&&subject.permissions.includes('translation.write')));return !r.readonly && (roleGroups[role]?.includes('*') || roleGroups[role]?.includes(r.permission) || (role==='translator' && r.table.endsWith('_translations')));}
export function canRead(subject:string|{role:string;permissions?:string[]}, r:Resource) {const role=typeof subject==='string'?subject:subject.role;if(typeof subject!=='string'&&subject.permissions&&!['admin','super_admin'].includes(role))return subject.permissions.includes(r.permission+'.read')||canWrite(subject,r);return ['admin','super_admin'].includes(role)||(!['system','leads','history'].includes(r.group));}

````

## packages/domain/src/service.ts

````ts
import type {Row} from './types';
export function serviceForVisitor(channels:Row[],country=''){
 const selected=new Map<string,Row>();
 for(const channel of channels){if(channel.country_code&&channel.country_code!==country)continue;const key=channel.id||channel.name;if(selected.has(key))continue;const hours=channel.working_hours||{};let available=true;
  if(hours.days&&typeof hours.days==='object'){try{const parts=new Intl.DateTimeFormat('en-US',{timeZone:hours.timezone||'UTC',weekday:'short',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).formatToParts(new Date());const val=(type:string)=>parts.find(x=>x.type===type)?.value||'';const weekday=['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].indexOf(val('weekday'));const now=Number(val('hour'))*60+Number(val('minute'));const minutes=(s:string)=>{const m=/^(\d{2}):(\d{2})$/.exec(s);return m?Number(m[1])*60+Number(m[2]):-1;};const slots=hours.days[String(weekday)]||[];available=Array.isArray(slots)&&slots.some((slot:any)=>Array.isArray(slot)&&now>=minutes(slot[0])&&now<minutes(slot[1]));}catch{available=false;}}
  const config=channel.config||{};const target=channel.channel_type==='email'?'mailto:'+config.email:channel.channel_type==='phone'?'tel:'+config.phone:channel.channel_type==='whatsapp'?'https://wa.me/'+String(config.phone||'').replace(/\D/g,''):config.url;
  selected.set(key,{name:channel.name,url:target,available,welcome_text:available?channel.welcome_text:hours.offlineText||'',channel_type:channel.channel_type});
 }
 return [...selected.values()];
}

````

## packages/domain/src/types.ts

````ts
export type Row = Record<string, any>;
export type Actor = { id: string; email: string; role: string; permissions?:string[]; displayName?: string };
export type Block = { type: string; data: Row };
export type Document = { termIds?:string[]; groupId?:string; contentType?:string;
  route: string; locale: string; localeId: string; entityType: string; entityId: string;
  title: string; description: string; body: Block[]; product?: Row; seo: Row; geo: Row;
  schema: Row; site: Row; menus: Row[]; heroes: Row[]; channels: Row[];
  faqs: Row[]; media: Row[]; documents: Row[]; related: Row[];
  alternates: { locale: string; hreflang: string; path: string }[];
  updatedAt: string;
};

````

## packages/domain/tsconfig.json

````json
{"extends":"../../tsconfig.base.json","include":["src/**/*.ts"]}

````

## packages/publisher/package.json

````json
{"name":"@suns/publisher","version":"1.0.0","private":true,"type":"module","exports":"./src/index.ts","scripts":{"typecheck":"tsc --noEmit"},"dependencies":{"@suns/domain":"workspace:*","@suns/ui":"workspace:*","bullmq":"^5.58.5"},"devDependencies":{"typescript":"^5.9.2"}}

````

## packages/publisher/src/files.ts

````ts
import path from 'node:path';
import { mkdir,realpath,writeFile,rename,unlink } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
export function outputRoot(){return path.resolve(process.env.STATIC_OUTPUT_DIR||'../../static-site');}
export function routeFile(route:string){if(!/^\/[a-z0-9][a-z0-9/_-]*$/.test(route)||route.includes('//'))throw new Error('Unsafe static route');return route.replace(/^\//,'')+'/index.html';}
export async function writeAtomic(relative:string,content:string){const root=outputRoot();await mkdir(root,{recursive:true});const realRoot=await realpath(root);const file=path.resolve(root,relative);if(!file.startsWith(root+path.sep))throw new Error('Output outside static root');await mkdir(path.dirname(file),{recursive:true});const realParent=await realpath(path.dirname(file));if(realParent!==realRoot&&!realParent.startsWith(realRoot+path.sep))throw new Error('Symlink escapes output root');const temp=file+'.'+randomUUID()+'.tmp';try{await writeFile(temp,content,{encoding:'utf8',flag:'wx'});await rename(temp,file);}catch(e){await unlink(temp).catch(()=>{});throw e;}return file;}
export async function removeRoute(route:string){const root=outputRoot(),relative=routeFile(route);const file=path.resolve(root,relative);try{const rp=await realpath(path.dirname(file));const rr=await realpath(root);if(rp!==rr&&!rp.startsWith(rr+path.sep))throw new Error('Unsafe output path');await unlink(file);}catch(e:any){if(e.code!=='ENOENT')throw e;}}
export async function removeSitemap(name:string){if(!/^sitemap-[a-z0-9-]+\.xml$/.test(name))throw new Error('Unsafe sitemap filename');const root=await realpath(outputRoot());try{await unlink(path.join(root,name));}catch(e:any){if(e.code!=='ENOENT')throw e;}}

````

## packages/publisher/src/index.ts

````ts
import { isDeepStrictEqual } from 'node:util';
import {access} from 'node:fs/promises';
import path from 'node:path';
import {outputRoot} from './files';
import { createHash } from 'node:crypto';
import type { Job } from 'bullmq';
import { pool,query,siteContext,type Document,type Row } from '@suns/domain';
import { renderHTML,systemDocument,siteCSS,siteJS,escape } from '@suns/ui';
import { writeAtomic,removeRoute,routeFile,removeSitemap } from './files';
const digest=(s:string)=>createHash('sha256').update(s).digest('hex');

async function writeDocument(doc:Document,jobId:string){
 const html=renderHTML(doc),checksum=digest(html),relative=routeFile(doc.route);
 await query(`INSERT INTO publish_job_routes(publish_job_id,route,action,status,started_at) VALUES($1,$2,'generate','processing',now()) ON CONFLICT(publish_job_id,route,action) DO UPDATE SET status='processing',started_at=now(),error_message=NULL`,[jobId,doc.route]);
 try{const prior=(await query("SELECT checksum FROM static_routes WHERE route=$1 AND status='active'",[doc.route]))[0];let exists=false;try{await access(path.join(outputRoot(),relative));exists=true;}catch{}if(prior?.checksum===checksum&&exists){await query("UPDATE publish_job_routes SET status='skipped',finished_at=now() WHERE publish_job_id=$1 AND route=$2 AND action='generate'",[jobId,doc.route]);return;}await writeAtomic(relative,html);await query(`INSERT INTO static_routes(locale_id,route,entity_type,entity_id,output_path,checksum,etag,status,last_generated_at,last_publish_job_id) VALUES($1,$2,$3,$4,$5,$6,$7,'active',now(),$8) ON CONFLICT(route) DO UPDATE SET locale_id=EXCLUDED.locale_id,entity_type=EXCLUDED.entity_type,entity_id=EXCLUDED.entity_id,output_path=EXCLUDED.output_path,checksum=EXCLUDED.checksum,etag=EXCLUDED.etag,status='active',last_generated_at=now(),last_publish_job_id=EXCLUDED.last_publish_job_id`,[doc.localeId,doc.route,doc.entityType,doc.entityId,relative,checksum,'"'+checksum+'"',jobId]);await query(`UPDATE publish_job_routes SET status='completed',finished_at=now() WHERE publish_job_id=$1 AND route=$2 AND action='generate'`,[jobId,doc.route]);}
 catch(error:any){await query(`UPDATE publish_job_routes SET status='failed',finished_at=now(),error_message=$3 WHERE publish_job_id=$1 AND route=$2 AND action='generate'`,[jobId,doc.route,error.message]);throw error;}
}
async function removePublished(route:string,jobId:string){await query(`INSERT INTO publish_job_routes(publish_job_id,route,action,status,started_at) VALUES($1,$2,'delete','processing',now()) ON CONFLICT(publish_job_id,route,action) DO UPDATE SET status='processing'`,[jobId,route]);await removeRoute(route);await query('DELETE FROM published_documents WHERE route=$1',[route]);await query("UPDATE static_routes SET status='removed',last_publish_job_id=$2 WHERE route=$1",[route,jobId]);await query(`UPDATE publish_job_routes SET status='completed',finished_at=now() WHERE publish_job_id=$1 AND route=$2 AND action='delete'`,[jobId,route]);}
async function store(doc:Document,jobId:string){const prior=(await query('SELECT snapshot FROM published_documents WHERE route=$1',[doc.route]))[0]?.snapshot;const clean=(v:any)=>{const x=JSON.parse(JSON.stringify(v));delete x.updatedAt;return x;};if(prior&&isDeepStrictEqual(clean(prior),clean(doc)))doc.updatedAt=prior.updatedAt;await writeDocument(doc,jobId);if(prior&&isDeepStrictEqual(prior,JSON.parse(JSON.stringify(doc))))return;await query(`INSERT INTO published_documents(route,locale_id,entity_type,entity_id,snapshot,job_id) VALUES($1,$2,$3,$4,$5,$6) ON CONFLICT(route) DO UPDATE SET locale_id=EXCLUDED.locale_id,entity_type=EXCLUDED.entity_type,entity_id=EXCLUDED.entity_id,snapshot=EXCLUDED.snapshot,published_at=now(),job_id=EXCLUDED.job_id`,[doc.route,doc.localeId,doc.entityType,doc.entityId,JSON.stringify(doc),jobId]);}
async function refreshSite(jobId:string){
 await writeAtomic('assets/site.css',siteCSS);await writeAtomic('assets/site.js',siteJS);
 const locales=await query('SELECT * FROM locales WHERE is_enabled ORDER BY sort_order');const changed:string[]=[];
 const disabled=await query('SELECT route FROM published_documents WHERE locale_id NOT IN(SELECT id FROM locales WHERE is_enabled)');for(const x of disabled){await removePublished(x.route,jobId);changed.push(x.route);}
 for(const locale of locales){const ctx=await siteContext(locale.id);const released=(await query("SELECT snapshot FROM published_documents WHERE locale_id=$1 AND entity_type<>'system' ORDER BY published_at DESC",[locale.id])).map(r=>r.snapshot as Document);
  const products=released.filter(d=>d.entityType==='product_translations'),content=released.filter(d=>d.entityType==='content_item_translations'&&['article','guide','case_study'].includes(d.contentType||''));const card=(d:Document)=>({route:d.route,title:d.title,description:d.description,media:d.media});
  for(const doc of released){Object.assign(doc,ctx);if(doc.entityType==='taxonomy_term_translations')doc.related=released.filter(d=>d.termIds?.includes(doc.groupId||'')).map(card);else doc.related=doc.related.filter(r=>released.some(d=>d.route===r.route));doc.alternates=(await query(`SELECT p.route AS path,l.code AS locale,l.hreflang FROM published_documents p JOIN locales l ON l.id=p.locale_id WHERE l.is_enabled AND p.entity_type=$1 AND (p.snapshot->>'groupId')=$2 ORDER BY l.sort_order`,[doc.entityType,(doc as any).groupId??doc.entityId]));if(!doc.alternates.length)doc.alternates=[{path:doc.route,locale:doc.locale,hreflang:locale.hreflang}];
   for(const b of doc.body){if(['product_grid','latest_articles'].includes(b.type)&&(!b.data.items?.length||b.data._autoItems)){const source=b.type==='product_grid'?products:content;b.data.items=source.filter(x=>x.route!==doc.route).slice(0,Math.min(24,Number(b.data.limit)||6)).map(card);b.data._autoItems=true;}}
   await store(doc,jobId);changed.push(doc.route);
  }
  const zh=locale.code==='zh',prefix='/'+locale.code;const auto:Document[]=[];
  auto.push(systemDocument(locale,ctx,prefix,ctx.site.site_title||ctx.site.site_name,[{type:'product_grid',data:{title:zh?'为您的应用选择合适产品':'Glassware for your application',items:products.slice(0,6).map(card)}},{type:'latest_articles',data:{title:zh?'技术与应用知识':'Technical knowledge',items:content.filter(x=>x.route!==prefix).slice(0,3).map(card)}},{type:'cta',data:{title:zh?'一起讨论您的需求':'Tell us what you need',label:zh?'联系我们':'Contact our team',url:prefix+'/contact'}}]));
  for(const [name,docs,title] of [['products',products,zh?'产品中心':'Products'],['blog',content.filter(x=>x.route!==prefix),zh?'知识中心':'Knowledge']] as [string,Document[],string][]){const count=Math.max(1,Math.ceil(docs.length/24));for(let page=0;page<count;page++){const route=prefix+'/'+name+(page?'/page/'+(page+1):'');const body:any[]=[{type:'product_grid',data:{title,items:docs.slice(page*24,(page+1)*24).map(card)}}];if(page>0)body.push({type:'cta',data:{title:zh?'上一页':'Previous page',label:'←',url:prefix+'/'+name+(page===1?'':'/page/'+page)}});if(page+1<count)body.push({type:'cta',data:{title:zh?'下一页':'Next page',label:'→',url:prefix+'/'+name+'/page/'+(page+2)}});auto.push(systemDocument(locale,ctx,route,title,body));}}
  auto.push(systemDocument(locale,ctx,prefix+'/contact',zh?'联系我们':'Contact',[{type:'contact_form',data:{title:zh?'说说您的项目':'Let’s discuss your project'}}]));
  auto.push(systemDocument(locale,ctx,prefix+'/search',zh?'站内搜索':'Search',[{type:'search',data:{}}]));
  const paths=new Set(released.map(x=>x.route));const wanted=new Set(auto.filter(x=>!paths.has(x.route)).map(x=>x.route));const previous=await query("SELECT route FROM published_documents WHERE locale_id=$1 AND entity_type='system'",[locale.id]);for(const old of previous)if(!wanted.has(old.route)&&!paths.has(old.route)){await removePublished(old.route,jobId);changed.push(old.route);}
  for(const doc of auto){if(doc.route.endsWith('/search'))doc.seo.robots_index=false;if(paths.has(doc.route))continue;const suffix=doc.route.slice(prefix.length);doc.alternates=locales.map(l=>({locale:l.code,hreflang:l.hreflang,path:'/'+l.code+suffix}));await store(doc,jobId);changed.push(doc.route);}
 }
 const all=(await query('SELECT snapshot FROM published_documents')).map(r=>r.snapshot as Document);const live=new Set(all.map(d=>d.route));for(const doc of all){const valid=doc.alternates.filter(a=>live.has(a.path));if(valid.length!==doc.alternates.length){doc.alternates=valid;await store(doc,jobId);}}
 await writeSitemaps(jobId);return changed;
}
async function writeSitemaps(jobId:string){
 const pages=await query(`SELECT route,locale_id,snapshot,published_at FROM published_documents WHERE coalesce((snapshot->'seo'->>'robots_index')::boolean,true) AND coalesce((snapshot->'site'->>'enable_indexing')::boolean,false) ORDER BY locale_id,route`);const groups=new Map<string,Row[]>();for(const p of pages){if(p.route.endsWith('/search'))continue;const k=p.snapshot.locale+'-'+(p.snapshot.entityType==='product_translations'?'products':'pages');groups.set(k,[...(groups.get(k)||[]),p]);}
 const files:string[]=[];let origin=process.env.NEXT_PUBLIC_SITE_URL||'http://localhost:3000';
 for(const [key,rows] of groups)for(let offset=0;offset<rows.length;offset+=45000){const shard=rows.slice(offset,offset+45000),name='sitemap-'+key+'-'+(offset/45000+1)+'.xml';origin=shard[0].snapshot.site.primary_domain;const xml='<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">'+shard.map(p=>'<url><loc>'+escape(new URL(p.route,p.snapshot.site.primary_domain).href)+'</loc><lastmod>'+new Date(p.snapshot.updatedAt).toISOString()+'</lastmod>'+(p.snapshot.alternates||[]).map((a:Row)=>'<xhtml:link rel="alternate" hreflang="'+escape(a.hreflang)+'" href="'+escape(new URL(a.path,p.snapshot.site.primary_domain).href)+'"/>').join('')+'</url>').join('')+'</urlset>';await writeAtomic(name,xml);files.push(name);await query(`INSERT INTO sitemap_files(locale_id,content_type,file_path,url_count,last_generated_at,checksum,status) VALUES($1,$2,$3,$4,now(),$5,'completed') ON CONFLICT(file_path) DO UPDATE SET url_count=EXCLUDED.url_count,last_generated_at=now(),checksum=EXCLUDED.checksum,status='completed'`,[shard[0].locale_id,key+'-'+offset,name,shard.length,digest(xml)]);}
 const previousMaps=await query('SELECT file_path FROM sitemap_files');for(const old of previousMaps)if(!files.includes(old.file_path)){await removeSitemap(old.file_path);await query('DELETE FROM sitemap_files WHERE file_path=$1',[old.file_path]);}
 const index='<?xml version="1.0" encoding="UTF-8"?><sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'+files.map(f=>'<sitemap><loc>'+escape(new URL('/'+f,origin).href)+'</loc></sitemap>').join('')+'</sitemapindex>';await writeAtomic('sitemap.xml',index);
 const rules=await query('SELECT * FROM robots_rules WHERE is_enabled AND environment=$1 ORDER BY sort_order',[process.env.DEPLOYMENT_ENV||'development']);const indexing=await query('SELECT enable_indexing FROM site_settings LIMIT 1');let robots='User-agent: *\n'+(process.env.DEPLOYMENT_ENV==='production'&&indexing[0]?.enable_indexing?'Allow: /':'Disallow: /')+'\n';if(process.env.DEPLOYMENT_ENV==='production'&&indexing[0]?.enable_indexing)for(const r of rules)if(!/[\r\n]/.test(r.user_agent+r.path))robots+='\nUser-agent: '+r.user_agent+'\n'+r.directive[0].toUpperCase()+r.directive.slice(1)+': '+r.path+'\n';robots+='\nSitemap: '+new URL('/sitemap.xml',origin).href+'\n';await writeAtomic('robots.txt',robots);
 const redirects=await query('SELECT source_path,target_url,redirect_type FROM redirects WHERE is_enabled');await writeAtomic('_redirects.json',JSON.stringify(redirects));await writeAtomic('manifest.json',JSON.stringify({generatedAt:new Date().toISOString(),jobId,sitemaps:files}));
}
async function purge(paths:string[],jobId:string){
 if(!process.env.CLOUDFLARE_ZONE_ID&&!process.env.CLOUDFLARE_API_TOKEN)return;
 if(!process.env.CLOUDFLARE_ZONE_ID||!process.env.CLOUDFLARE_API_TOKEN)throw new Error('Cloudflare requires both zone ID and token');
 const site=(await query('SELECT primary_domain FROM site_settings LIMIT 1'))[0];const origin=site?.primary_domain||process.env.NEXT_PUBLIC_SITE_URL;
 const sitemapPaths=(await query('SELECT file_path FROM sitemap_files')).map(r=>'/'+r.file_path);
 const urls=[...new Set([...paths,...sitemapPaths,'/sitemap.xml','/robots.txt','/assets/site.css','/assets/site.js'].flatMap(p=>[new URL(p,origin).href,...(p.includes('.')?[]:[new URL(p+'/',origin).href])]))];
 for(let i=0;i<urls.length;i+=30){const batch=urls.slice(i,i+30);const log=(await query(`INSERT INTO cdn_purge_logs(publish_job_id,provider,paths) VALUES($1,'cloudflare',$2) RETURNING id`,[jobId,JSON.stringify(batch)]))[0];try{const res=await fetch('https://api.cloudflare.com/client/v4/zones/'+process.env.CLOUDFLARE_ZONE_ID+'/purge_cache',{method:'POST',headers:{Authorization:'Bearer '+process.env.CLOUDFLARE_API_TOKEN,'Content-Type':'application/json'},body:JSON.stringify({files:batch}),signal:AbortSignal.timeout(20000)});const data=await res.json() as Row;if(!res.ok||!data.success)throw new Error('Cloudflare purge failed: '+res.status);await query("UPDATE cdn_purge_logs SET status='completed',completed_at=now(),provider_response=$2 WHERE id=$1",[log.id,JSON.stringify(data)]);}catch(error:any){await query("UPDATE cdn_purge_logs SET status='failed',completed_at=now(),provider_response=$2 WHERE id=$1",[log.id,JSON.stringify({error:error.message})]);throw error;}}
}
export async function processPublishJob(job:Job){
 const jobId=String(job.data.jobId);const lock=await pool.connect();let started=false;
 try{await lock.query('SELECT pg_advisory_lock(837611,1)');let task=(await query('SELECT * FROM publish_jobs WHERE id=$1',[jobId]))[0];if(!task)throw new Error('Publish job not found');if(['completed','cancelled'].includes(task.status))return {status:task.status};if(task.attempt_count>=task.max_attempts)throw new Error('Publish attempts exhausted');if(task.scheduled_at&&new Date(task.scheduled_at).getTime()>Date.now()+1000)throw new Error('Publish is not due');
  task=(await query("UPDATE publish_jobs SET status='processing',attempt_count=attempt_count+1,started_at=now(),finished_at=NULL,error_message=NULL WHERE id=$1 AND status IN('pending','retrying','processing') RETURNING *",[jobId]))[0];if(!task)return {status:'cancelled'};started=true;const changed:string[]=[];
  if(task.entity_type!=='site'){
   if(!['content_item_translations','product_translations','taxonomy_term_translations'].includes(task.entity_type))throw new Error('Unsupported entity type');
   const old=await query('SELECT route FROM published_documents WHERE entity_type=$1 AND entity_id=$2',[task.entity_type,task.entity_id]);
   const doc=task.metadata.snapshot as Document|undefined;
   if(task.job_type==='unpublish'){for(const item of old){await removePublished(item.route,jobId);changed.push(item.route);}if(task.entity_type!=='taxonomy_term_translations'){const status=task.entity_type==='product_translations'?'publish_status':'status';await query(`UPDATE ${task.entity_type} SET ${status}='draft',scheduled_at=NULL WHERE id=$1`,[task.entity_id]);}}
   else{if(!doc)throw new Error('Publish snapshot missing');const live=(await query(`SELECT * FROM ${task.entity_type} WHERE id=$1`,[task.entity_id]))[0];if(!live||live.deleted_at)throw new Error('Content was removed');if(live.path!==doc.route)throw new Error('Path changed after scheduling. Submit a new publish request.');for(const item of old)if(item.route!==doc.route){await removePublished(item.route,jobId);changed.push(item.route);}await store(doc,jobId);changed.push(doc.route);if(task.entity_type!=='taxonomy_term_translations'){const status=task.entity_type==='product_translations'?'publish_status':'status';await query(`UPDATE ${task.entity_type} SET ${status}='published',published_at=now(),scheduled_at=NULL WHERE id=$1`,[task.entity_id]);}}
  }
  changed.push(...await refreshSite(jobId));const written=await query("SELECT route FROM publish_job_routes WHERE publish_job_id=$1 AND status='completed'",[jobId]);await purge(written.map(r=>r.route),jobId);await query("UPDATE publish_jobs SET status='completed',finished_at=now(),error_message=NULL WHERE id=$1",[jobId]);return {routes:changed.length,status:'completed'};
 }catch(error:any){if(started)await query("UPDATE publish_jobs SET status=CASE WHEN attempt_count>=max_attempts THEN 'failed' ELSE 'retrying' END,error_message=$2,finished_at=now() WHERE id=$1",[jobId,String(error.message).slice(0,4000)]);throw error;}
 finally{await lock.query('SELECT pg_advisory_unlock(837611,1)').catch(()=>{});lock.release();}
}

````

## packages/publisher/tsconfig.json

````json
{"extends":"../../tsconfig.base.json","include":["src/**/*.ts"]}

````

## packages/ui/package.json

````json
{"name":"@suns/ui","version":"1.0.0","private":true,"type":"module","exports":"./src/index.ts","scripts":{"typecheck":"tsc --noEmit"},"dependencies":{"@suns/domain":"workspace:*","sanitize-html":"^2.17.0"},"devDependencies":{"@types/sanitize-html":"^2.16.0","typescript":"^5.9.2"}}

````

## packages/ui/src/browser.ts

````ts
export const siteJS=String.raw`
(()=>{'use strict';
 function analytics(){const box=document.querySelector('[data-analytics]');if(!box||box.dataset.ready)return;box.dataset.ready='1';let choice;try{choice=localStorage.getItem('suns_analytics');}catch{}function load(){if(window.gtag)return;const id=box.dataset.analytics;if(!/^G-[A-Z0-9]+$/.test(id))return;window.dataLayer=window.dataLayer||[];window.gtag=function(){window.dataLayer.push(arguments)};window.gtag('js',new Date());window.gtag('config',id,{anonymize_ip:true});const script=document.createElement('script');script.async=true;script.src='https://www.googletagmanager.com/gtag/js?id='+id;document.head.append(script);}if(choice==='yes')load();else if(!choice)box.hidden=false;box.addEventListener('click',e=>{const button=e.target.closest('[data-analytics-choice]');if(!button)return;choice=button.dataset.analyticsChoice;try{localStorage.setItem('suns_analytics',choice);}catch{}box.hidden=true;if(choice==='yes')load();});}
 function service(){const widget=document.querySelector('.service-widget[data-locale]');if(!widget||widget.dataset.ready)return;widget.dataset.ready='1';fetch('/api/v1/service?locale='+encodeURIComponent(widget.dataset.locale)).then(r=>r.ok?r.json():null).then(data=>{if(!data)return;const panel=widget.querySelector('div');panel.replaceChildren();for(const c of data.channels){const a=document.createElement('a');a.textContent=c.name+(c.available?'':' · Offline');a.href=typeof c.url==='string'&&/^(https?:\/\/|mailto:|tel:|\/(?!\/))/.test(c.url)&&!/[\u0000-\u0020\\]/.test(c.url)?c.url:'/'+widget.dataset.locale+'/contact';a.rel='noopener noreferrer';panel.append(a);if(c.welcome_text){const p=document.createElement('p');p.textContent=c.welcome_text;panel.append(p);}}widget.hidden=!data.channels.length;}).catch(()=>{});}
 function init(){analytics();service();document.querySelectorAll('[data-carousel]:not([data-ready])').forEach(root=>{root.dataset.ready='1';const slides=[...root.querySelectorAll('.slide')];if(slides.length<2)return;let current=0,paused=matchMedia('(prefers-reduced-motion: reduce)').matches,startX=0,timer;function show(i){slides[current].hidden=true;current=(i+slides.length)%slides.length;slides[current].hidden=false;root.querySelector('[data-slide-count]').textContent=String(current+1).padStart(2,'0')+' / '+String(slides.length).padStart(2,'0');schedule();}function schedule(){clearTimeout(timer);if(!paused&&root.isConnected)timer=setTimeout(()=>{if(root.isConnected&&!document.hidden)show(current+1);else schedule();},Math.min(60000,Math.max(1000,Number(slides[current].dataset.duration)||6000)));}root.querySelector('[data-next]').onclick=()=>show(current+1);root.querySelector('[data-prev]').onclick=()=>show(current-1);root.querySelector('[data-pause]').onclick=()=>{paused=!paused;root.querySelector('[data-pause]').textContent=paused?'▶':'Ⅱ';schedule();};root.addEventListener('keydown',e=>{if(e.key==='ArrowRight'){e.preventDefault();show(current+1);}if(e.key==='ArrowLeft'){e.preventDefault();show(current-1);}});root.addEventListener('touchstart',e=>startX=e.touches[0].clientX,{passive:true});root.addEventListener('touchend',e=>{const delta=e.changedTouches[0].clientX-startX;if(Math.abs(delta)>55)show(current+(delta<0?1:-1));},{passive:true});root.addEventListener('focusin',()=>{paused=true;clearTimeout(timer);});schedule();});}
 document.addEventListener('click',e=>{const toggle=e.target.closest('.nav-toggle');if(toggle){const nav=document.getElementById('main-nav');const open=nav.classList.toggle('open');toggle.setAttribute('aria-expanded',String(open));}});
 document.addEventListener('submit',async e=>{const form=e.target;if(form.matches('.inquiry-form')){e.preventDefault();const button=form.querySelector('button[type=submit]'),status=form.querySelector('.form-result');if(button.disabled)return;button.disabled=true;status.textContent='Sending…';try{const fields=new FormData(form),body=Object.fromEntries(fields);body.key=form.dataset.key||(form.dataset.key=crypto.randomUUID());body.locale=form.dataset.locale;body.consent=fields.get('consent')==='on';body.source_url=location.href;body.inquiry_type=form.dataset.product?'rfq':'contact';if(form.dataset.product)body.items=[{product_id:form.dataset.product,quantity:Number(fields.get('quantity')||1)}];delete body.quantity;const params=new URLSearchParams(location.search);['utm_source','utm_medium','utm_campaign','utm_term','utm_content'].forEach(k=>{if(params.has(k))body[k]=params.get(k);});const res=await fetch('/api/v1/inquiries',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});const result=await res.json();if(!res.ok)throw new Error(result.error||'Please try again.');status.textContent=(form.dataset.locale==='zh'?'询盘已收到，编号：':'Inquiry received. Reference: ')+(result.inquiry_number||'');form.reset();delete form.dataset.key;}catch(error){status.textContent=error.message;}finally{button.disabled=false;}}
 if(form.matches('.search-form')){e.preventDefault();const area=form.parentElement.querySelector('.search-results'),q=new FormData(form).get('q');area.textContent='Searching…';try{const res=await fetch('/api/v1/search?locale='+encodeURIComponent(form.dataset.locale)+'&q='+encodeURIComponent(q));const result=await res.json();if(!res.ok)throw new Error(result.error);area.textContent='';result.rows.forEach(row=>{const article=document.createElement('article'),h=document.createElement('h3'),a=document.createElement('a'),p=document.createElement('p');a.textContent=row.title;a.href=row.route.startsWith('/')&&!row.route.startsWith('//')?row.route:'#';p.textContent=row.description;h.append(a);article.append(h,p);area.append(article);});if(!result.rows.length)area.textContent=form.dataset.locale==='zh'?'未找到相关内容':'No matching content.';}catch(error){area.textContent=error.message;}}
 });
 new MutationObserver(init).observe(document.documentElement,{childList:true,subtree:true});init();
})();
`;

````

## packages/ui/src/index.ts

````ts
import sanitize from 'sanitize-html';
import type { Document,Row,Block } from '@suns/domain/types';
export {siteCSS} from './styles';
export {siteJS} from './browser';
import {siteCSS} from './styles';
export const escape=(v:unknown)=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));
export function safeURL(v:unknown,fallback='#'){if(typeof v!=='string'||/[\u0000-\u0020\\]/.test(v))return fallback;if(v.startsWith('/')&&!v.startsWith('//'))return v;if(/^https?:\/\//i.test(v)||/^mailto:[^@]+@[^@]+$/i.test(v)||/^tel:[+\d()-]+$/i.test(v))return v;return fallback;}
const words:Record<string,string[]>={en:['Products','Knowledge','About us','Contact','Request a quote','Search','Name','Email','Company','Message','Send inquiry','I agree to be contacted about this inquiry.','Specifications','Downloads','Related products','Frequently asked questions','References'],zh:['产品','知识中心','关于我们','联系我们','获取报价','搜索','姓名','邮箱','公司','需求描述','提交询盘','我同意就此询盘与我联系。','技术参数','资料下载','相关产品','常见问题','参考资料'],de:['Produkte','Wissen','Über uns','Kontakt','Angebot anfordern','Suchen','Name','E-Mail','Unternehmen','Nachricht','Anfrage senden','Ich stimme der Kontaktaufnahme zu dieser Anfrage zu.','Spezifikationen','Downloads','Ähnliche Produkte','Häufige Fragen','Quellen'],fr:['Produits','Ressources','À propos','Contact','Demander un devis','Rechercher','Nom','E-mail','Entreprise','Message','Envoyer','J’accepte d’être contacté pour cette demande.','Spécifications','Documents','Produits associés','Questions fréquentes','Références'],es:['Productos','Recursos','Nosotros','Contacto','Solicitar presupuesto','Buscar','Nombre','Correo','Empresa','Mensaje','Enviar consulta','Acepto ser contactado sobre esta consulta.','Especificaciones','Descargas','Productos relacionados','Preguntas frecuentes','Referencias'],it:['Prodotti','Risorse','Chi siamo','Contatti','Richiedi preventivo','Cerca','Nome','Email','Azienda','Messaggio','Invia richiesta','Acconsento a essere contattato per questa richiesta.','Specifiche','Documenti','Prodotti correlati','Domande frequenti','Riferimenti'],pt:['Produtos','Recursos','Sobre nós','Contato','Solicitar orçamento','Buscar','Nome','E-mail','Empresa','Mensagem','Enviar consulta','Aceito ser contatado sobre esta consulta.','Especificações','Downloads','Produtos relacionados','Perguntas frequentes','Referências'],ja:['製品','資料','会社情報','お問い合わせ','見積もり依頼','検索','氏名','メール','会社名','メッセージ','送信','この問い合わせへの連絡に同意します。','仕様','ダウンロード','関連製品','よくある質問','参考資料'],ko:['제품','자료','회사 소개','문의','견적 요청','검색','이름','이메일','회사','메시지','문의 보내기','이 문의에 대한 연락에 동의합니다.','사양','자료 다운로드','관련 제품','자주 묻는 질문','참고 자료']};
const t=(d:Document,i:number)=>(words[d.locale]||words.en)[i];
const p=(v:unknown)=>escape(v).split(/\n\s*\n/).map(x=>'<p>'+x.replaceAll('\n','<br>')+'</p>').join('');
const heading=(v:unknown)=>v?'<h2>'+escape(v)+'</h2>':'';
function image(m:Row,priority=false){const src=safeURL(m.url||m.image||m.src||m.desktopURL,'');if(!src)return '';const variants=Array.isArray(m.variants)?m.variants:[];const sources=['avif','webp'].map(format=>{const items=variants.filter((v:Row)=>v.format===format);return items.length?'<source type="image/'+format+'" srcset="'+items.map((v:Row)=>escape(safeURL(v.url))+' '+Number(v.width)+'w').join(', ')+'" sizes="(max-width:650px) 100vw, 50vw">':'';}).join('');return `<picture>${sources}<img src="${escape(src)}" alt="${escape(m.alt_text||m.alt||'')}" ${m.width?'width="'+Number(m.width)+'"':''} ${m.height?'height="'+Number(m.height)+'"':''} loading="${priority?'eager':'lazy'}" decoding="async" ${priority?'fetchpriority="high"':''}></picture>`;}
function cards(items:Row[]=[]){return '<div class="cards">'+items.map((item,i)=>`<article class="card">${image(item.media?.[0]||{url:item.image,alt:item.title})}<span class="serial">${String(i+1).padStart(2,'0')}</span><h3><a href="${escape(safeURL(item.route||item.url))}">${escape(item.title||item.name)}</a></h3>${p(item.description||item.text||'')}<a class="card-arrow" aria-label="${escape(item.title||item.name)}" href="${escape(safeURL(item.route||item.url))}">↗</a></article>`).join('')+'</div>';}
function inquiry(d:Document){return `<form class="inquiry-form" data-locale="${escape(d.locale)}" ${d.product?'data-product="'+escape(d.product.id)+'"':''}><div class="form-grid"><label>${t(d,6)}<input name="name" maxlength="160" autocomplete="name" required></label><label>${t(d,7)}<input name="email" type="email" maxlength="254" autocomplete="email" required></label><label>${t(d,8)}<input name="company" maxlength="200" autocomplete="organization"></label><label>${d.locale==='zh'?'电话':'Phone'}<input name="phone" type="tel" maxlength="80" autocomplete="tel"></label>${d.product?'<label>Quantity<input name="quantity" type="number" min="0.001" step="any" value="1" required></label>':''}</div><label>${t(d,9)}<textarea name="message" minlength="5" maxlength="10000" rows="5" required></textarea></label><label class="trap" aria-hidden="true">Website<input name="website" tabindex="-1" autocomplete="off"></label><label class="consent"><input name="consent" type="checkbox" required> ${t(d,11)}</label><button class="button" type="submit">${t(d,10)} <span>↗</span></button><p class="form-result" role="status" aria-live="polite"></p></form>`;}
function hero(d:Document){const slides=d.heroes.length?d.heroes:[{title:d.title,description:d.description,primary_button_text:t(d,4),primary_button_url:'/'+d.locale+'/contact'}];return `<section class="hero" data-carousel tabindex="0" aria-roledescription="carousel"><div class="hero-grid" aria-hidden="true"></div>${slides.map((s,i)=>`<article class="slide ${i===0?'is-active':''}" ${i?'hidden':''} data-duration="${Number(s.duration_ms)||6000}" style="--overlay:${Number(s.overlay_opacity)||0.25}">${s.desktopURL?`<picture>${s.mobileURL?'<source media="(max-width:640px)" srcset="'+escape(safeURL(s.mobileURL))+'">':''}${image({url:s.desktopURL,alt:s.subtitle},i===0).replace('<picture>','').replace('</picture>','')}</picture>`:''}<div class="slide-copy ${escape(s.text_position||'left')}"><p class="kicker">${escape(s.subtitle||d.site.site_title||d.site.site_name)}</p><${i?'h2':'h1'}>${escape(s.title)}</${i?'h2':'h1'}>${p(s.description||'')}<div class="hero-actions">${s.primary_button_text?`<a class="button" href="${escape(safeURL(s.primary_button_url))}">${escape(s.primary_button_text)} ↗</a>`:''}${s.secondary_button_text?`<a class="text-link" href="${escape(safeURL(s.secondary_button_url))}">${escape(s.secondary_button_text)} →</a>`:''}</div></div></article>`).join('')}${slides.length>1?'<div class="hero-controls"><button type="button" data-prev aria-label="Previous slide">←</button><span data-slide-count>01 / '+String(slides.length).padStart(2,'0')+'</span><button type="button" data-pause aria-label="Pause slideshow">Ⅱ</button><button type="button" data-next aria-label="Next slide">→</button></div>':''}<span class="hero-note">SUNS / GLASS & PRECISION</span></section>`;}
function block(b:Block,d:Document):string{const a=b.data||{};const type=b.type;const items=Array.isArray(a.items)?a.items:[];
 if(['hero','hero_banner','hero_slider'].includes(type))return `<section class="section banner">${heading(a.title)}${p(a.text||a.description||'')}${image(a)}${a.url?'<a class="button" href="'+escape(safeURL(a.url))+'">'+escape(a.label||t(d,4))+'</a>':''}</section>`;
 if(type==='rich_text')return `<section class="section prose">${heading(a.title)}${a.html?sanitize(String(a.html),{allowedTags:['p','h2','h3','h4','strong','em','ul','ol','li','a','blockquote','table','thead','tbody','tr','td','th','br'],allowedAttributes:{a:['href','title','rel']},allowedSchemes:['https','http','mailto']}):p(a.text||'')}</section>`;
 if(type==='image_text')return `<section class="section split">${image(a)}<div>${heading(a.title)}${p(a.text||a.description)}${a.url?'<a class="text-link" href="'+escape(safeURL(a.url))+'">'+escape(a.label||'Learn more')+' →</a>':''}</div></section>`;
 if(['product_grid','category_grid','application_grid','case_studies','latest_articles','feature_grid'].includes(type))return `<section class="section">${heading(a.title)}${p(a.description||'')}${cards(items)}</section>`;
 if(['statistics','timeline'].includes(type))return `<section class="section"><div class="${type}">${items.map(x=>`<article><strong>${escape(x.value||x.year||x.title)}</strong><p>${escape(x.label||x.text||'')}</p></article>`).join('')}</div></section>`;
 if(['technical_specs','comparison_table'].includes(type))return `<section class="section">${heading(a.title)}<div class="table-scroll"><table>${Array.isArray(a.headers)?'<thead><tr>'+a.headers.map((h:unknown)=>'<th>'+escape(h)+'</th>').join('')+'</tr></thead>':''}<tbody>${(a.rows||items).map((r:any)=>'<tr>'+(Array.isArray(r)?r:[r.name,r.value]).map((v:any)=>'<td>'+escape(v)+'</td>').join('')+'</tr>').join('')}</tbody></table></div></section>`;
 if(type==='faq')return `<section class="section faq">${heading(a.title||t(d,15))}${(items.length?items:d.faqs).map(x=>`<details><summary>${escape(x.question)}</summary>${p(x.answer)}</details>`).join('')}</section>`;
 if(type==='video')return `<section class="section">${heading(a.title)}<video controls preload="metadata" src="${escape(safeURL(a.url))}" ${a.poster?'poster="'+escape(safeURL(a.poster))+'"':''}>${escape(a.title)}</video></section>`;
 if(type==='downloads')return `<section class="section downloads">${heading(a.title||t(d,13))}${(items.length?items:d.documents).map(x=>`<a href="${escape(safeURL(x.media_id?'/api/v1/download/'+x.media_id+'?locale='+d.locale:x.url))}">${escape(x.title||x.name)} <span>↓</span></a>`).join('')}</section>`;
 if(type==='testimonials')return `<section class="section testimonials">${items.map(x=>`<blockquote>${p(x.quote||x.text)}<cite>${escape(x.author||x.name)}</cite></blockquote>`).join('')}</section>`;
 if(type==='cta')return `<section class="section cta">${heading(a.title)}${p(a.text||'')}<a class="button" href="${escape(safeURL(a.url||'/'+d.locale+'/contact'))}">${escape(a.label||t(d,4))} ↗</a></section>`;
 if(type==='contact_form')return `<section id="inquiry" class="section contact"><div><p class="kicker">${t(d,3)}</p>${heading(a.title||t(d,4))}${p(a.text||'')}</div>${inquiry(d)}</section>`;
 if(type==='search')return `<section class="section"><form class="search-form" data-locale="${escape(d.locale)}"><label>${t(d,5)}<input type="search" name="q" maxlength="150" required></label><button class="button">${t(d,5)} →</button></form><div class="search-results" aria-live="polite"></div></section>`;
 return `<section class="section">${heading(a.title)}${p(a.text||'')}</section>`;
}
function menu(d:Document){const available=d.menus.filter(x=>['header','main_header','main'].includes(x.location)||x.code==='main_header');const render=(parent:string|null,level=0):string=>level>5?'':available.filter(x=>(x.parent_id||null)===parent).map(m=>`<li><a ${m.target==='_blank'?'target="_blank" rel="noopener noreferrer"':''} href="${escape(safeURL(m.url))}">${escape(m.label)}</a>${render(m.id,level+1)?'<ul>'+render(m.id,level+1)+'</ul>':''}</li>`).join('');return available.length?render(null):[t(d,0),t(d,1),t(d,3)].map((text,i)=>`<li><a href="/${d.locale}/${['products','blog','contact'][i]}">${text}</a></li>`).join('');}
export function schemaFor(d:Document){if(d.schema?.schema_json&&Object.keys(d.schema.schema_json).length)return {...d.schema.schema_json,...d.schema.override_json};const url=new URL(d.route,d.site.primary_domain).href;return {'@context':'https://schema.org','@graph':[
 {'@type':'Organization','@id':d.site.primary_domain+'/#organization',name:d.site.company_name||d.site.site_name,url:d.site.primary_domain},
 d.product?{'@type':'Product',name:d.title,description:d.description,sku:d.product.sku,url,image:d.media.map(m=>new URL(m.url,d.site.primary_domain).href)}:{'@type':['article','guide','case_study'].includes(d.contentType||'')?'Article':'WebPage',headline:d.title,name:d.title,description:d.description,url,dateModified:d.updatedAt,inLanguage:d.locale},
 {'@type':'BreadcrumbList',itemListElement:[{'@type':'ListItem',position:1,name:d.site.site_name,item:new URL('/'+d.locale,d.site.primary_domain).href},{'@type':'ListItem',position:2,name:d.title,item:url}]},
 ...(d.faqs.length?[{'@type':'FAQPage',mainEntity:d.faqs.map(f=>({'@type':'Question',name:f.question,acceptedAnswer:{'@type':'Answer',text:f.answer}}))}]:[])
 ]};}
export function bodyHTML(d:Document){const home=d.route==='/'+d.locale;const footer=d.menus.filter(m=>m.location==='footer');return `${/^G-[A-Z0-9]+$/.test(d.site.ga_measurement_id||'')?'<div data-analytics="'+escape(d.site.ga_measurement_id)+'" class="analytics-consent" hidden><p>'+(d.locale==='zh'?'允许匿名访问统计？':'Allow anonymous usage analytics?')+'</p><button type="button" data-analytics-choice="yes">'+(d.locale==='zh'?'允许':'Allow')+'</button><button type="button" data-analytics-choice="no">'+(d.locale==='zh'?'拒绝':'Decline')+'</button></div>':''}<a class="skip-link" href="#content">Skip to content</a><header class="site-header"><a class="wordmark" href="/${escape(d.locale)}">${escape(d.site.site_name||'SUNS')}<small>GLASSWARE</small></a><button class="nav-toggle" aria-expanded="false" aria-controls="main-nav" aria-label="Open navigation">☰</button><nav id="main-nav" aria-label="Main navigation"><ul>${menu(d)}</ul></nav><div class="header-tools"><a href="/${d.locale}/search" aria-label="${t(d,5)}">⌕</a><details class="language"><summary>${escape(d.locale.toUpperCase())}</summary><ul>${d.alternates.map(l=>`<li><a href="${escape(l.path)}" hreflang="${escape(l.hreflang)}">${escape(l.locale.toUpperCase())}</a></li>`).join('')}</ul></details><a class="quote-link" href="/${d.locale}/contact">${t(d,4)} ↗</a></div></header><main id="content">${home?hero(d):`<section class="page-title"><p class="kicker">${escape(d.site.site_name)}</p><h1>${escape(d.title)}</h1>${p(d.description)}</section>`}
 ${d.product?`<section class="section product-lead"><div class="product-gallery">${d.media.map((m,i)=>image(m,i===0)).join('')||'<div class="no-image">'+escape(d.product.sku||'')+'</div>'}</div><div><p class="kicker">${escape(d.product.brand||d.site.site_name)}</p><h2>${escape(d.title)}</h2><p class="sku">SKU · ${escape(d.product.sku)}</p>${p(d.product.description||d.description)}${Array.isArray(d.product.features)?'<ul class="features">'+d.product.features.map((f:any)=>'<li>'+escape(typeof f==='string'?f:f.text||f.title)+'</li>').join('')+'</ul>':''}<a class="button" href="#inquiry">${t(d,4)} ↗</a></div></section>${d.product.specs?.length?block({type:'technical_specs',data:{title:t(d,12),rows:d.product.specs.map((s:Row)=>[s.name,[s.value_text??s.value_number??s.value_boolean,s.unit].filter(x=>x!=null).join(' ')])}},d):''}`:''}
 ${d.body.map(b=>block(b,d)).join('')}
 ${d.geo.short_answer?`<section class="section knowledge"><p class="kicker">${escape(d.geo.entity_name||d.title)}</p>${heading(d.locale==='zh'?'核心知识':'Key knowledge')}${p(d.geo.short_answer)}${p(d.geo.definition||'')}<dl>${(d.geo.facts||[]).map((f:Row)=>'<div><dt>'+escape(f.fact_key)+'</dt><dd>'+escape(f.fact_value)+'</dd></div>').join('')}</dl>${d.geo.references?.length?heading(t(d,16))+'<ol>'+d.geo.references.map((r:Row)=>'<li><a href="'+escape(safeURL(r.source_url))+'" rel="noopener noreferrer">'+escape(r.title)+'</a> '+escape(r.publisher||'')+'</li>').join('')+'</ol>':''}</section>`:''}
 ${d.faqs.length&&!d.body.some(b=>b.type==='faq')?block({type:'faq',data:{}},d):''}${d.documents.length?block({type:'downloads',data:{}},d):''}${d.related.length?block({type:'product_grid',data:{title:t(d,14),items:d.related}},d):''}${d.product?block({type:'contact_form',data:{title:t(d,4)}},d):''}
 </main><footer class="site-footer"><div><strong>${escape(d.site.site_name)}</strong>${p(d.site.footer_description||d.site.company_description||'')}</div><div><h2>${t(d,3)}</h2>${d.site.company_email?'<a href="mailto:'+escape(d.site.company_email)+'">'+escape(d.site.company_email)+'</a>':''}${d.site.company_phone?'<p>'+escape(d.site.company_phone)+'</p>':''}</div><div>${footer.map(m=>'<a href="'+escape(safeURL(m.url))+'">'+escape(m.label)+'</a>').join('')}</div><small>${escape(d.site.copyright_text||'© '+new Date().getFullYear()+' '+d.site.site_name)}</small></footer>
 ${d.channels.length?'<details class="service-widget" data-locale="'+escape(d.locale)+'"><summary>'+t(d,3)+' ↗</summary><div>'+d.channels.map(c=>{const cfg=c.config||{};const target=c.channel_type==='email'?'mailto:'+cfg.email:c.channel_type==='phone'?'tel:'+cfg.phone:c.channel_type==='whatsapp'?'https://wa.me/'+String(cfg.phone||'').replace(/\D/g,''):cfg.url;return '<a href="'+escape(safeURL(target,'/'+d.locale+'/contact'))+'" rel="noopener noreferrer">'+escape(c.name)+'</a>'+(c.welcome_text?'<p>'+escape(c.welcome_text)+'</p>':'');}).join('')+'</div></details>':''}`;}
export function renderHTML(d:Document){const canonical=d.seo.canonical_url||new URL(d.route,d.site.primary_domain).href;const index=d.site.enable_indexing!==false&&d.seo.robots_index!==false;return `<!doctype html><html lang="${escape(d.locale)}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${escape(d.seo.meta_title||d.title+' | '+d.site.site_name)}</title><meta name="description" content="${escape(d.seo.meta_description||d.description)}"><meta name="robots" content="${index?'index':'noindex'},${d.seo.robots_follow===false?'nofollow':'follow'}"><link rel="canonical" href="${escape(safeURL(canonical))}">${d.alternates.map(a=>'<link rel="alternate" hreflang="'+escape(a.hreflang)+'" href="'+escape(new URL(a.path,d.site.primary_domain).href)+'">').join('')}<meta property="og:title" content="${escape(d.seo.og_title||d.title)}"><meta property="og:description" content="${escape(d.seo.og_description||d.description)}"><meta property="og:url" content="${escape(canonical)}"><meta property="og:type" content="website"><meta name="twitter:card" content="summary_large_image">${(d.seo.og_image_url||d.media[0]?.url)?'<meta property="og:image" content="'+escape(new URL(d.seo.og_image_url||d.media[0].url,d.site.primary_domain).href)+'">':''}${d.site.google_site_verification?'<meta name="google-site-verification" content="'+escape(d.site.google_site_verification)+'">':''}${d.alternates.find(a=>a.locale===d.site.default_locale_code)?'<link rel="alternate" hreflang="x-default" href="'+escape(new URL(d.alternates.find(a=>a.locale===d.site.default_locale_code)!.path,d.site.primary_domain).href)+'">':''}<link rel="stylesheet" href="/assets/site.css"><script type="application/ld+json">${JSON.stringify(schemaFor(d)).replaceAll('<','\\u003c')}</script><script src="/assets/site.js" defer></script></head><body>${bodyHTML(d)}</body></html>`;}
export function systemDocument(locale:Row,context:Row,route:string,title:string,body:Block[],items:Row[]=[]):Document{return {route,locale:locale.code,localeId:locale.id,entityType:'system',entityId:locale.id,title,description:'',body,seo:{},geo:{},schema:{},site:context.site,menus:context.menus,heroes:context.heroes,channels:context.channels,faqs:[],media:[],documents:[],related:items,alternates:[],updatedAt:new Date().toISOString()};}

````

## packages/ui/src/styles.ts

````ts
export const siteCSS=String.raw`
@layer reset,base,components;
@layer reset{*{box-sizing:border-box}body,h1,h2,h3,p{margin:0}img{max-width:100%;display:block}button,input,textarea{font:inherit}button,a,input,summary{touch-action:manipulation}a{color:inherit}button{cursor:pointer}}
@layer base{:root{--ink:#183c33;--paper:#f5f3eb;--line:#d5dccf;--accent:#d0e875;--muted:#62776b}html{scroll-behavior:smooth}body{background:var(--paper);color:var(--ink);font-family:'Segoe UI','Microsoft YaHei',sans-serif;line-height:1.65}a{text-decoration:none}p{margin:0 0 1em}h1,h2,h3{font-family:Georgia,'Times New Roman','Songti SC',serif;font-weight:400;line-height:1.12}h1{font-size:clamp(2.6rem,6vw,6.6rem)}h2{font-size:clamp(2rem,3vw,3.6rem);margin-bottom:1.1rem}h3{font-size:1.65rem}button{color:inherit}:focus-visible{outline:3px solid #8fbb32;outline-offset:5px}::selection{background:var(--accent);color:var(--ink)}}
@layer components{.skip-link{position:absolute;left:10px;top:-100px;z-index:100;background:white;padding:10px}.skip-link:focus{top:10px}.site-header{display:flex;gap:30px;align-items:center;justify-content:space-between;min-height:108px;padding:20px 5%;border-bottom:1px solid var(--line);background:var(--paper);position:relative;z-index:5}.wordmark{font-family:Georgia,serif;letter-spacing:-1px;font-size:31px;white-space:nowrap}.wordmark small{display:block;font:8px 'Segoe UI',sans-serif;letter-spacing:2px}.site-header nav>ul{display:flex;align-items:center;list-style:none;padding:0;gap:30px;font-size:13px}.site-header nav li{position:relative}.site-header nav li ul{display:none;position:absolute;top:100%;left:0;min-width:180px;list-style:none;padding:15px;background:var(--paper);border:1px solid var(--line)}.site-header nav li:hover>ul,.site-header nav li:focus-within>ul{display:block}.header-tools{display:flex;gap:20px;align-items:center;font-size:12px}.quote-link{border-bottom:1px solid;padding-bottom:5px}.language{position:relative}.language summary{cursor:pointer}.language ul{position:absolute;background:var(--paper);padding:15px 25px;list-style:none;right:0;border:1px solid var(--line)}.nav-toggle{display:none;border:0;background:none;font-size:24px}.hero{position:relative;min-height:min(830px,90svh);background:#1b4035;color:var(--paper);isolation:isolate;overflow:hidden}.hero-grid{position:absolute;inset:0;z-index:-1;background-image:linear-gradient(#b7cf9412 1px,transparent 1px),linear-gradient(90deg,#b7cf9412 1px,transparent 1px);background-size:80px 80px}.hero-grid:after{content:'';position:absolute;right:9%;top:13%;width:32%;height:68%;border:1px solid #d0e8754d;border-radius:50% 50% 15% 15%;transform:rotate(12deg);box-shadow:22px 22px 0 -1px #1b4035,22px 22px 0 0 #d0e87533}.slide{min-height:min(830px,90svh);display:flex;align-items:center;padding:80px 8%;position:relative}.slide[hidden]{display:none}.slide picture{position:absolute;inset:0;z-index:-1}.slide picture:after{content:'';position:absolute;inset:0;background:linear-gradient(90deg,#09251bd9,transparent),rgba(0,0,0,var(--overlay))}.slide img{width:100%;height:100%;object-fit:cover}.slide-copy{max-width:830px}.slide-copy.center{margin:auto;text-align:center}.slide-copy.right{margin-left:auto;text-align:right}.slide h1,.slide h2{font-size:clamp(2.7rem,6.2vw,6.5rem);letter-spacing:-.045em;max-width:850px;margin-bottom:30px}.slide-copy>p:not(.kicker){max-width:590px;color:#d8e4d4;font-size:16px;line-height:1.9}.kicker{text-transform:uppercase;font-size:10px;letter-spacing:3px;font-weight:600;margin-bottom:22px}.hero-actions{display:flex;flex-wrap:wrap;align-items:center;gap:30px;margin-top:38px}.button{display:inline-flex;align-items:center;justify-content:space-between;gap:35px;background:var(--accent);color:#19372d;border:0;padding:17px 26px;font-size:13px;line-height:1.3}.button:hover{background:#e0f297}.text-link{font-size:13px;border-bottom:1px solid;padding-bottom:6px}.hero-controls{display:flex;align-items:center;gap:18px;position:absolute;bottom:32px;right:5%;font-size:11px}.hero-controls button{color:var(--paper);border:1px solid #a4b69544;background:none;width:39px;height:39px;border-radius:50%}.hero-note{position:absolute;left:5%;bottom:40px;font-size:9px;letter-spacing:2px;color:#c3d4b6}.section{max-width:1380px;margin:auto;padding:80px 5%}.section>h2{max-width:830px}.section>p{max-width:750px;color:var(--muted)}.page-title{padding:85px 8% 65px;border-bottom:1px solid var(--line)}.page-title h1{max-width:1000px;font-size:clamp(2.6rem,5vw,5.4rem);letter-spacing:-.04em}.page-title>p:last-child{margin-top:28px;max-width:790px;color:var(--muted)}.cards{display:grid;grid-template-columns:repeat(3,1fr);gap:22px;margin-top:36px}.card{position:relative;border-top:1px solid var(--ink);padding:25px 0 30px}.card picture{display:block}.card img{aspect-ratio:4/3;object-fit:cover;background:#e7eade;width:100%;margin-bottom:22px}.serial{font-size:10px;letter-spacing:2px;display:block;color:var(--muted);margin:5px 0 28px}.card h3{margin-right:35px;margin-bottom:18px}.card p{font-size:13px;color:var(--muted);margin-right:30px}.card-arrow{position:absolute;right:4px;bottom:22px;font-size:23px}.split{display:grid;grid-template-columns:1fr 1fr;gap:8%;align-items:center}.split img{width:100%;aspect-ratio:5/4;object-fit:cover}.prose{max-width:960px}.prose p,.prose li{font-size:17px;line-height:1.9}.prose h3{margin:30px 0 20px}.prose blockquote{border-left:3px solid #66866c;margin-left:0;padding-left:25px}.statistics{display:grid;grid-template-columns:repeat(4,1fr);gap:30px;border-block:1px solid var(--line);padding:40px 0}.statistics strong{font:48px Georgia,serif}.statistics p{font-size:12px;color:var(--muted);margin-top:12px}.timeline{border-left:1px solid var(--ink);margin-left:20px}.timeline article{padding:0 35px 30px;position:relative}.timeline article:before{content:'';height:9px;width:9px;background:var(--ink);position:absolute;left:-5px;top:10px;border-radius:50%}.timeline strong{font:26px Georgia,serif}.table-scroll{overflow:auto}table{border-collapse:collapse;width:100%;font-size:14px;min-width:420px}td,th{text-align:left;padding:17px;border-bottom:1px solid var(--line)}th{background:#e2e8d8;font-weight:600}.faq{max-width:1000px}.faq details{border-bottom:1px solid var(--line);padding:25px 0}.faq summary{cursor:pointer;font:21px Georgia,serif}.faq details p{margin-top:18px;color:var(--muted)}video{width:100%;max-height:80vh;background:#183a2b}.downloads a{display:flex;justify-content:space-between;padding:20px;border-bottom:1px solid var(--line)}.testimonials{display:grid;grid-template-columns:repeat(2,1fr);gap:50px}.testimonials blockquote{margin:0;padding:30px;background:#e8ecdf}.testimonials p{font:26px/1.6 Georgia,serif}.testimonials cite{font-size:12px}.cta{background:#244c3c;color:#f2f5e6;text-align:center;max-width:none}.cta>h2,.cta>p{margin-left:auto;margin-right:auto}.cta>p{color:#cadcc6}.contact{display:grid;grid-template-columns:1fr 1.2fr;gap:8%;border-top:1px solid var(--line)}.form-grid{display:grid;grid-template-columns:1fr 1fr;gap:20px}.inquiry-form label,.search-form label{display:block;font-size:12px;margin-bottom:20px}.inquiry-form input:not([type=checkbox]),.inquiry-form textarea,.search-form input{width:100%;display:block;border:0;border-bottom:1px solid #9ba994;border-radius:0;padding:13px 0;background:transparent;outline-offset:4px}.inquiry-form textarea{resize:vertical}.inquiry-form .consent{display:flex;gap:10px;align-items:center;font-size:11px}.inquiry-form .trap{position:absolute;left:-10000px;height:1px;width:1px;overflow:hidden}.inquiry-form .form-result{font-size:13px;padding:15px 0;color:#275344}.product-lead{display:grid;grid-template-columns:1fr 1fr;gap:7%;align-items:start}.product-gallery{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}.product-gallery img{aspect-ratio:1;object-fit:contain;width:100%;background:#e6eadd}.product-gallery img:first-child{grid-column:1/-1}.no-image{grid-column:1/-1;aspect-ratio:1;background:#e5eadd;display:grid;place-items:center;font:28px Georgia,serif;color:#7a8f71}.sku{font-size:12px;letter-spacing:2px;color:var(--muted);margin:20px 0}.features{padding:15px 0 15px 20px}.features li{margin:8px 0}.knowledge{background:#e8eddd;max-width:none;padding-inline:max(8%,calc((100vw - 1100px)/2))}.knowledge dl>div{display:flex;padding:15px 0;border-bottom:1px solid #cbd6bf;gap:25px}.knowledge dt{width:35%;font-weight:600}.knowledge dd{margin:0;flex:1}.knowledge li{font-size:13px}.search-form{display:flex;gap:25px;align-items:center}.search-form label{flex:1}.search-results article{padding:25px 0;border-bottom:1px solid var(--line)}.site-footer{padding:65px 5% 30px;background:#133b2e;color:#e7eddc;display:grid;grid-template-columns:2fr 1fr 1fr;gap:40px}.site-footer strong{font:28px Georgia,serif}.site-footer p{font-size:12px;color:#b9ccb1;max-width:390px;margin-top:20px}.site-footer h2{font-size:21px}.site-footer a{display:block;margin-bottom:10px;font-size:12px}.site-footer small{grid-column:1/-1;border-top:1px solid #63826144;padding-top:25px;font-size:10px}.service-widget{position:fixed;right:22px;bottom:22px;z-index:10}.service-widget summary{cursor:pointer;background:var(--accent);padding:14px 21px;border-radius:30px;box-shadow:0 4px 20px #122f2522;font-size:12px}.service-widget>div{position:absolute;right:0;bottom:65px;background:var(--paper);width:240px;padding:20px;box-shadow:0 8px 40px #122f2533}.service-widget a{display:block;padding:10px 0;border-bottom:1px solid var(--line);font-size:14px}.service-widget p{font-size:12px;margin-top:10px}}
@media(max-width:1000px){.site-header{padding:18px 4%;gap:15px}.header-tools .quote-link{display:none}.site-header nav>ul{gap:18px}.cards{grid-template-columns:repeat(2,1fr)}.section{padding:60px 6%}.contact,.product-lead{gap:5%}.slide{padding:85px 7%}.statistics{grid-template-columns:repeat(2,1fr)}}
@media(max-width:650px){.site-header{min-height:82px}.wordmark{font-size:24px}.wordmark small{font-size:6px;letter-spacing:1.3px}.nav-toggle{display:block;margin-left:auto}.header-tools{gap:13px}.site-header nav{display:none;position:absolute;top:100%;left:0;right:0;background:var(--paper);border-bottom:1px solid var(--line);padding:15px 6%}.site-header nav.open{display:block}.site-header nav>ul{display:block}.site-header nav li{padding:9px 0}.site-header nav li ul{position:static;display:block;border:0;padding:6px 18px}.hero,.slide{min-height:650px}.slide{padding:75px 7% 115px}.hero-controls{bottom:28px}.hero-note{display:none}.hero h1,.hero h2{font-size:51px;letter-spacing:-2px}.slide-copy>p:not(.kicker){font-size:14px}.hero-actions{gap:20px}.cards{grid-template-columns:1fr}.card{padding-bottom:22px}.card img{aspect-ratio:5/4}.split,.contact,.product-lead,.testimonials{grid-template-columns:1fr;gap:35px}.section{padding:48px 6%}.form-grid{gap:16px}.page-title{padding:55px 6%}.page-title h1{font-size:43px}.site-footer{grid-template-columns:1fr 1fr;gap:30px}.site-footer>div:first-child{grid-column:1/-1}.knowledge dl>div{display:block}.knowledge dt{width:auto;margin-bottom:8px}.search-form{gap:15px}.search-form .button{padding:15px}.service-widget{right:12px;bottom:12px}.site-footer small{padding-bottom:50px}}
@media(prefers-reduced-motion:reduce){html{scroll-behavior:auto}*{animation:none!important;transition:none!important}}
.analytics-consent{position:fixed;bottom:20px;left:20px;z-index:20;background:#f5f3eb;border:1px solid #183c33;padding:20px;box-shadow:0 4px 30px #183c3322}.analytics-consent button{margin-right:12px;padding:8px 18px}
`;

````

## packages/ui/tsconfig.json

````json
{"extends":"../../tsconfig.base.json","include":["src/**/*.ts"]}

````

## pnpm-workspace.yaml

````yaml
packages:
  - apps/*
  - packages/*
onlyBuiltDependencies:
  - esbuild
  - sharp

````

## tests/http-smoke.mjs

````javascript
import assert from 'node:assert/strict';import {randomUUID,randomBytes} from 'node:crypto';import fs from 'node:fs/promises';import path from 'node:path';import {createRequire} from 'node:module';import pg from 'pg';
if(process.env.RUN_LOCAL_SMOKE!=='1')throw Error('Set RUN_LOCAL_SMOKE=1. Run only against a fresh local development instance.');
const cms='http://localhost:3001',web='http://localhost:3000';const connection=JSON.parse(await fs.readFile('.runtime/connection.json','utf8'));const db=new pg.Client({connectionString:connection.DATABASE_URL});await db.connect();
const adminEmail='smoke-'+randomUUID()+'@example.invalid',password=randomBytes(24).toString('base64url');let cookie='',actorId,productId,translationId,inquiryId,mediaId;const results=[];
async function request(route,{body,method='GET',auth=true,origin=cms}={}){const res=await fetch(cms+route,{method,headers:{...(body?{'Content-Type':'application/json'}:{}),...(auth&&cookie?{Cookie:cookie}:{}),Origin:origin},body:body?JSON.stringify(body):undefined});let data;try{data=await res.json();}catch{data=null;}return {res,data};}
const record=async(resource,data)=>{const r=await request('/api/v1/records?resource='+resource,{method:'POST',body:{data}});assert.equal(r.res.status,201,JSON.stringify(r.data));return r.data;};
async function waitJob(id){for(let i=0;i<60;i++){const rows=(await db.query('SELECT status,error_message FROM publish_jobs WHERE id=$1',[id])).rows;const j=rows[0];if(j.status==='failed')throw Error(j.error_message);if(j.status==='completed')return;await new Promise(r=>setTimeout(r,1000));}throw Error('Queue timed out');}
try{
 assert.equal((await request('/api/v1/meta',{auth:false})).res.status,401);
 assert.equal((await db.query('SELECT count(*)::int n FROM payload_internal.cms_admin_users')).rows[0].n,0,'Use a fresh local instance; existing accounts preserved');
 const first=await request('/api/cms-admin-users/first-register',{method:'POST',body:{email:adminEmail,password,displayName:'Smoke verification'},auth:false});assert.ok(first.res.ok,JSON.stringify(first.data));
 const login=await request('/api/cms-admin-users/login',{method:'POST',body:{email:adminEmail,password},auth:false});assert.equal(login.res.status,200,JSON.stringify(login.data));cookie=login.res.headers.getSetCookie().map(c=>c.split(';')[0]).join('; ');assert.ok(cookie);actorId=login.data.user.id;
 const meta=await request('/api/v1/meta');assert.equal(meta.res.status,200,JSON.stringify(meta.data));assert.equal(meta.data.actor.role,'super_admin');results.push('first admin, login, session, RBAC metadata');
 const locales=(await request('/api/v1/records?resource=locales')).data.rows,locale=locales.find(l=>l.code==='en');
 const product=await record('products',{sku:'SMOKE-'+randomUUID().slice(0,8),status:'active'});productId=product.id;
 const route='/en/products/smoke-'+randomUUID().slice(0,8);const translation=await record('product_translations',{product_id:productId,locale_id:locale.id,name:'Queue verification product',slug:route.split('/').pop(),path:route,short_description:'Temporary integration fixture'});translationId=translation.id;
 assert.equal((await request('/api/v1/document?path='+route,{auth:false})).res.status,404);
 const publish=await request('/api/v1/publish',{method:'POST',body:{resource:'product_translations',id:translationId}});assert.equal(publish.res.status,202,JSON.stringify(publish.data));await waitJob(publish.data.id);
 const publicDoc=await request('/api/v1/document?path='+route,{auth:false});assert.equal(publicDoc.data.title,'Queue verification product');
 const frontend=await fetch(web+route);assert.equal(frontend.status,200);const html=await frontend.text();assert.match(html,/Queue verification product/);assert.match(html,/application\/ld\+json/);assert.match(html,/rel="canonical"/);results.push('Redis queue, static publish, SSR product, SEO metadata');
 const sharp=createRequire(path.resolve('apps/cms/package.json'))('sharp');const png=await sharp({create:{width:64,height:48,channels:3,background:'#184032'}}).png().toBuffer();const form=new FormData();form.set('file',new File([png],'smoke.png',{type:'image/png'}));const uploaded=await fetch(cms+'/api/v1/upload',{method:'POST',headers:{Cookie:cookie,Origin:cms},body:form});const media=await uploaded.json();assert.equal(uploaded.status,201,JSON.stringify(media));mediaId=media.id;assert.equal((await db.query('SELECT count(*)::int n FROM media_variants WHERE media_id=$1',[mediaId])).rows[0].n,8);assert.equal((await fetch(cms+'/media/'+media.object_key)).status,200);results.push('image upload, 8 AVIF/WebP variants, local serving');
 const submission={key:randomUUID(),locale:'en',name:'Integration test',email:'inquiry@example.invalid',message:'Temporary RFQ verification',consent:true,inquiry_type:'rfq',items:[{product_id:productId,quantity:2}]};
 const lead=await request('/api/v1/inquiries',{method:'POST',body:submission,auth:false,origin:web});assert.equal(lead.res.status,201,JSON.stringify(lead.data));const duplicate=await request('/api/v1/inquiries',{method:'POST',body:submission,auth:false,origin:web});assert.equal(duplicate.data.inquiry_number,lead.data.inquiry_number);inquiryId=(await db.query('SELECT id FROM inquiries WHERE inquiry_number=$1',[lead.data.inquiry_number])).rows[0].id;
 assert.equal((await request('/api/v1/inquiries',{method:'POST',body:{...submission,key:randomUUID()},auth:false,origin:'https://untrusted.example'})).res.status,403);results.push('RFQ, idempotency, origin protection');
 const search=await request('/api/v1/search?locale=en&q=Queue',{auth:false});assert.ok(search.data.rows.some(r=>r.route===route));
 const unpublish=await request('/api/v1/publish',{method:'POST',body:{resource:'product_translations',id:translationId,action:'unpublish'}});assert.equal(unpublish.res.status,202);await waitJob(unpublish.data.id);assert.equal((await request('/api/v1/document?path='+route,{auth:false})).res.status,404);results.push('public search and unpublish');
 await fs.writeFile('docs/http-verification.json',JSON.stringify({timestamp:new Date().toISOString(),results,passed:true,redis:'5.0.14.1 temporary Windows port; production compose uses Redis 7'},null,2));console.log('PASS',results.join('; '));
}finally{
 if(inquiryId)await db.query('DELETE FROM inquiries WHERE id=$1',[inquiryId]);
 if(translationId){await db.query('DELETE FROM published_documents WHERE entity_id=$1',[translationId]);await db.query('DELETE FROM static_routes WHERE entity_id=$1',[translationId]);await db.query('DELETE FROM publish_jobs WHERE entity_id=$1',[translationId]);}
 if(productId)await db.query('DELETE FROM products WHERE id=$1',[productId]);
 if(mediaId){const files=(await db.query('SELECT object_key FROM media_assets WHERE id=$1 UNION SELECT object_key FROM media_variants WHERE media_id=$1',[mediaId])).rows;await db.query('DELETE FROM media_assets WHERE id=$1',[mediaId]);for(const f of files)await fs.unlink(path.resolve('media',f.object_key)).catch(()=>{});}
 if(actorId){await db.query('DELETE FROM audit_logs WHERE user_id=$1',[actorId]);await db.query('DELETE FROM content_revisions WHERE created_by=$1',[actorId]);await db.query('DELETE FROM users WHERE id=$1',[actorId]);await db.query('DELETE FROM payload_internal.cms_admin_users WHERE id=$1',[actorId]);}
 await db.end();
}

````

## tests/integration.ts

````ts
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

````

## tests/render.test.ts

````ts
import {test} from 'node:test';import assert from 'node:assert/strict';
import {safeURL,escape,renderHTML,systemDocument,siteJS} from '../packages/ui/src/index';import {routeFile} from '../packages/publisher/src/files';
test('HTML and URLs are escaped',()=>{assert.equal(escape('<script>'),'&lt;script&gt;');for(const u of ['javascript:alert(1)','//evil.test','/\\evil.test','data:text/html,test'])assert.equal(safeURL(u),'#');assert.equal(safeURL('/en/products'),'/en/products');});
test('static routes reject traversal and absolute paths',()=>{for(const v of ['/en/../secret','C:/secret','//host/path','/en/%2e%2e'])assert.throws(()=>routeFile(v));assert.equal(routeFile('/en/products/item'),'en/products/item/index.html');});
test('shared rendering produces crawlable content without executable input',()=>{const doc=systemDocument({id:'x',code:'en'},{site:{site_name:'Test',primary_domain:'https://example.test',enable_indexing:false},menus:[],heroes:[],channels:[]},'/en','Test <title>',[{type:'rich_text',data:{html:'<p>Visible</p><script>alert(1)</script><img src=x onerror=alert(1)>'}}]);const html=renderHTML(doc);assert.match(html,/Visible/);assert.match(html,/noindex,follow/);assert.ok(!html.includes('<script>alert'));assert.ok(!html.includes('onerror='));assert.match(html,/<h1>Test &lt;title&gt;<\/h1>/);});

test('Browser script parses',()=>{assert.doesNotThrow(()=>new Function(siteJS));});

````

## tsconfig.base.json

````json
{"compilerOptions":{"target":"ES2022","lib":["ES2022","DOM","DOM.Iterable"],"module":"ESNext","moduleResolution":"Bundler","strict":true,"skipLibCheck":true,"resolveJsonModule":true,"esModuleInterop":true,"noEmit":true}}

````

