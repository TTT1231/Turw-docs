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

// Re-export icon functions from iconMaps
export { getFileIconPath, getFolderIconPath, getFileExtension } from './iconMaps';
