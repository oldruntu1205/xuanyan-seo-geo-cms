// 出站 HTTPS 的固定解析回调契约（2026-10-02 事故回归）——纯函数、免库、无网络。
//
// 事故：growth.ts / crm-sync.ts / marketing.ts 三处**各自手写**了 `lookup:(_h,_o,cb)=>cb(null,pin.address,pin.family)`。
// Node ≥20 默认开启 autoSelectFamily（Happy Eyeballs），此时 net.connect 会以 **all 模式**调用该回调
// （options.all === true），期望 `[{address,family}]`；回字符串时 Node 去读 entry.address 得 undefined，
// 抛 `TypeError: Invalid IP address: undefined (ERR_INVALID_IP_ADDRESS)`。
// 后果（实测）：竞品采集 503、CRM 双向与营销投递同样在任何 Node≥20 环境上必然失败。
import {test} from 'node:test';import assert from 'node:assert/strict';
import {isIP,getDefaultAutoSelectFamily} from 'node:net';
import {createServer,request as httpRequest} from 'node:http';
import {readFileSync} from 'node:fs';
import type {AddressInfo} from 'node:net';
import {pinnedLookup} from '../packages/domain/src/growth';

const PIN = {address: '104.26.13.2', family: 4};

/** 把回调调用结果收集起来，便于断言形状。 */
function call(options: unknown) {
  let seen: {error: unknown; address: unknown; family: unknown} | null = null;
  const callback = ((error: unknown, address: unknown, family: unknown) => {seen = {error, address, family};}) as never;
  pinnedLookup(PIN)('example.test', options, callback);
  return seen as unknown as {error: unknown; address: unknown; family: unknown};
}

test('all 模式（autoSelectFamily 开启时 Node 的调用形状）必须回数组，且元素带 address/family', () => {
  const seen = call({all: true, family: 0, hints: 32, verbatim: true});
  assert.equal(seen.error, null);
  assert.ok(Array.isArray(seen.address), 'all 模式必须回数组，否则 Node 抛 ERR_INVALID_IP_ADDRESS');
  const entries = seen.address as {address: string; family: number}[];
  assert.equal(entries.length, 1);
  assert.equal(entries[0].address, PIN.address);
  assert.equal(entries[0].family, PIN.family);
  assert.notEqual(isIP(entries[0].address), 0, '数组元素的 address 必须是合法 IP 字符串');
});

test('默认模式必须回 (address, family) 两参形式', () => {
  const seen = call({family: 0, hints: 32, verbatim: true});
  assert.equal(seen.error, null);
  assert.equal(seen.address, PIN.address);
  assert.equal(seen.family, PIN.family);
});

test('显式 all:false 与缺省 options 都走单值形式', () => {
  assert.equal(call({all: false}).address, PIN.address);
  assert.equal(call(undefined).address, PIN.address);
});

test('绝不返回 undefined 地址（本次事故的直接判据）', () => {
  for (const options of [{all: true}, {all: false}, {}, undefined, {family: 6}]) {
    const seen = call(options);
    assert.ok(seen.address !== undefined && seen.address !== null, 'options=' + JSON.stringify(options) + ' 不能回空地址');
    if (!Array.isArray(seen.address)) assert.notEqual(isIP(String(seen.address)), 0);
  }
});

test('单一实现：domain 源码里不得再出现手写的 lookup 回调', () => {
  const files = ['growth.ts', 'crm-sync.ts', 'marketing.ts'];
  for (const file of files) {
    const source = readFileSync(new URL('../packages/domain/src/' + file, import.meta.url), 'utf8');
    for (const line of source.split('\n')) {
      if (!line.includes('lookup:')) continue;
      assert.ok(/lookup:pinnedLookup\(/.test(line), file + ' 里的 lookup 必须用共享的 pinnedLookup()，不要手写回调：' + line.trim().slice(0, 120));
    }
  }
});

// ── socket 级：真正走一遍 net.connect 的 lookup 调用路径（loopback，不碰外网、不碰库）──────────────
// 为什么必须有这一层：单元测试只证明回调「回得对」，而本次事故是**调用方怎么要**的问题。
// 这里用一个不存在的域名 + 固定解析到 127.0.0.1，把整条 socket 路径跑通，正/反例对照。
//
// ⚠️ 环境门：本机 DSH 桥接层设了 `NODE_USE_ENV_PROXY=1` + `http_proxy`，Node ≥22.21 会让**内建 http**
// 也走代理，于是「假域名」请求被代理回 502（实测：新/旧回调都是 502，直连 127.0.0.1 才 200）。
// 那种环境下这两条用例**不可判定**（测的是代理而不是我们的回调），所以显式 skip 并说明原因，
// 而不是把断言放宽或删掉 —— CI（无代理）会照常跑它们。
const PROXY_IN_ENV = Boolean(process.env.NODE_USE_ENV_PROXY || process.env.http_proxy || process.env.HTTP_PROXY || process.env.https_proxy || process.env.HTTPS_PROXY);
const SOCKET_SKIP = PROXY_IN_ENV ? {skip: '本环境设置了 NODE_USE_ENV_PROXY/http_proxy：内建 http 走代理后假域名请求被回 502，该用例不可判定（在无代理的 CI 上会运行）'} : {};
function withLoopbackServer<T>(fn:(port:number)=>Promise<T>):Promise<T> {
  const server = createServer((_request, response) => {response.writeHead(200, {'content-type': 'text/plain'});response.end('pinned-ok');});
  return new Promise<T>((resolve, reject) => {
    server.listen(0, '127.0.0.1', async () => {
      const port = (server.address() as AddressInfo).port;
      try {resolve(await fn(port));} catch (error) {reject(error);} finally {server.close();}
    });
  });
}
function requestThrough(port:number, lookup:unknown):Promise<{body:string;error:(Error & {code?:string})|null}> {
  return new Promise((resolve) => {
    const request = httpRequest({hostname: 'pinned-lookup.test', port, path: '/', method: 'GET', lookup: lookup as never}, (response) => {
      let body = '';response.on('data', (chunk) => {body += chunk;});response.on('end', () => resolve({body, error: null}));
    });
    request.on('error', (error) => resolve({body: '', error}));
    request.end();
  });
}

test('socket 级正例：pinnedLookup 能把假域名钉到 loopback 并成功取回响应', SOCKET_SKIP, async () => {
  const result = await withLoopbackServer((port) => requestThrough(port, pinnedLookup({address: '127.0.0.1', family: 4})));
  assert.equal(result.error, null, '不应有错误：' + (result.error ? result.error.message : ''));
  assert.equal(result.body, 'pinned-ok');
});

test('socket 级反例：手写的单值回调在同一路径上会被 Node 拒绝（本次事故的形状）', SOCKET_SKIP, async () => {
  const legacy = (_hostname: string, _options: unknown, callback: (error: Error | null, address: string, family: number) => void) => callback(null, '127.0.0.1', 4);
  const result = await withLoopbackServer((port) => requestThrough(port, legacy));
  if (getDefaultAutoSelectFamily()) {
    assert.ok(result.error, 'autoSelectFamily 开启时必须失败，否则说明这条回归已经失去意义');
    assert.equal(result.error?.code, 'ERR_INVALID_IP_ADDRESS');
  } else {
    // 关掉 autoSelectFamily 的环境里，单值回调是合法的 —— 记录事实而不是假装它一定失败
    assert.equal(result.body, 'pinned-ok', 'autoSelectFamily 关闭时单值回调应可用（本环境 ' + process.version + '）');
  }
});
