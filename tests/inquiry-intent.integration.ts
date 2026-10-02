/** L1 意向评级契约的**数据库层**断言（SPEC: docs/inquiry-intent-scoring-spec.md §13/§16）。
 * 只在 verify.mjs 的临时库（suns_verify_<hex>）里跑，不访问网络与 prod。
 * 与 tests/inquiry-intent-scoring.test.ts 的分工：那边是免库的纯函数契约，这边是六列/CHECK/
 * 一致性/status 隔离/lead-scope 归属/去重聚合等只有真库才能证明的部分。
 */
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';

const databaseUrl=new URL(process.env.DATABASE_URL||'http://invalid');
if(process.env.VERIFY_DATABASE!=='1'||!/^\/suns_verify_[a-f0-9]+$/.test(databaseUrl.pathname))
 throw Error('Run through verify.mjs in its isolated suns_verify_<hex> database');

const {query,pool}=await import('../packages/domain/src/db');
const {ensureActor,DomainError}=await import('../packages/domain/src/crud');
const {
 buildInquiryIntentSignals,intentSourceKind,resolveEffectiveIntentLevel,scoreInquiryIntent,
 inquiryIntent,inquiryIntentSignals,recomputeInquiryIntentForActor,setInquiryIntentOverrideForActor,
 pgInquiryIntentRepository
}=await import('../packages/domain/src/inquiry-intent');

const stamp=randomUUID().replace(/-/g,'').slice(0,10);
const numberA='VERIFY-INTENT-A-'+stamp,numberB='VERIFY-INTENT-B-'+stamp;
let passed=0;
const ok=(name:string)=>{passed+=1;console.log('  PASS inquiry-intent · '+name);};
const expectFailure=async(name:string,sql:string,params:unknown[],code:string)=>{
 await assert.rejects(()=>query(sql,params),error=>(error as {code?:string}).code===code,`${name} 必须以 ${code} 失败`);
 ok(name);
};

try{
 // ① 迁移 029 的六列
 const columns=(await query(`SELECT column_name FROM information_schema.columns WHERE table_schema='public' AND table_name='inquiries' AND column_name IN ('intent_score','intent_level','intent_scored_at','intent_override_level','intent_override_by','intent_override_at')`)).map(row=>String(row.column_name)).sort();
 assert.deepEqual(columns,['intent_level','intent_override_at','intent_override_by','intent_override_level','intent_score','intent_scored_at'],'029 必须恰好新增六列，实测：'+columns.join(','));
 ok('029 六列存在且恰好六个');

 const locale=(await query("SELECT id FROM locales WHERE code='en'"))[0].id;
 const admin={id:randomUUID(),email:`verify-intent-admin-${stamp}@example.com`,role:'admin',displayName:'Verify intent admin'};
 await ensureActor(admin);
 const inquiry=(await query("INSERT INTO inquiries(inquiry_number,inquiry_type,name,email,message,status,country,source_url,utm_source,locale_id) VALUES($1,'rfq','Verify Buyer','Buyer@Example.COM','Please send MOQ and price','new','US','https://www.opctools.cloud/en/products/verify-glassware','google',$2) RETURNING id",[numberA,locale]))[0];
 const id=String(inquiry.id);
 // 同邮箱（**小写**）的第二条：用来证明 citext 的大小写不敏感聚合，而不只是应用层 key
 await query("INSERT INTO inquiries(inquiry_number,inquiry_type,name,email,message,status,locale_id) VALUES($1,'contact','Verify Buyer','buyer@example.com','second contact','new',$2)",[numberB,locale]);

 // ② 机器分范围
 const machine='UPDATE inquiries SET intent_score=$2,intent_level=$3,intent_scored_at=now() WHERE id=$1';
 await expectFailure('score=-1 被拒',machine,[id,-1,'observe'],'23514');
 await expectFailure('score=101 被拒',machine,[id,101,'hot'],'23514');
 await query(machine,[id,0,'observe']);ok('score=0 允许');
 await query(machine,[id,100,'hot']);ok('score=100 允许');
 await expectFailure('非法等级 super_hot 被拒',machine,[id,70,'super_hot'],'23514');

 // ③ 机器三字段整组同生同灭
 await expectFailure('有分数但等级/时间为空被拒',"UPDATE inquiries SET intent_score=50,intent_level=NULL,intent_scored_at=NULL WHERE id=$1",[id],'23514');
 await expectFailure('有等级但分数为空被拒',"UPDATE inquiries SET intent_score=NULL,intent_level='hot',intent_scored_at=now() WHERE id=$1",[id],'23514');
 await expectFailure('有分数但时间为空被拒',"UPDATE inquiries SET intent_score=50,intent_level='hot',intent_scored_at=NULL WHERE id=$1",[id],'23514');
 await query("UPDATE inquiries SET intent_score=NULL,intent_level=NULL,intent_scored_at=NULL WHERE id=$1",[id]);ok('机器三字段可整组回到 NULL（尚未评分）');

 // ④ 人工覆盖三字段整组同生同灭 + 外键
 await expectFailure('只有覆盖等级、没有 by/at 被拒',"UPDATE inquiries SET intent_override_level='hot',intent_override_by=NULL,intent_override_at=NULL WHERE id=$1",[id],'23514');
 await expectFailure('只有 by/at、没有覆盖等级被拒',"UPDATE inquiries SET intent_override_level=NULL,intent_override_by=$2,intent_override_at=now() WHERE id=$1",[id,admin.id],'23514');
 await expectFailure('覆盖人不是真实用户被外键拒绝',"UPDATE inquiries SET intent_override_level='hot',intent_override_by=$2,intent_override_at=now() WHERE id=$1",[id,randomUUID()],'23503');
 await query("UPDATE inquiries SET intent_override_level='warm',intent_override_by=$2,intent_override_at=now() WHERE id=$1",[id,admin.id]);ok('覆盖三字段整组写入成功');
 await query("UPDATE inquiries SET intent_override_level=NULL,intent_override_by=NULL,intent_override_at=NULL WHERE id=$1",[id]);ok('覆盖三字段可整组清空');

 // ⑤ 信号聚合：明细 / 数量 / 来源页 / 国家 / UTM / 下载去重 / 同邮箱计数
 const product=(await query("INSERT INTO products(sku) VALUES($1) RETURNING id",['VERIFY-INTENT-'+stamp]))[0].id;
 await query("INSERT INTO inquiry_items(inquiry_id,product_id,product_name_snapshot,sku_snapshot,quantity) VALUES($1,$2,'Verify item','VERIFY-INTENT',1),($1,NULL,'Verify item 2',NULL,5)",[id,product]);
 const media=(await query("INSERT INTO media_assets(storage_provider,object_key,original_filename,mime_type,file_size) VALUES('local',$1,'verify-intent.pdf','application/pdf',1024) RETURNING id",['verify-intent/'+stamp+'.pdf']))[0].id;
 // 同一个下载目标（product）刷 2 次 + 另一个目标（同一媒体、不同产品为空）→ 去重后 2 个目标
 await query("INSERT INTO download_events(media_id,product_id,email) VALUES($1,$2,'Buyer@Example.COM'),($1,$2,'buyer@example.com'),($3,NULL,'BUYER@example.com')",[media,product,media]);
 const {signals}=await inquiryIntentSignals(admin,id);
 assert.equal(signals.itemCount,2,'明细条数');
 assert.equal(signals.hasQuantityAboveOne,true,'存在 quantity>1');
 assert.equal(signals.sourceKind,'product','来源页应识别为产品页');
 assert.equal(signals.hasCountry,true,'国家非空');
 assert.equal(signals.hasUtmSource,true,'utm_source 非空');
 assert.equal(signals.distinctDownloadTargetCount,2,'下载目标必须按目标去重（3 条事件 → 2 个目标）');
 assert.equal(signals.sameEmailInquiryCount,2,'同邮箱计数必须大小写不敏感（citext）');
 assert.equal(signals.hasPurchaseKeyword,true,'MOQ/price 关键词');
 ok('信号聚合：明细/数量/来源/国家/UTM/下载去重/同邮箱 citext');

 // ⑥ 纯函数与库内聚合必须给出同一个分数（契约一致性）
 const expected=scoreInquiryIntent(signals);
 const recomputed=await recomputeInquiryIntentForActor(admin,id,'2026-10-02T00:00:00.000Z');
 assert.equal(recomputed.intentScore,expected.score,'命令层分数必须等于纯函数分数');
 assert.equal(recomputed.intentLevel,expected.level,'命令层等级必须等于纯函数等级');
 assert.equal(recomputed.intentScoredAt,'2026-10-02T00:00:00.000Z','scoredAt 由调用方给，scorer 不读时间');
 ok('recompute 结果与纯函数逐字段一致（分数 '+expected.score+'/'+expected.level+'）');

 // ⑦ D3：status 隔离 —— 机器分、人工覆盖、spam 硬门都不得改 status
 const statusOf=async()=>String((await query('SELECT status FROM inquiries WHERE id=$1',[id]))[0].status);
 assert.equal(await statusOf(),'new','重算前的基线状态');
 await setInquiryIntentOverrideForActor(admin,id,'warm','2026-10-02T01:00:00.000Z');
 assert.equal(await statusOf(),'new','写人工覆盖后 status 必须仍是 new');
 assert.equal(resolveEffectiveIntentLevel(recomputed.intentLevel,'warm'),'warm','人工覆盖优先');
 // D4：重算不得触碰人工覆盖三字段
 const afterRecompute=await recomputeInquiryIntentForActor(admin,id,'2026-10-03T00:00:00.000Z');
 assert.equal(afterRecompute.intentOverrideLevel,'warm','重算后人工覆盖等级不变');
 assert.equal(afterRecompute.intentOverrideBy,admin.id,'重算后覆盖人不变');
 assert.equal(afterRecompute.intentOverrideAt,'2026-10-02T01:00:00.000Z','重算后覆盖时间不变');
 ok('D4：重算后人工覆盖三字段逐字不变');
 // spam 硬门：分数 0 / 等级 cold / status 仍是 new（且 **不是** 'spam'）
 await query("UPDATE inquiries SET message='cheap <a href=\"https://spam.example\">viagra</a> backlink' WHERE id=$1",[id]);
 const spamResult=await recomputeInquiryIntentForActor(admin,id,'2026-10-04T00:00:00.000Z');
 assert.equal(spamResult.intentScore,0,'spam 命中 → 0');
 assert.equal(spamResult.intentLevel,'cold','spam 命中 → cold');
 assert.equal(await statusOf(),'new','spam 命中后 status 必须仍是 new，绝不自动写成 spam');
 ok('D3+D5：spam 命中后 score=0/level=cold，status 仍为 new');
 // 人工清除覆盖 → 三字段整组 NULL，且机器分保留
 const cleared=await setInquiryIntentOverrideForActor(admin,id,null,'2026-10-05T00:00:00.000Z');
 assert.equal(cleared.intentOverrideLevel,null,'清除后覆盖等级为 NULL');
 assert.equal(cleared.intentOverrideBy,null,'清除后覆盖人为 NULL');
 assert.equal(cleared.intentOverrideAt,null,'清除后覆盖时间为 NULL');
 assert.equal(cleared.intentScore,0,'清除覆盖不得影响机器分');
 assert.equal(resolveEffectiveIntentLevel(cleared.intentLevel,cleared.intentOverrideLevel),'cold','清除后最终等级 = 机器等级');
 ok('人工清除覆盖：三字段整组 NULL 且机器分保留');

 // ⑧ D7：归属口径复用 lead-scope —— client 不得通过已知 UUID 越权
 const client={id:randomUUID(),email:`verify-intent-client-${stamp}@example.com`,role:'client',permissions:['leads.read','leads.write'],displayName:'Verify client'};
 await ensureActor(client);
 await assert.rejects(()=>inquiryIntent(client,id),error=>error instanceof DomainError&&error.status===404,'client 读陌生询盘必须 404（不泄露存在性）');
 ok('D7：client 读陌生询盘 404');
 await assert.rejects(()=>recomputeInquiryIntentForActor(client,id),error=>error instanceof DomainError&&error.status===404,'client 重算陌生询盘必须 404');
 ok('D7：client 重算陌生询盘 404');
 await assert.rejects(()=>setInquiryIntentOverrideForActor(client,id,'hot'),error=>error instanceof DomainError&&error.status===404,'client 覆盖陌生询盘必须 404');
 ok('D7：client 写陌生询盘覆盖 404');
 // 只有 leads.read、没有 leads.write 的角色：写入口必须是 403（权限门），读入口对陌生询盘仍是 404
 const readOnly={id:randomUUID(),email:`verify-intent-reader-${stamp}@example.com`,role:'client',permissions:['leads.read'],displayName:'Verify reader'};
 await ensureActor(readOnly);
 await assert.rejects(()=>recomputeInquiryIntentForActor(readOnly,id),error=>error instanceof DomainError&&error.status===403,'无 leads.write 的重算必须 403');
 ok('D7：无写权限的重算 403');
 // client 自己的询盘（邮箱匹配，且大小写不同）必须可读
 const own=await query("INSERT INTO inquiries(inquiry_number,inquiry_type,name,email,message,status,locale_id) VALUES($1,'contact','Verify client',$2,'my own inquiry','new',$3) RETURNING id",['VERIFY-INTENT-OWN-'+stamp,client.email.toUpperCase(),locale]);
 await query("INSERT INTO inquiries(inquiry_number,inquiry_type,name,email,message,status,locale_id) VALUES($1,'contact','x',$2,'y','new',$3)",['VERIFY-INTENT-OWNFIX-'+stamp,client.email,locale]);
 const ownRecord=await inquiryIntent(client,String(own[0].id));
 assert.equal(ownRecord.effectiveLevel,null,'未评分时最终等级必须是 null（“未评分”不落库）');
 ok('D7：client 读自己的询盘成功，未评分时 effectiveLevel=null');

 // ⑨ 仓储层只写机器三列（pg 实现的语句级证据：override 三列不在 UPDATE 里）
 await query("UPDATE inquiries SET intent_override_level='hot',intent_override_by=$2,intent_override_at=now() WHERE id=$1",[id,admin.id]);
 await pgInquiryIntentRepository().updateMachineScore(id,{score:42,level:'warm',scoredAt:'2026-10-06T00:00:00.000Z'});
 const row=(await pgInquiryIntentRepository().get(id))!;
 assert.equal(row.intentScore,42);
 assert.equal(row.intentOverrideLevel,'hot','仓储 updateMachineScore 不得清掉人工覆盖');
 assert.equal(row.intentOverrideBy,admin.id);
 ok('仓储层：updateMachineScore 只写机器三列');

 console.log('inquiry-intent integration PASS ('+passed+')');
}finally{
 await query("DELETE FROM download_events WHERE email IN ('Buyer@Example.COM','buyer@example.com')").catch(()=>{});
 await query("DELETE FROM inquiries WHERE inquiry_number LIKE 'VERIFY-INTENT-%'").catch(()=>{});
 await query("DELETE FROM media_assets WHERE object_key LIKE 'verify-intent/%'").catch(()=>{});
 await query("DELETE FROM products WHERE sku LIKE 'VERIFY-INTENT-%'").catch(()=>{});
 await query("DELETE FROM users WHERE email LIKE 'verify-intent-%'").catch(()=>{});
 await pool.end();
}
