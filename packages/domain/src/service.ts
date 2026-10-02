import type {Row} from './types';
// 客服渠道的跳转目标。渲染侧 packages/ui 有一份**同逻辑副本**（那边不能 import domain，
// 否则会把 pg 带进前端包）——改这里时请同步改 packages/ui/src/index.ts 的服务组件。
export function channelURL(channel:Row,welcomeText=''){
 const config=channel.config||{};
 const type=channel.channel_type;
 if(type==='email')return 'mailto:'+String(config.email||'');
 if(type==='phone')return 'tel:'+String(config.phone||'');
 if(type==='whatsapp'){
  // wa.me 深链：把该语言/国家的问候语预填进输入框（访客点开即"有话说"，外贸场景转化明显更好）。
  // 截到 300 字符，避免规则里写了长段落时产出超长 URL。
  const phone=String(config.phone||'').replace(/\D/g,'');
  const text=String(welcomeText||'').trim().slice(0,300);
  return 'https://wa.me/'+phone+(phone&&text?'?text='+encodeURIComponent(text):'');
 }
 return String(config.url||'');
}
export function serviceForVisitor(channels:Row[],country=''){
 const selected=new Map<string,Row>();
 for(const channel of channels){if(channel.country_code&&channel.country_code!==country)continue;const key=channel.id||channel.name;if(selected.has(key))continue;const hours=channel.working_hours||{};let available=true;
  if(hours.days&&typeof hours.days==='object'){try{const parts=new Intl.DateTimeFormat('en-US',{timeZone:hours.timezone||'UTC',weekday:'short',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).formatToParts(new Date());const val=(type:string)=>parts.find(x=>x.type===type)?.value||'';const weekday=['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].indexOf(val('weekday'));const now=Number(val('hour'))*60+Number(val('minute'));const minutes=(s:string)=>{const m=/^(\d{2}):(\d{2})$/.exec(s);return m?Number(m[1])*60+Number(m[2]):-1;};const slots=hours.days[String(weekday)]||[];available=Array.isArray(slots)&&slots.some((slot:any)=>Array.isArray(slot)&&now>=minutes(slot[0])&&now<minutes(slot[1]));}catch{available=false;}}
  const effective=available?channel.welcome_text:hours.offlineText||'';
  selected.set(key,{name:channel.name,url:channelURL(channel,effective),available,welcome_text:effective,channel_type:channel.channel_type});
 }
 return [...selected.values()];
}
