/**
 * ZIP export utilities for Claude Forge.
 * All client-side - no data leaves the device.
 */

import JSZip from 'jszip';
import type { EditorFile, Artifact } from '@/types';

/**
 * Generate a ZIP file from multiple files
 * Uses JSZip for proper ZIP creation
 */
export async function createZip(files: EditorFile[], zipName: string = 'artifact.zip'): Promise<void> {
  if (files.length === 0) {
    throw new Error('No files to zip');
  }

  // If only one file, download directly
  if (files.length === 1) {
    const file = files[0];
    downloadFile(file.path.split('/').pop() || 'artifact', file.content);
    return;
  }

  // Create a new ZIP file
  const zip = new JSZip();

  // Add each file to the ZIP
  for (const file of files) {
    zip.file(file.path, file.content);
  }

  // Generate the ZIP file
  const blob = await zip.generateAsync({ type: 'blob' });

  // Trigger download
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = zipName;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Download a single file
 */
function downloadFile(fileName: string, content: string) {
  const blob = new Blob([content], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Parse multi-file artifact from AI response
 * Expects JSON structure or markdown code blocks
 */
export function parseMultiFileResponse(response: string): { files: EditorFile[]; manifest?: Artifact['manifest'] } {
  const files: EditorFile[] = [];
  let manifest: Artifact['manifest'] | undefined;

  // Try to parse as JSON first
  try {
    const jsonMatch = response.match(/```json\n([\s\S]*?)\n```/) || response.match(/{[\s\S]*}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[1] || jsonMatch[0]);

      if (parsed.files && Array.isArray(parsed.files)) {
        // Standard format: { files: [{ path, content, language }], manifest }
        parsed.files.forEach((f: { path?: string; content?: string; language?: string }, index: number) => {
          files.push({
            id: `file-${index}`,
            path: f.path || `file-${index}.md`,
            content: f.content || '',
            language: f.language || getLanguageFromPath(f.path || ''),
          });
        });

        if (parsed.manifest) {
          manifest = parsed.manifest;
        }

        return { files, manifest };
      }
    }
  } catch {
    // Not JSON, continue to markdown parsing
  }

  // Parse markdown code blocks
  const codeBlocks = response.match(/```(\w*)\n([\s\S]*?)```/g);

  if (codeBlocks && codeBlocks.length > 1) {
    // Multiple code blocks found - treat as multi-file
    codeBlocks.forEach((block, index) => {
      const langMatch = block.match(/```(\w*)\n/);
      const contentMatch = block.match(/```(\w*)\n([\s\S]*?)```/);

      const language = langMatch?.[1] || 'markdown';
      const content = contentMatch?.[2] || '';

      // Generate a path based on language
      const ext = getFileExtension(language);
      const path = index === 0 ? `SKILL.md` : `src/file-${index}.${ext}`;

      files.push({
        id: `file-${index}`,
        path,
        content,
        language,
      });
    });

    return {
      files,
      manifest: {
        name: 'multi-file-artifact',
        rootStructure: 'flat',
      },
    };
  }

  // Single file - return as single-element array
  files.push({
    id: 'file-0',
    path: 'artifact.md',
    content: response,
    language: 'markdown',
  });

  return { files, manifest };
}

/**
 * Get file extension from language
 */
function getFileExtension(language: string): string {
  const extensions: Record<string, string> = {
    markdown: 'md',
    typescript: 'ts',
    javascript: 'js',
    json: 'json',
    yaml: 'yaml',
    html: 'html',
    css: 'css',
    plaintext: 'txt',
  };

  return extensions[language] || 'txt';
}

/**
 * Get language from file path
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
 * Convert EditorFile[] to Artifact format for saving
 */
export function filesToArtifact(files: EditorFile[], type: Artifact['type']): Artifact {
  // Extract name from first file or use default
  const nameMatch = files[0]?.content.match(/^name:\s*(.+)$/m);
  const name = nameMatch?.[1] || 'multi-file-artifact';

  return {
    name,
    type,
    content: files[0]?.content || '', // Primary file content for backward compatibility
    files: files.map((f) => ({
      path: f.path,
      content: f.content,
      language: f.language,
    })),
    isMultiFile: files.length > 1,
    manifest: {
      name,
      rootStructure: files.length > 1 ? 'nested' : 'flat',
    },
  };
}

/**
 * Convert Artifact to EditorFile[] format
 */
export function artifactToFiles(artifact: Artifact): EditorFile[] {
  if (artifact.isMultiFile && artifact.files) {
    return artifact.files.map((f, index) => ({
      id: `file-${index}`,
      path: f.path,
      content: f.content,
      language: f.language,
    }));
  }

  // Single file artifact
  return [
    {
      id: 'file-0',
      path: 'artifact.md',
      content: artifact.content,
      language: 'markdown',
    },
  ];
}
