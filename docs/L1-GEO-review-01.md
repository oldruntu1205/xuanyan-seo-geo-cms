# L1 GEO 审签 01 · 测试交付与 G53 裁定

基于 2026-10-01 源码包（交付说明标记 main @ 48ac1cc）；本轮只新增测试和一行 verify 接入。结果：**99 个具体用例，98 PASS / 1 FAIL；B-2 自动化验收仍未关闭。**

## 1. 裁定

**R-G53：必须修。** `processGeoSampleJob` 的成功事务 rejection 必须进入已有补偿 catch。成功事务失败后，成功数据整体回滚；补偿事务释放日/月预留，把仍为 processing 的 job 标为 failed，填写 finished_at/error_message 和 target.last_error；spent/sample_count 不增加。原错误仍向调用方抛出。已完成/已失败 job 不再释放或改状态。

根因与方向：`geo-monitoring.ts:101` 在 try 内直接 return 事务 Promise，没有等待其 rejection。L2 应让当前函数等待成功事务（保留锁、条件检查与补偿的全部现有语义）。本轮没有修改产品代码，没有把错误现状写成期望，也没有 skip、todo 或 expected-failure 消化这条红灯。

**实跑证据：** 第 58 个用例注入真实 `geo_samples_monitor_job_id_key` 唯一约束冲突：

| 字段 | 期望 | 当前实际 |
|---|---|---|
| job.status | failed | processing |
| job.finished_at | 有值 | 空 |
| job.error_message | 有值 | 空 |
| target.last_error | 有值 | 空 |
| day.reserved_usd | 0.00000000 | 0.00800250 |
| month.reserved_usd | 0.00000000 | 0.00800250 |
| 两个窗口 spent/sample_count | 0 / 0 | 0 / 0 |

G27b 的哨兵冲突测试与**最后一项 target 写入才抛错**的触发器测试均通过。后者在 sample、rollup、release、job 完成均已执行后抛错，证明这几项确实一起回滚；不是只检查在第一项 INSERT 之前没有写入。测试触发器在 finally 删除，不修改任何 migration。

## 2. 验证记录（命令与实际结果）

环境：Linux，Node 24.19.0，pnpm 10.17.1，真实 PostgreSQL 16.15。目标项目口径是 Node 22/Windows，不能将本次结果冒充目标机复跑。依赖按上传锁安装；默认 pnpm 11 工具曾自动改 workspace 配置，安装后已恢复原字节并改用 pnpm 10。Payload 类型生成与验证记录也恢复到上传快照，未混入交付。

| 命令 | exit | 实际输出 / 结论 |
|---|---:|---|
| pnpm test | 1 | tsx CLI 本地 Unix 管道 `listen EPERM`，尚未进入测试；工作区 TMPDIR 也不能解除环境限制 |
| node --import tsx --test tests/*.test.ts | 0 | tests 17 / pass 17 / fail 0 / skipped 0 / todo 0；免库测试正常 |
| pnpm -r typecheck（pnpm 10.17.1） | 0 | 6/6 工作区 Done |
| node node_modules/typescript/bin/tsc --noEmit --strict --target es2022 --module esnext --moduleResolution bundler --esModuleInterop --skipLibCheck tests/geo-monitoring.integration.ts | 0 | 无诊断；单独覆盖不在 workspace include 中的新增测试 |
| node --check infrastructure/scripts/verify.mjs | 0 | 无诊断 |
| node infrastructure/scripts/verify-baseline.local.mjs --local-runtime | 0 | 上传原 verify 逐字节副本：Payload bootstrap → forward → integration → full rollback → reapply → no-op 全 PASS |
| node infrastructure/scripts/verify.mjs --local-runtime | 1 | GEO: 98/99 passed; 1 failed；53 contract IDs covered；唯一失败场景 G53/G6(b) |

`verify-baseline.local.mjs` 是取证时放在同目录的原上传 verify 副本，不是新增交付/产品文件。新 verify 在 GEO 失败后**没有进入**原 integration、回滚、重迁移；原链 exit 0 不能算新链已验收。

数据库仅监听本机，运行时连接只指向验证集群，verify 自建并删除 suns_verify_<hex> 临时库。当前执行器每条命令的网络 namespace 独立，启动数据库和 verify 在同一条本地 shell 中进行。执行器仅映射 UID 0，为启动 PostgreSQL 使用测试专用 UID/文件属主适配（LD_PRELOAD）；**没有替换数据库查询、SQL 事务或锁**。正式环境复跑使用正常 Postgres 即可，这个运行时适配不在交付包中。

## 3. 接入、隔离和清理

GEO 调用放在原 `tests/integration.ts` **之前**：它的 `TRUNCATE users CASCADE` 会删除 GEO 默认 budget/local region，不能把调用放在其后再假装只是测试问题。接入仍只有一行，原测试零改动。

每个用例有独立 UUID actor/email/prompt/model/region/target。用例顺序执行；账本与环境变量的共享性不允许盲目并行。先删 samples，再删 targets（jobs/rollups cascade），再删 prompt/model/region（heartbeats cascade）、audit 与 actor。预算、账本窗口、站点 LLM 设置按用例前基线恢复；异常用例同样 finally 清理。全部既有源码、既有 tests、001–026 与 rollback 均逐字节比对一致。

最终输出：

```text
GEO: 98/99 passed; 1 failed; 53 contract IDs covered (G1–G51, G27b, G53; no G52 was defined).
PASS GEO fixture cleanup: samples/jobs/targets/rollups/models/prompts/heartbeats=0; seeded local region and shared settings restored.
```

假服务绑定 `127.0.0.1` 随机端口，返回 GEO JSON；统一 fetch 守卫拒绝所有非假服务 origin，并禁止重定向。只使用 test-only 凭据，不读用户 .env。缺密钥、worker identity 与确定性 Date.now 注入都用 finally 恢复。

G36 的拒绝夹具显式设置 `permissions: []`，只读夹具设置 `['seo.read']`。这对应真实 actorFor 从角色权限表填充 permissions 的路径；仅改 role 且不传 permissions 会进入 registry 的另一套默认读规则，不能将两个契约混用。

HTTP 参数断言调用**真实 v2Api dispatcher 与其原 zod schema**，不复制 schema。没有启动 CMS 登录会话，也没有覆盖 auth/origin 中间件和浏览器 UI；DomainError 与 zod 拒绝分层断言，不伪造 HTTP 外层错误映射。

## 4. 每条 G 编号的对应表

用例序号对应下一节和 `evidence/coverage.json`。G6(a) 通过，G6(b) 与 G53 共用一条失败回归。

| G 编号 | 可执行断言 | 用例序号 | 实跑 |
|---|---|---|---|
| G1 | 预估费用公式、8 位舍入、job 费率快照及日/月预留 | 1 | PASS |
| G2 | 预算未启用：blocked_budget、精确错误、完成时间、零样本/零预留 | 2 | PASS |
| G3 | 日/月独立超额 1e-8 拦截；恰好等于预算放行；原账本不被改变 | 3, 4, 5, 6 | PASS |
| G4 | 预留只增 reserved；实际成功费用、计数和原预留基线守恒 | 7 | PASS |
| G5 | 成功释放时 reserved=0 仍保持 0 | 8 | PASS |
| G6 | 事务前失败补偿；事务内失败补偿另由 G53 严格断言 | 9, 58 | 事务前 PASS / 事务内 FAIL |
| G7 | 双 Worker 独立连接认领唯一；独立事务锁住 job 时 SKIP LOCKED | 10, 11 | PASS |
| G8 | 错区/停用地区不认领，pending 保留 | 12 | PASS |
| G9 | claim 后涨价不影响实际采样计价，原费率入样本 | 7 | PASS |
| G10 | pending/processing/近期 completed/failed 节流；超过五分钟可提交 | 13, 14, 15, 16, 17, 18 | PASS |
| G11 | 未启用/不存在目标的 404 精确文案 | 19 | PASS |
| G12 | 全局队列 pending 与 processing 分别占满时返回 429 | 20, 21 | PASS |
| G13 | in-flight 不重复创建；next_run_at 精确等于事务 now+interval | 22, 23 | PASS |
| G14 | 满队列准确延后 15 分钟并记录错误 | 24 | PASS |
| G15 | 四表 enabled、独立目标锁 SKIP LOCKED、101 个目标只处理 100 | 25, 26, 27, 28, 29, 30 | PASS |
| G16 | 长期过期只建一个任务，next_run_at 从当前事务 now 推进 | 31 | PASS |
| G17 | 成功 job 重放 409；第二样本、账本、rollup、目标和 job 都不变 | 32 | PASS |
| G18 | length 截断失败并释放账本 | 33 | PASS |
| G19 | 非 JSON 失败并释放账本 | 34 | PASS |
| G20 | 答案非字符串/空/空白/超过 20000 字符分别失败 | 35, 36, 37, 38 | PASS |
| G21 | 引用只保留 HTTPS 字符串，顺序保持、最多 20 条 | 39 | PASS |
| G22 | provider usage 精确入库；缺失 usage 根据实际请求消息与响应内容长度估算 | 40, 41 | PASS |
| G23 | 大小写都命中；未出现品牌不命中 | 40, 41, 42 | PASS |
| G24 | 八字段 SHA256 独立 oracle；逐字段修改记录 hash；endpoint/profile/region 都覆盖 | 43, 44, 45, 46, 47, 48, 49, 50, 51 | PASS |
| G25 | 改 endpoint 后仅新 hash 进入趋势，计数/提及率/引用率/费用过滤 | 52 | PASS |
| G26 | 无样本：两个率为 null，成本/计数为零，daily 为空 | 53 | PASS |
| G27 | 成功五项写入；同日同 hash 两次采样累加一行，旧 last_error 清空 | 54 | PASS |
| G27b | 哨兵 UNIQUE 和最后 target 写入的两种真实 DB 失败：成功事务全部回滚 | 56, 57 | PASS |
| G28 | duration 累加用确定性时钟证明；round(duration/samples) 独立验证 | 54, 55 | PASS |
| G29 | 真实假上游 HTTP 400 报错 URL 脱敏；长快照异常准确截断 500 字符 | 59, 60 | PASS |
| G30 | 密钥四段 AES-GCM 密文入库，视图不返回密文，has_credential=true | 61 | PASS |
| G31 | version/IV/tag/body 四段逐一篡改，503、零上游请求及失败补偿 | 62, 63, 64, 65 | PASS |
| G32 | 缺失与 31 字符 secret 分别拒绝，503 精确文案，env finally 恢复 | 66, 67 | PASS |
| G33 | 单一 runtime_settings 端点不一致拒绝；一致的 site_default 能真实调用假服务 | 68 | PASS |
| G34 | 新增缺密钥拒绝；更新不传/空/空白密钥均保留原密文 | 61 | PASS |
| G35 | client/translator/seo_manager 对模型/地区/预算全部拒绝 | 69, 70, 71 | PASS |
| G36 | 显式无 SEO 权限的 client/translator 四入口拒绝；只有 seo.read 可读不可写 | 72, 73, 74 | PASS |
| G37 | 地区 code 不可改，原路由保持 | 75 | PASS |
| G38 | 真实 v2 dispatcher 大写/空白归一化；zod 长度与领域字符拒绝分层 | 76, 77, 78, 79 | PASS |
| G39 | country lowercase→CN；HTTP 长度与领域 format 分层；optional 字段 null 拒绝 | 80 | PASS |
| G40 | prompt/model/region 各自停用都拒绝启用 target | 81, 82, 83 | PASS |
| G41 | 三组合键逐项替换拒绝，重复组合 DB UNIQUE 拒绝 | 84 | PASS |
| G42 | 重新启用/改 interval 两条路径：next_run_at=事务 now，清 last_error | 85, 86 | PASS |
| G43 | monthly<daily 拒绝；相等通过 | 87 | PASS |
| G44 | 单价上下界/非有限值；真实 HTTP 参数门；DB CHECK 及参数端点通过 | 88, 89, 90, 91, 92, 93 | PASS |
| G45 | interval 60–10080 HTTP/DB 边界及整数校验 | 94 | PASS |
| G46 | 7/30/90 枚举、非法 days 和不存在 prompt 精确错误 | 95 | PASS |
| G47 | 默认 local、hostname-pid、空白替换、120 字符截断；env finally 恢复 | 96 | PASS |
| G48 | 不存在/停用地区心跳拒绝 | 97 | PASS |
| G49 | heartbeat upsert 不增行，last_seen 前进，started_at 不重置 | 98 | PASS |
| G50 | 三分钟前心跳不显示，刷新后显示 | 98 | PASS |
| G51 | 过期 processing 失败且释放预留；新 processing 不动；恢复幂等 | 99 | PASS |
| G53 | 成功事务 rejection 立即触发补偿，job failed + 预留释放 + 错误记录 | 58 | FAIL |

## 5. 99 个具体用例与实际状态

| # | G 编号 | 用例 | 实跑 |
|---:|---|---|---|
| 1 | G1 | reservation rounds to eight decimal places and stores rate snapshots | PASS |
| 2 | G2 | disabled budget blocks without samples or reservation | PASS |
| 3 | G3 | day overspend blocks by one hundred-millionth of a dollar | PASS |
| 4 | G3 | month overspend blocks by one hundred-millionth of a dollar | PASS |
| 5 | G3 | day exact budget equality is admitted | PASS |
| 6 | G3 | month exact budget equality is admitted | PASS |
| 7 | G4/G9 | reserve preserves spent/count; success releases once using original rates | PASS |
| 8 | G5 | release clamps a zero reservation on successful processing | PASS |
| 9 | G6 | pre-transaction provider error releases both windows without charging | PASS |
| 10 | G7 | two independent claims return one processing job and one null | PASS |
| 11 | G7 | locked earliest job is skipped instead of waiting or claiming it | PASS |
| 12 | G8 | foreign region and disabled region cannot claim | PASS |
| 13 | G10 | manual throttle rejects recent pending | PASS |
| 14 | G10 | manual throttle rejects recent processing | PASS |
| 15 | G10 | manual throttle rejects recent completed | PASS |
| 16 | G10 | manual throttle rejects recent failed | PASS |
| 17 | G10 | manual throttle permits completed older than five minutes | PASS |
| 18 | G10 | manual throttle permits failed older than five minutes | PASS |
| 19 | G11 | manual queue rejects missing and disabled targets | PASS |
| 20 | G12 | global queue counts pending at capacity | PASS |
| 21 | G12 | global queue counts processing at capacity | PASS |
| 22 | G13 | scheduler advances in-flight pending target without duplication | PASS |
| 23 | G13 | scheduler advances in-flight processing target without duplication | PASS |
| 24 | G14 | full queue defers scheduling exactly fifteen minutes | PASS |
| 25 | G15 | scheduler requires enabled geo_prompts | PASS |
| 26 | G15 | scheduler requires enabled geo_model_profiles | PASS |
| 27 | G15 | scheduler requires enabled geo_regions | PASS |
| 28 | G15 | scheduler requires enabled geo_monitor_targets | PASS |
| 29 | G15 | scheduler skips a target held by a different transaction | PASS |
| 30 | G15 | scheduler stops after one hundred due targets | PASS |
| 31 | G16 | long outage schedules one job and advances from transaction now | PASS |
| 32 | G17 | completed job replay returns 409 and leaves all accounting untouched | PASS |
| 33 | G18 | length finish reason fails and releases reservation | PASS |
| 34 | G19 | non-JSON content fails and releases reservation | PASS |
| 35 | G20 | invalid answer number:2 fails | PASS |
| 36 | G20 | invalid answer string:0 fails | PASS |
| 37 | G20 | invalid answer string:3 fails | PASS |
| 38 | G20 | invalid answer string:20001 fails | PASS |
| 39 | G21 | citations discard non-HTTPS and non-strings and cap at twenty | PASS |
| 40 | G22/G23 | provider usage and uppercase brand are recorded exactly | PASS |
| 41 | G22/G23 | absent usage estimates from actual request and content lengths | PASS |
| 42 | G23 | absent brand is not mentioned | PASS |
| 43 | G24 | configuration hash matches independent eight-field SHA256 oracle | PASS |
| 44 | G24 | changing only prompt changes the recorded hash | PASS |
| 45 | G24 | changing only market changes the recorded hash | PASS |
| 46 | G24 | changing only brand_name changes the recorded hash | PASS |
| 47 | G24 | changing only locale_code changes the recorded hash | PASS |
| 48 | G24 | changing only model changes the recorded hash | PASS |
| 49 | G24 | changing only endpoint changes the recorded hash | PASS |
| 50 | G24 | changing only profile_id changes the recorded hash | PASS |
| 51 | G24 | changing only region_id changes the recorded hash | PASS |
| 52 | G25 | trend excludes old endpoint hash including mentions, links and cost | PASS |
| 53 | G26 | no samples produces null rates, zero samples and zero cost | PASS |
| 54 | G27/G28 | two successes accumulate one daily rollup and complete all five writes | PASS |
| 55 | G28 | deterministic processing clock proves rollup duration adds both samples | PASS |
| 56 | G27b | duplicate sentinel survives rollback; no success data or expense is committed | PASS |
| 57 | G27b | late target-write failure rolls back earlier sample, rollup, expense and completion | PASS |
| 58 | G6/G53 | transaction rejection must reach compensation immediately, not after recovery | FAIL |
| 59 | G29 | upstream errors redact URLs and are bounded | PASS |
| 60 | G29 | long pre-transaction error is truncated to exactly five hundred characters | PASS |
| 61 | G30/G34 | profile key is sealed, omitted from views, and retained by blank updates | PASS |
| 62 | G31 | cipher segment 0 tampering fails authenticated decryption | PASS |
| 63 | G31 | cipher segment 1 tampering fails authenticated decryption | PASS |
| 64 | G31 | cipher segment 2 tampering fails authenticated decryption | PASS |
| 65 | G31 | cipher segment 3 tampering fails authenticated decryption | PASS |
| 66 | G32 | missing/short GEO secret (0) rejects profile save | PASS |
| 67 | G32 | missing/short GEO secret (31) rejects profile save | PASS |
| 68 | G33 | site-default endpoint must match the one runtime settings source | PASS |
| 69 | G35 | client cannot configure model, region or budget | PASS |
| 70 | G35 | translator cannot configure model, region or budget | PASS |
| 71 | G35 | seo_manager cannot configure model, region or budget | PASS |
| 72 | G36 | client without explicit SEO permissions cannot read or write | PASS |
| 73 | G36 | translator without explicit SEO permissions cannot read or write | PASS |
| 74 | G36 | read-only SEO permission permits workspace/trend and denies writes | PASS |
| 75 | G37 | region routing code is immutable after creation | PASS |
| 76 | G38 | HTTP code " CN " normalizes to cn | PASS |
| 77 | G38 | HTTP code "A-B_9" normalizes to a-b_9 | PASS |
| 78 | G38 | HTTP code " CN-T " normalizes to cn-t | PASS |
| 79 | G38 | HTTP length gate and domain character gate remain distinct | PASS |
| 80 | G39 | country normalizes lowercase; HTTP length and domain format reject independently | PASS |
| 81 | G40 | disabled geo_prompts prevents enabling target | PASS |
| 82 | G40 | disabled geo_model_profiles prevents enabling target | PASS |
| 83 | G40 | disabled geo_regions prevents enabling target | PASS |
| 84 | G41 | existing target cannot exchange any of its three foreign keys | PASS |
| 85 | G42 | reenable sets immediate next_run_at and clears last_error | PASS |
| 86 | G42 | interval sets immediate next_run_at and clears last_error | PASS |
| 87 | G43 | monthly below daily fails; equality passes | PASS |
| 88 | G44 | rate bounds reject before SQL; zero and maximum are accepted | PASS |
| 89 | G44 | HTTP validates maxOutputTokens bounds | PASS |
| 90 | G44 | HTTP validates displayName bounds | PASS |
| 91 | G44 | HTTP validates provider bounds | PASS |
| 92 | G44 | HTTP model parameter endpoints are inclusive | PASS |
| 93 | G44 | database second gate rejects bad display/provider/token and negative rate | PASS |
| 94 | G45 | interval HTTP and DB gates reject outside inclusive 60–10080 | PASS |
| 95 | G46 | trend day enumeration and missing prompt are precise | PASS |
| 96 | G47 | worker defaults, whitespace normalization and length cap | PASS |
| 97 | G48 | heartbeat rejects missing and disabled region | PASS |
| 98 | G49/G50 | heartbeat upsert refreshes once and workspace excludes stale workers | PASS |
| 99 | G51 | stale processing recovers once; fresh processing retains its reservation | PASS |

## 6. L2 回签要求及剩余边界

L2 只做 G53 最小产品修复，不修改 tests/、不放宽断言、不改迁移。回贴 `pnpm test`、`pnpm -r typecheck` 与接入 GEO 后的完整 verify 实际输出，须 17/17 + 99/99 + 后续全链 PASS。夹具清理仍须为零。取得这组结果后再关闭 B-2 自动化缺口；原 A-6 真外部请求/A-7 多地区部署不在本包验收范围。

测试只证明本项目账本契约。**释放 reserved 或失败时 spent=0，不证明供应商没有收费**：模型成功返回后 DB 事务可能失败；有真实模型时仍须核对供应商账单。G17 目前只保护数据库重放幂等，现实现先调用模型再检查 job 状态；本包没有声称证明供应商调用或扣费幂等，也没有擅自扩展这轮产品契约。

回滚本轮仅删新增测试并移除 verify 的一行；不执行 database down，不碰生产。
