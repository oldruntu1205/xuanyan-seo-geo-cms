/**
 * ensure-payload-schema.mjs —— Payload bootstrap（`payload_internal`）的自断言 + 自愈入口。
 *
 * 为什么要这个脚本（E-10，2026-10-01 取证）：
 *   CI 的独立 `pnpm auth:migrate` 会**偶发零输出空跑**：进程跑满一次正常启动的时长（实测 ~3.9s，
 *   不是历史记录的 0.3s），却什么都没打印、也没建出 `payload_internal`，然后 **exit 0**；
 *   紧随其后的 `db:migrate` 就在 025 上报 `schema "payload_internal" does not exist`。
 *   已验证的机制类别：`payload/bin.js` 用 `void start()`（非顶层 await）拉起 CLI，而 tsx 的加载链上
 *   有被 `unref()` 的句柄（esbuild 的 service 子进程：esbuild/lib/main.js:2158-2163），
 *   当某个线程只剩"待决 promise + 无人 ref 的句柄"时，Node 会**放弃未完成的加载直接结束**——
 *   非顶层 await 时退出码正是 **0**（顶层 await 则报 unsettled top-level await / exit 13）。
 *   详见 docs/待验收与遗留清单.md 的 E-10 与 .runtime/probe-e10-*.mjs。
 *
 * 本脚本做的事：
 *   1. 前置检查：schema 已就绪 → 直接返回（幂等，不白跑迁移）；
 *   2. 跑 `pnpm auth:migrate`（stdin 绝不给子进程；检测交互式提问；有超时兜底）；
 *   3. 断言 schema；缺失且子进程 exit 0（= E-10 静默空跑的形状）→ **原样重试**（默认最多 5 次，见下方 attempts 注释）；
 *   4. 仍缺失 → 交给 assert-payload-schema.mjs 打印标准诊断并以非 0 退出（把静默空跑变成响亮失败）。
 *
 * ⚠️ 本脚本只负责 Payload 自己的 schema；业务迁移（database/001–026）仍由 `pnpm db:migrate` 负责。
 *
 * 用法：
 *   node infrastructure/scripts/ensure-payload-schema.mjs                 # 用 $env:DATABASE_URL
 *   node infrastructure/scripts/ensure-payload-schema.mjs --local-runtime # 用 .runtime/connection.json
 *   node infrastructure/scripts/ensure-payload-schema.mjs --attempts 1    # 关掉重试（排查时用；默认 5 次）
 *   node infrastructure/scripts/ensure-payload-schema.mjs --force         # 跳过前置检查，强制跑一次（排查/测试用）
 *   node infrastructure/scripts/ensure-payload-schema.mjs --command "cmd /c exit 0"  # 注入假命令（测试用）
 * 退出码：0 = 已就绪；1 = 迁移失败/仍缺 schema；2 = 缺少 DATABASE_URL
 */
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const argv = process.argv.slice(2);
if (argv.includes('--local-runtime')) {
  Object.assign(process.env, JSON.parse(fs.readFileSync(path.join(root, '.runtime/connection.json'), 'utf8')));
}
const opt = (name, fallback) => {
  const i = argv.indexOf(name);
  return i === -1 ? fallback : argv[i + 1];
};
// 默认重试 5 次：2026-10-01 现场实测（CI run 36832057991）第 1 次静默空跑、第 2 次成功，
// 即单次发生率并非"偶发到可忽略"（观测到的样本里约 1/3）。每次静默空跑只花 ~2.5s，
// 所以多试几次的代价极小；5 次全部撞上的概率约 0.4%（按各次独立估算）。
const attempts = Math.max(1, Number(opt('--attempts', '5')) || 5);
const timeoutMs = Math.max(1, Number(opt('--timeout-seconds', '180')) || 180) * 1000;
const command = opt('--command', 'pnpm auth:migrate');

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error('✗ DATABASE_URL required（或加 --local-runtime 读 .runtime/connection.json）');
  process.exit(2);
}

// 与 verify.mjs 同一套交互式提问指纹：Payload 在「库里有 dev 模式 batch=-1 标记」时会弹
// “data loss will occur … Would you like to proceed? » (y/N)”。非交互终端下它会**一直等输入**
// （实测：stdin=ignore 也照样挂住 90s+），所以必须靠扫输出主动拦截，而不是等它自己返回。
const INTERACTIVE_PROMPT = /data loss|would you like to proceed|do you want to continue|are you sure|\(y\/n\)|\[y\/n\]/i;

async function schemaState() {
  const client = new pg.Client({ connectionString });
  try {
    await client.connect();
    const r = await client.query(`SELECT to_regnamespace('payload_internal') IS NOT NULL AS schema_ok,
        to_regtype('payload_internal.enum_cms_admin_users_role') IS NOT NULL AS enum_ok`);
    return { schemaOk: r.rows[0].schema_ok === true, enumOk: r.rows[0].enum_ok === true };
  } finally {
    await client.end().catch(() => {});
  }
}

function runMigrate() {
  return new Promise((resolve) => {
    // stdin 必须是 'ignore'：绝不把本进程的 stdin 交给 Payload，否则一旦弹确认框就永久等待。
    const child = spawn(command, { cwd: root, env: process.env, shell: true, stdio: ['ignore', 'pipe', 'pipe'] });
    const t0 = Date.now();
    let tail = '';
    let killed = null;

    const kill = (reason) => {
      if (killed) return;
      killed = reason;
      if (child.pid) {
        if (process.platform === 'win32') spawn('taskkill', ['/PID', String(child.pid), '/T', '/F'], { stdio: 'ignore' }).unref();
        else child.kill('SIGTERM');
      }
    };
    const timer = setTimeout(() => kill(`超时（${timeoutMs / 1000}s 内未结束）`), timeoutMs);

    const inspect = (chunk, sink) => {
      sink.write(chunk);
      tail = (tail + chunk.toString('utf8')).slice(-8192);
      if (INTERACTIVE_PROMPT.test(tail)) kill('Payload 要求交互式确认（疑似库里有 dev 模式 batch=-1 标记）');
    };
    child.stdout.on('data', (c) => inspect(c, process.stdout));
    child.stderr.on('data', (c) => inspect(c, process.stderr));

    child.on('close', (code) => {
      clearTimeout(timer);
      resolve({
        code: killed ? null : code,
        out: tail.replace(/\u001b\[[0-9;]*m/g, ''),
        ms: Date.now() - t0,
        killed,
      });
    });
  });
}

if (!argv.includes('--force')) {
  const initial = await schemaState();
  if (initial.schemaOk && initial.enumOk) {
    console.log('✓ payload_internal 已就绪，无需再跑 auth:migrate。');
    process.exit(0);
  }
}

let silentNoopSeen = false;
for (let attempt = 1; attempt <= attempts; attempt++) {
  console.log(`\n▶ auth:migrate 第 ${attempt}/${attempts} 次（command: ${command}）`);
  const result = await runMigrate();
  const state = await schemaState();
  console.log(
    `◀ 第 ${attempt} 次结束：exit=${result.code === null ? 'killed' : result.code} 用时=${(result.ms / 1000).toFixed(2)}s` +
      ` stdout/stderr尾长=${result.out.length}B → payload_internal schema=${state.schemaOk} enum=${state.enumOk}`,
  );

  if (result.killed) {
    console.error(`✗ ${result.killed}`);
    if (result.killed.includes('交互式确认')) {
      console.error('  处置：该库带 dev 模式的 batch=-1 迁移标记，`payload migrate` 会要求确认「data loss will occur」。');
      console.error('  请在有终端的窗口人工执行 `pnpm auth:migrate`（脚本不代你确认破坏性操作）。');
    }
    process.exit(1);
  }
  if (state.schemaOk && state.enumOk) {
    if (attempt > 1) {
      console.log(`\n⚠️ E-10 自愈：第 1 次 auth:migrate 静默空跑（exit 0 但没建 schema），第 ${attempt} 次成功。`);
      if (process.env.GITHUB_ACTIONS === 'true') {
        console.log('::warning title=E-10 静默空跑::auth:migrate 第 1 次 exit 0 但未建出 payload_internal，重试后成功（这是已知偶发，非代码缺陷）');
      }
    } else {
      console.log('\n✓ Payload bootstrap 完成：payload_internal schema 与 enum_cms_admin_users_role 均已就绪。');
    }
    process.exit(0);
  }
  if (result.code === 0) {
    silentNoopSeen = true;
    console.error(`✗ 第 ${attempt} 次：auth:migrate **exit 0 却没建出 payload_internal** —— 正是 E-10 的静默空跑形状。`);
  } else {
    console.error(`✗ 第 ${attempt} 次：auth:migrate 以 exit ${result.code} 失败（非静默空跑，按上方输出排查）。`);
    if (attempt < attempts) console.error(`  仍会继续重试（${attempt + 1}/${attempts}）。`);
  }
}

console.error('');
console.error(silentNoopSeen ? `✗ ${attempts} 次尝试全部落空（每次都 exit 0 却没建 schema，E-10 静默空跑持续复现）。` : `✗ ${attempts} 次尝试后仍未 bootstrap 成功。`);
console.error('  交给标准断言脚本给出处置指引：');
const assertScript = path.join(root, 'infrastructure/scripts/assert-payload-schema.mjs');
const child = spawn(process.execPath, [assertScript], { cwd: root, env: process.env, stdio: 'inherit' });
child.on('close', (code) => process.exit(code === 0 ? 1 : code));
