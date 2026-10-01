# L1 终审包 · F-3 第 1 条「client 只看自己的询盘」（鉴权）

> 送审对象：`51dacd5`（2026-10-01 13:04）—— 清单标「⚠️ 属高风险（鉴权）diff，建议送 L1 终审」。
> 送审原因：**部署前复核发现该改动漏了 2 个读入口**，其中 1 个会泄露客户邮箱与 CRM 远端记录。
> 裁定结果决定它能不能随下次 `sync-prod.ps1` 上生产（**当前已暂停部署**）。
> 所有行号/文案均在当前工作区核对；实测记录见 §5，复现命令见 §8。

---

## 1. 一句话结论

**口径是对的、集中在 `lead-scope.ts` 的方向也是对的，但"接入了哪些入口"是靠人工枚举的，漏了 2 个：**
`GET /api/v1/trade/funnel` 与 `GET /api/v1/v2/v21-crm` —— 两者都只要求 `leads.read`，而 `client` **恰好有** `leads.read`。
**因此本 diff 现在不建议上生产。**

## 2. 送审口径（SPEC）

| 项 | 内容 |
| --- | --- |
| 政策 | `client` 角色**只看自己的询盘**；归属口径 = **邮箱精确匹配**（`inquiries.email = actor.email`）**OR** 已**指派给他**（`assigned_to = actor.id`） |
| 范围 | 仅 `client`；`admin/super_admin/editor/seo_manager/translator/reviewer` 不受限 |
| 失败方向 | 必须 **fail-closed**（宁可看不到，不可漏看） |
| 不泄露存在性 | 按 id 单查陌生人应 **404**，不能是 403 |

## 3. 变更范围（`git show 51dacd5`，+55 / −11，5 文件）

| 文件 | 改动 |
| --- | --- |
| `packages/domain/src/lead-scope.ts` | **新增**（38 行）：`isClientActor` / `inquiryScope` / `inquiryChildScope` / `leadTableScope` / `asJoinCondition` |
| `packages/domain/src/crud.ts` | `list()` 对 `leads` 组表加过滤（+3） |
| `packages/domain/src/workflow.ts` | `inquiryWorkspace` 列表 + 单查（+5/−2） |
| `packages/domain/src/trade-operations.ts` | `tradeWorkspace`（列表 + total 计数）、`tradeInquiry`（+9/−4） |
| `packages/domain/src/crm.ts` | `crmOptions(kind=inquiries)` / `crmCustomer` / `crmCustomers`（+9/−4） |

**未触碰**：`bi.ts`、`crm-sync.ts`、`marketing.ts`、写路径。

## 4. ★ 覆盖率对照表（终审的核心）

对全仓 `FROM inquiries` / `JOIN inquiries` 的**全部**读站点逐个判定（L2 已枚举）：

| # | 站点（HTTP / 函数） | 权限门 | client 可达 | 已按归属过滤 | 实测 |
| --- | --- | --- | --- | --- | --- |
| 1 | `records?resource=inquiries` → `crud.list` | `leads.read` | ✅ | ✅ | PASS |
| 2 | `records?resource=inquiry_items` → `crud.list` | `leads.read` | ✅ | ✅ | PASS |
| 3 | `records?resource=download_events` → `crud.list` | `leads.read` | ✅ | ✅（`email = actor.email`） | 未单测 |
| 4 | `v2/inquiries`（列表）→ `workflow.inquiryWorkspace` | `leads.read` | ✅ | ✅ | PASS |
| 5 | `v2/inquiries?id=`（单查） | `leads.read` | ✅ | ✅（404） | PASS |
| 6 | `trade/workspace` → `tradeWorkspace` | `leads.read` | ✅ | ✅（列表 + total 都加了） | PASS |
| 7 | `trade/inquiry?id=` → `tradeInquiry` | `leads.read` | ✅ | ✅（404） | PASS |
| 8 | `v2/crm-options?kind=inquiries` → `crmOptions` | `crm.read` | ✅ | ✅ | PASS |
| 9 | `v2/crm-customers` / `v2/crm-customer` → `crmCustomers` / `crmCustomer` | `crm.read` | ✅ | ✅ | 未单测（本地无数据） |
| **10** | **`trade/funnel` → `tradeFunnel`** | **`leads.read`** | **✅** | **❌ 未过滤** | **FAIL（泄露）** |
| **11** | **`v2/v21-crm` → `crmWorkspace`** | **`lead()`=`leads.read`** | **✅** | **❌ 未过滤** | **FAIL（泄露邮箱 + CRM 远端）** |
| 12 | `v2/bi-catalog` / `bi-report` / `bi-drilldown` / `bi-export` | **`admin(actor)`** | ❌ | n/a | PASS（403） |
| 13 | `v2/crm-settings` / `v21-crm-settings` / `crm-sync` 写 | `admin(actor)` | ❌ | n/a | — |
| 14 | `trade/portal` / `portal-page` / `decision` | **Bearer 邀请令牌**（非角色） | n/a | 另一套鉴权 | 已单独验收 |
| 15 | `marketing.*`（`matchSQL` 里 `EXISTS inquiries`） | marketing 域（admin） | ❌ | n/a | — |
| 16 | 写路径：`createTradeQuote` / `changeTradeQuote` / `recordTradeResponse` / `updateInquiry` | **`leads.write`** | ❌（client 无 `leads.write`） | n/a | — |
| 17 | `trade-operations.inquiry(c,id)`（内部 helper） | 调用方把关 | 由 16 决定 | n/a | — |

> 注：`client` 实测权限 = `appearance.*、content.*、media.*、product.*、leads.read、publishing.*`（11 条）——**有 `leads.read`，无 `leads.write`**。

## 5. ★ 两个阻塞项（实测证据，2026-10-01）

### A. `GET /api/v1/trade/funnel` —— 泄露全部询盘（编号 + 客户姓名 + 国家 + 来源 + 语言）

- 站点：[`trade-operations.ts:68`](../packages/domain/src/trade-operations.ts#L68) `tradeFunnel(a,raw){access(a,'leads'); …}` —— 只做**读**校验，**方法体内未接 `lead-scope`**。
- 路由：[`trade-api.ts:17`](../apps/cms/src/server/trade-api.ts#L17) `if(action==='funnel'&&method==='GET')`。
- 该查询 `SELECT … FROM inquiries i … LIMIT 10001`，返回字段含 `inquiry_number`、`name`（**客户姓名**）、`country`、`utm_source`、`locale`、`visit_id`、qualified/quoted/won。

**client 实测返回（陌生询盘原样出现）**：

```json
{"id":"cd9fda03-…","inquiry_number":"RFQ-20261001-51BD8123","name":"F3 Stranger","country":null,
 "source":"","locale":"en","visit_id":null,"qualified":false,"quoted":false,"won":false,
 "created_at":"2026-10-01T05:57:43.016Z"}
```

### B. `GET /api/v1/v2/v21-crm` —— 泄露邮箱 + 公司 + **CRM 远端记录**（比 A 更严重）

- 站点：[`crm-sync.ts:29`](../packages/domain/src/crm-sync.ts#L29) `crmWorkspace(actor){lead(actor); …}`，而 [`crm-sync.ts:11`](../packages/domain/src/crm-sync.ts#L11) 的 `lead()` 就是 `canRead(inquiries)` → 同样是 `leads.read`。
- 路由：[`v21-api.ts:32`](../apps/cms/src/server/v21-api.ts#L32) `if(action==='v21-crm'&&method==='GET')`。
- 三个查询都把 `inquiries` 直接 `LEFT JOIN` 进来，未过滤。

**client 实测返回**（`conflicts` 一行）：

```json
{"inquiry_number":"RFQ-20261001-1075ED04","name":"F3 Stranger",
 "local_email":"f3funnel-…@example.test","local_company":"F3 Stranger Co","local_status":"new",
 "remote_name":"CRM Remote Name","remote_email":"remote-f3@example.test","remote_company":"Remote F3 Co"}
```

> ⚠️ **这条附带 CRM 远端记录的姓名/邮箱/公司** —— 一旦将来接了真实 CRM，暴露面比站内询盘更大。
> ⚠️ **空测提醒（诚实）**：我第一次跑时本地 `crm_sync_*` 为空，"未泄露"是**空测**；补造 1 条 push 任务 + 1 条关联 + 1 条冲突后才复现出泄露。**不要用空库的绿灯当结论。**

## 6. 非阻塞观察（4 条，供 L1 一并裁定，均不阻塞本 diff 的正确性）

1. **`asJoinCondition` 是恒等变换**：`fragment.replace(/^\s*AND\s+/,' AND ')` 把 ` AND x` 换成 ` AND x`，输出与输入相同。属无效抽象（不是 bug），可删或补注释说明意图。
2. **`leadTableScope` 的 `AND false` 兜底当前不可达**：`registry.ts` 的 `leads` 组恰好只有 `inquiries` / `inquiry_items` / `download_events` 三张表，且都已显式处理。属**好的防御性写法**，建议保留。
3. **邮箱大小写不是问题（已排除）**：`inquiries.email` 与 `download_events.email` 都是 **`citext`**（[`008_leads_integrations.sql:1,3`](../database/008_leads_integrations.sql#L1)），比较天然大小写不敏感。我原先担心的一点不成立，特此说明。
4. **`tradeInquiry` 的子查询依赖前置检查**：`items/quotes/events/grants/deals` 5 个子查询**都没有**按归属过滤，安全性**完全依赖**前面那条已加 `inquiryScope` 的单查先 404。当前安全，但属隐式耦合 —— 将来若有人调整顺序/提前 return，就会漏。建议要么复用同一片段，要么加显式注释。

## 7. L2 已完成的验证（可复跑）

| 验证 | 结果 |
| --- | --- |
| `.runtime/verify-client-scope.mjs`（51dacd5 自带） | **14/14 PASS**（覆盖 6 个已修补入口 + `assigned_to` 分支 + admin 无回归） |
| `.runtime/probe-f3-funnel-leak.mjs`（本次新增，覆盖 17 个站点里的 client 可达项） | **12 PASS / 2 FAIL** —— 2 个 FAIL 就是 §5 的 A、B |
| 回归 | `pnpm -r typecheck` exit 0（6/6）、`pnpm test` 17/17、`verify.mjs --local-runtime` exit 0 |
| 生产现状 | prod 停在 2026-10-01 01:27 那次部署，**尚未**包含本 diff；prod 有 1 个 `client` 账号（`client-demo@opctools.cloud`），故 **A/B 两条一旦上生产即可被该账号利用** |

## 8. 复现命令

```powershell
npx tsx .runtime/probe-g27-atomicity.mts        # G53（与本包无关，另一笔）
node .runtime/verify-client-scope.mjs            # 51dacd5 自带的 6 入口验证
node .runtime/probe-f3-funnel-leak.mjs           # ★ 本包：17 个站点的覆盖探针，暴露 A/B 两条
```

## 9. 明确请 L1 裁定的问题

1. **`trade/funnel` 与 `v2/v21-crm` 怎么修？** 两条路各有利弊，我倾向 (b)：
   - **(a) 补归属过滤**（按 `lead-scope` 的既有模式）：client 能看到"自己那一条"的漏斗/同步记录 —— 与现行口径最一致，但漏斗/集成视图对客户没有使用价值。
   - **(b) 把门槛从 `leads.read` 提到 `leads.write`**（或 `admin`）：把它们定性为**内部经营/运维视图**，client 直接 403 —— 语义更对，但属**权限口径变更**，需你确认不影响既有流程（`admin/super_admin` 都有 `leads.write`，`editor/translator/reviewer` 本来就没有 leads）。
2. **是否还有第 3 个漏点？** 我的枚举口径是"代码里出现 `FROM|JOIN inquiries` 的全部站点"（§4 共 17 项）。请裁定这个**枚举口径本身**是否足够；若你认为还应把 `inquiry_items` / `download_events` / `crm_history(inquiry_id 关联)` 也算进去，我按你的口径重跑一遍。
3. **要不要把"枚举 + 覆盖表"变成流程的一部分？** 这次漏点的根因不是逻辑错，而是**入口枚举靠人工**。建议以后凡是"按归属/租户加过滤"的改动，都必须附一张 §4 这样的覆盖表（我这支探针可以直接当回归用）。

## 10. 附：为什么不建议现在部署

本 diff 的目的是**关掉一个隐私泄露**（改动前 client 能读全部询盘）。但在 §5 的两条漏点补上之前，它只是把"6 个大口子"关掉、**留着 2 个**（其中 1 个还倒出 CRM 远端数据）。
**部署它 = 对外宣称"已经修好了"，实际没有。** 建议：先裁定 §9，补完两处，**再和 G53 一起部署**。

> **别误读成"部署会更糟"**：prod 现状是**这 8 个入口全部泄露**（本 diff 未上线）；上了本 diff 会变成 2 个，属**净改善**。它只是达不到"已修复"的可宣称标准 —— 而我们要的是一次到位，不是分两次上生产。

---

## 11. 裁定与落地（2026-10-01，用户裁定 **选 (b)**）

**裁定**：不走"补归属过滤"，而是把这两个入口定性为**内部经营 / 运维视图**，门槛从 `leads.read` 提到 **`leads.write`** —— `client` 直接 403。

**改动（2 处门禁 + 2 条说明注释，`5 insertions / 2 deletions`）**

| 文件 | 改动 |
| --- | --- |
| [`trade-operations.ts:68`](../packages/domain/src/trade-operations.ts#L68) | `tradeFunnel`：`access(a,'leads')` → **`access(a,'leads',true)`** |
| [`crm-sync.ts:29`](../packages/domain/src/crm-sync.ts#L29) | `crmWorkspace`：`lead(actor)` → **`lead(actor,true)`** |

**影响面（为什么只有 client 受影响）**

| 角色 | 有 `leads.read` | 有 `leads.write` | 改前 | 改后 |
| --- | --- | --- | --- | --- |
| `client` | ✅ | ❌ | 200（能读全部询盘） | **403** |
| `editor` / `seo_manager` / `translator` / `reviewer` | ❌（无 leads 模块权限） | ❌ | 403 | 403（不变） |
| `admin` / `super_admin` | ✅ | ✅ | 200 | 200（不变，无回归） |

> `crm-sync.ts` 内另两处 `lead(actor,true)`（`queueCrmSync` / `retryCrmJob`）本就是写门，`resolveCrmConflict` 是 `admin` 门 —— **本次未触碰**。

**实测（本地栈，命令级）**

```text
node .runtime/probe-f3-funnel-leak.mjs    → 14/14 PASS
  PASS B  trade/funnel 对 client 返回 403 — HTTP 403 没有此功能的操作权限
  PASS B  ★ 403 响应体不含任何询盘数据 — 行数=0
  PASS B2 v2/v21-crm 对 client 返回 403 — HTTP 403 没有客户跟进权限
  PASS B2 ★ 403 响应体不含询盘/CRM 远端数据 — 未泄露
  （B2 的夹具已按"空库绿灯是空测"的教训先造出引用陌生询盘的任务/关联/冲突）
  PASS A  已被 51dacd5 修补的 6 个读入口全部仍正确（无回归）
  PASS D  admin 的 trade/funnel 正常且能看到全部
```

```text
pnpm -r typecheck                → exit 0（6/6）
pnpm test                        → exit 0（17/17）
verify.mjs --local-runtime       → exit 0（GEO 99/99 + integration + 全量回滚 → 重迁移 → no-op）
```

**所以**：本 diff 的 8 个泄露入口现已**全部关闭**（6 个由 `51dacd5` 补过滤，2 个由本次提门槛），可以随 `G53` 一起上生产。
