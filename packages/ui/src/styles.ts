import {premiumCSS} from './premium';
const baseCSS=String.raw`
@layer reset,base,components;

@layer reset{
*{box-sizing:border-box}
body,h1,h2,h3,p{margin:0}
img{max-width:100%;display:block}
button,input,textarea{font:inherit}
button,a,input,summary{touch-action:manipulation}
a{color:inherit}
button{cursor:pointer}
}

@layer base{
:root{
  --ink:#0d1b2a;
  --ink-soft:#243a52;
  --paper:#ffffff;
  --surface:#f2f5f8;
  --surface-2:#e7edf4;
  --line:#dde4ec;
  --brand:#10365e;
  --brand-700:#0b2745;
  --brand-900:#071628;
  --accent:#c8963e;
  --accent-600:#a97c2b;
  --accent-ink:#86611d;
  --accent-tint:#faf4e8;
  --muted:#5a6b7f;
  --radius:6px;
  --shadow-sm:0 2px 10px rgba(13,27,42,.06);
  --shadow:0 18px 48px rgba(13,27,42,.12);
  --wrap:1380px;
  --pad:5%;
}
html{scroll-behavior:smooth;-webkit-text-size-adjust:100%}
body{background:var(--paper);color:var(--ink);font-family:'Segoe UI',system-ui,-apple-system,'Helvetica Neue',Arial,'Microsoft YaHei','PingFang SC','Noto Sans SC',sans-serif;font-size:16px;line-height:1.65}
a{text-decoration:none}
p{margin:0 0 1em}
h1,h2,h3{font-weight:700;line-height:1.14;letter-spacing:-.02em}
h1{font-size:clamp(2.4rem,5.2vw,4.6rem)}
h2{font-size:clamp(1.75rem,2.9vw,2.8rem);margin-bottom:1.1rem}
h3{font-size:1.3rem;line-height:1.3;letter-spacing:-.01em}
button{color:inherit}
:focus-visible{outline:3px solid var(--accent);outline-offset:4px}
::selection{background:var(--accent);color:#241a06}
html[lang=zh] h1,html[lang=zh] h2,html[lang=zh] h3{letter-spacing:0;line-height:1.35}
html[lang=zh] h1{font-size:clamp(2rem,4.2vw,3.5rem)}
html[lang=zh] h2{font-size:clamp(1.5rem,2.4vw,2.2rem)}
html[lang=zh] p,html[lang=zh] li{line-height:1.9}
}

@layer components{
.skip-link{position:absolute;left:10px;top:-100px;z-index:100;background:var(--brand);color:#fff;padding:10px 16px;border-radius:0 0 var(--radius) 0}
.skip-link:focus{top:0}

.site-header{display:flex;gap:30px;align-items:center;justify-content:space-between;min-height:92px;padding:16px var(--pad);border-bottom:1px solid var(--line);background:rgba(255,255,255,.96);position:sticky;top:0;z-index:5;backdrop-filter:saturate(150%) blur(6px)}
.wordmark{font-family:Georgia,'Times New Roman',serif;font-weight:700;font-size:28px;line-height:1;letter-spacing:-.5px;white-space:nowrap;color:var(--brand)}
.wordmark small{display:block;font:8px 'Segoe UI',sans-serif;font-weight:500;letter-spacing:2.4px;color:var(--muted);margin-top:5px}
.site-header nav>ul{display:flex;align-items:center;list-style:none;padding:0;gap:28px;font-size:14px;font-weight:500}
.site-header nav li{position:relative}
.site-header nav a{color:var(--ink-soft)}
.site-header nav a:hover{color:var(--accent-ink)}
.site-header nav li ul{display:none;position:absolute;top:calc(100% + 14px);left:0;min-width:200px;list-style:none;padding:12px 16px;background:var(--paper);border:1px solid var(--line);border-radius:var(--radius);box-shadow:var(--shadow)}
.site-header nav li:hover>ul,.site-header nav li:focus-within>ul{display:block}
.site-header nav li ul li{padding:7px 0}
.header-tools{display:flex;gap:18px;align-items:center;font-size:13px}
.header-phone{font-weight:600;color:var(--brand);white-space:nowrap}
.header-phone:before{content:'\260E';margin-right:7px;color:var(--accent)}
.header-phone:hover{color:var(--accent-ink)}
.header-tools>a[href$='/search']{font-size:16px;color:var(--muted)}
.header-tools>a[href$='/search']:hover{color:var(--accent-ink)}
.quote-link{background:var(--accent);color:#241a06;border:1px solid var(--accent);padding:11px 20px;border-radius:var(--radius);font-weight:600;font-size:13px;white-space:nowrap;transition:background .2s,color .2s,border-color .2s}
.quote-link:hover{background:var(--accent-600);border-color:var(--accent-600);color:#241a06}
.language{position:relative}
.language summary{cursor:pointer;font-weight:600;color:var(--ink-soft)}
.language ul{position:absolute;background:var(--paper);padding:10px 20px;list-style:none;right:0;border:1px solid var(--line);border-radius:var(--radius);box-shadow:var(--shadow);margin:14px 0 0}
.language ul li{padding:5px 0}
.language ul a:hover{color:var(--accent-ink)}
.nav-toggle{display:none;border:0;background:none;font-size:24px;color:var(--brand)}

.hero{position:relative;min-height:min(880px,92svh);background:var(--brand-900);color:#fff;isolation:isolate;overflow:hidden}
.hero-grid{position:absolute;inset:0;z-index:-1;background:radial-gradient(115% 85% at 80% 12%,rgba(200,150,62,.30),transparent 62%)}
.slide{min-height:min(880px,92svh);display:flex;align-items:center;padding:112px var(--pad);position:relative}
.slide[hidden]{display:none}
.slide picture{position:absolute;inset:0;z-index:-1}
.slide picture:after{content:'';position:absolute;inset:0;background:linear-gradient(100deg,rgba(7,22,40,calc(var(--overlay) + .55)) 0%,rgba(7,22,40,var(--overlay)) 58%,rgba(7,22,40,calc(var(--overlay) + .24)) 100%)}
.slide img{width:100%;height:100%;object-fit:cover}
.slide-copy{max-width:780px;position:relative}
.slide-copy.center{margin:auto;text-align:center}
.slide-copy.right{margin-left:auto;text-align:right}
.slide h1,.slide h2{font-size:clamp(2.5rem,5.4vw,4.9rem);color:#fff;max-width:16ch;margin-bottom:26px;text-wrap:balance}
.slide-copy.center h1,.slide-copy.center h2{max-width:none}
.slide-copy>p:not(.kicker){max-width:56ch;color:rgba(255,255,255,.86);font-size:17px;line-height:1.85}
.slide-copy.center>p:not(.kicker){margin-inline:auto}
.kicker{text-transform:uppercase;font-size:11px;letter-spacing:.22em;font-weight:700;margin-bottom:20px;color:var(--accent-ink)}
.slide .kicker,.page-title .kicker,.cta .kicker{color:var(--accent)}
.hero-actions{display:flex;flex-wrap:wrap;align-items:center;gap:22px;margin-top:38px}
.slide-copy.center .hero-actions{justify-content:center}
.button{display:inline-flex;align-items:center;justify-content:space-between;gap:28px;background:var(--accent);color:#241a06;border:0;padding:16px 28px;font-size:14px;font-weight:600;line-height:1.2;border-radius:var(--radius);transition:background .2s,color .2s,transform .2s}
.button:hover{background:var(--accent-600);color:#241a06;transform:translateY(-2px)}
.text-link{font-size:14px;font-weight:600;border-bottom:1px solid currentColor;padding-bottom:5px}
.text-link:hover{color:var(--accent-ink)}
.slide .text-link{color:#fff}
.slide .text-link:hover{color:var(--accent)}
.hero-controls{display:flex;align-items:center;gap:16px;position:absolute;bottom:36px;right:var(--pad);font-size:12px;color:#fff}
.hero-controls button{color:#fff;border:1px solid rgba(255,255,255,.4);background:rgba(255,255,255,.08);width:42px;height:42px;border-radius:50%;transition:background .2s,color .2s,border-color .2s}
.hero-controls button:hover{background:var(--accent);border-color:var(--accent);color:#241a06}
.hero-note{position:absolute;left:var(--pad);bottom:44px;font-size:10px;letter-spacing:.24em;color:rgba(255,255,255,.68)}

.section{max-width:var(--wrap);margin:auto;padding:clamp(64px,7vw,116px) var(--pad)}
.section h2:after{content:'';display:block;width:56px;height:3px;background:var(--accent);margin-top:22px}
.section>h2{max-width:26ch}
.section>p{max-width:68ch;color:var(--muted)}
.page-title{padding:clamp(76px,9vw,136px) var(--pad) clamp(52px,5vw,78px);background:var(--brand-900);color:#fff;max-width:none}
.page-title h1{max-width:22ch;font-size:clamp(2.2rem,4.6vw,4rem)}
.page-title>p:last-child{margin-top:26px;max-width:62ch;color:rgba(255,255,255,.82)}
.page-title h2:after,.page-title h1:after{display:none}

.banner{position:relative;max-width:none;padding:0;background:var(--brand-900);color:#fff;display:grid;grid-template-columns:1fr 1fr;align-items:stretch}
.banner:not(.has-media){grid-template-columns:1fr}
.banner-media{position:relative;min-height:min(560px,58svh)}
.banner-media img{width:100%;height:100%;object-fit:cover}
.banner-copy{padding:clamp(44px,6vw,84px) clamp(28px,6vw,72px);display:flex;flex-direction:column;justify-content:center;align-items:flex-start}
.banner-copy h2{color:#fff;max-width:20ch}
.banner-copy h2:after{background:var(--accent)}
.banner-copy p{color:rgba(255,255,255,.82);max-width:52ch}
.banner-copy .button{margin-top:18px}

.cards{display:grid;grid-template-columns:repeat(3,1fr);gap:26px;margin-top:44px}
.card{position:relative;background:var(--paper);border:1px solid var(--line);border-top:3px solid var(--accent);border-radius:var(--radius);padding:24px 24px 30px;box-shadow:var(--shadow-sm);transition:transform .25s,box-shadow .25s}
.card:hover{transform:translateY(-5px);box-shadow:var(--shadow)}
.card picture{display:block}
.card img{aspect-ratio:4/3;object-fit:cover;background:var(--surface-2);width:100%;margin-bottom:20px;border-radius:4px}
.serial{font-size:12px;font-weight:700;letter-spacing:.12em;display:inline-block;color:var(--accent-ink);margin:2px 0 14px}
.card-icon{display:inline-flex;align-items:center;justify-content:center;width:52px;height:52px;border-radius:var(--radius);background:var(--accent-tint);color:var(--accent-ink);margin:2px 0 16px}
.card-icon svg{width:28px;height:28px}
.card h3{margin-right:36px;margin-bottom:12px}
.card h3 a:hover{color:var(--accent-ink)}
.card p{font-size:14px;color:var(--muted);margin-right:18px;margin-bottom:0}
.card-arrow{position:absolute;right:24px;bottom:24px;font-size:20px;color:var(--accent);transition:transform .25s}
.card:hover .card-arrow{transform:translate(3px,-3px)}

.split{display:grid;grid-template-columns:1fr 1fr;gap:clamp(32px,5vw,72px);align-items:center}
.split img{width:100%;aspect-ratio:5/4;object-fit:cover;border-radius:var(--radius);box-shadow:var(--shadow)}
.split h2:after{margin-top:20px}

.prose{max-width:960px}
.prose p,.prose li{font-size:17px;line-height:1.9;color:var(--ink-soft)}
.prose h3{margin:34px 0 18px}
.prose blockquote{border-left:3px solid var(--accent);margin-left:0;padding-left:26px;color:var(--muted)}

.statistics{display:grid;grid-template-columns:repeat(4,1fr);gap:30px;background:var(--brand-700);color:#fff;padding:clamp(36px,4vw,56px) clamp(28px,4vw,52px);border-radius:var(--radius)}
.statistics strong{display:block;font-size:clamp(2.2rem,3.4vw,3.2rem);font-weight:700;line-height:1;color:var(--accent)}
.statistics p{font-size:13px;color:rgba(255,255,255,.78);margin:14px 0 0}
.timeline{border-left:2px solid var(--line);margin-left:20px}
.timeline article{padding:0 0 34px 36px;position:relative}
.timeline article:before{content:'';height:11px;width:11px;background:var(--accent);position:absolute;left:-6px;top:9px;border-radius:50%}
.timeline strong{font-size:1.5rem;font-weight:700;color:var(--brand);line-height:1.2}
.timeline p{color:var(--muted);margin:8px 0 0}

.table-scroll{overflow:auto;border:1px solid var(--line);border-radius:var(--radius)}
table{border-collapse:collapse;width:100%;font-size:14px;min-width:420px}
td,th{text-align:left;padding:16px 18px;border-bottom:1px solid var(--line)}
th{background:var(--surface);font-weight:700;font-size:13px;color:var(--brand);white-space:nowrap}
tbody tr:last-child td{border-bottom:0}
tbody tr:nth-child(even){background:#fafbfd}

.faq{max-width:1000px}
.faq details{border-bottom:1px solid var(--line);padding:24px 0}
.faq summary{cursor:pointer;font-size:1.15rem;font-weight:600;color:var(--brand)}
.faq summary:hover{color:var(--accent-ink)}
.faq details p{margin:16px 0 0;color:var(--muted)}

video{width:100%;max-height:80vh;background:var(--brand-900);border-radius:var(--radius)}

.downloads a{display:flex;justify-content:space-between;align-items:center;gap:20px;padding:20px 22px;border:1px solid var(--line);border-bottom:0;font-weight:500}
.downloads a:first-of-type{border-radius:var(--radius) var(--radius) 0 0}
.downloads a:last-of-type{border-bottom:1px solid var(--line);border-radius:0 0 var(--radius) var(--radius)}
.downloads a:hover{background:var(--accent-tint);color:var(--accent-ink)}
.downloads a span{color:var(--accent)}

.testimonials{display:grid;grid-template-columns:repeat(2,1fr);gap:30px}
.testimonials blockquote{margin:0;padding:34px;background:var(--surface);border-left:3px solid var(--accent);border-radius:var(--radius)}
.testimonials p{font-size:1.15rem;line-height:1.8;color:var(--ink-soft)}
.testimonials cite{display:block;margin-top:14px;font-size:13px;font-style:normal;font-weight:600;color:var(--muted)}

.cta{background:var(--brand-700);color:#fff;text-align:center;max-width:none}
.cta h2{color:#fff}
.cta>h2,.cta>p{margin-left:auto;margin-right:auto}
.cta h2:after{margin-inline:auto}
.cta>p{color:rgba(255,255,255,.8);max-width:60ch}
.cta .button{margin-top:14px}

.contact{display:grid;grid-template-columns:1fr 1.2fr;gap:clamp(32px,5vw,72px);border-top:1px solid var(--line)}
.form-grid{display:grid;grid-template-columns:1fr 1fr;gap:20px}
.inquiry-form label,.search-form label{display:block;font-size:12px;font-weight:600;letter-spacing:.04em;color:var(--muted);margin-bottom:20px}
.inquiry-form input:not([type=checkbox]),.inquiry-form textarea,.search-form input{width:100%;display:block;border:1px solid var(--line);border-radius:var(--radius);padding:13px 15px;background:var(--paper);font-size:15px;color:var(--ink);outline-offset:3px}
.inquiry-form input:not([type=checkbox]):focus,.inquiry-form textarea:focus,.search-form input:focus{border-color:var(--accent);box-shadow:0 0 0 3px rgba(200,150,62,.18)}
.inquiry-form textarea{resize:vertical}
.inquiry-form .consent{display:flex;gap:10px;align-items:center;font-size:12px;font-weight:400}
.inquiry-form .trap{position:absolute;left:-10000px;height:1px;width:1px;overflow:hidden}
.inquiry-form .form-result{font-size:14px;padding:15px 0;color:var(--brand)}

.product-lead{display:grid;grid-template-columns:1fr 1fr;gap:clamp(32px,5vw,64px);align-items:start}
.product-gallery{display:grid;grid-template-columns:repeat(3,1fr);gap:14px}
.product-gallery img{aspect-ratio:1;object-fit:contain;width:100%;background:var(--surface);border-radius:var(--radius)}
.product-gallery img:first-child{grid-column:1/-1;aspect-ratio:4/3;object-fit:cover}
.no-image{grid-column:1/-1;aspect-ratio:4/3;background:var(--surface);display:grid;place-items:center;font-size:1.6rem;font-weight:700;color:var(--muted);border-radius:var(--radius)}
.sku{font-size:12px;font-weight:700;letter-spacing:.14em;color:var(--accent-ink);margin:16px 0}
.features{padding:0;list-style:none;margin:22px 0}
.features li{margin:10px 0;padding-left:26px;position:relative;color:var(--ink-soft)}
.features li:before{content:'';position:absolute;left:0;top:.62em;width:9px;height:9px;background:var(--accent);border-radius:50%}

.knowledge{background:var(--surface);max-width:none;padding-inline:max(var(--pad),calc((100vw - 1100px)/2))}
.knowledge dl{margin:26px 0 0}
.knowledge dl>div{display:flex;padding:16px 0;border-bottom:1px solid var(--line);gap:26px}
.knowledge dt{width:35%;font-weight:700;color:var(--brand)}
.knowledge dd{margin:0;flex:1;color:var(--ink-soft)}
.knowledge li{font-size:14px}
.knowledge ol{padding-left:20px}
.knowledge a{color:var(--accent-ink);text-decoration:underline}

.search-form{display:flex;gap:20px;align-items:flex-end}
.search-form label{flex:1;margin-bottom:0}
.search-results article{padding:26px 0;border-bottom:1px solid var(--line)}

.site-footer{padding:clamp(56px,6vw,84px) var(--pad) 28px;background:var(--brand-900);color:rgba(255,255,255,.82);display:grid;grid-template-columns:2fr 1fr 1fr;gap:44px}
.site-footer strong{display:block;font-family:Georgia,serif;font-size:1.6rem;color:#fff}
.site-footer p{font-size:13px;color:rgba(255,255,255,.68);max-width:44ch;margin-top:18px}
.site-footer h2{font-size:1.05rem;color:#fff;margin-bottom:14px}
.site-footer h2:after{display:none}
.site-footer a{display:block;margin-bottom:10px;font-size:13px;color:rgba(255,255,255,.78)}
.site-footer a:hover{color:var(--accent)}
.site-footer small{grid-column:1/-1;border-top:1px solid rgba(255,255,255,.14);padding-top:24px;font-size:11px;color:rgba(255,255,255,.55)}

.service-widget{position:fixed;right:22px;bottom:22px;z-index:10}
.service-widget summary{cursor:pointer;background:var(--accent);color:#241a06;font-weight:600;padding:14px 22px;border-radius:30px;box-shadow:var(--shadow);font-size:13px;list-style:none}
.service-widget summary::-webkit-details-marker{display:none}
.service-widget>div{position:absolute;right:0;bottom:66px;background:var(--paper);width:250px;padding:18px 20px;box-shadow:var(--shadow);border:1px solid var(--line);border-radius:var(--radius)}
.service-widget a{display:block;padding:11px 0;border-bottom:1px solid var(--line);font-size:14px}
.service-widget a:last-of-type{border-bottom:0}
.service-widget a:hover{color:var(--accent-ink)}
.service-widget p{font-size:12px;color:var(--muted);margin:10px 0 0}
}

@media(max-width:1000px){
.site-header{padding:14px 4%;gap:16px;min-height:78px}
.header-tools .quote-link{display:none}
.site-header nav>ul{gap:20px}
.cards{grid-template-columns:repeat(2,1fr)}
.section{padding:64px 6%}
.contact,.product-lead,.split{gap:5%}
.slide{padding:104px 7%}
.statistics{grid-template-columns:repeat(2,1fr)}
.banner{grid-template-columns:1fr 1fr}
}

@media(max-width:650px){
.site-header{min-height:68px;padding:12px 5%}
.wordmark{font-size:22px}
.wordmark small{font-size:6px;letter-spacing:1.4px}
.nav-toggle{display:block;margin-left:auto}
.header-tools{gap:12px}
.header-phone{display:none}
.site-header nav{display:none;position:absolute;top:100%;left:0;right:0;background:var(--paper);border-bottom:1px solid var(--line);box-shadow:var(--shadow);padding:18px 6%}
.site-header nav.open{display:block}
.site-header nav>ul{display:block}
.site-header nav li{padding:10px 0}
.site-header nav li ul{position:static;display:block;border:0;box-shadow:none;background:transparent;padding:6px 18px;margin:0}
.hero,.slide{min-height:620px}
.slide{padding:88px 7% 124px}
.hero-controls{bottom:28px;left:7%;right:auto}
.hero-note{display:none}
.slide h1,.slide h2{font-size:clamp(2rem,8vw,2.6rem)}
.slide-copy>p:not(.kicker){font-size:15px}
.hero-actions{gap:16px}
.cards{grid-template-columns:1fr}
.card img{aspect-ratio:5/4}
.split,.contact,.product-lead,.testimonials{grid-template-columns:1fr;gap:34px}
.section{padding:52px 6%}
.form-grid{grid-template-columns:1fr;gap:16px}
.page-title{padding:64px 6% 46px}
.page-title h1{font-size:clamp(1.9rem,7vw,2.5rem)}
.banner{grid-template-columns:1fr}
.banner-media{min-height:280px}
.site-footer{grid-template-columns:1fr 1fr;gap:30px;padding:52px 6% 24px}
.site-footer>div:first-child{grid-column:1/-1}
.knowledge dl>div{display:block}
.knowledge dt{width:auto;margin-bottom:8px}
.search-form{flex-direction:column;align-items:stretch;gap:15px}
.search-form .button{padding:15px;justify-content:center}
.statistics{grid-template-columns:1fr;gap:22px}
.service-widget{right:12px;bottom:12px}
.site-footer small{padding-bottom:44px}
}

@media(prefers-reduced-motion:reduce){html{scroll-behavior:auto}*{animation:none!important;transition:none!important}}
.analytics-consent{position:fixed;bottom:20px;left:20px;z-index:20;background:var(--paper);border:1px solid var(--line);border-radius:var(--radius);padding:20px;box-shadow:var(--shadow);max-width:340px}
.analytics-consent button{margin-right:12px;padding:9px 18px;border:1px solid var(--line);border-radius:var(--radius);background:var(--accent-tint)}
.analytics-consent button:hover{background:var(--accent);color:#241a06;border-color:var(--accent)}
`;

export const siteCSS=baseCSS+premiumCSS;
