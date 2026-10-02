// 把两份 CSS 源文件合成 packages/ui/src/styles.ts（纯字符串常量，保持「运行时零文件依赖」的既有约定）。
//
// 为什么要生成而不是直接读文件：packages/ui 没有构建步骤（exports 直接指向 src/index.ts），
// 且它同时被 worker（tsx / Node）与 apps/web（Next 服务端）导入；引入 node:fs 会给
// Next 的打包带来额外风险，也会破坏「siteCSS 是常量」这一点。故保持常量，改由脚本生成。
//
// 用法：pnpm --filter @suns/ui css:build
// 改了 src/kiln.css 或 src/kiln-extra.css 之后必须重跑，否则线上样式与源文件不一致。
import { readFileSync, writeFileSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const here = path.dirname(fileURLToPath(import.meta.url));
const src = path.join(here, '..', 'src');
const parts = [
  { file: 'kiln.css', note: 'kiln 设计系统（与 H:/Workbuddy/2026-10-02-18-17-59/opctools-redesign/assets/kiln.css 逐字一致，勿在此手改）' },
  { file: 'kiln-extra.css', note: 'kiln 之外的 CMS 组件层（询盘篮 / 轮播 / 统计同意 / 客服 / 市场块 / 搜索 / 分页）' },
];

// 普通模板字面量（非 String.raw）：先转义反斜杠，再转义反引号与 ${，顺序不可颠倒。
const escapeForTemplate = (css) => css.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$\{/g, '\\${');

let out = '// 本文件由 packages/ui/scripts/build-css.mjs 生成，请勿手改。\n';
out += '// 源文件：packages/ui/src/kiln.css + packages/ui/src/kiln-extra.css\n';
out += '// 重新生成：pnpm --filter @suns/ui css:build\n';
let total = 0;
for (const part of parts) {
  const full = path.join(src, part.file);
  const css = readFileSync(full, 'utf8');
  total += css.length;
  out += `\n/* ── ${part.file} · ${statSync(full).size} bytes ── ${part.note} */\n`;
  out += 'export const ' + (part.file === 'kiln.css' ? 'kilnCSS' : 'kilnExtraCSS') + ' = `' + escapeForTemplate(css) + '`;\n';
}
out += '\nexport const siteCSS = kilnCSS + kilnExtraCSS;\n';
writeFileSync(path.join(src, 'styles.ts'), out, 'utf8');
console.log('styles.ts written:', out.length, 'bytes (css source', total, 'bytes)');
