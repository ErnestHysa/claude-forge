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
}

// Artifact
export interface Artifact {
  name: string;
  type: ArtifactType;
  content: string;
  files?: Record<string, string>; // For multi-file artifacts
}

// Generation request
export interface GenerateRequest {
  mode: ArtifactMode;
  template?: string;
  idea: string;
  settings: AppSettings['provider'];
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
