// 本文件由 packages/ui/scripts/build-css.mjs 生成，请勿手改。
// 源文件：packages/ui/src/kiln.css + packages/ui/src/kiln-extra.css
// 重新生成：pnpm --filter @suns/ui css:build

/* ── kiln.css · 47673 bytes ── 企业官网共享设计系统 */
export const kilnCSS = `/* OPCTOOLS industrial corporate design. Shared shell, typography and page components. */

*,*::before,*::after{box-sizing:border-box}

:root{
  --char:   #FFFFFF;
  --char-2: #F3F7FA;
  --char-3: #E8F0F6;
  --ember:  #1565A8;
  --glow:   #0F4C7E;
  --kiln:   #DCEAF3;
  --ash:    #0B2545;

  /* CTA —— 橙色强调，只挂询价按钮（.btn-ember）。--ember 是眉标/筛选/分页的蓝，两者不可混用。
     Q1 裁决：常态深蓝字 + 橙底，hover 底色加深并反白。 */
  --cta:       #F28C28;
  --cta-hover: #C96A12;
  --cta-ink:   #0B2545;
  /* 深色底：hero / closing 用 --deep，页脚用 --deep-2（比 --deep 再深一档）。 */
  --deep:      #0B2545;
  --deep-2:    #071B33;
  --hair:   rgba(11,37,69,.13);
  --hair-2: rgba(11,37,69,.07);
  /* flat equivalent of --hair-2 over --char, for places that must not stack */
  --hair-line: #E3EBF0;
  --muted:  #526579;
  --ink:    #30475B;

  --sans: "Bahnschrift","DIN Alternate","Aptos","Segoe UI","PingFang SC","Microsoft YaHei",sans-serif;
  --mono: ui-monospace,"SF Mono","Cascadia Mono",Consolas,monospace;
  --pad: clamp(1.25rem,4vw,3.5rem);
  --ease: cubic-bezier(.22,.61,.36,1);
  --nav-h: clamp(62px,7vw,76px);
}

/* Native form controls follow the light corporate palette. */
html{-webkit-text-size-adjust:100%; scroll-behavior:smooth; color-scheme:light}
body{
  margin:0;
  background:var(--char);
  color:var(--ash);
  font-family:var(--sans);
  font-size:clamp(.95rem,.32vw + .88rem,1.02rem);
  line-height:1.68;
  -webkit-font-smoothing:antialiased;
  overflow-x:hidden;
}
img{display:block; max-width:100%}
a{color:inherit; text-decoration:none}
button{font:inherit; color:inherit; background:none; border:0; cursor:pointer}
h1,h2,h3,h4{margin:0; font-weight:400}
p{margin:0}
.wrap{max-width:1360px; margin:0 auto; padding-inline:var(--pad)}

/* ---------- type: wide, light capitals ---------- */

.caps{
  font-size:.72rem; letter-spacing:.28em; text-transform:uppercase;
  color:var(--ember); font-weight:500;
}
.lede{max-width:58ch; color:var(--muted); font-size:clamp(1rem,.3vw + .94rem,1.08rem); letter-spacing:-.005em}
.h-sec{
  font-size:clamp(1.6rem,3.4vw,2.9rem);
  letter-spacing:.01em; line-height:1.18;
}
.section{padding-block:clamp(4rem,5.5vw,5.5rem)}
.section--tight{padding-top:0}

:focus-visible{outline:2px solid var(--glow); outline-offset:3px}

/* ---------- buttons ---------- */

.btn{
  display:inline-flex; align-items:center; gap:.6rem;
  padding:.95rem 1.7rem;
  font-size:.76rem; letter-spacing:.2em; text-transform:uppercase; font-weight:500;
  border:1px solid var(--hair);
  transition:all .4s var(--ease);
}
.btn:hover{border-color:rgba(11,37,69,.42); background:rgba(11,37,69,.05)}
.btn-ember{
  background:linear-gradient(120deg, #F5A03C, #F28C28);
  border-color:transparent; color:var(--cta-ink);
  box-shadow:0 14px 34px -16px rgba(242,140,40,.55);
}
.btn-ember:hover{background:linear-gradient(120deg,#D9781B,#C96A12); color:#FFFFFF; box-shadow:0 20px 42px -16px rgba(201,106,18,.65)}
.btn-sm{padding:.62rem 1.15rem; font-size:.78rem}
.btn-row{display:flex; flex-wrap:wrap; gap:.7rem; margin-top:2.2rem}

/* ---------- text link ---------- */

.tlink{
  display:inline-flex; align-items:center; gap:.5rem;
  font-size:.78rem; letter-spacing:.2em; text-transform:uppercase;
  color:rgba(11,37,69,.55);
  border-bottom:1px solid var(--hair); padding-bottom:.35rem;
  transition:color .3s var(--ease), border-color .3s var(--ease);
}
.tlink:hover{color:var(--glow); border-bottom-color:rgba(21,101,168,.55)}

/* ============================================================
   NAV
   ============================================================ */

.nav{
  position:sticky; top:0; z-index:60;
  background:rgba(255,255,255,.97);
  backdrop-filter:blur(16px); -webkit-backdrop-filter:blur(16px);
  border-bottom:1px solid var(--hair-2);
}
.nav-in{display:flex; align-items:center; gap:clamp(1rem,3vw,2.4rem); height:var(--nav-h)}
.brand{display:flex; align-items:baseline; gap:.65rem; margin-right:auto}
.brand b{font-size:1.12rem; font-weight:600; letter-spacing:.02em}
.brand i{font-style:normal; font-size:.78rem; letter-spacing:.28em; text-transform:uppercase; color:rgba(11,37,69,.42)}
/* The links stretch to the full height of the bar so the active marker can land
   on the bar's own hairline rather than float under the word. Note the missing
   align-items on .nav-links: leaving it at the default stretch is what lets each
   link fill the bar, and the link centres its own text instead. */
.nav-links{align-self:stretch; display:flex; gap:clamp(.9rem,2.2vw,2rem); font-size:.78rem; letter-spacing:.24em; text-transform:uppercase}
.nav-links a{display:flex; align-items:center; position:relative; color:var(--muted); padding-block:.5rem; transition:color .3s var(--ease)}
.nav-links a:hover{color:var(--ash)}
/* Which section you are in. The rule for this already existed but the builder
   compared it against an item's label instead of its URL, so no page on the site
   ever carried the attribute and nothing was ever marked. On its own the colour
   swap is too quiet to be useful — hover lands on exactly the same value — so the
   active item also draws a 1px ember rule, the same weight as every other
   divider on the site. */
.nav-links a[aria-current="page"]{color:var(--ash)}
.nav-links a[aria-current="page"]::after{content:""; position:absolute; left:0; right:0; bottom:0; height:1px; background:var(--ember)}
.nav-cta{display:flex; align-items:center; gap:.6rem}
.nav-cta .btn{padding:.62rem 1.15rem; font-size:.78rem}
.nav-cta .btn[aria-current="page"]{border-color:var(--ember); color:var(--ash)}
.nav-burger{display:none; width:40px; height:40px; border:1px solid var(--hair); align-items:center; justify-content:center}
.nav-burger i{display:block; width:14px; height:1px; background:var(--ash); position:relative}
.nav-burger i::before,.nav-burger i::after{content:""; position:absolute; left:0; width:14px; height:1px; background:var(--ash); transition:transform .3s var(--ease)}
.nav-burger i::before{top:-5px}
.nav-burger i::after{top:5px}
.nav[data-open="true"] .nav-burger i{background:transparent}
.nav[data-open="true"] .nav-burger i::before{transform:translateY(5px) rotate(45deg)}
.nav[data-open="true"] .nav-burger i::after{transform:translateY(-5px) rotate(-45deg)}
.nav-drawer{display:none; border-bottom:1px solid var(--hair); background:var(--char-2)}
.nav[data-open="true"] .nav-drawer{display:block}
.nav-drawer ul{list-style:none; margin:0; padding:.4rem var(--pad) 1rem}
.nav-drawer li+li{border-top:1px solid var(--hair-2)}
.nav-drawer a{display:block; padding:.95rem 0; font-size:.76rem; letter-spacing:.22em; text-transform:uppercase}
/* Same marker, but a bottom rule would double up with the li's own border-top,
   so the drawer states it in colour instead — and keeps it a distinct one. */
.nav-drawer a[aria-current="page"]{color:var(--glow)}

/* ============================================================
   HERO — an object in front of the furnace (home)
   ============================================================ */

.hero{position:relative; overflow:hidden}
/* the furnace door, sitting behind everything */
.hero::before{
  content:"";
  position:absolute; right:-6%; top:6%; width:min(70vw,900px); aspect-ratio:1;
  background:radial-gradient(circle at 50% 50%,
      rgba(21,101,168,.24) 0%,
      rgba(15,76,126,.16) 26%,
      rgba(15,76,126,.06) 46%,
      transparent 68%);
  pointer-events:none;
}
.hero::after{
  content:"";
  position:absolute; inset:auto 0 0 0; height:1px;
  background:linear-gradient(90deg, transparent, rgba(15,76,126,.5), transparent);
}
.hero-in{
  position:relative;
  display:grid; grid-template-columns:minmax(0,1fr) minmax(0,1fr);
  gap:clamp(2rem,4vw,4rem); align-items:center;
  padding-block:clamp(2.5rem,5vw,4.5rem) clamp(3rem,6vw,5.5rem);
}
.hero-copy>*{animation:ember-rise .95s var(--ease) both}
@keyframes ember-rise{from{opacity:0; transform:translateY(22px)} to{opacity:1; transform:none}}
.hero-copy>*:nth-child(1){animation-delay:.05s}
.hero-copy>*:nth-child(2){animation-delay:.14s}
.hero-copy>*:nth-child(3){animation-delay:.22s}
.hero-copy>*:nth-child(4){animation-delay:.3s}

.hero h1{
  font-size:clamp(2.1rem,4.9vw,4.3rem);
  font-weight:300;
  line-height:1.12;
  letter-spacing:.005em;
  margin-block:1rem 1.5rem;
}
.hero h1 em{
  font-style:normal;
  background:linear-gradient(100deg, #4FA3D1, #1565A8 62%);
  -webkit-background-clip:text; background-clip:text; color:transparent;
}
.hero-acts{display:flex; flex-wrap:wrap; gap:.7rem; margin-top:2.2rem}

.hero-art{position:relative; aspect-ratio:1/1; display:grid; place-items:center; padding:6%}
/* the glow sits between object and room */
.hero-art::before{
  content:"";
  position:absolute; inset:8%;
  background:radial-gradient(circle at 50% 52%, rgba(21,101,168,.22), rgba(15,76,126,.08) 42%, transparent 68%);
  filter:blur(14px);
}
/* Absolutely positioned on purpose. In flow, the image's \`height:100%\` and the
   container's \`aspect-ratio\` depend on each other; once the art sits alone in a
   single-column grid (<=880px) nothing else sets the row height, and the browser
   resolves the cycle by falling back to the file's intrinsic 480x680 — which then
   overflows the column and prints straight over the headline. Taking the image out
   of flow makes the box purely geometric. */
.hero-art img{
  position:absolute; z-index:2;
  left:6%; top:6%; width:88%; height:88%;
  object-fit:contain;
  filter:
    drop-shadow(0 0 1.4px rgba(21,101,168,.5))
    drop-shadow(0 22px 40px rgba(0,0,0,.75));
  animation:ember-rise 1.1s var(--ease) both .16s;
}
.hero-stamp{
  position:absolute; z-index:3; left:0; bottom:2%;
  font-size:.78rem; letter-spacing:.26em; text-transform:uppercase;
  color:rgba(11,37,69,.4);
}

/* ============================================================
   PAGE HEAD — interior pages
   ============================================================ */

.page-head{
  position:relative; overflow:hidden;
  border-bottom:1px solid var(--hair);
  padding-block:clamp(2.4rem,5vw,4.2rem) clamp(2.2rem,4.4vw,3.4rem);
}
.page-head::before{
  content:""; position:absolute; right:-12%; top:-46%;
  width:min(62vw,760px); aspect-ratio:1;
  background:radial-gradient(circle, rgba(15,76,126,.15), transparent 66%);
  pointer-events:none;
}
.page-head .wrap{position:relative}
.page-head h1{
  font-size:clamp(1.9rem,4.4vw,3.4rem);
  font-weight:300; line-height:1.14; letter-spacing:.005em;
  margin-top:1rem; max-width:26ch;
}
.page-head .lede{margin-top:1.3rem}
.page-head--split .wrap{
  display:grid; grid-template-columns:minmax(0,1fr) auto;
  gap:clamp(1.6rem,4vw,3.4rem); align-items:end;
}

.crumbs{
  display:flex; flex-wrap:wrap; align-items:center; gap:.6rem;
  font-size:.78rem; letter-spacing:.2em; text-transform:uppercase;
  color:rgba(11,37,69,.38); margin-bottom:1.5rem;
}
.crumbs a{color:var(--muted)}
.crumbs a:hover{color:var(--ash)}
.crumbs .sep{opacity:.4}

/* ============================================================
   SECTION HEADER
   ============================================================ */

.sec-head{display:flex; flex-wrap:wrap; align-items:flex-end; gap:1.5rem; margin-bottom:clamp(1.8rem,3.4vw,3rem)}
.sec-head .t{flex:1 1 22rem}
.sec-head .lede{margin-top:1rem}

/* ============================================================
   SPECIMEN GRID (catalogue)
   ============================================================ */

.filters{display:flex; flex-wrap:wrap; gap:.5rem; margin-bottom:clamp(1.6rem,3vw,2.4rem)}
.filters button{
  padding:.6rem 1.15rem;
  font-size:.78rem; letter-spacing:.2em; text-transform:uppercase;
  border:1px solid var(--hair); color:var(--muted);
  transition:all .35s var(--ease);
}
.filters button:hover{color:var(--ash); border-color:rgba(11,37,69,.4)}
.filters button[aria-pressed="true"]{background:var(--ember); border-color:var(--ember); color:#FFFFFF}

/* The tile mesh separates tiles with a 1px hairline. It used to be drawn as a
   wash behind the grid with a 1px gap letting it through, which only reads
   correctly while every cell is occupied: a ragged last row — four tiles in a
   three-column grid — exposed the wash as one large pale rectangle beside the
   final tile. The separators are therefore drawn on the cells themselves — any
   direct child of the grid, whether a product .card or a .topic — as a 1px ring,
   and the grid keeps the room tone behind it, so an unoccupied cell simply
   disappears.
   The ring is opaque on purpose. Two semi-transparent rings meet in the same
   1px gap, and alpha would composite them into a line twice as bright as the
   others; --hair-line is the flat colour that --hair-2 resolves to over --char,
   so a ring over a ring lands on exactly the same pixel value. */
.grid{display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:1px; background:var(--char)}
.grid--2{grid-template-columns:repeat(2,minmax(0,1fr))}
.grid--4{grid-template-columns:repeat(4,minmax(0,1fr))}
.grid > *{box-shadow:0 0 0 1px var(--hair-line)}
.card{
  position:relative; background:var(--char);
  display:flex; flex-direction:column;
  transition:background .45s var(--ease);
}
.card:hover{background:var(--char-2)}
.card-art{position:relative; aspect-ratio:1/1; display:grid; place-items:center; overflow:hidden}
/* each tile carries its own small furnace */
.card-art::before{
  content:""; position:absolute; inset:16%;
  background:radial-gradient(circle at 50% 56%, rgba(21,101,168,.2), rgba(15,76,126,.06) 44%, transparent 68%);
  opacity:.55; transition:opacity .5s var(--ease);
}
.card:hover .card-art::before{opacity:1}
.card-art img{
  position:relative; z-index:2; width:66%;
  transition:transform .55s var(--ease);
  filter:drop-shadow(0 0 1.2px rgba(21,101,168,.4)) drop-shadow(0 14px 24px rgba(0,0,0,.7));
}
.card:hover .card-art img{transform:translateY(-6px)}
/* A handful of lines cannot become cut-outs: they are clear glass on a studio
   sweep, or sealed goods photographed on white. Those are rendered as specimen
   plates instead — the sweep is flat-fielded to one ash tone, so the plate is a
   deliberate element rather than a leftover backdrop. */
.card--plate .card-art img{
  width:72%;
  border-radius:3px;
  filter:drop-shadow(0 14px 26px rgba(0,0,0,.62));
}
.card--plate .card-art::before{opacity:.28}
.card--plate:hover .card-art::before{opacity:.5}
.card--plate:hover .card-art img{transform:translateY(-4px)}
/* Lines we know are in the range but have not photographed yet. Rather than
   borrow a neighbour's picture and hope nobody looks, the tile shows an empty
   drawing frame — which is what a catalogue page actually looks like the week
   before the samples come back. */
.card--plot .card-art::before{display:none}
.plot{
  position:relative; z-index:2;
  width:64%; aspect-ratio:1/1;
  display:grid; place-items:center; text-align:center; padding:1rem;
  border:1px dashed rgba(11,37,69,.22);
  font-size:.78rem; letter-spacing:.2em; text-transform:uppercase; line-height:1.7;
  color:rgba(11,37,69,.34);
  transition:border-color .45s var(--ease), color .45s var(--ease);
}
.card--plot:hover .plot{border-color:rgba(21,101,168,.45); color:var(--glow)}
/* the full-width stage frame reads a touch smaller so it does not compete
   with the panel it sits in */
.pd-art--plot .plot{width:56%}
.card-body{padding:1.15rem 1.35rem 1.45rem; border-top:1px solid var(--hair-2); display:flex; flex-direction:column; gap:.5rem; flex:1}
.card-cat{font-size:.78rem; letter-spacing:.22em; text-transform:uppercase; color:var(--ember)}
.card h3{font-size:.98rem; letter-spacing:.005em; line-height:1.4}
.card .spec{font-size:.78rem; letter-spacing:.06em; color:rgba(11,37,69,.42); margin-top:auto; padding-top:.7rem}
.cat-foot{margin-top:clamp(1.8rem,3.4vw,2.6rem)}

/* ============================================================
   CREDENTIALS / FACTS
   ============================================================ */

.creds{border-block:1px solid var(--hair)}
.creds-in{display:grid; grid-template-columns:repeat(4,minmax(0,1fr))}
.cred{padding:clamp(1.5rem,3vw,2.2rem) clamp(1rem,2vw,1.6rem); border-left:1px solid var(--hair-2)}
.cred:first-child{border-left:0}
.cred dt{font-size:.78rem; letter-spacing:.24em; text-transform:uppercase; color:rgba(11,37,69,.42); margin-bottom:.8rem}
.cred dd{margin:0; font-size:clamp(1rem,1.4vw,1.25rem); font-weight:400; letter-spacing:.01em}
.cred dd small{display:block; font-size:.74rem; color:var(--muted); margin-top:.35rem; letter-spacing:0}

.facts{display:grid; grid-template-columns:repeat(4,minmax(0,1fr)); border:1px solid var(--hair)}
.fact{padding:clamp(1.3rem,2.6vw,2rem) clamp(1rem,2vw,1.5rem); border-right:1px solid var(--hair-2)}
.fact:last-child{border-right:0}
.fact b{display:block; font-size:clamp(1.45rem,2.8vw,2.1rem); font-weight:300; letter-spacing:.005em; color:var(--glow)}
.fact span{display:block; margin-top:.5rem; font-size:.78rem; letter-spacing:.18em; text-transform:uppercase; color:rgba(11,37,69,.42)}

/* ============================================================
   EDITORIAL ROWS — article + guide indexes
   ============================================================ */

.rows{border-top:1px solid var(--hair)}
.row{
  display:grid; grid-template-columns:8.5rem minmax(0,1fr) auto;
  gap:clamp(.5rem,2vw,2.6rem); align-items:start;
  padding:clamp(1.5rem,3vw,2.4rem) clamp(.6rem,1.6vw,1.2rem);
  border-bottom:1px solid var(--hair-2);
  transition:background .4s var(--ease);
}
.row:hover{background:var(--char-2)}
.row .meta{font-size:.78rem; letter-spacing:.2em; text-transform:uppercase; color:rgba(11,37,69,.42); padding-top:.35rem}
.row .meta b{display:block; color:var(--ember); font-weight:500; margin-bottom:.45rem}
.row h3{font-size:clamp(1.05rem,1.7vw,1.32rem); letter-spacing:.005em; line-height:1.3; margin-bottom:.65rem}
.row p{color:var(--muted); font-size:.9rem; max-width:64ch}
.row .go{font-size:.78rem; letter-spacing:.2em; text-transform:uppercase; color:rgba(11,37,69,.38); white-space:nowrap; padding-top:.4rem; transition:color .35s var(--ease)}
.row:hover .go{color:var(--glow)}

.rows--plain .row{grid-template-columns:minmax(0,1fr) auto}

/* ============================================================
   PROSE — long-form body copy
   ============================================================ */

.prose{max-width:70ch}
.prose>*+*{margin-top:1.35rem}
.prose h2{
  font-size:clamp(1.35rem,2.5vw,1.9rem); line-height:1.24; letter-spacing:.01em;
  margin-top:clamp(2.6rem,4.4vw,3.6rem);
}
.prose h2:first-child{margin-top:0}
.prose h3{font-size:clamp(1.06rem,1.6vw,1.24rem); font-weight:500; letter-spacing:.01em; margin-top:2.1rem}
.prose p{color:var(--ink)}
.prose ul,.prose ol{margin-top:1.2rem; padding-left:1.3rem; color:var(--ink)}
.prose li+li{margin-top:.5rem}
.prose li::marker{color:var(--ember)}
.prose a{color:var(--glow); border-bottom:1px solid rgba(21,101,168,.35); transition:border-color .3s var(--ease)}
.prose a:hover{border-bottom-color:var(--glow)}
.prose strong{font-weight:600}
.prose em{color:var(--glow); font-style:normal}
.prose hr{border:0; border-top:1px solid var(--hair); margin-top:2.8rem}
.prose blockquote{
  margin-top:2.1rem; padding:1.15rem 0 1.15rem clamp(1rem,2.4vw,1.7rem);
  border-left:2px solid var(--ember);
  font-size:clamp(1.02rem,1.5vw,1.16rem); line-height:1.55; color:var(--ash);
}
.prose blockquote cite{display:block; margin-top:.9rem; font-size:.78rem; letter-spacing:.2em; text-transform:uppercase; color:rgba(11,37,69,.42); font-style:normal}
.prose figure{margin-top:2.4rem}
.prose figure img{border:1px solid var(--hair); background:var(--char-2); width:100%}
.prose figcaption{margin-top:.85rem; font-size:.72rem; letter-spacing:.06em; color:rgba(11,37,69,.45)}
.prose code{font-family:var(--mono); font-size:.86em; background:var(--char-2); border:1px solid var(--hair-2); padding:.12rem .4rem}
.prose .figure--plate img{background:var(--char-2)}

/* two-column body with sticky aside */
.doc{display:grid; grid-template-columns:minmax(0,1fr) 15.5rem; gap:clamp(2rem,5vw,4.5rem); align-items:start}
.toc{position:sticky; top:calc(var(--nav-h) + 1.6rem)}
.toc h4{font-size:.78rem; letter-spacing:.24em; text-transform:uppercase; color:rgba(11,37,69,.42); font-weight:400; margin-bottom:1rem}
.toc ol{list-style:none; margin:0; padding:0; display:grid; gap:.1rem}
.toc a{
  display:block; padding:.55rem .85rem; font-size:.82rem; line-height:1.4;
  color:var(--muted); border-left:1px solid var(--hair);
  transition:color .3s var(--ease), border-color .3s var(--ease);
}
.toc a:hover{color:var(--ash)}
.toc a[aria-current="true"]{color:var(--ash); border-left-color:var(--ember)}

/* article byline */
.byline{
  display:flex; flex-wrap:wrap; align-items:center; gap:.7rem 1.4rem;
  padding-block:1.4rem; border-block:1px solid var(--hair);
  font-size:.78rem; letter-spacing:.16em; text-transform:uppercase; color:rgba(11,37,69,.45);
}
.byline b{color:var(--ember); font-weight:500}

/* ============================================================
   TABLES
   ============================================================ */

.spec-table{width:100%; border-collapse:collapse; font-size:.87rem}
.spec-table caption{
  text-align:left; padding-bottom:.95rem;
  font-size:.78rem; letter-spacing:.24em; text-transform:uppercase; color:rgba(11,37,69,.42);
}
.spec-table th,.spec-table td{padding:.85rem 1rem; border-bottom:1px solid var(--hair-2); text-align:left; vertical-align:top}
.spec-table th{font-weight:400; letter-spacing:.06em; color:rgba(11,37,69,.5)}
/* Only a row-header key column is held on one line. Applying \`nowrap\` and a 36%
   width to *every* th sets a min-content width that a three- or four-column
   comparison table cannot honour at 390px — and because body has
   overflow-x:hidden, the page silently slides sideways instead of scrolling.
   Column headers are allowed to wrap; the key column is not. */
.spec-table tbody th{white-space:nowrap; width:36%}
.spec-table td{color:var(--ink)}
.spec-table tr:last-child th,.spec-table tr:last-child td{border-bottom:0}
.spec-table--box{border:1px solid var(--hair)}
.spec-table--box th:first-child,.spec-table--box td:first-child{padding-left:1.3rem}
.spec-table--box th:last-child,.spec-table--box td:last-child{padding-right:1.3rem}

/* A table wider than the column it sits in scrolls itself rather than pushing the
   whole document. Kept thin and low-contrast so it reads as a hint, not a control. */
.table-wrap{overflow-x:auto; -webkit-overflow-scrolling:touch;
  scrollbar-width:thin; scrollbar-color:rgba(11,37,69,.25) transparent}
.table-wrap::-webkit-scrollbar{height:6px}
.table-wrap::-webkit-scrollbar-thumb{background:rgba(11,37,69,.22)}
.table-wrap::-webkit-scrollbar-track{background:transparent}

/* ============================================================
   CALLOUTS
   ============================================================ */

.note{
  border:1px solid var(--hair); border-left:2px solid var(--ember);
  background:linear-gradient(120deg, rgba(15,76,126,.07), transparent 62%);
  padding:clamp(1.15rem,2.4vw,1.6rem) clamp(1.15rem,2.4vw,1.7rem);
}
.note h4{font-size:.78rem; letter-spacing:.22em; text-transform:uppercase; color:var(--glow); font-weight:500; margin-bottom:.6rem}
.note p{color:var(--ink); font-size:.9rem}
.note>*+*{margin-top:.7rem}

/* ============================================================
   TIMELINE
   ============================================================ */

.timeline{list-style:none; margin:0; padding:0; position:relative}
.timeline::before{
  content:""; position:absolute; left:0; top:.7rem; bottom:.7rem; width:1px;
  background:linear-gradient(180deg, transparent, var(--hair) 10%, var(--hair) 90%, transparent);
}
.timeline li{position:relative; padding:0 0 clamp(1.7rem,3vw,2.5rem) clamp(1.5rem,3vw,2.3rem)}
.timeline li:last-child{padding-bottom:0}
.timeline li::before{
  content:""; position:absolute; left:-3px; top:.55rem;
  width:7px; height:7px; border-radius:50%; background:var(--ember);
}
.timeline .yr{font-size:.78rem; letter-spacing:.2em; text-transform:uppercase; color:var(--ember)}
.timeline h3{font-size:1rem; margin:.45rem 0 .5rem}
.timeline p{color:var(--muted); font-size:.88rem; max-width:62ch}

/* ============================================================
   FORMS
   ============================================================ */

.form{display:grid; gap:1.15rem}
.form .duo{display:grid; grid-template-columns:minmax(0,1fr) minmax(0,1fr); gap:1.15rem}
.field{display:grid; gap:.55rem}
.field label,.field .field-label{font-size:.78rem; letter-spacing:.22em; text-transform:uppercase; color:rgba(11,37,69,.5)}
.field input,.field select,.field textarea{
  width:100%; padding:.92rem 1.05rem;
  font:inherit; font-size:.9rem; color:var(--ash);
  background:var(--char-2); border:1px solid var(--hair); border-radius:0;
  transition:border-color .3s var(--ease), background .3s var(--ease);
}
.field input::placeholder,.field textarea::placeholder{color:rgba(11,37,69,.28)}
.field input:focus,.field select:focus,.field textarea:focus{
  outline:none; border-color:rgba(21,101,168,.5); background:#fff;
}
.field textarea{min-height:9.5rem; resize:vertical}
.field select{
  appearance:none; cursor:pointer;
  background-image:linear-gradient(45deg,transparent 50%,rgba(11,37,69,.5) 50%),linear-gradient(135deg,rgba(11,37,69,.5) 50%,transparent 50%);
  background-position:calc(100% - 1.4rem) 50%, calc(100% - 1rem) 50%;
  background-size:5px 5px, 5px 5px; background-repeat:no-repeat;
}
.field select option{background:var(--char-2)}
.field .hint{font-size:.72rem; color:rgba(11,37,69,.4); letter-spacing:.02em}
.form-foot{display:flex; flex-wrap:wrap; align-items:center; gap:1.2rem; margin-top:.6rem}
.form-status{
  display:none; border:1px solid rgba(21,101,168,.4);
  background:linear-gradient(120deg, rgba(21,101,168,.1), transparent 60%);
  padding:1rem 1.15rem; font-size:.86rem; color:var(--ash);
}
.form-status[data-shown="true"]{display:block}

/* ============================================================
   INFO BLOCKS (contact)
   ============================================================ */

.info{display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); border:1px solid var(--hair)}
.info>div{padding:clamp(1.4rem,2.8vw,2.1rem) clamp(1.1rem,2.2vw,1.6rem); border-right:1px solid var(--hair-2)}
.info>div:last-child{border-right:0}
.info h4{font-size:.78rem; letter-spacing:.22em; text-transform:uppercase; color:rgba(11,37,69,.42); font-weight:400; margin-bottom:.95rem}
.info p,.info a{font-size:.9rem; color:var(--ink)}
.info a{color:var(--glow)}
.info a:hover{border-bottom:1px solid var(--glow)}
.info dl{margin:0; display:grid; gap:.55rem; font-size:.88rem}
.info dt{color:rgba(11,37,69,.45); font-size:.78rem; letter-spacing:.14em; text-transform:uppercase}
.info dd{margin:0; color:var(--ink)}

/* ============================================================
   FAQ
   ============================================================ */

.faq{border-top:1px solid var(--hair)}
.faq details{border-bottom:1px solid var(--hair-2)}
.faq summary{
  list-style:none; cursor:pointer;
  padding:1.2rem .3rem; display:flex; align-items:center; justify-content:space-between; gap:1.2rem;
  font-size:.98rem; letter-spacing:.005em;
}
.faq summary::-webkit-details-marker{display:none}
.faq summary::after{content:"+"; color:var(--ember); font-size:1.05rem; line-height:1; transition:transform .3s var(--ease)}
.faq details[open] summary::after{transform:rotate(45deg)}
.faq .a{padding:0 .3rem 1.5rem; color:var(--muted); font-size:.9rem; max-width:70ch}
.faq .a>*+*{margin-top:.8rem}

/* ============================================================
   PRODUCT DETAIL
   ============================================================ */

.pd{display:grid; grid-template-columns:minmax(0,1.04fr) minmax(0,1fr); gap:clamp(2rem,5vw,4.5rem); align-items:start}
.pd-art{
  position:relative; aspect-ratio:1/1; display:grid; place-items:center; overflow:hidden;
  border:1px solid var(--hair);
  background:
    radial-gradient(circle at 50% 56%, rgba(21,101,168,.18), rgba(15,76,126,.05) 44%, transparent 70%),
    linear-gradient(180deg, var(--char-2), var(--char));
}
.pd-art img{
  position:relative; z-index:2; width:72%;
  filter:drop-shadow(0 0 1.4px rgba(21,101,168,.4)) drop-shadow(0 20px 34px rgba(0,0,0,.72));
}
.pd-art--plate img{width:88%; border-radius:3px}
.thumbs{display:flex; flex-wrap:wrap; gap:.6rem; margin-top:1.1rem}
.thumbs button{
  width:76px; aspect-ratio:1/1; display:grid; place-items:center;
  border:1px solid var(--hair); background:var(--char-2);
  transition:border-color .3s var(--ease), background .3s var(--ease);
}
.thumbs button img{width:72%}
.thumbs button:hover{border-color:rgba(11,37,69,.4)}
.thumbs button[aria-pressed="true"]{border-color:var(--ember); background:#E8F0F6}
/* A plate thumbnail is a framed photograph, not a cut-out, so it fills more of
   its square before it reads as the same weight as its neighbours. */
.thumbs button.plate img{width:92%}
.thumbs-note{margin-top:.9rem; font-size:.74rem; color:rgba(11,37,69,.45); max-width:52ch}

/* The panel used to open with the product name again, once the page head had
   already set it as the h1 inside the same screen. It opens on the one line
   that actually distinguishes the part instead — the fittings and capacity —
   and that line is dropped from the table below so it is stated once. */
.pd-lead{margin-top:.85rem; font-size:clamp(1.02rem,2vw,1.3rem); font-weight:300; line-height:1.35; letter-spacing:.015em; color:var(--ash)}
.pd-spec{margin-top:1.6rem; list-style:none; padding:0; display:grid; gap:.05rem}
.pd-spec li{display:flex; justify-content:space-between; gap:1.4rem; padding:.72rem 0; border-bottom:1px solid var(--hair-2); font-size:.88rem}
.pd-spec li span:first-child{color:rgba(11,37,69,.45); letter-spacing:.06em}
.pd-spec li span:last-child{text-align:right; color:var(--ink)}

.chips{display:flex; flex-wrap:wrap; gap:.45rem; margin-top:1.4rem}
.chips span{
  padding:.42rem .8rem; font-size:.78rem; letter-spacing:.18em; text-transform:uppercase;
  border:1px solid var(--hair); color:var(--muted);
}

/* ============================================================
   RAIL — category navigation beside an index
   ============================================================ */

.rail{list-style:none; margin:0; padding:0; display:grid; gap:.05rem}
.rail a{
  display:flex; align-items:baseline; justify-content:space-between; gap:1rem;
  padding:.78rem .9rem; border-left:1px solid var(--hair);
  font-size:.86rem; color:var(--muted);
  transition:color .3s var(--ease), border-color .3s var(--ease), background .3s var(--ease);
}
.rail a:hover{color:var(--ash); background:var(--char-2)}
.rail a[aria-current="true"]{color:var(--ash); border-left-color:var(--ember); background:var(--char-2)}
.rail .c{font-size:.78rem; color:rgba(11,37,69,.35)}

/* ============================================================
   PAGINATION
   ============================================================ */

.pager{display:flex; flex-wrap:wrap; gap:.4rem; margin-top:clamp(2rem,4vw,3rem)}
.pager a,.pager span{
  min-width:2.7rem; padding:.65rem .9rem; text-align:center;
  border:1px solid var(--hair); font-size:.78rem; letter-spacing:.14em; color:var(--muted);
  transition:all .3s var(--ease);
}
.pager a:hover{color:var(--ash); border-color:rgba(11,37,69,.4)}
.pager [aria-current="page"]{background:var(--ember); border-color:var(--ember); color:#FFFFFF}

/* ============================================================
   LAYOUT HELPERS
   ============================================================ */

.split{display:grid; grid-template-columns:minmax(0,1fr) minmax(0,1fr); gap:clamp(2rem,5vw,4.5rem); align-items:start}
.split--rail{grid-template-columns:14rem minmax(0,1fr); gap:clamp(1.8rem,4vw,3.4rem)}
.stack-2{display:grid; gap:clamp(1.6rem,3vw,2.6rem)}
.stack-3{display:grid; gap:clamp(2.4rem,5vw,4rem)}

/* ============================================================
   MATERIAL (home)
   ============================================================ */

.mat-in{display:grid; grid-template-columns:minmax(0,1fr) minmax(0,1.02fr); gap:clamp(2.5rem,5vw,5rem); align-items:center}
.mat-art{
  position:relative; aspect-ratio:4/5; display:grid; place-items:center; overflow:hidden;
  background:
    radial-gradient(circle at 50% 76%, rgba(21,101,168,.2), rgba(15,76,126,.07) 38%, transparent 64%),
    linear-gradient(180deg, var(--char-2), var(--char));
  border:1px solid var(--hair);
}
.mat-art .kiln-line{
  position:absolute; left:0; right:0; bottom:26%; height:1px;
  background:linear-gradient(90deg, transparent, rgba(21,101,168,.55), transparent);
}
.mat-art .kiln-line::after{
  content:"≈ 1 200 °C"; position:absolute; right:1.2rem; top:-1.6rem;
  font-size:.58rem; letter-spacing:.2em; color:var(--glow); opacity:.75;
}
.mat-art img{
  position:relative; z-index:2; width:64%;
  filter:drop-shadow(0 0 1.4px rgba(21,101,168,.45)) drop-shadow(0 20px 32px rgba(0,0,0,.7));
}
.mat-list{list-style:none; margin:2rem 0 0; padding:0}
.mat-list li{display:grid; grid-template-columns:auto minmax(0,1fr); gap:1.1rem; padding:1.2rem 0; border-top:1px solid var(--hair-2)}
.mat-list li:last-child{border-bottom:1px solid var(--hair-2)}
.mat-list .n{font-size:.78rem; letter-spacing:.2em; color:var(--ember); padding-top:.3rem}
.mat-list h3{font-size:1rem; letter-spacing:.01em; margin-bottom:.35rem}
.mat-list p{color:var(--muted); font-size:.9rem}

/* ============================================================
   PROCESS
   ============================================================ */

.process{
  border:1px solid var(--hair);
  background:linear-gradient(160deg, rgba(15,76,126,.06), transparent 52%);
}
.process-head{
  display:grid; grid-template-columns:minmax(0,1fr) minmax(0,.82fr); gap:2.5rem; align-items:end;
  padding:clamp(1.8rem,3.4vw,2.8rem) clamp(1.3rem,3vw,2.4rem);
  border-bottom:1px solid var(--hair);
}
.steps{list-style:none; margin:0; padding:0; display:grid; grid-template-columns:repeat(3,minmax(0,1fr))}
.step{padding:clamp(1.5rem,3vw,2.2rem) clamp(1.1rem,2vw,1.6rem) clamp(1.9rem,3.6vw,2.6rem); border-right:1px solid var(--hair)}
.step:last-child{border-right:0}
.step .idx{font-size:.78rem; letter-spacing:.22em; color:var(--ember); display:block; margin-bottom:1.2rem}
.step h3{font-size:1rem; margin-bottom:.55rem}
.step p{color:var(--muted); font-size:.87rem}

/* ============================================================
   POSTS (home knowledge teasers)
   ============================================================ */

.posts{display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); border:1px solid var(--hair)}
.post{
  padding:clamp(1.5rem,2.8vw,2.2rem) clamp(1.2rem,2.2vw,1.7rem) clamp(1.8rem,3.2vw,2.4rem);
  border-right:1px solid var(--hair); display:flex; flex-direction:column;
  transition:background .4s var(--ease);
}
.post:last-child{border-right:0}
.post:hover{background:linear-gradient(180deg, rgba(15,76,126,.07), transparent)}
.post .k{font-size:.78rem; letter-spacing:.22em; text-transform:uppercase; color:var(--ember); margin-bottom:1.3rem}
.post h3{font-size:1.08rem; letter-spacing:.005em; margin-bottom:.8rem}
.post p{color:var(--muted); font-size:.89rem; flex:1}
.post .rd{margin-top:1.7rem; padding-top:.9rem; border-top:1px solid var(--hair-2); font-size:.78rem; letter-spacing:.2em; text-transform:uppercase; color:rgba(11,37,69,.5)}
.post:hover .rd{color:var(--glow)}

/* ============================================================
   MARKET (home)
   ============================================================ */

.market-in{display:grid; grid-template-columns:minmax(0,1fr) minmax(0,.8fr); gap:clamp(2rem,4vw,4rem); align-items:center}
.market select{
  width:100%; margin-top:1.5rem; padding:1rem 1.15rem;
  font:inherit; font-size:.86rem; letter-spacing:.06em; color:var(--ash);
  background:var(--char-2); border:1px solid var(--hair); appearance:none; cursor:pointer;
  background-image:linear-gradient(45deg,transparent 50%,rgba(11,37,69,.5) 50%),linear-gradient(135deg,rgba(11,37,69,.5) 50%,transparent 50%);
  background-position:calc(100% - 1.4rem) 50%, calc(100% - 1rem) 50%;
  background-size:5px 5px, 5px 5px; background-repeat:no-repeat;
}
.market select option{background:var(--char-2)}
.market-note{margin-top:1rem; font-size:.82rem; color:rgba(11,37,69,.42); letter-spacing:.02em}
.market-art{
  aspect-ratio:4/3; display:grid; place-items:center; overflow:hidden;
  background:radial-gradient(circle at 50% 58%, rgba(21,101,168,.2), rgba(15,76,126,.06) 42%, transparent 66%), var(--char-2);
  border:1px solid var(--hair);
}
.market-art img{width:52%; filter:drop-shadow(0 0 1.4px rgba(21,101,168,.45)) drop-shadow(0 18px 28px rgba(0,0,0,.7))}

/* ============================================================
   CLOSING BAND
   ============================================================ */

.close{
  position:relative; border-top:1px solid var(--hair);
  padding-block:clamp(4rem,8vw,6.5rem);
  text-align:center; overflow:hidden;
}
.close::before{
  content:""; position:absolute; left:50%; top:30%; width:min(80vw,760px); aspect-ratio:1;
  transform:translateX(-50%);
  background:radial-gradient(circle, rgba(15,76,126,.16), transparent 66%);
  pointer-events:none;
}
.close>*{position:relative}
.close h2{font-size:clamp(1.8rem,4.4vw,3.6rem); font-weight:300; max-width:22ch; margin:0 auto 1.4rem; letter-spacing:.01em}
.close .lede{margin:0 auto}
.close-acts{display:flex; flex-wrap:wrap; gap:.7rem; justify-content:center; margin-top:2.5rem}

/* ============================================================
   FOOTER
   ============================================================ */

footer{border-top:1px solid var(--hair); padding-block:clamp(2.5rem,4.5vw,3.5rem)}
.foot-in{display:grid; grid-template-columns:minmax(0,1.5fr) minmax(0,1fr) minmax(0,1fr) minmax(0,1fr); gap:2.4rem; padding-bottom:2.4rem; border-bottom:1px solid var(--hair-2)}
.foot-in h4{font-size:.78rem; letter-spacing:.24em; text-transform:uppercase; color:rgba(11,37,69,.42); font-weight:400; margin-bottom:1rem}
.foot-in ul{list-style:none; margin:0; padding:0; display:grid; gap:.58rem}
.foot-in a{font-size:.88rem; color:var(--muted); transition:color .3s var(--ease)}
.foot-in a:hover{color:var(--ash)}
.foot-note{font-size:.88rem; color:var(--muted); max-width:26rem; margin-top:.9rem}
.foot-base{display:flex; flex-wrap:wrap; justify-content:space-between; gap:1rem; padding-top:1.4rem; font-size:.78rem; letter-spacing:.12em; text-transform:uppercase; color:rgba(11,37,69,.38)}

/* ============================================================
   RESPONSIVE
   ============================================================ */

@media (max-width:1120px){
  .nav-links{display:none}
  .nav-burger{display:flex}
  .nav-cta .btn:not(.btn-ember){display:none}
  .creds-in{grid-template-columns:repeat(2,minmax(0,1fr))}
  .cred:nth-child(odd){border-left:0}
  .cred:nth-child(-n+2){border-bottom:1px solid var(--hair-2)}
  .grid,.grid--4{grid-template-columns:repeat(2,minmax(0,1fr))}
  .posts{grid-template-columns:minmax(0,1fr)}
  .post{border-right:0; border-bottom:1px solid var(--hair)}
  .post:last-child{border-bottom:0}
  .steps{grid-template-columns:repeat(2,minmax(0,1fr))}
  .step:nth-child(2n){border-right:0}
  .step:nth-child(-n+2){border-bottom:1px solid var(--hair)}
  .foot-in{grid-template-columns:minmax(0,1fr) 1fr}
  .facts{grid-template-columns:repeat(2,minmax(0,1fr))}
  .fact:nth-child(2n){border-right:0}
  .fact:nth-child(-n+2){border-bottom:1px solid var(--hair-2)}
  .split,.split--rail{grid-template-columns:minmax(0,1fr)}
  .doc{grid-template-columns:minmax(0,1fr)}
  .toc{position:static; padding-bottom:2rem; border-bottom:1px solid var(--hair)}
  .toc ol{grid-template-columns:repeat(2,minmax(0,1fr))}
}

@media (max-width:880px){
  .hero-in{grid-template-columns:minmax(0,1fr); padding-block:1.5rem 2.5rem}
  .hero-art{order:-1; aspect-ratio:1/.82; max-height:50vh}
  .hero-stamp{display:none}
  .mat-in{grid-template-columns:minmax(0,1fr); gap:2.5rem}
  .mat-art{aspect-ratio:1/1}
  .process-head{grid-template-columns:minmax(0,1fr); gap:1.4rem}
  .market-in{grid-template-columns:minmax(0,1fr); gap:2.5rem}
  .market-art{order:2}
  .pd{grid-template-columns:minmax(0,1fr); gap:2.4rem}
  .page-head--split .wrap{grid-template-columns:minmax(0,1fr); align-items:start}
  .info{grid-template-columns:minmax(0,1fr)}
  .info>div{border-right:0; border-bottom:1px solid var(--hair-2)}
  .info>div:last-child{border-bottom:0}
  .row{grid-template-columns:minmax(0,1fr)}
  .row .meta{padding-top:0; display:flex; gap:.9rem; align-items:baseline}
  .row .meta b{margin-bottom:0}
  .row .go{padding-top:0}
  .grid--2{grid-template-columns:minmax(0,1fr)}
}

@media (max-width:640px){
  .brand i{display:none}
  .grid,.grid--4{grid-template-columns:minmax(0,1fr)}
  .steps{grid-template-columns:minmax(0,1fr)}
  .step{border-right:0; border-bottom:1px solid var(--hair)}
  .step:last-child{border-bottom:0}
  .creds-in{grid-template-columns:minmax(0,1fr)}
  .cred{border-left:0; border-bottom:1px solid var(--hair-2)}
  .facts{grid-template-columns:minmax(0,1fr)}
  .fact{border-right:0; border-bottom:1px solid var(--hair-2)}
  .fact:last-child{border-bottom:0}
  .foot-in{grid-template-columns:minmax(0,1fr); gap:1.8rem}
  .filters button{flex:1 1 auto}
  .form .duo{grid-template-columns:minmax(0,1fr)}
  .toc ol{grid-template-columns:minmax(0,1fr)}
  .btn-row .btn,.close-acts .btn{flex:1 1 auto; justify-content:center}
}

/* ============================================================
   ANCHOR OFFSET
   ============================================================
   The nav is sticky, so a plain #anchor parks its target underneath
   the bar. Every id on the site gets the same offset, which keeps
   editorial links, the rail and the tables of contents honest. */

[id]{scroll-margin-top:calc(var(--nav-h) + 1.4rem)}

/* ============================================================
   TOPIC — knowledge centre entry cards
   ============================================================
   Sits inside a .grid, so it owns the surface the hairline gaps
   would otherwise show through. */

.topic{
  background:var(--char);
  padding:clamp(1.6rem,3vw,2.4rem) clamp(1.3rem,2.4vw,1.9rem) clamp(1.9rem,3.4vw,2.6rem);
  display:flex; flex-direction:column;
  transition:background .45s var(--ease);
}
.topic:hover{background:var(--char-2)}
.topic h3{font-size:clamp(1.1rem,1.8vw,1.4rem); letter-spacing:.005em; line-height:1.28; margin:1.2rem 0 .8rem}
.topic p{color:var(--muted); font-size:.89rem; flex:1}
.topic .n{
  font-size:.78rem; letter-spacing:.24em; text-transform:uppercase;
  color:var(--ember);
}
.topic .rd{
  margin-top:1.7rem; padding-top:.9rem; border-top:1px solid var(--hair-2);
  font-size:.78rem; letter-spacing:.2em; text-transform:uppercase; color:rgba(11,37,69,.5);
}
.topic:hover .rd{color:var(--glow)}

/* ============================================================
   RAIL — sticky category navigation beside an index
   ============================================================ */

.rail-wrap{position:sticky; top:calc(var(--nav-h) + 1.6rem)}
.rail-wrap h4{
  font-size:.78rem; letter-spacing:.24em; text-transform:uppercase;
  color:rgba(11,37,69,.42); font-weight:400; margin-bottom:1rem;
}

/* ============================================================
   FORMS — additions used by the inquiry form
   ============================================================ */

/* The native file control paints its own button AND its own wording from the
   browser's interface locale — not from the document's lang — so this
   English-only page rendered "选择文件 / 未选择任何文件" on a Chinese-locale
   browser. Styling ::file-selector-button cannot fix the wording, only the box.
   The control is therefore replaced: the real input is clipped to nothing but
   stays focusable and label-activatable, a styled <label> stands in for the
   button, and kiln.js echoes the chosen filename into .file-name.
   .file-field .file-btn carries two classes on purpose — it needs to outrank
   the .field label eyebrow rule above, since this label is a control. */
.file-field{
  position:relative;
  display:flex; align-items:center; gap:1rem; flex-wrap:wrap;
  padding:.62rem .8rem;
  background:var(--char-2); border:1px solid var(--hair);
}
.file-field input[type="file"]{
  position:absolute; width:1px; height:1px; margin:0; padding:0; border:0;
  opacity:0; overflow:hidden; clip-path:inset(50%); white-space:nowrap;
}
.file-field .file-btn{
  font-size:.78rem; letter-spacing:.18em; text-transform:uppercase;
  color:var(--ash); background:none;
  padding:.5rem .95rem; border:1px solid var(--hair); cursor:pointer;
  transition:border-color .3s var(--ease), color .3s var(--ease);
}
.file-field .file-btn:hover{border-color:rgba(11,37,69,.42)}
.file-field input[type="file"]:focus-visible + .file-btn{
  border-color:var(--glow); color:var(--glow);
}
.file-field .file-name{
  font-size:.82rem; letter-spacing:.02em; color:rgba(11,37,69,.4);
  min-width:0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;
}
.file-field.is-set .file-name{color:var(--ink)}

.check{display:flex; align-items:flex-start; gap:.75rem; cursor:pointer}
.check input{
  flex:none; width:1.05rem; height:1.05rem; margin:.28rem 0 0;
  appearance:none; cursor:pointer;
  background:var(--char-2); border:1px solid var(--hair);
  transition:background .25s var(--ease), border-color .25s var(--ease);
}
.check input:checked{
  background:var(--ember); border-color:var(--ember);
  background-image:linear-gradient(45deg,transparent 46%,#FFFFFF 46%,#FFFFFF 56%,transparent 56%),
                   linear-gradient(-45deg,transparent 58%,#FFFFFF 58%,#FFFFFF 68%,transparent 68%);
}
.check input:focus-visible{outline:2px solid var(--glow); outline-offset:3px}
.check span{font-size:.82rem; color:var(--muted); line-height:1.6}

/* ============================================================
   INQUIRY LIST — the basket that follows you through the site
   ============================================================ */

.inquiry-list{border:1px solid var(--hair); background:var(--char-2)}
.inquiry-list .hd{
  padding:1rem 1.2rem; border-bottom:1px solid var(--hair);
  font-size:.78rem; letter-spacing:.22em; text-transform:uppercase; color:rgba(11,37,69,.42);
}
.inquiry-list .bd{padding:1.5rem 1.2rem}
.inquiry-list .bd p{font-size:.86rem; color:var(--muted)}
.inquiry-list .bd .after{margin-top:1rem}

/* ============================================================
   RESPONSIVE — interior-page additions
   ============================================================ */

@media (max-width:1120px){
  /* The sticky column collapses to a single stack; a contents list that ends
     up below a four-screen article is not a contents list. */
  .toc{order:-1}
  .rail-wrap{position:static}
  .split--rail>.rail-wrap{padding-bottom:1.6rem; border-bottom:1px solid var(--hair)}
  .rail{grid-template-columns:repeat(2,minmax(0,1fr))}
}

@media (max-width:640px){
  .rail{grid-template-columns:minmax(0,1fr)}
  .inquiry-list .bd{padding:1.2rem 1rem}
}

@media (prefers-reduced-motion:reduce){
  *,*::before,*::after{animation:none !important; transition-duration:.001ms !important}
  html{scroll-behavior:auto}
  .card:hover .card-art img{transform:none}
  .hero-art img{animation:none}
}
`;

/* ── kiln-extra.css · 41350 bytes ── CMS 组件与企业官网布局（询盘篮 / 轮播 / 统计同意 / 客服 / 市场块 / 搜索 / 分页） */
export const kilnExtraCSS = `/* CMS components and corporate layout refinements. Built after kiln.css.
   Keep browser hooks and image minmax tracks intact. */

/* ---------- 0. 正确性修复：hidden 属性必须赢过 kiln 的 display ----------
   kiln 的 .card{display:flex} 会盖掉浏览器默认的 [hidden]{display:none}，
   而首页过滤是「card.hidden=true」（rfq-browser.ts 的 [data-home-filter]），
   不加这条，过滤只会改变 aria-pressed 而不隐藏任何产品卡。 */
.card[hidden],.home-product[hidden]{display:none!important}

/* ============================================================
   A. 外壳与导航附加件
   （.nav/.nav-in/.brand/.nav-links/.nav-cta/.nav-burger/.nav-drawer 的基础样式由 kiln 承担）
   ============================================================ */

/* 跳到主内容：默认屏外，键盘聚焦时出现在左上、压在 nav 之上（z 80 > nav 60） */
.skip-link{
  position:absolute; left:var(--pad); top:-4.5rem; z-index:80;
  padding:.72rem 1.15rem;
  background:var(--char-2); border:1px solid var(--hair);
  font-size:.78rem; letter-spacing:.2em; text-transform:uppercase; color:var(--ash);
  transition:top .25s var(--ease);
}
.skip-link:focus{top:.7rem}

/* 语言切换：nav-cta 里的 <details>，要做成与 .nav-cta .btn 同尺寸的一枚克制按钮；
   展开的清单暗底细线。summary 的原生三角标记要手工去掉。 */
.language{position:relative}
.language summary{
  display:inline-flex; align-items:center; gap:.5rem;
  padding:.62rem 1.15rem; font-size:.78rem; letter-spacing:.2em; text-transform:uppercase;
  color:var(--muted); border:1px solid var(--hair); cursor:pointer; list-style:none;
  transition:color .3s var(--ease), border-color .3s var(--ease);
}
.language summary::-webkit-details-marker{display:none}
.language summary::after{
  content:""; width:4px; height:4px;
  border-right:1px solid currentColor; border-bottom:1px solid currentColor;
  transform:translateY(-1px) rotate(45deg); transition:transform .3s var(--ease);
}
.language summary:hover,.language[open] summary{color:var(--ash); border-color:rgba(11,37,69,.42)}
.language[open] summary::after{transform:translateY(1px) rotate(-135deg)}
.language ul{
  position:absolute; right:0; top:calc(100% + .5rem); z-index:1;
  min-width:7rem; margin:0; padding:.3rem 0; list-style:none;
  background:var(--char-2); border:1px solid var(--hair);
}
.language li>a{
  display:block; padding:.55rem 1.05rem; font-size:.78rem; letter-spacing:.2em; color:var(--muted);
  transition:color .3s var(--ease), background .3s var(--ease);
}
.language li>a:hover,.language li>a[aria-current="true"]{color:var(--glow); background:var(--char-3)}

/* 「⌕」按钮：单个象形符号不要字母间距，字形本身放大一点才看得清；尺寸与边框由
   kiln 的 .nav-cta .btn 提供。
   窄屏隐藏同样由 kiln 承担——.nav-cta .btn:not(.btn-ember){display:none} 在 ≤1120px
   就把 .nav-search 与 .nav-contact 一起收掉了（比清单里的 880 更早），故此处不写隐藏规则。 */
.nav-cta .nav-search{font-size:.95rem; letter-spacing:0; line-height:1}

/* 询盘数量角标：嵌在 .btn-ember（橙色渐变）里，用炭底 + 亮边反衬；
   下面给了 display:inline-grid，所以 [hidden] 必须显式关掉。 */
.rfq-count{
  display:inline-grid; place-items:center;
  min-width:1.3rem; height:1.3rem; padding:0 .32rem;
  font-size:.78rem; letter-spacing:0; line-height:1; font-variant-numeric:tabular-nums;
  background:var(--char); color:var(--glow); border:1px solid rgba(21,101,168,.45);
}
.rfq-count[hidden]{display:none}

/* 抽屉里的二级菜单项：缩进 + 更弱的前景色（一级项沿用 kiln 的 .76rem 大写）。
   缩进放在嵌套 <ul> 上——kiln 的 .nav-drawer ul 给每层都加了 var(--pad)，不覆盖会越缩越深。 */
.nav-drawer li.sub>ul{padding:.2rem 0 .4rem 1.1rem}
.nav-drawer li.sub>a{font-size:.78rem; letter-spacing:.18em; color:var(--muted)}
.nav-drawer li.sub>a:hover{color:var(--ash)}

/* 客服浮层：browser.ts 的 service() 会重建里面的 <a>/<p>。暗底细线，克制外观；
   展开的面板最大高度受控、超出可滚（html 已 color-scheme:dark，滚动条天然是暗的）。 */
.service-widget{position:fixed; right:clamp(12px,1.6vw,22px); bottom:clamp(12px,1.6vw,1.4rem); z-index:70}
.service-widget[hidden]{display:none}
.service-widget summary{
  display:inline-flex; align-items:center; gap:.5rem; cursor:pointer; list-style:none;
  padding:.72rem 1.15rem; font-size:.78rem; letter-spacing:.2em; text-transform:uppercase;
  color:var(--ash); background:var(--char-2); border:1px solid var(--hair);
  box-shadow:0 16px 34px -20px rgba(0,0,0,.85); /* 只为与页面内容分开，不是 SaaS 投影 */
  transition:color .3s var(--ease), border-color .3s var(--ease);
}
.service-widget summary::-webkit-details-marker{display:none}
.service-widget summary:hover,.service-widget[open] summary{color:var(--glow); border-color:rgba(21,101,168,.45)}
.service-widget>div{
  position:absolute; right:0; bottom:calc(100% + .6rem);
  width:min(19rem,calc(100vw - (var(--pad)*2))); max-height:min(60vh,22rem); overflow-y:auto;
  padding:1rem 1.15rem; background:var(--char-2); border:1px solid var(--hair);
}
.service-widget a{display:block; padding:.6rem 0; font-size:.84rem; color:var(--ink); border-bottom:1px solid var(--hair-2); transition:color .3s var(--ease)}
.service-widget a:last-of-type{border-bottom:0}
.service-widget a:hover{color:var(--glow)}
.service-widget p{margin-top:.55rem; font-size:.76rem; color:var(--muted)}

/* 底部统计同意条：fixed 底栏 + 暗底 + 顶部一道发光细线（沿用 kiln .hero::after 的窑缝线）；
   两个按钮一主一次，主按钮直接复用 kiln .btn-ember 的渐变与暖光。
   下面给了 display:flex，所以 [hidden] 必须显式关掉。 */
.analytics-consent{
  position:fixed; left:0; right:0; bottom:0; z-index:72;
  display:flex; flex-wrap:wrap; align-items:center; justify-content:center; gap:.8rem 1.4rem;
  padding:1rem var(--pad);
  background:rgba(255,255,255,.98);
  backdrop-filter:blur(16px); -webkit-backdrop-filter:blur(16px);
}
.analytics-consent::before{
  content:""; position:absolute; inset:0 0 auto 0; height:1px;
  background:linear-gradient(90deg, transparent, rgba(15,76,126,.5), transparent);
}
.analytics-consent[hidden]{display:none}
.analytics-consent p{font-size:.84rem; color:var(--ink); max-width:54ch}
.analytics-consent button{
  padding:.62rem 1.15rem; font-size:.78rem; letter-spacing:.2em; text-transform:uppercase;
  border:1px solid var(--hair); color:var(--muted);
  transition:color .3s var(--ease), border-color .3s var(--ease), background .3s var(--ease);
}
.analytics-consent button:hover{color:var(--ash); border-color:rgba(11,37,69,.42)}
.analytics-consent button[data-analytics-choice="yes"]{
  background:linear-gradient(120deg,#2E7FC0,#1565A8); border-color:transparent; color:#FFFFFF;
  box-shadow:0 14px 34px -16px rgba(21,101,168,.55);
}
.analytics-consent button[data-analytics-choice="yes"]:hover{background:linear-gradient(120deg,#12578E,#0F4C7E)}
/* 同意条钉在底部时，右下角的客服浮层会被它压住（72 > 70），所以让浮层上移让位。
   两者都是 <body> 的子元素，用相邻兄弟选择器即可，不必依赖 :has()；
   9 语言文案长短不一，9rem 是按两行文案留的余量。 */
.analytics-consent:not([hidden])~.service-widget{bottom:9rem}

/* 反垃圾蜜罐 label：必须视觉上完全不可见，但仍能被脚本/表单读到 ——
   不能用 display:none（部分机器人会跳过 display:none 的字段，蜜罐即失效），
   改用绝对定位移出视口 + 1px 尺寸。 */
.trap{position:absolute; left:-9999px; top:auto; width:1px; height:1px; overflow:hidden}

/* 页脚「统计偏好」是 <button>（trade-public.ts 用它呼出同意条），要长得像链接。
   细线、字距、大写由 kiln 的 .tlink 提供（它作为类选择器赢过 button{border:0}），
   这里只补两点：不换行，以及与同排文字按基线对齐（默认 stretch 会把它的细线下沿拉到整行底部）。 */
.foot-base .tlink{align-self:baseline; white-space:nowrap}

/* ============================================================
   B. 首页 hero 轮播
   （kiln 的 hero 是静态的；每张 slide 内部就是 .wrap.hero-in，仍是 kiln 的两列布局）
   ============================================================ */

/* 隐藏用 [hidden]（browser.ts 的 carousel() 只切 hidden）。显式写 display:block，
   是为了不再让 .slide 依赖任何旧的 display 声明。 */
.hero .slide{display:block}
.hero .slide[hidden]{display:none}

/* 轮播里第一张标题是 h1、其余是 h2（每页只能有一个 h1）。kiln 只写了 .hero h1，
   第二张之后的标题会掉回浏览器默认字号——这里让它们与首张完全等价。 */
.hero .slide h2{
  font-size:clamp(2.1rem,4.9vw,4.3rem); font-weight:300; line-height:1.12;
  letter-spacing:.005em; margin-block:1rem 1.5rem;
}

/* CMS 的 hero_banner 块：单张、无轮播控件，标题是 h2。
   kiln 的 .hero h1 覆盖不到它，而 .h-sec 的 2.9rem 上限在内页里偏小——
   按 kiln .page-head h1 的尺度给它一个 hero 级标题。 */
.hero--banner h2{
  font-size:clamp(1.9rem,4.4vw,3.4rem); font-weight:300; line-height:1.14;
  letter-spacing:.005em; margin-block:1rem 1.4rem;
}

/* 图片下方的说明小字：这是测试断言的类名（render.test.ts），
   效果照抄 kiln 的 .hero-stamp，但不用那个名字。 */
.hero-caption{
  position:absolute; z-index:3; left:0; bottom:2%;
  font-size:.78rem; letter-spacing:.26em; text-transform:uppercase;
  color:rgba(11,37,69,.4);
}
/* 与 kiln 的 .hero-stamp 同样在 ≤880px 收掉：单列时图上的小字只是噪点，
   而且它的文案（副标题 / 站点名）与上方 .hero-copy 的眉标本来就重复。 */
@media (max-width:880px){
  .hero-caption{display:none}
}

/* 轮播底部一行：左站点名/栏目说明，右「← 01 / 02 Ⅱ →」控件 */
.hero-foot{
  display:flex; flex-wrap:wrap; align-items:center; justify-content:space-between; gap:.8rem 1.2rem;
  padding-block:1.2rem; border-top:1px solid var(--hair-2);
}
.hero-note{
  font-size:.78rem; letter-spacing:.24em; text-transform:uppercase; color:rgba(11,37,69,.4);
}
.hero-controls{display:flex; align-items:center; gap:.5rem; font-size:.78rem; color:rgba(11,37,69,.55)}
.hero-controls button{
  display:grid; place-items:center; width:2.35rem; height:2.35rem; line-height:1;
  border:1px solid var(--hair); color:var(--muted); background:none;
  transition:color .3s var(--ease), border-color .3s var(--ease);
}
.hero-controls button:hover{color:var(--glow); border-color:rgba(21,101,168,.55)}
.hero-controls [data-slide-count]{
  min-width:4.6rem; text-align:center;
  font-size:.78rem; letter-spacing:.2em; font-variant-numeric:tabular-nums;
  color:rgba(11,37,69,.45);
}
/* hero-acts 里的次要动作（.tlink）与 .btn-ember 同排：默认 stretch 会把它拉满行高，
   下划线就跑到按钮底边去了，这里让它按自身高度垂直居中。 */
.hero-acts .tlink{align-self:center}

/* ============================================================
   C. 首页产品区
   （.home-collection 只是版式容器：纵向节奏与宽度由 kiln 的 .section/.wrap 承担，不重写）
   ============================================================ */

/* .home-product-image 是测试断言的类名：.card 里的图片锚点，没有 card-art 类，
   所以视觉等价于 kiln 的 .card-art 的这套要自己写（1:1 容器、居中、裁切、柔光、hover 轻微上移）。
   .grid > * 的 1px 外环由 kiln 负责，不重复。 */
.home-product-image{position:relative; aspect-ratio:1/1; display:grid; place-items:center; overflow:hidden}
.home-product-image::before{
  content:""; position:absolute; inset:16%;
  background:radial-gradient(circle at 50% 56%, rgba(21,101,168,.2), rgba(15,76,126,.06) 44%, transparent 68%);
  opacity:.55; transition:opacity .5s var(--ease);
}
.card:hover .home-product-image::before{opacity:1}
/* 渲染器给的是 <picture><source…><img></picture>，比 kiln 模板里的裸 <img> 多一层。
   这里用 display:contents 让 picture 退出盒模型（曾用「picture 铺满并居中」的写法，
   但那样 picture 自己成了一个嵌套 grid，它内部的 auto 轨道又会按图片固有宽撑开，
   实测把 66% 解析成 1200×0.66=792 → 同样是放大裁切；0b 节的轨道修复也管不到嵌套层）。
   统一交给 0b 节钉住的 .home-product-image 轨道即可。 */
.home-product-image picture{display:contents}
.home-product-image img{
  position:relative; z-index:2; width:66%;
  transition:transform .55s var(--ease);
  filter:drop-shadow(0 0 1.2px rgba(21,101,168,.4)) drop-shadow(0 14px 24px rgba(0,0,0,.7));
}
.card:hover .home-product-image img{transform:translateY(-6px)}
/* 没有图的产品卡给的是 kiln 的 .plot 空框（渲染器不加 .card--plot），
   此时把卡片自己的柔光关掉——与 kiln 的 .card--plot .card-art::before{display:none} 同一个理由。 */
.home-product-image:has(.plot)::before{display:none}

/* 整卡可点（图片与标题两个 <a>），标题链接不出现下划线，hover 才亮起来 */
.home-product .card-body h3 a{text-decoration:none; transition:color .3s var(--ease)}
.home-product .card-body h3 a:hover{color:var(--glow)}

/* 首页按应用过滤：视觉沿用 kiln 的 .filters（含 aria-pressed="true" 的高亮）。
   这里只补窄屏边界——kiln 在 ≤640 会让按钮 flex:1 1 auto 折成三行，
   首页最多 6 个过滤项，改成单行横向滚动更好读；滚动条沿用 kiln .table-wrap 的细线样式。 */
@media (max-width:640px){
  .filters.home-filters{
    flex-wrap:nowrap; overflow-x:auto; -webkit-overflow-scrolling:touch;
    padding-bottom:.2rem; scrollbar-width:thin; scrollbar-color:rgba(11,37,69,.25) transparent;
  }
  .filters.home-filters::-webkit-scrollbar{height:6px}
  .filters.home-filters::-webkit-scrollbar-thumb{background:rgba(11,37,69,.22)}
  .filters.home-filters::-webkit-scrollbar-track{background:transparent}
  .filters.home-filters button{flex:0 0 auto; white-space:nowrap}
}

/* ============================================================
   D. 产品详情页附加件
   （.pd/.pd-art/.thumbs 的边框暗底、.chips span、.pd-spec li 由 kiln 承担，不重写）
   ============================================================ */

/* 产品没有图片时渲染器给的是 <div class="pd-art"><span class="plot">，
   并没有 kiln 的 .pd-art--plot 修饰类，所以在这里把那条规则的尺寸补上。 */
.pd-art .plot{width:56%}

/* kiln 已给 .thumbs button 的暗底细线与 [aria-pressed="true"] 的 ember 选中态；
   这里只加一层亮度区分——暗底上单靠 1px 边框分辨 6 张缩略图太吃力。 */
.thumbs button img{opacity:.62; transition:opacity .3s var(--ease)}
.thumbs button:hover img,.thumbs button[aria-pressed="true"] img{opacity:1}

/* 「已加入询盘清单」：紧跟在 .btn-row.product-actions 之后的行内状态，
   空着时也占一行高，避免点击时页面跳动（旧皮肤的成功色是绿色，这里换成窑火亮色）。 */
.rfq-feedback{
  display:block; min-height:1.4em; margin-top:.9rem;
  font-size:.72rem; letter-spacing:.16em; text-transform:uppercase; color:var(--glow);
}

/* ============================================================
   E. 询盘篮（.inquiry-list .bd 的内容由 rfq-browser.ts 的 paint() 重建）
   静态 HTML 里有同名的 h3（.bd > h3），与 JS 生成的标题必须长得一样，所以选择器按子元素写。
   （.inquiry-list / .bd 的外框与内距由 kiln 承担；.rfq-empty 也被 kiln 的
   .inquiry-list .bd p 覆盖，尺寸与颜色相同，不重写。）
   ============================================================ */

/* 视觉等价于 kiln 的 .inquiry-list .hd（小型大写眉标 + 一道细线），
   只是它长在 .bd 里，细线只能落在内容宽度上。 */
.inquiry-list .bd>h3{
  margin:0 0 1.1rem; padding-bottom:.75rem;
  border-bottom:1px solid var(--hair-2);
  font-size:.78rem; letter-spacing:.22em; text-transform:uppercase; font-weight:400;
  color:rgba(11,37,69,.42);
}
.inquiry-list ul{list-style:none; margin:0; padding:0}
.inquiry-list li{
  display:grid; grid-template-columns:minmax(0,1fr) auto auto; gap:.5rem .9rem; align-items:center;
  padding:.85rem 0;
}
.inquiry-list li+li{border-top:1px solid var(--hair-2)}
.inquiry-list li a{
  font-size:.92rem; line-height:1.4; color:var(--ink); overflow-wrap:anywhere;
  border-bottom:1px solid transparent; transition:color .3s var(--ease);
}
.inquiry-list li a:hover{color:var(--glow)}
.inquiry-list label{
  display:inline-flex; align-items:center; gap:.45rem; white-space:nowrap;
  font-size:.78rem; letter-spacing:.18em; text-transform:uppercase; color:rgba(11,37,69,.42);
}
.inquiry-list input[type="number"]{
  width:4.6rem; padding:.42rem .5rem; text-align:right;
  font:inherit; font-size:.82rem; color:var(--ash);
  background:var(--char); border:1px solid var(--hair); border-radius:0;
  transition:border-color .3s var(--ease);
}
.inquiry-list input[type="number"]:focus{outline:none; border-color:rgba(21,101,168,.5)}
/* 移除按钮：像文字链接那样，靠细线与字距表达，hover 才亮 */
.inquiry-list button[data-rfq-remove]{
  justify-self:end; padding:0 0 .2rem;
  font-size:.78rem; letter-spacing:.18em; text-transform:uppercase;
  color:rgba(11,37,69,.45); border-bottom:1px solid var(--hair);
  transition:color .3s var(--ease), border-color .3s var(--ease);
}
.inquiry-list button[data-rfq-remove]:hover{color:var(--glow); border-bottom-color:rgba(21,101,168,.55)}

@media (max-width:640px){
  .inquiry-list li{grid-template-columns:minmax(0,1fr) auto; row-gap:.6rem}
  .inquiry-list li a{grid-column:1/-1}
}

/* ============================================================
   F. 表单状态
   （.form/.field/.file-field/.check 由 kiln 承担，不重写）
   ============================================================ */

/* 提交结果/错误文案：注意这不是 kiln 的 .form-status（那个由 data-shown 控制显隐）。
   rfq-browser.ts 只往这个 <p> 里写 textContent，成功与失败共用一行，所以只有一种颜色；
   空着时也留一行高，避免提交瞬间页面跳动。 */
.form-result{min-height:1.5em; margin-top:.9rem; font-size:.82rem; color:var(--glow)}

/* ============================================================
   G. 市场与采购块（[data-trade-public]；卡片由 trade-public.ts 重建）
   左列文案 + select + .trade-entry 在 .split 里，右列是 .trade-public-grid。
   （左侧的 select 用的是 .field，由 kiln 承担。）
   ============================================================ */

/* 旧皮肤是浅绿底 + 白卡（#edf0e4 / #214c3d / #bdcdb6），在 kiln 里整体换成
   暗底 + 1px --hair 细线：small 用 --ember 小型大写，链接用 --glow 下划线。 */
.trade-public-grid{display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:1rem}
.trade-public-grid article{
  display:flex; flex-direction:column; gap:.6rem;
  padding:1.15rem 1.2rem 1.3rem;
  background:var(--char-2); border:1px solid var(--hair);
  transition:background .45s var(--ease);
}
.trade-public-grid article:hover{background:var(--char-3)}
.trade-public-grid article small{
  font-size:.78rem; letter-spacing:.22em; text-transform:uppercase; color:var(--ember);
}
.trade-public-grid article h3{font-size:1rem; letter-spacing:.005em; line-height:1.35; color:var(--ash)}
.trade-public-grid article p{
  font-size:.86rem; color:var(--muted); white-space:pre-wrap; overflow-wrap:anywhere;
}
.trade-public-grid article a{
  align-self:flex-start; margin-top:auto; padding-bottom:.3rem;
  font-size:.78rem; letter-spacing:.18em; text-transform:uppercase; color:var(--glow);
  border-bottom:1px solid rgba(21,101,168,.4);
  transition:border-color .3s var(--ease);
}
.trade-public-grid article a:hover{border-bottom-color:var(--glow)}
.trade-public-grid .trade-expiry{
  font-size:.78rem; letter-spacing:.14em; color:rgba(11,37,69,.34); white-space:normal;
}

/* 两个 .tlink（客户专属入口 / 申请渠道合作）的横排 */
.trade-entry{display:flex; flex-wrap:wrap; gap:.8rem 1.6rem; margin-top:1.6rem}
/* 空态 / 加载失败 / 加载中的纯文本（data-empty / data-error 由 JS 写入） */
.trade-section [role="status"]{margin-top:1.4rem; font-size:.84rem; letter-spacing:.02em; color:var(--muted)}

@media (max-width:880px){
  .trade-public-grid{grid-template-columns:repeat(2,minmax(0,1fr))}
}
@media (max-width:640px){
  .trade-public-grid{grid-template-columns:minmax(0,1fr)}
}

/* ============================================================
   H. 站内搜索
   （表单本身用的是 kiln 的 .form：间距由 .form{gap} 与 .sec-head{margin-bottom} 给出，
   无需再补；这里只写结果列。）
   ============================================================ */

/* 结果由 browser.ts 塞成 <article><h3><a>…</a></h3><p>…</p></article>；
   空态与「Searching…」是直接写在容器里的纯文本，所以颜色/字号落在容器上。 */
.search-results{font-size:.86rem; color:var(--muted)}
.search-results article{padding:1.15rem 0; border-bottom:1px solid var(--hair-2)}
.search-results article:first-child{padding-top:0}
.search-results article:last-child{border-bottom:0}
.search-results h3{font-size:1rem; letter-spacing:.005em; line-height:1.35}
.search-results h3 a{color:var(--ash); transition:color .3s var(--ease)}
.search-results h3 a:hover{color:var(--glow)}
.search-results p{margin-top:.4rem; font-size:.87rem; color:var(--muted); max-width:64ch}

/* ============================================================
   I. 其它
   （.pager a 的细线/hover、.rows--plain .row 的两个网格列均由 kiln 承担，不重写）
   ============================================================ */

/* CMS 的翻页只有两个 <a rel="prev|next">（上一页 / 下一页），不是 kiln 模板里的编号页码：
   两端对齐，各自的边贴住容器。 */
.pager{justify-content:space-between}

/* 与 kiln 的全局降级保持一致：柔光的位移也一并关掉（kiln 只写了 .card-art 那一处）。 */
@media (prefers-reduced-motion:reduce){
  .card:hover .home-product-image img{transform:none}
}

/* ============================================================
   J. 渲染器补偿：<picture> 包装层
   ============================================================
   kiln.css 是照裸 <img> 写的（典型是 .card-art img{width:66%}），而 CMS 渲染器输出
   <picture><source…><img></picture>——多档 avif/webp 的来源就在这里，不能去掉包装。
   多出来的 picture 盒子会顶替 img 成为「网格项」：.card-art 是 place-items:center 的网格，
   网格项宽度 auto 时按 max-content 计算，而子图是百分比宽（相对 picture 自身）→ 无法解析，
   浏览器回退到图片固有宽度（900px）再被 overflow:hidden 裁掉，表现为卡片里的产品被放大裁切。
   display:contents 让 picture 退出盒模型，img 重新成为直接子项，kiln 的居中与 66% 宽原样生效。
   （.home-product-image 在 C 节用 grid 铺满 picture 处理，效果等同，此处不重复。） */
.card-art picture,.hero-art picture,.pd-art picture,.thumbs picture,
.prose figure picture,.table-wrap picture{display:contents}

/* ---------- 0b. 正确性修复：把卡片图的「基准」拉回容器（四处同源）
   症状（生产实测，2026-10-02）：产品列表/首页的卡片图被放大约 2.4 倍并裁掉四边内容，
   电商摄影截图上尤其明显（文字、角标被切）。
   根因不是 <picture>，而是**网格轨道**：kiln 这些容器都写成
   \`aspect-ratio + display:grid + place-items:center\`，却**没有声明列/行** —— 那一条 auto 轨道
   由内容的 max-content 决定：图片固有宽 800（或 1200）把轨道撑成那么大，于是 \`img{width:66%}\`
   解析成「轨道宽的 66%」= 528（实测），而卡片本体只有 430，超出部分被 overflow:hidden 裁掉。
   kiln 原版之所以看起来正常：它的素材是「透明底 + 产品居中」的抠图，放大裁切后主体仍在；
   换成满幅摄影素材就会切掉内容。修法是把轨道钉在容器上（minmax(0,1fr)），
   不动 66%/72% 这些观感参数 —— 修完百分比解析的是容器宽，图片完整落在格子里。
   实测：修复前 .home-product-image 图 792（容器 430）、.card-art 图 528；修复后一律 284 = 430×0.66。 */
.card-art,.home-product-image,.pd-art,.thumbs button{grid-template-columns:minmax(0,1fr); grid-template-rows:minmax(0,1fr)}

/* 产品页图廊的主图与缩略图：同样受上面那条约束，且 .pd-art img 用的是 72% 而非 66%。 */
.pd-art img,.thumbs button img{max-width:100%; max-height:100%}

/* CMS 的首页 hero 用的是 16:9 摄影图，不是模板里 480×680 的竖构图抠图产品照。
   kiln 给 .hero-art 定的 1/1 会让横图上下空出一大块（图按 object-fit:contain 居中），
   这里按实际素材的比例放宽到 16/10；换回竖构图素材时删掉这一条即可。 */
.hero-art{aspect-ratio:16/10}


/* Corporate composition: one width scale, compact rhythm, uncropped product media. */
body{overflow-x:clip;font-size:16px;line-height:1.65}
h1,h2,h3,h4{font-weight:600;text-wrap:balance}
.wrap{width:100%}
.wrap>*{min-width:0}
.caps{font-size:.75rem;letter-spacing:.12em;font-weight:600}
.h-sec{font-size:clamp(1.7rem,2.6vw,2.5rem);letter-spacing:-.025em;line-height:1.2}
.lede{font-size:1rem;line-height:1.8}
.btn{min-height:44px;padding:.8rem 1.35rem;border-radius:3px;font-size:.82rem;font-weight:600;letter-spacing:.02em;text-transform:none;justify-content:center;transition:background .2s,border-color .2s,color .2s}
.btn-ember{background:var(--cta);color:var(--cta-ink);box-shadow:none}
.btn-ember:hover{background:var(--cta-hover);color:#fff;box-shadow:none}
.tlink{font-size:.82rem;letter-spacing:.025em;text-transform:none;color:var(--ember)}
.nav{background:#fffffffa;box-shadow:0 2px 14px #0b254508}
:root{--nav-h:80px}
.nav-in{height:var(--nav-h);gap:24px}
.brand{min-width:0;align-items:center;gap:12px}
.brand::before{content:'';width:7px;height:30px;background:var(--ember);flex:none}
.brand b{font-size:1.05rem;line-height:1.3;overflow-wrap:anywhere;max-width:260px;letter-spacing:-.025em}
.brand i{display:none}
.nav-links{gap:22px;letter-spacing:0;font-size:.86rem;text-transform:none;white-space:nowrap}
.nav-links a{font-weight:500;color:#30475B}
.nav-links a[aria-current='page']::after{height:3px}
.nav-cta .btn,.language summary{min-height:40px;padding:.55rem .85rem;font-size:.78rem;letter-spacing:.025em;text-transform:none}
.nav-cta .nav-contact{display:none}
.language li>a{font-size:.8rem;letter-spacing:.025em}
.language ul{box-shadow:0 12px 28px #0b254518;background:#fff}
.nav-drawer{background:#fff}
.nav-drawer a,.nav-drawer li.sub>a{font-size:.95rem;letter-spacing:0;text-transform:none}
.hero{background:var(--deep);color:#fff;--muted:#BCD0DE;--ash:#fff;--hair:#ffffff30;--hair-2:#ffffff20;--ember:#6FB4E0}
.hero::before,.hero::after,.hero-art::before,.page-head::before,.close::before,.card-art::before,.home-product-image::before{display:none}
.hero-in{grid-template-columns:minmax(0,1fr) minmax(0,1fr);min-height:520px;gap:56px;padding-block:52px}
.hero-copy{padding-block:10px}
.hero h1,.hero .slide h2,.hero--banner h2{font-size:clamp(2.2rem,3.7vw,3.55rem);font-weight:600;line-height:1.14;letter-spacing:-.035em;margin:16px 0 22px;max-width:20ch;overflow-wrap:anywhere}
.hero-copy .lede{max-width:49ch;color:#cadbe7}
.hero-acts{gap:20px;margin-top:30px}
.hero-acts .btn-ember{background:var(--cta);color:var(--cta-ink)}
.hero-acts .btn-ember:hover{background:var(--cta-hover);color:#fff}
.hero-acts .tlink{color:#fff;border-color:#7894ab}
.hero-art{height:auto;max-height:none;aspect-ratio:16/10;order:0;padding:0;background:#fff;border-radius:4px;overflow:hidden;border:1px solid #ffffff30}
.hero-art img{left:0;top:0;width:100%;height:100%;object-fit:contain;filter:none;animation:none}
.hero-art.scene-visual img{object-fit:cover}
.hero-caption{display:block;left:0;bottom:0;right:0;padding:12px 18px;background:#0b2545d9;color:#fff;font-size:.75rem;letter-spacing:.035em;text-transform:none}
.hero-foot{padding-block:14px;min-height:52px}
.hero-note{font-size:.72rem;letter-spacing:.045em;color:#a9c5d8}
.hero-controls,.hero-controls [data-slide-count]{color:#dcebf5}
.hero-controls button{color:#fff}
/* Homepage carousel: edge-to-edge photography beneath the sticky navigation.
   Keep existing carousel hooks; the information strip remains in normal flow. */
.home-page>.hero .slide{position:relative;isolation:isolate;min-height:calc(100vh - var(--nav-h) - 1px);min-height:calc(100svh - var(--nav-h) - 1px)}
.home-page>.hero .hero-in{position:static;display:flex;align-items:center;min-height:inherit;gap:0;padding-block:clamp(72px,10vh,120px) 112px}
.home-page>.hero .hero-copy{position:relative;z-index:2;width:min(100%,640px);padding:0}
.home-page>.hero .hero-art{position:absolute;inset:0;z-index:0;width:100%;height:100%;max-width:none;max-height:none;aspect-ratio:auto;margin:0;border:0;border-radius:0;background:var(--deep);pointer-events:none}
.home-page>.hero .hero-art picture{display:block;width:100%;height:100%}
.home-page>.hero .hero-art img{position:absolute;inset:0;z-index:0;width:100%;height:100%;object-fit:cover;object-position:center;transform:none}
.home-page>.hero .hero-art::after{content:'';position:absolute;inset:0;z-index:1;background:linear-gradient(90deg,rgba(7,27,51,.82),rgba(7,27,51,.48) 48%,rgba(7,27,51,.12)),linear-gradient(0deg,rgba(7,27,51,.55),transparent 35%)}
.home-page>.hero .hero-copy .lede{color:#e1edf5}
.home-page>.hero .hero-caption{inset:auto var(--pad) 80px auto;max-width:38%;padding:0;background:none;color:#dae8f3;text-align:right}
.home-page>.hero .hero-foot{position:absolute;z-index:3;bottom:0;left:50%;transform:translateX(-50%);min-height:64px;padding-block:16px;border-color:#ffffff30}
@media(max-width:880px){
  .home-page>.hero .hero-in{padding-block:64px 112px}
  .home-page>.hero .hero-art::after{background:linear-gradient(90deg,rgba(7,27,51,.76),rgba(7,27,51,.34)),linear-gradient(0deg,rgba(7,27,51,.5),transparent 45%)}
  .home-page>.hero .hero-caption{display:none}
}
@media(max-width:560px){
  .home-page>.hero .hero-in{padding-block:48px 112px}
  .home-page>.hero .hero-copy{width:100%}
  .home-page>.hero .hero-art::after{background:linear-gradient(0deg,rgba(7,27,51,.82),rgba(7,27,51,.4) 75%,rgba(7,27,51,.28))}
  .home-page>.creds .creds-in{grid-template-columns:minmax(0,1fr)}
}

.creds{background:#F3F7FA;border-color:#e1e9ef}
.creds-in{margin:0;grid-template-columns:repeat(auto-fit,minmax(200px,1fr))}
.cred{padding:24px 22px}
.cred:first-child{padding-left:0}
.cred dt{font-size:.72rem;color:#526579;letter-spacing:.08em;margin-bottom:8px}
.cred dd{font-size:.95rem;font-weight:500;line-height:1.5;overflow-wrap:anywhere}
.cred dd small{font-size:.75rem}
.home-page>.section{padding-block:clamp(4rem,5.5vw,5.5rem)}
.home-page>.home-collection{padding-block:clamp(4rem,5.5vw,5.5rem);background:#fff}
.home-page>.company-intro{background:#f3f7fa}
.home-page>.company-intro .sec-head{margin-bottom:0}
.sec-head{gap:28px;margin-bottom:28px;align-items:end}
.sec-head .t{max-width:780px}
.sec-head .lede{margin-top:14px}
.sec-head>.btn{flex:none}
.grid{grid-template-columns:repeat(4,minmax(0,1fr));gap:22px;border:0;background:none;box-shadow:none}
.grid>*{box-shadow:none;min-width:0}
.home-collection .grid{grid-template-columns:repeat(4,minmax(0,1fr));gap:24px}
.card{background:#fff;border:1px solid #E0E8EE;border-radius:4px;overflow:hidden;transition:border-color .2s,box-shadow .2s}
.card:hover{background:#fff;border-color:#a3c7dc;box-shadow:0 8px 24px #0b25450a}
.card-art,.home-product-image{aspect-ratio:1/1;background:#F5F8FA;grid-template-columns:minmax(0,1fr);grid-template-rows:minmax(0,1fr)}
.card-art img,.home-product-image img{width:88%;height:88%;max-width:100%;max-height:100%;object-fit:contain;filter:none}
.card:hover .card-art img,.card:hover .home-product-image img{transform:none}
.card-body{padding:18px 20px 20px;gap:7px;min-height:100px;border-color:#e4ebf0}
.card h3{font-size:1rem;font-weight:600;line-height:1.45;overflow-wrap:anywhere}
.card .spec{font-size:.8rem;letter-spacing:0;color:#526579;line-height:1.6}
.card-cat{font-size:.72rem;letter-spacing:.06em}
.plot{font-size:.78rem;color:#526579;letter-spacing:.02em;aspect-ratio:auto;min-height:70px}
.filters{gap:8px;margin-bottom:24px}
.filters button{font-size:.82rem;letter-spacing:0;text-transform:none;border-radius:3px;padding:.65rem 1rem}
.filters button[aria-pressed='true']{background:var(--ember);color:white;border-color:var(--ember)}
.process{border:0;background:#F3F7FA;border-radius:4px}
.process-head{padding:32px;gap:32px}
.steps{grid-template-columns:repeat(3,minmax(0,1fr))}
.step{padding:28px 32px;border-color:#d8e4ec}
.step .idx{font-size:1.8rem;line-height:1;color:var(--ember);letter-spacing:-.05em;margin-bottom:18px}
.step h3{font-size:1.05rem;margin:0}
.posts{grid-template-columns:repeat(auto-fit,minmax(min(100%,280px),1fr));gap:24px;border:0}
.post{border:1px solid #dfe8ee!important;border-radius:4px;padding:28px;background:#fff}
.post h3{font-size:1.2rem;max-width:48ch}
.post p{max-width:85ch}
.post .rd{font-size:.8rem;letter-spacing:.025em;color:var(--ember)}
.trade-section{background:#f3f7fa;border-top:1px solid #e1e9ef}
.trade-section .split{align-items:center}
.trade-public-grid:empty{display:none}
.trade-section [role='status']:empty{display:none}
.trade-public-grid article{background:#fff;border-color:#dce6ed}
.trade-public-grid article h3{font-size:1.05rem}
.close{background:var(--deep);color:#fff;padding-block:56px;--muted:#BDD1DF;--ash:#fff;--hair:#ffffff40;--ember:#7CB8E4;--glow:#fff}
.close h2{font-size:clamp(1.85rem,3vw,2.8rem)}
.close .btn:not(.btn-ember){color:white}
.close .caps{color:#8bd4fa}
footer{background:var(--deep-2);--ash:#fff;--ink:#c6d7e4;--muted:#adc1d1;--hair:#ffffff26;--hair-2:#ffffff16;--ember:#84BBE7;--glow:#fff}
.foot-in{grid-template-columns:minmax(0,1.5fr) repeat(3,minmax(0,1fr));gap:40px}
.foot-in h4{color:#fff;font-size:.8rem;letter-spacing:.04em}
.foot-in a,.foot-note{font-size:.87rem}
.foot-base{font-size:.72rem;letter-spacing:.02em;color:#adc1d1;text-transform:none}
.page-head{background:#F3F7FA;padding-block:36px 40px}
.page-head h1{font-size:clamp(1.85rem,3vw,2.75rem);font-weight:600;letter-spacing:-.025em}
.page-head .lede{margin-top:16px}
.crumbs{font-size:.8rem;letter-spacing:0}
.pd{gap:48px}
.pd-art{background:#F5F8FA;aspect-ratio:4/3;border-color:#dce6ed;border-radius:4px}
.pd-art img{width:88%;height:88%;object-fit:contain;filter:none}
.thumbs button{width:72px;background:#f5f8fa;border-radius:3px;overflow:hidden}
.thumbs button[aria-pressed='true']{background:#eaf3f9;border-color:var(--ember)}
.thumbs button img{width:88%;height:88%;object-fit:contain}
.pd-lead{font-weight:600;color:var(--ember)}
#inquiry .split{grid-template-columns:minmax(0,1.65fr) minmax(260px,.85fr);gap:40px}
.form{background:#fff;padding:28px;border:1px solid #dce6ed;border-radius:4px}
.field label,.field .field-label{font-size:.82rem;letter-spacing:0;text-transform:none;color:#30475B;font-weight:500}
.field input,.field select,.field textarea{font-size:.95rem;background-color:#fff;border:1px solid #b9cbd7;border-radius:3px;color:var(--ash);min-width:0;width:100%}
.field textarea{min-height:100px}
.field input:focus,.field select:focus,.field textarea:focus{border-color:var(--ember);outline:2px solid #1565a826;outline-offset:1px}
.field .hint,.check,.file-name{font-size:.8rem;color:#526579;letter-spacing:0}
.inquiry-list{background:#F3F7FA;border:1px solid #dce6ed;border-radius:4px}
.inquiry-list h3{font-size:1.1rem}
.rfq-empty{font-size:.9rem}
.service-widget summary{background:var(--ember);color:#fff;border:0;border-radius:4px;font-size:.82rem;letter-spacing:0;box-shadow:0 4px 14px #0b254524}
.service-widget>div{background:#fff;border-radius:4px;box-shadow:0 8px 28px #0b25451a}
.analytics-consent{box-shadow:0 -2px 18px #0b25450d;background:#fff;border-top:1px solid #dce6ed;padding:12px var(--pad)}
.analytics-consent::before{display:none}
.analytics-consent p{font-size:.8rem}
.analytics-consent button{font-size:.78rem;letter-spacing:0;border-radius:3px}
.analytics-consent button[data-analytics-choice='yes']{background:var(--ember);color:#fff}
@media(min-width:1121px){.brand{max-width:290px}.nav-links{margin-left:auto}}
@media(max-width:1120px){:root{--nav-h:72px}.nav-in{height:var(--nav-h)}.hero-in{gap:32px;min-height:410px}.nav-cta .btn{font-size:.76rem}.grid,.home-collection .grid{grid-template-columns:repeat(3,minmax(0,1fr))}.foot-in{grid-template-columns:repeat(2,minmax(0,1fr))}.step:nth-child(-n+2){border-bottom:0}.step:nth-child(2){border-right:1px solid #d8e4ec}}
@media(max-width:880px){.hero-in{grid-template-columns:minmax(0,1fr);padding-block:36px;gap:28px}.hero-copy{padding:0}.hero h1,.hero .slide h2{max-width:24ch}.hero-art{order:0;aspect-ratio:16/9;width:100%;max-width:620px;max-height:none}.creds-in{grid-template-columns:repeat(2,minmax(0,1fr))}.cred{padding:20px}.cred:nth-child(3){border-left:0}.cred:first-child{padding-left:20px}.grid,.home-collection .grid{grid-template-columns:repeat(2,minmax(0,1fr))}.home-page>.section,.home-page>.home-collection{padding-block:clamp(2.5rem,5vw,3.5rem)}.process-head{grid-template-columns:1fr;gap:16px;padding:24px}.steps{grid-template-columns:repeat(3,minmax(0,1fr))}.step{padding:24px 20px}.pd{gap:28px}#inquiry .split{grid-template-columns:minmax(0,1fr)}.rail-wrap{position:static}.sec-head{flex-wrap:wrap}.trade-section .split{grid-template-columns:1fr;gap:24px}}
@media(max-width:560px){:root{--nav-h:68px}.nav-in{height:var(--nav-h);gap:12px}.brand b{font-size:.88rem;max-width:140px}.brand::before{width:4px;height:24px}.nav-cta{gap:7px}.nav-cta>.btn-ember{padding:8px 10px;max-width:126px;line-height:1.25;font-size:.72rem}.language summary{padding:8px;font-size:.72rem}.nav-burger{width:36px;height:38px;flex:none}.hero-in{padding-block:32px;gap:26px}.hero h1,.hero .slide h2{font-size:2.2rem}.hero-art{aspect-ratio:4/3}.hero-caption{font-size:.78rem;padding:9px 12px}.hero-foot{gap:12px}.hero-note{max-width:100%;overflow-wrap:anywhere}.creds-in{grid-template-columns:repeat(2,minmax(0,1fr))}.cred{padding:18px 12px}.cred:first-child{padding-left:12px}.cred dd{font-size:.86rem}.cred dt{font-size:.78rem}.grid,.home-collection .grid{grid-template-columns:minmax(0,1fr);gap:20px}.card-art,.home-product-image{aspect-ratio:1/1}.card-body{min-height:0}.sec-head{display:block}.sec-head>.btn{margin-top:20px}.steps{grid-template-columns:1fr}.step,.step:nth-child(2){border-right:0;border-bottom:1px solid #d8e4ec;display:flex;gap:22px;align-items:center;padding:22px 24px}.step:last-child{border-bottom:0}.step .idx{margin:0;font-size:1.5rem}.step h3{font-size:1rem}.form{padding:20px}.foot-in{grid-template-columns:1fr;gap:28px}.close{padding-block:44px}.post{padding:24px}.btn{padding:.75rem 1.1rem}.service-widget{bottom:12px;right:12px}}
@media(max-width:380px){.brand b{max-width:80px;font-size:.78rem}.brand{gap:8px}.nav-in{gap:6px}.nav-cta>.btn-ember{max-width:108px;font-size:.78rem}.language summary{padding:7px}.nav-cta{gap:5px}}

/* ── S4/G4 制造能力（capability 块）：统一样式段 ─────────────────────────────────────────
   kiln 里没有这个组件，按纪律用附加类集中写在这里（不往 kiln.css 混写）。
   结构复用既有原语：.split（图文）/ .facts（数据统计）/ .cap-list（能力清单，本段新增）。 */
.capability{background:#fff;border-top:1px solid #e1e9ef;border-bottom:1px solid #e1e9ef}
.capability .cap-intro{align-items:center;gap:clamp(2rem,5vw,4.5rem)}
.capability .cap-intro img{width:100%;height:auto;display:block;border-radius:4px}
.capability .facts{margin-top:clamp(2rem,4vw,3.2rem);border-color:#dce6ed}
.capability .facts .fact b{color:var(--deep);font-weight:400;letter-spacing:-.03em}
.capability .facts .fact span{letter-spacing:.08em;color:#526579}
.cap-list{list-style:none;margin:clamp(2rem,4vw,3.2rem) 0 0;padding:0;display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,260px),1fr));gap:24px}
.cap-list li{background:#F3F7FA;border:1px solid #dce6ed;border-radius:4px;padding:26px 28px}
.cap-list li .k{display:block;margin-bottom:10px;font-size:.72rem;letter-spacing:.08em;text-transform:uppercase;color:var(--ember)}
.cap-list h3{margin:0;font-size:1.05rem}
.cap-list p{margin:8px 0 0;font-size:.92rem;line-height:1.6;color:#526579}
@media(max-width:880px){.capability .cap-intro{grid-template-columns:minmax(0,1fr)}}

`;

export const siteCSS = kilnCSS + kilnExtraCSS;
