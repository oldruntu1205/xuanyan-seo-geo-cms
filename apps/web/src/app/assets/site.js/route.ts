import {siteJS} from '@suns/ui';
export function GET(){return new Response(siteJS,{headers:{'Content-Type':'application/javascript; charset=utf-8','Cache-Control':'public, max-age=300'}})}
