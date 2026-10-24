/** Warm ivory and forest glass theme. Shared by live preview and static publishing. */
/* 已弃用（2026-10-02 kiln 换肤）：本文件不再被 styles.ts 引用，改这里不会影响任何页面。
   现行样式表 = kiln.css（设计系统）+ kiln-extra.css（CMS 组件层），由 scripts/build-css.mjs 合成 styles.ts。
   保留原因：换肤前的主题记录，便于回滚比对；见换肤记录（不随公开仓库分发）。 */
export const premiumCSS=String.raw`
:root{--ink:#213d35;--ink-soft:#40564f;--paper:#fbfaf6;--surface:#f0efe8;--surface-2:#e9eee7;--line:#d9ded4;--brand:#234a3c;--brand-700:#234a3c;--brand-900:#193b31;--accent:#d9e4bb;--accent-600:#c5d59f;--accent-ink:#466035;--accent-tint:#eef1e5;--muted:#657268;--radius:2px;--shadow-sm:none;--shadow:0 18px 48px #213d3510;--wrap:1480px;--pad:6%}
body{font-family:'Trebuchet MS','Microsoft YaHei','PingFang SC',sans-serif;font-size:15px;background:var(--paper)}
img{height:auto}
h1,h2,h3{font-family:'Palatino Linotype','Book Antiqua',Palatino,Georgia,'Songti SC','SimSun',serif;font-weight:400;letter-spacing:-.035em}
h2{font-size:clamp(2rem,3.5vw,3.7rem);line-height:1.12}
h3{font-size:1.5rem;letter-spacing:-.02em;line-height:1.28}
.site-header{background:var(--paper);min-height:100px;padding:20px var(--pad);gap:24px;border-bottom:1px solid var(--line);backdrop-filter:none}
.wordmark{font-size:29px;letter-spacing:-1.1px;font-weight:400;color:var(--ink)}
.wordmark small{font:8px 'Trebuchet MS',sans-serif;letter-spacing:1.1px;color:var(--muted);margin-top:9px}
.site-header nav>ul{gap:30px;font-size:12px;letter-spacing:.035em}
.site-header nav a{display:inline-block;padding-block:8px}
.site-header nav li ul{top:100%;margin:0;z-index:6}
.header-tools{gap:20px;font-size:11px}.header-phone{display:none}
.quote-link{background:transparent;border:1px solid var(--brand);color:var(--ink);font-weight:400;padding:13px 20px}
.quote-link:hover{background:var(--brand);color:#fff;border-color:var(--brand)}
.language ul{min-width:100px;z-index:6}
.hero{background:var(--paper);color:var(--ink);min-height:0;padding:32px var(--pad) 0;overflow:clip}
.slide{min-height:600px;display:grid;grid-template-columns:1.06fr 1fr;gap:5%;padding:0;align-items:center}
.slide:not(.has-visual){grid-template-columns:1fr;max-width:1050px;margin:auto;padding:60px 0}
.slide[hidden]{display:none}
.slide-copy{max-width:660px;padding:38px 0 50px}
.slide h1,.slide h2{font-size:clamp(2.8rem,4.5vw,5.2rem);line-height:1.06;letter-spacing:-.048em;color:var(--ink);max-width:15ch;margin-bottom:28px;text-wrap:balance;font-weight:400}
.slide .kicker{color:var(--accent-ink);font-size:10px;letter-spacing:.18em;margin-bottom:27px;display:flex;align-items:center;gap:12px}
.slide .kicker:before{content:'';width:28px;height:1px;background:currentColor;flex-shrink:0}
.slide-copy>p:not(.kicker){color:var(--muted);font-size:15px;line-height:1.85;max-width:45ch}
.slide-copy.center .kicker{justify-content:center}
.slide-copy.right .kicker{justify-content:flex-end}
.hero-actions{gap:24px;margin-top:32px}
.button{background:var(--brand);color:#fff;padding:17px 24px;font-size:12px;font-weight:400;border-radius:2px;letter-spacing:.025em}
.button:hover{background:#35604e;color:#fff}
.text-link{font-size:12px;font-weight:400;padding-bottom:6px}
.slide .text-link{color:var(--ink)}
.slide .text-link:hover{color:var(--accent-ink)}
.hero-visual{position:relative;align-self:stretch;background:#e9eee5;min-width:0;min-height:570px;overflow:hidden;border-radius:48% 48% 3px 3px}
.slide .hero-visual picture{position:absolute;inset:0;z-index:auto;width:100%;height:100%;display:block}
.slide .hero-visual picture:after{display:none}
.slide .hero-visual img{width:100%;height:100%;object-fit:cover}
.slide .product-visual img{object-fit:contain;padding:24px 24px 105px;mix-blend-mode:multiply}
.hero-caption{position:absolute;inset:auto 22px 20px;background:#fbfaf6ed;border:1px solid #fff9;display:flex;align-items:center;justify-content:space-between;gap:18px;padding:18px 20px;font-family:Georgia,'Songti SC',serif;font-size:17px;line-height:1.3}
.hero-caption small{display:block;font:9px 'Trebuchet MS',sans-serif;letter-spacing:.15em;text-transform:uppercase;color:var(--muted);margin-bottom:6px}
.hero-caption>span:last-child{font-family:sans-serif;font-size:24px}
.hero-bottom{display:flex;align-items:center;justify-content:space-between;min-height:82px;border-bottom:1px solid var(--line);gap:20px}
.hero-note{position:static;color:var(--muted);font-size:9px;letter-spacing:.12em}.hero-note span{margin:0 16px;color:#99a78f}
.hero-controls{position:static;color:var(--ink);gap:16px;font-size:10px}
.hero-controls button{border:1px solid var(--line);color:var(--ink);background:transparent;width:32px;height:32px}
.hero-controls button:hover{background:var(--surface-2);border-color:var(--brand);color:var(--ink)}
.section{padding:clamp(60px,7vw,108px) var(--pad)}
.section h2:after{display:none}.section>h2{max-width:26ch}
.kicker{font-size:9px;letter-spacing:.19em;font-weight:400;color:var(--accent-ink);margin-bottom:14px}
.section-intro{display:flex;justify-content:space-between;align-items:end;gap:40px;border-bottom:1px solid var(--line);padding-bottom:26px}
.section-intro h2{margin:0;max-width:22ch}.section-intro>p{max-width:38ch;color:var(--muted);font-size:13px;margin:0}
.cards{gap:30px;margin-top:36px;align-items:start}
.card{border:0;background:transparent;padding:0 0 26px;box-shadow:none;border-bottom:1px solid var(--line);border-radius:0;min-width:0}
.card:hover{transform:none;box-shadow:none}
.card picture{display:block;background:var(--surface);aspect-ratio:1/1.08;overflow:hidden;margin-bottom:22px}
.card img{width:100%;height:100%;aspect-ratio:auto;object-fit:contain;margin:0;border-radius:0;padding:24px;background:transparent;transition:transform .5s}
.card:hover img{transform:scale(1.045)}
.collection-latest_articles .card img,.collection-case_studies .card img{object-fit:cover;padding:0}
.serial{font:10px 'Trebuchet MS',sans-serif;letter-spacing:.12em;margin:0 0 12px;color:var(--muted)}
.card h3{margin:0 24px 12px 0}.card p{font-size:12px;line-height:1.8;max-width:42ch;margin-right:24px}
.card-arrow{bottom:26px;right:0;color:var(--ink);font-size:22px}
.card-icon{border-radius:50%;width:64px;height:64px;margin-bottom:24px;background:var(--surface-2)}
.collection-feature_grid,.collection-application_grid{background:var(--surface);max-width:none}
.collection-feature_grid .cards,.collection-application_grid .cards{gap:0}
.collection-feature_grid .card,.collection-application_grid .card{padding:26px 30px;border-bottom:0;border-left:1px solid var(--line)}
.collection-feature_grid .card:first-child,.collection-application_grid .card:first-child{border-left:0}
.collection-feature_grid .card-arrow,.collection-application_grid .card-arrow{right:12px}
.split{gap:8%}.split picture{display:block;min-width:0}.split img{height:auto;aspect-ratio:5/6;object-fit:cover;border-radius:46% 46% 2px 2px;box-shadow:none}
.split p{color:var(--muted);font-size:14px;line-height:1.9}
.banner{background:var(--surface);color:var(--ink);padding:0}.banner-copy h2{color:var(--ink)}.banner-copy p{color:var(--muted)}.banner-media picture{display:block;height:100%}.banner-media img{height:100%}
.statistics{background:var(--surface);color:var(--ink);border-block:1px solid var(--line);border-radius:0}.statistics strong{font-family:Georgia,serif;color:var(--brand);font-weight:400}.statistics p{color:var(--muted)}
.page-title{background:var(--surface);color:var(--ink);padding:70px var(--pad) 62px;border-bottom:1px solid var(--line)}.page-title h1{font-size:clamp(2.4rem,4.5vw,4.8rem);font-weight:400}.page-title .kicker{color:var(--accent-ink)}.page-title>p:last-child{color:var(--muted)}
.cta{background:#e7ecdd;color:var(--ink);border-block:1px solid var(--line);padding-block:84px}.cta h2{color:var(--ink)}.cta>p{color:var(--muted)}
.contact{background:var(--surface);max-width:none}.contact h2{max-width:12ch}.inquiry-form input:not([type=checkbox]),.inquiry-form textarea{background:var(--paper);border-radius:0}
.product-gallery{gap:12px}.product-gallery picture{display:block;aspect-ratio:1;background:var(--surface);overflow:hidden}.product-gallery picture:first-child{grid-column:1/-1;aspect-ratio:1.08}.product-gallery picture img,.product-gallery img:first-child{width:100%;height:100%;aspect-ratio:auto;object-fit:contain;padding:22px;border-radius:0}.product-lead h2{font-size:clamp(2rem,3vw,3rem)}
.faq summary{font-family:Georgia,'Songti SC',serif;font-weight:400;font-size:1.25rem}.faq details{padding:26px 0}.faq details p{font-size:14px}
.testimonials blockquote{background:var(--surface);border-color:var(--line)}.testimonials p{font-family:Georgia,'Songti SC',serif;font-size:1.5rem}
.site-footer{background:var(--brand-900);padding-top:72px;gap:50px}.site-footer strong{font-size:2.5rem;font-weight:400}.site-footer h2{font-family:'Trebuchet MS',sans-serif;font-size:11px;text-transform:uppercase;letter-spacing:.12em}.site-footer small{letter-spacing:.035em}
.service-widget summary{background:var(--brand);color:#fff;border:1px solid #ffffff40;border-radius:2px;padding:14px 20px}.service-widget>div{border-radius:2px}
html[lang=zh] h1,html[lang=zh] h2,html[lang=zh] h3{font-family:'Songti SC','STSong','SimSun',serif;font-weight:400;letter-spacing:.025em;line-height:1.4}
html[lang=zh] .slide h1,html[lang=zh] .slide h2{font-size:clamp(2.3rem,3.8vw,4rem);max-width:13ch}
html[lang=zh] .section h2{font-size:clamp(1.9rem,3vw,3rem)}
@media(min-width:1600px){.hero,.site-header,.page-title,.site-footer{padding-inline:max(6%,calc((100vw - 1320px)/2))}}
@media(max-width:1100px){.site-header{gap:16px;padding-inline:4%}.site-header nav>ul{gap:18px}.header-tools{gap:14px}.header-tools .quote-link{display:none}.hero{padding-inline:5%}.slide{gap:5%;min-height:520px}.hero-visual{min-height:500px}.slide h1,.slide h2{font-size:clamp(2.7rem,5vw,4rem)}.cards{gap:22px;grid-template-columns:repeat(2,minmax(0,1fr))}.collection-feature_grid .card,.collection-application_grid .card{padding:22px}.section-intro{gap:24px}}
@media(max-width:750px){.site-header{min-height:78px;padding:16px 5%}.wordmark{font-size:24px}.wordmark small{font-size:7px}.nav-toggle{display:block;margin-left:auto}.site-header nav{display:none;position:absolute;top:100%;left:0;right:0;padding:18px 6%;background:var(--paper);border-bottom:1px solid var(--line)}.site-header nav.open{display:block}.site-header nav>ul{display:block}.site-header nav li ul{position:static;display:block;border:0;box-shadow:none;padding:6px 18px}.hero{padding:22px 5% 0}.slide{grid-template-columns:1fr;gap:20px;min-height:0}.slide-copy{padding:24px 0 10px;max-width:none}.slide h1,.slide h2{font-size:clamp(2.7rem,8vw,4rem);max-width:19ch;margin-bottom:20px}.slide .kicker{margin-bottom:20px;font-size:9px}.slide-copy>p:not(.kicker){font-size:14px;max-width:55ch}.hero-actions{margin-top:24px}.hero-visual{min-height:0;height:400px;border-radius:45% 45% 2px 2px}.slide .product-visual img{padding:12px 20px 90px}.hero-caption{inset:auto 16px 16px;padding:14px 16px;font-size:16px}.hero-note{display:block;font-size:8px;letter-spacing:.03em}.hero-note span{margin:0 8px}.hero-bottom{min-height:70px}.hero-controls{gap:9px}.hero-controls button{width:29px;height:29px}.section{padding:56px 6%}.section-intro{display:block;padding-bottom:22px}.section-intro>p{margin-top:18px}.cards{gap:26px 18px;margin-top:28px;grid-template-columns:repeat(2,minmax(0,1fr))}.card h3{font-size:1.2rem}.card picture{margin-bottom:16px}.card img{padding:12px}.card p{font-size:11px;margin-right:0}.card-arrow{bottom:4px;font-size:18px}.card{padding-bottom:30px}.split,.contact,.product-lead{grid-template-columns:1fr;gap:32px}.banner{padding:0;grid-template-columns:1fr}.banner-media{min-height:280px}.collection-feature_grid .cards,.collection-application_grid .cards{grid-template-columns:1fr}.collection-feature_grid .card,.collection-application_grid .card{border-left:0;border-bottom:1px solid var(--line);padding:26px 0}.page-title{padding:48px 6%}.site-footer{padding:52px 6% 24px;gap:32px}.site-footer strong{font-size:2rem}.site-footer>div:first-child{grid-column:1/-1}.statistics{grid-template-columns:repeat(2,minmax(0,1fr));gap:28px 16px;padding:30px 22px}html[lang=zh] .slide h1,html[lang=zh] .slide h2{font-size:clamp(2.2rem,7vw,3rem);max-width:16ch}}
@media(max-width:380px){.cards{grid-template-columns:1fr}.header-tools{gap:10px}.wordmark{font-size:21px}.hero-note{max-width:110px}.hero-actions{gap:18px}.button{padding:15px 18px}.site-footer{grid-template-columns:1fr}.hero-visual{height:340px}}
@media(prefers-reduced-motion:reduce){.card img{transition:none}}

/* Editorial company homepage. The same markup serves live preview and static output. */
.home-page{background:#f8f7f1}
.home-page .hero{padding:0 var(--pad);background:#f8f7f1;overflow:hidden}
.home-page .slide{grid-template-columns:minmax(0,.92fr) minmax(0,1.08fr);gap:0;min-height:min(735px,84svh);align-items:stretch}
.home-page .slide:not(.has-visual){min-height:520px;max-width:100%;padding:0}
.home-page .slide-copy{padding:clamp(62px,8vw,118px) clamp(26px,5vw,80px) clamp(55px,7vw,102px) 0;max-width:none;display:flex;flex-direction:column;justify-content:center}
.home-page .slide .kicker{font-size:10px;letter-spacing:.19em;margin-bottom:30px;color:#526c4c}
.home-page .slide h1,.home-page .slide h2{font-size:clamp(3.5rem,5.4vw,6.3rem);line-height:1.04;letter-spacing:-.062em;max-width:11.5ch;margin-bottom:30px}
.home-page .slide-copy>p:not(.kicker){font-size:15px;line-height:1.9;max-width:49ch;color:#5a6c62}
.home-page .hero-actions{margin-top:32px;gap:29px}
.home-page .hero-actions .button{min-width:177px}
.home-page .hero-visual{height:auto;min-height:620px;margin-right:calc(-1 * var(--pad));border-radius:0;background:#d5d8cb}
.home-page .hero-visual picture,.home-page .hero-visual img{width:100%;height:100%}
.home-page .scene-visual img{object-fit:cover;object-position:51% center}
.home-page .hero-visual:after{content:'';position:absolute;inset:0;pointer-events:none;background:linear-gradient(180deg,transparent 49%,rgba(12,32,27,.48));z-index:1}
.home-page .hero-caption{position:absolute;inset:auto 32px 33px;z-index:2;border:0;border-top:1px solid #ffffff82;background:transparent;color:#fff;padding:14px 0 0;box-shadow:none;align-items:end;font:17px Georgia,'Songti SC',serif}
.home-page .hero-caption small{color:#f2f4e9b8;font:9px 'Trebuchet MS',sans-serif;letter-spacing:.18em}
.home-page .hero-caption>span:last-child{font:13px Georgia,serif;letter-spacing:.12em}
.home-page .hero-bottom{min-height:84px;border:0}
.home-page .hero-note{letter-spacing:.16em}
.home-page .hero-controls button{width:38px;height:38px}
.home-overline{font:700 10px 'Trebuchet MS','Microsoft YaHei',sans-serif;letter-spacing:.17em;color:#557451;text-transform:uppercase}
.home-intro{max-width:1480px;margin:auto;padding:clamp(75px,9vw,137px) var(--pad) clamp(65px,7vw,110px);display:grid;grid-template-columns:minmax(0,1.3fr) minmax(280px,.7fr);gap:clamp(40px,7vw,130px);align-items:end}
.home-intro h2{font-size:clamp(2.7rem,4.2vw,5.3rem);line-height:1.13;letter-spacing:-.055em;max-width:16ch;margin:23px 0 0}
.home-intro>p{font-size:17px;line-height:1.85;color:#607168;max-width:47ch;margin:0 0 6px;border-left:1px solid #a5baa3;padding-left:27px}
.home-proof{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));background:#1c4134;color:#f6f6ee;padding:0 var(--pad)}
.home-proof>div{min-height:160px;padding:38px clamp(18px,3vw,52px);display:flex;flex-direction:column;justify-content:space-between;gap:20px;border-left:1px solid #ffffff33}
.home-proof>div:first-child{border-left:0;padding-left:0}
.home-proof span{font:11px Georgia,serif;color:#b9d39a}
.home-proof strong{font:400 clamp(17px,1.5vw,24px) Georgia,'Songti SC',serif;line-height:1.4;max-width:22ch}
.home-collection{max-width:1480px;margin:auto;padding:clamp(78px,9vw,140px) var(--pad) clamp(85px,10vw,155px)}
.home-section-top{display:flex;justify-content:space-between;align-items:end;gap:35px;padding-bottom:30px;border-bottom:1px solid #cfd8cb}
.home-section-top h2{font-size:clamp(2.8rem,4vw,5rem);letter-spacing:-.05em;line-height:1.12;margin:18px 0 0;max-width:16ch}
.home-section-top>div:last-child{max-width:290px;font-size:13px;color:#657369}
.home-section-top>div:last-child p{margin:0 0 15px;line-height:1.8}
.home-section-top a,.home-craft-copy>a{display:inline-flex;align-items:center;gap:19px;color:#234a3c;border-bottom:1px solid #7d9d7f;padding-bottom:5px;font-size:12px;font-weight:700}
.home-section-top a:hover{color:#537b42;border-color:#537b42}
.home-product-grid{display:grid;grid-template-columns:1.2fr 1fr 1fr;gap:clamp(15px,2.2vw,34px);padding-top:34px}
.home-product{min-width:0}
.home-product-image{display:block;position:relative;overflow:hidden;aspect-ratio:4/4.7;background:#eceee6}
.home-product:nth-child(2) .home-product-image{background:#e7ede8}
.home-product:nth-child(3) .home-product-image{background:#eeebe2}
.home-product-image picture{display:block;width:100%;height:100%}
.home-product-image img{width:100%;height:100%;object-fit:contain;padding:clamp(18px,3vw,48px);mix-blend-mode:multiply;transition:transform .5s ease}
.home-product-image:hover img{transform:scale(1.06)}
.home-product-view{position:absolute;right:15px;top:15px;width:34px;height:34px;border:1px solid #839c84;background:#f8f7f1dd;color:#294e3a;display:grid;place-items:center;font-size:18px}
.home-product-placeholder{position:absolute;inset:0;display:grid;place-items:center;font:82px Georgia,serif;color:#c9d2c5}
.home-product-detail{padding-top:18px}
.home-product-detail>span{font:9px 'Trebuchet MS',sans-serif;letter-spacing:.17em;color:#718576;text-transform:uppercase}
.home-product h3{font-size:clamp(1.25rem,1.8vw,1.75rem);line-height:1.3;margin:8px 0 11px}
.home-product h3 a:hover{color:#4b7552}
.home-product p{font-size:12px;line-height:1.75;color:#67776d;max-width:43ch;margin:0}
.home-craft{display:grid;grid-template-columns:minmax(0,1.06fr) minmax(0,.94fr);background:#1b3d32;color:#f5f5e9;min-height:620px}
.home-craft-image{position:relative;min-height:620px;background:#a1a398;overflow:hidden}
.home-craft-image picture,.home-craft-image img{width:100%;height:100%;display:block}
.home-craft-image img{object-fit:cover}
.home-craft-image:after{content:'';position:absolute;inset:45% 0 0;background:linear-gradient(transparent,rgba(8,25,20,.42));pointer-events:none}
.home-craft-image>span{position:absolute;left:6%;bottom:30px;z-index:1;color:#fff;font:10px 'Trebuchet MS',sans-serif;letter-spacing:.14em;text-transform:uppercase}
.home-craft-copy{display:flex;flex-direction:column;align-items:start;justify-content:center;padding:clamp(55px,7vw,118px) clamp(40px,7vw,120px)}
.home-craft-copy .home-overline{color:#c8dba9}
.home-craft-copy h2{font-size:clamp(2.8rem,4vw,5.4rem);line-height:1.12;letter-spacing:-.05em;margin:26px 0}
.home-craft-copy p{color:#d5e0d4;font-size:15px;line-height:1.9;max-width:47ch;margin-bottom:32px}
.home-craft-copy>a{color:#eef3e2;border-color:#a7c09d}
.home-craft-copy>a:hover{color:#d3e9ae}
.home-page .collection-latest_articles{background:#f8f7f1}
.home-page .cta{position:relative;isolation:isolate;overflow:hidden;background:#e4eadc;padding:clamp(85px,9vw,140px) var(--pad)}
.home-page .cta:before{content:'';position:absolute;width:min(65vw,760px);aspect-ratio:1;right:-15%;top:-90%;border:1px solid #8ca98f7a;border-radius:50%;box-shadow:0 0 0 52px #e4eadc,0 0 0 53px #a9bea967,0 0 0 106px #e4eadc,0 0 0 107px #a9bea947;z-index:-1;pointer-events:none}
.home-page .cta h2{font-size:clamp(2.9rem,4.4vw,5.1rem);margin-bottom:28px}
.home-page .cta .button{margin-top:8px}
html[lang=zh] .home-page .slide h1,html[lang=zh] .home-page .slide h2{font-size:clamp(3rem,4.4vw,5.1rem);max-width:12ch}
html[lang=zh] .home-intro h2,html[lang=zh] .home-section-top h2,html[lang=zh] .home-craft h2{line-height:1.28}
@media(max-width:1100px){.home-page .slide{min-height:600px}.home-page .hero-visual{min-height:560px}.home-page .slide h1,.home-page .slide h2{font-size:clamp(3.3rem,5.4vw,4.8rem)}.home-craft,.home-craft-image{min-height:510px}.home-craft-copy{padding:50px 7%}}
@media(max-width:750px){.home-page .hero{padding:0 5%}.home-page .slide{display:flex;flex-direction:column;min-height:0}.home-page .slide-copy{padding:56px 0 45px}.home-page .slide h1,.home-page .slide h2{font-size:clamp(3.2rem,9vw,5.3rem);max-width:14ch}.home-page .hero-visual{height:460px;min-height:0;margin:0 -5.56%;width:111.12%}.home-page .hero-bottom{min-height:73px}.home-intro{grid-template-columns:1fr;gap:30px;padding:75px 6%}.home-intro h2{font-size:clamp(2.8rem,7vw,4.5rem)}.home-intro>p{max-width:65ch}.home-proof{padding:0 6%}.home-proof>div{min-height:145px;padding:28px 14px}.home-proof strong{font-size:16px}.home-collection{padding:76px 6% 90px}.home-product-grid{grid-template-columns:repeat(2,minmax(0,1fr));gap:24px}.home-product:first-child{grid-column:1/-1;display:grid;grid-template-columns:1.1fr .9fr;align-items:center;gap:25px}.home-product:first-child .home-product-image{aspect-ratio:1}.home-product:first-child .home-product-detail{padding:0}.home-craft{grid-template-columns:1fr}.home-craft-image{min-height:0;height:420px}.home-craft-copy{padding:70px 6% 75px}.home-craft-copy h2{max-width:16ch}}
@media(max-width:520px){.home-page .slide-copy{padding:44px 0 39px}.home-page .slide h1,.home-page .slide h2{font-size:clamp(2.65rem,11vw,4rem);max-width:15ch;margin-bottom:20px}.home-page .slide-copy>p:not(.kicker){font-size:14px}.home-page .hero-visual{height:355px}.home-page .hero-caption{left:18px;right:18px;bottom:20px;font-size:14px}.home-page .hero-actions{gap:18px}.home-intro{padding:67px 6% 60px}.home-intro h2{font-size:clamp(2.45rem,9vw,3.7rem)}.home-intro>p{font-size:14px;padding-left:17px}.home-proof{grid-template-columns:1fr}.home-proof>div,.home-proof>div:first-child{min-height:90px;padding:19px 0;flex-direction:row;align-items:center;border-left:0;border-top:1px solid #ffffff30}.home-proof>div:first-child{border-top:0}.home-proof strong{font-size:17px;max-width:22ch}.home-section-top{display:block}.home-section-top h2{font-size:clamp(2.45rem,9vw,3.7rem)}.home-section-top>div:last-child{margin-top:18px}.home-product-grid{grid-template-columns:1fr;gap:36px}.home-product:first-child{grid-column:auto;display:block}.home-product:first-child .home-product-image{aspect-ratio:4/4.7}.home-product:first-child .home-product-detail{padding-top:18px}.home-product-image{aspect-ratio:4/3.9}.home-craft-image{height:330px}.home-craft-copy{padding:58px 6% 65px}.home-craft-copy h2{font-size:clamp(2.5rem,9vw,3.7rem)}}
`;
