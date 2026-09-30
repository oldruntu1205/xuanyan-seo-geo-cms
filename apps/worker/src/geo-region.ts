// Deploy this entrypoint near the configured outbound region. It does not run publishing, CRM or translation jobs.
import {config} from 'dotenv';
config({path:'../../.env'});
const {pool,geoWorkerIdentity,geoWorkerHeartbeat,claimGeoSampleJob,processGeoSampleJob}=await import('@suns/domain');
if(!process.env.GEO_WORKER_REGION_CODE)throw Error('GEO_WORKER_REGION_CODE is required for a regional worker');
const identity=geoWorkerIdentity();
let closing=false,active=0;
const concurrency=Math.min(8,Math.max(1,Number(process.env.GEO_WORKER_CONCURRENCY)||3));
async function tick(){if(closing||active>=concurrency)return;active++;try{const job=await claimGeoSampleJob(identity.region,identity.workerId);if(job)await processGeoSampleJob(job);}catch(error){console.error('Regional GEO sample failed',error instanceof Error?error.message:error);}finally{active--;}}
async function beat(){if(closing)return;try{await geoWorkerHeartbeat(identity.region,identity.workerId);}catch(error){console.error('GEO region heartbeat failed',error instanceof Error?error.message:error);}}
await beat();
const timer=setInterval(()=>{for(let i=active;i<concurrency;i++)void tick();},2000);
const heartbeat=setInterval(beat,30000);
async function shutdown(){if(closing)return;closing=true;clearInterval(timer);clearInterval(heartbeat);while(active>0)await new Promise(resolve=>setTimeout(resolve,250));await pool.end();process.exit(0);}
process.on('SIGINT',shutdown);process.on('SIGTERM',shutdown);
console.info(`GEO regional worker online: ${identity.region} (${identity.workerId}), concurrency=${concurrency}`);
