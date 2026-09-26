import type {NextConfig} from 'next';
import {config as env} from 'dotenv';env({path:'../../.env'});
const config:NextConfig={reactStrictMode:true,transpilePackages:['@suns/ui','@suns/domain'],async rewrites(){const cms=process.env.CMS_INTERNAL_URL||'http://localhost:3001';return [{source:'/api/v1/:path*',destination:cms+'/api/v1/:path*'},{source:'/media/:path*',destination:cms+'/media/:path*'}];}};
export default config;
