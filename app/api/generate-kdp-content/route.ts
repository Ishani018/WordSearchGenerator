import { NextRequest, NextResponse } from 'next/server';
import Groq from 'groq-sdk';

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_MODEL = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';

/**
 * Rate-limited API call helper with 429 retry logic
 */
async function rateLimitedApiCall<T>(
  apiCall: () => Promise<T>,
  retries: number = 1
): Promise<T> {
  try {
    return await apiCall();
  } catch (error: any) {
    const isRateLimit = error?.status === 429 || 
                       error?.message?.includes('429') ||
                       error?.message?.toLowerCase().includes('rate limit');
    
    if (isRateLimit && retries > 0) {
      console.log('Rate limit hit (429), waiting 5 seconds before retry...');
      await new Promise(resolve => setTimeout(resolve, 5000));
      return rateLimitedApiCall(apiCall, retries - 1);
    }
    
    throw error;
  }
}

/**
 * Generate KDP book description from chapter titles
 */
async function generateKDPDescription(
  bookTitle: string,
  chapterTitles: string[]
): Promise<string> {
  if (!GROQ_API_KEY) {
    throw new Error('GROQ_API_KEY environment variable is not set');
  }

  const groq = new Groq({
    apiKey: GROQ_API_KEY,
  });

  const chaptersList = chapterTitles.map((title, i) => `${i + 1}. ${title}`).join('\n');

  const prompt = `Write a compelling Amazon KDP book description for a word search puzzle book.

Book Title: "${bookTitle}"

Chapter Topics:
${chaptersList}

Requirements:
- Write 3-5 paragraphs (approximately 200-400 words)
- Start with a hook that captures attention
- Highlight the variety of topics covered (mention the chapters)
- Emphasize benefits: brain exercise, relaxation, entertainment, educational value
- Include relevant keywords naturally (e.g., "word search", "puzzle book", "brain games", "senior activities", "mindfulness", "vocabulary building")
- Mention the target audience (seniors, adults, puzzle enthusiasts)
- End with a call to action
- Use engaging, professional language suitable for Amazon product listings
- Do NOT include markdown formatting, bullet points, or special characters
- Write in plain text paragraphs separated by blank lines

Write the description now:`;

  try {
    const completion = await rateLimitedApiCall(() =>
      groq.chat.completions.create({
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
        model: GROQ_MODEL,
        temperature: 0.8,
        max_tokens: 800,
      })
    );

    const description = completion.choices[0]?.message?.content || '';
    
    if (!description || description.trim().length === 0) {
      throw new Error('Empty response from Groq');
    }

    return description.trim();
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('API key')) {
        throw new Error('Invalid or missing Groq API key');
      }
      throw error;
    }
    throw new Error('Unknown error calling Groq API');
  }
}

/**
 * Generate catchy book titles
 */
async function generateBookTitles(
  bookTitle: string,
  chapterTitles: string[],
  count: number = 5
): Promise<string[]> {
  if (!GROQ_API_KEY) {
    throw new Error('GROQ_API_KEY environment variable is not set');
  }

  const groq = new Groq({
    apiKey: GROQ_API_KEY,
  });

  const chaptersList = chapterTitles.slice(0, 10).join(', '); // Use first 10 for context

  const prompt = `Generate ${count} catchy, marketable book titles for a word search puzzle book.

Main Theme: "${bookTitle}"
Sample Chapter Topics: ${chaptersList}

Requirements:
- Generate exactly ${count} unique title suggestions
- Each title should be catchy, memorable, and SEO-friendly
- Include numbers when appropriate (e.g., "101 Puzzles", "50 Themed Word Searches")
- Mention the target audience if relevant (e.g., "for Seniors", "for Adults", "for Kids")
- Include keywords like "Word Search", "Puzzle Book", "Brain Games"
- Titles should be 5-12 words long
- Make them sound professional and appealing for Amazon KDP
- One title per line
- Do NOT include numbers, bullet points, dashes, or formatting
- Just list the titles, one per line

Example format:
101 Winter Wonder Puzzles for Seniors
Ultimate Word Search Collection: Themed Brain Games
Puzzle Master: 50 Themed Word Searches for Adults

Generate ${count} titles now:`;

  try {
    const completion = await rateLimitedApiCall(() =>
      groq.chat.completions.create({
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
        model: GROQ_MODEL,
        temperature: 0.9,
        max_tokens: 300,
      })
    );

    const responseText = completion.choices[0]?.message?.content || '';
    
    if (!responseText || responseText.trim().length === 0) {
      throw new Error('Empty response from Groq');
    }

    // Parse titles from response
    const titles: string[] = [];
    const seen = new Set<string>();
    
    for (const line of responseText.split('\n')) {
      const cleaned = line.trim();
      // Remove common prefixes
      const withoutPrefix = cleaned.replace(/^[0-9.\-*•()\[\]\s]+/, '');
      // Remove trailing punctuation
      const withoutSuffix = withoutPrefix.replace(/[.,;:!?]+$/, '');
      
      if (withoutSuffix && withoutSuffix.length > 5 && withoutSuffix.length < 100) {
        const title = withoutSuffix.trim();
        const lowerTitle = title.toLowerCase();
        if (!seen.has(lowerTitle)) {
          seen.add(lowerTitle);
          titles.push(title);
          if (titles.length >= count) break;
        }
      }
    }

    // If we didn't get enough, try splitting by other separators
    if (titles.length < count) {
      const parts = responseText.split(/[|;]/);
      for (const part of parts) {
        const cleaned = part.trim();
        if (cleaned && cleaned.length > 5 && cleaned.length < 100) {
          const lowerTitle = cleaned.toLowerCase();
          if (!seen.has(lowerTitle)) {
            seen.add(lowerTitle);
            titles.push(cleaned);
            if (titles.length >= count) break;
          }
        }
      }
    }

    if (titles.length === 0) {
      throw new Error('No valid titles extracted from response');
    }

    return titles.slice(0, count);
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('API key')) {
        throw new Error('Invalid or missing Groq API key');
      }
      throw error;
    }
    throw new Error('Unknown error calling Groq API');
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, bookTitle, chapterTitles, count } = body;

    if (!bookTitle || !chapterTitles || !Array.isArray(chapterTitles) || chapterTitles.length === 0) {
      return NextResponse.json(
        { error: 'bookTitle and chapterTitles array are required' },
        { status: 400 }
      );
    }

    if (type !== 'description' && type !== 'titles') {
      return NextResponse.json(
        { error: 'type must be either "description" or "titles"' },
        { status: 400 }
      );
    }

    // Check if Groq API key is configured
    if (!GROQ_API_KEY) {
      return NextResponse.json(
        { error: 'GROQ_API_KEY environment variable is not set' },
        { status: 500 }
      );
    }

    try {
      if (type === 'description') {
        const description = await generateKDPDescription(bookTitle, chapterTitles);
        return NextResponse.json({ description });
      } else {
        const titleCount = Math.min(Math.max(parseInt(count) || 5, 3), 10);
        const titles = await generateBookTitles(bookTitle, chapterTitles, titleCount);
        return NextResponse.json({ titles });
      }
    } catch (error) {
      console.error(`KDP content generation error (${type}):`, error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return NextResponse.json(
        { error: `Failed to generate ${type}: ${errorMessage}` },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error in KDP content generation route:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to process request' },
      { status: 500 }
    );
  }
}

