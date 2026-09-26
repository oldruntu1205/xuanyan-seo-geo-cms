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
