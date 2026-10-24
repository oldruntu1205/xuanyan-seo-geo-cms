// 营销退订入口（CMS 侧实现，生产真正生效的就是本文件）。
//
// 为什么必须在 CMS 再放一份：生产只跑后台管理与发布 Worker 两个进程，公开页面由 nginx 直出
// static-site，apps/web 不参与生产部署（见 _deploy/ecosystem.config.cjs、_deploy/pack-prod.py）。
// 若只在 apps/web 提供该路由，营销邮件正文的退订链接与 List-Unsubscribe 头在生产都会 404。
// nginx 需把 /unsubscribe 反代到 CMS（生产 nginx vhost（不随公开仓库分发） 的 location 正则已含 unsubscribe）。
//
// 与 apps/web/src/app/unsubscribe/route.ts 行为保持一致（同一 domain 函数、同一 token 校验）。
import {publicMarketingUnsubscribe} from '@suns/domain';

const headers={'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Content-Security-Policy':"default-src 'none'; style-src 'unsafe-inline'; form-action 'self'"};
function page(title:string,message:string,button=''){return `<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${title}</title><style>body{font-family:system-ui,sans-serif;background:#f5f7f2;color:#173d2f;display:grid;place-items:center;min-height:90vh;margin:0}main{background:white;border:1px solid #dce6d9;border-radius:14px;padding:32px;max-width:440px;line-height:1.6}button{background:#24543e;color:white;padding:12px 20px;border:0;border-radius:6px;cursor:pointer}</style></head><body><main><h1>${title}</h1><p>${message}</p>${button}</main></body></html>`;}
export async function GET(request:Request){const token=new URL(request.url).searchParams.get('token')||'';if(!/^[A-Za-z0-9_-]{40,300}$/.test(token))return new Response(page('退订链接无效','请使用邮件中的完整退订链接。'),{status:400,headers});return new Response(page('退订营销邮件','确认后，此邮箱将不再接收本系统的营销邮件。',`<form method="post" action="/unsubscribe"><input type="hidden" name="token" value="${token}"><button type="submit">确认退订</button></form>`),{headers});}
export async function POST(request:Request){try{const queryToken=new URL(request.url).searchParams.get('token');const token=String(queryToken||(await request.formData()).get('token')||'');if(!/^[A-Za-z0-9_-]{40,300}$/.test(token))throw Error('invalid');await publicMarketingUnsubscribe(token);return new Response(page('已退订','营销订阅已关闭。此前正在发送的邮件可能已经由服务商接收。'),{headers});}catch{return new Response(page('退订链接无效','请使用邮件中的完整退订链接。'),{status:400,headers});}}
