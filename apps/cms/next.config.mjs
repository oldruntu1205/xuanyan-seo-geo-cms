import {withPayload} from '@payloadcms/next/withPayload';
import {config} from 'dotenv';config({path:'../../.env'});
export default withPayload({reactStrictMode:true,allowedDevOrigins:['127.0.0.1'],outputFileTracingExcludes:{'/*':['../../.runtime/**/*','../../media/**/*','../../static-site/**/*','../../.env']},transpilePackages:['@suns/domain'],serverExternalPackages:['pg','sharp']});
