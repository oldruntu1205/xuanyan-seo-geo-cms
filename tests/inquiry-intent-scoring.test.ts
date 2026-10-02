// 意向评级 L1 测试契约（2026-10-02 回签）—— 纯函数、**不连数据库**，必须继续满足 `pnpm test` 的免库契约。
//
// 落盘适配（只改 runner 与调用形式，**断言语义一个字没改**）：
//   ① Vitest → 本仓库的 `node:test` + `node:assert/strict`（`pnpm test` = `tsx --test tests/*.test.ts`）；
//   ② `it.each([...])` → 逐个生成 `test()`（同样的用例名与期望值）；
//   ③ `expect(x).toMatchObject({...})` → `matchObject(x,{...})`：对给定键逐个 deepStrictEqual，语义等价；
//   ④ 边界值用例原本在测试里**重新实现**了一遍 scoreToIntentLevel（L1 原文注明「L2 实现时应同时导出
//      scoreToIntentLevel(score)，此断言直接调用该纯函数」）→ 这里改为直接调用被测实现；
//   ⑤ 仓储接口是异步的 → service 断言里 `repo.get()` 加 `await`（L1 原文为同步调用）。
import {test} from 'node:test';import assert from 'node:assert/strict';
import {
  buildInquiryIntentSignals,
  recomputeInquiryIntent,
  resolveEffectiveIntentLevel,
  scoreInquiryIntent,
  scoreToIntentLevel,
  normalizeIntentEmail,
  type InquiryIntentRawInput,
  type InquiryIntentRepository,
  type InquiryIntentRow,
  type InquiryIntentSignals
} from '../packages/domain/src/inquiry-intent';

const EMPTY:InquiryIntentSignals={
  itemCount:0,
  hasQuantityAboveOne:false,
  messageLength:0,
  hasPurchaseKeyword:false,
  spamDetected:false,
  inquiryType:null,
  sourceKind:'unknown',
  hasCountry:false,
  distinctDownloadTargetCount:0,
  sameEmailInquiryCount:1,
  hasUtmSource:false
};

/** `toEqual` 的全量相等，以及 `toMatchObject` 的子集相等。 */
const equal=(actual:unknown,expected:unknown,label:string)=>{assert.deepStrictEqual(actual,expected,label);};
const matchObject=(actual:Record<string,unknown>,expected:Record<string,unknown>,label:string)=>{for(const key of Object.keys(expected))assert.deepStrictEqual(actual[key],expected[key],`${label} · 字段 ${key}`);};
const raw=(overrides:Partial<InquiryIntentRawInput>):InquiryIntentRawInput=>({message:'',inquiryType:null,sourceKind:'unknown',country:null,utmSource:null,itemQuantities:[],distinctDownloadTargetCount:0,sameEmailInquiryCount:1,...overrides});

test('相同输入必须产生逐字段完全相同的输出（确定性）',()=>{
  const input:InquiryIntentSignals={...EMPTY,itemCount:2,hasQuantityAboveOne:true,messageLength:500,hasPurchaseKeyword:true,inquiryType:'rfq',sourceKind:'product',hasCountry:true,distinctDownloadTargetCount:3,sameEmailInquiryCount:2,hasUtmSource:true};
  const first=scoreInquiryIntent(input);
  for(let i=0;i<100;i+=1)equal(scoreInquiryIntent(input),first,'第 '+(i+1)+' 次结果必须与首次完全一致');
});

test('全空信号 → 0 / observe',()=>{
  matchObject(scoreInquiryIntent(EMPTY) as unknown as Record<string,unknown>,{score:0,level:'observe',spamDetected:false},'空信号');
});

test('1 条明细 → 35 / cold',()=>{
  matchObject(scoreInquiryIntent({...EMPTY,itemCount:1}) as unknown as Record<string,unknown>,{score:35,level:'cold'},'单条明细');
});

test('明细维度封顶 50',()=>{
  const result=scoreInquiryIntent({...EMPTY,itemCount:100});
  assert.equal(result.score,50);
  assert.equal(result.level,'warm');
  assert.equal(result.contributions.items,50);
});

test('数量维度：存在 quantity>1 时 +10',()=>{
  const result=scoreInquiryIntent({...EMPTY,hasQuantityAboveOne:true});
  assert.equal(result.score,10);
  assert.equal(result.contributions.quantity,10);
});

test('数量维度：极大数量不继续加分',()=>{
  const signals=buildInquiryIntentSignals(raw({itemQuantities:[Number.MAX_SAFE_INTEGER]}));
  assert.equal(signals.hasQuantityAboveOne,true);
  assert.equal(scoreInquiryIntent(signals).contributions.quantity,10);
});

test('message 长度 199 → 0',()=>{assert.equal(scoreInquiryIntent({...EMPTY,messageLength:199}).contributions.messageLength,0);});
test('message 长度 200 → 10',()=>{assert.equal(scoreInquiryIntent({...EMPTY,messageLength:200}).contributions.messageLength,10);});
test('message 长度 499 → 10',()=>{assert.equal(scoreInquiryIntent({...EMPTY,messageLength:499}).contributions.messageLength,10);});
test('message 长度 500 → 20 且档位不叠加',()=>{assert.equal(scoreInquiryIntent({...EMPTY,messageLength:500}).contributions.messageLength,20);});

test('超长 message（100 万字符）不改变最高档位，且结尾关键词仍被识别',()=>{
  const signals=buildInquiryIntentSignals(raw({message:'x'.repeat(1_000_000)+' MOQ'}));
  const result=scoreInquiryIntent(signals);
  assert.ok(signals.messageLength>=500,'长度计数必须 >=500（实测 '+signals.messageLength+'）');
  assert.equal(result.contributions.messageLength,20);
  assert.equal(result.contributions.purchaseKeyword,15);
  assert.equal(result.score,35);
});

for(const keyword of ['MOQ','moq','Price','QUOTE','quotation','container','order','FOB','cif','采购','报价','起订量']){
  test('采购关键词 '+keyword+' 被识别',()=>{
    const signals=buildInquiryIntentSignals(raw({message:'Please send '+keyword}));
    assert.equal(signals.hasPurchaseKeyword,true);
    assert.equal(scoreInquiryIntent(signals).contributions.purchaseKeyword,15);
  });
}

for(const inquiryType of ['rfq','sample'] as const){
  test('inquiry_type '+inquiryType+' → 15',()=>{
    const result=scoreInquiryIntent({...EMPTY,inquiryType});
    assert.equal(result.contributions.inquiryType,15);
    assert.equal(result.score,15);
  });
}

for(const inquiryType of ['contact','product','distributor'] as const){
  test('inquiry_type '+inquiryType+' → 0',()=>{
    assert.equal(scoreInquiryIntent({...EMPTY,inquiryType}).contributions.inquiryType,0);
  });
}

test('来源页 product → 10',()=>{assert.equal(scoreInquiryIntent({...EMPTY,sourceKind:'product'}).contributions.source,10);});
test('来源页 home_or_contact → 3',()=>{assert.equal(scoreInquiryIntent({...EMPTY,sourceKind:'home_or_contact'}).contributions.source,3);});
test('国家非空 → 5',()=>{assert.equal(scoreInquiryIntent({...EMPTY,hasCountry:true}).contributions.country,5);});

for(const [distinctDownloadTargetCount,expected] of [[0,0],[1,5],[2,10],[3,15],[4,15],[1000,15]] as const){
  test('去重下载目标数 '+distinctDownloadTargetCount+' → '+expected,()=>{
    assert.equal(scoreInquiryIntent({...EMPTY,distinctDownloadTargetCount}).contributions.downloads,expected);
  });
}

test('同邮箱询盘数达到 2 → 复访近似 +15',()=>{assert.equal(scoreInquiryIntent({...EMPTY,sameEmailInquiryCount:2}).contributions.revisit,15);});
test('首次询盘（同邮箱数=1）→ 复访近似 0',()=>{assert.equal(scoreInquiryIntent({...EMPTY,sameEmailInquiryCount:1}).contributions.revisit,0);});
test('utm_source 非空 → 5',()=>{assert.equal(scoreInquiryIntent({...EMPTY,hasUtmSource:true}).contributions.utm,5);});

test('总分封顶 100',()=>{
  const result=scoreInquiryIntent({itemCount:10,hasQuantityAboveOne:true,messageLength:500,hasPurchaseKeyword:true,spamDetected:false,inquiryType:'rfq',sourceKind:'product',hasCountry:true,distinctDownloadTargetCount:100,sameEmailInquiryCount:10,hasUtmSource:true});
  assert.equal(result.score,100);
  assert.equal(result.level,'hot');
});

for(const [score,level] of [[0,'observe'],[9,'observe'],[10,'cold'],[39,'cold'],[40,'warm'],[69,'warm'],[70,'hot'],[100,'hot']] as const){
  test('分数边界 '+score+' → '+level,()=>{assert.equal(scoreToIntentLevel(score),level);});
}

for(const message of ['<a href="https://spam.example">click</a>','<A HREF="https://spam.example">click</A>','cheap VIAGRA','online casino promotion','payday loan today','buy backlinks','guest post available']){
  test('spam 硬门：'+message.slice(0,28),()=>{
    const signals=buildInquiryIntentSignals(raw({message,inquiryType:'rfq',sourceKind:'product',country:'US',utmSource:'google',itemQuantities:[1000,2000],distinctDownloadTargetCount:10,sameEmailInquiryCount:5}));
    const result=scoreInquiryIntent(signals);
    assert.equal(signals.spamDetected,true);
    matchObject(result as unknown as Record<string,unknown>,{score:0,level:'cold',spamDetected:true},'spam 硬门');
    assert.equal(Object.values(result.contributions).every(value=>value===0),true,'spam 命中时所有 contribution 必须为 0');
  });
}

test('email 归一化：去空白 + ASCII 大小写不敏感',()=>{
  assert.equal(normalizeIntentEmail(' Buyer@Example.COM '),'buyer@example.com');
  assert.equal(normalizeIntentEmail('BUYER@example.com'),'buyer@example.com');
});

test('人工覆盖优先于机器等级',()=>{
  assert.equal(resolveEffectiveIntentLevel('cold','hot'),'hot');
  assert.equal(resolveEffectiveIntentLevel('hot','warm'),'warm');
});
test('无人工覆盖时用机器等级',()=>{assert.equal(resolveEffectiveIntentLevel('warm',null),'warm');});
test('机器与人工都为 null → null（“未评分”）',()=>{assert.equal(resolveEffectiveIntentLevel(null,null),null);});

// ── service 级断言：这是 D4（重算不得触碰人工覆盖）的真正验收 ──────────────────────────
function createFakeInquiryIntentRepository(seed:{id:string}&Partial<InquiryIntentRow>){
  const state:InquiryIntentRow={intentScore:null,intentLevel:null,intentScoredAt:null,intentOverrideLevel:null,intentOverrideBy:null,intentOverrideAt:null,...seed};
  const repository:InquiryIntentRepository={
    async get(inquiryId){return inquiryId===state.id?{...state}:null;},
    async updateMachineScore(inquiryId,{score,level,scoredAt}){if(inquiryId!==state.id)throw new Error('未预期的询盘：'+inquiryId);state.intentScore=score;state.intentLevel=level;state.intentScoredAt=scoredAt;},
    async setOverride(inquiryId,value){if(inquiryId!==state.id)throw new Error('未预期的询盘：'+inquiryId);if(value){state.intentOverrideLevel=value.level;state.intentOverrideBy=value.by;state.intentOverrideAt=value.at;}else{state.intentOverrideLevel=null;state.intentOverrideBy=null;state.intentOverrideAt=null;}}
  };
  return {repository,state};
}

test('重算绝不清除已有人工覆盖（D4 的真正验收）',async()=>{
  const {repository}=createFakeInquiryIntentRepository({id:'inq-1',intentScore:90,intentLevel:'hot',intentOverrideLevel:'warm',intentOverrideBy:'user-1',intentOverrideAt:'2026-10-02T00:00:00.000Z'});
  await recomputeInquiryIntent({inquiryId:'inq-1',repository,signals:{...EMPTY,itemCount:1},scoredAt:'2026-10-03T00:00:00.000Z'});
  const row=await repository.get('inq-1');
  assert.ok(row,'重算后询盘必须仍然存在');
  assert.equal(row.intentScore,35);
  assert.equal(row.intentLevel,'cold');
  assert.equal(row.intentScoredAt,'2026-10-03T00:00:00.000Z');
  assert.equal(row.intentOverrideLevel,'warm');
  assert.equal(row.intentOverrideBy,'user-1');
  assert.equal(row.intentOverrideAt,'2026-10-02T00:00:00.000Z');
  assert.equal(resolveEffectiveIntentLevel(row.intentLevel,row.intentOverrideLevel),'warm');
});

// ── SPEC §16 固定夹具：prod 没有历史询盘，验收就用这六条固定输入 + 一个人工覆盖场景 ────────
const FIXTURES:[string,InquiryIntentSignals,number,string][]=[
  ['intent-empty',{...EMPTY},0,'observe'],
  ['intent-cold',{...EMPTY,hasCountry:true,hasUtmSource:true},10,'cold'],
  ['intent-warm',{...EMPTY,itemCount:1,hasCountry:true},40,'warm'],
  ['intent-hot',{...EMPTY,itemCount:1,hasQuantityAboveOne:true,inquiryType:'rfq',hasPurchaseKeyword:true},75,'hot'],
  ['intent-cap',{itemCount:10,hasQuantityAboveOne:true,messageLength:500,hasPurchaseKeyword:true,spamDetected:false,inquiryType:'rfq',sourceKind:'product',hasCountry:true,distinctDownloadTargetCount:100,sameEmailInquiryCount:10,hasUtmSource:true},100,'hot'],
  ['intent-spam',{itemCount:10,hasQuantityAboveOne:true,messageLength:500,hasPurchaseKeyword:true,spamDetected:true,inquiryType:'rfq',sourceKind:'product',hasCountry:true,distinctDownloadTargetCount:100,sameEmailInquiryCount:10,hasUtmSource:true},0,'cold']
];

test('固定夹具六条与 SPEC §16 期望逐条一致',()=>{
  const report:string[]=[];
  for(const [name,signals,score,level] of FIXTURES){
    const result=scoreInquiryIntent(signals);
    assert.equal(result.score,score,name+' 期望分数');
    assert.equal(result.level,level,name+' 期望等级');
    report.push(`${name} = ${result.score}/${result.level}`);
  }
  console.log('  [fixtures] '+report.join('  '));
});

test('固定夹具：人工覆盖在重算后仍然生效',async()=>{
  const {repository}=createFakeInquiryIntentRepository({id:'inq-override',intentScore:75,intentLevel:'hot',intentOverrideLevel:'warm',intentOverrideBy:'user-1',intentOverrideAt:'2026-10-02T00:00:00.000Z'});
  const before=await repository.get('inq-override');
  assert.equal(resolveEffectiveIntentLevel(before!.intentLevel,before!.intentOverrideLevel),'warm');
  await recomputeInquiryIntent({inquiryId:'inq-override',repository,signals:{...EMPTY,itemCount:1},scoredAt:'2026-10-03T00:00:00.000Z'});
  const after=await repository.get('inq-override');
  assert.equal(after!.intentScore,35);
  assert.equal(after!.intentLevel,'cold');
  assert.equal(after!.intentOverrideLevel,'warm');
  assert.equal(resolveEffectiveIntentLevel(after!.intentLevel,after!.intentOverrideLevel),'warm');
});
