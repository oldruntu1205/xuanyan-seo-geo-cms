import {getDocument,DocumentView,documentMetadata} from '../../../lib/document';
export const dynamic='force-dynamic';
type Props={params:Promise<{locale:string;slug:string[]}>};
async function load(params:Props['params']){const p=await params;return getDocument('/'+[p.locale,...p.slug].join('/'));}
export async function generateMetadata({params}:Props){return documentMetadata(await load(params));}
export default async function Page({params}:Props){return <DocumentView doc={await load(params)}/>}
