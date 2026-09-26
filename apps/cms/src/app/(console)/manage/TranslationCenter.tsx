'use client';
import {useEffect,useState} from 'react';
import {apiRequest as request,type Row} from './api-client';
import {AISettings} from './AISettings';

export type TranslationSource={id:string;title:string;entityType:'content_item_translations'|'product_translations'};
const statusNames:Row={pending:'等待翻译',processing:'翻译中',review:'待校对',approved:'已审核',failed:'失败'};

export function TranslationCenter({writableKinds,canConfigure,onOpenTarget,onChooseSource}:{writableKinds:string[];canConfigure:boolean;onOpenTarget:(job:Row)=>void;onChooseSource:(type:string)=>void}){
 const [data,setData]=useState<Row|null>(null),[error,setError]=useState(''),[busy,setBusy]=useState(''),[settingsOpen,setSettingsOpen]=useState(false);
 const reload=()=>request('translation-jobs').then(setData).catch(e=>setError(e.message));
 useEffect(()=>{reload();const timer=setInterval(reload,5000);return()=>clearInterval(timer);},[]);
 async function action(job:Row,what:'retry'|'approve'){
  setBusy(job.id);setError('');try{await request('translation-jobs',{id:job.id,action:what},'PATCH');await reload();}catch(e:any){setError(e.message);}finally{setBusy('');}
 }
 return <div className="translation-center">
  <div className="resource-intro"><p>选择一条页面或产品的原文，点击“自动翻译”，可一次选择多个目标语言。译文会保存为草稿，校对后再发布。</p></div>
  {data&&!data.config?.configured&&<div className="translation-setup"><strong>翻译服务尚未配置</strong><p>{data.config?.reason?data.config.reason+'。':'还没有可用的 DeepSeek API 密钥。'}请管理员打开下方“AI 设置”处理，密钥不会在后台回显。</p></div>}
  {canConfigure&&<><button className="llm-settings-toggle" onClick={()=>setSettingsOpen(x=>!x)}>⚙ AI 设置 {settingsOpen?'收起':'展开'}</button>{settingsOpen&&<AISettings onSaved={reload}/>}</>}
  <div className="translation-start"><button className="primary" onClick={()=>onChooseSource('content_item_translations')}>从页面与文章选择原文</button><button onClick={()=>onChooseSource('product_translations')}>从产品选择原文</button></div>
  <h2>翻译任务</h2>{error&&<p role="alert" className="form-error">{error}</p>}
  {!data?<p>正在加载任务…</p>:data.rows.length?<div className="translation-list">{data.rows.map((job:Row)=><article key={job.id}>
   <div><strong>{job.source_title}</strong><span>{job.source_language} → {job.target_language}</span></div>
   <div><span className={'badge '+job.status}>{statusNames[job.status]||job.status}</span><time>{new Date(job.created_at).toLocaleString('zh-CN')}</time></div>
   {job.error_message&&<p className="translation-error">{job.error_message}</p>}
   <div className="translation-actions">{job.target_path&&<button onClick={()=>onOpenTarget(job)}>查看译文草稿</button>}{job.status==='review'&&writableKinds.includes(job.entity_type)&&<button disabled={busy===job.id} onClick={()=>action(job,'approve')}>标记已校对</button>}{job.status==='failed'&&writableKinds.includes(job.entity_type)&&<button disabled={busy===job.id} onClick={()=>action(job,'retry')}>重试</button>}</div>
  </article>)}</div>:<div className="empty"><strong>还没有翻译任务</strong><p>从页面或产品列表选择原文，点击“自动翻译”开始。</p></div>}
 </div>;
}

export function AutoTranslateDialog({source,onClose,onDone}:{source:TranslationSource;onClose:()=>void;onDone:()=>void}){
 const [data,setData]=useState<Row|null>(null),[config,setConfig]=useState<Row|null>(null),[selected,setSelected]=useState<string[]>([]),[overwrite,setOverwrite]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState('');
 useEffect(()=>{let cancelled=false;Promise.all([request('translation-targets?entityType='+encodeURIComponent(source.entityType)+'&entityId='+encodeURIComponent(source.id)),request('translation-jobs')]).then(([targets,jobs])=>{if(!cancelled){setData(targets);setConfig(jobs.config);}}).catch(e=>{if(!cancelled)setError(e.message);});return()=>{cancelled=true;};},[source.id,source.entityType]);
 function toggle(id:string){setSelected(current=>current.includes(id)?current.filter(x=>x!==id):[...current,id]);}
 async function submit(){setBusy(true);setError('');try{await request('translation-jobs',{entityType:source.entityType,entityId:source.id,targetLocaleIds:selected,overwriteDraft:overwrite});onDone();}catch(e:any){setError(e.message);}finally{setBusy(false);}}
 return <div className="modal-backdrop" onClick={onClose}><section className="editor translation-dialog" role="dialog" aria-modal="true" aria-label="自动翻译" onClick={e=>e.stopPropagation()}>
  <header><div><p className="eyebrow">DEEPSEEK · 自动翻译</p><h2>{source.title}</h2></div><button onClick={onClose} aria-label="关闭">×</button></header>
  <div className="translation-dialog-body"><p>选择目标语言。页面标题、摘要、正文区块或产品介绍会翻译，网址标识、图片地址和产品编号会保留。翻译完成后请人工校对。</p>
   {error&&<p role="alert" className="form-error">{error}</p>}
   {config&&!config.configured&&<div className="translation-setup">翻译服务尚未配置{config.reason?'：'+config.reason:''}。请管理员在“自动翻译 → AI 设置”处理。</div>}
   {!data?<p>正在加载语言…</p>:<><div className="translation-languages">{data.locales.filter((locale:Row)=>locale.id!==data.source.locale_id).map((locale:Row)=>{
    const existing=locale.existing_status;const locked=existing&&!['draft','review'].includes(existing);const disabled=!!locked||!!existing&&!overwrite;
    return <label key={locale.id} className={disabled?'disabled':''}><input type="checkbox" checked={selected.includes(locale.id)} disabled={disabled} onChange={()=>toggle(locale.id)}/><span>{locale.native_name} <small>{locale.code}</small></span><em>{locked?'已有公开内容':existing?'已有草稿':'可翻译'}</em></label>;
   })}</div><label className="translation-overwrite"><input type="checkbox" checked={overwrite} onChange={e=>{setOverwrite(e.target.checked);if(!e.target.checked)setSelected(current=>current.filter(id=>!data.locales.some((locale:Row)=>locale.id===id&&locale.existing_id)));}}/>允许覆盖所选语言中已有的草稿（不会覆盖已发布内容）</label></>}
   <footer><button onClick={onClose}>取消</button><button className="primary" disabled={busy||!selected.length||!config?.configured} onClick={submit}>{busy?'提交中…':`开始翻译 ${selected.length} 种语言`}</button></footer>
  </div>
 </section></div>;
}
