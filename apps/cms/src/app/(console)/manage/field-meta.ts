// 后台字段的中文标签 / 说明 / 可选值 / 资源指引。
//
// 为什么单独一个文件：原来只有 page.tsx 里一张 67 条的 labels 表，而数据库实际有 250 个字段，
// 于是列表和表单里到处是 duration_ms、text_position、overlay_opacity 这类列名，新手看不懂也不知道该填什么。
// 这里按「列名 → 中文」全量覆盖，并对容易误解的字段给出说明；同一列名在不同表含义不同的，用 tableFieldLabels 覆盖。

export const fieldLabels:Record<string,string>={
 // 通用
 id:'编号',created_at:'创建时间',updated_at:'更新时间',deleted_at:'删除时间',created_by:'创建人',updated_by:'更新人',
 is_enabled:'是否启用',sort_order:'排列顺序',priority:'优先级',notes:'备注',status:'状态',type:'类型',code:'代码',
 label:'名称',name:'名称',title:'标题',slug:'网址标识',path:'访问路径',route:'访问路径',description:'详细介绍',
 short_description:'简短介绍',excerpt:'摘要',value:'值',target:'目标',metadata:'扩展数据',settings_json:'扩展设置',
 override_json:'覆盖设置',snapshot:'内容快照',version_number:'版本号',checksum:'校验值',sha256:'文件校验值',etag:'缓存标识',
 format:'格式',module:'模块',model:'模型',provider:'服务提供方',environment:'环境',direction:'方向',directive:'指令',
 target_url:'目标地址',custom_url:'自定义地址',custom_url_override:'自定义地址覆盖',url_count:'URL 数量',
 source_path:'来源路径',source_type:'来源类型',paths:'路径',output_path:'输出路径',
 author_id:'作者',auto_generated:'自动生成',document_type:'文档类型',is_hierarchical:'支持层级分类',
 is_primary:'主要项',is_system:'系统内置',target_translation_id:'目标译文',

 // 媒体 / 图片
 media_id:'图片',media_role:'图片用途',icon_media_id:'图标图片',avatar_media_id:'头像图片',logo_media_id:'站点 Logo',
 favicon_media_id:'浏览器标签图标',default_og_image_id:'默认分享图片',og_image_id:'分享图片',twitter_image_id:'分享图片（Twitter/X）',
 featured_media_id:'主图',desktop_media_id:'桌面端大图',mobile_media_id:'手机端图片',original_filename:'文件名',
 mime_type:'文件类型',file_size:'文件大小',file_path:'文件路径',object_key:'存储路径',storage_provider:'存储方式',
 bucket:'存储空间',width:'宽度',height:'高度',caption:'图片说明',alt_text:'图片描述',

 // 首页轮播
 duration_ms:'展示时长（毫秒）',text_position:'文案位置',overlay_opacity:'图片压暗程度',
 start_at:'开始展示时间',end_at:'结束展示时间',primary_button_text:'主按钮文字',primary_button_url:'主按钮链接',
 secondary_button_text:'次按钮文字',secondary_button_url:'次按钮链接',subtitle:'副标题',

 // 站点设置
 site_name:'站点名称',site_title:'站点标题',primary_domain:'网站地址',default_locale_id:'默认语言',
 company_name:'公司名称',company_email:'联系邮箱',company_phone:'联系电话',company_description:'公司介绍',
 company:'公司',footer_description:'页脚介绍',copyright_text:'版权信息',customer_service_welcome:'客服欢迎语',
 ga_measurement_id:'网站统计 ID（Google Analytics）',search_console_property:'Search Console 资源',
 enable_indexing:'允许搜索引擎收录',timezone:'时区',singleton_key:'单例标记',welcome_text:'欢迎语',working_hours:'工作时间',

 // 多语言
 locale_id:'语言',native_name:'语言本地名称',hreflang:'语言代码',is_default:'默认语言',
 source_locale_id:'源语言',target_locale_id:'目标语言',

 // 内容 / 产品
 content_item_id:'页面 / 文章',content_translation_id:'内容翻译',product_id:'产品',product_name_snapshot:'产品名称快照',
 sku:'产品 SKU',sku_snapshot:'SKU 快照',brand:'品牌',related_product_id:'关联产品',
 product_spec_definition_id:'规格定义',spec_definition_id:'规格',taxonomy_id:'分类',term_id:'分类',
 content_type:'内容类型',parent_id:'上级内容',block_type:'区块类型',data:'区块内容',body:'页面内容',
 template_key:'页面模板',canonical_url:'规范地址',robots_index:'允许搜索引擎索引',robots_follow:'允许抓取链接',
 meta_title:'搜索标题',meta_description:'搜索摘要',features:'产品特点',applications:'应用领域',
 capacity_value:'容量',capacity_unit:'容量单位',width_value:'宽度',height_value:'高度',length_value:'长度',
 weight_value:'重量',weight_unit:'重量单位',dimension_unit:'尺寸单位',unit:'单位',unit_type:'单位类型',
 material_code:'物料编号',data_type:'数据类型',variant_name:'变体名称',quantity:'数量',
 min_order_quantity:'起订量（MOQ）',order_unit:'订购单位',lead_time_days:'参考交期（天）',
 packaging_details:'包装方式',customization_details:'可定制内容',sample_policy:'样品政策',
 carton_quantity:'每箱数量',carton_length_mm:'外箱长（mm）',carton_width_mm:'外箱宽（mm）',carton_height_mm:'外箱高（mm）',gross_weight_kg:'每箱毛重（kg）',
 specification_notes:'规格 / 定制要求',target_delivery_on:'期望交付日期',preferred_incoterm:'意向贸易条款',
 value_text:'文本值',value_number:'数值',value_boolean:'布尔值',is_comparable:'可用于比较',is_filterable:'可用于筛选',

 // 菜单 / 内容结构
 menu_id:'菜单',menu_item_id:'导航项',parent_menu_item_id:'上级导航项',url:'链接地址',link_type:'链接类型',
 anchor_id:'页面内锚点',location:'显示位置',faq_id:'常见问题',question:'问题',answer:'回答',
 hero_slide_id:'轮播',breadcrumb_title:'面包屑标题',

 // SEO / GEO
 seo_id:'SEO 设置',og_title:'分享标题',og_description:'分享描述',og_image_url:'分享图片地址',
 twitter_title:'分享标题（推特/X）',twitter_description:'分享描述（推特/X）',schema_json:'结构化数据',
 schema_markup_id:'结构化标记',schema_type:'结构化类型',geo_profile_id:'GEO 档案',
 entity_name:'知识实体',fact_key:'事实名称',fact_value:'事实内容',source_url:'来源网址',publisher:'来源（出版方）',
 redirect_type:'跳转类型',target_path:'新地址',released:'已发布内容',published_at:'发布时间',last_publish_job_id:'最近发布任务',

 // 询盘 / CRM
 inquiry_id:'询盘',inquiry_number:'询盘号',inquiry_type:'询盘类型',email:'邮箱',phone:'电话',
 country:'国家',country_code:'国家代码',message:'客户需求',consent_at:'同意时间',assigned_to:'负责人',
 next_follow_up_at:'下次跟进时间',ip_address:'来源 IP',user_agent:'浏览器标识',
 utm_source:'渠道来源',utm_medium:'媒介来源',utm_campaign:'活动来源',utm_term:'关键词来源',utm_content:'内容来源',
 crm_account_id:'关联客户',crm_contact_id:'关联联系人',first_name:'名',last_name:'姓',display_name:'显示名称',
 expertise_summary:'专业简介',linked_entity_id:'关联对象',linked_entity_type:'关联对象类型',relation_type:'关联类型',

 // 用户 / 权限 / 审计
 user_id:'用户',role_id:'角色',permission_id:'权限',last_login_at:'最近登录时间',accessed_at:'最后访问时间',
 action:'操作',entity_id:'关联内容',entity_type:'内容类型',old_data:'变更前内容',new_data:'变更后内容',
 reviewed_by:'审核人',requested_by:'发起人',

 // 发布 / 任务 / 集成
 publish_job_id:'发布任务',job_type:'任务类型',scheduled_at:'计划执行时间',started_at:'开始时间',
 finished_at:'完成时间',completed_at:'完成时间',attempt_count:'已尝试次数',max_attempts:'最大尝试次数',
 last_error:'最近错误',error_message:'失败原因',error_details:'错误详情',result_data:'结果数据',provider_response:'上游返回',
 records_read:'读取记录数',records_written:'写入记录数',last_synced_at:'最近同步时间',last_verified_at:'最近验证时间',
 sync_type:'同步类型',integration_id:'集成配置',connection_name:'连接名称',secret_ref:'密钥引用',
 last_generated_at:'最近生成时间',last_hit_at:'最近命中时间',hit_count:'命中次数',

 // 客服
 channel_id:'客服渠道',channel_type:'渠道类型',config:'联系方式',
};

// 同一列名在不同表含义不同时的覆盖（表名 → 列名 → 中文）
export const tableFieldLabels:Record<string,Record<string,string>>={
 roles:{code:'角色标识',name:'角色名称',description:'角色说明'},
 permissions:{code:'权限代码',name:'权限名称',description:'权限说明'},
 locales:{code:'语言代码',name:'语言名称',hreflang:'hreflang 标记',native_name:'本地名称'},
 menus:{code:'菜单标识',name:'菜单名称',location:'显示位置'},
 menu_items:{url:'链接地址',label:'菜单文字',target:'打开方式',parent_id:'上级菜单项'},
 integration_connections:{provider:'服务提供方',name:'连接名称',config:'连接参数'},
 geo_references:{publisher:'来源（出版方）',title:'来源标题',source_url:'来源网址'},
 hero_slides:{sort_order:'展示顺序'},
 hero_slide_translations:{title:'标题',subtitle:'副标题',description:'说明文字'},
 customer_service_rules:{welcome_text:'欢迎语',working_hours:'工作时间'},
 // S3/G2：图片列在分类上是「分类主图」，在产品/页面上是「主图」，语义不同，按表覆盖
 taxonomy_terms:{featured_media_id:'分类主图'},
};

// 需要给新手解释的字段（列名 → 一句说明）
export const fieldHints:Record<string,string>={
 duration_ms:'每张图停留多久，单位毫秒：6000 = 6 秒。留空默认 6 秒。',
 text_position:'文字在图片上的位置：左侧 / 居中 / 右侧。',
 overlay_opacity:'把图片压暗的程度，0 = 不变暗，1 = 全黑。图上文字看不清时把它调大（0.3~0.5 常用）。',
 desktop_media_id:'电脑端显示的大图。建议横图（宽 1920 以上），可在右侧直接「上传新图片」。',
 mobile_media_id:'手机端显示的图片（可选）。不填时手机上用电脑端那张。',
 icon_media_id:'建议正方形小图（如 128×128），可在右侧直接「上传新图片」。',
 logo_media_id:'站点左上角 Logo，可在右侧直接「上传新图片」。',
 favicon_media_id:'浏览器标签页上的小图标，建议 512×512 的 PNG。',
 default_og_image_id:'分享到微信/社交平台时的封面图，建议 1200×630。',
 primary_domain:'站点正式网址，要带 https://，例如 https://www.example.com',
 default_locale_id:'访客打开网站时默认看到的语言。',
 company_email:'公开显示的联系邮箱，「联系我们」会用它。',
 company_phone:'公开显示的联系电话。',
 enable_indexing:'关闭后搜索引擎不会收录本站（robots.txt 会变成禁止抓取）。正式上线后请开启。',
 ga_measurement_id:'Google Analytics 的衡量 ID，形如 G-XXXXXXXXXX；不做统计就留空。',
 sort_order:'数字越小越靠前。',
 start_at:'到这个时间才开始展示；留空表示一直展示。',
 end_at:'到这个时间后不再展示；留空表示一直展示。',
 storage_provider:'上传后自动生成，不需要手填。',
 object_key:'上传后自动生成，不需要手填。',
 sha256:'上传后自动生成的校验值，不需要手填。',
 width:'上传后自动读取，不需要手填。',
 height:'上传后自动读取，不需要手填。',
 file_size:'上传后自动读取，不需要手填。',
 mime_type:'上传后自动识别（如 image/png），不需要手填。',
 config:'按渠道类型填写对应的联系方式；其他高级参数可在下方 JSON 中维护。',
 channel_type:'决定访客点击后打开什么：邮箱发信 / 拨打电话 / WhatsApp 聊天 / 网页链接。',
 welcome_text:'访客打开客服入口时看到的第一句话。',
 working_hours:'高级数据（JSON），可留空。',
 hreflang:'搜索引擎用的语言标记，一般与语言代码一致（en、zh 等）。',
 code:'程序用的标识（英文/小写），创建后不建议再改。',
 route:'访客访问的网址路径，例如 /en/about。',
 slug:'网址里显示的名字，只能用英文、数字和连字符。',
 meta_title:'搜索结果里显示的标题，建议 60 字以内。',
 meta_description:'搜索结果里显示的摘要，建议 150 字以内。',
 robots_index:'关掉后这一页不会被搜索引擎收录。',
 excerpt:'列表页显示的简介，1~2 句话即可。',
 scheduled_at:'到时间自动执行；留空表示立即执行。',
 reviewed_by:'审核通过的人。',
 label:'访客看到的文字。',
};

// 文本字段的可选值（列名 → 选项）：前端渲染成下拉框，免得用户凭记忆输入
export const fieldChoices:Record<string,{value:string;label:string}[]>={
 text_position:[{value:'left',label:'左侧'},{value:'center',label:'居中'},{value:'right',label:'右侧'}],
 target:[{value:'_self',label:'当前窗口打开'},{value:'_blank',label:'新窗口打开'}],
 link_type:[{value:'internal',label:'站内页面'},{value:'external',label:'外部网址'},{value:'anchor',label:'页面内锚点'}],
 redirect_type:[{value:'301',label:'301 永久跳转'},{value:'302',label:'302 临时跳转'}],
 relation_type:[{value:'related',label:'相关产品'},{value:'accessory',label:'配件'},{value:'replacement',label:'替代型号'}],
 storage_provider:[{value:'local',label:'本地存储'},{value:'s3',label:'对象存储（S3）'}],
 sync_type:[{value:'full',label:'全量同步'},{value:'incremental',label:'增量同步'}],
 document_type:[{value:'datasheet',label:'规格书'},{value:'manual',label:'说明书'},{value:'certificate',label:'证书'},{value:'drawing',label:'图纸'}],
};

export const tableHints:Record<string,Record<string,string>>={
 hero_slides:{sort_order:'数字越小越靠前，第一张是首屏主图。'},
 taxonomy_terms:{featured_media_id:'分类卡上的图片。保存后还要到「分类翻译」重新发布该语言的分类，公开站才会显示这张图。'},
};

export const tableChoices:Record<string,Record<string,{value:string;label:string}[]>>={
 // 服务端只给 CHECK 约束里的英文值（email/ai_chat…），这里补中文，避免下拉框显示英文
 customer_service_channels:{channel_type:[
  {value:'email',label:'邮箱'},{value:'phone',label:'电话'},{value:'whatsapp',label:'WhatsApp'},
  {value:'wechat',label:'微信'},{value:'line',label:'LINE'},{value:'messenger',label:'Messenger'},
  {value:'ai_chat',label:'AI 在线客服'},{value:'contact_form',label:'网页表单'},
 ]},
 menus:{location:[{value:'main_header',label:'顶部主导航'},{value:'header',label:'顶部导航'},{value:'footer',label:'页脚'}]},
};

// 资源页顶部的中文指引（表名 → 指引）。没有条目时回退到资源自带的一句话说明。
export const resourceGuides:Record<string,{intro:string;steps?:string[];media?:boolean}>={
 hero_slides:{
  intro:'首页顶部的大图轮播。这里只管「图片和展示方式」；每张图都必须在「轮播翻译」里至少填一种语言的文字，否则这张图不会出现在公开站上（这是「明明加了两张却只显示一张」最常见的原因）。',
  steps:['① 准备图片：新建时可直接点「上传新图片」，或到「图片与文件」上传','⚠ 每张图都要到「轮播翻译」填文字，否则公开站只显示填过文字的那些图','② 选好桌面端大图，按需要再选手机端图片','③ 填写展示时长、文案位置、图片压暗程度','④ 到「轮播翻译」填写每种语言的标题与副标题','⑤ 点工具栏「重新生成已发布页面」，公开站才会更新'],
  media:true,
 },
 hero_slide_translations:{
  intro:'轮播图上的文字，按语言分开填写：先选轮播，再选语言。',
  steps:['① 先在「首页轮播」里建好图片','② 每条记录填一种语言的标题与副标题','③ 保存后点「重新生成已发布页面」'],
 },
 media_assets:{intro:'所有图片和文件都在这里。上传后会被轮播、产品、站点 Logo 等引用；引用时也可以直接在这里找。',media:true},
 // S3/G2：分类主图是本切片新增的字段，运营需要知道「图配在哪、为什么改完前台没变」。
 taxonomy_terms:{
  intro:'产品分类（如「玻璃反应釜」）。分类卡的图片、名称与排序在这里维护；名称与描述按语言在「分类翻译」里填。',
  steps:['① 给分类配图：点「编辑」→「分类主图」选一张图，或直接点「＋ 直接上传新图片」','② 分类名称、网址和描述在「分类翻译」里按语言填写；分类图也建议到「图片与文件」的「图片描述」补各语言的 ALT，否则内容检查会提示缺少图片描述','③ 保存后**必须**到「分类翻译」把该分类的每种语言重新发布一次，公开站才会换图（图片存在分类上，不在译文里；只保存不发布会一直被当成未改动）','④ 分类卡的长相（比例、留白）由全站皮肤决定：只改了样式时，点工具栏「重新生成已发布页面」做全站重建'],
  media:true,
 },
 // S7/G6：页面与文章是「首页板块」的编辑入口，这里说清"改哪里、会影响首页哪一块、改完要做什么"。
 content_item_translations:{
  intro:'页面与文章。每条内容的「页面区块」决定公开页上出现哪些板块、按什么顺序：顺序（↑/↓）、显示/隐藏（「隐藏」= 前台不渲染，且不会被默认内容补回）、以及每块的标题与文案都在那里改。',
  steps:['① 首页 = 各语言 path 为 /{语言} 的那条内容页（如 /en、/zh）；没有实体页时首页由系统文档自动生成，「首页」入口里能看到当前九语言各自用的是哪一种','② 调顺序：进内容页 → 区块编辑器点 ↑/↓；下架某块：勾「隐藏」（别用「移除」，那会丢掉这份配置）','③ 保存后点工具栏「发布」，公开页面才会更新','④ 只改了样式（CSS / 皮肤）：单条发布不会换皮，要到「首页」入口点「重新生成已发布页面」','⑤「质量与认证」不需要在这里手填：发布时从「外贸业务 → 市场内容」的证书卡片自动取数，过期/撤回即不再展示'],
  media:true,
 },
 site_settings:{intro:'全站通用设置：站点名称、网址、Logo、联系方式、统计代码与是否允许搜索引擎收录。'},
 site_setting_translations:{
  intro:'站点名称、公司信息、页脚与客服欢迎语的多语言版本。',
  steps:['① 每种语言一条记录','② 中文版填中文，英文版填英文','③ 保存后点「重新生成已发布页面」'],
 },
 customer_service_channels:{
  intro:'网站上的客服入口。按渠道类型填邮箱、电话或网址即可。',
  steps:['① 渠道类型选「邮箱」/「电话」/「网页链接」','② 填写对应的邮箱、电话或网址','③ 保存后点「重新生成已发布页面」，入口才会显示','④ 欢迎语在「站点翻译」的「客服欢迎语」里按语言填写'],
 },
 customer_service_rules:{intro:'按语言或国家设置客服欢迎语与工作时间（高级功能，可留空）。'},
 menus:{intro:'网站导航菜单；菜单文字在「导航项」与「导航项翻译」里维护。'},
 menu_items:{intro:'导航菜单里的每一项：显示文字、链接地址、是否新窗口打开。'},
 faq_items:{intro:'常见问题；问题与答案在「常见问题翻译」里按语言填写。'},
 seo_metadata:{intro:'页面在搜索结果里的标题、摘要与分享图。留空时系统会用页面标题自动生成。'},
 geo_profiles:{intro:'品牌知识档案：品牌定位、核心事实与信息来源，供搜索引擎和 AI 引用。'},
 inquiries:{intro:'客户通过网站表单提交的询盘。可指派负责人、记录跟进状态。'},
 publish_jobs:{intro:'发布任务记录。每次发布都会产生一条；失败时看「失败原因」。'},
 translation_jobs:{intro:'自动翻译任务的进度与结果。'},
 locales:{intro:'网站支持的语言；默认语言决定访客首次打开看到的语言。'},
};

export function labelFor(name:string,table?:string,fallback?:string):string{
 return (table&&tableFieldLabels[table]?.[name])||fieldLabels[name]||fallback||name;
}
export function hintFor(name:string,table?:string):string{
 return (table&&tableHints[table]?.[name])||fieldHints[name]||'';
}
export function choicesFor(name:string,table?:string):{value:string;label:string}[]|undefined{
 return (table&&tableChoices[table]?.[name])||fieldChoices[name];
}
