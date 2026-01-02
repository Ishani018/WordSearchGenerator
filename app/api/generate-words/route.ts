import { NextRequest, NextResponse } from 'next/server';
import Groq from 'groq-sdk';

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_MODEL = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';

/**
 * Parse words from AI response text
 */
function parseWordsFromResponse(responseText: string, count: number, maxLength: number = 20): string[] {
  const words: string[] = [];
  const seen = new Set<string>();
  
  // Strategy 1: Split by newlines (most common format)
  for (const line of responseText.split('\n')) {
    const cleaned = line.trim().toUpperCase();
    // Remove common prefixes like "1.", "-", "*", etc.
    const withoutPrefix = cleaned.replace(/^[0-9.\-*•()\[\]\s]+/, '');
    // Remove trailing punctuation
    const withoutSuffix = withoutPrefix.replace(/[.,;:!?]+$/, '');
    // Split by common separators (comma, semicolon, etc.)
    const parts = withoutSuffix.replace(/[,;|]/g, ' ').split(/\s+/);
    
    for (const word of parts) {
      const cleanWord = word.trim().toUpperCase().replace(/[.,;:!?]+$/, '');
      // Only keep alphabetic words of appropriate length
      if (
        cleanWord &&
        cleanWord.length >= 4 &&
        cleanWord.length <= maxLength &&
        /^[A-Z]+$/.test(cleanWord) &&
        !seen.has(cleanWord)
      ) {
        seen.add(cleanWord);
        words.push(cleanWord);
        if (words.length >= count) break;
      }
    }
    if (words.length >= count) break;
  }
  
  // Strategy 2: If we didn't get enough, try splitting entire response by spaces
  if (words.length < count) {
    const allWords = responseText.replace(/\n/g, ' ').replace(/[,;|]/g, ' ').split(/\s+/);
    for (const word of allWords) {
      const cleanWord = word.trim().toUpperCase().replace(/[.,;:!?]+$/, '');
      if (
        cleanWord &&
        cleanWord.length >= 4 &&
        cleanWord.length <= maxLength &&
        /^[A-Z]+$/.test(cleanWord) &&
        !seen.has(cleanWord)
      ) {
        seen.add(cleanWord);
        words.push(cleanWord);
        if (words.length >= count) break;
      }
    }
  }
  
  return words;
}

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
    // Check if it's a 429 Too Many Requests error
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
 * Generate words from theme using Groq API
 */
async function generateWordsFromGroq(
  theme: string,
  count: number,
  existingWords: string[] = [],
  maxWordLength: number = 15
): Promise<string[]> {
  if (!GROQ_API_KEY) {
    throw new Error('GROQ_API_KEY environment variable is not set');
  }

  const groq = new Groq({
    apiKey: GROQ_API_KEY,
  });

  // Ensure maxWordLength is reasonable (at least 4, at most 20)
  const safeMaxLength = Math.max(4, Math.min(maxWordLength, 20));
  
  const prompt = `Generate exactly ${count} words related to the theme "${theme}".

Requirements:
- Return EXACTLY ${count} words
- One word per line
- All words in UPPERCASE
- Words MUST be between 4 and ${safeMaxLength} letters long (CRITICAL: no words longer than ${safeMaxLength} letters)
- Prefer shorter words (4-8 letters) when possible for better puzzle fit
- Words should be suitable for word search puzzles
- Do NOT include numbers, bullet points, dashes, or any other formatting
- Do NOT include explanations or descriptions
- Just list the words, one per line
${existingWords.length > 0 ? `\nIMPORTANT: Do NOT repeat any of these words: ${existingWords.slice(0, 20).join(', ')}` : ''}

Example format:
WORD1
WORD2
WORD3
...

Generate ${count} words now:`;

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
        temperature: 0.7,
        max_tokens: count * 20, // Estimate tokens needed
      })
    );

    const responseText = completion.choices[0]?.message?.content || '';

    if (!responseText || responseText.trim().length === 0) {
      throw new Error('Empty response from Groq');
    }

    console.log(`Groq response length: ${responseText.length} characters`);

    // Parse words from response with max length constraint
    let words = parseWordsFromResponse(responseText, count, safeMaxLength);
    console.log(`Parsed ${words.length} words from initial response (needed ${count}, max length: ${safeMaxLength})`);

    // If we still don't have enough words, make additional API calls
    const maxAttempts = 3;
    let attempts = 0;
    const allWords = [...words];

    while (allWords.length < count && attempts < maxAttempts) {
      const needed = count - allWords.length;
      const additionalPrompt = `Generate ${needed} MORE words related to "${theme}".

IMPORTANT: Do NOT repeat any of these words: ${allWords.slice(0, 20).join(', ')}

Requirements:
- Generate exactly ${needed} NEW words
- One word per line
- All in UPPERCASE
- 4-12 letters each
- No formatting, just the words

Generate ${needed} words now:`;

      try {
        const additionalCompletion = await rateLimitedApiCall(() =>
          groq.chat.completions.create({
            messages: [
              {
                role: 'user',
                content: additionalPrompt,
              },
            ],
            model: GROQ_MODEL,
            temperature: 0.8,
            max_tokens: needed * 20,
          })
        );

        const additionalText = additionalCompletion.choices[0]?.message?.content || '';
        const newWords = parseWordsFromResponse(additionalText, needed, safeMaxLength);

        // Add unique new words
        const seenSet = new Set(allWords.map(w => w.toUpperCase()));
        for (const word of newWords) {
          const upperWord = word.toUpperCase();
          if (!seenSet.has(upperWord) && word.length >= 4 && word.length <= safeMaxLength) {
            allWords.push(word);
            seenSet.add(upperWord);
            if (allWords.length >= count) break;
          }
        }
      } catch (error) {
        console.error('Additional request failed:', error);
        break;
      }

      attempts++;

      // If we didn't get any new words, break to avoid infinite loop
      if (allWords.length === words.length) {
        break;
      }
      words = allWords;
    }

    if (allWords.length >= count) {
      return allWords.slice(0, count);
    } else if (allWords.length > 0) {
      return allWords;
    } else {
      throw new Error('No valid words extracted from Groq response');
    }
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
 * Fallback word lists when Groq is unavailable
 */
function getFallbackWords(theme: string, count: number): string[] {
  const themeLower = theme.toLowerCase();
  const wordBanks: Record<string, string[]> = {
    winter: ['SNOWFLAKE', 'ICICLE', 'BLIZZARD', 'FROST', 'SNOWMAN', 'MITTENS', 'SCARF', 'HOTCHOCOLATE', 'FIREPLACE', 'WINTER', 'COLD', 'ICE', 'SKI', 'SLED', 'SNOWBALL'],
    summer: ['BEACH', 'SUNSHINE', 'VACATION', 'SWIMMING', 'ICECREAM', 'BARBECUE', 'SUNSET', 'OCEAN', 'SAND', 'WAVES', 'SUNGLASSES', 'HAT', 'SANDALS', 'POOL', 'PICNIC'],
    animals: ['ELEPHANT', 'LION', 'TIGER', 'BEAR', 'WOLF', 'DEER', 'RABBIT', 'SQUIRREL', 'EAGLE', 'OWL', 'SHARK', 'WHALE', 'DOLPHIN', 'PENGUIN', 'KANGAROO'],
    food: ['PIZZA', 'BURGER', 'PASTA', 'SALAD', 'SANDWICH', 'SOUP', 'STEAK', 'CHICKEN', 'FISH', 'RICE', 'BREAD', 'CHEESE', 'FRUIT', 'VEGETABLE', 'DESSERT'],
  };

  for (const [key, words] of Object.entries(wordBanks)) {
    if (themeLower.includes(key)) {
      return words.slice(0, count);
    }
  }

  // Default generic words
  return ['WORD', 'SEARCH', 'PUZZLE', 'FIND', 'GRID', 'LETTER', 'SOLVE', 'CHALLENGE', 'BRAIN', 'GAME', 'FUN', 'ENJOY', 'LEARN', 'PLAY'].slice(0, count);
}

/**
 * Parse sub-themes from AI response
 */
function parseSubThemes(responseText: string): string[] {
  const themes: string[] = [];
  const seen = new Set<string>();
  
  for (const line of responseText.split('\n')) {
    const cleaned = line.trim();
    // Remove common prefixes
    const withoutPrefix = cleaned.replace(/^[0-9.\-*•()\[\]\s]+/, '');
    // Remove trailing punctuation
    const withoutSuffix = withoutPrefix.replace(/[.,;:!?]+$/, '');
    
    if (withoutSuffix && withoutSuffix.length > 2 && withoutSuffix.length < 50) {
      const theme = withoutSuffix.trim();
      const lowerTheme = theme.toLowerCase();
      if (!seen.has(lowerTheme)) {
        seen.add(lowerTheme);
        themes.push(theme);
      }
    }
  }
  
  return themes;
}

/**
 * Expand topic into sub-themes (ONLY titles, no words)
 * Word generation is handled on the client side to avoid timeouts
 */
async function expandTopic(mainTheme: string, numChapters: number = 25): Promise<{
  bookTitle: string;
  chapters: Array<{ title: string; words: string[] }>;
}> {
  if (!GROQ_API_KEY) {
    throw new Error('GROQ_API_KEY environment variable is not set');
  }

  const groq = new Groq({
    apiKey: GROQ_API_KEY,
  });

  // Generate sub-themes only
  const targetCount = Math.min(Math.max(numChapters, 5), 100); // Clamp between 5-100
  const subThemePrompt = `Generate exactly ${targetCount} distinct sub-themes or chapters related to "${mainTheme}".

Requirements:
- Return EXACTLY ${targetCount} sub-themes
- One sub-theme per line
- Each sub-theme should be a specific, focused topic (e.g., "Skiing Equipment", "Winter Holidays", "Arctic Animals")
- Sub-themes should be diverse and cover different aspects of ${mainTheme}
- Do NOT include numbers, bullet points, dashes, or formatting
- Just list the sub-themes, one per line

Example format:
Skiing Equipment
Winter Holidays
Arctic Animals
Warm Clothing
...

Generate sub-themes now:`;

  try {
    const subThemeCompletion = await rateLimitedApiCall(() =>
      groq.chat.completions.create({
        messages: [{ role: 'user', content: subThemePrompt }],
        model: GROQ_MODEL,
        temperature: 0.8,
        max_tokens: 1000,
      })
    );

    const subThemeText = subThemeCompletion.choices[0]?.message?.content || '';
    const subThemes = parseSubThemes(subThemeText).slice(0, targetCount); // Limit to requested count

    if (subThemes.length === 0) {
      throw new Error('No sub-themes generated');
    }

    // Return chapters with empty word arrays - words will be generated on client side
    const chapters = subThemes.map(title => ({
      title,
      words: [] as string[]
    }));

    return {
      bookTitle: mainTheme,
      chapters,
    };
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to expand topic');
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const theme = body.theme?.trim() || '';
    const mode = body.mode || 'words'; // 'words' or 'expand_topic'
    const count = Math.min(Math.max(parseInt(body.count) || 20, 1), 200);
    const wordsPerChapter = Math.min(Math.max(parseInt(body.wordsPerChapter) || 15, 5), 30);
    const numChapters = Math.min(Math.max(parseInt(body.numChapters) || 25, 5), 100);
    const gridSize = Math.min(Math.max(parseInt(body.gridSize) || 15, 5), 50);

    if (!theme) {
      return NextResponse.json(
        { error: 'Theme is required' },
        { status: 400 }
      );
    }

    // Handle topic expansion mode
    if (mode === 'expand_topic') {
      try {
        const result = await expandTopic(theme, numChapters);
        return NextResponse.json(result);
      } catch (error) {
        console.error('Topic expansion error:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        return NextResponse.json(
          { error: `Failed to expand topic: ${errorMessage}` },
          { status: 500 }
        );
      }
    }

    // Check if Groq API key is configured
    if (!GROQ_API_KEY) {
      console.error('GROQ_API_KEY not configured');
      const fallbackWords = getFallbackWords(theme, count);
      return NextResponse.json({ 
        words: fallbackWords,
        warning: 'Groq API key not configured. Please set GROQ_API_KEY environment variable. Using fallback words.'
      });
    }

    // Try Groq word generation
    try {
      // Calculate max word length based on typical grid size (default 15x15 = max 13 letters)
      const defaultGridSize = 15;
      const maxWordLength = defaultGridSize - 2;
      const words = await generateWordsFromGroq(theme, count, [], maxWordLength);
      
      if (words.length === 0) {
        console.warn(`Groq returned 0 words for theme: ${theme}`);
        const fallbackWords = getFallbackWords(theme, count);
        return NextResponse.json({ 
          words: fallbackWords,
          warning: 'Groq returned no valid words, using fallback words'
        });
      }
      
      return NextResponse.json({ words });
    } catch (error) {
      console.error('Groq word generation error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      // Fallback to predefined lists
      const fallbackWords = getFallbackWords(theme, count);
      return NextResponse.json({ 
        words: fallbackWords,
        warning: `Groq error: ${errorMessage}. Using fallback words.`
      });
    }
  } catch (error) {
    console.error('Error generating words:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate words' },
      { status: 500 }
    );
  }
}
