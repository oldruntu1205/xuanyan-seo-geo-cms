import path from 'node:path';
import { readFile,realpath } from 'node:fs/promises';
export const runtime='nodejs';
export async function GET(_request:Request,{params}:{params:Promise<{key:string[]}>}){
 const {key}=await params;const name=key.join('/');if(!/^[a-f0-9-]+(?:-(?:1920|1280|768|480))?\.(?:jpg|png|webp|avif|pdf|mp4)$/.test(name))return new Response('Not found',{status:404});
 try{const root=await realpath(/* turbopackIgnore: true */ path.resolve(/* turbopackIgnore: true */ process.env.MEDIA_DIR||'../../media'));const file=await realpath(/* turbopackIgnore: true */ path.join(root,name));if(!file.startsWith(root+path.sep))return new Response('Not found',{status:404});const types:Record<string,string>={jpg:'image/jpeg',png:'image/png',webp:'image/webp',avif:'image/avif',pdf:'application/pdf',mp4:'video/mp4'};return new Response(await readFile(/* turbopackIgnore: true */ file),{headers:{'Content-Type':types[name.split('.').pop()!],'X-Content-Type-Options':'nosniff','Cache-Control':'public,max-age=31536000,immutable'}});}catch{return new Response('Not found',{status:404});}
}
