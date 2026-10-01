# A 组 · 业务验收操作单

> 对应 [`docs/待验收与遗留清单.md`](待验收与遗留清单.md) 的 **A 组（只能由业务侧 / 用户验收）**。
> 生成：2026-10-01 ｜ 规格：A-1～A-7 逐条给出「前置 / 步骤 / 期望 / 回贴什么」。
> **口径**：所有入口、文案、约束都在当前工作区代码里核对过（附文件:行号）；prod 侧现状为 2026-10-01 实测。
> ⚠️ 口令/令牌一律**不要发给我**。

---

## 0. 结论先行

| # | 事项 | 2026-10-01 状态 |
| --- | --- | --- |
| A-1 | 报价多人审核闭环 | ✅ **已在 prod 机器验收通过**（29/29），不再需要人工 |
| A-2 | 客户 / 渠道邀请端到端 | ✅ **门户链路已机器验收通过**；剩「把链接发给真实客户」这一步只能你做（且是设计使然） |
| A-4 | 报价流程走通 | ✅ **已在 prod 机器验收通过**（C-1 已解锁前置） |
| A-3 | 证书 / 案例 / 服务承诺 / 首响时限上架 | ⬜ **只能你做**（需真实资料）—— 现在可做，见 §2.1 |
| A-5 | AI Agent 全流程 | ⬜ **只能你做**，但**卡点已消失**（key 早已配好）—— 见 §2.2 |
| A-6 | 真实外部请求验收 | ⬜ **大部分可做**；只有「真实 CRM」仍卡 D-2 —— 见 §2.3 |
| A-7 | GEO 多地区采样 | ⬜ **卡基础设施**（目标地区要有机器）—— 见 §2.4 |

> 一句话：**A 组真正还压在你手上的只有 4 条，其中 A-5 的"没 key"和 A-3 的"没人审核"这两个卡点今天都已经解掉了。**

---

## 1. 已完成部分（命令级证据，可复跑）

在 prod（`https://www.opctools.cloud`）以 root 执行：

```bash
scp .runtime/verify-a-prod-trade.mjs root@43.132.209.126:/root/   # 从开发机推一次
ssh root@43.132.209.126 'PROD_CONFIRM=1 node /root/verify-a-prod-trade.mjs'
```

**实测输出（2026-10-01）：`合计 PASS=29 FAIL=0`，退出码 0。** 覆盖：

- **A-1 核心不变量**：编制人自审 → `403 报价须由另一位审核员确认`，且状态仍停在 `review`；换成第二个账号 → `approved`，`reviewed_by` 落库为**审核人**而非编制人。
- **A-4 全链路**：RFQ 建单 201 → 创建报价 → 提交 → 审核 → 发出 `sent`；`draft` 直接 approve → 409；过期有效期建单即拒 400；报价内容不可直接改（不可变触发器拦下）。
- **A-2 门户链路**：客户邀请必须匹配询盘邮箱（否则 400）；邀请返回**一次性 64 位明文令牌**、库里只存 SHA-256；客户端可见已发出报价并确认 → `accepted`；渠道端只读（确认 → 403）；撤销后**同一令牌立即 401**；伪造令牌 401。
- **数据自清**：跑完询盘 / 报价 / 邀请残留均为 **0**。

**为什么 A-2 不需要 SMTP**：`createPortalGrant`（[`trade-operations.ts:48`](../packages/domain/src/trade-operations.ts#L48)）把明文令牌**返回给调用方**，后台把它拼成链接一次性显示、可复制（[`TradeDesk.tsx:34`](../apps/cms/src/app/(console)/manage/TradeDesk.tsx#L34)），界面原文就是「**邀请不会自动发送**」「请使用可信渠道发送」。这是**设计路径**，不是缺陷。

---

## 2. 需要你做的 4 条

### 2.1 A-3 证书 / 案例 / 服务承诺 / 首响时限上架

**现在就能做**，且**必须用两个账号**（新建的卡片只有"另一位审核员"能看到「审核并展示」按钮）。

**前置**：`quote-reviewer@opctools.cloud`（role=admin，见 §3）。

**步骤**

1. 用 `admin@opctools.cloud` 登录 `/manage` → **外贸业务**（5 个分区：`01 获客漏斗` / `02 报价协作` / `03 市场化内容` / `04 采购信任与服务` / `05 客户与渠道入口`）。
2. 进 **04 采购信任与服务** → 「**新增展示内容**」，内容类型可选：**资质证书 / 客户案例 / 服务承诺**（市场推荐在 03）。
   - 必填：展示语言、标题（2–160）、当地市场说明（2–2000）。
   - **资质证书必须填有效期**（否则保存即拒：`证书必须填写有效期`；且早于今天会被拒）。
   - **客户案例必须关联本站已发布页面**（否则 `市场推荐和案例必须关联本站已发布页面`）。
   - 国家代码可空（= 通用），填则两位大写（`US`/`DE`）。
3. 保存后状态是**待审核**。**换 `quote-reviewer` 登录** → 同页 → 点「**审核并展示**」。
   > 编制人自己**看不到这个按钮**（页面按 `created_by !== actorId` 渲染，[`TradeDesk.tsx:38`](../apps/cms/src/app/(console)/manage/TradeDesk.tsx#L38)），后端也会 403「请由另一位审核员核对内容和证明」。
4. 同页「**设置首次响应时限**」：语言 + 国家代码（留空=所有国家）+ 自然小时（1–720）→ 保存。
   > 只影响**此后新收到**的询盘 `response_due_at`，历史询盘保留原值（界面已注明）。

**期望**

- 对应语言的官网页面出现该卡片；卡片在**有效期内**才展示，证书到期或**关联页面内容变更后自动停止展示**（代码会比对 `source_hash`）。
- 新提交的询盘在报价协作页能看到「首响期限」。

**资料从哪来**：沿用 C-2 口径 —— 只写**能核实的**（客户站 <http://www.sssglass.net/> 上的资质/案例）。站上没有的一律留空，**不要编造**。

**回贴给我**：卡片标题 + 语言 + 「审核并展示」后官网 URL（我会核对卡片是否真在公网可见、以及 hash 联动是否生效）。

---

### 2.2 A-5 AI Agent 全流程

**卡点已消失**：A-5 原写「需真实 DeepSeek key」，但**所有 LLM 入口共用同一个配置源** —— `activeLLMConfig()` 读 `runtime_settings['translation.llm']`（[`llm.ts:74`](../packages/domain/src/llm.ts#L74)），而 prod 该条**已 `enabled=true` 且 `hasKey=true`**（2026-10-01 只读核对）。`ai-agent.ts` / `ai-writing.ts` / `ai-product.ts` / `translation.ts` / `geo-monitoring.ts` / `workflow.ts` 全部走这条，**不需要另配 key**。

**步骤**：用有权限的账号在后台走一遍 —— 创建任务 → 计划/证据 → 人工审核 → 套用 → 预览 → **人工发布**。

**期望 & 要盯的两个数**

- 生成的草稿**必须经人工审核才发布**（这是设计底线，别期待全自动）。
- 核对**模型费用**：任务表 `ai_agent_runs` 记 `calls_used`；单任务**模型调用上限 2 次**，超了会报「本次任务的模型调用次数已达上限」——**看到这句不是故障，是预算闸**（[`ai-agent.ts:52`](../packages/domain/src/ai-agent.ts#L52)）。
- 证据类工具（`read_content` / `seo_review` / `keyword_evidence` / `competitor_evidence` / `geo_evidence`）只读本地已存快照，**不会外发**。

**回贴给我**：任务名 + 最终状态 + `calls_used` + 你估的这次实际花费（我会去库/日志核对 token 与费用口径）。

---

### 2.3 A-6 真实外部请求验收（三小项，可分开做）

**(a) DeepSeek 受控采样（可做）** —— `/manage` → **GEO 监测中心**（4 个 tab：总览与成本 / 采样目标 / 模型与地区 / 趋势比较）：

1. **模型与地区** → 新建模型：选「复用站点密钥」时**端点必须与「AI 设置」里的 URL 完全一致**，否则 400 `复用站点密钥时，端点必须与当前 AI 设置完全一致`。
2. **总览与成本** → **必须先启用预算**，否则任务会直接变成 `blocked_budget`、理由 `GEO 成本预算尚未启用`（这是设计，不是报错）。
3. **采样目标** → 选固定问题 + 模型 + 地区 + 间隔（60–10080 分钟）→ 保存并启用（**启用前问题/模型/地区三者都必须已启用**，否则 400）。
4. 手动点「采样」→ 看队列与结果；同一目标 5 分钟内不能重复提交（409）。

> ⚠️ 三句实话：① **地区≠地理定位**，它只表示「请求从哪个 Worker 发出」（界面自己也这么写）；② 专用密钥依赖 `.env` 的 `GEO_MONITOR_SECRET`（prod 已配 96 字符，**更换它会导致已存的专用密钥全部无法解密**）；③ 预算是**真钱闸门**，估算公式 = `(4000×输入单价 + max_output_tokens×输出单价)/1e6`。

**(b) 竞品网页采集（可做）** —— `/manage` → 增长研究 → **竞品观察** → 添加一个**公开**页面 URL → 采样 → 「查看变化与建议」。它只比对 title/description/canonical/headings 的结构变化，**不抓正文、不判优劣**；变更会进提醒列表等你「已查看」。

**(c) 真实 CRM 双向请求（仍卡 D-2）** —— 需要一个**公网 HTTPS 根地址 + 16–500 字符令牌**，且**必须 https、不能带端口/账号/查询参数、域名解析结果须全是公网 IP**（请求硬编码 443 并钉死解析）。对方要实现 `GET {endpoint}/leads?limit=100` 与 `POST {endpoint}/leads/upsert`（冲突返回 409 + `{record}`）。**详细契约与风险见 [`docs/D组-外部服务启用清单.md`](D组-外部服务启用清单.md) D-2。**
> ⚠️ 一旦启用，worker **每 15 分钟**自动双向同步；**强烈建议先指测试 CRM**。我没有 mock CRM，所以这条**本机无法演练**（这是已记录的边界，不是我省事）。

**回贴给我**：(a) 采样结果页截图 + 实际 cost；(b) 竞品变化提醒条数；(c) CRM 是否已具备 mock 环境。

---

### 2.4 A-7 GEO 多地区采样

**现状（2026-10-01 prod 实测）**：`geo_regions` **只有 1 行**（`local`，迁移 017 内置，描述已写明"使用当前 Worker 的出站网络；不代表目标市场所在地区"）；`geo_worker_heartbeats` 有 17 条记录，但 worker id 全是同一台机器（`VM-0-8-opencloudos-*`）、同一 region。

**这一步的缺口是基础设施，不是代码** —— 必须在**目标地区有一台机器**跑区域 Worker：

```bash
# 在目标地区的机器上（连通同一套 PG/Redis）
GEO_WORKER_REGION_CODE=<地区code> GEO_WORKER_CONCURRENCY=3 \
  node --import tsx apps/worker/src/geo-region.ts
```

`GEO_WORKER_REGION_CODE` **必填**（[`geo-region.ts:5`](../apps/worker/src/geo-region.ts#L5)），心跳每 30 秒一次、认领轮询每 2 秒一次，`GEO_WORKER_CONCURRENCY` 默认 3、上限 8。

**步骤**：① GEO 监测中心 → 模型与地区 → 新建地区（**`code` 创建后不可更改**，因为它用于 Worker 路由）→ ② 在该地区机器启动 Worker → ③ 回「总览与成本」看 worker 列表（**只显示 2 分钟内有心跳的**）→ ④ 把采样目标的地区指到新地区。

**期望**：该地区的目标**只被该地区的 Worker 认领**（跨区认领会返回空）；趋势页按地区分组可比。

**回贴给我**：地区 code + 机器所在区域 + worker 列表截图。

---

## 3. 本次在 prod 新增的资产（含回收方式）

| 项 | 值 |
| --- | --- |
| 账号 | `quote-reviewer@opctools.cloud`，`role=admin`，`id=d51b2226-7512-4c80-ac01-ae474334f3d6`，displayName `Quote Reviewer` |
| 口令 | `/root/opctools-quote-reviewer-password.txt`（**600 root**，只回了「已写入」不回显） |
| 为什么是 admin | `reviewer` 角色**没有 leads 模块权限**，而报价审核第一步就要求 `leads.write` —— 用 `reviewer` 连动作都调不进来（见 §4 问题 1） |
| 建号脚本 | [`.runtime/prod-create-quote-reviewer.mjs`](../.runtime/prod-create-quote-reviewer.mjs)（幂等，可重复跑） |
| 验收脚本 | [`.runtime/verify-a-prod-trade.mjs`](../.runtime/verify-a-prod-trade.mjs)（**跑完自清业务数据**；`audit_log` 审计轨迹按设计保留） |
| **回收命令** | `DELETE /api/cms-admin-users/d51b2226-7512-4c80-ac01-ae474334f3d6`（管理员 JWT）或<br>`DELETE FROM payload_internal.cms_admin_users WHERE email='quote-reviewer@opctools.cloud';`<br>再 `rm -f /root/opctools-quote-reviewer-password.txt` |

> 决议留痕：账号角色由你在本轮选定为「**role=admin，验收完保留**」。admin 与 super_admin 的权限集合**均为 29 条、实际等宽** —— 这点已在选型时明确告知。

---

## 4. 本轮顺带发现的两个问题（需你决定，我没动产品代码）

**问题 1：产品自带的 `reviewer` 角色在外贸业务里是"死"的。**
`role_permissions` 实测：`reviewer` 只有 **9** 条，且 [`012_operational_defaults.sql:22`](../database/012_operational_defaults.sql#L22) 明确把 `leads` 模块**排除**在 `reviewer` 之外；而 `changeTradeQuote` 第一步是 `access(a,'leads',true)`（[`trade-operations.ts:39`](../packages/domain/src/trade-operations.ts#L39)）→ **名为"审核员"的角色无法执行报价审核**。
**当前绕过**：用 `admin` 充当审核员（本次即如此）。
**可选修法**（改动都在高危清单第 3 条「鉴权/权限」，需你点头）：
- (a) 给 `reviewer` 补 `leads.read` + `leads.write`（最小权限，符合产品本意；但也让它能看全部询盘）；
- (b) 新增一个「外贸审核员」角色，只给 `leads.read/write` + `publishing.write`。
> 我的建议：**先不动**。收尾期改权限表的收益小于风险；等真要用 reviewer 角色时再做，且要做就做 (b)。

**问题 2：D-1（SMTP）与 A-2 曾被混为一谈，其实是两件事。**
邀请**设计上就不发信**（手动发链接），所以 SMTP 未配置**不阻塞 A-2**；D-1 真正卡住的只有后台**「忘记密码」**这条自救路径。两者别互相等待。

---

## 5. 我怎么证明这次没留脏数据

```bash
ssh root@43.132.209.126 'PROD_CONFIRM=1 node /root/verify-a-prod-trade.mjs'   # 末尾含"测试数据已清理"断言
```

验收脚本每次结束时都会断言 `inquiries / trade_quotes / trade_portal_grants` 中本次标记（`a-verify-<时间戳>`）的残留为 **0**；`audit_log` / `trade_quote_events` 的审计行**故意保留**（审计日志按设计不可删改，删业务行后仅留历史记录）。

**回滚**：本次除「一个 admin 账号」外没有改任何 prod 配置、schema 或公开产物；账号回收见 §3。没有新增迁移（001–026 保持 applied 不变）。

---

## 7. prod 前置巡检（2026-10-01，只读；把"机器能查的"全查掉）

> 目的：让 A 组剩下的四条**只差"必须由你做的"那一步**，别在操作现场才发现前置没就位。
> 口径：prod 库只读查询 + 公开路径 curl，全部命令级；**未改任何 prod 配置或数据**。

| 项 | prod 现状（实测数字） | 结论：只差 |
| --- | --- | --- |
| **A-3** 证书/案例/服务承诺/首响时限 | `trade_market_cards` = **0**、`trade_service_rules` = **0**；**可选来源页已发布 77 个**；可当"另一位审核员"的账号 **2 个**（`admin` super_admin、`quote-reviewer` admin） | **真实资料**（证书/案例/承诺的正文 + 关联来源页）。前置（审核员 + 来源页）**都已就位** |
| **A-5** AI Agent 全流程 | LLM 配置 `enabled=true`、`hasKey=true`（`https://api.deepseek.com/chat/completions`、`deepseek-flash`）；`ai_agent_runs` = **0**（从未用过） | **你用有权限账号走一遍**（创建 → 计划/证据 → 审核 → 套用 → 预览 → 人工发布）并核对 `calls_used` 与费用。**无需配 key** |
| **A-6(a)** GEO 受控采样 | 模型 profile = **0**、地区 = 1、固定问题 = **0**、采样目标 = **0**；预算行 1 条但 **`is_enabled=false`**（日 5 / 月 50） | ①建模型（复用站点密钥时**端点须与 AI 设置完全一致**）→ ②**启用预算**（否则任务直接 `blocked_budget`）→ ③建采样目标 |
| **A-6(b)** 竞品网页采集 | `competitor_pages` = **0**、快照 = 0 | **一个公开竞品页面 URL** |
| **A-6(c)** 真实 CRM 双向请求 | `runtime_settings[crm.*]` = 0 行、`integration_connections` = 0 行 | **卡 D-2**：需公网 HTTPS 根地址 + 令牌（见 D 组清单） |
| **A-7** GEO 多地区采样 | `geo_regions` = **仅 `local`**；心跳 18 条、**最近 2 分钟内 1 条**、**全部同一 region（同一台机）** | **目标地区的一台机器** + 跑 `apps/worker/src/geo-region.ts`（`GEO_WORKER_REGION_CODE` 必填） |

**公开路径可达性**：`/` → **302**（跳转，部署验收按 200/301/302 放行）、`/en` 200、`/zh` 200、`/manage` 200、`/admin` 200。

**最短路径建议（按"你花的时间"排序）**
1. **A-5**（最快）：key 已就绪、表是空的，走一遍 UI + 核对费用即可。
2. **A-3**：只要你给出真实资料（证书/案例/承诺 + 关联哪个已发布页），写入 + 换第二个账号点「审核并展示」。
3. **A-6(b)**：给我一个公开竞品 URL，采集一次即可验收（只比结构变化，不抓正文）。
4. **A-6(a)**：要想花真钱做一次受控采样，先建模型 + 启用预算；**这一步会真实扣费**，金额由预算上限决定（当前配置日 5 / 月 50）。
5. **A-7**：需要另一台机器，属基础设施投入，最慢。

> ⚠️ 我没有代你在 prod 上写任何 GEO/内容配置：A-6(a) **会花钱**、A-3 涉及你的**真实资料**，这两类决定不该由我替你下。若你希望我先做**零成本的配置前置**（例如按 `site_default` 建一个 GEO 模型 profile，让只剩"启用预算 + 建目标"两步），说一声我就做。

### 7.1 ✅ 已完成的零成本前置（2026-10-01，经用户授权）

**做了什么**：在 prod 建了 **1 行** `geo_model_profiles`（**只此一行**，未启用预算、未建目标、未采样）。

| 字段 | 值 |
| --- | --- |
| `code` | `deepseek-flash` |
| `display_name` | DeepSeek Flash（复用站点密钥·峰值上限价） |
| `provider` / `model` | DeepSeek / `deepseek-flash` |
| `endpoint` | `https://api.deepseek.com/chat/completions`（与站点 AI 设置**逐字符一致** —— `credential_source='site_default'` 的硬要求，不一致会 400） |
| `credential_source` | `site_default`（**复用站点密钥，不存新密钥**） |
| `input_usd_per_million` | **0.300000** |
| `output_usd_per_million` | **1.200000** |
| `max_output_tokens` | 1200 |
| `is_enabled` | true |

**单价的出处与口径（这条直接决定预算闸门准不准）**

- 来源：**DeepSeek 官方定价页** [Models & Pricing](https://api-docs.deepseek.com/quick_start/pricing/)（非记忆、非截图）。
- `deepseek-flash` = **DeepSeek-V4.1-Flash**。官方数字（每 1M tokens）：输入 cache-miss 非峰值 **$0.15** / 峰值 **$0.30**；输出 非峰值 **$0.60** / 峰值 **$1.20**；cache-hit 与 V4-Pro 见该页。
- 本项目成本公式是 `(4000×inputRate + maxOutputTokens×outputRate)/1e6`，**不区分峰值/非峰值、也不区分缓存命中**。因此取 **峰值 + cache-miss** 作为**上限**：闸门只会**早拦**、不会漏拦（代价：成本记账**偏保守**，非峰值时段最多高估约 2 倍）。
- ⚠️ **若你确认采样只发生在非峰值时段**，可在后台把单价改成 `0.15 / 0.60`（一行 diff 的量级）；改错方向的风险是**闸门偏松**，所以我默认选了保守侧。
- ⚠️ **绝对不要填 0**：预估费用会变成 0，**预算闸门形同失效** —— 会真实扣费却记不出成本。

**验证证据**（prod 上执行，`.runtime/prod-geo-model-prep.mjs`，**9/9 PASS**）：端点一致性、`site_default`、单价数值、已启用，以及**零成本三项断言** —— 预算 `is_enabled=false`、采样目标 0、采样任务/样本 0。

**回滚**：`DELETE FROM geo_model_profiles WHERE code='deepseek-flash';`（只删这一行，不影响其他配置；删除前建议先确认没有启用中的 target 引用它）。

**A-6(a) 剩余步骤**：见 §7.2。

### 7.2 ✅ 选项 A 已落地：验收用固定问题 + 停用态采样目标（2026-10-01，经用户授权）

**为什么不代你定品牌也要能推进**：`geo_prompts` 是**每个部署方自己在后台填**的行（写入路径 `growth.ts:141 saveGeoPrompt`，门禁 `seo.write`；能建的角色 = `super_admin`/`admin`/`seo_manager`）。产品层面「空表」就是新部署的正确出厂态，全仓 `database/*.sql` **没有一条 `INSERT INTO geo_prompts`**。所以这里建的是**验收数据**（可改可删），不是产品预置。

| 对象 | 值 | id |
| --- | --- | --- |
| 固定问题 | 语言 `zh` / 市场 `CN` / 品牌 **`SUNS`** / 问题 = 后台 UI 自带的示例「适合实验室采购的耐热玻璃容器有哪些选择？」/ 已启用 | `40c1ad3b-3271-4e01-8633-60f1092b0050` |
| 采样目标 | 模型 `deepseek-flash` + 地区 `local` + 周期 1440 分钟 + **`is_enabled=false`** | `61895244-a3ab-4d73-ad49-d9bc5a486f2b` |

选值依据：`SUNS` 是后台表单 `brandName` 的初值（`GeoMonitorDesk.tsx:19`），也与本站出厂 `site_settings.site_name='SUNS Glassware'` 一致；`market` 会以 `marketLabel` 进 user message（`geo-monitoring.ts:92`），中文问题配 `CN` 才诚实。

**⚠️ 目标为什么建成"停用"态（这条不搞清会让你白等一天）**

`scheduleDueGeoTargets` 在**建 job 的同时**就把 `next_run_at` 推后一整个周期，而且**不检查预算是否启用**（`geo-monitoring.ts:72`）。所以若目标建成启用态：分钟级内就会建一条 job、`next_run_at` 被推到 **+1 天**，随后该 job 被 `blocked_budget` 挡掉失败 → 你之后启用预算时**已经不到点了，要等一天**。停用态则不参与调度，等你要跑时再启用（启用会把 `next_run_at` 置为 `now()`）。

**你必须按这个顺序做（都在「GEO 监测中心」页）**

1. **先启用预算**（钱闸门。开之前永远不可能产生费用）；
2. **再启用这条采样目标**。

> ⚠️ **顺序反了怎么办**：会立刻产生一条 `blocked_budget` 失败任务，并把该目标推到 +1 天。补救很简单 —— 把该目标**先停用再启用一次**（`saveGeoTarget` 的重置分支会再把 `next_run_at` 置为 `now()`）。

**跑通的时间与成本**：prod 的 `suns-worker` 里 `dispatchGeo` 每 **30s** 调度、`dispatchGeoSample` 每 **4s** 认领并调模型（`apps/worker/src/index.ts:25,28`）→ **启用目标后 ≤1 分钟出样本**。成本 ≈ **$0.0026/次**（4000 in × $0.30/1e6 + ≤1200 out × $1.20/1e6，峰值上限估；非峰值减半）；周期 1440 分钟 = 最多 1 次/天。

**零成本证据**（prod 上 `.runtime/prod-geo-prompt-target-prep.mjs`，**11/11 PASS**）：预算仍 `is_enabled=false`；`jobs 0→0  samples 0→0  reserved 0→0`；GEO worker 心跳 6s 前。

**回滚**（顺序：先删目标再删问题）：
```sql
DELETE FROM geo_monitor_targets WHERE id='61895244-a3ab-4d73-ad49-d9bc5a486f2b';
DELETE FROM geo_prompts        WHERE id='40c1ad3b-3271-4e01-8633-60f1092b0050';
```
