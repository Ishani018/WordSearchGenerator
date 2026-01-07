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

// Cache to store base64 font data and font names (to avoid re-fetching fonts)
// Structure: { fontName: string, base64: string, isBold: boolean }
const fontDataCache = new Map<string, { fontName: string; base64: string; isBold: boolean }>();

/**
 * Load a font for jsPDF document
 * Fetches Google fonts and adds them to the document, falls back to Helvetica on error
 * 
 * @param doc - jsPDF document instance
 * @param fontId - ID of the font to load
 * @returns Promise that resolves with the font name to use, or undefined if standard font
 */
export async function loadFontForPDF(doc: any, fontId: string): Promise<string | undefined> {
  // Check if font is already loaded in this document instance
  const fontName = fontId.replace(/-/g, '');
  const fontFileName = `${fontName}.ttf`;
  
  // Check if font data is cached
  const cacheKey = `${fontId}`;
  const cachedData = fontDataCache.get(cacheKey);
  
  if (cachedData) {
    // Font data is cached, but we still need to add it to THIS document instance
    // Standard fonts don't need VFS operations - they're built into jsPDF
    if (!cachedData.base64) {
      // Standard font - no need to add to VFS, just return the name
      return cachedData.fontName;
    }
    
    // Google font - add to this document instance
    // Always add it - jsPDF will handle duplicates gracefully or we'll catch errors
    try {
      doc.addFileToVFS(fontFileName, cachedData.base64);
      doc.addFont(fontFileName, cachedData.fontName, cachedData.isBold ? 'bold' : 'normal');
      // Also add the other variant for compatibility
      if (cachedData.isBold) {
        try {
          doc.addFont(fontFileName, cachedData.fontName, 'normal');
        } catch (e) {
          // Ignore if it fails
        }
      } else {
        try {
          doc.addFont(fontFileName, cachedData.fontName, 'bold');
        } catch (e) {
          // Ignore if it fails
        }
      }
    } catch (e) {
      // Font might already be in VFS, try to add it anyway
      try {
        doc.addFont(fontFileName, cachedData.fontName, cachedData.isBold ? 'bold' : 'normal');
        if (cachedData.isBold) {
          try {
            doc.addFont(fontFileName, cachedData.fontName, 'normal');
          } catch (e2) {}
        } else {
          try {
            doc.addFont(fontFileName, cachedData.fontName, 'bold');
          } catch (e2) {}
        }
      } catch (e2) {
        // If all else fails, the font might already be loaded, continue anyway
        console.log(`Font ${cachedData.fontName} may already be loaded in document`);
      }
    }
    return cachedData.fontName;
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
        // Cache standard fonts too (no base64 needed, just the name)
        fontDataCache.set(cacheKey, { fontName: font.id, base64: '', isBold: false });
        return font.id;
      }
      console.warn(`Standard font "${fontId}" not recognized, falling back to Helvetica`);
      const fallbackName = 'helvetica';
      fontDataCache.set(cacheKey, { fontName: fallbackName, base64: '', isBold: false });
      return fallbackName;
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
        const isBold = fontId.endsWith('-bold');
        
        doc.addFileToVFS(`${fontName}.ttf`, base64);
        
        // Add font to the document
        if (isBold) {
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
        
        // Cache the font data for future use
        fontDataCache.set(cacheKey, { fontName, base64, isBold });
        
        console.log(`Successfully loaded font: ${font.name} (${fontId}) as "${fontName}"`);
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
                // Cache the font data (marked as bold even though it's regular font)
                fontDataCache.set(cacheKey, { fontName, base64, isBold: true });
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

