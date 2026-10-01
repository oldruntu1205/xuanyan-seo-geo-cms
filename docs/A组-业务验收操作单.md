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
