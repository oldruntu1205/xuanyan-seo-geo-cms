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
