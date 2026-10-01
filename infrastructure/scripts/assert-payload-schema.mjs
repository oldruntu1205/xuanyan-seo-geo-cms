/**
 * E-10 守卫：断言 Payload 的 `payload_internal` 已经 bootstrap 完成。
 *
 * 为什么需要它：CI 的 `pnpm auth:migrate` 步骤会**偶发零输出空跑** —— `payload migrate`
 * 跑满一次正常启动的时长（2026-10-01 实测 ~3.9s；历史记录的 0.3s 已证伪），却连
 * `No email adapter provided` 的 WARN 都没有（说明根本没跑起来/没加载 Payload config），
 * 于是 `payload_internal` 没被建出来；紧随其后的 `pnpm db:migrate` 会在 **025** 上报
 * `error: schema "payload_internal" does not exist`。
 *
 * ⚠️ 那个错误形状与 **E-8**（ci.yml 步骤顺序写错）**一模一样**，但根因不同。E-8 已修；
 *    本守卫的作用是把这个"静默空跑"变成**响亮失败**，并在报错里直接说清该查哪里、别改哪里。
 *    CI 里的常规路径已经换成 infrastructure/scripts/ensure-payload-schema.mjs（自断言 + 自动重试一次），
 *    本脚本是它重试仍失败时的"标准诊断出口"，也可单独手动运行。
 *
 * 用法：
 *   node infrastructure/scripts/assert-payload-schema.mjs            # 用 $env:DATABASE_URL
 *   node infrastructure/scripts/assert-payload-schema.mjs --local-runtime   # 用 .runtime/connection.json
 * 退出码：0 = 已 bootstrap；1 = 缺 schema/枚举（E-10 形状）；2 = 缺少 DATABASE_URL
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
if (process.argv.includes('--local-runtime')) {
  Object.assign(process.env, JSON.parse(fs.readFileSync(path.join(root, '.runtime/connection.json'), 'utf8')));
}
const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error('✗ DATABASE_URL required（或加 --local-runtime 读 .runtime/connection.json）');
  process.exit(2);
}

const client = new pg.Client({ connectionString });
let schemaOk = false;
let enumOk = false;
let failure = '';
try {
  await client.connect();
  const r = await client.query(`SELECT to_regnamespace('payload_internal') IS NOT NULL AS schema_ok,
      to_regtype('payload_internal.enum_cms_admin_users_role') IS NOT NULL AS enum_ok`);
  schemaOk = r.rows[0].schema_ok === true;
  enumOk = r.rows[0].enum_ok === true;
} catch (error) {
  failure = error instanceof Error ? error.message : String(error);
} finally {
  await client.end().catch(() => {});
}

if (failure) {
  console.error('✗ 无法检查 Payload bootstrap：' + failure);
  process.exit(1);
}

if (!schemaOk || !enumOk) {
  console.error(`✗ Payload bootstrap 缺失：payload_internal schema=${schemaOk}，enum_cms_admin_users_role=${enumOk}`);
  console.error('');
  console.error('  这通常意味着 `pnpm auth:migrate` **静默空跑**（E-10）：payload migrate 跑满一次正常启动的');
  console.error('  时长（2026-10-01 实测 ~3.9s；历史文档写的 0.3s 已被证伪）却零输出、exit 0、且没建出 schema。');
  console.error('  处置顺序：');
  console.error('    1) 看 auth:migrate 那一步**有没有 `Reading migration files` / `Migrating:` 输出**；');
  console.error('       没有 → 就是本条，**直接重跑该 job / 该步骤即可**（实测同 commit 重跑即绿）。');
  console.error('       有 → 才去查连接串/迁移文件/步骤顺序。');
  console.error('    2) `pnpm auth:migrate` 现已被 infrastructure/scripts/ensure-payload-schema.mjs 包住');
  console.error('       （自断言 + 命中静默空跑自动重试一次），正常情况下这条报错只会在**重试也失败**时出现。');
  console.error('    2) ⚠️ **不要**因为这句报错去改 ci.yml 的步骤顺序 —— 那是已修复的 E-8，');
  console.error('       与本条错误形状相同但根因不同（详见 docs/待验收与遗留清单.md 的 E-8 / E-10）。');
  process.exit(1);
}

console.log('✓ Payload bootstrap confirmed: payload_internal schema 与 enum_cms_admin_users_role 均已就绪。');
