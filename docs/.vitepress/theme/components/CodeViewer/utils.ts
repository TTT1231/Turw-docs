import type { FileNode } from './types';

interface ManifestFile {
   name: string;
   path: string;
   type: 'file' | 'directory';
   extension?: string;
   children?: ManifestFile[];
}

// 通用递归遍历函数
function traverse<T extends FileNode | ManifestFile>(
   nodes: T[],
   predicate: (node: T) => boolean,
   getChildren: (node: T) => T[] | undefined
): T | null {
   for (const node of nodes) {
      if (predicate(node)) return node;
      const children = getChildren(node);
      if (children) {
         const found = traverse(children, predicate, getChildren);
         if (found) return found;
      }
   }
   return null;
}

function ensureTrailingSlash(path: string): string {
   return path.endsWith('/') ? path : `${path}/`;
}

async function fetchManifest(url: string): Promise<ManifestFile[] | null> {
   try {
      const response = await fetch(url);
      return response.ok ? await response.json() : null;
   } catch {
      return null;
   }
}

/**
 * 通过 fetch 加载 manifest.json
 * 支持从父目录的 manifest 中筛选子目录
 */
export async function loadManifest(publicPath: string): Promise<ManifestFile[]> {
   // 尝试从指定路径加载
   const manifestUrl = `${ensureTrailingSlash(publicPath)}manifest.json`;
   const directManifest = await fetchManifest(manifestUrl);
   if (directManifest) return directManifest;

   // 尝试从父目录加载
   const pathParts = publicPath.split('/').filter(Boolean);
   if (pathParts.length <= 1) {
      throw new Error(`Failed to load manifest for path: ${publicPath}`);
   }

   const parentPath = '/' + pathParts.slice(0, -1).join('/');
   const targetDir = pathParts[pathParts.length - 1];
   const parentManifestUrl = `${ensureTrailingSlash(parentPath)}manifest.json`;
   const parentManifest = await fetchManifest(parentManifestUrl);

   if (!parentManifest) {
      throw new Error(`Failed to load manifest for path: ${publicPath}`);
   }

   const targetNode = traverse(
      parentManifest,
      (node) => node.name === targetDir,
      (node) => node.children
   );
   if (targetNode?.children) return targetNode.children;

   throw new Error(`Failed to load manifest for path: ${publicPath}`);
}

/**
 * 将 manifest 转换为 FileNode 树
 */
export function convertManifestToFileNodes(manifest: ManifestFile[]): FileNode[] {
   function convertNode(node: ManifestFile, depth: number = 0): FileNode {
      const fileNode: FileNode = {
         name: node.name,
         path: node.path,
         type: node.type,
         extension: node.extension,
         depth
      };
      if (node.children?.length) {
         fileNode.children = node.children.map((child) => convertNode(child, depth + 1));
      }
      return fileNode;
   }

   return manifest.map((node) => convertNode(node));
}

/**
 * 通过 fetch 加载文件内容
 */
export async function loadFileContent(filePath: string): Promise<string> {
   try {
      const response = await fetch(filePath);
      if (!response.ok) {
         throw new Error(`Failed to load file: ${response.status}`);
      }
      return await response.text();
   } catch (error) {
      console.error('Failed to load file content:', error);
      return `// Error loading file: ${error}`;
   }
}

/**
 * 根据路径查找文件节点
 */
export function findFileByPath(nodes: FileNode[], path: string): FileNode | null {
   return traverse(
      nodes,
      (node) => node.path === path,
      (node) => node.children
   );
}

/**
 * 计算文件的行数
 */
export function countLines(content: string): number {
   return content ? content.split('\n').length : 0;
}

/**
 * 根据文件名查找文件节点（支持相对路径和纯文件名）
 */
export function findFileByName(nodes: FileNode[], fileName: string): FileNode | null {
   const normalizedName = fileName.replace(/^\.?\//, '');

   return traverse(
      nodes,
      (node) =>
         node.type === 'file' &&
         (node.name === normalizedName || node.path.endsWith(`/${normalizedName}`)),
      (node) => node.children
   );
}
