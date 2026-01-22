/**
 * 这个文件用于生成 codeview-container 目录的 manifest.json 文件。
 * 代替import.meta.glob功能
 *
 * 自动扫描指定目录下的所有文件和子目录，
 * 并生成一个包含文件路径和类型信息的 JSON 清单文件。
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BASE_PATH = path.resolve(__dirname, '../docs/public/codeview-container');
const OUTPUT_FILE = path.join(BASE_PATH, 'manifest.json');
const PUBLIC_BASE = '/Turw-docs/codeview-container';

/**
 * 获取文件扩展名（包含点号，如 '.ts'）
 */
function getExtension(fileName) {
   return path.extname(fileName).toLowerCase();
}

/**
 * 排序规则：目录优先，同类型按名称字母排序
 */
function sortEntries(a, b) {
   const aIsDir = a.isDirectory();
   const bIsDir = b.isDirectory();

   if (aIsDir && !bIsDir) return -1;
   if (!aIsDir && bIsDir) return 1;
   return a.name.localeCompare(b.name);
}

/**
 * 递归扫描目录生成 manifest
 */
function scanDirectory(dirPath, relativePath = '') {
   const entries = [];
   const items = fs.readdirSync(dirPath, { withFileTypes: true }).sort(sortEntries);

   for (const item of items) {
      // 跳过 manifest.json 本身
      if (item.name === 'manifest.json') continue;

      const fullPath = path.join(dirPath, item.name);
      const entryPath = path.join(relativePath, item.name);
      const webPath = `${PUBLIC_BASE}/${entryPath.replace(/\\/g, '/')}`;

      if (item.isDirectory()) {
         const children = scanDirectory(fullPath, entryPath);
         if (children.length > 0) {
            entries.push({
               name: item.name,
               path: webPath,
               type: 'directory',
               children
            });
         }
      } else if (item.isFile()) {
         entries.push({
            name: item.name,
            path: webPath,
            type: 'file',
            extension: getExtension(item.name)
         });
      }
   }

   return entries;
}

/**
 * 统计条目中的文件数量
 */
function countFiles(entries) {
   let count = 0;
   for (const entry of entries) {
      if (entry.type === 'file') {
         count++;
      } else if (entry.children) {
         count += countFiles(entry.children);
      }
   }
   return count;
}

/**
 * 生成 manifest.json
 */
function generateManifest() {
   console.log('📁 Scanning directory:', BASE_PATH);

   if (!fs.existsSync(BASE_PATH)) {
      console.error(`❌ Directory not found: ${BASE_PATH}`);
      process.exit(1);
   }

   const manifest = scanDirectory(BASE_PATH);

   fs.writeFileSync(OUTPUT_FILE, JSON.stringify(manifest, null, 2), 'utf-8');

   console.log(`✅ Generated manifest.json with ${manifest.length} top-level entries`);
   console.log(`📝 Output: ${OUTPUT_FILE}`);
   console.log(`📊 Total files: ${countFiles(manifest)}`);
}

generateManifest();
