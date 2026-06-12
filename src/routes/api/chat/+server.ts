import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { env } from '$env/dynamic/private';
import { readFileSync } from 'fs';
import { resolve } from 'path';

interface CatalogProduct {
  id: number;
  title: string;
  category: string;
  price: string;
  color: string;
  tags: string[];
  description: string;
  image_url: string;
  product_url: string;
  source: string;
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface GeminiResponse {
  reply: string;
  products: { id: number; reason: string }[];
  suggestions: string[];
}

// Load catalog once at module level
let catalog: CatalogProduct[] = [];
try {
  const catalogPath = resolve('src/lib/data/catalog.json');
  const raw = readFileSync(catalogPath, 'utf-8');
  catalog = JSON.parse(raw).products;
} catch {
  console.warn('[chat] Could not load catalog.json');
}

function buildSystemPrompt(): string {
  const productList = catalog
    .map(
      (p) =>
        `ID:${p.id} | ${p.title} | Cat:${p.category} | ${p.price} | Colors:${Array.isArray(p.color) ? p.color.join('/') : p.color} | Tags:${p.tags.slice(0, 4).join(', ')}`
    )
    .join('\n');

  return `You are Shaq — Shaquille O'Neal's personal AI style assistant. Your job is to help users find and buy clothing from Shaq's collection on JCPenney.

## YOUR PERSONALITY
- You ARE Shaq. Talk like him: confident, warm, funny, self-aware about being the big man.
- Short punchy replies — 2-3 sentences MAX. Never long paragraphs.
- Use Shaq-isms occasionally: "Big fella", "Shaq-certified", "no lie", "straight up", "that's a W", "diesel style".
- When you recommend something, own it. Don't hedge or be wishy-washy.
- If the vibe is off (wrong size, wrong occasion), say it straight.

## HOW TO RECOMMEND PRODUCTS
- Read what the user actually wants: occasion, style vibe, color preference, body type hints.
- Pick 2–4 products that genuinely fit. Quality over quantity.
- When user shares an outfit photo, analyze it and suggest complementary pieces.
- For "big and tall" or size concerns: reassure them — the entire catalog is designed for big frames.
- For occasion-based asks (date night, boardroom, cookout): map the occasion to the right category.
- For "complete my look" asks: find pieces that go together as a set.

## PRODUCT CATALOG (${catalog.length} items — only use these IDs):
${productList}

## STRICT RESPONSE FORMAT
Always reply with valid JSON only. No markdown fences. No extra text.
{
  "reply": "2-3 sentence Shaq-style response",
  "products": [{"id": <number>, "reason": "1 sentence why this fits them"}],
  "suggestions": ["follow-up chip 1", "follow-up chip 2"]
}

## RULES
- "products": 0–4 items. Only exact numeric IDs from catalog above. Never invent IDs.
- "suggestions": 2 short action chips (under 6 words each) — what they'd naturally ask next.
- Off-topic questions: give a quick Shaq quip, empty products array.
- Never apologize excessively. Never say "Great question!" or "Certainly!".
- If catalog has nothing that fits, say so honestly and suggest the closest match.`;
}

export const POST: RequestHandler = async ({ request }) => {
  const GEMINI_API_KEY = env.GEMINI_API_KEY;

  if (!GEMINI_API_KEY) {
    // Friendly placeholder when no key is configured
    return json({
      reply: "Hey! I'm Shaq's AI assistant. Set up the GEMINI_API_KEY to get started with personalized style advice!",
      products: [],
      suggestions: ['Browse the collection', 'Show me your top picks'],
    });
  }

  let body: { message: string; history?: ChatMessage[]; imageUrl?: string };
  try {
    body = await request.json();
  } catch {
    return json({ error: 'Invalid request body' }, { status: 400 });
  }

  const { message, history = [], imageUrl } = body;
  if (!message && !imageUrl) {
    return json({ error: 'message or imageUrl required' }, { status: 400 });
  }

  // Build Gemini conversation contents
  const contents: unknown[] = [];

  // Add conversation history
  for (const msg of history.slice(-10)) { // cap at last 10 turns to stay in budget
    contents.push({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }],
    });
  }

  // Add current user message (with image if provided)
  const currentParts: unknown[] = [];
  if (imageUrl) {
    // Fetch image and convert to inline_data for Gemini
    try {
      const imgRes = await fetch(imageUrl);
      const imgBuf = await imgRes.arrayBuffer();
      const b64 = Buffer.from(imgBuf).toString('base64');
      const mimeType = imgRes.headers.get('content-type') || 'image/jpeg';
      currentParts.push({ inline_data: { mime_type: mimeType, data: b64 } });
    } catch {
      console.warn('[chat] Could not fetch image for Gemini:', imageUrl);
    }
  }
  currentParts.push({ text: message || 'What do you think of my outfit?' });
  contents.push({ role: 'user', parts: currentParts });

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: buildSystemPrompt() }] },
          contents,
          generationConfig: {
            responseMimeType: 'application/json',
            temperature: 0.85,
            maxOutputTokens: 4096,
          },
        }),
        signal: AbortSignal.timeout(60000),
      }
    );

    if (!res.ok) {
      const errText = await res.text();
      console.error('[chat] Gemini error', res.status, errText.slice(0, 200));
      return json({
        reply: "Oops, something went wrong on my end. Give it another shot!",
        products: [],
        suggestions: ['Try again', 'Browse the collection'],
      });
    }

    const data = await res.json();
    const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';

    let parsed: GeminiResponse;
    try {
      // Strip markdown code fences if present (```json ... ```)
      const cleaned = rawText.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/,'').trim();
      parsed = JSON.parse(cleaned);
    } catch {
      console.warn('[chat] JSON parse failed, rawText length:', rawText.length, rawText.slice(0, 100));
      // Don't leak raw JSON — show a friendly retry message
      parsed = {
        reply: "Hmm, my brain glitched for a sec. Try asking that again!",
        products: [],
        suggestions: ['Try again', 'Show me collections'],
      };
    }

    // Map product IDs back to full catalog entries
    const resolvedProducts = (parsed.products || [])
      .map((p) => {
        const cat = catalog.find((c) => c.id === p.id);
        if (!cat) return null;
        return {
          id: String(cat.id),
          ppid: String(cat.id),
          imageUrl: cat.image_url,
          brand: 'Shaq',
          price: String(cat.price),
          cta: { text: 'Shop Now', url: cat.product_url },
          message: cat.title,
          reason: p.reason,
        };
      })
      .filter(Boolean);

    return json({
      reply: parsed.reply || '',
      products: resolvedProducts,
      suggestions: parsed.suggestions || [],
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[chat] error:', msg);
    return json({
      reply: "Technical timeout — try again in a sec!",
      products: [],
      suggestions: ['Try again', 'Show me collections'],
    });
  }
};
