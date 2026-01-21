import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';

export async function POST(request: NextRequest) {
  try {
    const { baseUrl, apiKey, model, apiType } = await request.json();

    if (!apiKey) {
      return NextResponse.json({ error: 'API key is required' }, { status: 400 });
    }

    // Test with OpenAI-compatible API (Z.AI, GLM, etc.)
    if (apiType === 'openai') {
      const client = new OpenAI({
        apiKey,
        baseURL: baseUrl || undefined,
      });

      const response = await client.chat.completions.create({
        model: model || 'glm-4.7',
        messages: [{ role: 'user', content: 'Hi' }],
        max_tokens: 10,
      });

      return NextResponse.json({
        success: true,
        model: response.model,
        apiType: 'openai',
      });
    }

    // Test with Anthropic API
    const client = new Anthropic({
      apiKey,
      baseURL: baseUrl || undefined,
      dangerouslyAllowBrowser: true,
    });

    const response = await client.messages.create({
      model: model || 'claude-3-5-sonnet-20241022',
      max_tokens: 10,
      messages: [{ role: 'user', content: 'Hi' }],
    });

    return NextResponse.json({
      success: true,
      model: response.model,
      apiType: 'anthropic',
    });
  } catch (error) {
    console.error('Test connection error:', error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Failed to connect to API endpoint',
      },
      { status: 400 }
    );
  }
}
