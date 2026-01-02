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
  
  // Google Fonts - Using jsDelivr CDN (more reliable than GitHub raw)
  {
    name: 'Roboto',
    id: 'roboto',
    type: 'google',
    url: 'https://cdn.jsdelivr.net/gh/google/fonts@main/apache/roboto/Roboto-Regular.ttf',
  },
  {
    name: 'Roboto Bold',
    id: 'roboto-bold',
    type: 'google',
    url: 'https://cdn.jsdelivr.net/gh/google/fonts@main/apache/roboto/Roboto-Bold.ttf',
  },
  {
    name: 'Open Sans',
    id: 'open-sans',
    type: 'google',
    url: 'https://cdn.jsdelivr.net/gh/google/fonts@main/apache/opensans/OpenSans-Regular.ttf',
  },
  {
    name: 'Open Sans Bold',
    id: 'open-sans-bold',
    type: 'google',
    url: 'https://cdn.jsdelivr.net/gh/google/fonts@main/apache/opensans/OpenSans-Bold.ttf',
  },
  {
    name: 'Lora',
    id: 'lora',
    type: 'google',
    url: 'https://cdn.jsdelivr.net/gh/google/fonts@main/ofl/lora/Lora-Regular.ttf',
  },
  {
    name: 'Lora Bold',
    id: 'lora-bold',
    type: 'google',
    url: 'https://cdn.jsdelivr.net/gh/google/fonts@main/ofl/lora/Lora-Bold.ttf',
  },
  {
    name: 'Playfair Display',
    id: 'playfair-display',
    type: 'google',
    url: 'https://cdn.jsdelivr.net/gh/google/fonts@main/ofl/playfairdisplay/PlayfairDisplay-Regular.ttf',
  },
  {
    name: 'Playfair Display Bold',
    id: 'playfair-display-bold',
    type: 'google',
    url: 'https://cdn.jsdelivr.net/gh/google/fonts@main/ofl/playfairdisplay/PlayfairDisplay-Bold.ttf',
  },
];

/**
 * Get font definition by ID
 */
export function getFontById(fontId: string): FontDefinition | undefined {
  return AVAILABLE_FONTS.find(font => font.id === fontId);
}

/**
 * Load a font for jsPDF document
 * Fetches Google fonts and adds them to the document, falls back to Helvetica on error
 * 
 * @param doc - jsPDF document instance
 * @param fontId - ID of the font to load
 * @returns Promise that resolves with the font name to use, or undefined if standard font
 */
export async function loadFontForPDF(doc: any, fontId: string): Promise<string | undefined> {
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
    
    // Google fonts need to be fetched and loaded
    if (font.type === 'google' && font.url) {
      try {
        // Fetch the font file
        const response = await fetch(font.url);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch font: ${response.status} ${response.statusText}`);
        }
        
        // Convert to ArrayBuffer, then to base64
        const arrayBuffer = await response.arrayBuffer();
        const base64 = btoa(
          String.fromCharCode(...new Uint8Array(arrayBuffer))
        );
        
        // Add font to jsPDF's virtual file system
        const fontName = font.id.replace(/-/g, '');
        doc.addFileToVFS(`${fontName}.ttf`, base64);
        
        // Add font to the document (normal weight)
        doc.addFont(`${fontName}.ttf`, fontName, 'normal');
        
        // Note: Bold variants are loaded separately when user selects them
        // We don't auto-load bold variants to avoid unnecessary errors
        
        console.log(`Successfully loaded font: ${font.name} (${fontId}) as "${fontName}"`);
        return fontName;
      } catch (error) {
        console.error(`Error loading Google font "${fontId}":`, error);
        // Don't show fallback warning for bold variants (they're optional)
        if (!fontId.endsWith('-bold')) {
          console.warn('Falling back to Helvetica');
        }
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

