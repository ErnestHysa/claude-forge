import { NextRequest } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';
import { getTemplate } from '@/lib/templates';

export const runtime = 'nodejs';

interface GenerateRequest {
  mode: 'skill' | 'agent' | 'ruleset' | 'auto';
  template?: string;
  idea: string;
  settings: {
    baseUrl: string;
    apiKey: string;
    model: string;
    apiType: 'anthropic' | 'openai';
  };
}

// Build the system prompt based on mode and template
function buildSystemPrompt(mode: string, templateId?: string): string {
  const basePrompt = `You are an expert at creating Claude-compatible artifacts. Your task is to transform the user's idea into a polished, production-ready artifact.

## Output Format Rules

1. Always start with YAML frontmatter between --- markers
2. For Skills: include name (kebab-case), description, when-to-use (optional), capabilities
3. For Agents: use full markdown format with role, purpose, guidelines
4. For Rulesets: clean markdown with clear sections
5. Be thorough but concise
6. Include examples where helpful
7. Follow best practices for the Claude ecosystem

## Quality Standards

- Make capabilities specific and actionable
- Include clear success criteria
- Add failure modes and edge cases
- Consider security implications
- Follow the elite-frontend-ux principles for design-related content
- Ensure accessibility considerations are included where relevant
`;

  if (templateId) {
    const template = getTemplate(templateId);
    if (template) {
      return `${basePrompt}\n\n## Template Reference\n\nUse this template as a starting point, but adapt it to the user's specific needs:\n\n\`\`\`\n${template.skeleton}\n\`\`\`\n\n## Key Expansion Areas\n\n${template.promptHints.map((hint, i) => `${i + 1}. ${hint}`).join('\n')}`;
    }
  }

  return basePrompt;
}

// Build the user prompt based on mode and idea
function buildUserPrompt(
  mode: string,
  idea: string,
  templateId?: string
): string {
  let prompt = `Create a ${mode === 'auto' ? 'skill' : mode} based on this idea:\n\n"${idea}"\n\n`;

  if (templateId) {
    const template = getTemplate(templateId);
    if (template) {
      prompt += `Use the "${template.name}" template as a foundation, expanding and customizing it based on the user's idea above.\n\n`;
    }
  }

  prompt += `Please generate:
1. A descriptive name (kebab-case for skills)
2. A clear, specific description
3. Complete content following the format rules
4. Helpful examples where applicable

Generate the complete artifact now.`;

  return prompt;
}

export async function POST(request: NextRequest) {
  try {
    const { mode, template, idea, settings }: GenerateRequest = await request.json();

    if (!idea) {
      return new Response('Idea is required', { status: 400 });
    }

    if (!settings.apiKey) {
      return new Response('API key is required', { status: 400 });
    }

    // Build prompts
    const systemPrompt = buildSystemPrompt(mode, template);
    const userPrompt = buildUserPrompt(mode, idea, template);

    const encoder = new TextEncoder();

    // Handle OpenAI-compatible API (Z.AI, GLM, etc.)
    if (settings.apiType === 'openai') {
      const client = new OpenAI({
        apiKey: settings.apiKey,
        baseURL: settings.baseUrl || undefined,
      });

      const stream = await client.chat.completions.create({
        model: settings.model || 'glm-4.7',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        max_tokens: 8000,
        stream: true,
      });

      const readable = new ReadableStream({
        async start(controller) {
          try {
            for await (const chunk of stream) {
              const content = chunk.choices[0]?.delta?.content;
              if (content) {
                const data = JSON.stringify({ content });
                controller.enqueue(encoder.encode(`data: ${data}\n\n`));
              }
            }
            controller.enqueue(encoder.encode('data: [DONE]\n\n'));
            controller.close();
          } catch (error) {
            console.error('Streaming error:', error);
            controller.error(error);
          }
        },
      });

      return new Response(readable, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      });
    }

    // Handle Anthropic API
    const client = new Anthropic({
      apiKey: settings.apiKey,
      baseURL: settings.baseUrl || undefined,
      dangerouslyAllowBrowser: true,
    });

    const stream = await client.messages.create({
      model: settings.model || 'claude-3-5-sonnet-20241022',
      max_tokens: 8000,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
      stream: true,
    });

    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            if (chunk.type === 'content_block_delta') {
              const content = (chunk.delta as { text: string }).text;
              const data = JSON.stringify({ content });
              controller.enqueue(encoder.encode(`data: ${data}\n\n`));
            }
          }
          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
          controller.close();
        } catch (error) {
          console.error('Streaming error:', error);
          controller.error(error);
        }
      },
    });

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    console.error('Generate API error:', error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Generation failed',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
