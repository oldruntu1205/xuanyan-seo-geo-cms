# 买家意向评级（规则版）SPEC V1

> **来源**：L1（Codex）2026-10-02 回签包，落盘人：L2（本工作区），落盘时间 2026-10-02。
> **状态**：已裁定，D1–D7 无开放项。
> **两处落盘适配（不改语义，仅贴合本仓库既有 runner/命名约定）**：
> 1. 回滚文件名按仓库约定为 `database/rollback/029_add_inquiry_intent_scoring.down.sql`（`migrate.mjs` 只认 `<name>.down.sql`；L1 原文写作 `.../029_add_inquiry_intent_scoring.sql`）。
> 2. 迁移文件**不带 `BEGIN;` / `COMMIT;`** —— `infrastructure/scripts/migrate.mjs` 已在外层包了事务并在成功后写 `schema_migrations`；文件内自带的 `COMMIT` 会提前结束外层事务，使 checksum 记录与迁移不同步（001–028 均无 BEGIN/COMMIT，此处与既有迁移一致）。
> 3. §10/§11 的路径是本 SPEC 的**语义契约**；落在本仓库既有的 v2 路由约定上为：<br>
>    · `GET  /api/v1/v2/inquiry-intent?id=<uuid>` ←→ 读取机器分 / 机器等级 / 人工覆盖 / 最终等级<br>
>    · `POST /api/v1/v2/inquiry-intent` `{"id": "<uuid>"}` ←→ `POST /admin/inquiries/:id/intent/recompute`（V1 唯一触发方式）<br>
>    · `PATCH /api/v1/v2/inquiry-intent` `{"id": "<uuid>", "level": "hot" \| null}` ←→ `PATCH /admin/inquiries/:id/intent-override`（`null` = 清除）<br>
>    权限与归属判断全部在 domain 层（`registry` 权限门 + `lead-scope`），路由不做第二套归属判断。

## 1. 目标

针对每条 inquiry，使用本站已有一方数据计算确定性的机器意向分和机器意向等级，并支持后台人工覆盖。

V1：

- 不调用 LLM。
- 不调用外部 enrich / 邮箱反查 / 第三方 API。
- 不进行数据出境。
- 不修改既有 inquiry `status`。
- 不要求生产历史数据参与验收。
- 不建立行为追踪系统。
- 不实现真实 page-view / session revisit。
- 不在询盘创建时自动打分。

---

## 2. 领域模型

稳定的数据库等级值为：

`hot | warm | cold | observe`

后台显示名称：

| DB value | UI |
|---|---|
| hot | 高意向 |
| warm | 中意向 |
| cold | 低意向 |
| observe | 观察 |

未执行过机器评分且没有人工覆盖时：

`effective_level = null`

后台显示：

`未评分`

“未评分”不是第五个 intent level，不得写入数据库等级列。

---

## 3. 机器评分输入契约

评分核心函数不得直接访问数据库。

```ts
export type IntentLevel = 'hot' | 'warm' | 'cold' | 'observe';

export interface InquiryIntentSignals {
  itemCount: number;
  hasQuantityAboveOne: boolean;

  messageLength: number;
  hasPurchaseKeyword: boolean;
  spamDetected: boolean;

  inquiryType:
    | 'contact'
    | 'rfq'
    | 'product'
    | 'sample'
    | 'distributor'
    | null;

  sourceKind:
    | 'product'
    | 'home_or_contact'
    | 'other'
    | 'unknown';

  hasCountry: boolean;

  /**
   * 同 email 的不同下载目标数量。
   * 进入 scorer 前已经去重。
   */
  distinctDownloadTargetCount: number;

  /**
   * 包含当前 inquiry。
   * >= 2 即表示至少存在一次同邮箱历史询盘。
   */
  sameEmailInquiryCount: number;

  hasUtmSource: boolean;
}
```

评分核心：

```ts
scoreInquiryIntent(
  signals: InquiryIntentSignals
): InquiryIntentScore
```

返回：

```ts
export interface InquiryIntentScore {
  score: number;           // integer, 0..100
  level: IntentLevel;
  spamDetected: boolean;
  contributions: {
    items: number;
    quantity: number;
    messageLength: number;
    purchaseKeyword: number;
    inquiryType: number;
    source: number;
    country: number;
    downloads: number;
    revisit: number;
    utm: number;
  };
}
```

`scoreInquiryIntent()`：

- 不读取时间。
- 不调用 `Date.now()`。
- 不使用随机数。
- 不读取环境变量。
- 不访问数据库。
- 不访问网络。
- 不读取 locale / timezone。
- 相同输入必须产生逐字段完全相同的输出。

`intent_scored_at` 不属于 scorer 输出，由应用命令层写入。

---

## 4. 评分规则

### 4.1 明细意图

当：

```text
itemCount = 0
```

得：

```text
0
```

当：

```text
itemCount > 0
```

得：

```text
min(50, 30 + itemCount * 5)
```

示例：

```text
1 item → 35
2 items → 40
4 items → 50
100 items → 50
```

### 4.2 数量

只判断是否存在：

```text
quantity > 1
```

存在：

```text
+10
```

否则：

```text
0
```

数量维度不随 quantity 大小继续增加。

### 4.3 message 长度

以规范化后的 Unicode 字符数量判断：

```text
< 200      → 0
200..499   → +10
>= 500     → +20
```

档位互斥，不叠加。

实现可以在统计到 500 字符后停止继续计数；评分不需要知道超过 500 后的精确长度。

### 4.4 采购关键词

V1 固定关键词：

```text
MOQ
price
quote
quotation
container
order
FOB
CIF
采购
报价
起订量
```

英文：

- ASCII 大小写不敏感。
- 任一关键词命中即 `+15`。
- 多关键词不叠加。

中文按字面子串匹配。

### 4.5 inquiry_type

```text
rfq     → +15
sample  → +15
其他     → 0
```

### 4.6 来源页

```text
product         → +10
home_or_contact → +3
other           → 0
unknown         → 0
```

URL → `sourceKind` 的解析属于信号聚合层。

评分器不得自行访问 `published_documents`。

### 4.7 国家

非空、trim 后仍非空：

```text
+5
```

否则：

```text
0
```

不根据具体国家给予差异化评分。

### 4.8 下载

下载必须使用同 email 关联。

首先按下载目标去重，再计算：

```text
min(15, distinctDownloadTargetCount * 5)
```

即：

```text
0 → 0
1 → 5
2 → 10
>=3 → 15
```

不得用重复刷新同一下载目标无限加分。

### 4.9 复访近似

由于 V1 没有 page-view / session 数据：

```text
sameEmailInquiryCount >= 2 → +15
< 2                        → 0
```

其中 count 包含当前 inquiry。

这只是“复访近似信号”，不得在 UI 或文档中宣称是真实网站 visit count。

### 4.10 UTM

`utm_source` trim 后非空：

```text
+5
```

否则：

```text
0
```

V1 不区分 paid / organic，也不得假定存在 `utm_source` 就一定是付费流量。

---

## 5. 总分与等级

正常询盘：

```text
raw_score = 所有维度贡献值之和
score = min(100, raw_score)
```

等级：

```text
70..100 → hot
40..69  → warm
10..39  → cold
0..9    → observe
```

---

## 6. Spam 硬门

V1 spam detector 是规则检测，不是业务 `status`。

命中以下任一条件：

```text
HTML <a ... href=...>
viagra
casino
payday loan
backlink
guest post
```

英文大小写不敏感。

命中 spam 时，不再考虑其他正向信号：

```json
{
  "score": 0,
  "level": "cold",
  "spamDetected": true
}
```

所有 contribution 返回 0。

此行为不得执行：

```text
UPDATE inquiries SET status = 'spam'
```

是否真正把业务状态改为 spam，未来必须作为另一项独立业务流程设计。

---

## 7. Email 口径

数据库 `email` 为 `citext`。

所有跨表聚合必须采用大小写不敏感语义。

以下邮箱必须被视为同一地址：

```text
Buyer@Example.COM
buyer@example.com
BUYER@example.com
```

应用层如果需要生成比较 key：

```ts
normalizeIntentEmail(email)
```

最低契约：

```text
trim
+
ASCII case-insensitive normalization
```

但数据库查询应优先依赖 PostgreSQL `citext` 本身，而不是重新发明不同的 email equality。

---

## 8. 人工覆盖

机器字段：

```text
intent_score
intent_level
intent_scored_at
```

人工字段：

```text
intent_override_level
intent_override_by
intent_override_at
```

有效等级：

```ts
effectiveLevel =
  intentOverrideLevel ??
  intentLevel ??
  null;
```

重算机器分时，只允许修改：

```text
intent_score
intent_level
intent_scored_at
```

严禁修改：

```text
intent_override_level
intent_override_by
intent_override_at
```

人工清除覆盖时，三个 override 字段同时设为 NULL。

人工设置覆盖时：

- level 非空；
- by = 当前操作者；
- at = 服务端时间。

人工覆盖只覆盖等级，不覆盖 `intent_score`。

因此后台可以同时显示：

```text
机器分：82
机器等级：hot
人工等级：warm
最终等级：warm
```

---

## 9. 与 inquiries.status 的关系

`status` 表示询盘业务处理状态：

```text
new
processing
qualified
replied
closed
spam
```

intent 表示机器推断采购意愿强度。

两者语义不同。

任何评分、重算、人工 intent override 操作：

```text
不得修改 inquiries.status
```

---

## 10. 重算触发

V1 只提供人工触发：

```text
POST /admin/inquiries/:id/intent/recompute
```

禁止：

- INSERT trigger 自动算分；
- inquiry create API 内同步算分；
- 定时任务；
- queue consumer；
- cron；
- 页面访问实时算分。

这样避免将首版功能插入已验收 leads 写路径。

---

## 11. 人工覆盖接口

```text
PATCH /admin/inquiries/:id/intent-override
```

设置：

```json
{
  "level": "hot"
}
```

允许：

```text
hot
warm
cold
observe
null
```

`null` 表示清除人工覆盖。

客户端不得提交：

```text
override_by
override_at
```

二者由服务器确定。

---

## 12. 权限

读取、机器重算、人工覆盖都必须复用：

```text
packages/domain/src/lead-scope.ts
```

不得重新实现一套 inquiry ownership 条件。

任何用户只能对其 lead scope 内的 inquiry 执行上述操作。

尤其 client 用户不得通过已知 inquiry UUID 越权：

- 查看机器分；
- 触发重算；
- 写人工覆盖。

---

## 13. 数据库契约

新增字段：

```text
intent_score          integer nullable
intent_level          text nullable
intent_scored_at      timestamptz nullable

intent_override_level text nullable
intent_override_by    uuid nullable
intent_override_at    timestamptz nullable
```

机器评分三字段必须满足：

```text
要么三个均 NULL
要么三个均非 NULL
```

机器分：

```text
0 <= intent_score <= 100
```

machine level / override level：

```text
hot
warm
cold
observe
```

override 三字段同样：

```text
要么三个均 NULL
要么三个均非 NULL
```

`intent_override_by` 引用 `users(id)`。

---

## 14. 迁移纪律

001–028 属于已应用迁移，不允许修改。

新增：

```text
database/029_add_inquiry_intent_scoring.sql
database/rollback/029_add_inquiry_intent_scoring.down.sql
```

migration 必须支持：

```text
现有 schema
→ 029 up
→ verify
→ 029 rollback
→ 029 再应用
```

---

## 15. 验收门

### 单元测试

```bash
pnpm test
```

必须：

- 不连接 PostgreSQL；
- 不访问网络；
- 不访问 prod；
- score tests 全绿。

### 数据库链路

```bash
node infrastructure/scripts/verify.mjs --local-runtime
```

验证：

- 029 应用成功；
- 六列存在；
- score CHECK 正确；
- level CHECK 正确；
- override consistency 正确；
- rollback 后六列消失；
- 重迁移成功。

### 类型检查

```bash
pnpm -r typecheck
```

要求：

```text
6/6 exit 0
```

### UI

后台至少显示：

```text
机器分
机器等级
人工覆盖
最终等级
```

并可：

```text
手动重算
设置人工等级
清除人工等级
```

---

## 16. Prod 数据验收

本功能 V1 不设置：

“对 prod 历史 inquiries 跑分级分布”

这一验收门。

原因是当前 prod 没有历史 inquiry 数据。

必须使用固定夹具覆盖：

```text
observe
cold
warm
hot
spam
人工覆盖
```

并把固定夹具输出记录进验收报告。

后续生产产生真实询盘后，可另做离线分布分析，但不得反向改变本 SPEC 的既有输入输出契约。

---

## 附：L1 对 D1–D7 的正式裁定

| 决策 | L1 裁定 | 结论 |
|---|---|---|
| **D1 落库** | **只扩 `inquiries`，V1 不建历史评分表** | 最小闭环；机器分、机器等级、评分时间 + 人工覆盖三件套 |
| **D2 权重** | 采用 §5 草案，但补齐精确定义 | 单维封顶 + **最终总分封顶 100** |
| **D3 status** | **绝不写回 `status`** | `status` 与意向等级为两个独立业务维度 |
| **D4 人工覆盖** | **机器重算不得触碰人工覆盖字段** | `effective_level = override ?? machine` |
| **D5 空值 / spam** | 全空 `0 → observe`；spam 硬门 `0 → cold` | spam **不自动写 `status='spam'`** |
| **D6 触发** | V1 **仅后台手动重算** | 不加 INSERT trigger、不加异步任务、不在询盘创建链路同步打分 |
| **D7 权限** | **必须复用 `lead-scope`** | client 只能评分、读取、覆盖自己可见的询盘 |

## 附：固定验收夹具（6 + 1）

| Fixture | 关键输入 | 期望 |
|---|---|---:|
| `intent-empty` | 全空 | `0 / observe` |
| `intent-cold` | country + utm | `10 / cold` |
| `intent-warm` | 1 item + country | `40 / warm` |
| `intent-hot` | 1 item + qty>1 + rfq + keyword | `75 / hot` |
| `intent-cap` | 全高信号 | `100 / hot` |
| `intent-spam` | 全高信号 + `<a href>` | `0 / cold` |
| 人工覆盖 | 机器 75/hot → 人工 warm → 重算为 35/cold | `effective` 仍 `warm` |

## 附：本批明确不做

评分历史表、自动打分 trigger、队列重算、真实 page-view 复访、外部 enrich、LLM、自动修改 `status='spam'`。
