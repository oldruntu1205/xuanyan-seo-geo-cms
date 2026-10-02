/* 已弃用（2026-10-02 kiln 换肤）：本文件不再被 styles.ts 引用，改这里不会影响任何页面。
   市场与采购块的现行样式在 kiln-extra.css 的 G 节（已换成 kiln 的暗暖色板）。 */
export const tradeCSS=String.raw`
/* V3.1 sourcing flow. Shared by dynamic preview and generated HTML. */
.home-page .collection-case_studies{background:#f2f3ec;border-top:1px solid #d7dfd4}
.home-filters{display:flex;flex-wrap:wrap;gap:8px;padding-top:28px}
.home-filters button{border:1px solid #c5d5c4;background:transparent;color:#41624f;padding:10px 16px;font-size:12px;letter-spacing:.03em}
.home-filters button[aria-pressed=true],.home-filters button:hover{background:#234a3c;color:#fff;border-color:#234a3c}
.home-product[hidden]{display:none!important}
.home-page .collection-case_studies .section-intro{max-width:1480px;margin-inline:auto}
.home-page .collection-case_studies .cards{grid-template-columns:repeat(3,minmax(0,1fr));gap:24px;max-width:1480px;margin:auto}
.home-page .collection-case_studies .card{background:#fff;box-shadow:0 14px 35px #1e463016;border:1px solid #dce4d8;padding:0 0 25px;overflow:hidden}
.home-page .collection-case_studies .card picture{display:block;aspect-ratio:1.45;overflow:hidden}
.home-page .collection-case_studies .card img{width:100%;height:100%;object-fit:cover;transition:transform .5s ease}
.home-page .collection-case_studies .card:hover img{transform:scale(1.04)}
.home-page .collection-case_studies .card h3,.home-page .collection-case_studies .card p{margin-inline:24px}
.home-page .collection-case_studies .card h3{font:400 clamp(1.45rem,2vw,2.1rem)/1.2 Georgia,'Songti SC',serif;margin-top:20px}
.home-page .collection-case_studies .card p{font-size:13px;line-height:1.8}
.home-process{max-width:1480px;margin:auto;padding:clamp(80px,9vw,140px) var(--pad);display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1.05fr);gap:clamp(30px,7vw,110px);align-items:end}
.home-process h2{font:400 clamp(2.4rem,4.3vw,5.1rem)/1.13 Georgia,'Songti SC',serif;letter-spacing:-.055em;margin:22px 0 0;max-width:14ch}
.home-process ol{list-style:none;padding:0;margin:0;border-top:1px solid #bbcab9}
.home-process li{display:grid;grid-template-columns:55px 1fr;align-items:center;min-height:91px;border-bottom:1px solid #bbcab9}
.home-process li span{font:13px Georgia,serif;color:#6b8b76}
.home-process li strong{font:400 clamp(1.18rem,1.6vw,1.8rem) Georgia,'Songti SC',serif}
.home-process>a{grid-column:2;justify-self:start;padding:13px 0;border-bottom:1px solid #526f59;font-weight:600;font-size:13px}
.product-actions{display:flex;flex-wrap:wrap;gap:12px;margin-top:24px}
.product-actions .button{margin:0}
.button-outline{border:1px solid #557766!important;background:transparent!important;color:#244c39!important}
.button-outline:hover{background:#e2eadb!important}
.rfq-feedback{display:block;min-height:1.4em;margin-top:12px;color:#2b6847}
.sourcing-facts{background:#eff2e9}
.sourcing-facts dl{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:1px;background:#cdd9cb;border:1px solid #cdd9cb;margin:0}
.sourcing-facts dl>div{background:#fbfaf6;padding:22px 26px;min-height:105px}
.sourcing-facts dt{text-transform:uppercase;font-size:10px;letter-spacing:.16em;color:#688171;margin-bottom:12px}
.sourcing-facts dd{margin:0;font:400 clamp(1rem,1.4vw,1.3rem)/1.5 Georgia,'Songti SC',serif;overflow-wrap:anywhere}
.rfq-count{display:inline-grid;place-items:center;min-width:22px;height:22px;padding:0 4px;border-radius:50%;background:#e7efce;color:#234a3c;font:700 11px 'Trebuchet MS',sans-serif}
.rfq-count[hidden]{display:none}
.quote-short{display:none}
.rfq-list{border-top:1px solid #d4ded1;border-bottom:1px solid #d4ded1;padding:16px 0;margin-bottom:24px}
.rfq-list h3{font:400 1.35rem Georgia,'Songti SC',serif;margin:0 0 12px}
.rfq-list ul{list-style:none;padding:0;margin:0}
.rfq-list li{display:grid;grid-template-columns:minmax(0,1fr) 130px auto;gap:16px;align-items:center;border-top:1px solid #e7eae2;padding:13px 0}
.rfq-list li a{font-weight:600;line-height:1.4}
.rfq-list li a:hover{text-decoration:underline}
.rfq-list li label{margin:0;white-space:nowrap}
.rfq-list li input{width:74px!important;display:inline-block!important;padding:8px!important}
.rfq-list li button{border:0;background:transparent;color:#95634b;text-decoration:underline;padding:8px}
.rfq-empty{font-size:13px;color:#7a897c}
.inquiry-form select{width:100%;display:block;border:1px solid var(--line);border-radius:var(--radius);padding:13px 15px;background:var(--paper);color:var(--ink)}
.inquiry-form input[type=file]{padding:12px!important;font-size:12px!important}
.inquiry-form .form-result{min-height:2em}
@media(max-width:800px){.home-page .collection-case_studies .cards{grid-template-columns:1fr 1fr}.home-process{grid-template-columns:1fr;gap:25px}.home-process>a{grid-column:1}.sourcing-facts dl{grid-template-columns:1fr 1fr}}
@media(max-width:1100px){.header-tools .quote-link{display:inline-flex;align-items:center;gap:5px;padding:9px 11px}.header-tools .quote-long{display:none}.header-tools .quote-short{display:inline;font-size:19px;line-height:1}}
@media(max-width:560px){.home-page .collection-case_studies .cards{grid-template-columns:1fr}.home-process{padding:70px 6%}.home-process h2{font-size:clamp(2.45rem,9vw,3.8rem)}.sourcing-facts dl{grid-template-columns:1fr}.rfq-list li{grid-template-columns:1fr auto}.rfq-list li a{grid-column:1/-1}.rfq-list li label{font-size:11px}}
`;
