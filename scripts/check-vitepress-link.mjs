/**
 * 链接检查（check-vitepress-link）：检查 markdown 里的内部链接是否可联通（纯本地，不联网）。
 *
 * - 相对路径链接：相对当前 md 文件解析，目标文件必须存在
 * - `/` 根路径链接：映射到 docs/ 与 docs/public/，目标文件必须存在
 * - 兼容：省略 .md 后缀、`/` 结尾指向目录页（查 index.md）、`.html` 后缀、URL 编码
 *
 * 自动忽略：外部 http(s) 链接、frontmatter、围栏代码块、行内代码、HTML 注释、
 *           <script|style|template> 块、纯 `#锚点`、mailto:/tel:/data:、含 {{ }} 的动态地址
 *
 * 用法：
 *   bun run check:links docs/program/frontend/new.md   # 检查指定文件（可传多个 / 目录）
 *   bun run check:links                                # 检查 docs/ 下全部 md
 */

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const DOCS_ROOT = join(ROOT, 'docs');
const PUBLIC_ROOT = join(DOCS_ROOT, 'public');

// 无路径分隔符的裸词只有带已知扩展名才当作内部链接（避免误报 Vue :href="var" 绑定）
const SKIP_EXT =
    /\.(md|html?|png|jpe?g|gif|webp|avif|svg|ico|bmp|json|xml|txt|pdf|mp4|webm|mp3|css|js|mjs|cjs|ts|tsx|vue|wasm|zip)$/i;

const argv = process.argv.slice(2);
const targetArgs = argv.filter((a) => !a.startsWith('--'));

const blank = (m) => m.replace(/[^\n]/g, ' ');

function walkMd(dir, out = []) {
    for (const name of readdirSync(dir)) {
        if (
            name === 'node_modules' ||
            name === 'public' ||
            name === 'dist' ||
            name === 'cache' ||
            name === '.vitepress'
        )
            continue;
        const p = join(dir, name);
        if (statSync(p).isDirectory()) walkMd(p, out);
        else if (name.endsWith('.md')) out.push(p);
    }
    return out;
}

/** 抹掉与链接无关的内容，但保留换行以维持行号 */
function cleanMarkdown(text) {
    text = text.replace(/^---\r?\n[\s\S]*?\r?\n---(?:\r?\n|$)/, blank); // frontmatter
    text = text.replace(/<(script|style|template)\b[^>]*>[\s\S]*?<\/\1\s*>/gi, blank); // Vue 块
    text = text.replace(/<!--[\s\S]*?-->/g, blank); // HTML 注释
    const lines = text.split('\n'); // 围栏代码块
    let fence = null;
    for (let i = 0; i < lines.length; i++) {
        const m = lines[i].match(/^\s*(`{3,}|~{3,})/);
        if (m && !fence) {
            fence = m[1][0];
            lines[i] = '';
        } else if (m && fence && m[1][0] === fence) {
            fence = null;
            lines[i] = '';
        } else if (fence) {
            lines[i] = '';
        }
    }
    return lines.join('\n').replace(/`+[^`\n]*`+/g, blank); // 行内代码
}

function makeLineLookup(text) {
    const offsets = [0];
    for (let i = 0; i < text.length; i++) if (text[i] === '\n') offsets.push(i + 1);
    return (index) => {
        let lo = 0;
        let hi = offsets.length - 1;
        while (lo < hi) {
            const mid = (lo + hi + 1) >> 1;
            if (offsets[mid] <= index) lo = mid;
            else hi = mid - 1;
        }
        return lo + 1;
    };
}

function extractLinks(text) {
    const cleaned = cleanMarkdown(text);
    const lineAt = makeLineLookup(cleaned);
    const links = [];
    const push = (url, index) => {
        if (url) links.push({ url: url.trim(), line: lineAt(index) });
    };

    // [text](url)、![alt](<url> "title")
    for (const m of cleaned.matchAll(
        /!?\[[^\]]*\]\(\s*(?:<([^>]*)>|([^)\s]+))(?:\s+"[^"]*")?\s*\)/g
    ))
        push(m[1] ?? m[2], m.index);
    // 引用式定义 [ref]: url
    for (const m of cleaned.matchAll(/^[ \t]*\[[^\]]+\]:[ \t]*(\S+)[ \t]*$/gm)) push(m[1], m.index);
    // HTML href / src
    for (const m of cleaned.matchAll(/\b(?:href|src)\s*=\s*["']([^"']+)["']/g)) push(m[1], m.index);
    return links;
}

function isInternal(url) {
    if (!url || url.startsWith('#')) return false; // 纯锚点
    if (/^(mailto|tel|data|javascript|https?|ftp):/i.test(url)) return false; // 协议地址 = 外链，不查
    if (url.startsWith('//')) return false; // 协议相对
    if (url.includes('{{') || url.includes('}}')) return false; // Vue 插值
    if (/^["'`<]/.test(url) || /\s/.test(url)) return false; // 动态拼接 / 非法字符
    if (!url.includes('/') && !SKIP_EXT.test(url.split('#')[0])) return false; // 裸标识符
    return true;
}

function checkInternal(url, file) {
    const raw = url.split('#')[0].split('?')[0];
    if (!raw) return null;
    let decoded;
    try {
        decoded = decodeURIComponent(raw);
    } catch {
        decoded = raw;
    }
    const endsSlash = decoded.endsWith('/');
    const p = decoded.replace(/^\/+|\/+$/g, '');
    const bases = decoded.startsWith('/')
        ? [join(DOCS_ROOT, p), join(PUBLIC_ROOT, p)]
        : [resolve(dirname(file), p)];
    const tries = [];
    for (const base of bases) {
        tries.push(join(base, 'index.md'), base, `${base}.md`);
        if (/\.html?$/i.test(base)) tries.push(base.replace(/\.html?$/i, '.md'));
    }
    const ok = tries.some((t) => {
        try {
            return statSync(t).isFile();
        } catch {
            return false;
        }
    });
    return ok ? null : endsSlash ? '目录下无 index.md' : '目标文件不存在';
}

// ---- 主流程 ----

function existsSafe(p) {
    try {
        statSync(p);
        return true;
    } catch {
        return false;
    }
}

const files = [];
for (const t of targetArgs) {
    const abs = resolve(t);
    if (!existsSafe(abs)) {
        // lefthook 传入的暂存文件可能处于 rename 等边缘状态，警告跳过而非卡死提交
        console.error(`⚠ 路径不存在，已跳过: ${t}`);
        continue;
    }
    if (statSync(abs).isDirectory()) files.push(...walkMd(abs));
    else if (abs.endsWith('.md')) files.push(abs);
    else console.error(`⚠ 不是 markdown 文件，已跳过: ${t}`);
}
if (!files.length) {
    if (targetArgs.length) {
        console.log('✅ 没有可检查的 markdown 文件');
        process.exit(0);
    }
    files.push(...walkMd(DOCS_ROOT));
}
if (!files.length) {
    console.log('✅ 没有需要检查的 markdown 文件');
    process.exit(0);
}

const broken = [];
for (const file of files) {
    for (const { url, line } of extractLinks(readFileSync(file, 'utf8'))) {
        if (!isInternal(url)) continue;
        const err = checkInternal(url, file);
        if (err) broken.push({ file, line, url, err });
    }
}

const display = (f) => relative(ROOT, f).split(sep).join('/');
if (broken.length) {
    console.error(`✖ 发现 ${broken.length} 个断链：`);
    for (const b of broken.sort((a, b) => a.file.localeCompare(b.file) || a.line - b.line))
        console.error(`  ${display(b.file)}:${b.line}  ${b.url} → ${b.err}`);
    process.exitCode = 1;
} else {
    console.log(`✅ 内部链接全部可联通（${files.length} 个文件）`);
}
