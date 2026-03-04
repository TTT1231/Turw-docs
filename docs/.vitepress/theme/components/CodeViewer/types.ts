// 文件节点类型
export interface FileNode {
   name: string;
   path: string;
   type: 'file' | 'directory';
   children?: FileNode[];
   extension?: string;
   // 层级深度，用于缩进
   depth?: number;
}

// 组件 Props 类型
export interface CodeViewerProps {
   // 相对于项目根目录的路径
   rootPath: string;
   // 默认选中的文件路径（相对于 rootPath）
   defaultFile?: string;
   // 主题模式：仅支持暗黑/明亮两种
   theme?: 'light' | 'dark';
   // 是否启用代码折叠
   enableFolding?: boolean;
   // 组件高度（用于嵌入到文档中）
   height?: string;
}

// 主题类型
export type ThemeMode = 'light' | 'dark';

// 语言映射类型（用于 Shiki 高亮）
export const LANGUAGE_MAP: Record<string, string> = {
   '.ts': 'typescript',
   '.tsx': 'typescript',
   '.js': 'javascript',
   '.jsx': 'javascript',
   '.mjs': 'javascript',
   '.cjs': 'javascript',
   '.vue': 'vue',
   '.json': 'json',
   '.jsonc': 'json',
   '.css': 'css',
   '.scss': 'scss',
   '.html': 'html',
   '.md': 'markdown',
   '.xml': 'xml',
   '.yaml': 'yaml',
   '.yml': 'yaml'
};

// 主题映射：light 使用 vitesse-light 对比度更高，dark 使用 github-dark
export const THEME_MAP: Record<ThemeMode, string> = {
   light: 'vitesse-light',
   dark: 'github-dark'
};

// 根据文件扩展名获取语言类型
export function getLanguageFromExtension(ext: string): string {
   return LANGUAGE_MAP[ext.toLowerCase()] || 'text';
}

// 根据主题模式获取 Shiki 主题
export function getShikiTheme(theme: ThemeMode): string {
   return THEME_MAP[theme];
}

// 图片文件扩展名集合
const IMAGE_EXTENSIONS = new Set(['.png', '.jpg', '.jpeg', '.svg', '.gif', '.webp']);

// 从 iconMaps 导入 getFileExtension
import { getFileExtension } from './iconMaps'

// 判断是否为图片文件
export function isImageFile(filename: string): boolean {
   return IMAGE_EXTENSIONS.has(getFileExtension(filename).toLowerCase());
}

// 判断是否为代码文件
export function isCodeFile(filename: string): boolean {
   return Object.prototype.hasOwnProperty.call(LANGUAGE_MAP, getFileExtension(filename).toLowerCase());
}

// Re-export icon functions from iconMaps
export {
   getFileIconPath,
   getFolderIconPath,
   addExactMatch,
   addRegexMatch,
   addExtensionMatch,
   getFileExtension
} from './iconMaps';
