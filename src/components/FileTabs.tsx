'use client';

import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { EditorFile } from '@/types';

interface FileTabsProps {
  files: EditorFile[];
  activeFileId: string;
  onFileSelect: (fileId: string) => void;
  onFileClose?: (fileId: string) => void;
}

/**
 * File tab bar for switching between open files
 */
export function FileTabs({ files, activeFileId, onFileSelect, onFileClose }: FileTabsProps) {
  if (files.length <= 1) {
    return null;
  }

  return (
    <div className="flex items-center gap-1 px-2 py-1 bg-muted/30 border-b border-border overflow-x-auto">
      {files.map((file) => {
        const isActive = file.id === activeFileId;
        const fileName = getFileName(file.path);
        const fileIcon = getFileIcon(fileName);

        return (
          <button
            key={file.id}
            onClick={() => onFileSelect(file.id)}
            className={`
              group flex items-center gap-2 px-3 py-1.5 rounded-t-lg text-sm font-medium transition-all
              ${
                isActive
                  ? 'bg-background text-foreground border-t border-x border-border'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              }
            `}
          >
            <span className="shrink-0">{fileIcon}</span>
            <span className="max-w-[150px] truncate">{fileName}</span>
            {file.isModified && (
              <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />
            )}
            {onFileClose && files.length > 1 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onFileClose(file.id);
                }}
                className={`
                  p-0.5 rounded hover:bg-muted-foreground/20 transition-colors shrink-0
                  ${isActive ? 'opacity-70 hover:opacity-100' : 'opacity-0 group-hover:opacity-70'}
                `}
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </button>
        );
      })}
    </div>
  );
}

/**
 * Get display filename from path
 */
function getFileName(path: string): string {
  const parts = path.split('/');
  return parts[parts.length - 1] || path;
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

/**
 * Get language from file extension
 */
export function getLanguageFromPath(path: string): string {
  const ext = path.split('.').pop()?.toLowerCase();

  const languages: Record<string, string> = {
    md: 'markdown',
    tsx: 'typescript',
    ts: 'typescript',
    jsx: 'javascript',
    js: 'javascript',
    json: 'json',
    css: 'css',
    html: 'html',
    yaml: 'yaml',
    yml: 'yaml',
    txt: 'plaintext',
  };

  return languages[ext || ''] || 'plaintext';
}

/**
 * Build file tree from list of file paths
 */
export function buildFileTree(files: EditorFile[]): EditorFile[] {
  // For now, return flat list sorted by path
  return [...files].sort((a, b) => a.path.localeCompare(b.path));
}
