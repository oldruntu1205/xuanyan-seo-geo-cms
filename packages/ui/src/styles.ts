// 本文件由 packages/ui/scripts/build-css.mjs 生成，请勿手改。
// 源文件：packages/ui/src/kiln.css + packages/ui/src/kiln-extra.css
// 重新生成：pnpm --filter @suns/ui css:build

/* ── kiln.css · 46993 bytes ── kiln 设计系统（与 H:/Workbuddy/2026-10-02-18-17-59/opctools-redesign/assets/kiln.css 逐字一致，勿在此手改） */
export const kilnCSS = `/* ============================================================
   KILN — OPCTOOLS design system
   ============================================================
   Glass is made by fire, and this site never lets you forget it.
   The room is dark and warm; every object is lit from behind as if
   standing in front of an open furnace door. Type is set in wide,
   light capitals — the voice of a workshop, not a showroom.

   This file is the single source of truth for the shell (tokens,
   nav, footer, buttons, section primitives) and for the interior
   page components. Pages carry no duplicated base CSS.
   ============================================================ */

*,*::before,*::after{box-sizing:border-box}

:root{
  --char:   #14100E;
  --char-2: #1E1815;
  --char-3: #2A211C;
  --ember:  #D9722F;
  --glow:   #FFC978;
  --kiln:   #3E2A1E;
  --ash:    #EFE7DD;
  --hair:   rgba(239,231,221,.13);
  --hair-2: rgba(239,231,221,.07);
  /* flat equivalent of --hair-2 over --char, for places that must not stack */
  --hair-line: #241F1D;
  --muted:  rgba(239,231,221,.6);
  --ink:    rgba(239,231,221,.82);

  --sans: "Inter","Helvetica Neue",Helvetica,Arial,"Segoe UI",system-ui,-apple-system,"PingFang SC","Microsoft YaHei",sans-serif;
  --mono: ui-monospace,"SF Mono","Cascadia Mono",Consolas,monospace;
  --pad: clamp(1.25rem,4.4vw,4.5rem);
  --ease: cubic-bezier(.22,.61,.36,1);
  --nav-h: clamp(62px,7vw,76px);
}

/* Opts the whole document into the dark rendering path for native widgets —
   scrollbars, the <select> popup, and any control that still paints itself.
   Without it the platform draws those light, which reads as a bright seam
   against every surface on the page. */
html{-webkit-text-size-adjust:100%; scroll-behavior:smooth; color-scheme:dark}
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
.wrap{max-width:1420px; margin:0 auto; padding-inline:var(--pad)}

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
.section{padding-block:clamp(4.5rem,9vw,8rem)}
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
.btn:hover{border-color:rgba(239,231,221,.42); background:rgba(239,231,221,.05)}
.btn-ember{
  background:linear-gradient(120deg, #E07C33, #C2601F);
  border-color:transparent; color:#1A120C;
  box-shadow:0 14px 34px -16px rgba(217,114,47,.9);
}
.btn-ember:hover{background:linear-gradient(120deg,#F08A3A,#D06A24); box-shadow:0 20px 42px -16px rgba(217,114,47,.95)}
.btn-sm{padding:.62rem 1.15rem; font-size:.66rem}
.btn-row{display:flex; flex-wrap:wrap; gap:.7rem; margin-top:2.2rem}

/* ---------- text link ---------- */

.tlink{
  display:inline-flex; align-items:center; gap:.5rem;
  font-size:.68rem; letter-spacing:.2em; text-transform:uppercase;
  color:rgba(239,231,221,.55);
  border-bottom:1px solid var(--hair); padding-bottom:.35rem;
  transition:color .3s var(--ease), border-color .3s var(--ease);
}
.tlink:hover{color:var(--glow); border-bottom-color:rgba(255,201,120,.55)}

/* ============================================================
   NAV
   ============================================================ */

.nav{
  position:sticky; top:0; z-index:60;
  background:rgba(20,16,14,.82);
  backdrop-filter:blur(16px); -webkit-backdrop-filter:blur(16px);
  border-bottom:1px solid var(--hair-2);
}
.nav-in{display:flex; align-items:center; gap:clamp(1rem,3vw,2.4rem); height:var(--nav-h)}
.brand{display:flex; align-items:baseline; gap:.65rem; margin-right:auto}
.brand b{font-size:1.12rem; font-weight:600; letter-spacing:.02em}
.brand i{font-style:normal; font-size:.6rem; letter-spacing:.28em; text-transform:uppercase; color:rgba(239,231,221,.42)}
.nav-links{display:flex; gap:clamp(.9rem,2.2vw,2rem); font-size:.68rem; letter-spacing:.24em; text-transform:uppercase}
.nav-links a{color:var(--muted); padding-block:.5rem; transition:color .3s var(--ease)}
.nav-links a:hover{color:var(--ash)}
.nav-links a[aria-current="page"]{color:var(--ash)}
.nav-cta{display:flex; align-items:center; gap:.6rem}
.nav-cta .btn{padding:.62rem 1.15rem; font-size:.66rem}
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

/* ============================================================
   HERO — an object in front of the furnace (home)
   ============================================================ */

.hero{position:relative; overflow:hidden}
/* the furnace door, sitting behind everything */
.hero::before{
  content:"";
  position:absolute; right:-6%; top:6%; width:min(70vw,900px); aspect-ratio:1;
  background:radial-gradient(circle at 50% 50%,
      rgba(255,201,120,.24) 0%,
      rgba(217,114,47,.16) 26%,
      rgba(217,114,47,.06) 46%,
      transparent 68%);
  pointer-events:none;
}
.hero::after{
  content:"";
  position:absolute; inset:auto 0 0 0; height:1px;
  background:linear-gradient(90deg, transparent, rgba(217,114,47,.5), transparent);
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
  background:linear-gradient(100deg, #FFD08A, #D9722F 62%);
  -webkit-background-clip:text; background-clip:text; color:transparent;
}
.hero-acts{display:flex; flex-wrap:wrap; gap:.7rem; margin-top:2.2rem}

.hero-art{position:relative; aspect-ratio:1/1; display:grid; place-items:center; padding:6%}
/* the glow sits between object and room */
.hero-art::before{
  content:"";
  position:absolute; inset:8%;
  background:radial-gradient(circle at 50% 52%, rgba(255,201,120,.22), rgba(217,114,47,.08) 42%, transparent 68%);
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
    drop-shadow(0 0 1.4px rgba(255,201,120,.5))
    drop-shadow(0 22px 40px rgba(0,0,0,.75));
  animation:ember-rise 1.1s var(--ease) both .16s;
}
.hero-stamp{
  position:absolute; z-index:3; left:0; bottom:2%;
  font-size:.62rem; letter-spacing:.26em; text-transform:uppercase;
  color:rgba(239,231,221,.4);
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
  background:radial-gradient(circle, rgba(217,114,47,.15), transparent 66%);
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
  font-size:.62rem; letter-spacing:.2em; text-transform:uppercase;
  color:rgba(239,231,221,.38); margin-bottom:1.5rem;
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
  font-size:.64rem; letter-spacing:.2em; text-transform:uppercase;
  border:1px solid var(--hair); color:var(--muted);
  transition:all .35s var(--ease);
}
.filters button:hover{color:var(--ash); border-color:rgba(239,231,221,.4)}
.filters button[aria-pressed="true"]{background:var(--ember); border-color:var(--ember); color:#1A120C}

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
  background:radial-gradient(circle at 50% 56%, rgba(255,201,120,.2), rgba(217,114,47,.06) 44%, transparent 68%);
  opacity:.55; transition:opacity .5s var(--ease);
}
.card:hover .card-art::before{opacity:1}
.card-art img{
  position:relative; z-index:2; width:66%;
  transition:transform .55s var(--ease);
  filter:drop-shadow(0 0 1.2px rgba(255,201,120,.4)) drop-shadow(0 14px 24px rgba(0,0,0,.7));
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
  border:1px dashed rgba(239,231,221,.22);
  font-size:.6rem; letter-spacing:.2em; text-transform:uppercase; line-height:1.7;
  color:rgba(239,231,221,.34);
  transition:border-color .45s var(--ease), color .45s var(--ease);
}
.card--plot:hover .plot{border-color:rgba(255,201,120,.45); color:var(--glow)}
/* the full-width stage frame reads a touch smaller so it does not compete
   with the panel it sits in */
.pd-art--plot .plot{width:56%}
.card-body{padding:1.15rem 1.35rem 1.45rem; border-top:1px solid var(--hair-2); display:flex; flex-direction:column; gap:.5rem; flex:1}
.card-cat{font-size:.6rem; letter-spacing:.22em; text-transform:uppercase; color:var(--ember)}
.card h3{font-size:.98rem; letter-spacing:.005em; line-height:1.4}
.card .spec{font-size:.7rem; letter-spacing:.06em; color:rgba(239,231,221,.42); margin-top:auto; padding-top:.7rem}
.cat-foot{margin-top:clamp(1.8rem,3.4vw,2.6rem)}

/* ============================================================
   CREDENTIALS / FACTS
   ============================================================ */

.creds{border-block:1px solid var(--hair)}
.creds-in{display:grid; grid-template-columns:repeat(4,minmax(0,1fr))}
.cred{padding:clamp(1.5rem,3vw,2.2rem) clamp(1rem,2vw,1.6rem); border-left:1px solid var(--hair-2)}
.cred:first-child{border-left:0}
.cred dt{font-size:.62rem; letter-spacing:.24em; text-transform:uppercase; color:rgba(239,231,221,.42); margin-bottom:.8rem}
.cred dd{margin:0; font-size:clamp(1rem,1.4vw,1.25rem); font-weight:400; letter-spacing:.01em}
.cred dd small{display:block; font-size:.74rem; color:var(--muted); margin-top:.35rem; letter-spacing:0}

.facts{display:grid; grid-template-columns:repeat(4,minmax(0,1fr)); border:1px solid var(--hair)}
.fact{padding:clamp(1.3rem,2.6vw,2rem) clamp(1rem,2vw,1.5rem); border-right:1px solid var(--hair-2)}
.fact:last-child{border-right:0}
.fact b{display:block; font-size:clamp(1.45rem,2.8vw,2.1rem); font-weight:300; letter-spacing:.005em; color:var(--glow)}
.fact span{display:block; margin-top:.5rem; font-size:.64rem; letter-spacing:.18em; text-transform:uppercase; color:rgba(239,231,221,.42)}

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
.row .meta{font-size:.62rem; letter-spacing:.2em; text-transform:uppercase; color:rgba(239,231,221,.42); padding-top:.35rem}
.row .meta b{display:block; color:var(--ember); font-weight:500; margin-bottom:.45rem}
.row h3{font-size:clamp(1.05rem,1.7vw,1.32rem); letter-spacing:.005em; line-height:1.3; margin-bottom:.65rem}
.row p{color:var(--muted); font-size:.9rem; max-width:64ch}
.row .go{font-size:.64rem; letter-spacing:.2em; text-transform:uppercase; color:rgba(239,231,221,.38); white-space:nowrap; padding-top:.4rem; transition:color .35s var(--ease)}
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
.prose a{color:var(--glow); border-bottom:1px solid rgba(255,201,120,.35); transition:border-color .3s var(--ease)}
.prose a:hover{border-bottom-color:var(--glow)}
.prose strong{font-weight:600}
.prose em{color:var(--glow); font-style:normal}
.prose hr{border:0; border-top:1px solid var(--hair); margin-top:2.8rem}
.prose blockquote{
  margin-top:2.1rem; padding:1.15rem 0 1.15rem clamp(1rem,2.4vw,1.7rem);
  border-left:2px solid var(--ember);
  font-size:clamp(1.02rem,1.5vw,1.16rem); line-height:1.55; color:var(--ash);
}
.prose blockquote cite{display:block; margin-top:.9rem; font-size:.68rem; letter-spacing:.2em; text-transform:uppercase; color:rgba(239,231,221,.42); font-style:normal}
.prose figure{margin-top:2.4rem}
.prose figure img{border:1px solid var(--hair); background:var(--char-2); width:100%}
.prose figcaption{margin-top:.85rem; font-size:.72rem; letter-spacing:.06em; color:rgba(239,231,221,.45)}
.prose code{font-family:var(--mono); font-size:.86em; background:var(--char-2); border:1px solid var(--hair-2); padding:.12rem .4rem}
.prose .figure--plate img{background:var(--char-2)}

/* two-column body with sticky aside */
.doc{display:grid; grid-template-columns:minmax(0,1fr) 15.5rem; gap:clamp(2rem,5vw,4.5rem); align-items:start}
.toc{position:sticky; top:calc(var(--nav-h) + 1.6rem)}
.toc h4{font-size:.6rem; letter-spacing:.24em; text-transform:uppercase; color:rgba(239,231,221,.42); font-weight:400; margin-bottom:1rem}
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
  font-size:.68rem; letter-spacing:.16em; text-transform:uppercase; color:rgba(239,231,221,.45);
}
.byline b{color:var(--ember); font-weight:500}

/* ============================================================
   TABLES
   ============================================================ */

.spec-table{width:100%; border-collapse:collapse; font-size:.87rem}
.spec-table caption{
  text-align:left; padding-bottom:.95rem;
  font-size:.62rem; letter-spacing:.24em; text-transform:uppercase; color:rgba(239,231,221,.42);
}
.spec-table th,.spec-table td{padding:.85rem 1rem; border-bottom:1px solid var(--hair-2); text-align:left; vertical-align:top}
.spec-table th{font-weight:400; letter-spacing:.06em; color:rgba(239,231,221,.5)}
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
  scrollbar-width:thin; scrollbar-color:rgba(239,231,221,.25) transparent}
.table-wrap::-webkit-scrollbar{height:6px}
.table-wrap::-webkit-scrollbar-thumb{background:rgba(239,231,221,.22)}
.table-wrap::-webkit-scrollbar-track{background:transparent}

/* ============================================================
   CALLOUTS
   ============================================================ */

.note{
  border:1px solid var(--hair); border-left:2px solid var(--ember);
  background:linear-gradient(120deg, rgba(217,114,47,.07), transparent 62%);
  padding:clamp(1.15rem,2.4vw,1.6rem) clamp(1.15rem,2.4vw,1.7rem);
}
.note h4{font-size:.64rem; letter-spacing:.22em; text-transform:uppercase; color:var(--glow); font-weight:500; margin-bottom:.6rem}
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
.timeline .yr{font-size:.64rem; letter-spacing:.2em; text-transform:uppercase; color:var(--ember)}
.timeline h3{font-size:1rem; margin:.45rem 0 .5rem}
.timeline p{color:var(--muted); font-size:.88rem; max-width:62ch}

/* ============================================================
   FORMS
   ============================================================ */

.form{display:grid; gap:1.15rem}
.form .duo{display:grid; grid-template-columns:minmax(0,1fr) minmax(0,1fr); gap:1.15rem}
.field{display:grid; gap:.55rem}
.field label,.field .field-label{font-size:.62rem; letter-spacing:.22em; text-transform:uppercase; color:rgba(239,231,221,.5)}
.field input,.field select,.field textarea{
  width:100%; padding:.92rem 1.05rem;
  font:inherit; font-size:.9rem; color:var(--ash);
  background:var(--char-2); border:1px solid var(--hair); border-radius:0;
  transition:border-color .3s var(--ease), background .3s var(--ease);
}
.field input::placeholder,.field textarea::placeholder{color:rgba(239,231,221,.28)}
.field input:focus,.field select:focus,.field textarea:focus{
  outline:none; border-color:rgba(255,201,120,.5); background:#221B17;
}
.field textarea{min-height:9.5rem; resize:vertical}
.field select{
  appearance:none; cursor:pointer;
  background-image:linear-gradient(45deg,transparent 50%,rgba(239,231,221,.5) 50%),linear-gradient(135deg,rgba(239,231,221,.5) 50%,transparent 50%);
  background-position:calc(100% - 1.4rem) 50%, calc(100% - 1rem) 50%;
  background-size:5px 5px, 5px 5px; background-repeat:no-repeat;
}
.field select option{background:var(--char-2)}
.field .hint{font-size:.72rem; color:rgba(239,231,221,.4); letter-spacing:.02em}
.form-foot{display:flex; flex-wrap:wrap; align-items:center; gap:1.2rem; margin-top:.6rem}
.form-status{
  display:none; border:1px solid rgba(255,201,120,.4);
  background:linear-gradient(120deg, rgba(255,201,120,.1), transparent 60%);
  padding:1rem 1.15rem; font-size:.86rem; color:var(--ash);
}
.form-status[data-shown="true"]{display:block}

/* ============================================================
   INFO BLOCKS (contact)
   ============================================================ */

.info{display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); border:1px solid var(--hair)}
.info>div{padding:clamp(1.4rem,2.8vw,2.1rem) clamp(1.1rem,2.2vw,1.6rem); border-right:1px solid var(--hair-2)}
.info>div:last-child{border-right:0}
.info h4{font-size:.62rem; letter-spacing:.22em; text-transform:uppercase; color:rgba(239,231,221,.42); font-weight:400; margin-bottom:.95rem}
.info p,.info a{font-size:.9rem; color:var(--ink)}
.info a{color:var(--glow)}
.info a:hover{border-bottom:1px solid var(--glow)}
.info dl{margin:0; display:grid; gap:.55rem; font-size:.88rem}
.info dt{color:rgba(239,231,221,.45); font-size:.7rem; letter-spacing:.14em; text-transform:uppercase}
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
    radial-gradient(circle at 50% 56%, rgba(255,201,120,.18), rgba(217,114,47,.05) 44%, transparent 70%),
    linear-gradient(180deg, var(--char-2), var(--char));
}
.pd-art img{
  position:relative; z-index:2; width:72%;
  filter:drop-shadow(0 0 1.4px rgba(255,201,120,.4)) drop-shadow(0 20px 34px rgba(0,0,0,.72));
}
.pd-art--plate img{width:88%; border-radius:3px}
.thumbs{display:flex; flex-wrap:wrap; gap:.6rem; margin-top:1.1rem}
.thumbs button{
  width:76px; aspect-ratio:1/1; display:grid; place-items:center;
  border:1px solid var(--hair); background:var(--char-2);
  transition:border-color .3s var(--ease), background .3s var(--ease);
}
.thumbs button img{width:72%}
.thumbs button:hover{border-color:rgba(239,231,221,.4)}
.thumbs button[aria-pressed="true"]{border-color:var(--ember); background:#231A15}
/* A plate thumbnail is a framed photograph, not a cut-out, so it fills more of
   its square before it reads as the same weight as its neighbours. */
.thumbs button.plate img{width:92%}
.thumbs-note{margin-top:.9rem; font-size:.74rem; color:rgba(239,231,221,.45); max-width:52ch}

/* The panel used to open with the product name again, once the page head had
   already set it as the h1 inside the same screen. It opens on the one line
   that actually distinguishes the part instead — the fittings and capacity —
   and that line is dropped from the table below so it is stated once. */
.pd-lead{margin-top:.85rem; font-size:clamp(1.02rem,2vw,1.3rem); font-weight:300; line-height:1.35; letter-spacing:.015em; color:var(--ash)}
.pd-spec{margin-top:1.6rem; list-style:none; padding:0; display:grid; gap:.05rem}
.pd-spec li{display:flex; justify-content:space-between; gap:1.4rem; padding:.72rem 0; border-bottom:1px solid var(--hair-2); font-size:.88rem}
.pd-spec li span:first-child{color:rgba(239,231,221,.45); letter-spacing:.06em}
.pd-spec li span:last-child{text-align:right; color:var(--ink)}

.chips{display:flex; flex-wrap:wrap; gap:.45rem; margin-top:1.4rem}
.chips span{
  padding:.42rem .8rem; font-size:.62rem; letter-spacing:.18em; text-transform:uppercase;
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
.rail .c{font-size:.7rem; color:rgba(239,231,221,.35)}

/* ============================================================
   PAGINATION
   ============================================================ */

.pager{display:flex; flex-wrap:wrap; gap:.4rem; margin-top:clamp(2rem,4vw,3rem)}
.pager a,.pager span{
  min-width:2.7rem; padding:.65rem .9rem; text-align:center;
  border:1px solid var(--hair); font-size:.7rem; letter-spacing:.14em; color:var(--muted);
  transition:all .3s var(--ease);
}
.pager a:hover{color:var(--ash); border-color:rgba(239,231,221,.4)}
.pager [aria-current="page"]{background:var(--ember); border-color:var(--ember); color:#1A120C}

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
    radial-gradient(circle at 50% 76%, rgba(255,201,120,.2), rgba(217,114,47,.07) 38%, transparent 64%),
    linear-gradient(180deg, var(--char-2), var(--char));
  border:1px solid var(--hair);
}
.mat-art .kiln-line{
  position:absolute; left:0; right:0; bottom:26%; height:1px;
  background:linear-gradient(90deg, transparent, rgba(255,201,120,.55), transparent);
}
.mat-art .kiln-line::after{
  content:"≈ 1 200 °C"; position:absolute; right:1.2rem; top:-1.6rem;
  font-size:.58rem; letter-spacing:.2em; color:var(--glow); opacity:.75;
}
.mat-art img{
  position:relative; z-index:2; width:64%;
  filter:drop-shadow(0 0 1.4px rgba(255,201,120,.45)) drop-shadow(0 20px 32px rgba(0,0,0,.7));
}
.mat-list{list-style:none; margin:2rem 0 0; padding:0}
.mat-list li{display:grid; grid-template-columns:auto minmax(0,1fr); gap:1.1rem; padding:1.2rem 0; border-top:1px solid var(--hair-2)}
.mat-list li:last-child{border-bottom:1px solid var(--hair-2)}
.mat-list .n{font-size:.66rem; letter-spacing:.2em; color:var(--ember); padding-top:.3rem}
.mat-list h3{font-size:1rem; letter-spacing:.01em; margin-bottom:.35rem}
.mat-list p{color:var(--muted); font-size:.9rem}

/* ============================================================
   PROCESS
   ============================================================ */

.process{
  border:1px solid var(--hair);
  background:linear-gradient(160deg, rgba(217,114,47,.06), transparent 52%);
}
.process-head{
  display:grid; grid-template-columns:minmax(0,1fr) minmax(0,.82fr); gap:2.5rem; align-items:end;
  padding:clamp(1.8rem,3.4vw,2.8rem) clamp(1.3rem,3vw,2.4rem);
  border-bottom:1px solid var(--hair);
}
.steps{list-style:none; margin:0; padding:0; display:grid; grid-template-columns:repeat(4,minmax(0,1fr))}
.step{padding:clamp(1.5rem,3vw,2.2rem) clamp(1.1rem,2vw,1.6rem) clamp(1.9rem,3.6vw,2.6rem); border-right:1px solid var(--hair)}
.step:last-child{border-right:0}
.step .idx{font-size:.64rem; letter-spacing:.22em; color:var(--ember); display:block; margin-bottom:1.2rem}
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
.post:hover{background:linear-gradient(180deg, rgba(217,114,47,.07), transparent)}
.post .k{font-size:.6rem; letter-spacing:.22em; text-transform:uppercase; color:var(--ember); margin-bottom:1.3rem}
.post h3{font-size:1.08rem; letter-spacing:.005em; margin-bottom:.8rem}
.post p{color:var(--muted); font-size:.89rem; flex:1}
.post .rd{margin-top:1.7rem; padding-top:.9rem; border-top:1px solid var(--hair-2); font-size:.66rem; letter-spacing:.2em; text-transform:uppercase; color:rgba(239,231,221,.5)}
.post:hover .rd{color:var(--glow)}

/* ============================================================
   MARKET (home)
   ============================================================ */

.market-in{display:grid; grid-template-columns:minmax(0,1fr) minmax(0,.8fr); gap:clamp(2rem,4vw,4rem); align-items:center}
.market select{
  width:100%; margin-top:1.5rem; padding:1rem 1.15rem;
  font:inherit; font-size:.86rem; letter-spacing:.06em; color:var(--ash);
  background:var(--char-2); border:1px solid var(--hair); appearance:none; cursor:pointer;
  background-image:linear-gradient(45deg,transparent 50%,rgba(239,231,221,.5) 50%),linear-gradient(135deg,rgba(239,231,221,.5) 50%,transparent 50%);
  background-position:calc(100% - 1.4rem) 50%, calc(100% - 1rem) 50%;
  background-size:5px 5px, 5px 5px; background-repeat:no-repeat;
}
.market select option{background:var(--char-2)}
.market-note{margin-top:1rem; font-size:.82rem; color:rgba(239,231,221,.42); letter-spacing:.02em}
.market-art{
  aspect-ratio:4/3; display:grid; place-items:center; overflow:hidden;
  background:radial-gradient(circle at 50% 58%, rgba(255,201,120,.2), rgba(217,114,47,.06) 42%, transparent 66%), var(--char-2);
  border:1px solid var(--hair);
}
.market-art img{width:52%; filter:drop-shadow(0 0 1.4px rgba(255,201,120,.45)) drop-shadow(0 18px 28px rgba(0,0,0,.7))}

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
  background:radial-gradient(circle, rgba(217,114,47,.16), transparent 66%);
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
.foot-in h4{font-size:.62rem; letter-spacing:.24em; text-transform:uppercase; color:rgba(239,231,221,.42); font-weight:400; margin-bottom:1rem}
.foot-in ul{list-style:none; margin:0; padding:0; display:grid; gap:.58rem}
.foot-in a{font-size:.88rem; color:var(--muted); transition:color .3s var(--ease)}
.foot-in a:hover{color:var(--ash)}
.foot-note{font-size:.88rem; color:var(--muted); max-width:26rem; margin-top:.9rem}
.foot-base{display:flex; flex-wrap:wrap; justify-content:space-between; gap:1rem; padding-top:1.4rem; font-size:.68rem; letter-spacing:.12em; text-transform:uppercase; color:rgba(239,231,221,.38)}

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
  font-size:.62rem; letter-spacing:.24em; text-transform:uppercase;
  color:var(--ember);
}
.topic .rd{
  margin-top:1.7rem; padding-top:.9rem; border-top:1px solid var(--hair-2);
  font-size:.66rem; letter-spacing:.2em; text-transform:uppercase; color:rgba(239,231,221,.5);
}
.topic:hover .rd{color:var(--glow)}

/* ============================================================
   RAIL — sticky category navigation beside an index
   ============================================================ */

.rail-wrap{position:sticky; top:calc(var(--nav-h) + 1.6rem)}
.rail-wrap h4{
  font-size:.6rem; letter-spacing:.24em; text-transform:uppercase;
  color:rgba(239,231,221,.42); font-weight:400; margin-bottom:1rem;
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
  font-size:.64rem; letter-spacing:.18em; text-transform:uppercase;
  color:var(--ash); background:none;
  padding:.5rem .95rem; border:1px solid var(--hair); cursor:pointer;
  transition:border-color .3s var(--ease), color .3s var(--ease);
}
.file-field .file-btn:hover{border-color:rgba(239,231,221,.42)}
.file-field input[type="file"]:focus-visible + .file-btn{
  border-color:var(--glow); color:var(--glow);
}
.file-field .file-name{
  font-size:.82rem; letter-spacing:.02em; color:rgba(239,231,221,.4);
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
  background-image:linear-gradient(45deg,transparent 46%,#1A120C 46%,#1A120C 56%,transparent 56%),
                   linear-gradient(-45deg,transparent 58%,#1A120C 58%,#1A120C 68%,transparent 68%);
}
.check input:focus-visible{outline:2px solid var(--glow); outline-offset:3px}
.check span{font-size:.82rem; color:var(--muted); line-height:1.6}

/* ============================================================
   INQUIRY LIST — the basket that follows you through the site
   ============================================================ */

.inquiry-list{border:1px solid var(--hair); background:var(--char-2)}
.inquiry-list .hd{
  padding:1rem 1.2rem; border-bottom:1px solid var(--hair);
  font-size:.62rem; letter-spacing:.22em; text-transform:uppercase; color:rgba(239,231,221,.42);
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

/* ── kiln-extra.css · 25475 bytes ── kiln 之外的 CMS 组件层（询盘篮 / 轮播 / 统计同意 / 客服 / 市场块 / 搜索 / 分页） */
export const kilnExtraCSS = `/* ============================================================
   KILN-EXTRA — kiln 之外的 CMS 组件层
   ============================================================
   公开站（opctools.cloud / 9 语言 / nginx 直出静态页）的版式基座是
   packages/ui/src/kiln.css（与设计源 04-kiln 逐字一致，只读）。
   kiln 覆盖了模板站的全部版式区块；SUNS 另有一批模板里不存在的组件——
   询盘篮、首页轮播、统计同意、客服浮层、市场采购块、站内搜索、分页、
   语言切换、加询盘反馈——它们不是模板的一部分，所以集中放在本文件，
   不混进 kiln.css（kiln.css 要保持能与设计源逐行对比）。

   三条纪律：
   ① 只用 kiln 的变量（--char/--char-2/--char-3/--ember/--glow/--kiln/--ash/
      --hair/--hair-2/--hair-line/--muted/--ink/--sans/--mono/--pad/--ease/--nav-h）
      与 kiln 自己的字面量（rgba(239,231,221,x) / rgba(255,201,120,x) /
      rgba(217,114,47,x)）。不引入新调色板、不用亮底、不用圆角、不用 SaaS 式大投影。
   ② 不重复 kiln 已定义的类。下面每组注释都写明「XX 由 kiln 承担，不重写」。
   ③ 本文件必须在 kiln.css 之后加载：有 4 处与 kiln 同权重、靠顺序取胜
      （.pager / .nav-cta .nav-search / .hero--banner h2 / .home-product-image）。

   z-index 刻度（kiln 的 .nav 是 60，浮层只能排在 60 之上；用有序刻度，不用 99999）：
     60 nav（kiln） < 70 客服浮层 < 72 统计同意条（先回答它，它压住浮层） < 80 跳转链接（键盘优先）
   ============================================================ */

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
  font-size:.66rem; letter-spacing:.2em; text-transform:uppercase; color:var(--ash);
  transition:top .25s var(--ease);
}
.skip-link:focus{top:.7rem}

/* 语言切换：nav-cta 里的 <details>，要做成与 .nav-cta .btn 同尺寸的一枚克制按钮；
   展开的清单暗底细线。summary 的原生三角标记要手工去掉。 */
.language{position:relative}
.language summary{
  display:inline-flex; align-items:center; gap:.5rem;
  padding:.62rem 1.15rem; font-size:.66rem; letter-spacing:.2em; text-transform:uppercase;
  color:var(--muted); border:1px solid var(--hair); cursor:pointer; list-style:none;
  transition:color .3s var(--ease), border-color .3s var(--ease);
}
.language summary::-webkit-details-marker{display:none}
.language summary::after{
  content:""; width:4px; height:4px;
  border-right:1px solid currentColor; border-bottom:1px solid currentColor;
  transform:translateY(-1px) rotate(45deg); transition:transform .3s var(--ease);
}
.language summary:hover,.language[open] summary{color:var(--ash); border-color:rgba(239,231,221,.42)}
.language[open] summary::after{transform:translateY(1px) rotate(-135deg)}
.language ul{
  position:absolute; right:0; top:calc(100% + .5rem); z-index:1;
  min-width:7rem; margin:0; padding:.3rem 0; list-style:none;
  background:var(--char-2); border:1px solid var(--hair);
}
.language li>a{
  display:block; padding:.55rem 1.05rem; font-size:.66rem; letter-spacing:.2em; color:var(--muted);
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
  font-size:.62rem; letter-spacing:0; line-height:1; font-variant-numeric:tabular-nums;
  background:var(--char); color:var(--glow); border:1px solid rgba(255,201,120,.45);
}
.rfq-count[hidden]{display:none}

/* 抽屉里的二级菜单项：缩进 + 更弱的前景色（一级项沿用 kiln 的 .76rem 大写）。
   缩进放在嵌套 <ul> 上——kiln 的 .nav-drawer ul 给每层都加了 var(--pad)，不覆盖会越缩越深。 */
.nav-drawer li.sub>ul{padding:.2rem 0 .4rem 1.1rem}
.nav-drawer li.sub>a{font-size:.7rem; letter-spacing:.18em; color:var(--muted)}
.nav-drawer li.sub>a:hover{color:var(--ash)}

/* 客服浮层：browser.ts 的 service() 会重建里面的 <a>/<p>。暗底细线，克制外观；
   展开的面板最大高度受控、超出可滚（html 已 color-scheme:dark，滚动条天然是暗的）。 */
.service-widget{position:fixed; right:clamp(12px,1.6vw,22px); bottom:clamp(12px,1.6vw,1.4rem); z-index:70}
.service-widget[hidden]{display:none}
.service-widget summary{
  display:inline-flex; align-items:center; gap:.5rem; cursor:pointer; list-style:none;
  padding:.72rem 1.15rem; font-size:.66rem; letter-spacing:.2em; text-transform:uppercase;
  color:var(--ash); background:var(--char-2); border:1px solid var(--hair);
  box-shadow:0 16px 34px -20px rgba(0,0,0,.85); /* 只为与页面内容分开，不是 SaaS 投影 */
  transition:color .3s var(--ease), border-color .3s var(--ease);
}
.service-widget summary::-webkit-details-marker{display:none}
.service-widget summary:hover,.service-widget[open] summary{color:var(--glow); border-color:rgba(255,201,120,.45)}
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
  background:rgba(20,16,14,.96);
  backdrop-filter:blur(16px); -webkit-backdrop-filter:blur(16px);
}
.analytics-consent::before{
  content:""; position:absolute; inset:0 0 auto 0; height:1px;
  background:linear-gradient(90deg, transparent, rgba(217,114,47,.5), transparent);
}
.analytics-consent[hidden]{display:none}
.analytics-consent p{font-size:.84rem; color:var(--ink); max-width:54ch}
.analytics-consent button{
  padding:.62rem 1.15rem; font-size:.66rem; letter-spacing:.2em; text-transform:uppercase;
  border:1px solid var(--hair); color:var(--muted);
  transition:color .3s var(--ease), border-color .3s var(--ease), background .3s var(--ease);
}
.analytics-consent button:hover{color:var(--ash); border-color:rgba(239,231,221,.42)}
.analytics-consent button[data-analytics-choice="yes"]{
  background:linear-gradient(120deg,#E07C33,#C2601F); border-color:transparent; color:#1A120C;
  box-shadow:0 14px 34px -16px rgba(217,114,47,.9);
}
.analytics-consent button[data-analytics-choice="yes"]:hover{background:linear-gradient(120deg,#F08A3A,#D06A24)}
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
  font-size:.62rem; letter-spacing:.26em; text-transform:uppercase;
  color:rgba(239,231,221,.4);
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
  font-size:.62rem; letter-spacing:.24em; text-transform:uppercase; color:rgba(239,231,221,.4);
}
.hero-controls{display:flex; align-items:center; gap:.5rem; font-size:.68rem; color:rgba(239,231,221,.55)}
.hero-controls button{
  display:grid; place-items:center; width:2.35rem; height:2.35rem; line-height:1;
  border:1px solid var(--hair); color:var(--muted); background:none;
  transition:color .3s var(--ease), border-color .3s var(--ease);
}
.hero-controls button:hover{color:var(--glow); border-color:rgba(255,201,120,.55)}
.hero-controls [data-slide-count]{
  min-width:4.6rem; text-align:center;
  font-size:.66rem; letter-spacing:.2em; font-variant-numeric:tabular-nums;
  color:rgba(239,231,221,.45);
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
  background:radial-gradient(circle at 50% 56%, rgba(255,201,120,.2), rgba(217,114,47,.06) 44%, transparent 68%);
  opacity:.55; transition:opacity .5s var(--ease);
}
.card:hover .home-product-image::before{opacity:1}
/* 渲染器给的是 <picture><source…><img></picture>，比 kiln 模板里的裸 <img> 多一层。
   让 picture 铺满容器并居中，图片的 66% 才是相对容器、才真居中。 */
.home-product-image picture{display:grid; place-items:center; width:100%; height:100%}
.home-product-image img{
  position:relative; z-index:2; width:66%;
  transition:transform .55s var(--ease);
  filter:drop-shadow(0 0 1.2px rgba(255,201,120,.4)) drop-shadow(0 14px 24px rgba(0,0,0,.7));
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
    padding-bottom:.2rem; scrollbar-width:thin; scrollbar-color:rgba(239,231,221,.25) transparent;
  }
  .filters.home-filters::-webkit-scrollbar{height:6px}
  .filters.home-filters::-webkit-scrollbar-thumb{background:rgba(239,231,221,.22)}
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
  font-size:.62rem; letter-spacing:.22em; text-transform:uppercase; font-weight:400;
  color:rgba(239,231,221,.42);
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
  font-size:.62rem; letter-spacing:.18em; text-transform:uppercase; color:rgba(239,231,221,.42);
}
.inquiry-list input[type="number"]{
  width:4.6rem; padding:.42rem .5rem; text-align:right;
  font:inherit; font-size:.82rem; color:var(--ash);
  background:var(--char); border:1px solid var(--hair); border-radius:0;
  transition:border-color .3s var(--ease);
}
.inquiry-list input[type="number"]:focus{outline:none; border-color:rgba(255,201,120,.5)}
/* 移除按钮：像文字链接那样，靠细线与字距表达，hover 才亮 */
.inquiry-list button[data-rfq-remove]{
  justify-self:end; padding:0 0 .2rem;
  font-size:.62rem; letter-spacing:.18em; text-transform:uppercase;
  color:rgba(239,231,221,.45); border-bottom:1px solid var(--hair);
  transition:color .3s var(--ease), border-color .3s var(--ease);
}
.inquiry-list button[data-rfq-remove]:hover{color:var(--glow); border-bottom-color:rgba(255,201,120,.55)}

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
  font-size:.6rem; letter-spacing:.22em; text-transform:uppercase; color:var(--ember);
}
.trade-public-grid article h3{font-size:1rem; letter-spacing:.005em; line-height:1.35; color:var(--ash)}
.trade-public-grid article p{
  font-size:.86rem; color:var(--muted); white-space:pre-wrap; overflow-wrap:anywhere;
}
.trade-public-grid article a{
  align-self:flex-start; margin-top:auto; padding-bottom:.3rem;
  font-size:.66rem; letter-spacing:.18em; text-transform:uppercase; color:var(--glow);
  border-bottom:1px solid rgba(255,201,120,.4);
  transition:border-color .3s var(--ease);
}
.trade-public-grid article a:hover{border-bottom-color:var(--glow)}
.trade-public-grid .trade-expiry{
  font-size:.62rem; letter-spacing:.14em; color:rgba(239,231,221,.34); white-space:normal;
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

/* CMS 的首页 hero 用的是 16:9 摄影图，不是模板里 480×680 的竖构图抠图产品照。
   kiln 给 .hero-art 定的 1/1 会让横图上下空出一大块（图按 object-fit:contain 居中），
   这里按实际素材的比例放宽到 16/10；换回竖构图素材时删掉这一条即可。 */
.hero-art{aspect-ratio:16/10}

`;

export const siteCSS = kilnCSS + kilnExtraCSS;
