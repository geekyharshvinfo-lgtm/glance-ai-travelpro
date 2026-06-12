import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { env } from '$env/dynamic/private';

export const POST: RequestHandler = async ({ request }) => {
  const GEMINI_API_KEY = env.GEMINI_API_KEY;

  if (!GEMINI_API_KEY) {
    return json({ error: 'GEMINI_API_KEY not configured' }, { status: 500 });
  }

  let body: { selfieUrl: string; productImageUrl: string; productName?: string; productType?: string; gender?: string };
  try {
    body = await request.json();
  } catch {
    return json({ error: 'Invalid request body' }, { status: 400 });
  }

  const { selfieUrl, productImageUrl, productName = 'this outfit', productType = '', gender } = body;
  if (!selfieUrl || !productImageUrl) {
    return json({ error: 'selfieUrl and productImageUrl are required' }, { status: 400 });
  }

  // Handle both data: URLs (base64 inline) and http: URLs (fetch)
  async function toBase64(url: string): Promise<{ data: string; mimeType: string } | null> {
    try {
      if (url.startsWith('data:')) {
        // data:image/jpeg;base64,<data>
        const [header, data] = url.split(',');
        const mimeType = header.replace('data:', '').replace(';base64', '');
        return { data, mimeType };
      }
      const res = await fetch(url, {
        signal: AbortSignal.timeout(30000),
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'image/webp,image/apng,image/*,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9',
          'Referer': 'https://www.jcpenney.com/',
        },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const buf = await res.arrayBuffer();
      const ct = res.headers.get('content-type')?.split(';')[0] || '';
      const mime = ct && ct.startsWith('image/') ? ct : 'image/jpeg';
      return { data: Buffer.from(buf).toString('base64'), mimeType: mime };
    } catch (e) {
      console.error('[tryon] image load failed:', url.slice(0, 80), e);
      return null;
    }
  }

  const [selfie, product] = await Promise.all([
    toBase64(selfieUrl),
    toBase64(productImageUrl),
  ]);

  if (!selfie || !product) {
    const which = !selfie ? 'selfie' : 'product';
    return json({ error: `Could not load ${which} image — URL type: ${!selfie ? selfieUrl.slice(0, 30) : productImageUrl.slice(0, 30)}` }, { status: 422 });
  }

  console.log('[tryon] selfie bytes:', selfie.data.length, 'product bytes:', product.data.length, 'type:', productType);

  // Detect category from productType + productName
  const nameAndType = `${productType} ${productName}`.toLowerCase();
  const isFootwear = /shoe|sneaker|boot|sandal|heel|loafer|slipper|footwear|kicks/.test(nameAndType);

  const genderHint = gender ? ` The person identifies as ${gender}.` : '';

  let prompt: string;

  if (isFootwear) {
    // Low-angle outdoor/urban shot — shoe as absolute hero, no studio
    prompt = `You are a world-class virtual try-on AI and fashion photographer. You have two images:
- Image 1: A photo of a real person (the customer)
- Image 2: A product photo of "${productName}"
${genderHint}

TASK: Generate one stunning photorealistic image of the person wearing these exact shoes, with the SHOE as the absolute hero of the frame.

CAMERA: Ultra-low ground-level angle — lens almost at pavement/ground height, shooting forward and slightly upward. The leading shoe looms large and sharp in the foreground while the subject's silhouette rises dramatically behind. This is a low-angle outdoor shot, NOT a studio setup.

ENVIRONMENT: Outdoor or urban setting — choose one naturally: rain-slicked city pavement at night with neon reflections in puddles; sun-drenched cobblestone street at golden hour; concrete steps of a public plaza at midday; open rooftop terrace at dusk with city skyline behind. The setting must feel real and lived-in, never a studio backdrop.

SHOE FOCUS: The shoe must be the sharpest, most detailed element in the entire frame. Colorway, sole profile, upper texture, stitching, and any branding must all be crystal clear. The shoe fills the lower third of the frame prominently.

POSE: Subject mid-stride or standing with one foot slightly forward — natural movement, not posed. Rest of outfit softly out of focus above.

LIGHTING: Ambient natural or environmental light — golden-hour sun, neon glow, or street lighting. One directional light source creating crisp specular highlights on the shoe upper and sole edge. No artificial studio lights.

STRICT PRESERVATION RULES:
1. The person's face — exact same features, expression, skin tone, NO changes
2. The person's hair — exact same style and color
3. The shoe — exact same color, design, sole, and details as shown in Image 2
4. Photorealistic result — looks like a real outdoor editorial photograph
5. NO watermarks, text, borders, or graphic overlays

Output a single editorial-quality fashion photograph.`;

  } else {
    // Editorial master prompt — LLM decides environment based on outfit context
    prompt = `You are a world-class virtual try-on AI and fashion photographer. You have two images:
- Image 1: A photo of a real person (the customer)
- Image 2: A product photo of "${productName}"
${genderHint}

TASK: Generate one stunning photorealistic high-fashion vertical (9:16) editorial image of the person wearing this exact product.

The environment must be contextually and functionally appropriate to the outfit being worn. The setting should feel like a natural, real-world place where this outfit would realistically be worn. For example: eveningwear or party outfits → upscale indoor environments such as cocktail bars, luxury hotel interiors, lounges, or nightclubs; casual streetwear → lively streets, cafés, or urban neighborhoods; resortwear or summer outfits → beaches, coastal promenades, or poolside; athleisure → parks, open walkways, or wellness-focused urban spaces; formalwear/suits → grand architecture, museum halls, luxury hotel lobbies, or rooftop terraces; winterwear → cold-weather streets or cozy outdoor environments. Avoid mismatched settings — the outfit context takes highest priority in determining the environment.

FRAMING: Ensure the subject is well-framed — no overly zoomed-in or cropped shots. Face clearly visible and naturally positioned. Clothing item accurately preserving its pattern, fit, and texture so it looks naturally worn with realistic fabric movement and folds.

POSE: Dynamic, non-static moment — standing with subtle weight shift, mid-step pause, or relaxed grounded stance. Hands placed naturally away from the neckline and torso. No stiff stances or exaggerated editorial postures. No props, handheld items, or devices anywhere in the scene.

CAMERA: Randomly choose one perspective — slight low-angle, eye-level, or subtle over-the-shoulder — creating an intimate, candid feel. Shallow depth of field with DSLR-style bokeh, keeping sharp focus on the subject and outfit.

LIGHTING: Soft and directional, realistic to the environment, enhancing fabric texture and facial features without appearing artificial.

EXPRESSION: Candid and effortless — off-camera gaze, mid-thought, subtle attitude. Not overly posed or blank.

STRICT PRESERVATION RULES:
1. The person's face — exact same features, expression, skin tone, NO changes
2. The person's hair — exact same style and color
3. The product — exact same color, pattern, logo, and design as shown in Image 2
4. Fit the item naturally and realistically to the person's body shape
5. Photorealistic result — looks like a real high-quality editorial photograph
6. NO watermarks, text, typography, logos, brand names, or graphic overlays of any kind

Output a single editorial-quality fashion photograph.`;
  }

  const MAX_ATTEMPTS = 3;
  type GeminiPart = { inlineData?: { mimeType: string; data: string }; text?: string };

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      console.log(`[tryon] attempt ${attempt}/${MAX_ATTEMPTS}`);
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-image:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  { inline_data: { mime_type: selfie.mimeType, data: selfie.data } },
                  { inline_data: { mime_type: product.mimeType, data: product.data } },
                  { text: prompt },
                ],
              },
            ],
            generationConfig: { responseModalities: ['IMAGE', 'TEXT'] },
          }),
          signal: AbortSignal.timeout(120000),
        }
      );

      if (!res.ok) {
        const errText = await res.text();
        console.error(`[tryon] Gemini error attempt ${attempt}:`, res.status, errText.slice(0, 300));
        if (attempt < MAX_ATTEMPTS) continue;
        return json({ error: `Gemini error: ${res.status}` }, { status: 502 });
      }

      const data = await res.json();
      const parts = data?.candidates?.[0]?.content?.parts || [];
      const imagePart = (parts as GeminiPart[]).find((p) => p.inlineData?.data);

      if (!imagePart?.inlineData) {
        const finishReason = data?.candidates?.[0]?.finishReason;
        console.error(`[tryon] No image attempt ${attempt}, finishReason:`, finishReason);
        if (attempt < MAX_ATTEMPTS) continue;
        return json({ error: `No image generated (${finishReason || 'unknown reason'})` }, { status: 502 });
      }

      const { mimeType: mime_type, data: b64 } = imagePart.inlineData;
      console.log(`[tryon] success on attempt ${attempt}`);
      return json({ imageData: b64, mimeType: mime_type });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`[tryon] error attempt ${attempt}:`, msg);
      if (attempt < MAX_ATTEMPTS) continue;
      return json({ error: `Try-on failed: ${msg}` }, { status: 500 });
    }
  }

  return json({ error: 'Try-on failed after all attempts' }, { status: 500 });
};
