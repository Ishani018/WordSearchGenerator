/**
 * Font definitions and loading utilities for PDF generation
 */

export interface FontDefinition {
  name: string;
  id: string;
  type: 'standard' | 'google';
  url?: string; // Only for Google fonts
}

/**
 * Available fonts for PDF generation
 */
export const AVAILABLE_FONTS: FontDefinition[] = [
  // Standard fonts (built into jsPDF)
  {
    name: 'Helvetica',
    id: 'helvetica',
    type: 'standard',
  },
  {
    name: 'Times',
    id: 'times',
    type: 'standard',
  },
  {
    name: 'Courier',
    id: 'courier',
    type: 'standard',
  },
  
  // Google Fonts - Loaded from local /fonts/ directory
  {
    name: 'Roboto',
    id: 'roboto',
    type: 'google',
    url: '/fonts/Roboto-Regular.ttf',
  },
  {
    name: 'Roboto Bold',
    id: 'roboto-bold',
    type: 'google',
    url: '/fonts/Roboto-Bold.ttf',
  },
  {
    name: 'Open Sans',
    id: 'open-sans',
    type: 'google',
    url: '/fonts/OpenSans-Regular.ttf',
  },
  {
    name: 'Open Sans Bold',
    id: 'open-sans-bold',
    type: 'google',
    url: '/fonts/OpenSans-Bold.ttf',
  },
  {
    name: 'Lora',
    id: 'lora',
    type: 'google',
    url: '/fonts/Lora-Regular.ttf',
  },
  {
    name: 'Lora Bold',
    id: 'lora-bold',
    type: 'google',
    url: '/fonts/Lora-Bold.ttf',
  },
  {
    name: 'Playfair Display',
    id: 'playfair-display',
    type: 'google',
    url: '/fonts/PlayfairDisplay-Regular.ttf',
  },
  {
    name: 'Playfair Display Bold',
    id: 'playfair-display-bold',
    type: 'google',
    url: '/fonts/PlayfairDisplay-Bold.ttf',
  },
  {
    name: 'Playpen Sans',
    id: 'playpen-sans',
    type: 'google',
    url: '/fonts/PlaypenSans-Regular.ttf',
  },
  {
    name: 'Playpen Sans Bold',
    id: 'playpen-sans-bold',
    type: 'google',
    url: '/fonts/PlaypenSans-Bold.ttf',
  },
  {
    name: 'Schoolbell',
    id: 'schoolbell',
    type: 'google',
    url: '/fonts/Schoolbell-Regular.ttf',
  },
];

/**
 * Get font definition by ID
 */
export function getFontById(fontId: string): FontDefinition | undefined {
  return AVAILABLE_FONTS.find(font => font.id === fontId);
}

// Cache to prevent reloading fonts that are already loaded
const fontCache = new Map<string, string>();

/**
 * Load a font for jsPDF document
 * Fetches Google fonts and adds them to the document, falls back to Helvetica on error
 * 
 * @param doc - jsPDF document instance
 * @param fontId - ID of the font to load
 * @returns Promise that resolves with the font name to use, or undefined if standard font
 */
export async function loadFontForPDF(doc: any, fontId: string): Promise<string | undefined> {
  // Check cache first
  const cacheKey = `${fontId}`;
  if (fontCache.has(cacheKey)) {
    return fontCache.get(cacheKey);
  }
  try {
    const font = getFontById(fontId);
    
    if (!font) {
      console.warn(`Font with ID "${fontId}" not found, falling back to Helvetica`);
      return undefined;
    }
    
    // Standard fonts are already available in jsPDF
    if (font.type === 'standard') {
      // Return the standard font name
      const standardFonts = ['helvetica', 'times', 'courier'];
      if (standardFonts.includes(font.id)) {
        return font.id;
      }
      console.warn(`Standard font "${fontId}" not recognized, falling back to Helvetica`);
      return 'helvetica';
    }
    
    // Google fonts need to be fetched and loaded from local /fonts/ directory
    if (font.type === 'google' && font.url) {
      try {
        // Fetch the font file from local public/fonts directory
        const response = await fetch(font.url);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch font: ${response.status} ${response.statusText}. Make sure the font file exists in public/fonts/ directory.`);
        }
        
        // Convert to ArrayBuffer, then to base64 (using efficient chunking to avoid stack overflow)
        const arrayBuffer = await response.arrayBuffer();
        const bytes = new Uint8Array(arrayBuffer);
        // Convert in chunks to avoid "Maximum call stack size exceeded" error
        let binary = '';
        const chunkSize = 8192; // Process 8KB at a time
        for (let i = 0; i < bytes.length; i += chunkSize) {
          const chunk = bytes.subarray(i, i + chunkSize);
          binary += String.fromCharCode.apply(null, Array.from(chunk));
        }
        const base64 = btoa(binary);
        
        // Add font to jsPDF's virtual file system
        const fontName = font.id.replace(/-/g, '');
        doc.addFileToVFS(`${fontName}.ttf`, base64);
        
        // Add font to the document
        if (fontId.endsWith('-bold')) {
          // For bold variants, add as bold weight
          doc.addFont(`${fontName}.ttf`, fontName, 'bold');
        } else {
          // For regular fonts, add as normal weight
          doc.addFont(`${fontName}.ttf`, fontName, 'normal');
          // Also register for bold (for fonts without bold variants like Schoolbell)
          // This allows using bold style even if the font doesn't have a bold variant
          try {
            doc.addFont(`${fontName}.ttf`, fontName, 'bold');
          } catch (e) {
            // If it fails, that's okay - the font just doesn't support bold
          }
        }
        
        console.log(`Successfully loaded font: ${font.name} (${fontId}) as "${fontName}"`);
        fontCache.set(cacheKey, fontName);
        return fontName;
      } catch (error) {
        // Silently fail for bold variants (they're optional and may not exist)
        if (fontId.endsWith('-bold')) {
          // Try to use the regular variant instead
          const regularFontId = fontId.replace('-bold', '');
          const regularFont = getFontById(regularFontId);
          if (regularFont && regularFont.type === 'google' && regularFont.url) {
            try {
              const response = await fetch(regularFont.url);
              if (response.ok) {
                const arrayBuffer = await response.arrayBuffer();
                const bytes = new Uint8Array(arrayBuffer);
                // Convert in chunks to avoid stack overflow
                let binary = '';
                const chunkSize = 8192;
                for (let i = 0; i < bytes.length; i += chunkSize) {
                  const chunk = bytes.subarray(i, i + chunkSize);
                  binary += String.fromCharCode.apply(null, Array.from(chunk));
                }
                const base64 = btoa(binary);
                const fontName = regularFontId.replace(/-/g, '');
                doc.addFileToVFS(`${fontName}.ttf`, base64);
                doc.addFont(`${fontName}.ttf`, fontName, 'normal');
                // Use bold style with regular font (jsPDF will simulate bold)
                doc.addFont(`${fontName}.ttf`, fontName, 'bold');
                console.log(`Using regular "${regularFont.name}" font for bold variant "${fontId}"`);
                fontCache.set(cacheKey, fontName);
                return fontName;
              }
            } catch (e) {
              // Fall through to return undefined
            }
          }
          // If we can't load regular variant either, just return undefined silently
          return undefined;
        }
        console.error(`Error loading Google font "${fontId}":`, error);
        console.warn('Falling back to Helvetica. Make sure font files are in public/fonts/ directory.');
        return undefined;
      }
    }
    
    return undefined;
  } catch (error) {
    console.error(`Unexpected error in loadFontForPDF for "${fontId}":`, error);
    console.warn('Falling back to Helvetica');
    return undefined;
  }
}

/**
 * Load multiple fonts for jsPDF document
 * 
 * @param doc - jsPDF document instance
 * @param fontIds - Array of font IDs to load
 * @returns Promise that resolves when all fonts are loaded
 */
export async function loadFontsForPDF(doc: any, fontIds: string[]): Promise<void> {
  await Promise.all(fontIds.map(fontId => loadFontForPDF(doc, fontId)));
}

