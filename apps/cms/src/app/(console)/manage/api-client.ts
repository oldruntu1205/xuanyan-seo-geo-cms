export type Row=Record<string,any>;

// 业务管理页统一的 /api/v1 客户端。
// 关键点：先读文本、再判状态码、最后才解析 JSON。
// 旧写法直接 await response.json()，遇到 405/204 这类空正文会抛
// "Unexpected end of JSON input"，把真实状态码整个吞掉。
export async function apiRequest(path:string,body?:Row,method?:string):Promise<Row>{
 let response:Response;
 try{
  response=await fetch('/api/v1/'+path,{credentials:'include',method:method||(body?'POST':'GET'),headers:body?{'Content-Type':'application/json'}:undefined,body:body?JSON.stringify(body):undefined});
 }catch{
  throw new Error('无法连接服务器，请检查网络后重试');
 }
 const text=(await response.text()).trim();
 let data:Row={};
 if(text){
  try{data=JSON.parse(text);}
  catch{throw new Error(`服务器返回了无法解析的内容（HTTP ${response.status}），请稍后重试`);}
 }else if(!response.ok){
  throw new Error(response.status===405?`该接口不支持 ${method||(body?'POST':'GET')} 请求（HTTP 405）`:`服务器未返回内容（HTTP ${response.status}）`);
 }
 if(!response.ok)throw new Error(data.error||`请求失败（HTTP ${response.status}）`);
 return data;
}
