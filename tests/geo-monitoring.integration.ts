/** L1 GEO contract tests. Run only in verify.mjs's disposable database.
 * No product patches, real credentials, or external LLM requests.
 * Deliberately strict G53: the supplied implementation is expected to fail it.
 */
import assert from 'node:assert/strict';
import {createHash,randomUUID} from 'node:crypto';
import {hostname} from 'node:os';
import {createServer} from 'node:http';
import {once} from 'node:events';
import type {Actor,Row} from '../packages/domain/src/types';

const databaseUrl=new URL(process.env.DATABASE_URL||'http://invalid');
if(process.env.VERIFY_DATABASE!=='1'||!/^\/suns_verify_[a-f0-9]+$/.test(databaseUrl.pathname))
 throw Error('Run through verify.mjs in its isolated suns_verify_<hex> database');
const {query,pool}=await import('../packages/domain/src/db');
const {ensureActor,DomainError}=await import('../packages/domain/src/crud');
const geo=await import('../packages/domain/src/geo-monitoring');
const {v2Api}=await import('../apps/cms/src/server/v2-api');
assert.equal((await query('SELECT current_database() AS name'))[0].name,databaseUrl.pathname.slice(1));

const envKeys=['GEO_MONITOR_SECRET','GEO_WORKER_REGION_CODE','GEO_WORKER_ID','TRANSLATION_API_KEY','TRANSLATION_API_URL'] as const;
const savedEnv=Object.fromEntries(envKeys.map(k=>[k,process.env[k]]));
process.env.GEO_MONITOR_SECRET='GEO-test-only-secret-never-a-production-key-20261001';
process.env.TRANSLATION_API_KEY='test-only-site-key-000000000000';
let content=JSON.stringify({answer:'BRAND glassware',citations:['https://example.invalid/evidence']});
let finish='stop',usage:Row|undefined={prompt_tokens:101,completion_tokens:23},upstreamStatus=200;
let upstreamError='',requestCount=0,lastRequest:Row={};
const fake=createServer(async(req,res)=>{
 try{
  assert.equal(req.method,'POST');let body='';for await(const part of req)body+=part;
  lastRequest=JSON.parse(body);requestCount++;
  assert.match(String(req.headers.authorization),/^Bearer test-only-/);
  res.writeHead(upstreamStatus,{'Content-Type':'application/json'});
  res.end(upstreamStatus===200?JSON.stringify({choices:[{finish_reason:finish,message:{content}}],...(usage===undefined?{}:{usage})}):JSON.stringify({error:{message:upstreamError}}));
 }catch(error){res.writeHead(500);res.end(JSON.stringify({error:{message:String(error)}}));}
});
fake.listen(0,'127.0.0.1');await once(fake,'listening');
const port=(fake.address() as {port:number}).port,endpoint=`http://127.0.0.1:${port}/geo`;
const originalFetch=globalThis.fetch;
globalThis.fetch=(async(input:any,init?:RequestInit)=>{
 const url=new URL(typeof input==='string'||input instanceof URL?String(input):input.url);
 assert.equal(url.origin,new URL(endpoint).origin,'GEO test refuses every non-fake network destination');
 return originalFetch(input,{...init,redirect:'error'});
}) as typeof fetch;
process.env.TRANSLATION_API_URL=endpoint;

type Fixture={actor:Actor;prompt:Row;model:Row;region:Row;target:Row;modelInput:Parameters<typeof geo.saveGeoModel>[1]};
type Case={ids:string[];title:string;run:(f:Fixture)=>Promise<void>};
const cases:Case[]=[];
function test(ids:string,title:string,run:Case['run']){cases.push({ids:ids.split(','),title,run});}
const one=async(sql:string,args:unknown[]=[])=>{const rows=await query(sql,args);assert.equal(rows.length,1);return rows[0];};
const count=async(table:string,where='',args:unknown[]=[])=>Number((await one(`SELECT count(*)::int AS n FROM ${table} ${where}`,args)).n);
const jobRow=(id:string)=>one('SELECT * FROM geo_sample_jobs WHERE id=$1',[id]);
const targetRow=(f:Fixture)=>one('SELECT * FROM geo_monitor_targets WHERE id=$1',[f.target.id]);
async function rejected(fn:()=>Promise<unknown>,status:number,message:string){await assert.rejects(fn,(e:any)=>e instanceof DomainError&&e.status===status&&e.message===message);}
async function http(f:Fixture,action:string,input:Row){
 const url=new URL(`http://localhost/api/v1/v2/${action}`);
 const request=new Request(url,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(input)});
 return v2Api(request,['v2',action],f.actor,url,r=>r.json(),(data,status=200)=>Response.json(data,{status}));
}
async function zodReject(f:Fixture,action:string,input:Row,field:string){
 await assert.rejects(()=>http(f,action,input),(e:any)=>e?.name==='ZodError'&&Array.isArray(e.issues)&&e.issues.some((x:any)=>x.path[0]===field));
}
async function job(f:Fixture){
 // Direct insertion isolates processing from the independent manual-throttle contract.
 return one("INSERT INTO geo_sample_jobs(target_id,kind) VALUES($1,'manual') RETURNING *",[f.target.id]);
}
async function claim(f:Fixture){const pending=await job(f);const claimed=await geo.claimGeoSampleJob(f.region.code,'test-worker');assert.equal(claimed?.id,pending.id);return claimed!;}
async function sample(f:Fixture,patch:Row={}){const claimed=await claim(f);const result=await geo.processGeoSampleJob({...claimed,...patch});return one('SELECT * FROM geo_samples WHERE id=$1',[result.id]);}
const ledger=()=>query("SELECT period,spent_usd,reserved_usd,sample_count FROM geo_budget_windows ORDER BY period");
function ledgerEquals(rows:Row[],spent:string,reserved:string,n:number){
 assert.equal(rows.length,2);for(const row of rows){assert.equal(row.spent_usd,spent);assert.equal(row.reserved_usd,reserved);assert.equal(Number(row.sample_count),n);}
}
async function failed(f:Fixture,message:string,status=400){
 const j=await claim(f),before=await ledger();await rejected(()=>geo.processGeoSampleJob(j),status,message);
 const after=await jobRow(j.id);assert.equal(after.status,'failed');assert.equal(after.error_message,message);assert.ok(after.finished_at);
 for(const row of await ledger()){const old=before.find(x=>x.period===row.period)!;assert.equal(row.reserved_usd,'0.00000000');assert.equal(row.spent_usd,old.spent_usd);assert.equal(row.sample_count,old.sample_count);}
 assert.equal((await targetRow(f)).last_error,message);assert.equal(await count('geo_samples'),0);
}
const targetInput=(f:Fixture)=>({id:f.target.id,promptId:f.prompt.id,modelProfileId:f.model.id,regionId:f.region.id,intervalMinutes:60,enabled:true});
const budgetInput={dailyLimitUsd:100,monthlyLimitUsd:1000,maxQueuedJobs:500,enabled:true};
async function withinEnv(changes:Record<string,string|undefined>,fn:()=>Promise<void>|void){const before=Object.fromEntries(Object.keys(changes).map(k=>[k,process.env[k]]));try{for(const [k,v]of Object.entries(changes))v===undefined?delete process.env[k]:process.env[k]=v;await fn();}finally{for(const [k,v]of Object.entries(before))v===undefined?delete process.env[k]:process.env[k]=v;}}
function hash(j:Row){return createHash('sha256').update([j.prompt,j.market,j.brand_name,j.locale_code,j.model,j.endpoint,j.profile_id,j.region_id].join('\n')).digest('hex');}

// P0: money and competing workers.
test('G1','reservation rounds to eight decimal places and stores rate snapshots',async f=>{
 await query('UPDATE geo_model_profiles SET input_usd_per_million=1.234567,output_usd_per_million=2.345678,max_output_tokens=1201 WHERE id=$1',[f.model.id]);
 const j=await claim(f);assert.equal(j.reserved_usd,'0.00775543');assert.equal(j.input_rate_usd,'1.234567');assert.equal(j.output_rate_usd,'2.345678');
 ledgerEquals(await ledger(),'0.00000000','0.00775543',0);
});
test('G2','disabled budget blocks without samples or reservation',async f=>{
 await geo.saveGeoBudget(f.actor,{...budgetInput,enabled:false});const j=await job(f);assert.equal(await geo.claimGeoSampleJob(f.region.code,'test-worker'),null);
 const row=await jobRow(j.id);assert.equal(row.status,'blocked_budget');assert.equal(row.error_message,'GEO 成本预算尚未启用');assert.ok(row.finished_at);assert.equal(await count('geo_samples'),0);ledgerEquals(await ledger(),'0.00000000','0.00000000',0);
});
for(const period of ['day','month'])test('G3',`${period} overspend blocks by one hundred-millionth of a dollar`,async f=>{
 await geo.saveGeoBudget(f.actor,{...budgetInput,dailyLimitUsd:1,monthlyLimitUsd:1});
 await query('UPDATE geo_budget_windows SET spent_usd=0.98199751,reserved_usd=0.01 WHERE period=$1',[period]);
 const before=await ledger(),j=await job(f);assert.equal(await geo.claimGeoSampleJob(f.region.code,'test-worker'),null);
 const row=await jobRow(j.id);assert.equal(row.status,'blocked_budget');assert.equal(row.error_message,'GEO 日度或月度预算不足');assert.ok(row.finished_at);assert.deepEqual(await ledger(),before);assert.equal(await count('geo_samples'),0);
});
for(const period of ['day','month'])test('G3',`${period} exact budget equality is admitted`,async f=>{
 await geo.saveGeoBudget(f.actor,{...budgetInput,dailyLimitUsd:1,monthlyLimitUsd:1});
 await query('UPDATE geo_budget_windows SET spent_usd=0.98199750,reserved_usd=0.01 WHERE period=$1',[period]);
 assert.equal((await claim(f)).status,'processing');
});
test('G4,G9','reserve preserves spent/count; success releases once using original rates',async f=>{
 await query('UPDATE geo_budget_windows SET spent_usd=0.05,reserved_usd=0.02,sample_count=3');
 const j=await claim(f);ledgerEquals(await ledger(),'0.05000000','0.02800250',3);
 await query('UPDATE geo_model_profiles SET input_usd_per_million=900,output_usd_per_million=800 WHERE id=$1',[f.model.id]);
 const result=await geo.processGeoSampleJob(j);const s=await one('SELECT * FROM geo_samples WHERE id=$1',[result.id]);
 assert.equal(s.cost_usd,'0.00018375');assert.equal(s.input_rate_usd,'1.250000');assert.equal(s.output_rate_usd,'2.500000');ledgerEquals(await ledger(),'0.05018375','0.02000000',4);
});
test('G5','release clamps a zero reservation on successful processing',async f=>{
 const j=await claim(f);await query('UPDATE geo_budget_windows SET reserved_usd=0');await geo.processGeoSampleJob(j);ledgerEquals(await ledger(),'0.00018375','0.00000000',1);
});
test('G6','pre-transaction provider error releases both windows without charging',async f=>{
 upstreamStatus=500;upstreamError='test-only upstream failure';const j=await claim(f);
 await assert.rejects(()=>geo.processGeoSampleJob(j));const row=await jobRow(j.id);assert.equal(row.status,'failed');assert.ok(row.finished_at);assert.ok(row.error_message);ledgerEquals(await ledger(),'0.00000000','0.00000000',0);assert.ok((await targetRow(f)).last_error);assert.equal(await count('geo_samples'),0);
});
test('G7','two independent claims return one processing job and one null',async f=>{
 const j=await job(f),results=await Promise.all([geo.claimGeoSampleJob(f.region.code,'test-worker-a'),geo.claimGeoSampleJob(f.region.code,'test-worker-b')]);
 assert.equal(results.filter(Boolean).length,1);assert.equal(results.filter(x=>x===null).length,1);assert.equal(results.find(Boolean)!.id,j.id);assert.equal(await count('geo_sample_jobs',"WHERE status='processing'"),1);assert.equal((await jobRow(j.id)).attempt_count,1);ledgerEquals(await ledger(),'0.00000000','0.00800250',0);
});
test('G7','locked earliest job is skipped instead of waiting or claiming it',async f=>{
 const j=await job(f),lock=await pool.connect();try{await lock.query('BEGIN');await lock.query('SELECT id FROM geo_sample_jobs WHERE id=$1 FOR UPDATE',[j.id]);assert.equal(await geo.claimGeoSampleJob(f.region.code,'test-worker-b'),null);assert.equal((await jobRow(j.id)).status,'pending');}finally{await lock.query('ROLLBACK');lock.release();}
});
test('G8','foreign region and disabled region cannot claim',async f=>{
 const j=await job(f);assert.equal(await geo.claimGeoSampleJob('other-region','test-worker'),null);
 await query('UPDATE geo_regions SET is_enabled=false WHERE id=$1',[f.region.id]);assert.equal(await geo.claimGeoSampleJob(f.region.code,'test-worker'),null);assert.equal((await jobRow(j.id)).status,'pending');
});

// P1: queuing and scheduling.
for(const status of ['pending','processing','completed','failed'])test('G10',`manual throttle rejects recent ${status}`,async f=>{
 const j=await job(f);await query('UPDATE geo_sample_jobs SET status=$2 WHERE id=$1',[j.id,status]);await rejected(()=>geo.queueGeoMonitorSample(f.actor,f.target.id),409,'此目标已有任务，或最近五分钟已经提交');assert.equal(await count('geo_sample_jobs'),1);
});
for(const status of ['completed','failed'])test('G10',`manual throttle permits ${status} older than five minutes`,async f=>{
 const j=await job(f);await query("UPDATE geo_sample_jobs SET status=$2,created_at=now()-interval '6 minutes' WHERE id=$1",[j.id,status]);assert.equal((await geo.queueGeoMonitorSample(f.actor,f.target.id)).status,'pending');assert.equal(await count('geo_sample_jobs'),2);
});
test('G11','manual queue rejects missing and disabled targets',async f=>{
 await rejected(()=>geo.queueGeoMonitorSample(f.actor,randomUUID()),404,'监测目标未启用');await query('UPDATE geo_monitor_targets SET is_enabled=false WHERE id=$1',[f.target.id]);await rejected(()=>geo.queueGeoMonitorSample(f.actor,f.target.id),404,'监测目标未启用');
});
for(const status of ['pending','processing'])test('G12',`global queue counts ${status} at capacity`,async f=>{
 const other=await one("INSERT INTO geo_prompts(locale_id,market,prompt,brand_name,created_by) VALUES($1,'US','Another independent prompt','BRAND',$2) RETURNING *",[f.prompt.locale_id,f.actor.id]);
 const t=await geo.saveGeoTarget(f.actor,{promptId:other.id,modelProfileId:f.model.id,regionId:f.region.id,intervalMinutes:60,enabled:true});
 await query('INSERT INTO geo_sample_jobs(target_id,kind,status) VALUES($1,\'manual\',$2)',[t.id,status]);await geo.saveGeoBudget(f.actor,{...budgetInput,maxQueuedJobs:1});await rejected(()=>geo.queueGeoMonitorSample(f.actor,f.target.id),429,'监测队列已满，请稍后再试');
});
for(const status of ['pending','processing'])test('G13',`scheduler advances in-flight ${status} target without duplication`,async f=>{
 const j=await job(f);await query('UPDATE geo_sample_jobs SET status=$2 WHERE id=$1',[j.id,status]);assert.equal(await geo.scheduleDueGeoTargets(),1);assert.equal(await count('geo_sample_jobs'),1);
 const r=await one("SELECT next_run_at=updated_at+interval '60 minutes' AS exact FROM geo_monitor_targets WHERE id=$1",[f.target.id]);assert.equal(r.exact,true);
});
test('G14','full queue defers scheduling exactly fifteen minutes',async f=>{
 const other=await one("INSERT INTO geo_prompts(locale_id,market,prompt,brand_name,created_by) VALUES($1,'US','Capacity occupying prompt','BRAND',$2) RETURNING *",[f.prompt.locale_id,f.actor.id]);
 const t=await geo.saveGeoTarget(f.actor,{promptId:other.id,modelProfileId:f.model.id,regionId:f.region.id,intervalMinutes:60,enabled:true});await query("UPDATE geo_monitor_targets SET next_run_at=now()+interval '1 day' WHERE id=$1",[t.id]);await query("INSERT INTO geo_sample_jobs(target_id,kind) VALUES($1,'manual')",[t.id]);await geo.saveGeoBudget(f.actor,{...budgetInput,maxQueuedJobs:1});
 assert.equal(await geo.scheduleDueGeoTargets(),0);const row=await one("SELECT last_error,next_run_at=updated_at+interval '15 minutes' AS exact FROM geo_monitor_targets WHERE id=$1",[f.target.id]);assert.equal(row.exact,true);assert.equal(row.last_error,'监测队列已满，稍后重试');assert.equal(await count('geo_sample_jobs'),1);
});
for(const table of ['geo_prompts','geo_model_profiles','geo_regions','geo_monitor_targets'])test('G15',`scheduler requires enabled ${table}`,async f=>{
 const id=table==='geo_prompts'?f.prompt.id:table==='geo_model_profiles'?f.model.id:table==='geo_regions'?f.region.id:f.target.id;
 await query(`UPDATE ${table} SET is_enabled=false WHERE id=$1`,[id]);assert.equal(await geo.scheduleDueGeoTargets(),0);assert.equal(await count('geo_sample_jobs'),0);
});
test('G15','scheduler skips a target held by a different transaction',async f=>{
 const lock=await pool.connect();try{await lock.query('BEGIN');await lock.query('SELECT id FROM geo_monitor_targets WHERE id=$1 FOR UPDATE',[f.target.id]);assert.equal(await geo.scheduleDueGeoTargets(),0);assert.equal(await count('geo_sample_jobs'),0);}finally{await lock.query('ROLLBACK');lock.release();}
});
test('G15','scheduler stops after one hundred due targets',async f=>{
 await query("INSERT INTO geo_prompts(locale_id,market,prompt,brand_name,created_by) SELECT $1,'US','Batch scheduling prompt '||n,'BRAND',$2 FROM generate_series(1,100) n",[f.prompt.locale_id,f.actor.id]);
 await query('INSERT INTO geo_monitor_targets(prompt_id,model_profile_id,region_id,interval_minutes,is_enabled,created_by) SELECT id,$1,$2,60,true,$3 FROM geo_prompts WHERE created_by=$3 AND id<>$4',[f.model.id,f.region.id,f.actor.id,f.prompt.id]);
 assert.equal(await count('geo_monitor_targets'),101);assert.equal(await geo.scheduleDueGeoTargets(),100);assert.equal(await count('geo_sample_jobs'),100);assert.equal(await count('geo_monitor_targets','WHERE next_run_at<=now()'),1);
});
test('G16','long outage schedules one job and advances from transaction now',async f=>{
 await query("UPDATE geo_monitor_targets SET next_run_at=now()-interval '90 days' WHERE id=$1",[f.target.id]);assert.equal(await geo.scheduleDueGeoTargets(),1);assert.equal(await geo.scheduleDueGeoTargets(),0);assert.equal(await count('geo_sample_jobs'),1);assert.equal((await one("SELECT next_run_at=updated_at+interval '60 minutes' AS exact FROM geo_monitor_targets WHERE id=$1",[f.target.id])).exact,true);
});
test('G17','completed job replay returns 409 and leaves all accounting untouched',async f=>{
 const j=await claim(f);await geo.processGeoSampleJob(j);const before=await ledger(),rollups=await query('SELECT * FROM geo_daily_rollups'),target=await targetRow(f);
 await rejected(()=>geo.processGeoSampleJob(j),409,'采样任务状态已变化');assert.equal(await count('geo_samples'),1);assert.deepEqual(await ledger(),before);assert.deepEqual(await query('SELECT * FROM geo_daily_rollups'),rollups);assert.deepEqual(await targetRow(f),target);assert.equal((await jobRow(j.id)).status,'completed');
});

// P2: responses, hashes, transactions and trends.
test('G18','length finish reason fails and releases reservation',async f=>{finish='length';await failed(f,'回答被截断');});
test('G19','non-JSON content fails and releases reservation',async f=>{content='not JSON';await failed(f,'模型未返回有效 JSON');});
for(const answer of [42,'','   ','x'.repeat(20001)])test('G20',`invalid answer ${typeof answer}:${String(answer).length} fails`,async f=>{content=JSON.stringify({answer});await failed(f,'模型未返回有效答案');});
test('G21','citations discard non-HTTPS and non-strings and cap at twenty',async f=>{
 const legal=Array.from({length:21},(_,i)=>`https://example.invalid/${i}`);content=JSON.stringify({answer:'BRAND',citations:['http://example.invalid',42,null,{},...legal]});const s=await sample(f);assert.deepEqual(s.citations,legal.slice(0,20));
});
test('G22,G23','provider usage and uppercase brand are recorded exactly',async f=>{
 content=JSON.stringify({answer:'Our BRAND glassware',citations:[]});const s=await sample(f);assert.equal(s.usage_source,'provider');assert.equal(s.input_tokens,101);assert.equal(s.output_tokens,23);assert.equal(s.brand_mentioned,true);assert.equal(s.cost_usd,'0.00018375');
});
test('G22,G23','absent usage estimates from actual request and content lengths',async f=>{
 usage=undefined;content=JSON.stringify({answer:'Our brand glassware',citations:[]});const s=await sample(f);
 const inputTokens=Math.ceil(JSON.stringify(lastRequest.messages).length/2),outputTokens=Math.ceil(content.length/2);
 assert.equal(s.usage_source,'estimated');assert.equal(s.input_tokens,inputTokens);assert.equal(s.output_tokens,outputTokens);assert.equal(s.brand_mentioned,true);assert.equal(s.cost_usd,((inputTokens*1.25+outputTokens*2.5)/1e6).toFixed(8));
});
test('G23','absent brand is not mentioned',async f=>{content=JSON.stringify({answer:'Other glassware',citations:[]});assert.equal((await sample(f)).brand_mentioned,false);});
test('G24','configuration hash matches independent eight-field SHA256 oracle',async f=>{
 const j=await claim(f),s=await geo.processGeoSampleJob(j);assert.equal((await one('SELECT config_hash FROM geo_samples WHERE id=$1',[s.id])).config_hash,hash(j));
});
for(const field of ['prompt','market','brand_name','locale_code','model','endpoint','profile_id','region_id'])test('G24',`changing only ${field} changes the recorded hash`,async f=>{
 const first=await claim(f),result=await geo.processGeoSampleJob(first),baseline=(await one('SELECT config_hash FROM geo_samples WHERE id=$1',[result.id])).config_hash;
 const next=await claim(f);let changed:any;
 if(field==='endpoint')changed=endpoint+'/alternate';
 else if(field==='profile_id')changed=(await geo.saveGeoModel(f.actor,{...f.modelInput,code:'alt-'+randomUUID().slice(0,8)})).id;
 else if(field==='region_id')changed=(await geo.saveGeoRegion(f.actor,{code:'alt-'+randomUUID().slice(0,8),displayName:'Alternate region',enabled:true})).id;
 else changed=field==='model'?'test-model-v2':field==='locale_code'?'zh':String(next[field])+' changed';
 // A claimed job is the public processor's snapshot input. Every field except one stays equal.
 const mutated={...next,[field]:changed},res=await geo.processGeoSampleJob(mutated),actual=(await one('SELECT config_hash FROM geo_samples WHERE id=$1',[res.id])).config_hash;
 assert.notEqual(actual,baseline);assert.equal(actual,hash(mutated));
});
test('G25','trend excludes old endpoint hash including mentions, links and cost',async f=>{
 await sample(f);await geo.saveGeoModel(f.actor,{...f.modelInput,id:f.model.id,apiKey:undefined,endpoint:endpoint+'/new'});content=JSON.stringify({answer:'Unrelated glassware',citations:[]});usage={prompt_tokens:7,completion_tokens:3};await sample(f);
 const trend=await geo.geoMonitorTrend(f.actor,f.prompt.id,30),series=trend.series.find(x=>x.id===f.target.id)!;
 assert.equal(series.configurationChanged,true);assert.equal(series.samples,1);assert.equal(series.mentionRate,0);assert.equal(series.avgLinksPerSample,0);assert.equal(series.costUsd,0.00001625);assert.equal(series.daily.length,1);assert.equal(series.daily[0].samples,1);assert.equal(await count('geo_daily_rollups'),2);
});
test('G26','no samples produces null rates, zero samples and zero cost',async f=>{
 const series=(await geo.geoMonitorTrend(f.actor,f.prompt.id,7)).series[0];assert.equal(series.mentionRate,null);assert.equal(series.avgLinksPerSample,null);assert.equal(series.samples,0);assert.equal(series.costUsd,0);assert.equal(series.configurationChanged,false);assert.deepEqual(series.daily,[]);
});
test('G27,G28','two successes accumulate one daily rollup and complete all five writes',async f=>{
 await query("UPDATE geo_monitor_targets SET last_error='old error' WHERE id=$1",[f.target.id]);const j1=await claim(f);await geo.processGeoSampleJob(j1);const roll1=(await query('SELECT * FROM geo_daily_rollups'))[0];
 const j2=await claim(f);await geo.processGeoSampleJob(j2);assert.equal(await count('geo_samples'),2);assert.equal(await count('geo_daily_rollups'),1);const roll=(await query('SELECT * FROM geo_daily_rollups'))[0];
 assert.equal(roll.samples,2);assert.equal(roll.mentions,2);assert.equal(roll.citations,2);assert.equal(Number(roll.input_tokens),202);assert.equal(Number(roll.output_tokens),46);assert.equal(roll.cost_usd,'0.00036750');assert.ok(Number(roll.duration_ms)>=Number(roll1.duration_ms));
 for(const id of [j1.id,j2.id]){const j=await jobRow(id);assert.equal(j.status,'completed');assert.ok(j.finished_at);}
 const target=await targetRow(f);assert.ok(target.last_run_at);assert.equal(target.last_error,null);ledgerEquals(await ledger(),'0.00036750','0.00000000',2);
 const daily=(await geo.geoMonitorTrend(f.actor,f.prompt.id,7)).series[0].daily[0];assert.equal(daily.avgDurationMs,Math.round(Number(roll.duration_ms)/2));
 // Controlled duration oracle: independent per-row observations can differ by a millisecond
 // between the sample and rollup writes. Set the actual stored per-day total and verify averaging.
 await query('UPDATE geo_daily_rollups SET duration_ms=101 WHERE target_id=$1',[f.target.id]);assert.equal((await geo.geoMonitorTrend(f.actor,f.prompt.id,7)).series[0].daily[0].avgDurationMs,51);
});
test('G28','deterministic processing clock proves rollup duration adds both samples',async f=>{
 const originalNow=Date.now;let clock=1000;
 Date.now=()=>String(new Error().stack).replace(/\\/g,'/').includes('/packages/domain/src/geo-monitoring.ts:')?(clock+=10):originalNow();
 try{
  await sample(f);const first=(await query('SELECT * FROM geo_daily_rollups'))[0];assert.equal(Number(first.duration_ms),20);
  await sample(f);const roll=(await query('SELECT * FROM geo_daily_rollups'))[0];assert.equal(Number(roll.duration_ms),40);assert.equal(roll.samples,2);
  assert.equal((await geo.geoMonitorTrend(f.actor,f.prompt.id,7)).series[0].daily[0].avgDurationMs,20);
 }finally{Date.now=originalNow;}
});
async function sentinel(f:Fixture,j:Row){return one("INSERT INTO geo_samples(prompt_id,model,answer,brand_mentioned,duration_ms,monitor_job_id,prompt_snapshot,market_snapshot,brand_snapshot,config_hash,sample_kind) VALUES($1,'sentinel','sentinel answer',false,1,$2,'sentinel prompt','US','BRAND',repeat('0',64),'manual') RETURNING *",[f.prompt.id,j.id]);}
test('G27b','duplicate sentinel survives rollback; no success data or expense is committed',async f=>{
 const j=await claim(f),s=await sentinel(f,j),before=await ledger();
 await assert.rejects(()=>geo.processGeoSampleJob(j),(e:any)=>e.code==='23505'&&e.constraint==='geo_samples_monitor_job_id_key');
 assert.equal(await count('geo_samples'),1);assert.deepEqual(await one('SELECT * FROM geo_samples WHERE id=$1',[s.id]),s);assert.equal(await count('geo_daily_rollups'),0);
 for(const r of await ledger()){const b=before.find(x=>x.period===r.period)!;assert.equal(r.spent_usd,b.spent_usd);assert.equal(r.sample_count,b.sample_count);}
 assert.equal((await targetRow(f)).last_run_at,null);assert.notEqual((await jobRow(j.id)).status,'completed');
});
test('G27b','late target-write failure rolls back earlier sample, rollup, expense and completion',async f=>{
 const j=await claim(f),before=await ledger();
 // This test-only trigger belongs to this disposable database, not an applied migration.
 await query("CREATE FUNCTION geo_test_abort_target() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN IF NEW.last_run_at IS DISTINCT FROM OLD.last_run_at THEN RAISE EXCEPTION 'geo-test late transaction failure'; END IF; RETURN NEW; END $$");
 await query('CREATE TRIGGER geo_test_abort_target BEFORE UPDATE ON geo_monitor_targets FOR EACH ROW EXECUTE FUNCTION geo_test_abort_target()');
 try{await assert.rejects(()=>geo.processGeoSampleJob(j),/geo-test late transaction failure/);assert.equal(await count('geo_samples'),0);assert.equal(await count('geo_daily_rollups'),0);for(const r of await ledger()){const b=before.find(x=>x.period===r.period)!;assert.equal(r.spent_usd,b.spent_usd);assert.equal(r.sample_count,b.sample_count);}assert.equal((await targetRow(f)).last_run_at,null);assert.notEqual((await jobRow(j.id)).status,'completed');}
 finally{await query('DROP TRIGGER geo_test_abort_target ON geo_monitor_targets');await query('DROP FUNCTION geo_test_abort_target()');}
});
test('G6,G53','transaction rejection must reach compensation immediately, not after recovery',async f=>{
 const j=await claim(f);await sentinel(f,j);await assert.rejects(()=>geo.processGeoSampleJob(j),(e:any)=>e.code==='23505');
 const row=await jobRow(j.id),target=await targetRow(f),windows=await ledger();
 assert.deepEqual({status:row.status,finished:!!row.finished_at,jobError:!!row.error_message,targetError:!!target.last_error,windows:windows.map(r=>({period:r.period,reserved:r.reserved_usd,spent:r.spent_usd,samples:Number(r.sample_count)}))},
 {status:'failed',finished:true,jobError:true,targetError:true,windows:[{period:'day',reserved:'0.00000000',spent:'0.00000000',samples:0},{period:'month',reserved:'0.00000000',spent:'0.00000000',samples:0}]},'G53: product must await success transaction so catch can compensate its rejection');
});

// P3: credentials, errors and authorization.
test('G29','upstream errors redact URLs and are bounded',async f=>{
 upstreamStatus=400;upstreamError='failure https://api.example.com/v1 '+ 'x'.repeat(800);const j=await claim(f);await assert.rejects(()=>geo.processGeoSampleJob(j));const row=await jobRow(j.id);assert.ok(row.error_message.includes('[URL]'));assert.ok(!row.error_message.includes('https://api.example.com/v1'));assert.ok(row.error_message.length<=500);assert.equal((await targetRow(f)).last_error,row.error_message);
});
test('G29','long pre-transaction error is truncated to exactly five hundred characters',async f=>{
 const j=await claim(f);
 // Controlled pre-transaction throw through the public processor's snapshot argument.
 Object.defineProperty(j,'prompt',{get(){throw new Error('failure https://api.example.com/v1 '+ 'x'.repeat(800));}});
 await assert.rejects(()=>geo.processGeoSampleJob(j));const row=await jobRow(j.id);
 assert.equal(row.error_message.length,500);assert.ok(row.error_message.includes('[URL]'));assert.ok(!row.error_message.includes('https://api.example.com/v1'));assert.equal((await targetRow(f)).last_error,row.error_message);
});
test('G30,G34','profile key is sealed, omitted from views, and retained by blank updates',async f=>{
 const row=await one('SELECT key_cipher,has_credential FROM geo_model_profiles WHERE id=$1',[f.model.id]);assert.match(row.key_cipher,/^v1:[A-Za-z0-9_-]+:[A-Za-z0-9_-]+:[A-Za-z0-9_-]+$/);assert.ok(!row.key_cipher.includes(f.modelInput.apiKey));assert.equal(row.has_credential,true);assert.ok(!('key_cipher' in f.model));
 for(const apiKey of [undefined,'','   ']){await geo.saveGeoModel(f.actor,{...f.modelInput,id:f.model.id,apiKey});assert.equal((await one('SELECT key_cipher FROM geo_model_profiles WHERE id=$1',[f.model.id])).key_cipher,row.key_cipher);}
 const workspace=await geo.geoMonitorWorkspace(f.actor);assert.ok(!('key_cipher' in workspace.models.find(x=>x.id===f.model.id)!));assert.equal(workspace.models.find(x=>x.id===f.model.id)!.has_credential,true);
 await rejected(()=>geo.saveGeoModel(f.actor,{...f.modelInput,code:'no-key',apiKey:undefined}),400,'专用模型需要 API 密钥');
});
for(const segment of [0,1,2,3])test('G31',`cipher segment ${segment} tampering fails authenticated decryption`,async f=>{
 const parts=(await one('SELECT key_cipher FROM geo_model_profiles WHERE id=$1',[f.model.id])).key_cipher.split(':');
 if(segment===0)parts[0]='v2';else{const bytes=Buffer.from(parts[segment],'base64url');bytes[0]^=1;parts[segment]=bytes.toString('base64url');}
 await query('UPDATE geo_model_profiles SET key_cipher=$2 WHERE id=$1',[f.model.id,parts.join(':')]);await failed(f,'监测模型密钥无法解密，请管理员重新保存',503);assert.equal(requestCount,0);
});
for(const secret of [undefined,'x'.repeat(31)])test('G32',`missing/short GEO secret (${secret?.length??0}) rejects profile save`,async f=>{
 await withinEnv({GEO_MONITOR_SECRET:secret},()=>rejected(()=>geo.saveGeoModel(f.actor,{...f.modelInput,code:'short-secret'}),503,'服务器缺少 GEO_MONITOR_SECRET（至少 32 字符），无法保存专用模型密钥'));assert.equal(await count('geo_model_profiles'),1);
});
test('G33','site-default endpoint must match the one runtime settings source',async f=>{
 await query("INSERT INTO runtime_settings(key,value) VALUES('translation.llm',$1::jsonb) ON CONFLICT(key) DO UPDATE SET value=EXCLUDED.value",[JSON.stringify({url:endpoint+'/site',model:'test-model',enabled:true})]);
 await rejected(()=>geo.saveGeoModel(f.actor,{...f.modelInput,code:'site-model',credentialSource:'site_default',apiKey:undefined}),400,'复用站点密钥时，端点必须与当前 AI 设置完全一致');
 const model=await geo.saveGeoModel(f.actor,{...f.modelInput,code:'site-model',endpoint:endpoint+'/site',credentialSource:'site_default',apiKey:undefined});assert.equal(model.credential_source,'site_default');assert.equal(model.has_credential,false);assert.equal((await one('SELECT key_cipher FROM geo_model_profiles WHERE id=$1',[model.id])).key_cipher,null);
 const t=await geo.saveGeoTarget(f.actor,{promptId:f.prompt.id,modelProfileId:model.id,regionId:f.region.id,intervalMinutes:60,enabled:true});const s=await sample({...f,model,target:t});assert.equal(s.model_profile_id,model.id);assert.equal(requestCount,1);
});
for(const role of ['client','translator','seo_manager'])test('G35',`${role} cannot configure model, region or budget`,async f=>{
 const actor={...f.actor,role};const message='只有管理员可配置监测模型、地区和预算';await rejected(()=>geo.saveGeoModel(actor,f.modelInput),403,message);await rejected(()=>geo.saveGeoRegion(actor,{code:'denied-region',displayName:'Denied',enabled:true}),403,message);await rejected(()=>geo.saveGeoBudget(actor,budgetInput),403,message);
});
for(const role of ['client','translator'])test('G36',`${role} without explicit SEO permissions cannot read or write`,async f=>{
 const actor={...f.actor,role,permissions:[]};await rejected(()=>geo.geoMonitorWorkspace(actor),403,'没有 GEO 监测权限');await rejected(()=>geo.geoMonitorTrend(actor,f.prompt.id,7),403,'没有 GEO 监测权限');await rejected(()=>geo.saveGeoTarget(actor,targetInput(f)),403,'没有 GEO 监测权限');await rejected(()=>geo.queueGeoMonitorSample(actor,f.target.id),403,'没有 GEO 监测权限');
});
test('G36','read-only SEO permission permits workspace/trend and denies writes',async f=>{
 const actor={...f.actor,role:'client',permissions:['seo.read']};assert.ok(await geo.geoMonitorWorkspace(actor));assert.ok(await geo.geoMonitorTrend(actor,f.prompt.id,7));await rejected(()=>geo.saveGeoTarget(actor,targetInput(f)),403,'没有 GEO 监测权限');await rejected(()=>geo.queueGeoMonitorSample(actor,f.target.id),403,'没有 GEO 监测权限');
});

// P4: exercise actual v2 dispatcher schemas, not duplicated test schemas.
test('G37','region routing code is immutable after creation',async f=>{
 await rejected(()=>geo.saveGeoRegion(f.actor,{id:f.region.id,code:'changed-region',displayName:'Region',enabled:true}),400,'地区代码用于 Worker 路由，创建后不可更改');assert.equal((await one('SELECT code FROM geo_regions WHERE id=$1',[f.region.id])).code,f.region.code);
});
for(const [input,expected]of [[' CN ','cn'],['A-B_9','a-b_9'],[' CN-T ','cn-t']])test('G38',`HTTP code ${JSON.stringify(input)} normalizes to ${expected}`,async f=>{
 const response=await http(f,'geo-monitor-region',{code:input,displayName:'Normalized region',enabled:true});assert.equal(response.status,201);const row=await response.json();assert.equal(row.code,expected);assert.equal((await one('SELECT code FROM geo_regions WHERE id=$1',[row.id])).code,expected);
});
test('G38','HTTP length gate and domain character gate remain distinct',async f=>{
 for(const code of ['c','x'.repeat(41)])await zodReject(f,'geo-monitor-region',{code,displayName:'Region',enabled:true},'code');await rejected(()=>http(f,'geo-monitor-region',{code:'a b',displayName:'Region',enabled:true}),400,'代码需为 2–40 位小写字母、数字、下划线或短横线');
});
test('G39','country normalizes lowercase; HTTP length and domain format reject independently',async f=>{
 const response=await http(f,'geo-monitor-region',{code:'country-cn',displayName:'Country',countryCode:'cn',enabled:true});assert.equal(response.status,201);assert.equal((await response.json()).country_code,'CN');
 for(const countryCode of ['CHN','c n'])await zodReject(f,'geo-monitor-region',{code:'country-bad',displayName:'Country',countryCode,enabled:true},'countryCode');await rejected(()=>http(f,'geo-monitor-region',{code:'country-short',displayName:'Country',countryCode:'C',enabled:true}),400,'国家代码应为两个大写字母');
 assert.equal((await geo.saveGeoRegion(f.actor,{code:'country-direct',displayName:'Country',countryCode:' cn ',enabled:true})).country_code,'CN');
 for(const field of ['countryCode','description'])await zodReject(f,'geo-monitor-region',{code:'null-fields',displayName:'Region',enabled:true,[field]:null},field);
});
for(const table of ['geo_prompts','geo_model_profiles','geo_regions'])test('G40',`disabled ${table} prevents enabling target`,async f=>{
 const id=table==='geo_prompts'?f.prompt.id:table==='geo_model_profiles'?f.model.id:f.region.id;await query(`UPDATE ${table} SET is_enabled=false WHERE id=$1`,[id]);await rejected(()=>geo.saveGeoTarget(f.actor,targetInput(f)),400,'启用目标前，请启用问题、模型和地区');
});
test('G41','existing target cannot exchange any of its three foreign keys',async f=>{
 const p=await one("INSERT INTO geo_prompts(locale_id,market,prompt,brand_name,created_by) VALUES($1,'US','Replacement prompt value','BRAND',$2) RETURNING *",[f.prompt.locale_id,f.actor.id]);const m=await geo.saveGeoModel(f.actor,{...f.modelInput,code:'replacement-model'});const r=await geo.saveGeoRegion(f.actor,{code:'replacement-region',displayName:'Replacement',enabled:true});
 for(const [field,id]of [['promptId',p.id],['modelProfileId',m.id],['regionId',r.id]])await rejected(()=>geo.saveGeoTarget(f.actor,{...targetInput(f),[field]:id}),400,'问题、模型和地区不可在现有目标上更换；请新建组合');
 await assert.rejects(()=>geo.saveGeoTarget(f.actor,{...targetInput(f),id:undefined}),(e:any)=>e.code==='23505');
});
for(const kind of ['reenable','interval'])test('G42',`${kind} sets immediate next_run_at and clears last_error`,async f=>{
 await query("UPDATE geo_monitor_targets SET is_enabled=$2,next_run_at=now()+interval '3 days',last_error='old error' WHERE id=$1",[f.target.id,kind!=='reenable']);const input={...targetInput(f),intervalMinutes:kind==='interval'?120:60};await geo.saveGeoTarget(f.actor,input);
 const row=await one('SELECT next_run_at=updated_at AS immediate,last_error FROM geo_monitor_targets WHERE id=$1',[f.target.id]);assert.equal(row.immediate,true);assert.equal(row.last_error,null);
});
test('G43','monthly below daily fails; equality passes',async f=>{
 await rejected(()=>geo.saveGeoBudget(f.actor,{...budgetInput,dailyLimitUsd:2,monthlyLimitUsd:1}),400,'月度上限不得小于每日上限');assert.equal(Number((await geo.saveGeoBudget(f.actor,{...budgetInput,dailyLimitUsd:2,monthlyLimitUsd:2})).monthly_limit_usd),2);
});
test('G44','rate bounds reject before SQL; zero and maximum are accepted',async f=>{
 for(const field of ['inputRate','outputRate'])for(const value of [-0.000001,100000.000001,NaN,Infinity])await rejected(()=>geo.saveGeoModel(f.actor,{...f.modelInput,[field]:value}),400,'请输入有效的美元/百万 token 单价');
 for(const value of [0,100000]){const row=await geo.saveGeoModel(f.actor,{...f.modelInput,id:f.model.id,inputRate:value,outputRate:value});assert.equal(Number(row.input_usd_per_million),value);assert.equal(Number(row.output_usd_per_million),value);}
});
for(const [field,values]of [['maxOutputTokens',[299,3001,300.5]],['displayName',['x','x'.repeat(101)]],['provider',['x','x'.repeat(81)]]] as const)test('G44',`HTTP validates ${field} bounds`,async f=>{
 for(const value of values)await zodReject(f,'geo-monitor-model',{...f.modelInput,[field]:value},field);
});
test('G44','HTTP model parameter endpoints are inclusive',async f=>{
 for(const [nameLen,providerLen,tokens]of [[2,2,300],[100,80,3000]]){const response=await http(f,'geo-monitor-model',{...f.modelInput,id:f.model.id,displayName:'n'.repeat(nameLen),provider:'p'.repeat(providerLen),maxOutputTokens:tokens});assert.equal(response.status,200);assert.equal((await response.json()).max_output_tokens,tokens);}
});
test('G44','database second gate rejects bad display/provider/token and negative rate',async f=>{
 for(const [field,value]of [['display_name','x'],['display_name','x'.repeat(101)],['provider','x'],['provider','x'.repeat(81)],['max_output_tokens',299],['max_output_tokens',3001],['input_usd_per_million',-1],['output_usd_per_million',-1]])await assert.rejects(()=>query(`UPDATE geo_model_profiles SET ${field}=$2 WHERE id=$1`,[f.model.id,value]),(e:any)=>e.code==='23514');
});
test('G45','interval HTTP and DB gates reject outside inclusive 60–10080',async f=>{
 for(const intervalMinutes of [59,10081,60.5])await zodReject(f,'geo-monitor-target',{...targetInput(f),intervalMinutes},'intervalMinutes');for(const intervalMinutes of [59,10081])await assert.rejects(()=>query('UPDATE geo_monitor_targets SET interval_minutes=$2 WHERE id=$1',[f.target.id,intervalMinutes]),(e:any)=>e.code==='23514');for(const intervalMinutes of [60,10080])assert.equal((await geo.saveGeoTarget(f.actor,{...targetInput(f),intervalMinutes})).interval_minutes,intervalMinutes);
});
test('G46','trend day enumeration and missing prompt are precise',async f=>{
 for(const days of [7,30,90])assert.equal((await geo.geoMonitorTrend(f.actor,f.prompt.id,days)).days,days);for(const days of [0,6,8,29,31,91,NaN])await rejected(()=>geo.geoMonitorTrend(f.actor,f.prompt.id,days),400,'只支持 7、30 或 90 天');await rejected(()=>geo.geoMonitorTrend(f.actor,randomUUID(),7),404,'监测问题不存在');
});

// P5: identity, heartbeat and stale reservation recovery.
test('G47','worker defaults, whitespace normalization and length cap',async()=>{
 await withinEnv({GEO_WORKER_REGION_CODE:undefined,GEO_WORKER_ID:undefined},()=>assert.deepEqual(geo.geoWorkerIdentity(),{region:'local',workerId:hostname()+'-'+process.pid}));
 await withinEnv({GEO_WORKER_REGION_CODE:' CN ',GEO_WORKER_ID:'worker \t one'},()=>assert.deepEqual(geo.geoWorkerIdentity(),{region:'cn',workerId:'worker-one'}));await withinEnv({GEO_WORKER_ID:'x'.repeat(121)},()=>assert.equal(geo.geoWorkerIdentity().workerId.length,120));
});
test('G48','heartbeat rejects missing and disabled region',async f=>{
 await rejected(()=>geo.geoWorkerHeartbeat('missing-region','test-worker'),400,'Worker 地区未启用或不存在');await query('UPDATE geo_regions SET is_enabled=false WHERE id=$1',[f.region.id]);await rejected(()=>geo.geoWorkerHeartbeat(f.region.code,'test-worker'),400,'Worker 地区未启用或不存在');
});
test('G49,G50','heartbeat upsert refreshes once and workspace excludes stale workers',async f=>{
 await geo.geoWorkerHeartbeat(f.region.code,'test-worker');await query("UPDATE geo_worker_heartbeats SET last_seen_at=now()-interval '3 minutes' WHERE worker_id='test-worker'");const old=await one("SELECT * FROM geo_worker_heartbeats WHERE worker_id='test-worker'");assert.ok(!(await geo.geoMonitorWorkspace(f.actor)).workers.some(x=>x.worker_id==='test-worker'));
 await geo.geoWorkerHeartbeat(f.region.code,'test-worker');assert.equal(await count('geo_worker_heartbeats'),1);const fresh=await one("SELECT * FROM geo_worker_heartbeats WHERE worker_id='test-worker'");assert.ok(fresh.last_seen_at>old.last_seen_at);assert.equal(fresh.started_at.getTime(),old.started_at.getTime());assert.ok((await geo.geoMonitorWorkspace(f.actor)).workers.some(x=>x.worker_id==='test-worker'));
});
test('G51','stale processing recovers once; fresh processing retains its reservation',async f=>{
 const stale=await claim(f);await query("UPDATE geo_sample_jobs SET started_at=now()-interval '11 minutes' WHERE id=$1",[stale.id]);const fresh=await claim(f);assert.equal(await geo.recoverGeoJobs(),1);
 const r=await jobRow(stale.id);assert.equal(r.status,'failed');assert.equal(r.error_message,'Worker 中断；是否产生供应商费用需核对账单');assert.ok(r.finished_at);assert.equal((await jobRow(fresh.id)).status,'processing');ledgerEquals(await ledger(),'0.00000000','0.00800250',0);assert.equal(await geo.recoverGeoJobs(),0);ledgerEquals(await ledger(),'0.00000000','0.00800250',0);
});

// Serial cases are essential: budget windows and environment are process/global state.
let passed=0;const failures:Row[]=[];
const restoredTables=['geo_samples','geo_daily_rollups','geo_sample_jobs','geo_monitor_targets','geo_model_profiles','geo_prompts','geo_worker_heartbeats'];
const initialCounts:Record<string,number>={};
const initialBudget=await one('SELECT * FROM geo_monitor_budget WHERE singleton_key=true');
const initialWindows=await query('SELECT * FROM geo_budget_windows');
const initialSettings=await query("SELECT * FROM runtime_settings WHERE key='translation.llm'");
async function restoreShared(){
 await query('DELETE FROM geo_budget_windows');for(const r of initialWindows)await query('INSERT INTO geo_budget_windows(period,starts_on,spent_usd,reserved_usd,sample_count,updated_at) VALUES($1,$2,$3,$4,$5,$6)',[r.period,r.starts_on,r.spent_usd,r.reserved_usd,r.sample_count,r.updated_at]);
 await query('UPDATE geo_monitor_budget SET daily_limit_usd=$1,monthly_limit_usd=$2,max_queued_jobs=$3,is_enabled=$4,updated_by=$5 WHERE singleton_key=true',[initialBudget.daily_limit_usd,initialBudget.monthly_limit_usd,initialBudget.max_queued_jobs,initialBudget.is_enabled,initialBudget.updated_by]);
 await query("DELETE FROM runtime_settings WHERE key='translation.llm'");for(const r of initialSettings)await query('INSERT INTO runtime_settings(key,value) VALUES($1,$2::jsonb)',[r.key,JSON.stringify(r.value)]);
}
async function cleanup(actor:Actor){
 // Samples must be removed BEFORE targets (monitor_job_id otherwise becomes NULL).
 await query('DELETE FROM geo_samples WHERE prompt_id IN (SELECT id FROM geo_prompts WHERE created_by=$1)',[actor.id]);
 await query('DELETE FROM geo_monitor_targets WHERE created_by=$1',[actor.id]);
 await query('DELETE FROM geo_prompts WHERE created_by=$1',[actor.id]);
 await query('DELETE FROM geo_model_profiles WHERE created_by=$1',[actor.id]);
 await query('DELETE FROM geo_regions WHERE created_by=$1',[actor.id]); // heartbeats cascade
 await query('DELETE FROM audit_logs WHERE user_id=$1',[actor.id]);
 await restoreShared();await query('DELETE FROM users WHERE id=$1',[actor.id]);
 for(const table of restoredTables)assert.equal(await count(table),initialCounts[table],`${table}: fixture residue`);
 assert.equal(await count('geo_regions'),initialCounts.geo_regions);assert.equal(await count('users','WHERE id=$1',[actor.id]),0);assert.equal(await count('audit_logs','WHERE user_id=$1',[actor.id]),0);
}
try{
 for(const table of [...restoredTables,'geo_regions'])initialCounts[table]=await count(table);
 for(const table of restoredTables)assert.equal(initialCounts[table],0,`${table} must start empty in isolated verification database`);
 for(const t of cases){const id=randomUUID(),actor:Actor={id,email:`geo-${id}@example.invalid`,role:'super_admin',displayName:'GEO L1 test'};
  content=JSON.stringify({answer:'BRAND glassware',citations:['https://example.invalid/evidence']});finish='stop';usage={prompt_tokens:101,completion_tokens:23};upstreamStatus=200;upstreamError='';requestCount=0;lastRequest={};
  try{
   await ensureActor(actor);await query('DELETE FROM geo_budget_windows');await query("INSERT INTO geo_budget_windows(period,starts_on) VALUES('day',(now() AT TIME ZONE 'UTC')::date),('month',date_trunc('month',now() AT TIME ZONE 'UTC')::date)");
   await geo.saveGeoBudget(actor,budgetInput);await query("DELETE FROM runtime_settings WHERE key='translation.llm'");
   const locale=await one("SELECT id FROM locales WHERE code='en'");const prompt=await one("INSERT INTO geo_prompts(locale_id,market,prompt,brand_name,created_by) VALUES($1,'US','Which glassware brands are available?','BRAND',$2) RETURNING *",[locale.id,id]);
   const modelInput={code:'model-'+id.slice(0,8),displayName:'Test model',provider:'Test provider',model:'test-model',endpoint,credentialSource:'profile' as const,apiKey:'test-only-profile-key-000000000000',inputRate:1.25,outputRate:2.5,maxOutputTokens:1201,enabled:true};
   const model=await geo.saveGeoModel(actor,modelInput),region=await geo.saveGeoRegion(actor,{code:'region-'+id.slice(0,8),displayName:'Test region',enabled:true});
   const target=await geo.saveGeoTarget(actor,{promptId:prompt.id,modelProfileId:model.id,regionId:region.id,intervalMinutes:60,enabled:true});
   await t.run({actor,prompt,model,region,target,modelInput});passed++;console.log(`PASS ${t.ids.join('/')} | ${t.title}`);
  }catch(error:any){failures.push({ids:t.ids,title:t.title,message:error.message});console.error(`FAIL ${t.ids.join('/')} | ${t.title}\n${error.stack||error}`);}
  finally{await cleanup(actor);}
 }
 for(const table of restoredTables)assert.equal(await count(table),0,`${table} final residue`);
 const covered=new Set(cases.flatMap(t=>t.ids));for(let n=1;n<=51;n++)assert.ok(covered.has('G'+n));assert.ok(covered.has('G27b'));assert.ok(covered.has('G53'));
 console.log(`GEO: ${passed}/${cases.length} passed; ${failures.length} failed; 53 contract IDs covered (G1–G51, G27b, G53; no G52 was defined).`);
 console.log('PASS GEO fixture cleanup: samples/jobs/targets/rollups/models/prompts/heartbeats=0; seeded local region and shared settings restored.');
 if(failures.length)process.exitCode=1;
}finally{
 try{await restoreShared();}finally{globalThis.fetch=originalFetch;for(const [k,v]of Object.entries(savedEnv))v===undefined?delete process.env[k]:process.env[k]=v;fake.closeAllConnections();await new Promise<void>((resolve,reject)=>fake.close(e=>e?reject(e):resolve()));await pool.end();}
}
