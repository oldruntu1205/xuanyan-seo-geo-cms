'use client';

import {useState} from 'react';
import './home-dashboard.css';

export type HomeEntry={table:string;label:string;hint:string;icon:string};
export type PublishJob={id:string;job_type:string;status:string;created_at:string};
export type DashboardData={counts:Record<string,number>;jobs:PublishJob[]};
type Props={entries:HomeEntry[];dashboard:DashboardData;canPublish:boolean;onNavigate:(table:string)=>void;onRebuild:()=>void};

const areas=[
 {id:'content',number:'01',label:'内容与多语',title:'把好内容，变成每种语言的好体验。',description:'从页面、产品与图片出发，用 AI 辅助创作，再把翻译和内容检查接入同一条工作流。',tables:['content_item_translations','product_translations','media_assets','ai_writing','translation_jobs','review_workspace'],accent:'CONTENT · LOCALES'},
 {id:'search',number:'02',label:'搜索与 GEO',title:'让品牌在搜索与 AI 答案中被看见。',description:'研究关键词和竞品，持续观察 GEO 表现，再把证据转成可执行的内容建议。',tables:['growth_workspace','geo_monitor_desk','assistant_desk','agent_desk'],accent:'SEARCH · INTELLIGENCE'},
 {id:'customer',number:'03',label:'客户与经营',title:'从一次询盘，走向可持续的客户关系。',description:'记录客户历史和商机阶段，管理营销触达，并用可追溯报表查看经营结果。',tables:['inquiry_desk','marketing_desk','bi_desk'],accent:'CUSTOMER · GROWTH'},
 {id:'operations',number:'04',label:'协作与发布',title:'让每一次上线，都清楚可控。',description:'分配工作、配置站点、查看发布任务，让内容从草稿走向正式站点。',tables:['v21_desk','publish_jobs','site_settings'],accent:'OPERATIONS · DELIVERY'},
] as const;

const metrics=[
 {key:'content_items',label:'内容条目',resource:'content_item_translations',unit:'篇'},
 {key:'products',label:'产品资料',resource:'product_translations',unit:'项'},
 {key:'media_assets',label:'素材文件',resource:'media_assets',unit:'份'},
 {key:'inquiries',label:'客户询盘',resource:'inquiry_desk',unit:'条'},
];
const jobLabels:Record<string,string>={publish:'页面发布',unpublish:'内容下线',rebuild:'全站重建'};
const statusLabels:Record<string,string>={pending:'等待中',processing:'进行中',completed:'已完成',retrying:'重试中',failed:'失败',cancelled:'已取消'};

export function HomeDashboard({entries,dashboard,canPublish,onNavigate,onRebuild}:Props){
 const [selected,setSelected]=useState<string>('content');
 const availableAreas=areas.map(area=>({...area,items:area.tables.map(table=>entries.find(entry=>entry.table===table)).filter((entry):entry is HomeEntry=>Boolean(entry))})).filter(area=>area.items.length>0);
 const active=availableAreas.find(area=>area.id===selected)||availableAreas[0];
 const lead=entries.find(entry=>entry.table==='content_item_translations')||entries.find(entry=>entry.table==='inquiry_desk')||entries[0];
 const visibleMetrics=metrics.filter(metric=>entries.some(entry=>entry.table===metric.resource)&&typeof dashboard.counts?.[metric.key]==='number');
 const canSeeJobs=entries.some(entry=>entry.table==='publish_jobs');

 return <div className="xy-home">
  <section className="xy-home-hero" aria-labelledby="xy-home-title">
   <div className="xy-home-hero-content">
    <p className="xy-home-kicker"><span className="xy-home-kicker-mark"/>玄砚企业智慧营销 CMS <span className="xy-home-kicker-separator">/</span> YOUR GROWTH WORKSPACE</p>
    <h2 id="xy-home-title">让每一步增长，<br/><em>都有迹可循。</em></h2>
    <p className="xy-home-hero-copy">内容创作、多语展示、GEO / SEO、客户经营与发布协作，<br className="xy-home-desktop-break"/>从这里进入同一条清晰的工作流。</p>
    <div className="xy-home-hero-actions">
     {lead&&<button className="xy-home-cta" onClick={()=>onNavigate(lead.table)}>开始{lead.label}<span aria-hidden="true">↗</span></button>}
     <a href="#xy-home-areas" className="xy-home-text-link">浏览功能区 <span aria-hidden="true">↓</span></a>
    </div>
   </div>
   <div className="xy-home-orbit" aria-hidden="true"><span className="xy-home-orbit-label xy-home-orbit-label-one">CONTENT</span><span className="xy-home-orbit-label xy-home-orbit-label-two">GROWTH</span><span className="xy-home-orbit-label xy-home-orbit-label-three">CUSTOMER</span><span className="xy-home-orbit-core">XY</span></div>
   <div className="xy-home-hero-bottom"><span>一套系统 · 一条增长链路</span><span>SCROLL TO EXPLORE <b aria-hidden="true">↓</b></span></div>
  </section>

  {visibleMetrics.length>0&&<section className="xy-home-metrics" aria-label="站点概览">
   <div className="xy-home-metric-intro"><span>LIVE OVERVIEW</span><strong>此刻的站点</strong></div>
   {visibleMetrics.map(metric=><div className="xy-home-metric" key={metric.key}><span>{metric.label}</span><strong>{dashboard.counts[metric.key].toLocaleString('zh-CN')}<small>{metric.unit}</small></strong></div>)}
  </section>}

  {active&&<section id="xy-home-areas" className="xy-home-areas" aria-labelledby="xy-home-areas-title">
   <div className="xy-home-section-heading"><div><span className="xy-home-overline">EXPLORE YOUR WORKSPACE</span><h2 id="xy-home-areas-title">从工作场景出发。</h2></div><p>选择一个功能区，直接进入正在使用的业务工具。</p></div>
   <div className="xy-home-area-layout">
    <div className="xy-home-area-tabs" role="group" aria-label="功能区">
     {availableAreas.map(area=><button key={area.id} type="button" aria-pressed={active.id===area.id} aria-controls="xy-home-area-panel" className={active.id===area.id?'is-active':''} onClick={()=>setSelected(area.id)}><span className="xy-home-area-number">{area.number}</span><span>{area.label}</span><span aria-hidden="true" className="xy-home-area-arrow">↗</span></button>)}
    </div>
    <div id="xy-home-area-panel" className="xy-home-area-panel" role="region" aria-label={active.label+'功能'}>
     <div className="xy-home-area-intro"><span className="xy-home-overline">{active.accent}</span><h3>{active.title}</h3><p>{active.description}</p></div>
     <div className="xy-home-tools">{active.items.map((item,index)=><button type="button" className="xy-home-tool" key={item.table} onClick={()=>onNavigate(item.table)}><span className="xy-home-tool-top"><span className="xy-home-tool-icon" aria-hidden="true">{item.icon}</span><span className="xy-home-tool-index">{String(index+1).padStart(2,'0')}</span></span><strong>{item.label}</strong><span className="xy-home-tool-copy">{item.hint}</span><span className="xy-home-tool-link">进入功能 <b aria-hidden="true">↗</b></span></button>)}</div>
    </div>
   </div>
  </section>}

  <section className="xy-home-bottom">
   <div className="xy-home-process"><span className="xy-home-overline">FROM IDEA TO LIVE</span><h2>从草稿，到正式发布。</h2><div className="xy-home-process-steps"><div><span>01</span><strong>创建内容</strong><small>页面、文章或产品</small></div><div><span>02</span><strong>检查与翻译</strong><small>多语、图片与 SEO</small></div><div><span>03</span><strong>提交发布</strong><small>进入生成任务</small></div><div><span>04</span><strong>持续观察</strong><small>搜索、客户与报表</small></div></div>{canPublish&&<button type="button" className="xy-home-rebuild" onClick={onRebuild}>重新生成已发布页面 <span aria-hidden="true">↗</span></button>}</div>
   {canSeeJobs&&<div className="xy-home-recent"><div className="xy-home-recent-heading"><span className="xy-home-overline">RECENT ACTIVITY</span><h2>最近发布</h2></div><div className="xy-home-recent-list">{dashboard.jobs?.length?dashboard.jobs.slice(0,4).map(job=><div className="xy-home-job" key={job.id}><span className="xy-home-job-mark"/><div><strong>{jobLabels[job.job_type]||job.job_type}</strong><small>{new Date(job.created_at).toLocaleString('zh-CN')}</small></div><span className={'xy-home-job-status status-'+job.status}>{statusLabels[job.status]||job.status}</span></div>):<p className="xy-home-no-jobs">尚无发布记录。创建并发布内容后，这里会显示任务进度。</p>}</div><button type="button" className="xy-home-all-jobs" onClick={()=>onNavigate('publish_jobs')}>查看全部发布记录 <span aria-hidden="true">↗</span></button></div>}
  </section>
 </div>;
}
