import { config } from 'dotenv';
config({path:'../../.env'});
const {Worker,Queue}=await import('bullmq');
const {default:IORedis}=await import('ioredis');
const {query,pool,claimTranslationJob,processTranslationJob,runDueGeoSampling,scheduleCrmSync,runCrmSyncJob}=await import('@suns/domain');
const {processPublishJob}=await import('@suns/publisher');
const connection=new IORedis(process.env.REDIS_URL||'redis://localhost:6379',{maxRetriesPerRequest:null});
const queue=new Queue('static-publish',{connection});
const worker=new Worker('static-publish',processPublishJob,{connection,concurrency:1,lockDuration:120000});
let running=false,closing=false;
async function dispatch(){if(running||closing)return;running=true;try{
 const exhausted=await query("SELECT id FROM publish_jobs WHERE status='processing' AND attempt_count>=max_attempts AND started_at<now()-interval '10 minutes' LIMIT 100");
 for(const task of exhausted){const queued=await queue.getJob(task.id);const state=queued?await queued.getState():'missing';if(['active','waiting','delayed','waiting-children'].includes(state))continue;await query("UPDATE publish_jobs SET status='failed',error_message=coalesce(error_message,'Worker stopped after the final attempt'),finished_at=now() WHERE id=$1 AND status='processing' AND attempt_count>=max_attempts",[task.id]);}
 const tasks=await query(`SELECT * FROM publish_jobs WHERE status IN('pending','retrying','processing') AND attempt_count<max_attempts AND (scheduled_at IS NULL OR scheduled_at<=now()) ORDER BY priority DESC,created_at LIMIT 100`);for(const t of tasks){const existing=await queue.getJob(t.id);if(existing){const state=await existing.getState();if(state==='failed'||state==='completed'){if(t.status==='processing'&&Date.now()-new Date(t.updated_at).getTime()<600000)continue;await existing.remove();}else continue;}await queue.add(t.job_type,{jobId:t.id},{jobId:t.id,priority:Math.max(1,Math.min(2097152,1000000-t.priority)),attempts:Math.max(1,t.max_attempts-t.attempt_count),delay:Math.max(0,new Date(t.scheduled_at||0).getTime()-Date.now()),backoff:{type:'exponential',delay:5000},removeOnComplete:{age:86400,count:1000},removeOnFail:{age:604800,count:1000}});}
 await query("DELETE FROM api_rate_limits WHERE window_start<now()-interval '1 day'");
 }catch(error){console.error('Queue dispatch failed',error);}finally{running=false;}}
worker.on('completed',job=>console.info('Published',job.id));worker.on('failed',(job,error)=>{console.error('Publish failed',job?.id,error.message);if(job)query("UPDATE publish_jobs SET status=CASE WHEN attempt_count>=max_attempts THEN 'failed' ELSE 'retrying' END,error_message=$2,finished_at=now() WHERE id=$1 AND status='processing'",[job.data.jobId,error.message]).catch(console.error);});worker.on('error',error=>console.error('Worker error',error));
let translationRunning=false;
async function dispatchTranslations(){if(translationRunning||closing)return;translationRunning=true;try{const job=await claimTranslationJob();if(job)await processTranslationJob(job);}catch(error){console.error('Translation job failed',error instanceof Error?error.message:error);}finally{translationRunning=false;}}
const timer=setInterval(dispatch,3000);
const translationTimer=setInterval(dispatchTranslations,3000);
let geoRunning=false;
async function dispatchGeo(){if(geoRunning||closing)return;geoRunning=true;try{await runDueGeoSampling();}catch(error){console.error('Scheduled GEO sample failed',error instanceof Error?error.message:error);}finally{geoRunning=false;}}
const geoTimer=setInterval(dispatchGeo,60000);
let crmRunning=false;
async function dispatchCrm(){if(crmRunning||closing)return;crmRunning=true;try{await scheduleCrmSync();await runCrmSyncJob();}catch(error){console.error('CRM sync failed',error instanceof Error?error.message:error);}finally{crmRunning=false;}}
const crmTimer=setInterval(dispatchCrm,30000);
await dispatch();await dispatchTranslations();console.info('Static publisher and translation worker online');
await dispatchGeo();
await dispatchCrm();
async function shutdown(){if(closing)return;closing=true;clearInterval(timer);clearInterval(translationTimer);clearInterval(geoTimer);clearInterval(crmTimer);await worker.close();await queue.close();await connection.quit();await pool.end();process.exit(0);}
process.on('SIGINT',shutdown);process.on('SIGTERM',shutdown);
