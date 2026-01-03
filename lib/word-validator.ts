/**
 * Word validator using Dictionary API
 * Validates words by checking if they exist in a dictionary
 */

interface DictionaryResponse {
  word?: string;
  meanings?: Array<{
    partOfSpeech: string;
    definitions: Array<{ definition: string }>;
  }>;
  message?: string;
}

/**
 * Check if a word is valid using Dictionary API
 * Uses Next.js API route to avoid CORS issues
 */
export async function isValidWord(word: string): Promise<boolean> {
  if (!word || word.length < 2) return false;
  
  const cleanWord = word.toLowerCase().trim();
  
  try {
    // Use Next.js API route to proxy the request (avoids CORS)
    const response = await fetch(
      `/api/validate-word?word=${encodeURIComponent(cleanWord)}`
    );
    
    if (response.ok) {
      const data = await response.json();
      // If there's an error field, the word was marked as invalid after retries
      if (data.error) {
        console.warn(`Word "${word}" marked as invalid due to: ${data.error}`);
        return false;
      }
      return data.valid === true;
    } else {
      // API route error - mark as invalid to be safe
      console.warn(`Word validation API route error for "${word}": ${response.status}`);
      return false; // Filter out on API errors to avoid invalid words
    }
  } catch (error) {
    // Network error - mark as invalid to be safe
    console.warn(`Word validation network error for "${word}":`, error);
    return false; // Filter out on network errors to avoid invalid words
  }
}

/**
 * Validate multiple words in parallel (with rate limiting)
 */
export async function validateWords(
  words: string[],
  onProgress?: (validated: number, total: number) => void
): Promise<{ valid: string[]; invalid: string[] }> {
  const valid: string[] = [];
  const invalid: string[] = [];
  
  // Process in batches to avoid overwhelming the API
  const BATCH_SIZE = 3; // Reduced batch size to avoid rate limits
  const DELAY_BETWEEN_BATCHES = 500; // 500ms delay between batches to respect rate limits
  
  for (let i = 0; i < words.length; i += BATCH_SIZE) {
    const batch = words.slice(i, i + BATCH_SIZE);
    
    // Validate batch in parallel
    const results = await Promise.all(
      batch.map(async (word) => {
        const isValid = await isValidWord(word);
        return { word, isValid };
      })
    );
    
    // Separate valid and invalid words
    results.forEach(({ word, isValid }) => {
      if (isValid) {
        valid.push(word);
      } else {
        invalid.push(word);
      }
    });
    
    // Report progress
    if (onProgress) {
      onProgress(i + batch.length, words.length);
    }
    
    // Delay between batches to respect rate limits
    if (i + BATCH_SIZE < words.length) {
      await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_BATCHES));
    }
  }
  
  return { valid, invalid };
}

/**
 * Quick validation for single word (synchronous checks first, then async)
 */
export function quickValidateWord(word: string): boolean {
  if (!word || word.length < 2) return false;
  
  const cleanWord = word.trim().toUpperCase();
  
  // Basic validation: only letters, reasonable length
  if (!/^[A-Z]+$/.test(cleanWord)) return false;
  if (cleanWord.length < 2 || cleanWord.length > 30) return false;
  
  // Allow through for async validation
  return true;
}

