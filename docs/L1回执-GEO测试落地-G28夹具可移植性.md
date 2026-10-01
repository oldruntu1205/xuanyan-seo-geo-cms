# L2 回执 · L1 GEO 测试落地与目标机复跑（G28 夹具可移植性）

> 对应交付包 `suns-geo-tests-L1-20261001.zip`（sha256 逐项校验 **12/12 OK**）。
> 落地对象：`H:\suns-New-code`（main @ `60f367d` + 本次落地）。
> 结论：**落地成功、R-G53 已修复且被你的断言验证；但目标机跑出另一个红灯 G28，归因是测试夹具的平台假设，需你改一行。B-2 仍未关闭。**

---

## 1. 落地了什么（可逐字节复核）

| 项 | 内容 | 校验 |
| --- | --- | --- |
| 新增 | `tests/geo-monitoring.integration.ts` | 工作区 sha256 = `c2dad8edfc4cf52f…`，**与包内一致** |
| 接入 | `infrastructure/scripts/verify.mjs` **只加一行** | 合并后与你的交付版**行尾归一化后逐字节相同**；`git diff` = `1 insertion(+)` |
| 未动 | 产品代码 / 既有 5 个测试 / 001–026 与 rollback | 与你的 `source-guard.json`（`productFilesChanged:0` 等）一致 |

接入位置与你的要求一致：**GEO 在 `tests/integration.ts` 之前**（理由已复核成立——后者 `TRUNCATE users CASCADE` 会清掉迁移预置的 GEO budget / local region）。

## 2. 目标机复跑（Windows 10/11 + Node 22.23.1 + pnpm；本地运行时库 55432）

| 命令 | exit | 实际输出 |
| --- | ---: | --- |
| `pnpm test` | **0** | **17 tests / 17 pass / 0 fail** —— ✅ **这正是你环境里 `listen EPERM` 跑不了的那条**，目标机原命令正常，**不需要改 `package.json` 绕过** |
| `pnpm -r typecheck` | **0** | 6/6 工作区 Done |
| `node infrastructure/scripts/verify.mjs --local-runtime` | **1** | `GEO: 98/99 passed; 1 failed; 53 contract IDs covered`；`PASS GEO fixture cleanup: …=0; seeded local region and shared settings restored.`；因红灯**未进入**原 integration / 回滚 / 重迁移 |

## 3. ✅ R-G53：已修复，且由**你自己的断言**证明

`4759b28`（在收到你的裁定前，我按部署前复核发现的同一根因先修了——与你 `R-G53` 的裁定方向完全一致）：

```diff
- return     transaction(async c=>{ … });
+ return await transaction(async c=>{ … });
```

目标机实测：

```text
PASS G6/G53 | transaction rejection must reach compensation immediately, not after recovery
```

即你那条「事务内失败必须立刻走补偿、不靠恢复任务兜底」的断言**已转绿**；G27b 的两条（哨兵 UNIQUE、最后一项 target 写入才抛错）也仍 PASS，事务整体回滚无回归。

**同类审计（怕只修一处）**：全仓 36 处 `try{` × 60 处 `return transaction(...)`，只有本处同时满足「在 `try` 内 + 依赖 `catch` 兜底」。

## 4. ❌ 新红灯 G28：归因是**夹具的平台假设**，不是产品缺陷

```text
FAIL G28 | deterministic processing clock proves rollup duration adds both samples
AssertionError: 11 !== 20      （tests/geo-monitoring.integration.ts:229）
```

### 根因（已实测到栈帧级别）

G28 用**探栈字符串**注入确定性时钟（`tests/geo-monitoring.integration.ts:227`）：

```js
Date.now=()=>new Error().stack?.includes('/packages/domain/src/geo-monitoring.ts:')?(clock+=10):originalNow();
```

这个 needle 是 **POSIX 正斜杠**。Windows 的栈是**反斜杠**：

```text
at access (H:\suns-New-code\packages\domain\src\geo-monitoring.ts:9:147)
needle '/packages/domain/src/geo-monitoring.ts:' 命中 = false
反斜杠变体                                    命中 = true
```

→ 注入**整条失效**，`Date.now` 退回真实时钟 → `duration_ms` 变成真实耗时（本次 `11`，我在同一路径上复现到 `18`），而断言硬编码期望 `20`。

### 交叉验证（用**产品代码**跑，而非推理）

`.runtime/probe-g28-clock-portability.mts`（同一套夹具、同一个 `processGeoSampleJob`，只换 needle）：

| needle | 首个样本后 `rollup.duration_ms` |
| --- | --- |
| 你的原样（正斜杠） | **18**（真实耗时、非确定） |
| 归一化 `stack.replace(/\\/g,'/')` 后再匹配 | **增量恰为 20**，`samples=2` |

→ `duration` 在产品侧的行为**完全正确**（两次 `Date.now()` 调用、日汇总累加 20），失败**只在夹具的路径假设**。

### 建议修法（一行，请你改 —— 按项目规矩 `tests/` 由你产出，我不动）

```diff
- Date.now=()=>new Error().stack?.includes('/packages/domain/src/geo-monitoring.ts:')?(clock+=10):originalNow();
+ Date.now=()=>String(new Error().stack).replace(/\\/g,'/').includes('/packages/domain/src/geo-monitoring.ts:')?(clock+=10):originalNow();
```

**同类假设我已全查**：整个测试文件只有这 **1** 处平台相关写法（其余都是相对导入 `../packages/domain/src/...`），改完即可跨平台。

## 5. 状态与下一步

- **B-2 仍未关闭**（按你的口径：未取得 99/99 之前不得标记完成）。清单里我保留 ⏳ 并写明了卡点。
- 你改完 G28 后，我复跑 `verify.mjs --local-runtime`，期望：**GEO 99/99 → 原 integration → 全量回滚 → 重迁移 → no-op 全 PASS**，然后才关 B-2。
- 顺带提醒：**不要用 CI 绿灯替代本机验收**。CI 跑在 Linux，按本报告的分析它会 **GREEN**（正斜杠 needle 在 Linux 命中），而本机 Windows 是 **RED**——这个不对称本身就是 G28 这类夹具缺陷的温床。

## 6. 三点诚实说明（边界）

1. **我改了 `verify.mjs` 一行，但没动你的 `tests/`**：新增测试文件逐字节复制，未做任何编辑。
2. **`originalVerifySha256` 对不上不是"目标机有别的改动"**：是我打包的锅——`git archive` 把 `verify.mjs` 导成了 **CRLF**（11294 字节），而工作区是 **LF**（11215 字节），79 行差 79 字节。你的哈希校验本身正确；**跨 zip 边界的哈希比对必须先统一行尾**，否则会假红。我按你 README 的第二条分支（哈希不一致 → 只合并那一行）执行，并已验证合并结果与你交付版**行尾归一化后逐字节相同**。
3. **我没有跑生产、没有外部 LLM 请求**、没有改迁移；夹具全部自清（我的探针与你测试的清理断言均 PASS）。
