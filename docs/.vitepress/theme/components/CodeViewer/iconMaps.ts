const ICON_BASE = '/Turw-docs/assets/images/codeviewer-icons/';

const ICON = {
   FOLDER: 'folder',
   FOLDER_OPEN: 'folderopened',
   FILE: 'file'
} as const;

function buildIconPath(iconName: string): string {
   return `${ICON_BASE}${iconName}.svg`;
}

// ==================== 精确匹配映射 ====================
const EXACT_MATCH_MAP: Record<string, string> = {
   // TypeScript / Vite
   'tsconfig.json': 'typescript',
   'tsconfig.app.json': 'typescript',
   'tsconfig.node.json': 'typescript',
   'vite.config.js': 'vite',
   'vite.config.ts': 'vite',
   'vite.config.mjs': 'vite',
   'vite.config.cjs': 'vite',

   // Prettier/Env/Git
   '.prettierrc': 'prettier',
   '.prettierrc.json': 'prettier',
   '.prettierrc.js': 'prettier',
   '.prettierrc.cjs': 'prettier',
   '.prettierrc.yaml': 'prettier',
   '.prettierrc.yml': 'prettier',
   'prettier.config.js': 'prettier',
   'prettier.config.cjs': 'prettier',
   '.prettierignore': 'prettier',
   '.env': 'env',
   '.env.local': 'env',
   '.env.development': 'env',
   '.env.production': 'env',
   '.env.test': 'env',
   '.gitignore': 'git',

   // 其他配置文件（使用默认文件图标）
   LICENSE: ICON.FILE,
   'LICENSE.md': ICON.FILE,
   'LICENSE.txt': ICON.FILE
};

// ==================== 正则匹配映射 ====================
const REGEX_MATCH_MAP: Array<[RegExp, string]> = [
   [/^eslint\.config\.(js|mjs|cjs|ts)$/i, 'eslint'],
   [/^(.*)\.config\.(js|ts|mjs|cjs)$/i, 'js'],
   [/^(.*)\.config\.(json)$/i, 'json'],
   [/^vite\.config\./i, 'vite'],
   [/^tsconfig\./i, 'typescript'],
   [/^(.*)\.(test|spec)\.(ts|js|tsx|jsx)$/i, 'typescript']
];

// ==================== 扩展名映射 ====================
const EXTENSION_MAP: Record<string, string> = {
   '.ts': 'typescript',
   '.tsx': 'typescript',
   '.js': 'js',
   '.jsx': 'js',
   '.mjs': 'js',
   '.cjs': 'js',
   '.vue': 'vue',
   '.html': 'html',
   '.htm': 'html',
   '.json': 'json',
   '.jsonc': 'json',
   '.md': 'markdown',
   '.markdown': 'markdown',
   '.d.ts': 'typescriptdef',

   // 其他（使用默认文件图标）
   '.css': ICON.FILE,
   '.scss': ICON.FILE,
   '.sass': ICON.FILE,
   '.less': ICON.FILE,
   '.txt': ICON.FILE,
   '.xml': ICON.FILE,
   '.yaml': ICON.FILE,
   '.yml': ICON.FILE
};

// ==================== 获取文件图标 ====================
export function getFileIconPath(filename: string): string {
   // 1. 精确匹配
   if (EXACT_MATCH_MAP[filename]) {
      return buildIconPath(EXACT_MATCH_MAP[filename]);
   }

   // 2. 正则匹配
   for (const [regex, iconName] of REGEX_MATCH_MAP) {
      if (regex.test(filename)) {
         return buildIconPath(iconName);
      }
   }

   // 3. 扩展名匹配
   const ext = getFileExtension(filename);
   if (ext && EXTENSION_MAP[ext]) {
      return buildIconPath(EXTENSION_MAP[ext]);
   }

   // 4. 默认图标
   return buildIconPath(ICON.FILE);
}

export function getFolderIconPath(isOpen = false): string {
   return buildIconPath(isOpen ? ICON.FOLDER_OPEN : ICON.FOLDER);
}

export function getFileExtension(filename: string): string {
   // 特殊处理 .d.ts 声明文件
   if (filename.endsWith('.d.ts')) {
      return '.d.ts';
   }
   const lastDotIndex = filename.lastIndexOf('.');
   if (lastDotIndex <= 0) return ''; // 无扩展名或隐藏文件
   return filename.slice(lastDotIndex);
}
