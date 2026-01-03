import { NextRequest, NextResponse } from 'next/server';

/**
 * Proxy API route for word validation
 * This avoids CORS issues by making the request server-side
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const word = searchParams.get('word');
  const retryCount = parseInt(searchParams.get('retry') || '0');

  if (!word) {
    return NextResponse.json(
      { error: 'Word parameter is required' },
      { status: 400 }
    );
  }

  const MAX_RETRIES = 2;
  const RETRY_DELAY = 2000; // 2 seconds

  try {
    // Use free Dictionary API (dictionaryapi.dev)
    const response = await fetch(
      `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word.toLowerCase().trim())}`,
      {
        headers: {
          'User-Agent': 'WordSearchGenerator/1.0',
        },
      }
    );

    if (response.ok) {
      const data = await response.json();
      // If we get a response with word data, it's a valid word
      const isValid = Array.isArray(data) && data.length > 0 && data[0].word !== undefined;
      return NextResponse.json({ valid: isValid });
    } else if (response.status === 404) {
      // Word not found in dictionary - definitely invalid
      return NextResponse.json({ valid: false });
    } else if (response.status === 429 && retryCount < MAX_RETRIES) {
      // Rate limited - retry after delay
      console.log(`Rate limited for "${word}", retrying in ${RETRY_DELAY}ms (attempt ${retryCount + 1}/${MAX_RETRIES})`);
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
      // Retry the request
      const retryResponse = await fetch(
        `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word.toLowerCase().trim())}`,
        {
          headers: {
            'User-Agent': 'WordSearchGenerator/1.0',
          },
        }
      );
      if (retryResponse.ok) {
        const data = await retryResponse.json();
        const isValid = Array.isArray(data) && data.length > 0 && data[0].word !== undefined;
        return NextResponse.json({ valid: isValid });
      } else if (retryResponse.status === 404) {
        return NextResponse.json({ valid: false });
      }
      // If still rate limited or error, fall through to invalid
    } else {
      // API error after retries - mark as invalid to be safe
      console.warn(`Dictionary API error for "${word}": ${response.status} (after ${retryCount} retries)`);
      // Return invalid instead of valid to filter out potentially bad words
      return NextResponse.json({ valid: false, error: `API error: ${response.status}` });
    }
  } catch (error) {
    // Network error - if we've retried, mark as invalid
    if (retryCount < MAX_RETRIES) {
      console.log(`Network error for "${word}", retrying in ${RETRY_DELAY}ms (attempt ${retryCount + 1}/${MAX_RETRIES})`);
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
      const retryUrl = new URL(request.url);
      retryUrl.searchParams.set('retry', String(retryCount + 1));
      try {
        const retryResponse = await fetch(retryUrl.toString());
        const data = await retryResponse.json();
        return NextResponse.json(data);
      } catch (retryError) {
        // Fall through to invalid
      }
    }
    // After retries, mark as invalid to filter out potentially bad words
    console.warn(`Dictionary API network error for "${word}" (after ${retryCount} retries):`, error);
    return NextResponse.json({ valid: false, error: 'Network error' });
  }
}

