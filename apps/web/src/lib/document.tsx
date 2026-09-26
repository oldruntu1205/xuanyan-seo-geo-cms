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
