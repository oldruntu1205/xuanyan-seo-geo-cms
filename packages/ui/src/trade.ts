// Public-facing sourcing language. Product facts themselves come from CMS translations.
const copy:Record<string,Record<string,string>>={
 en:{sourcing:'Sourcing details',basket:'Inquiry list',add:'Add to inquiry',added:'Added to inquiry list',remove:'Remove',quantity:'Quantity',country:'Destination country / region',delivery:'Requested delivery date',term:'Preferred trade term',notes:'Specifications or customization',attachment:'Attach drawing or brief (PDF or image, up to 5 MB)',moq:'Minimum order',lead:'Typical lead time',days:'days',packaging:'Packaging',custom:'Customization',sample:'Sample policy',applications:'Applications',process:'FROM IDEA TO DELIVERY',processTitle:'A clear path from your brief to production.',step1:'Explore products',step2:'Share requirements',step3:'Discuss the next step',caseTitle:'Made for real applications',empty:'Your inquiry list is empty. Add products as you browse.',invalidFile:'Please attach a PDF or image under 5 MB.',tooMany:'You can request up to 50 products at once.'},
 zh:{sourcing:'采购信息',basket:'询价清单',add:'加入询价',added:'已加入询价清单',remove:'移除',quantity:'数量',country:'目的国家 / 地区',delivery:'期望交付日期',term:'意向贸易条款',notes:'规格或定制要求',attachment:'上传图纸或需求文件（PDF/图片，≤5 MB）',moq:'起订量',lead:'参考交期',days:'天',packaging:'包装方式',custom:'定制范围',sample:'样品政策',applications:'适用场景',process:'从需求到交付',processTitle:'从选品、沟通需求到推进生产，过程清晰可见。',step1:'浏览产品',step2:'提交需求',step3:'讨论下一步',caseTitle:'真实应用场景',empty:'询价清单暂时为空，浏览产品时可以逐件添加。',invalidFile:'请上传 5 MB 以内的 PDF 或图片。',tooMany:'一次最多询价 50 件产品。'},
 de:{sourcing:'Einkaufsinformationen',basket:'Anfrageliste',add:'Zur Anfrage hinzufügen',added:'Zur Anfrageliste hinzugefügt',remove:'Entfernen',quantity:'Menge',country:'Zielland / Region',delivery:'Gewünschter Liefertermin',term:'Bevorzugte Lieferbedingung',notes:'Spezifikationen oder Anpassungen',attachment:'Zeichnung oder Briefing (PDF/Bild, bis 5 MB)',moq:'Mindestmenge',lead:'Richtwert Lieferzeit',days:'Tage',packaging:'Verpackung',custom:'Anpassung',sample:'Muster',applications:'Anwendungen',process:'VON DER IDEE ZUR LIEFERUNG',processTitle:'Ein klarer Weg von Ihrer Anfrage zur Fertigung.',step1:'Produkte entdecken',step2:'Bedarf mitteilen',step3:'Nächste Schritte besprechen',caseTitle:'Praxisbeispiele',empty:'Ihre Anfrageliste ist leer.',invalidFile:'Bitte PDF oder Bild unter 5 MB anhängen.',tooMany:'Maximal 50 Produkte pro Anfrage.'},
 fr:{sourcing:'Informations d\'achat',basket:'Liste de demande',add:'Ajouter à la demande',added:'Ajouté à la demande',remove:'Retirer',quantity:'Quantité',country:'Pays / région de destination',delivery:'Date de livraison souhaitée',term:'Incoterm souhaité',notes:'Spécifications ou personnalisation',attachment:'Plan ou cahier des charges (PDF/image, 5 Mo max)',moq:'Commande minimum',lead:'Délai indicatif',days:'jours',packaging:'Emballage',custom:'Personnalisation',sample:'Échantillons',applications:'Applications',process:'DE L’IDÉE À LA LIVRAISON',processTitle:'Un parcours clair, de votre besoin à la production.',step1:'Explorer les produits',step2:'Préciser votre besoin',step3:'Échanger sur la suite',caseTitle:'Applications concrètes',empty:'Votre liste de demande est vide.',invalidFile:'Joignez un PDF ou une image de moins de 5 Mo.',tooMany:'50 produits maximum par demande.'},
 es:{sourcing:'Información de compra',basket:'Lista de consulta',add:'Añadir a la consulta',added:'Añadido a la consulta',remove:'Quitar',quantity:'Cantidad',country:'País / región de destino',delivery:'Fecha de entrega deseada',term:'Término comercial preferido',notes:'Especificaciones o personalización',attachment:'Plano o solicitud (PDF/imagen, máximo 5 MB)',moq:'Pedido mínimo',lead:'Plazo orientativo',days:'días',packaging:'Embalaje',custom:'Personalización',sample:'Muestras',applications:'Aplicaciones',process:'DE LA IDEA A LA ENTREGA',processTitle:'Un camino claro desde su solicitud hasta la producción.',step1:'Explorar productos',step2:'Compartir requisitos',step3:'Acordar próximos pasos',caseTitle:'Aplicaciones reales',empty:'Su lista de consulta está vacía.',invalidFile:'Adjunte un PDF o imagen de menos de 5 MB.',tooMany:'Máximo 50 productos por consulta.'},
 it:{sourcing:'Informazioni di acquisto',basket:'Lista richieste',add:'Aggiungi alla richiesta',added:'Aggiunto alla richiesta',remove:'Rimuovi',quantity:'Quantità',country:'Paese / area di destinazione',delivery:'Data di consegna richiesta',term:'Condizione commerciale preferita',notes:'Specifiche o personalizzazioni',attachment:'Disegno o brief (PDF/immagine, max 5 MB)',moq:'Ordine minimo',lead:'Tempi indicativi',days:'giorni',packaging:'Imballaggio',custom:'Personalizzazione',sample:'Campioni',applications:'Applicazioni',process:'DALL’IDEA ALLA CONSEGNA',processTitle:'Un percorso chiaro dalla richiesta alla produzione.',step1:'Esplora i prodotti',step2:'Condividi i requisiti',step3:'Definisci i prossimi passi',caseTitle:'Applicazioni reali',empty:'La lista richieste è vuota.',invalidFile:'Allega PDF o immagine sotto 5 MB.',tooMany:'Massimo 50 prodotti per richiesta.'},
 pt:{sourcing:'Informações de compra',basket:'Lista de consulta',add:'Adicionar à consulta',added:'Adicionado à consulta',remove:'Remover',quantity:'Quantidade',country:'País / região de destino',delivery:'Data de entrega desejada',term:'Termo comercial preferido',notes:'Especificações ou personalização',attachment:'Desenho ou briefing (PDF/imagem, até 5 MB)',moq:'Pedido mínimo',lead:'Prazo indicativo',days:'dias',packaging:'Embalagem',custom:'Personalização',sample:'Amostras',applications:'Aplicações',process:'DA IDEIA À ENTREGA',processTitle:'Um caminho claro do pedido à produção.',step1:'Explorar produtos',step2:'Informar requisitos',step3:'Definir próximos passos',caseTitle:'Aplicações reais',empty:'Sua lista de consulta está vazia.',invalidFile:'Anexe PDF ou imagem com menos de 5 MB.',tooMany:'Máximo de 50 produtos por consulta.'},
 ja:{sourcing:'調達情報',basket:'見積依頼リスト',add:'見積依頼に追加',added:'見積依頼に追加しました',remove:'削除',quantity:'数量',country:'仕向国・地域',delivery:'希望納期',term:'希望貿易条件',notes:'仕様・カスタマイズ',attachment:'図面・資料（PDF/画像、5 MB 以下）',moq:'最低発注数量',lead:'参考納期',days:'日',packaging:'梱包',custom:'カスタマイズ',sample:'サンプル',applications:'用途',process:'構想から納品まで',processTitle:'ご相談から生産まで、わかりやすく進めます。',step1:'製品を見る',step2:'要件を伝える',step3:'次の工程を相談',caseTitle:'活用事例',empty:'見積依頼リストは空です。',invalidFile:'5 MB 以下の PDF または画像を添付してください。',tooMany:'一度に依頼できる製品は50点までです。'},
 ko:{sourcing:'구매 정보',basket:'견적 요청 목록',add:'견적 요청에 추가',added:'견적 요청에 추가했습니다',remove:'삭제',quantity:'수량',country:'도착 국가 / 지역',delivery:'희망 납기',term:'희망 무역 조건',notes:'사양 또는 맞춤 요청',attachment:'도면/요청서 (PDF/이미지, 최대 5 MB)',moq:'최소 주문 수량',lead:'예상 납기',days:'일',packaging:'포장',custom:'맞춤 제작',sample:'샘플',applications:'적용 분야',process:'구상부터 납품까지',processTitle:'요청에서 생산까지 명확하게 진행합니다.',step1:'제품 살펴보기',step2:'요구사항 전달',step3:'다음 단계 논의',caseTitle:'실제 적용 사례',empty:'견적 요청 목록이 비어 있습니다.',invalidFile:'5 MB 이하의 PDF 또는 이미지를 첨부하세요.',tooMany:'한 번에 최대 50개 제품까지 요청할 수 있습니다.'}
};
// ── S6/G7（2026-10-09）新增词条：把原先写死在 index.ts / 发布器里的 `locale==='zh'?中:英` 硬编码
// 迁到 9 语言表。为什么单列一张 extraCopy 而不是改写上面 27 个 key 的正文：既有文案（含标点）必须
// **逐字保持**，避免"顺手改文案"造成公开站文案漂移；这里只做「新增 + 合并」，既有 key 一字未动
// （en/zh 的新词条也与原硬编码逐字相同 ⇒ 英/中输出零变化，de/fr/es/it/pt/ja/ko 从"回落英文"变为本语言）。
// 覆盖范围：询盘表单（电话 / 文件控件）· 市场与采购块 · GEO 知识段 · 统计同意 · 发布器生成的系统页标题。
// 完备性由 `.runtime/s467-verify.mjs` 断言（9 语言 × 全部 key 齐备且与本语言其它词条同时存在）。
const extraCopy:Record<string,Record<string,string>>={
 en:{
  phone:'Phone',chooseFile:'Choose a file',noFile:'No file chosen',fileHint:'PDF or image, up to 5 MB.',
  marketCaps:'MARKET & PROCUREMENT',marketTitle:'Ready for your market.',marketSelect:'Select your market',marketGeneral:'General information',marketPortal:'Customer & partner portal',marketPartner:'Become a partner',marketEmpty:'Contact our team for information about your market.',marketMore:'View source',marketValid:'Valid until',marketError:'Information is temporarily unavailable. Please contact our team.',
  geoKey:'Key knowledge',
  analyticsAsk:'Allow usage analytics and inquiry source attribution?',analyticsAllow:'Allow',analyticsDeny:'Decline',analyticsPrefs:'Analytics preferences',
  certCaps:'QUALITY & CERTIFICATIONS',certTitle:'Credentials and proof',
  homeProducts:'Glassware for your application',homeCases:'Applications & cases',homeKnowledge:'Technical knowledge',homeCtaTitle:'Tell us what you need',homeCtaLabel:'Contact our team',
  productsTitle:'Products',knowledgeTitle:'Knowledge',contactTitle:'Contact',searchTitle:'Search',contactHeading:'Let’s discuss your project',
  prevPage:'Previous page',nextPage:'Next page',
 },
 zh:{
  phone:'电话',chooseFile:'选择文件',noFile:'未选择任何文件',fileHint:'PDF 或图片，不超过 5 MB。',
  marketCaps:'市场与采购',marketTitle:'为您的市场，准备就绪。',marketSelect:'选择采购目的地',marketGeneral:'通用资料',marketPortal:'客户与渠道专属入口',marketPartner:'申请渠道合作',marketEmpty:'当前市场的资料正在准备中，可联系团队获取。',marketMore:'查看来源',marketValid:'有效至',marketError:'资料暂时无法加载，请联系团队。',
  geoKey:'核心知识',
  analyticsAsk:'允许访问统计并关联询盘来源？',analyticsAllow:'允许',analyticsDeny:'拒绝',analyticsPrefs:'统计偏好',
  certCaps:'质量与认证',certTitle:'资质与证明',
  homeProducts:'为您的应用选择合适产品',homeCases:'应用与案例',homeKnowledge:'技术与应用知识',homeCtaTitle:'一起讨论您的需求',homeCtaLabel:'联系我们',
  productsTitle:'产品中心',knowledgeTitle:'知识中心',contactTitle:'联系我们',searchTitle:'站内搜索',contactHeading:'说说您的项目',
  prevPage:'上一页',nextPage:'下一页',
 },
 de:{
  phone:'Telefon',chooseFile:'Datei auswählen',noFile:'Keine Datei ausgewählt',fileHint:'PDF oder Bild, bis 5 MB.',
  marketCaps:'MARKT & BESCHAFFUNG',marketTitle:'Bereit für Ihren Markt.',marketSelect:'Zielmarkt wählen',marketGeneral:'Allgemeine Informationen',marketPortal:'Kunden- und Partnerportal',marketPartner:'Partner werden',marketEmpty:'Kontaktieren Sie unser Team für Informationen zu Ihrem Markt.',marketMore:'Quelle ansehen',marketValid:'Gültig bis',marketError:'Informationen sind derzeit nicht verfügbar. Bitte kontaktieren Sie unser Team.',
  geoKey:'Kernwissen',
  analyticsAsk:'Nutzungsanalyse und Zuordnung der Anfragequelle erlauben?',analyticsAllow:'Erlauben',analyticsDeny:'Ablehnen',analyticsPrefs:'Analyse-Einstellungen',
  certCaps:'QUALITÄT & ZERTIFIKATE',certTitle:'Nachweise und Zertifikate',
  homeProducts:'Glaswaren für Ihre Anwendung',homeCases:'Anwendungen & Projekte',homeKnowledge:'Technisches Wissen',homeCtaTitle:'Sagen Sie uns, was Sie brauchen',homeCtaLabel:'Team kontaktieren',
  productsTitle:'Produkte',knowledgeTitle:'Wissen',contactTitle:'Kontakt',searchTitle:'Suche',contactHeading:'Sprechen wir über Ihr Projekt',
  prevPage:'Vorherige Seite',nextPage:'Nächste Seite',
 },
 fr:{
  phone:'Téléphone',chooseFile:'Choisir un fichier',noFile:'Aucun fichier sélectionné',fileHint:'PDF ou image, 5 Mo maximum.',
  marketCaps:'MARCHÉ & APPROVISIONNEMENT',marketTitle:'Prêt pour votre marché.',marketSelect:'Choisir votre marché',marketGeneral:'Informations générales',marketPortal:'Portail clients et partenaires',marketPartner:'Devenir partenaire',marketEmpty:'Contactez notre équipe pour des informations sur votre marché.',marketMore:'Voir la source',marketValid:'Valable jusqu’au',marketError:'Les informations sont temporairement indisponibles. Veuillez contacter notre équipe.',
  geoKey:'Savoir essentiel',
  analyticsAsk:'Autoriser l’analyse d’audience et l’attribution de la source de la demande ?',analyticsAllow:'Autoriser',analyticsDeny:'Refuser',analyticsPrefs:'Préférences d’analyse',
  certCaps:'QUALITÉ & CERTIFICATIONS',certTitle:'Références et preuves',
  homeProducts:'Verrerie pour votre application',homeCases:'Applications et projets',homeKnowledge:'Connaissances techniques',homeCtaTitle:'Dites-nous ce dont vous avez besoin',homeCtaLabel:'Contacter notre équipe',
  productsTitle:'Produits',knowledgeTitle:'Ressources',contactTitle:'Contact',searchTitle:'Recherche',contactHeading:'Parlons de votre projet',
  prevPage:'Page précédente',nextPage:'Page suivante',
 },
 es:{
  phone:'Teléfono',chooseFile:'Elegir un archivo',noFile:'Ningún archivo seleccionado',fileHint:'PDF o imagen, hasta 5 MB.',
  marketCaps:'MERCADO Y COMPRAS',marketTitle:'Listo para su mercado.',marketSelect:'Seleccione su mercado',marketGeneral:'Información general',marketPortal:'Portal de clientes y socios',marketPartner:'Conviértase en socio',marketEmpty:'Contacte con nuestro equipo para información sobre su mercado.',marketMore:'Ver la fuente',marketValid:'Válido hasta',marketError:'La información no está disponible temporalmente. Contacte con nuestro equipo.',
  geoKey:'Conocimiento clave',
  analyticsAsk:'¿Permitir el análisis de uso y la atribución del origen de la consulta?',analyticsAllow:'Permitir',analyticsDeny:'Rechazar',analyticsPrefs:'Preferencias de análisis',
  certCaps:'CALIDAD Y CERTIFICACIONES',certTitle:'Credenciales y pruebas',
  homeProducts:'Material de vidrio para su aplicación',homeCases:'Aplicaciones y casos',homeKnowledge:'Conocimiento técnico',homeCtaTitle:'Cuéntenos qué necesita',homeCtaLabel:'Contactar con el equipo',
  productsTitle:'Productos',knowledgeTitle:'Recursos',contactTitle:'Contacto',searchTitle:'Buscar',contactHeading:'Hablemos de su proyecto',
  prevPage:'Página anterior',nextPage:'Página siguiente',
 },
 it:{
  phone:'Telefono',chooseFile:'Scegli un file',noFile:'Nessun file selezionato',fileHint:'PDF o immagine, fino a 5 MB.',
  marketCaps:'MERCATO E APPROVVIGIONAMENTO',marketTitle:'Pronti per il vostro mercato.',marketSelect:'Seleziona il mercato',marketGeneral:'Informazioni generali',marketPortal:'Portale clienti e partner',marketPartner:'Diventa partner',marketEmpty:'Contatta il nostro team per informazioni sul tuo mercato.',marketMore:'Vedi la fonte',marketValid:'Valido fino al',marketError:'Le informazioni non sono disponibili al momento. Contatta il nostro team.',
  geoKey:'Conoscenza chiave',
  analyticsAsk:'Consentire analisi di utilizzo e attribuzione dell’origine della richiesta?',analyticsAllow:'Consenti',analyticsDeny:'Rifiuta',analyticsPrefs:'Preferenze di analisi',
  certCaps:'QUALITÀ E CERTIFICAZIONI',certTitle:'Credenziali e prove',
  homeProducts:'Vetreria per la tua applicazione',homeCases:'Applicazioni e casi',homeKnowledge:'Conoscenze tecniche',homeCtaTitle:'Dicci di cosa hai bisogno',homeCtaLabel:'Contatta il team',
  productsTitle:'Prodotti',knowledgeTitle:'Risorse',contactTitle:'Contatti',searchTitle:'Cerca',contactHeading:'Parliamo del tuo progetto',
  prevPage:'Pagina precedente',nextPage:'Pagina successiva',
 },
 pt:{
  phone:'Telefone',chooseFile:'Escolher um arquivo',noFile:'Nenhum arquivo selecionado',fileHint:'PDF ou imagem, até 5 MB.',
  marketCaps:'MERCADO E COMPRAS',marketTitle:'Pronto para o seu mercado.',marketSelect:'Selecione o mercado',marketGeneral:'Informações gerais',marketPortal:'Portal de clientes e parceiros',marketPartner:'Torne-se parceiro',marketEmpty:'Fale com a nossa equipe para informações sobre o seu mercado.',marketMore:'Ver a fonte',marketValid:'Válido até',marketError:'As informações estão temporariamente indisponíveis. Fale com a nossa equipe.',
  geoKey:'Conhecimento essencial',
  analyticsAsk:'Permitir análise de uso e atribuição da origem da consulta?',analyticsAllow:'Permitir',analyticsDeny:'Recusar',analyticsPrefs:'Preferências de análise',
  certCaps:'QUALIDADE E CERTIFICAÇÕES',certTitle:'Credenciais e comprovações',
  homeProducts:'Material de vidro para a sua aplicação',homeCases:'Aplicações e casos',homeKnowledge:'Conhecimento técnico',homeCtaTitle:'Diga-nos do que precisa',homeCtaLabel:'Falar com a equipe',
  productsTitle:'Produtos',knowledgeTitle:'Recursos',contactTitle:'Contato',searchTitle:'Buscar',contactHeading:'Vamos falar do seu projeto',
  prevPage:'Página anterior',nextPage:'Página seguinte',
 },
 ja:{
  phone:'電話',chooseFile:'ファイルを選択',noFile:'ファイルが選択されていません',fileHint:'PDF または画像、5 MB まで。',
  marketCaps:'市場と調達',marketTitle:'お客様の市場に合わせてご用意します。',marketSelect:'調達先の地域を選択',marketGeneral:'共通資料',marketPortal:'顧客・パートナー専用ポータル',marketPartner:'パートナー申請',marketEmpty:'お客様の市場に関する資料は、チームまでお問い合わせください。',marketMore:'出典を見る',marketValid:'有効期限',marketError:'資料を一時的に読み込めません。チームまでご連絡ください。',
  geoKey:'核心知識',
  analyticsAsk:'アクセス解析と問い合わせ経路の紐付けを許可しますか？',analyticsAllow:'許可',analyticsDeny:'拒否',analyticsPrefs:'解析の設定',
  certCaps:'品質と認証',certTitle:'資格と証明',
  homeProducts:'用途に合わせたガラス製品',homeCases:'用途と事例',homeKnowledge:'技術と活用の知識',homeCtaTitle:'ご要望をお聞かせください',homeCtaLabel:'お問い合わせ',
  productsTitle:'製品',knowledgeTitle:'資料',contactTitle:'お問い合わせ',searchTitle:'サイト内検索',contactHeading:'プロジェクトについて相談する',
  prevPage:'前のページ',nextPage:'次のページ',
 },
 ko:{
  phone:'전화',chooseFile:'파일 선택',noFile:'선택된 파일 없음',fileHint:'PDF 또는 이미지, 최대 5 MB.',
  marketCaps:'시장 및 조달',marketTitle:'고객님의 시장에 맞춰 준비했습니다.',marketSelect:'구매 지역 선택',marketGeneral:'일반 자료',marketPortal:'고객·파트너 전용 포털',marketPartner:'파트너 신청',marketEmpty:'해당 시장 자료는 당사 팀에 문의해 주세요.',marketMore:'출처 보기',marketValid:'유효 기간',marketError:'자료를 일시적으로 불러올 수 없습니다. 팀에 문의해 주세요.',
  geoKey:'핵심 지식',
  analyticsAsk:'사용 통계 분석과 문의 경로 연결을 허용하시겠습니까?',analyticsAllow:'허용',analyticsDeny:'거부',analyticsPrefs:'통계 설정',
  certCaps:'품질 및 인증',certTitle:'자격과 증빙',
  homeProducts:'용도에 맞춘 유리 제품',homeCases:'적용 사례',homeKnowledge:'기술 및 활용 지식',homeCtaTitle:'필요한 사항을 알려 주세요',homeCtaLabel:'문의하기',
  productsTitle:'제품',knowledgeTitle:'자료',contactTitle:'문의',searchTitle:'사이트 검색',contactHeading:'프로젝트를 이야기해 보세요',
  prevPage:'이전 페이지',nextPage:'다음 페이지',
 },
};
// 合并：既有 key 优先保留（上面那张表一字未动），新 key 只补空缺，不做覆盖 ——
// 这样即便将来 extraCopy 里误写了同名 key，也不会悄悄改写既有文案。
for(const [locale,rows] of Object.entries(extraCopy)){const target=copy[locale]||(copy[locale]={});for(const [key,text] of Object.entries(rows))if(!(key in target))target[key]=text;}
export function tradeText(locale:string,key:string){return (copy[locale]||copy.en)[key]||copy.en[key]||key;}
