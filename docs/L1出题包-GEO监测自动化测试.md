# L1 出题包 · GEO 监测中心自动化测试（B-2 遗留）

> 出处：`docs/待验收与遗留清单.md` B-2 行 —— 「服务器侧验收脚本全 PASS，但 **GEO 模块本身仍无任何自动化测试**（grep `geo` = 0）→ 建议由 L1 出题补」。
> 本项目规矩：**`tests/` 由 L1 产出、L2 只读**（见 `AGENTS.md` §4）。所以这份文件只出「可执行断言与边界」，**不含业务实现**。
> 出题人（L2）已把被测面逐行读完后整理，行号即证据；请直接基于本文件产出测试代码。

---

## 0. 被测面（已核对，共 3 个文件 + 8 个接口动作）

| 落点 | 文件 | 说明 |
| --- | --- | --- |
| 领域逻辑 | [`packages/domain/src/geo-monitoring.ts`](../packages/domain/src/geo-monitoring.ts)（115 行） | 全部不变量都在这里：模型/地区/目标/预算配置、队列、认领、采样处理、恢复、趋势 |
| 区域 Worker | [`apps/worker/src/geo-region.ts`](../apps/worker/src/geo-region.ts)（16 行） | 心跳 + claim + process 的循环；`GEO_WORKER_REGION_CODE` 必填 |
| 数据约束 | [`database/017_geo_monitoring.sql`](../database/017_geo_monitoring.sql)（107 行） | 9 张表、CHECK/UNIQUE，是「应用层漏了就由 DB 兜底」的第二道门 |
| HTTP 动作 | [`apps/cms/src/server/v2-api.ts:49-55,80`](../apps/cms/src/server/v2-api.ts) | `geo-monitor` / `-model` / `-region` / `-target` / `-budget` / `-sample` / `-trend` / `geo-sample` |
| 复用密钥 | [`packages/domain/src/llm.ts:74`](../packages/domain/src/llm.ts) | `activeLLMConfig()` 读 `runtime_settings['translation.llm']`，**全站 LLM 单一配置源** |

**为什么值得补**：这是全项目唯一「**花真钱 + 并发认领 + 金额账本**」的模块（预算预留/释放、跨区 Worker 竞争同一批 job）。这三类恰恰是人工点按最难覆盖、也最容易在改动后静默回归的地方。

---

## 1. 硬约束（先看这节，避免出题跑偏）

1. **`pnpm test` 必须继续免数据库**。当前 `pnpm test` = `tsx --test tests/*.test.ts`，17/17 纯单元用例、不依赖 DB。GEO 逻辑**强依赖 `query`/`transaction`**（`./db`），所以**不要**把 GEO 用例放进 `tests/*.test.ts` 的通配里，否则本地无库时 `pnpm test` 直接红。
2. **推荐落点（二选一，由 L1 定）**：
   - (a) 扩写 [`tests/integration.ts`](../tests/integration.ts)（已有真库集成测试，由 `node infrastructure/scripts/verify.mjs --local-runtime` 驱动）；
   - (b) 新建 `tests/geo-monitoring.integration.ts`，并让 `verify.mjs` 调用它。
   **两者都必须由 `verify.mjs` 那条链跑到**，否则等于没测。
3. **绝不允许真打外部 LLM**。`processGeoSampleJob` 会 `callLLMChat` 到真实 endpoint。请用替身。⚠️ 现成的 [`.runtime/fake-llm-server.mjs`](../.runtime/fake-llm-server.mjs) 是**翻译专用**（回 `{"translations":{…}}`），**不能直接复用**；GEO 需要 `{"answer":"…","citations":[…]}`（见 §2.5 C.3）。fake 的端点可以是 `http://127.0.0.1:<port>/…` —— `normalizeLLMEndpoint` 明确放行 loopback（[`llm.ts:32`](../packages/domain/src/llm.ts#L32)），所以走 `credential_source='profile'` 即可，无需真实密钥。**不要**在测试里放真实 API Key。
4. **不许改 `database/001–026`**（已应用迁移带 sha256 登记，改动会中止发布）。GEO 要用到的表在 017/014 里**已经存在**，不需要新迁移。
5. 夹具自清：GEO 用例会写 `geo_*` 与 `geo_samples`/`geo_daily_rollups`。请**每个用例自己建、自己删**（`geo_monitor_targets` 删除会 CASCADE 掉 jobs/rollups；`geo_samples.monitor_job_id` 是 `ON DELETE SET NULL`，需单独清）。测试结束后 `SELECT count(*)` 断言归零。
6. `GEO_MONITOR_SECRET` 是**环境变量**（prod 为 96 字符）。测「缺密钥」分支时用**子进程/临时改 env** 的方式，别把进程级 env 弄脏影响其他用例。

---

## 2. 断言清单（按优先级分组；每条都给「不变量 → 期望 → 依据行号」）

### P0 · 钱与并发（最该被自动化保护）

| # | 不变量 | 期望 | 依据 |
| --- | --- | --- | --- |
| G1 | **预估成本公式**：`(4000×input_rate + max_output_tokens×output_rate) / 1e6`，且 `money()` 保留 8 位 | 给定 profile 单价与 `max_output_tokens`，`claimGeoSampleJob` 写进 job 的 `reserved_usd` **精确等于**手算值（断言到 1e-8） | `geo-monitoring.ts:84` |
| G2 | **预算未启用 → 不采样**：`budget.is_enabled=false` 时 `reserve()` 返回 `ok:false` 且 reason=`GEO 成本预算尚未启用` | job 状态变 `blocked_budget`、`error_message` = 该 reason、`finished_at` 非空；**不产生 sample** | `:78, :85` |
| G3 | **超额拦截（日/月任一）**：`spent+reserved+cost > daily_limit` **或** `> monthly_limit` → reason=`GEO 日度或月度预算不足` | 同上，`blocked_budget`；且**日与月两条边界都要各测一次** | `:79` |
| G4 | **账本守恒**：`reserve` 只加 `reserved_usd`；`release` 减 `reserved_usd`、加 `spent_usd`，成功才 `sample_count+1` | 一次成功采样后：`reserved` 回到基线、`spent` 增加**实际**成本、`sample_count+1` | `:80, :81, :106` |
| G5 | **释放不会把 reserved 扣成负数**（`greatest(0, …)`） | 构造 `reserved=0` 再 release → 停在 0，不出 CHECK 违约 | `:81` |
| G6 | **失败路径必须释放预留并留下可诊断痕迹** | ⚠️ **必须按抛点分两种各测一次**（本轮实测两者行为**不同**，见 §2.5）：<br>**(a) 抛点在成功事务之前**（如模型返回非 JSON）→ ① job=`failed` ② `reserved` 回基线 ③ `spent` **不**增 ④ `sample_count` **不**增 ⑤ target.`last_error` 有值 —— **实测通过**。<br>**(b) 抛点在成功事务之内** → **修复后已实测通过**（job=`failed`、`reserved` 归零、`last_error` 有值）；**修复前**是 job 卡 `processing` + 预留泄漏 —— 请把 (b) 作为**回归断言**保留，见 **G53** | `:108` |
| G7 | **两个并发 Worker 不得拿到同一个 job**（`FOR UPDATE OF j SKIP LOCKED`） | 同一 region 两个 `claimGeoSampleJob` 并发 → 恰好一个返回 job、另一个返回 `null`；job 只有一行 `processing` | `:83` |
| G8 | **跨区隔离**：只认 `r.code = $1` 且 `r.is_enabled` | A 区的 job，B 区 worker claim 返回 `null`；地区被停用后同区也拿不到 | `:83` |
| G9 | **采样计价用 job 上的费率快照，不读 profile 现价** | claim 后修改 profile 单价 → 再 process，成本仍按**旧费率**算 | `:84, :98` |

### P1 · 队列 / 调度 / 幂等

| # | 不变量 | 期望 | 依据 |
| --- | --- | --- | --- |
| G10 | 手工提交节流：同 target 已有 `pending/processing`，或最近 5 分钟内已有 `completed/failed` | 409 `此目标已有任务，或最近五分钟已经提交` | `:64` |
| G11 | 目标未启用/不存在时手工提交 | 404 `监测目标未启用` | `:63` |
| G12 | 队列满：`pending+processing >= max_queued_jobs` | 429 `监测队列已满，请稍后再试` | `:65` |
| G13 | `scheduleDueGeoTargets` 对 in-flight 目标**不重复建 job**，只推后 `next_run_at += interval` | job 数不增；`next_run_at` 前进 | `:69` |
| G14 | 队列满时调度器推后 **15 分钟**并写 `last_error='监测队列已满，稍后重试'` | 精确断言 15 分钟与文案 | `:71` |
| G15 | 调度器只取**四张表都 enabled** 的到期目标，且 `SKIP LOCKED`、单次循环上限 100 | 停用 prompt/model/region 任一 → 不再被调度 | `:68, :72` |
| G16 | `next_run_at` 前进用 `greatest(原值+interval, now()+interval)`（不会因长期停机而连发补跑） | 构造过期很久的 `next_run_at` → 新值 = `now()+interval` | `:72` |
| G17 | **重复处理同一 job 必须 409**：进入事务时若 `status!=='processing'` | 409 `采样任务状态已变化`；且**不产生第二条 sample** | `:101` |

### P2 · 采样结果正确性（替身 LLM 驱动）

| # | 不变量 | 期望 | 依据 |
| --- | --- | --- | --- |
| G18 | `finishReason==='length'` | 失败 `回答被截断` | `:93` |
| G19 | 返回非 JSON | 失败 `模型未返回有效 JSON` | `:93` |
| G20 | `answer` 非字符串 / 空 / >20000 字符 | 失败 `模型未返回有效答案` | `:94` |
| G21 | citations 过滤：只留 `^https://`，最多 20 条 | 传入 `http://`、非字符串、21 条 → 落库只剩合法且 ≤20 | `:95` |
| G22 | usage 有/无两条路：有则 `usage_source='provider'` 且用上报 token；无则**估算** `ceil(len/2)` 且 `usage_source='estimated'` | 两条分支各断言一次 token 数与来源标记 | `:96-97, :103` |
| G23 | `brand_mentioned` 用 `toLocaleLowerCase()` 包含判定（大小写不敏感） | `BRAND` / `brand` 都能命中 | `:99` |
| G24 | **`config_hash` 八要素**：`prompt, market, brand, locale, model, endpoint, profile_id, region_id` 以 `\n` 拼接后 sha256 | 逐项改动任一（**尤其 endpoint 与 region_id**）→ hash 变化 | `:100` |
| G25 | **趋势只统计同 hash 样本**：`configurationChanged` = 历史行数 ≠ 可比行数 | 改 endpoint 后再采样 → 该 target `configurationChanged=true`，且 `samples/mentionRate/costUsd` 只算新 hash | `:113-115` |
| G26 | **成功率当 total=0 时为 `null` 而不是 `NaN`**（`mentionRate` / `avgLinksPerSample`） | 新 target 无样本 → 两者 `null`，不是 `0/0=NaN` | `:115` |
| G27 | 一次成功采样必须在**同一事务**里完成五件事：写 `geo_samples`、upsert `geo_daily_rollups`、release、job→`completed`、target `last_run_at` 且 `last_error` 清空 | 全部成立；`geo_daily_rollups` 的 `(day,target_id,config_hash)` 二次采样是**累加**不是插新行 | `:101-106` |
| **G27b** | **★ 原子性反证（不只是成功路径）**：事务中途失败时**五项写入必须全部回滚**，不得部分提交 | 用 §2.5 的哨兵注入法让事务内 INSERT 撞唯一约束 → ① `geo_samples` **不增** ② `geo_daily_rollups` **不建行** ③ 账本 `spent`/`sample_count` **不变** ④ **预置的哨兵行仍在**（证明是 ROLLBACK，而不是"先写后删"）。<br>⚠️ 注意：`reserved`/job 状态/target.last_error 属于**补偿事务**的职责，不在本事务内 —— 那部分由 **G53** 单独断言 | `:101-107` |
| G28 | rollup 的 `duration_ms` 也累加、`avgDurationMs = round(duration/samples)` | 两次采样后平均时长等于手算 | `:105, :115` |

### P3 · 安全与配置校验

| # | 不变量 | 期望 | 依据 |
| --- | --- | --- | --- |
| G29 | **错误信息脱敏**：`safeError` 把 URL 换成 `[URL]` 并截断 500 字符 | 构造含 `https://api.example.com/v1` 的上游报错 → 落库 `error_message` 里**不含**该 URL，含 `[URL]` | `:11` |
| G30 | **密钥加密落库**：`seal()` 输出 `v1:iv:tag:body`，DB 里**不得出现明文密钥** | 保存专用模型后 `key_cipher` 不包含明文；`has_credential=true` | `:17, :40, :44` |
| G31 | **密文被篡改必须失败**（AES-GCM auth tag） | 改动 `key_cipher` 任一段 → 取用时 503 `监测模型密钥无法解密，请管理员重新保存` | `:18` |
| G32 | **`GEO_MONITOR_SECRET` 缺失或 <32 字符时保存专用密钥 → 503** `服务器缺少 GEO_MONITOR_SECRET（至少 32 字符），无法保存专用模型密钥` | 精确文案 | `:16` |
| G33 | `credential_source='site_default'` 时 **endpoint 必须与 `activeLLMConfig().url` 完全一致** | 不一致 → 400 `复用站点密钥时，端点必须与当前 AI 设置完全一致` | `:38` |
| G34 | `credential_source='profile'` 新建但无密钥 | 400 `专用模型需要 API 密钥`；更新时不传 `apiKey` 应**沿用**旧 `key_cipher`（不被清空） | `:40-41` |
| G35 | **越权**：非 `admin/super_admin` 调用 `saveGeoModel`/`saveGeoRegion`/`saveGeoBudget` | 403 `只有管理员可配置监测模型、地区和预算`（三个入口都要测） | `:10` |
| G36 | **越权**：无 `seo_metadata` 读权限调用 workspace/trend → 403 `没有 GEO 监测权限`；写入口（saveGeoTarget / queueGeoMonitorSample）另需写权限 | 用 `client`、`translator` 等角色各测一次 | `:9` |

### P4 · 配置一致性与枚举

| # | 不变量 | 期望 | 依据 |
| --- | --- | --- | --- |
| G37 | 地区 `code` **创建后不可更改** | 400 `地区代码用于 Worker 路由，创建后不可更改` | `:50` |
| G38 | **`code` 归一化后**再判 `^[a-z0-9][a-z0-9_-]{1,39}$`（`trim().toLowerCase()` 在前）—— ⚠️ **出题包 v1 此处写错，已按实测订正** | 见下方「G38/G39 实测对照」：**大小写与前后空格都必须通过**（`" CN "`、`"A-B_9"` 均 201）；只有**长度越界**与**非法字符**才拒 | `:12` |
| G39 | **`country_code` 归一化后**再判 `^[A-Z]{2}$`（`trim().toUpperCase()` 在前）—— ⚠️ **同 G38，v1 写错** | `"cn"` → **通过**并落库 `CN`；`"CHN"`、`"c n"` 被 **zod 长度**拒；`"C"` 才由**领域层**拒（`国家代码应为两个大写字母`） | `:48` |

**G38 / G39 实测对照（2026-10-01，本地栈真实 HTTP，`.runtime/probe-geo-code-normalization.mjs`）**

| 输入 | HTTP | 拒绝来源与文案 | 落库值 |
| --- | --- | --- | --- |
| `code=" CN "` | **201** | — | `cn` |
| `code="A-B_9"` | **201** | — | `a-b_9` |
| `code=" CN-T "` | **201** | — | `cn-t` |
| `code="c"` | 400 | **zod**：`code: String must contain at least 2 character(s)` | — |
| `code="a b"`（内嵌空格） | 400 | **领域层**：`代码需为 2–40 位小写字母、数字、下划线或短横线` | — |
| `code=41 字符` | 400 | **zod**：`code: String must contain at most 40 character(s)` | — |
| `countryCode="cn"` | **201** | — | `CN` |
| `countryCode="CHN"` | 400 | **zod**：`countryCode: String must contain at most 2 character(s)` | — |
| `countryCode="C"` | 400 | **领域层**：`国家代码应为两个大写字母` | — |
| `countryCode="c n"` | 400 | **zod**：超 2 字符 | — |

> ⚠️ **两道门别混为一谈**：HTTP 层 `v2-api.ts:51` 的 zod（`code` 2–40 字符、`countryCode` ≤2 字符）**排在前面**，领域层 `geo-monitoring.ts:12/48` 的归一化+regex 是**第二道门**。断言「错误文案」时必须区分是哪一层抛的，否则会写出一条永远无法满足的期望。
> ⚠️ 另一个实测细节：`description` / `countryCode` 是 `z.string().optional()`，**只 optional 不 nullable** → 传 `null` 会被 zod 拒（`Expected string, received null`）。夹具里请**整个键省略**。
| G40 | **启用 target 前，prompt/model/region 必须都已启用** | 400 `启用目标前，请启用问题、模型和地区` | `:54` |
| G41 | **已有 target 不能换 prompt/model/region** | 400 `问题、模型和地区不可在现有目标上更换；请新建组合`（DB 另有 `UNIQUE(prompt_id,model_profile_id,region_id)`） | `:56` |
| G42 | 重新启用或改 `interval_minutes` → `next_run_at = now()`（立即调度）；同时清 `last_error` | 精确断言 | `:57` |
| G43 | 预算：`monthly < daily` → 400 `月度上限不得小于每日上限` | 边界取等号应通过 | `:60` |
| G44 | 单价/模型参数边界：`inputRate/outputRate ∈ [0,100000]`、`max_output_tokens ∈ [300,3000]`、`display_name` 2–100、`provider` 2–80 | 越界各自报错；DB CHECK 亦有第二道门 | `:36, :4-9` |
| G45 | `interval_minutes ∈ [60,10080]` | 越界报错 | `:38(sql)` |
| G46 | `geoMonitorTrend` 只接受 `days ∈ {7,30,90}` | 其他值 400 `只支持 7、30 或 90 天`；prompt 不存在 → 404 `监测问题不存在` | `:111` |

### P5 · Worker 身份与心跳

| # | 不变量 | 期望 | 依据 |
| --- | --- | --- | --- |
| G47 | `geoWorkerIdentity`：`GEO_WORKER_REGION_CODE` 缺省为 `local`；workerId 默认 `hostname-pid`，空白替换为 `-`、截断 120 | 断言三种情况 | `:74` |
| G48 | 心跳到不存在/**未启用**的地区 → `Worker 地区未启用或不存在` | 精确文案 | `:75` |
| G49 | 心跳是 **upsert**：同一 `worker_id` 只保留一行且刷新 `last_seen_at` | 连发两次 → `count(*)=1` | `:75` |
| G50 | workspace 的 `workers` 只含 **`last_seen_at > now()-2min`** 的心跳 | 把某条 `last_seen_at` 改成 3 分钟前 → 从列表消失 | `:31` |
| G51 | `recoverGeoJobs`：`processing` 且 `started_at < now()-10min` → `failed` + 文案 `Worker 中断；是否产生供应商费用需核对账单` + release(null) | 精确文案；未超时的 processing **不动** | `:110` |

---

## 2.5 本轮取证新增（★ 含一个**已修复缺陷 G53**，请作为回归断言保留）

### A. 原子性注入手法（G27b 的可执行做法，**已实测跑通**）

不改产品代码，只用数据前置：

```sql
-- ① 正常走完：建 prompt / model(profile 凭证，指向假 LLM) / region / budget(启用) / target
-- ② 入队并认领，拿到 status='processing' 的 job（此时 reserved_usd 已预留）
-- ③ ★ 注入：预置一行 monitor_job_id = 该 job id 的样本（模拟"上一轮崩溃留下的残留"）
INSERT INTO geo_samples(prompt_id,model,answer,brand_mentioned,duration_ms,monitor_job_id,
  prompt_snapshot,market_snapshot,brand_snapshot,config_hash,sample_kind)
VALUES($1,'sentinel','哨兵',false,1,$2,'p','US','B',repeat('0',64),'manual');
-- ④ 调 processGeoSampleJob(job) → 事务内第 2 步 INSERT 撞 geo_samples_monitor_job_id_key（017 加的 UNIQUE）
```

**为什么这不是"人造错误"**：`monitor_job_id` 的 UNIQUE 正是为了防重复采样；而"上次处理到一半留下样本"是真实的崩溃/重放场景。

**实测结果（2026-10-01，本地运行时库，`.runtime/probe-g27-atomicity.mts`）——事务本身的回滚是**正确**的**：

| 断言 | 实测 |
| --- | --- |
| 事务内失败会抛出 | ✅ `duplicate key ... geo_samples_monitor_job_id_key` |
| `geo_samples` 不新增 | ✅ 1 → 1 |
| **哨兵行仍在**（证明是 ROLLBACK 而非先写后删） | ✅ |
| `geo_daily_rollups` 不建行 | ✅ 0 → 0 |

### B. ★ G53：**成功事务内失败时，补偿事务曾不可达** —— 已修复（2026-10-01），请作为**回归断言**保留

**修复前的实测三条（同一脚本，与 G6(a) 对照）**

| 抛点 | job 终态 | `reserved_usd` | target.last_error |
| --- | --- | --- | --- |
| **事务之前**（模型返回非 JSON） | `failed` ✅ | 0.00046 → **0** ✅ | 有值 ✅ |
| **事务之内**（哨兵注入撞唯一约束） | 仍 **`processing`** ❌ | 0.00046 → **0.00046（未释放）** ❌ | **null** ❌ |

**根因（已用最小实验证实）**：[`geo-monitoring.ts:101`](../packages/domain/src/geo-monitoring.ts#L101) 原为
`return transaction(async c=>{…})` —— **`return` 后面缺 `await`**。JS 里 `return <promise>` 在 `try` 内**不会**把 rejection 交给 `catch`：

```
return await Promise.reject(...)  → caught: boom        （catch 生效）
return       Promise.reject(...)  → 未捕获，rejected: boom （catch 被跳过）
```

于是 `:108` 那个「release 预留 + job→failed + 写 target.last_error」的补偿事务，**对它唯一存在的理由（事务内失败）恰好不可达**。

**影响**：每次事务内失败都会留下 ① 一条永久 `processing` 的 job ② 一笔永不回退的 `reserved_usd`（日/月两个窗口各一份），直到 `recoverGeoJobs()` 的 **10 分钟**兜底扫描才回收（G51）。多次失败会持续累积预留，**可能让预算看起来"已用尽"而实际没花一分钱**。

**修复（L1 裁定"修"，2026-10-01 落地，就一个词）**：

```ts
-  return    transaction(async c=>{ … });
+  return await transaction(async c=>{ … });
```

**同类审计（已做，结论：仅此一处）**：全仓 36 处 `try{` + 60 处 `return transaction(...)`，只有本处同时满足「在 `try` 内 + 依赖 `catch` 兜底」；其余要么是**顶层** `return transaction(...)`（无 `catch` 可跳过，无害），要么已经写成 `return await transaction(...)`（如 [`apps/cms/src/server/media.ts:20`](../apps/cms/src/server/media.ts#L20)）。另查 `ai-agent.ts` 的 `processAgentRun`、`crm-sync.ts` 的 `runCrmSyncJob`、`translation.ts` 的 `processTranslationJob` 三处 `try`：内部均用 `query()` 而非 `transaction()`，不受影响。

**修复后实测（同一脚本，`18/18 PASS`；修复前 `12 PASS / 6 FAIL`）**

| 断言 | 修复前 | 修复后 |
| --- | --- | --- |
| 事务内失败 → job=`failed` 且有 error_message | ❌ 仍 `processing` | ✅ |
| `reserved_usd` 回基线 | ❌ 泄漏 0.00046 | ✅ 0.00046 → **0** |
| target.`last_error` 有值 | ❌ null | ✅ 有值 |
| 事务整体回滚（`geo_samples` 不增 / rollup 不建行 / **哨兵行仍在**） | ✅ | ✅（未回归） |
| 成功路径账本（G4） | ✅ | ✅ |

> **给 L1 的断言口径**：**G53 期望"修复后"的行为**（事务内失败 → 补偿事务生效）。这样它同时是一条**防回归**断言 —— 若将来有人把 `await` 去掉，这条必须变红。
> ✅ 文档中另附本次修复的完整背景；**产品代码改动只有这 1 个词**。

### C. 夹具坑（本轮实测踩到，L1 写测试时请直接避开）

1. **`ensureActor` 不是按 email 幂等的** —— 它是 `INSERT INTO users(id,email,…) ON CONFLICT(id) DO UPDATE`（[`crud.ts:40`](../packages/domain/src/crud.ts#L40)），**不覆盖 email 唯一键**。同一 email 换个新 id 会撞 `users_email_key`。夹具请**每次用新 email**（或复用固定 id）。
2. **`geo_samples` 的 NOT NULL 列远不止 014 那几列**：015 把 `prompt_snapshot` / `market_snapshot` / `brand_snapshot` / `config_hash` 改成 NOT NULL（[`015_v21_collaboration.sql:46-57`](../database/015_v21_collaboration.sql#L46)），且 `monitor_job_id` 带 **UNIQUE**（017）。造哨兵行/夹具样本时必须一并给值。
3. **现有 `.runtime/fake-llm-server.mjs` 不能直接复用** —— 它返回的是翻译形状 `{"translations":{…}}`；`processGeoSampleJob` 要的是 `{"answer":"…","citations":[…]}`。请另写替身（本轮探针里内置了一个最小实现，可直接搬）。
4. **账本读数的干扰**：`geo_budget_windows` 是**跨用例共享**的（按 period+starts_on 主键）。用例开始前请把 `reserved_usd/spent_usd/sample_count` 归零，否则一次失败用例泄漏的 `reserved` 会让后续断言误判（本轮踩过）。

---

## 3. 建议的用例组织（供 L1 参考，非强制）

```
geo 配置校验（G37–G46, G33–G35）      ← 纯校验，最便宜，先落地
geo 预算账本（G1–G6, G43）            ← 核心价值，必须覆盖（G6 要分两个抛点）
geo 事务原子性与补偿（G27b, G53）      ← ★ G53 已修复，作防回归断言，见 §2.5 B
geo 并发认领（G7–G9, G15–G17）        ← SKIP LOCKED，唯一能证明"不会重复扣费/重复采样"
geo 采样结果（G18–G28，替身 LLM）
geo 安全（G29–G32）                  ← 脱敏 + 加密 + 篡改
geo worker（G47–G51）
```

**优先级建议**：P0（G1–G9）与 G29/G30/G32 先做。理由：一是**钱**，二是**密钥/脱敏**，三是这两组一旦回归，人工验收几乎发现不了（采样是异步的、金额是小数的）。

**G53 已按 L1 裁定修复**（见 §2.5 B）：它现在是一条**防回归断言**，期望"修复后"的行为。
**已按实测订正的两条**：G38 / G39（v1 把"归一化后应通过"误写成"应拒绝"，见 §2 P4 的对照表）。

## v1 → v2 修订记录（2026-10-01）

| 编号 | v1 的问题 | v2 的处理 |
| --- | --- | --- |
| **G38** | 自相矛盾：同句既写"先 trim + 小写"又写"大写/空格 → 400" | 按**实测**订正：`" CN "`/`"A-B_9"` 必须**通过**；并区分 **zod 门**与**领域门**的拒绝文案 |
| **G39** | 同类错误：写 `cn` → 400 | 订正：`"cn"` 通过并落库 `CN`；只有 `"C"` 被领域层拒 |
| **G27** | 只断言成功路径，无法排除部分提交 | 拆出 **G27b**（哨兵注入 → 断言整事务回滚）+ 给出可执行做法 |
| **G6** | 笼统说"失败路径要释放预留" | 拆成 **(a) 事务之前**（实测通过）/ **(b) 事务之内**（实测失败，见 G53） |
| **新增 G53** | — | ★ 记录 `geo-monitoring.ts:101` 缺 `await` 导致补偿事务不可达；**L1 裁定"修"，已落地（1 个词）并实测 18/18 全绿**，作为防回归断言保留 |
| §2.5 C | — | 新增 4 条夹具坑（`ensureActor` email 唯一键、`geo_samples` 额外 NOT NULL 列、fake LLM 形状不同、账本跨用例共享） |

---

## 4. 明确不做（防止 scope 膨胀）

- **不测真实网络**：不连真实 DeepSeek、不连真实竞品站点。
- **不测前端 UI**（GEO 后台页面的视觉/交互另有 `.runtime/verify-*.mjs` 风格的无头浏览器验收，不在本包范围）。
- **不动迁移**：不加 027；GEO 表在 014/017 已具备。
- **不改产品代码来"让测试好写"**。若发现必须改（例如某条不变量无法在不改代码的前提下观测），**停下来上报**，由 L1 决定是否改契约。

---

## 5. 交付物与验收口径

**L1 产出**：`tests/geo-monitoring.integration.ts`（或并入 `tests/integration.ts`）+ 让 `verify.mjs` 调用它的那一行改动；外加**每条断言与 G 编号的对应表**。

**验收（必须给出命令 + 实际输出）**：

```powershell
# 1) 免库基线不能被破坏
pnpm test                      # 期望 exit 0，仍需 17/17（不许出现"必须先起数据库"）
# 2) 起本地运行时库后跑集成链
node infrastructure/scripts/verify.mjs --local-runtime   # 期望 exit 0，且新增 GEO 段落全 PASS
# 3) 夹具自清
#    期望 verify 结束后 geo_sample_jobs / geo_monitor_targets / geo_daily_rollups 无本包残留
```

**红灯判定**：任一 G 编号失败即红灯；**不许**通过放宽断言（例如把 `NaN` 容忍掉）来变绿。

---

## 6. 给 L1 的一句总结

> GEO 监测中心是全项目唯一「花真钱 + 跨区并发认领 + 金额账本」的模块，当前**零自动化测试**。
> 请按 §2 出**可执行断言**（P0 优先：成本公式/预算拦截/账本守恒/并发不重复认领），落点遵守 §1 的三条硬约束（**`pnpm test` 必须继续免库**、**绝不真打外部 LLM**、**夹具自清**）。
