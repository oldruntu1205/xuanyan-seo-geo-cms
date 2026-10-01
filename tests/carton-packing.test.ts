// CBM 装箱计算：A1–A13（L1 出题包 docs/L1出题包-CBM装箱计算.md）。
// 纯函数、不连数据库 —— 必须继续满足 pnpm test 的免库契约。
// 断言数值来自 L1 2026-10-01 的独立复算与裁定；L2 只做转写，未改动任何期望值。
import {test} from 'node:test';import assert from 'node:assert/strict';
import {CONTAINER_TYPES,DEFAULT_LOAD_FACTOR,packingNumber,packingSpecFromRow,packingSummary,cartonSpecProblem} from '../packages/domain/src/packing';

const EPS=1e-9;
const close=(actual:number|null,expected:number,label:string)=>{assert.ok(actual!==null,label+' 不应为 null');assert.ok(Math.abs(actual-expected)<=EPS,label+' 期望 '+expected+'，实际 '+actual);};
const spec=(lengthMm:number|null,widthMm:number|null,heightMm:number|null,quantity:number|null=1,gross:number|null=null)=>({cartonQuantity:quantity,cartonLengthMm:lengthMm,cartonWidthMm:widthMm,cartonHeightMm:heightMm,grossWeightKg:gross});

test('A1/A2 每箱体积与单件体积',()=>{
 const summary=packingSummary(spec(500,400,300,12,8.5));
 close(summary.cartonVolumeCbm,0.06,'每箱体积');
 close(summary.unitVolumeCbm,0.005,'单件体积');
});

test('A4 轻货：按容积受限（P0 固定回归）',()=>{
 const summary=packingSummary(spec(500,400,300,12,8.5));
 assert.equal(summary.complete,true);
 assert.deepEqual(summary.containers.map(c=>c.boxes),[470,959,1082]);
 assert.deepEqual(summary.containers.map(c=>c.limitedBy),['volume','volume','volume']);
 assert.deepEqual(summary.containers.map(c=>c.payloadKg),[3995,8151.5,9197]);
});

test('A5 重货：按重量受限且 limitedBy 跟着变（P0 固定回归）',()=>{
 const summary=packingSummary(spec(1000,1000,1000,1,1000));
 assert.deepEqual(summary.containers.map(c=>c.boxes),[21,26,26]);
 assert.deepEqual(summary.containers.map(c=>c.limitedBy),['weight','weight','weight']);
 assert.deepEqual(summary.containers.map(c=>c.payloadKg),[21000,26000,26000]);
});

test('A6 未填毛重：箱数不变，货重必须是 null 而不是 0',()=>{
 const summary=packingSummary(spec(500,400,300,12,null));
 assert.deepEqual(summary.containers.map(c=>c.boxes),[470,959,1082]);
 for(const container of summary.containers)
  assert.equal(container.payloadKg,null,container.code+' 的货重必须是 null：0 会被读成「不超重」');
 assert.ok(summary.notes.some(note=>note.includes('未填每箱毛重')),'必须说明未计入重量');
});

test('A7 IEEE-754 边界：40HQ 必须算 7640 箱，不能是 7639',()=>{
 // 前提断言：把「为什么需要容差」钉在测试里，而不是只写注释。
 assert.equal(Math.floor(76.4*0.85/(850*100*100/1e9)),7639,'原始商应确实触发向下取整误差（7639.999999999999）');
 assert.equal(76.4*0.85,64.94,'十进制精确值为 7640 箱');
 const summary=packingSummary(spec(850,100,100,1,null));
 assert.deepEqual(summary.containers.map(c=>c.boxes),[3320,6770,7640]);
});

test('A8 装载效率是入参：箱数随之变化，提示文案同步',()=>{
 const half=packingSummary(spec(500,400,300,12,8.5),0.5);
 assert.deepEqual(half.containers.map(c=>c.boxes),[276,564,636]);
 assert.ok(half.notes.some(note=>note.includes('50%')),'提示应写明实际使用的装载效率');
 const standard=packingSummary(spec(500,400,300,12,8.5));
 assert.deepEqual(standard.containers.map(c=>c.boxes),[470,959,1082]);
 assert.ok(standard.notes.some(note=>note.includes(Math.round(DEFAULT_LOAD_FACTOR*100)+'%')));
});

test('A9 结构性公式：期望值由导出的常量推导，不硬编码容器口径',()=>{
 const cases:[number,number,number,number,number|null][]=[
  [500,400,300,12,8.5],[1000,1000,1000,1,1000],[850,100,100,1,null],[600,450,320,20,12.4]
 ];
 for(const [lengthMm,widthMm,heightMm,quantity,gross] of cases){
  const summary=packingSummary(spec(lengthMm,widthMm,heightMm,quantity,gross));
  const cartonVolume=lengthMm*widthMm*heightMm/1e9;
  CONTAINER_TYPES.forEach((type,index)=>{
   const byVolume=Math.floor(type.innerVolumeCbm*DEFAULT_LOAD_FACTOR/cartonVolume+1e-9);
   const byWeight=gross===null?Number.POSITIVE_INFINITY:Math.floor(type.maxPayloadKg/gross+1e-9);
   assert.equal(summary.containers[index].boxes,Math.min(byVolume,byWeight),type.code+' 装柜数应与常量推得的公式一致');
  });
 }
});

test('A10 箱规未填全：一个数字都不输出，只解释原因',()=>{
 const summary=packingSummary(spec(500,400,300,null,8.5));
 assert.equal(summary.complete,false);
 assert.equal(summary.cartonVolumeCbm,null);
 assert.equal(summary.unitVolumeCbm,null);
 assert.equal(summary.grossWeightPerBoxKg,null);
 for(const container of summary.containers)assert.equal(container.boxes,null,container.code+' 不应给出猜测值');
 assert.equal(summary.notes.length,1);
 assert.ok(summary.notes[0].includes('箱规未填全'));
});

test('A11 四件套的全部 14 个非空非完整子集都不出数字（第 15 个=齐全，必须能算）',()=>{
 const full={cartonQuantity:12 as number|null,cartonLengthMm:500 as number|null,cartonWidthMm:400 as number|null,cartonHeightMm:300 as number|null};
 const keys=['cartonQuantity','cartonLengthMm','cartonWidthMm','cartonHeightMm'] as const;
 let properSubsets=0;
 for(let mask=1;mask<16;mask++){
  const built={cartonQuantity:null,cartonLengthMm:null,cartonWidthMm:null,cartonHeightMm:null,grossWeightKg:8.5} as Record<string,number|null>;
  keys.forEach((key,index)=>{if(mask&(1<<index))built[key]=full[key];});
  const summary=packingSummary(built as any);
  if(mask===15){assert.equal(summary.complete,true,'四项齐全必须能算');assert.deepEqual(summary.containers.map(c=>c.boxes),[470,959,1082]);continue;}
  properSubsets++;
  assert.equal(summary.complete,false,'子集 '+mask.toString(2).padStart(4,'0')+' 不应输出数字');
  assert.equal(summary.cartonVolumeCbm,null);
  assert.equal(summary.unitVolumeCbm,null);
  for(const container of summary.containers)assert.equal(container.boxes,null);
  assert.equal(summary.notes.length,1,'子集 '+mask+' 只应给一条原因');
 }
 assert.equal(properSubsets,14,'C(4,1)+C(4,2)+C(4,3)=14 个 proper non-empty subset');
});

test('A12 非正数与非有限值一律视为未填',()=>{
 for(const value of [0,-1,'','   ','abc',undefined,null,NaN,Infinity,-Infinity])
  assert.equal(packingNumber(value),null,String(value)+' 应视为未填');
 assert.equal(packingNumber('12.000'),12,'正向样本：否则「一律返回 null」也会通过');
 assert.equal(packingNumber(8.5),8.5);
});

test('A13 pg 的 numeric 是字符串：解析结果与数字输入逐字段一致',()=>{
 const fromStrings=packingSpecFromRow({carton_quantity:'12.000',carton_length_mm:'500.0',carton_width_mm:'400.0',carton_height_mm:'300.0',gross_weight_kg:'8.500'});
 assert.deepEqual(fromStrings,{cartonQuantity:12,cartonLengthMm:500,cartonWidthMm:400,cartonHeightMm:300,grossWeightKg:8.5});
 assert.deepEqual(packingSummary(fromStrings),packingSummary(spec(500,400,300,12,8.5)));
 assert.deepEqual(packingSummary(fromStrings).containers.map(c=>c.boxes),[470,959,1082]);
});

test('A19（规则层）完整性规则：三个尺寸 0 或 3，每箱数量独立（028 放宽后）',()=>{
 const dimKeys=['cartonLengthMm','cartonWidthMm','cartonHeightMm'] as const;
 const values={cartonLengthMm:500,cartonWidthMm:400,cartonHeightMm:300};
 let refused=0;
 for(let mask=0;mask<8;mask++){
  const built={cartonQuantity:null,cartonLengthMm:null,cartonWidthMm:null,cartonHeightMm:null,grossWeightKg:null} as Record<string,number|null>;
  dimKeys.forEach((key,index)=>{if(mask&(1<<index))built[key]=values[key];});
  const problem=cartonSpecProblem(built as any);
  if(mask===0||mask===7){assert.equal(problem,null,'尺寸 0 个或 3 个必须放行（mask='+mask+'）');continue;}
  refused++;
  assert.match(String(problem),/外箱尺寸请填全/,'2 个尺寸必须被拒（mask='+mask+'）');
 }
 assert.equal(refused,6,'C(3,1)+C(3,2)=6 个半截尺寸组合');
 // 028 的核心目的：每箱数量可以单独记录
 assert.equal(cartonSpecProblem({cartonQuantity:12,cartonLengthMm:null,cartonWidthMm:null,cartonHeightMm:null,grossWeightKg:null}),null,'只填每箱数量必须放行');
 assert.equal(cartonSpecProblem({cartonQuantity:null,cartonLengthMm:null,cartonWidthMm:null,cartonHeightMm:null,grossWeightKg:8.5}),null,'只有毛重也必须放行');
 // 但「每箱数量 + 半截尺寸」仍然要被拒
 assert.match(String(cartonSpecProblem({cartonQuantity:12,cartonLengthMm:500,cartonWidthMm:null,cartonHeightMm:null,grossWeightKg:null})),/外箱尺寸请填全/);
 // 注意：只填每箱数量虽然能存，但计算层依然不出任何数字（A10/A11 保证）
 const quantityOnly=packingSummary({cartonQuantity:12,cartonLengthMm:null,cartonWidthMm:null,cartonHeightMm:null,grossWeightKg:null});
 assert.equal(quantityOnly.complete,false,'只有每箱数量时不得输出估算数字');
 for(const container of quantityOnly.containers)assert.equal(container.boxes,null);
});
