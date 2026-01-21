// Artifact types
export type ArtifactType = 'skill' | 'agent' | 'ruleset';

export type ArtifactMode = ArtifactType | 'auto';

// Provider presets
export type ProviderPreset = 'anthropic' | 'z-ai' | 'glm47' | 'custom';

// Settings
export interface AppSettings {
  provider: {
    baseUrl: string;
    apiKey: string;
    model: string;
    preset: ProviderPreset;
    apiType: 'anthropic' | 'openai';
  };
  appearance: {
    theme: 'light' | 'dark' | 'system';
    fontSize: 'sm' | 'md' | 'lg';
  };
}

// Template
export interface Template {
  id: string;
  name: string;
  description: string;
  type: ArtifactType;
  category: string;
  skeleton: string;
  promptHints: string[];
  multiFile?: boolean; // Indicates if this template produces multiple files
}

// Individual file in a multi-file artifact
export interface ArtifactFile {
  path: string;        // Relative path: "skills/code-reviewer/SKILL.md"
  content: string;
  language: string;    // For syntax highlighting
}

// Multi-file artifact metadata
export interface ArtifactManifest {
  name: string;
  version?: string;
  description?: string;
  author?: string;
  rootStructure: 'flat' | 'nested';
}

// Artifact (single or multi-file)
export interface Artifact {
  name: string;
  type: ArtifactType;
  content: string;           // Single-file content (backward compatible)
  files?: ArtifactFile[];    // Multi-file artifacts
  manifest?: ArtifactManifest; // Metadata for multi-file projects
  isMultiFile?: boolean;     // Quick check for multi-file artifacts
}

// Editor state for multi-file editing
export interface EditorFile {
  id: string;
  path: string;
  content: string;
  language: string;
  isModified?: boolean;
}

// Generation request
export interface GenerateRequest {
  mode: ArtifactMode;
  template?: string;
  idea: string;
  settings: AppSettings['provider'];
  multiFile?: boolean; // Request multi-file output
}

// Save request
export interface SaveRequest {
  artifact: Artifact;
  location: 'auto' | 'custom';
  customPath?: string;
}

// Save location detection
export interface SaveLocation {
  type: 'project' | 'personal';
  path: string;
  label: string;
}

// File tree node
export interface FileTreeNode {
  id: string;
  name: string;
  path: string;
  type: 'file' | 'directory';
  children?: FileTreeNode[];
  language?: string;
}
