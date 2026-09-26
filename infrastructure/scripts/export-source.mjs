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
