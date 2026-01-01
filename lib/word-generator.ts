/**
 * Client-side utility for generating words from themes
 */

export interface GenerateWordsResponse {
  words: string[];
  warning?: string;
  error?: string;
}

/**
 * Generate words from a theme using the Next.js API route
 */
export async function generateWordsFromTheme(
  theme: string,
  count: number = 20
): Promise<string[]> {
  try {
    const response = await fetch('/api/generate-words', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        theme: theme.trim(),
        count: Math.min(Math.max(count, 1), 100), // Clamp between 1-100
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to generate words');
    }

    const data: GenerateWordsResponse = await response.json();
    
    if (data.error) {
      throw new Error(data.error);
    }

    // Show warning if fallback words were used
    if (data.warning) {
      console.warn('Word generation warning:', data.warning);
      // You could show this to the user via a toast/notification
    }

    return data.words || [];
  } catch (error) {
    console.error('Error generating words:', error);
    throw error;
  }
}

