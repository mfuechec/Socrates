/**
 * POST /api/vision
 * Image-to-text extraction via GPT-4 Vision API
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import OpenAI from 'openai';
import type { VisionResponse, ErrorResponse } from '@/types/api';

// CORS allowlist
const ALLOWED_ORIGINS = [
  'http://localhost:3000',
  process.env.NEXT_PUBLIC_VERCEL_URL
    ? `https://${process.env.NEXT_PUBLIC_VERCEL_URL}`
    : null,
].filter(Boolean) as string[];

// Validation limits
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Disable Next.js body parsing for multipart form data
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '6mb', // Slightly larger than max file size
    },
  },
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<VisionResponse | ErrorResponse>
) {
  // Only accept POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // CORS protection
  const origin = req.headers.origin;
  if (origin && !ALLOWED_ORIGINS.includes(origin)) {
    console.error(`Rejected request from unauthorized origin: ${origin}`);
    return res.status(403).json({ error: 'Forbidden' });
  }

  try {
    // Accept base64 image in JSON body
    const { image, mimeType } = req.body;

    if (!image || typeof image !== 'string') {
      return res.status(400).json({ error: 'No image file provided' });
    }

    // Validate mime type
    if (!mimeType || !['image/png', 'image/jpeg'].includes(mimeType)) {
      return res
        .status(400)
        .json({ error: 'Invalid image format (use PNG or JPG)' });
    }

    // Estimate size from base64 string
    const estimatedSize = (image.length * 3) / 4;
    if (estimatedSize > MAX_FILE_SIZE) {
      return res.status(413).json({ error: 'Image too large (max 5MB)' });
    }

    // Call GPT-4 Vision API
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image_url',
              image_url: {
                url: `data:${mimeType};base64,${image}`,
              },
            },
            {
              type: 'text',
              text: 'Extract the math problem from this image. Return only the problem text, exactly as written. If there are equations, preserve them clearly. Do not solve the problem.',
            },
          ],
        },
      ],
    });

    // Extract response text
    const extractedText = response.choices[0]?.message?.content;
    if (!extractedText) {
      throw new Error('No text content in GPT-4 Vision response');
    }

    return res.status(200).json({
      extractedText,
    });
  } catch (error: any) {
    // Log full error server-side
    console.error('GPT-4 Vision API error:', error);

    // Return sanitized error to client
    const statusCode = error.status || 500;
    const errorMessage =
      statusCode === 429
        ? 'Rate limit exceeded. Wait 30 seconds and try again.'
        : 'Vision API failed. Try uploading a clearer image or type manually.';

    return res.status(statusCode).json({ error: errorMessage });
  }
}
