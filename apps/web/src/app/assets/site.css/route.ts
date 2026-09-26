import {siteCSS} from '@suns/ui';
export function GET(){return new Response(siteCSS,{headers:{'Content-Type':'text/css; charset=utf-8','Cache-Control':'public, max-age=300'}})}
