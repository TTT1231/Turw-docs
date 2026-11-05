/**
 * CI gate：检查 manifest.json 是否与 codeview-container 源码一致。
 * 先重新生成，再对比 git 工作区与暂存区；有漂移则报错并退出 1。
 * （lefthook 的多行 run 会按行拆开执行，写不了 if/fi，所以逻辑放在这里）
 */

import { execFileSync } from 'child_process';

const MANIFEST = 'docs/public/codeview-container/manifest.json';

// 重新生成清单（输出透传，便于排查）
execFileSync(process.execPath, ['./scripts/generate-manifest.mjs'], { stdio: 'inherit' });

// 工作区 vs 暂存区：有差异说明改了源码但没提交更新后的清单
const drift = execFileSync('git', ['diff', '--name-only', '--', MANIFEST], {
    encoding: 'utf8'
}).trim();

if (drift) {
    console.error('✖ manifest.json 与 codeview-container 源码不一致');
    console.error(`  修复: bun run generate-manifest && git add ${MANIFEST}`);
    process.exit(1);
}

console.log('✅ manifest.json 与源码一致');
