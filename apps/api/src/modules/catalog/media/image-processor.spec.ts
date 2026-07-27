import sharp from 'sharp';

import { ImageProcessor } from './image-processor';

describe('ImageProcessor (sharp)', () => {
  const processor = new ImageProcessor();

  async function makeImage(width: number, height: number): Promise<Buffer> {
    return await sharp({
      create: { width, height, channels: 3, background: { r: 200, g: 120, b: 40 } },
    })
      .png()
      .toBuffer();
  }

  it('derivativlar + LQIP hosil qiladi', async () => {
    const input = await makeImage(1000, 800);
    const result = await processor.process(input);

    expect(result.original).toEqual({ width: 1000, height: 800 });
    // 1000px manba → 400,800 kengliklar (1200+ kattalashtirilmaydi) × 3 format
    const widths = [...new Set(result.derivatives.map((d) => d.width))].sort((a, b) => a - b);
    expect(widths).toEqual([400, 800]);
    const formats = new Set(result.derivatives.map((d) => d.format));
    expect(formats).toEqual(new Set(['avif', 'webp', 'jpeg']));

    // LQIP — base64 webp data URI
    expect(result.lqip.startsWith('data:image/webp;base64,')).toBe(true);
    expect(result.lqip.length).toBeGreaterThan(30);
  });

  it('kichik rasm kattalashtirilmaydi (faqat 400)', async () => {
    const input = await makeImage(300, 300);
    const result = await processor.process(input);
    const widths = [...new Set(result.derivatives.map((d) => d.width))];
    expect(widths).toEqual([400]); // guard: 400 har doim, katta o'lchamlar yo'q
  });

  it('haqiqiy siqilgan bayt qaytaradi (webp < png)', async () => {
    const input = await makeImage(800, 800);
    const result = await processor.process(input);
    const webp = result.derivatives.find((d) => d.format === 'webp' && d.width === 800);
    expect(webp).toBeDefined();
    expect(webp!.buffer.length).toBeGreaterThan(0);
    // webp sarlavhasi "RIFF"
    expect(webp!.buffer.subarray(0, 4).toString('ascii')).toBe('RIFF');
  });
});
