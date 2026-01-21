# Claude Forge

> Transform your ideas into production-ready Claude Code artifacts

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Next.js](https://img.shields.io/badge/Next.js-16-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)](https://www.typescriptlang.org/)

Claude Forge is a web-based tool that helps you create high-quality Skills, Agents, and Rulesets for Claude Code. Describe what you want to build, and Claude Forge will generate a polished artifact following best practices.

## Features

- **AI-Powered Generation** - Turn vague ideas into structured artifacts
- **Multiple Artifact Types** - Skills, Agents, Rulesets, or auto-detect
- **Template Library** - Start from proven templates (Security Reviewer, UI Designer, Code Auditor, etc.)
- **Live Preview** - Edit with Monaco Editor and preview Markdown side-by-side
- **History** - Access all your generated artifacts instantly
- **Smart Save Detection** - Automatically saves to project or personal Claude directory
- **Dark Mode** - Easy on the eyes, day or night
- **Multiple AI Providers** - Works with Anthropic, Z.ai, GLM, or any OpenAI-compatible API

## Quick Start

1. **Clone and install**

```bash
git clone https://github.com/ErnestHysa/claude-forge.git
cd claude-forge
npm install
```

2. **Run the development server**

```bash
npm run dev
```

3. **Open your browser**

Navigate to [http://localhost:3000](http://localhost:3000)

4. **Configure your API key**

- Click the Settings icon (⚙️) in the top right
- Enter your API key (Anthropic, OpenAI-compatible, etc.)
- Click "Test Connection" to verify

5. **Start forging!**

- Select an artifact type (Skill, Agent, Ruleset, or Auto)
- Optionally choose a template
- Describe what you want to build
- Press `Cmd+Enter` or click Generate

## Screenshots

| Main Interface | Settings |
|:---:|:---:|
| *Coming soon* | *Coming soon* |

## Artifact Types

| Type | Description | Use When |
|------|-------------|----------|
| **Skill** | Reusable Claude Code skill | Creating specialized tools for specific tasks |
| **Agent** | Full agent system prompt | Building autonomous AI agents |
| **Rules** | Ruleset or guardrails | Defining constraints and guidelines |
| **Auto** | Let Claude decide | Unsure which format fits best |

## Built-in Templates

- **Security Reviewer** - Find OWASP Top 10 vulnerabilities, secrets, injection flaws
- **UI Redesigner** - Apple-level design overhaul following elite-frontend-ux principles
- **Code Auditor** - Line-by-line deep analysis that catches subtle bugs
- **UX Flow Tester** - Tests complete user journeys through your application

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Cmd+Enter` | Generate artifact |
| `Cmd+S` | Save artifact |
| `Cmd+H` | Open history |
| `Cmd+,` | Open settings |
| `Esc` | Close modal / cancel |

## Configuration

Claude Forge supports multiple AI providers:

- **Anthropic** (official) - `https://api.anthropic.com`
- **Z.ai** - `https://api.z.ai/api/coding/paas/v4`
- **GLM-4.7** - `https://open.bigmodel.cn/api/paas/v4`
- **Custom** - Any OpenAI-compatible endpoint

## Development

See [DEVELOPMENT.md](DEVELOPMENT.md) for detailed setup instructions, project structure, and contribution guidelines.

## License

MIT License - see [LICENSE](LICENSE) for details.

## Acknowledgments

Built with:
- [Next.js](https://nextjs.org/)
- [React](https://react.dev/)
- [Tailwind CSS](https://tailwindcss.com/)
- [shadcn/ui](https://ui.shadcn.com/)
- [Monaco Editor](https://microsoft.github.io/monaco-editor/)
- [Radix UI](https://www.radix-ui.com/)

---

**Made with ❤️ for the Claude Code community**
