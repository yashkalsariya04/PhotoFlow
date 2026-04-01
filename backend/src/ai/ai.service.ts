import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import sharp from 'sharp';

@Injectable()
export class AiService {
  constructor(private readonly configService: ConfigService) {}

  private readonly tagPools = {
    subjects: ['portrait', 'landscape', 'architecture', 'nature', 'wildlife', 'street', 'macro'],
    settings: ['indoor', 'outdoor', 'studio', 'urban', 'rural'],
    lighting: ['natural-light', 'artificial-light', 'golden-hour', 'blue-hour', 'night'],
    events: ['wedding', 'event', 'concert', 'sports', 'party'],
    style: ['documentary', 'artistic', 'commercial', 'editorial', 'fine-art'],
    colors: ['vibrant', 'monochrome', 'warm-tones', 'cool-tones', 'high-contrast'],
    composition: ['rule-of-thirds', 'symmetrical', 'minimal', 'busy', 'centered'],
  };

  async generateTags(imageBuffer: Buffer, metadata: Record<string, any>): Promise<string[]> {
    const tags: string[] = [];
    const exif = metadata?.exif || {};

    if (metadata.imageSize) {
      if (metadata.imageSize.width > metadata.imageSize.height) tags.push('landscape-orientation');
      else if (metadata.imageSize.width < metadata.imageSize.height) tags.push('portrait-orientation');
      else tags.push('square');
    }

    if (exif.Flash !== undefined) tags.push(exif.Flash > 0 ? 'flash-used' : 'natural-light');

    if (exif.DateTimeOriginal) {
      const hour = this.extractHourFromExif(exif.DateTimeOriginal);
      if (hour >= 5 && hour < 8) tags.push('sunrise', 'golden-hour');
      else if (hour >= 17 && hour < 20) tags.push('sunset', 'golden-hour');
      else if (hour >= 20 || hour < 5) tags.push('night');
      else tags.push('daytime');
    }

    tags.push(this.getRandomTag(this.tagPools.subjects));
    tags.push(this.getRandomTag(this.tagPools.settings));
    tags.push(this.getRandomTag(this.tagPools.colors));

    if (Math.random() > 0.7) tags.push(this.getRandomTag(this.tagPools.events));
    if (Math.random() > 0.6) tags.push(this.getRandomTag(this.tagPools.style));
    if (Math.random() > 0.5) tags.push(this.getRandomTag(this.tagPools.composition));

    const uniqueTags = [...new Set(tags)];
    return uniqueTags.slice(0, Math.min(10, uniqueTags.length));
  }

  private extractHourFromExif(timestamp: number | string): number {
    try { return new Date(timestamp).getHours(); }
    catch { return 12; }
  }

  private getRandomTag(pool: string[]): string {
    return pool[Math.floor(Math.random() * pool.length)];
  }

  // ─────────────────────────────────────────────────────────────
  //  MAIN ENTRY POINT
  //  Priority: 1) HF Inference API  2) Gemini  3) Sharp fallback
  // ─────────────────────────────────────────────────────────────
  async generateGhibliArt(imageBuffer: Buffer, mimeType: string): Promise<Buffer> {
    const hfKey = process.env.HUGGINGFACE_API_KEY || this.configService.get<string>('HUGGINGFACE_API_KEY') || '';
    const geminiKey = process.env.GEMINI_API_KEY || this.configService.get<string>('GEMINI_API_KEY') || '';

    console.log('[DEBUG] HF Key:', hfKey ? `✅ (${hfKey.slice(0, 10)}...)` : '❌ NOT FOUND');
    console.log('[DEBUG] Gemini Key:', geminiKey ? `✅ (${geminiKey.slice(0, 8)}...)` : '❌ NOT FOUND');

    // 1️⃣ Try HuggingFace nitrosocke/Ghibli-Diffusion (free with token)
    if (hfKey) {
      try {
        console.log('[GhibliArt] 🎨 Trying HuggingFace Ghibli-Diffusion...');
        const result = await this.generateWithHF(imageBuffer, mimeType, hfKey);
        console.log('[GhibliArt] ✅ HuggingFace success!');
        return result;
      } catch (err: any) {
        console.warn('[GhibliArt] HF failed:', err?.message?.slice(0, 200));
      }
    }

    // 2️⃣ Try Gemini
    if (geminiKey) {
      try {
        console.log('[GhibliArt] Trying Gemini...');
        const result = await this.generateWithGemini(imageBuffer, mimeType, geminiKey);
        console.log('[GhibliArt] ✅ Gemini success');
        return result;
      } catch (err: any) {
        console.warn('[GhibliArt] Gemini failed:', err?.message?.slice(0, 150));
      }
    }

    // 3️⃣ Sharp fallback
    console.warn('[GhibliArt] All AI methods failed — using sharp fallback');
    return this.generateGhibliFallback(imageBuffer);
  }

  // ─────────────────────────────────────────────────────────────
  //  HUGGING FACE — nitrosocke/Ghibli-Diffusion
  //  FREE with HF token — sends image as base64 for style transfer
  // ─────────────────────────────────────────────────────────────
  private async generateWithHF(imageBuffer: Buffer, mimeType: string, apiKey: string): Promise<Buffer> {

    // Resize image to max 512px to stay within HF limits
    const resizedBuffer = await sharp(imageBuffer)
      .resize(512, 512, { fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: 85 })
      .toBuffer();

    const base64 = resizedBuffer.toString('base64');

    // ✅ Use img2img endpoint with image input
    const endpoint = 'https://api-inference.huggingface.co/models/nitrosocke/Ghibli-Diffusion';

    const makeRequest = async () =>
      fetch(endpoint, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'X-Wait-For-Model': 'true',
        },
        body: JSON.stringify({
          // Send the image as inputs for img2img style transfer
          inputs: {
            image: base64,
            prompt: 'ghibli style, Studio Ghibli animation, soft watercolor illustration, warm earthy tones, Miyazaki aesthetic, whimsical dreamy atmosphere, highly detailed anime art',
            negative_prompt: 'ugly, blurry, bad anatomy, deformed, low quality, realistic photo, 3d render',
            num_inference_steps: 30,
            guidance_scale: 7.5,
            strength: 0.75,
          },
        }),
      });

    let resp = await makeRequest();

    // Handle model loading (cold start)
    if (resp.status === 503) {
      const json = await resp.json().catch(() => ({}));
      const waitTime = (json?.estimated_time || 20) * 1000;
      console.warn(`[GhibliArt] HF model loading, waiting ${Math.round(waitTime / 1000)}s...`);
      await new Promise((r) => setTimeout(r, Math.min(waitTime, 30000)));
      resp = await makeRequest();
    }

    if (!resp.ok) {
      const text = await resp.text().catch(() => '');
      throw new Error(`HF error ${resp.status}: ${text.slice(0, 200)}`);
    }

    // Check if response is JSON error or binary image
    const contentType = resp.headers.get('content-type') || '';

    if (contentType.includes('application/json')) {
      const json = await resp.json();
      throw new Error(`HF returned JSON instead of image: ${JSON.stringify(json).slice(0, 200)}`);
    }

    const arrayBuffer = await resp.arrayBuffer();
    const buf = Buffer.from(arrayBuffer);

    if (buf.length < 500) {
      throw new Error(`HF returned too-small response: ${buf.length} bytes`);
    }

    console.log(`[GhibliArt] HF returned image: ${(buf.length / 1024).toFixed(0)}KB`);
    return buf;
  }

  // ─────────────────────────────────────────────────────────────
  //  GEMINI fallback
  // ─────────────────────────────────────────────────────────────
  private async generateWithGemini(imageBuffer: Buffer, mimeType: string, apiKey: string): Promise<Buffer> {
    const resp = await fetch(
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-image-preview:generateContent',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
        body: JSON.stringify({
          contents: [{
            role: 'user',
            parts: [
              { inline_data: { mime_type: mimeType || 'image/jpeg', data: imageBuffer.toString('base64') } },
              { text: 'Transform this image into Studio Ghibli animation style — soft watercolors, warm earthy tones, Miyazaki aesthetic, whimsical and dreamy.' },
            ],
          }],
          generationConfig: { responseModalities: ['Text', 'Image'] },
        }),
      }
    );

    if (!resp.ok) {
      const text = await resp.text().catch(() => '');
      throw new Error(`Gemini error: ${resp.status} — ${text.slice(0, 200)}`);
    }

    const json = await resp.json();
    const parts = json?.candidates?.[0]?.content?.parts || [];
    for (const p of parts) {
      if (p?.inline_data?.data) return Buffer.from(p.inline_data.data, 'base64');
      if (p?.image?.data) return Buffer.from(p.image.data, 'base64');
    }
    throw new Error('Gemini returned no image');
  }

  // ─────────────────────────────────────────────────────────────
  //  SHARP FALLBACK — always works, no API
  // ─────────────────────────────────────────────────────────────
  private async generateGhibliFallback(imageBuffer: Buffer): Promise<Buffer> {
    console.log('[GhibliArt] Applying sharp color-grade fallback');
    return sharp(imageBuffer)
      .rotate()
      .modulate({ saturation: 1.8, brightness: 1.08, hue: 10 })
      .gamma(1.2)
      .blur(0.5)
      .sharpen({ sigma: 1.2 })
      .tint({ r: 255, g: 245, b: 220 })
      .jpeg({ quality: 92 })
      .toBuffer();
  }
}