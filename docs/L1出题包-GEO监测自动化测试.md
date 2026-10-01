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
3. **绝不允许真打外部 LLM**。`processGeoSampleJob` 会 `callLLMChat` 到真实 endpoint。请用替身（先例：`.runtime/fake-llm-server.mjs` 假 LLM 服务；或注入/替换 `callLLMChat`）。**不要**在测试里放真实 API Key。
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
| G6 | **失败/中断路径必须释放预留** | 让替身 LLM 抛错 → ① job=`failed` ② `reserved` 回基线 ③ `spent` **不**增加 ④ `sample_count` **不**增加 ⑤ target.`last_error` 有值 | `:108` |
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
| G38 | `code` 规范 `^[a-z0-9][a-z0-9_-]{1,39}$`（**先 trim + 小写**） | 大写/空格/单字符 → 400 `代码需为 2–40 位…` | `:12` |
| G39 | `country_code` 必须两位大写字母 | `cn` / `CHN` → 400 `国家代码应为两个大写字母` | `:48` |
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

## 3. 建议的用例组织（供 L1 参考，非强制）

```
geo 配置校验（G37–G46, G33–G35）      ← 纯校验，最便宜，先落地
geo 预算账本（G1–G6, G43）            ← 核心价值，必须覆盖
geo 并发认领（G7–G9, G15–G17）        ← SKIP LOCKED，唯一能证明"不会重复扣费/重复采样"
geo 采样结果（G18–G28，替身 LLM）
geo 安全（G29–G32）                  ← 脱敏 + 加密 + 篡改
geo worker（G47–G51）
```

**优先级建议**：P0（G1–G9）与 G29/G30/G32 先做。理由：一是**钱**，二是**密钥/脱敏**，三是这两组一旦回归，人工验收几乎发现不了（采样是异步的、金额是小数的）。

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
