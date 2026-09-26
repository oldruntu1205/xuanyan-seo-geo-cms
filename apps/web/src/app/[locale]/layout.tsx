import type {ReactNode} from 'react';
import Script from 'next/script';
export default async function Layout({children,params}:{children:ReactNode;params:Promise<{locale:string}>}){const {locale}=await params;return <html lang={locale}><head><link rel="stylesheet" href="/assets/site.css"/></head><body>{children}<Script src="/assets/site.js" strategy="afterInteractive"/></body></html>}
