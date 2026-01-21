'use client';

import { useState } from 'react';
import { ChevronRight, ChevronDown, File, Folder, FolderOpen } from 'lucide-react';
import type { FileTreeNode, EditorFile } from '@/types';

interface FileTreeProps {
  files: EditorFile[];
  activeFileId: string;
  onFileSelect: (fileId: string) => void;
}

/**
 * File tree component for hierarchical file navigation
 */
export function FileTree({ files, activeFileId, onFileSelect }: FileTreeProps) {
  const tree = buildTreeNodes(files);
  const [expandedDirs, setExpandedDirs] = useState<Set<string>>(new Set(getDefaultExpanded(tree)));

  const toggleDir = (path: string) => {
    setExpandedDirs((prev) => {
      const next = new Set(prev);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return next;
    });
  };

  if (files.length <= 1) {
    return null;
  }

  return (
    <div className="w-48 border-r border-border bg-muted/30 overflow-y-auto">
      <div className="p-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
        Files
      </div>
      <div className="px-2 pb-2">
        {renderTree(tree, 0, expandedDirs, toggleDir, activeFileId, onFileSelect)}
      </div>
    </div>
  );
}

function renderTree(
  nodes: FileTreeNode[],
  depth: number,
  expandedDirs: Set<string>,
  toggleDir: (path: string) => void,
  activeFileId: string,
  onFileSelect: (fileId: string) => void
): React.ReactNode {
  return nodes.map((node) => {
    const isExpanded = expandedDirs.has(node.path);
    const paddingLeft = depth * 12 + 8;

    if (node.type === 'directory') {
      return (
        <div key={node.id}>
          <button
            onClick={() => toggleDir(node.path)}
            className="flex items-center gap-1 w-full px-2 py-1 text-sm text-muted-foreground hover:text-foreground hover:bg-muted rounded transition-colors"
            style={{ paddingLeft }}
          >
            {isExpanded ? (
              <ChevronDown className="h-3 w-3 shrink-0" />
            ) : (
              <ChevronRight className="h-3 w-3 shrink-0" />
            )}
            {isExpanded ? (
              <FolderOpen className="h-4 w-4 text-blue-400 shrink-0" />
            ) : (
              <Folder className="h-4 w-4 text-blue-400 shrink-0" />
            )}
            <span className="truncate">{node.name}</span>
          </button>
          {isExpanded && node.children && (
            <div>
              {renderTree(node.children, depth + 1, expandedDirs, toggleDir, activeFileId, onFileSelect)}
            </div>
          )}
        </div>
      );
    }

    // File node
    const isActive = node.id === activeFileId;
    const fileIcon = getFileIcon(node.name);

    return (
      <button
        key={node.id}
        onClick={() => onFileSelect(node.id)}
        className={`
          flex items-center gap-2 w-full px-2 py-1 text-sm rounded transition-colors
          ${isActive ? 'bg-accent text-accent-foreground font-medium' : 'text-muted-foreground hover:text-foreground hover:bg-muted'}
        `}
        style={{ paddingLeft }}
      >
        <span className="shrink-0 text-xs">{fileIcon}</span>
        <File className="h-4 w-4 shrink-0 text-muted-foreground" />
        <span className="truncate">{node.name}</span>
      </button>
    );
  });
}

/**
 * Build tree nodes from flat file list
 */
function buildTreeNodes(files: EditorFile[]): FileTreeNode[] {
  const root: FileTreeNode[] = [];
  const map = new Map<string, FileTreeNode>();

  // Sort files by path for consistent ordering
  const sorted = [...files].sort((a, b) => a.path.localeCompare(b.path));

  for (const file of sorted) {
    const parts = file.path.split('/');
    let currentLevel = root;
    let currentPath = '';

    // Build/create directory structure
    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i];
      currentPath = currentPath ? `${currentPath}/${part}` : part;

      let dir = map.get(currentPath);
      if (!dir) {
        dir = {
          id: `dir-${currentPath}`,
          name: part,
          path: currentPath,
          type: 'directory',
          children: [],
        };
        map.set(currentPath, dir);
        currentLevel.push(dir);
      }

      currentLevel = dir.children!;
    }

    // Add file node
    const fileName = parts[parts.length - 1]!;
    const fileNode: FileTreeNode = {
      id: file.id,
      name: fileName,
      path: file.path,
      type: 'file',
      language: file.language,
    };
    currentLevel.push(fileNode);
    map.set(file.path, fileNode);
  }

  return root;
}

/**
 * Get default expanded directories (expand all parents of active file)
 */
function getDefaultExpanded(nodes: FileTreeNode[]): string[] {
  const expanded: string[] = [];

  function collectPaths(node: FileTreeNode) {
    if (node.type === 'directory' && node.children && node.children.length > 0) {
      expanded.push(node.path);
      node.children.forEach(collectPaths);
    }
  }

  nodes.forEach(collectPaths);
  return expanded;
}

/**
 * Get file icon based on extension
 */
function getFileIcon(fileName: string): string {
  const ext = fileName.split('.').pop()?.toLowerCase();

  const icons: Record<string, string> = {
    md: '',
    tsx: '',
    ts: '',
    jsx: '',
    js: '',
    json: '{}',
    css: '#',
    html: '<>',
    yaml: '',
    yml: '',
    txt: 'T',
  };

  return icons[ext || ''] || '';
}
