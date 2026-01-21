import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';

export const runtime = 'nodejs';

// Detect if we're in a git repo
async function isInGitRepo(): Promise<boolean> {
  try {
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

export async function GET() {
  try {
    const inGitRepo = await isInGitRepo();
    let detectedPath: string;

    if (inGitRepo) {
      // Project-local: .claude/skills/
      detectedPath = path.join(process.cwd(), '.claude', 'skills');
    } else {
      // Personal: ~/.claude/skills/
      const homeDir = os.homedir();
      detectedPath = path.join(homeDir, '.claude', 'skills');
    }

    // Return a user-friendly display path
    const displayPath = inGitRepo
      ? `.claude/skills/ (Project)`
      : `~/.claude/skills/ (Personal)`;

    return NextResponse.json({
      path: displayPath,
      fullPath: detectedPath,
      type: inGitRepo ? 'project' : 'personal',
    });
  } catch (error) {
    console.error('Detect path error:', error);
    return NextResponse.json(
      {
        path: '~/.claude/skills/',
        fullPath: path.join(os.homedir(), '.claude', 'skills'),
        type: 'personal',
      },
      { status: 200 } // Always return a valid path
    );
  }
}
