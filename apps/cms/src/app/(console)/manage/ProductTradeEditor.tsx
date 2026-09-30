'use client';
import {useEffect,useState} from 'react';

type Row=Record<string,any>;
type Props={translation:Row;onClose:()=>void;onDone:()=>void};
async function request(path:string){const response=await fetch('/api/v1/'+path,{credentials:'include'});const value=await response.json();if(!response.ok)throw new Error(value.error||'操作失败');return value;}
export function ProductTradeEditor({translation,onClose,onDone}:Props){
 const [product,setProduct]=useState<Row|null>(null),[form,setForm]=useState<Row>({}),[busy,setBusy]=useState(false),[error,setError]=useState('');
 useEffect(()=>{let active=true;request('records?resource=products&filter='+encodeURIComponent(JSON.stringify({id:translation.product_id}))).then(result=>{if(!active)return;const row=result.rows?.[0];if(!row)throw new Error('未找到产品主体');setProduct(row);setForm({min_order_quantity:row.min_order_quantity??'',order_unit:translation.order_unit??'',lead_time_days:row.lead_time_days??'',packaging_details:translation.packaging_details??'',customization_details:translation.customization_details??'',sample_policy:translation.sample_policy??''});}).catch(e=>{if(active)setError(e.message);});return()=>{active=false;};},[translation]);
 const field=(name:string,label:string,help:string,kind:'text'|'number'|'textarea'='text')=><label key={name}>{label}{kind==='textarea'?<textarea rows={3} value={form[name]??''} onChange={e=>setForm({...form,[name]:e.target.value})}/>:<input type={kind} min={kind==='number'?1:undefined} step={name==='min_order_quantity'?'0.001':'1'} value={form[name]??''} onChange={e=>setForm({...form,[name]:e.target.value})}/>}<small>{help}</small></label>;
 async function save(){
  if(!product)return;setBusy(true);setError('');
  try{
   const payload={translationId:translation.id,expectedProductUpdatedAt:product.updated_at,expectedTranslationUpdatedAt:translation.updated_at,minOrderQuantity:form.min_order_quantity===''?null:Number(form.min_order_quantity),leadTimeDays:form.lead_time_days===''?null:Number(form.lead_time_days),orderUnit:String(form.order_unit||'').trim()||null,packagingDetails:String(form.packaging_details||'').trim()||null,customizationDetails:String(form.customization_details||'').trim()||null,samplePolicy:String(form.sample_policy||'').trim()||null};
   const response=await fetch('/api/v1/trade-product',{method:'POST',credentials:'include',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});
   const result=await response.json();if(!response.ok)throw new Error(result.error||'保存失败');onDone();
  }catch(e:any){setError(e.message||'保存失败，请重试');}finally{setBusy(false);}
 }
 return <div className="modal-backdrop" onClick={onClose}><section className="editor trade-editor" role="dialog" aria-modal="true" aria-label="产品外贸采购资料" onClick={e=>e.stopPropagation()}><header><div><p className="eyebrow">外贸采购资料</p><h2>{translation.name}</h2></div><button type="button" onClick={onClose} aria-label="关闭">×</button></header><div className="trade-editor-body"><p className="editor-help">起订量与交期在所有语言共用；订购单位、包装、定制与样品政策按当前语言单独填写。仅填写已核实的信息。</p>{error&&<p className="form-error" role="alert">{error}</p>}{!product&&!error?<p>正在读取产品资料…</p>:product&&<div className="fields">{field('min_order_quantity','起订量（MOQ）','留空表示未公布；不自动生成价格。','number')}{field('order_unit','订购单位','例如 件、套、箱。')}{field('lead_time_days','参考交期（天）','仅填写经销售确认的典型交期。','number')}{field('packaging_details','包装方式','按当前语言描述包装材料、装箱方式等。','textarea')}{field('customization_details','可定制内容','例如尺寸、颜色、印刷或工艺，不能承诺尚不支持的项目。','textarea')}{field('sample_policy','样品政策','说明是否可申请样品及适用条件。','textarea')}</div>}<footer><button type="button" onClick={onClose}>取消</button><button type="button" className="primary" disabled={!product||busy} onClick={save}>{busy?'保存中…':'保存采购资料'}</button></footer><small>保存后重新发布产品；共用字段变化时，请把该产品的各语言版本逐一重新发布。</small></div></section></div>;
}
