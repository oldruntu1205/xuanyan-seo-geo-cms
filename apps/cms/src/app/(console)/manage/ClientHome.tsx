'use client';
import './client-home.css';

// 新手模式（client 角色）的 5 个任务入口，按「用户想做什么」而非「资源表」组织。
export type ClientTask={table:string;title:string;desc:string;icon:string;cta:string};
export const clientTasks:ClientTask[]=[
 {table:'ai_writing',title:'发文章 / 新闻',desc:'一句话说主题，AI 写好草稿，你改完就发。',icon:'✎',cta:'写文章'},
 {table:'product_wizard',title:'发布产品',desc:'一句话说产品，AI 生成完整介绍，改完就发。',icon:'◈',cta:'发产品'},
 {table:'site_settings',title:'修改首页',desc:'改标题、联系方式，或换首页轮播图。',icon:'⚙',cta:'改首页'},
 {table:'inquiry_desk',title:'查看询盘',desc:'客户留言与商机，及时回复跟进。',icon:'✉',cta:'看询盘'},
 {table:'content_item_translations',title:'我的内容',desc:'管理已发布的文章和产品。',icon:'▣',cta:'管内容'},
];

export function ClientHome({onNavigate}:{onNavigate:(table:string)=>void}){
 return <div className="client-home">
  <section className="client-hero">
   <p className="client-kicker">玄砚 · 自助工作台</p>
   <h2>今天想做什么？</h2>
   <p>选一个任务开始，剩下的交给 AI 和系统。</p>
  </section>
  <section className="client-grid" aria-label="常用任务">
   {clientTasks.map(t=>(
    <button key={t.table} type="button" className="client-card" onClick={()=>onNavigate(t.table)}>
     <span className="client-icon" aria-hidden="true">{t.icon}</span>
     <div className="client-card-body"><strong>{t.title}</strong><p>{t.desc}</p></div>
     <span className="client-cta">{t.cta} <b aria-hidden="true">↗</b></span>
    </button>
   ))}
  </section>
  <p className="client-foot">需要更多功能？找管理员开通，或在右上角切换到完整工作台。</p>
 </div>;
}
