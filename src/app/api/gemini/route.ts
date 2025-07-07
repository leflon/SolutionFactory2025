import { NextRequest, NextResponse } from 'next/server';
import { generateGeminiResponse } from '@/app/api/gemini/generateContent';

export async function POST(req: NextRequest) {
  try {
    const { message, history } = await req.json();
    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }
    const geminiResponse = await generateGeminiResponse(message, history);
    return NextResponse.json({ response: geminiResponse });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to get response from Gemini' }, { status: 500 });
  }
}