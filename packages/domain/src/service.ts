import type {Row} from './types';
export function serviceForVisitor(channels:Row[],country=''){
 const selected=new Map<string,Row>();
 for(const channel of channels){if(channel.country_code&&channel.country_code!==country)continue;const key=channel.id||channel.name;if(selected.has(key))continue;const hours=channel.working_hours||{};let available=true;
  if(hours.days&&typeof hours.days==='object'){try{const parts=new Intl.DateTimeFormat('en-US',{timeZone:hours.timezone||'UTC',weekday:'short',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).formatToParts(new Date());const val=(type:string)=>parts.find(x=>x.type===type)?.value||'';const weekday=['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].indexOf(val('weekday'));const now=Number(val('hour'))*60+Number(val('minute'));const minutes=(s:string)=>{const m=/^(\d{2}):(\d{2})$/.exec(s);return m?Number(m[1])*60+Number(m[2]):-1;};const slots=hours.days[String(weekday)]||[];available=Array.isArray(slots)&&slots.some((slot:any)=>Array.isArray(slot)&&now>=minutes(slot[0])&&now<minutes(slot[1]));}catch{available=false;}}
  const config=channel.config||{};const target=channel.channel_type==='email'?'mailto:'+config.email:channel.channel_type==='phone'?'tel:'+config.phone:channel.channel_type==='whatsapp'?'https://wa.me/'+String(config.phone||'').replace(/\D/g,''):config.url;
  selected.set(key,{name:channel.name,url:target,available,welcome_text:available?channel.welcome_text:hours.offlineText||'',channel_type:channel.channel_type});
 }
 return [...selected.values()];
}
