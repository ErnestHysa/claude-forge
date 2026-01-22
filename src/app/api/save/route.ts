import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';

export const runtime = 'nodejs';

interface SaveRequest {
  content: string;
  type: 'skill' | 'agent' | 'ruleset';
  location: 'auto' | 'custom';
  customPath?: string;
  isMultiFile?: boolean;
  files?: Array<{ path: string; content: string; language: string }>;
}

interface SaveResult {
  success: boolean;
  path: string;
  artifactName: string;
  location: 'project' | 'personal' | 'custom';
  filesCount?: number;
}

// Extract name from YAML frontmatter or content
function extractName(content: string, type: string): string {
  // Try to extract name from YAML frontmatter
  const nameMatch = content.match(/^name:\s*["']?([^"'\n]+)["']?\s*$/m);
  if (nameMatch) {
    return nameMatch[1].toLowerCase().replace(/\s+/g, '-');
  }

  // Fallback: generate name based on content
  const titleMatch = content.match(/^#\s+(.+)$/m);
  if (titleMatch) {
    return titleMatch[1]
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  }

  // Final fallback
  return `claude-forge-${type}-${Date.now()}`;
}

// Detect if we're in a git repo
async function isInGitRepo(): Promise<boolean> {
  try {
    // Check if .git exists in current directory or any parent
    let currentDir = process.cwd();
    while (currentDir !== path.parse(currentDir).root) {
      const gitPath = path.join(currentDir, '.git');
      try {
        await fs.access(gitPath);
        return true;
      } catch {
        // Not here, check parent
      }
      currentDir = path.dirname(currentDir);
    }
    return false;
  } catch {
    return false;
  }
}

// Get save path based on location type
async function getSavePath(
  location: 'auto' | 'custom',
  customPath: string | undefined,
  content: string,
  type: string
): Promise<{ basePath: string; artifactName: string }> {
  const artifactName = extractName(content, type);

  if (location === 'custom' && customPath) {
    return {
      basePath: customPath,
      artifactName,
    };
  }

  // Auto-detect: check if in git repo
  const inGitRepo = await isInGitRepo();

  if (inGitRepo) {
    // Project-local: .claude/skills/
    const projectPath = path.join(process.cwd(), '.claude', 'skills', artifactName);
    return {
      basePath: projectPath,
      artifactName,
    };
  }

  // Personal: ~/.claude/skills/
  const homeDir = os.homedir();
  const personalPath = path.join(homeDir, '.claude', 'skills', artifactName);
  return {
    basePath: personalPath,
    artifactName,
  };
}

export async function POST(request: NextRequest) {
  try {
    const { content, type, location, customPath, isMultiFile, files }: SaveRequest = await request.json();

    if (!content) {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 });
    }

    // Determine save path
    const { basePath, artifactName } = await getSavePath(
      location,
      customPath,
      content,
      type
    );

    // Create directory if it doesn't exist
    await fs.mkdir(basePath, { recursive: true });

    // Handle multi-file artifacts
    if (isMultiFile && files && files.length > 0) {
      // Save each file
      const savedFiles: string[] = [];
      for (const file of files) {
        const filePath = path.join(basePath, file.path);
        const dirPath = path.dirname(filePath);

        // Create subdirectories if needed
        await fs.mkdir(dirPath, { recursive: true });

        // Write the file
        await fs.writeFile(filePath, file.content, 'utf-8');
        savedFiles.push(filePath);
      }

      // Also save the main SKILL.md as the entry point
      const mainFileName = type === 'skill' ? 'SKILL.md' : `${type}.md`;
      const mainFilePath = path.join(basePath, mainFileName);
      await fs.writeFile(mainFilePath, content, 'utf-8');

      return NextResponse.json<SaveResult>({
        success: true,
        path: basePath,
        artifactName,
        location: location === 'auto' ? (basePath.includes('.claude') ? 'project' : 'personal') : 'custom',
        filesCount: savedFiles.length + 1, // +1 for the main SKILL.md
      });
    }

    // Single file artifact
    const fileName = type === 'skill' ? 'SKILL.md' : `${type}.md`;
    const fullPath = path.join(basePath, fileName);

    // Write the file
    await fs.writeFile(fullPath, content, 'utf-8');

    return NextResponse.json<SaveResult>({
      success: true,
      path: fullPath,
      artifactName,
      location: location === 'auto' ? (basePath.includes('.claude') ? 'project' : 'personal') : 'custom',
    });
  } catch (error) {
    console.error('Save API error:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to save artifact',
      },
      { status: 500 }
    );
  }
}
