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
): Promise<{ basePath: string; artifactName: string; fullPath: string }> {
  const artifactName = extractName(content, type);
  const fileName = type === 'skill' ? 'SKILL.md' : `${type}.md`;

  if (location === 'custom' && customPath) {
    const fullPath = path.join(customPath, fileName);
    return {
      basePath: customPath,
      artifactName,
      fullPath,
    };
  }

  // Auto-detect: check if in git repo
  const inGitRepo = await isInGitRepo();

  if (inGitRepo) {
    // Project-local: .claude/skills/
    const projectPath = path.join(process.cwd(), '.claude', 'skills', artifactName);
    const fullPath = path.join(projectPath, fileName);
    return {
      basePath: projectPath,
      artifactName,
      fullPath,
    };
  }

  // Personal: ~/.claude/skills/
  const homeDir = os.homedir();
  const personalPath = path.join(homeDir, '.claude', 'skills', artifactName);
  const fullPath = path.join(personalPath, fileName);
  return {
    basePath: personalPath,
    artifactName,
    fullPath,
  };
}

export async function POST(request: NextRequest) {
  try {
    const { content, type, location, customPath }: SaveRequest = await request.json();

    if (!content) {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 });
    }

    // Determine save path
    const { basePath, artifactName, fullPath } = await getSavePath(
      location,
      customPath,
      content,
      type
    );

    // Create directory if it doesn't exist
    await fs.mkdir(basePath, { recursive: true });

    // Write the file
    await fs.writeFile(fullPath, content, 'utf-8');

    return NextResponse.json({
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
