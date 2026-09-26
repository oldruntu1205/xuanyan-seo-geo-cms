import {withPayload} from '@payloadcms/next/withPayload';
import {config} from 'dotenv';config({path:'../../.env'});
export default withPayload({reactStrictMode:true,outputFileTracingExcludes:{'/*':['../../.runtime/**/*','../../media/**/*','../../static-site/**/*','../../.env']},transpilePackages:['@suns/domain'],serverExternalPackages:['pg','sharp']});
