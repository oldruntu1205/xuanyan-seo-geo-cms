import {test,after} from 'node:test';import assert from 'node:assert/strict';
import {pool} from '../packages/domain/src/db';
import {DomainError} from '../packages/domain/src/crud';
import {normalizeLLMModel,normalizeLLMEndpoint,normalizeLLMApiKey,llmEndpointProblem,encryptLLMApiKey,decryptLLMApiKey,llmKeyFingerprint,llmProviderFailure,llmNetworkFailure,llmTranslateBatch,LLM_TIMEOUT_MS} from '../packages/domain/src/llm';

process.env.PAYLOAD_SECRET='unit-test-secret-value-at-least-32-chars-long';
after(()=>pool.end());

const KEY='sk-abcdefghijklmnopqrstuvwxyz012345';
const ENDPOINT='https://api.deepseek.com/chat/completions';
const config={endpoint:ENDPOINT,apiKey:KEY,model:'deepseek-flash'};
const reply=(body:unknown,status=200)=>Promise.resolve(new Response(JSON.stringify(body),{status,headers:{'Content-Type':'application/json'}}));
const content=(value:unknown,finish_reason='stop')=>({choices:[{message:{content:JSON.stringify(value)},finish_reason}],usage:{prompt_tokens:10,completion_tokens:5,total_tokens:15}});
async function withFetch(handler:()=>Promise<Response>,run:()=>Promise<void>){const original=globalThis.fetch;globalThis.fetch=handler as typeof fetch;try{await run();}finally{globalThis.fetch=original;}}

test('接口地址只接受 HTTPS，本机调试才放行 localhost',()=>{
 assert.equal(normalizeLLMEndpoint(ENDPOINT),ENDPOINT);
 assert.match(normalizeLLMEndpoint('http://localhost:8080/v1/chat'),/^http:\/\/localhost:8080\/v1\/chat/);
 for(const bad of ['api.deepseek.com','http://api.deepseek.com/chat','https://u:p@api.deepseek.com/chat','https://api.deepseek.com/chat?x=1','https://api.deepseek.com/chat#a','file:///etc/passwd'])
  assert.throws(()=>normalizeLLMEndpoint(bad),DomainError,bad);
 assert.equal(llmEndpointProblem(ENDPOINT),'');
 assert.match(llmEndpointProblem('api.deepseek.com'),/完整网址/);
});

test('模型名与密钥在入库前先规范化',()=>{
 assert.equal(normalizeLLMModel(' deepseek-chat '),'deepseek-chat');
 for(const bad of ['','a','deepseek chat','模-型'])assert.throws(()=>normalizeLLMModel(bad),DomainError,bad);
 assert.equal(normalizeLLMApiKey(' '+KEY+' '),KEY);
 for(const bad of ['','sk-short','sk-abcdefgh ijklmnop','sk-'+'x'.repeat(600)])assert.throws(()=>normalizeLLMApiKey(bad),DomainError,bad);
});

test('密钥可加解密且密文被篡改后必然失败',()=>{
 const sealed=encryptLLMApiKey(KEY);
 assert.ok(!sealed.includes(KEY));
 assert.match(sealed,/^v1:/);
 assert.equal(decryptLLMApiKey(sealed),KEY);
 assert.notEqual(encryptLLMApiKey(KEY).split(':')[1],encryptLLMApiKey(KEY).split(':')[1],'每次加密应使用新的 IV');
 const parts=sealed.split(':');parts[3]=Buffer.from('tampered-secret-value').toString('base64url');
 assert.throws(()=>decryptLLMApiKey(parts.join(':')),/无法解密/);
 assert.throws(()=>decryptLLMApiKey('v2:a:b:c'),/无法解密/);
});

test('指纹稳定、可区分，且不泄露密钥本身',()=>{
 const fingerprint=llmKeyFingerprint(KEY);
 assert.equal(fingerprint,llmKeyFingerprint(KEY));
 assert.match(fingerprint,/^[0-9A-F]{12}$/);
 assert.notEqual(fingerprint,llmKeyFingerprint(KEY+'x'));
 assert.ok(!KEY.includes(fingerprint));
});

test('上游状态码被分级，且绝不把 401/403 透传成后台登录失效',()=>{
 const unauthorized=llmProviderFailure(401,'{"error":{"message":"Authentication Fails"}}','deepseek-flash');
 assert.equal(unauthorized.status,400);
 assert.match(unauthorized.message,/密钥无效/);
 assert.equal(llmProviderFailure(402,'',"deepseek-flash").status,400);
 assert.match(llmProviderFailure(402,'','deepseek-flash').message,/余额不足/);
 assert.equal(llmProviderFailure(403,'','deepseek-flash').status,400);
 assert.match(llmProviderFailure(404,'','deepseek-flash').message,/模型不存在/);
 assert.equal(llmProviderFailure(429,'','deepseek-flash').status,429);
 assert.equal(llmProviderFailure(503,'','deepseek-flash').status,502);
 assert.match(llmProviderFailure(400,'{"error":{"message":"Model Not Exist"}}','deepseek-flash').message,/Model Not Exist/);
});

test('超时与网络故障给出可执行的提示',()=>{
 assert.equal(llmNetworkFailure(Object.assign(new Error('timed out'),{name:'TimeoutError'})).status,504);
 assert.match(llmNetworkFailure(Object.assign(new Error('timed out'),{name:'TimeoutError'})).message,new RegExp(String(Math.round(LLM_TIMEOUT_MS/1000))));
 assert.equal(llmNetworkFailure(new Error('getaddrinfo ENOTFOUND api.deepseek.com')).status,502);
 assert.match(llmNetworkFailure(new Error('getaddrinfo ENOTFOUND')).message,/无法连接/);
});

test('一批文本一次请求，逐段对应且缺段即失败',async()=>{
 await withFetch(()=>reply(content({translations:{0:'你好',1:'世界'}})),async()=>{
  const result=await llmTranslateBatch(config,['Hello','World'],'en','zh');
  assert.deepEqual(result.texts,['你好','世界']);
  assert.equal(result.usage.total_tokens,15);
 });
 await withFetch(()=>reply(content({translations:{0:'你好'}})),async()=>{
  await assert.rejects(()=>llmTranslateBatch(config,['Hello','World'],'en','zh'),/遗漏了第 2 段/);
 });
 await withFetch(()=>reply(content({translations:{0:''}})),async()=>{
  await assert.rejects(()=>llmTranslateBatch(config,['Hello'],'en','zh'),/遗漏了第 1 段/);
 });
});

test('截断、非 JSON、缺字段、上游报错都要显式失败',async()=>{
 await withFetch(()=>reply(content({translations:{0:'你好'}},'length')),async()=>{
  await assert.rejects(()=>llmTranslateBatch(config,['Hello'],'en','zh'),/截断/);
 });
 await withFetch(()=>Promise.resolve(new Response('not json at all',{status:200})),async()=>{
  await assert.rejects(()=>llmTranslateBatch(config,['Hello'],'en','zh'),/无法解析/);
 });
 await withFetch(()=>reply({choices:[{message:{content:'{"result":"x"}'},finish_reason:'stop'}]}),async()=>{
  await assert.rejects(()=>llmTranslateBatch(config,['Hello'],'en','zh'),/结构不正确/);
 });
 await withFetch(()=>reply({},200),async()=>{
  await assert.rejects(()=>llmTranslateBatch(config,['Hello'],'en','zh'),/没有返回翻译结果/);
 });
 await withFetch(()=>reply({error:{message:'Authentication Fails'}},401),async()=>{
  const error=await llmTranslateBatch(config,['Hello'],'en','zh').catch(e=>e);
  assert.equal(error.status,400);
  assert.match(error.message,/密钥无效/);
 });
});
