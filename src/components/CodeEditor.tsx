'use client';

import { useMemo, useCallback } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { javascript } from '@codemirror/lang-javascript';
import { json } from '@codemirror/lang-json';
import { html } from '@codemirror/lang-html';
import { css } from '@codemirror/lang-css';
import { markdown } from '@codemirror/lang-markdown';
import { languages } from '@codemirror/language-data';
import { oneDark } from '@codemirror/theme-one-dark';
import { searchKeymap, highlightSelectionMatches } from '@codemirror/search';
import { autocompletion } from '@codemirror/autocomplete';
import { bracketMatching, indentOnInput } from '@codemirror/language';
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands';
import { keymap } from '@codemirror/view';
import { EditorView } from '@codemirror/view';
import type { Extension } from '@codemirror/state';

interface CodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  language?: string;
  readOnly?: boolean;
  height?: string;
  theme?: 'light' | 'dark';
  className?: string;
}

/**
 * Lightweight code editor component using CodeMirror 6
 * Bundles locally - no CDN required, works with restrictive CSP
 */
export function CodeEditor({
  value,
  onChange,
  language = 'markdown',
  readOnly = false,
  height = '500px',
  theme = 'light',
  className = '',
}: CodeEditorProps) {
  // Get language extension for syntax highlighting
  const getLanguageExtension = useCallback((): Extension => {
    const lang = language.toLowerCase();

    switch (lang) {
      case 'javascript':
      case 'typescript':
      case 'jsx':
      case 'tsx':
        return javascript({ jsx: true });
      case 'json':
        return json();
      case 'html':
        return html();
      case 'css':
        return css();
      case 'markdown':
      case 'md':
        return markdown({ codeLanguages: languages });
      default:
        // For other languages, try to find a match
        const langData = languages.find((l: { name?: string; ext?: readonly string[]; alias?: readonly string[] }) =>
          l.name === lang ||
          l.ext?.includes(`.${lang}`) ||
          l.alias?.includes(lang)
        );
        if (langData) {
          return markdown({ codeLanguages: languages });
        }
        // Default to markdown with basic highlighting
        return markdown({ codeLanguages: languages });
    }
  }, [language]);

  // Memoize extensions to prevent re-renders
  const extensions = useMemo(() => {
    const exts: Extension[] = [
      // Core editing
      history(),
      indentOnInput(),
      bracketMatching(),
      // Keymaps
      keymap.of([...defaultKeymap, ...historyKeymap, ...searchKeymap]),
      // UI features
      EditorView.lineWrapping,
      autocompletion(),
      highlightSelectionMatches(),
      // Language support
      getLanguageExtension(),
    ];

    // Add theme if dark mode
    if (theme === 'dark') {
      exts.push(oneDark);
    }

    return exts;
  }, [theme, getLanguageExtension]);

  return (
    <div className={`code-editor-wrapper ${className}`} style={{ height }}>
      <CodeMirror
        value={value}
        height={height}
        extensions={extensions}
        onChange={onChange}
        readOnly={readOnly}
        basicSetup={{
          lineNumbers: true,
          foldGutter: true,
          dropCursor: true,
          allowMultipleSelections: true,
          indentOnInput: true,
          syntaxHighlighting: true,
          bracketMatching: true,
          closeBrackets: true,
          autocompletion: true,
          rectangularSelection: true,
          crosshairCursor: true,
          highlightActiveLineGutter: true,
          highlightSpecialChars: true,
          drawSelection: true,
          searchKeymap: true,
        }}
      />
    </div>
  );
}
