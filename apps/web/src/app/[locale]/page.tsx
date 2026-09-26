import {getDocument,DocumentView,documentMetadata} from '../../lib/document';
export const dynamic='force-dynamic';
type Props={params:Promise<{locale:string}>};
export async function generateMetadata({params}:Props){return documentMetadata(await getDocument('/'+(await params).locale));}
export default async function Page({params}:Props){return <DocumentView doc={await getDocument('/'+(await params).locale)}/>}
