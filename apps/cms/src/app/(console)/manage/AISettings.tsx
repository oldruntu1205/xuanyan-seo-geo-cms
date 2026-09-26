'use client';
import {useEffect,useState} from 'react';
import {apiRequest,type Row} from './api-client';

const modelPattern=/^[A-Za-z0-9._/-]{2,100}$/;
const loopback=['localhost','127.0.0.1','[::1]'];

// 与后端 packages/domain/src/llm.ts 的校验保持一致，先在本地拦掉明显错误，减少无谓请求。
function formProblem(model:string,url:string,key:string){
 if(!modelPattern.test(model.trim()))return '模型名称只能包含字母、数字、点、下划线、斜杠和连字符（2–100 字符）';
 let parsed:URL;
 try{parsed=new URL(url.trim());}catch{return '接口地址必须是完整网址，例如 https://api.deepseek.com/chat/completions';}
 if(parsed.username||parsed.password)return '接口地址不能包含用户名或密码';
 if(parsed.search||parsed.hash)return '接口地址不能带查询参数或锚点';
 if(parsed.protocol!=='https:'&&!(parsed.protocol==='http:'&&loopback.includes(parsed.hostname)))return '接口地址必须使用 HTTPS；仅本机调试可用 http://localhost';
 if(/\s/.test(key))return 'API 密钥不能包含空格或换行';
 if(key&&(key.length<16||key.length>500))return 'API 密钥长度不正确（应在 16–500 字符之间）';
 return '';
}

export function AISettings({onSaved}:{onSaved:()=>void}){
 const [settings,setSettings]=useState<Row|null>(null);
 const [form,setForm]=useState({model:'',url:'',enabled:true});
 const [key,setKey]=useState(''),[clearKey,setClearKey]=useState(false);
 const [busy,setBusy]=useState(''),[error,setError]=useState(''),[message,setMessage]=useState('');
 const [probe,setProbe]=useState<Row|null>(null),[pendingClear,setPendingClear]=useState(false);

 function apply(value:Row){setSettings(value);setForm({model:value.model||'',url:value.url||'',enabled:!!value.enabled});}
 useEffect(()=>{apiRequest('llm-settings').then(apply).catch(e=>setError(e.message));},[]);

 const typedKey=key.trim();
 const hasCredential=!!typedKey||!!settings?.hasSavedKey||!!settings?.hasEnvKey;
 const status=settings?.keyProblem?'密钥异常':settings?.configured?'已就绪':settings&&!settings.enabled?'已停用':'未配置密钥';
 const statusTone=settings?.configured?'ready':settings?.keyProblem?'broken':'idle';

 function reset(){setPendingClear(false);setError('');setMessage('');setProbe(null);}

 async function save(){
  const problem=formProblem(form.model,form.url,typedKey);
  if(problem){reset();setError(problem);return;}
  if(clearKey&&!pendingClear){reset();setPendingClear(true);setMessage('已勾选“删除已保存的密钥”。再次点击“确认删除并保存”才会真正删除。');return;}
  setBusy('save');setError('');setMessage('');setProbe(null);
  try{
   const value=await apiRequest('llm-settings',{model:form.model.trim(),url:form.url.trim(),enabled:form.enabled,apiKey:typedKey||undefined,clearKey},'PUT');
   apply(value);setKey('');setClearKey(false);setPendingClear(false);
   setMessage('已保存。CMS 与后台任务会立即使用新配置。');
   onSaved();
  }catch(e:any){setError(e.message||'保存失败');}
  finally{setBusy('');}
 }

 // 允许用“本次输入、尚未保存”的凭据测试，不必先存后测；测试不会写库。
 async function test(){
  if(!hasCredential){setError('请先填写 API 密钥，或保存一次密钥后再测试');return;}
  setBusy('test');setError('');setMessage('');setProbe(null);
  try{
   const result=await apiRequest('llm-test',{model:form.model.trim()||undefined,url:form.url.trim()||undefined,apiKey:typedKey||undefined});
   setProbe({...result,ok:true});
  }catch(e:any){setProbe({ok:false,message:e.message||'连接失败'});}
  finally{setBusy('');}
 }

 return <section className="llm-settings">
  <header className="llm-head">
   <div>
    <h2>AI 设置 · DeepSeek</h2>
    <p>API 密钥以 AES-256-GCM 加密后保存在数据库，保存后不再回显。留空表示保留已保存的密钥。</p>
   </div>
   <span className={'llm-badge '+statusTone}>{status}</span>
  </header>
  {error&&<p className="form-error" role="alert">{error}</p>}
  {message&&<p className={pendingClear?'llm-warning':'llm-success'} role="status">{message}</p>}
  {settings?.keyProblem&&<p className="llm-warning" role="alert">{settings.keyProblem}</p>}
  {!settings
   ?(error?null:<p>正在加载设置…</p>)
   :<div className="llm-fields">
    <label><span>服务商</span><input value="DeepSeek" disabled/></label>
    <label><span>模型</span><input value={form.model} onChange={e=>setForm({...form,model:e.target.value})} placeholder="deepseek-flash"/></label>
    <label className="wide"><span>接口地址</span><input value={form.url} onChange={e=>setForm({...form,url:e.target.value})} placeholder="https://api.deepseek.com/chat/completions"/>{settings.urlProblem&&<small className="llm-inline-error">{settings.urlProblem}</small>}</label>
    <label className="wide"><span>API 密钥</span><input type="password" autoComplete="new-password" value={key} onChange={e=>{setKey(e.target.value);setPendingClear(false);}} placeholder={settings.hasSavedKey?'已加密保存；留空则保留':'填写 DeepSeek API 密钥'}/>
     <small>当前来源：{settings.keySource}{settings.hasSavedKey&&settings.keyFingerprint?` · 指纹 ${settings.keyFingerprint}`:''}。密钥不会回显，也不会写入日志或审计记录。</small>
    </label>
    {settings.hasSavedKey&&<label className="wide llm-option"><input type="checkbox" checked={clearKey} onChange={e=>{setClearKey(e.target.checked);setPendingClear(false);}}/>删除已保存的密钥（保存后需要重新填写才能翻译）</label>}
    <label className="wide llm-option"><input type="checkbox" checked={form.enabled} onChange={e=>setForm({...form,enabled:e.target.checked})}/>启用自动翻译</label>
    <div className="wide llm-buttons">
     <button className="primary" disabled={!!busy} onClick={save}>{busy==='save'?'处理中…':pendingClear?'确认删除并保存':'保存设置'}</button>
     <button disabled={!!busy||!hasCredential} title={hasCredential?'用当前填写的配置试跑一次翻译（不会保存）':'请先填写 API 密钥，或保存一次密钥后再测试'} onClick={test}>{busy==='test'?'测试中…':'测试连接'}</button>
     {settings.updatedAt&&<span className="llm-meta">上次修改 {new Date(settings.updatedAt).toLocaleString('zh-CN')}{settings.updatedBy?` · ${settings.updatedBy}`:''}</span>}
    </div>
    {probe&&<div className={'wide llm-probe '+(probe.ok?'ok':'bad')} role="status">
     {probe.ok?<><strong>连接成功</strong><p>模型 {probe.model} · 耗时 {probe.durationMs} ms · 凭据来源：{probe.keySource}{probe.usage?.total_tokens?` · 用量 ${probe.usage.total_tokens} tokens`:''}</p><p>返回样例：{probe.sample}</p>{!probe.enabled&&<p className="llm-inline-error">注意：当前“启用自动翻译”未勾选，任务不会真正执行。</p>}</>
      :<><strong>连接失败</strong><p>{probe.message}</p></>}
    </div>}
   </div>}
 </section>;
}
