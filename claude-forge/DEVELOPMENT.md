# Claude Forge - Development Guide

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load fonts.

## Project Structure

```
claude-forge/
├── src/
│   ├── app/              # Next.js app directory
│   │   ├── api/          # API routes (generate, save, test, detect-path)
│   │   ├── settings/     # Settings page
│   │   ├── layout.tsx    # Root layout with fonts
│   │   ├── page.tsx      # Main application page
│   │   └── globals.css   # Global styles with Tailwind v4
│   ├── components/       # React components
│   │   ├── ui/           # shadcn/ui base components
│   │   ├── ModeSelector.tsx
│   │   ├── TemplatePicker.tsx
│   │   ├── IdeaInput.tsx
│   │   ├── SplitEditor.tsx
│   │   ├── ActionBar.tsx
│   │   └── HistoryPanel.tsx
│   ├── lib/              # Utility modules
│   │   ├── settings.ts   # Settings management
│   │   ├── history.ts    # Artifact history
│   │   ├── templates.ts  # Template definitions
│   │   └── utils.ts      # Helper functions
│   └── types/            # TypeScript definitions
├── public/               # Static assets
└── package.json
```

## Tech Stack

- **Framework**: Next.js 16 with App Router
- **UI**: React 19, Tailwind CSS v4
- **Components**: Radix UI (shadcn/ui)
- **Editor**: Monaco Editor (@monaco-editor/react)
- **API Clients**: @anthropic-ai/sdk, openai
- **Notifications**: Sonner
- **Fonts**: Space Grotesk (display), IBM Plex Sans (body)

## API Routes

### POST `/api/generate`
Generate artifacts using AI providers (Anthropic or OpenAI-compatible).

### POST `/api/save`
Save generated artifacts to the file system (.claude/skills or ~/.claude/skills).

### POST `/api/test`
Test API connection credentials.

### GET `/api/detect-path`
Detect whether to save to project-local or personal directory.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy this Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
