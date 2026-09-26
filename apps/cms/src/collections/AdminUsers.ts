import type { CollectionConfig } from 'payload';
const admin=(user:any)=>['admin','super_admin'].includes(user?.role);
export const AdminUsers:CollectionConfig={
 slug:'cms-admin-users',auth:{maxLoginAttempts:5,lockTime:600000},admin:{useAsTitle:'email',group:'System'},
 access:{create:({req})=>admin(req.user),read:({req})=>admin(req.user)?true:req.user?{id:{equals:req.user.id}}:false,update:({req})=>admin(req.user)?true:req.user?{id:{equals:req.user.id}}:false,delete:({req,id})=>admin(req.user)&&String(id)!==String(req.user?.id)},
 hooks:{beforeChange:[async({data,operation,req})=>{if(operation==='create'){const {totalDocs}=await req.payload.count({collection:'cms-admin-users',overrideAccess:true,req});if(totalDocs===0)data.role='super_admin';else if(!admin(req.user))data.role='editor';}return data;}]},
 fields:[{name:'displayName',type:'text',required:true},{name:'role',type:'select',defaultValue:'editor',required:true,access:{update:({req})=>admin(req.user)},options:['super_admin','admin','editor','seo_manager','translator','reviewer']}],
};
