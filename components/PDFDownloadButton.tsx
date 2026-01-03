'use client';

import { jsPDF } from 'jspdf';
import { PuzzleResult } from '@/lib/puzzle-generator';
import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { loadFontForPDF, getFontById } from '@/lib/fonts';

// Define a type that can be either a puzzle or a blank page
export type PDFPageItem = 
  | (PuzzleResult & { chapterTitle?: string }) 
  | { isBlank: true; chapterTitle?: string };

export interface PDFDownloadButtonProps {
  puzzles: PDFPageItem[];
  title: string;
  includeTitlePage?: boolean;
  includeBelongsToPage?: boolean;
  copyrightText?: string;
  fontId?: string;
  fontSize?: number; // Font size in points for grid letters (e.g., 10 = 10pt)
  pageFormat: { width: number; height: number }; // New prop for page size
}

// Export reusable PDF generation function
export async function generatePDFDoc({
  puzzles,
  title,
  includeTitlePage = false,
  includeBelongsToPage = false,
  copyrightText = '',
  fontId,
  fontSize = 10, // Default 10pt
  pageFormat
}: PDFDownloadButtonProps): Promise<jsPDF> {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'in',
    format: [pageFormat.width, pageFormat.height]
  });
  
  // Load font if provided
  let fontName: string | undefined;
  if (fontId) {
    console.log(`Loading font: ${fontId}`);
    const loadedFontName = await loadFontForPDF(doc, fontId);
    if (loadedFontName) {
      fontName = loadedFontName;
      console.log(`Font loaded successfully: ${fontName}`);
    } else {
      // Standard font was selected
      const font = getFontById(fontId);
      if (font && font.type === 'standard') {
        fontName = font.id;
        console.log(`Using standard font: ${fontName}`);
      }
    }
  }
  
  // Helper to get font name for setFont calls
  const getFont = (defaultFont: string = 'helvetica') => {
    const finalFont = fontName || defaultFont;
    // Only override if we have a custom font loaded (don't override courier for grid)
    if (fontName && defaultFont !== 'courier') {
      return fontName;
    }
    return defaultFont;
  };
  
  // Helper to apply font size multiplier
  const applyFontSize = (baseSize: number) => {
    return baseSize * fontSize;
  };
  
  // Use dimensions from props
  const pageWidth = pageFormat.width;
  const pageHeight = pageFormat.height;
  
  // Dynamic margins based on page size - smaller pages get smaller margins
  // Increased margins slightly for better borders
  const pageArea = pageWidth * pageHeight;
  let margin: number;
  if (pageArea < 45) {
    // Very small pages (5x8 = 40, 5.25x8 = 42)
    margin = 0.35;
  } else if (pageArea < 60) {
    // Small-medium pages (6x9 = 54, 5.5x8.5 = 46.75)
    margin = 0.4;
  } else if (pageArea < 80) {
    // Medium pages (7x10 = 70)
    margin = 0.5;
  } else {
    // Large pages (8.5x11 = 93.5, A4 = 96.6)
    margin = 0.6;
  }
  
  let currentPage = 1;
  
  // FRONT MATTER: Title Page
  if (includeTitlePage) {
    drawTitlePage(doc, title, copyrightText, pageWidth, pageHeight, margin, fontName, fontSize);
    currentPage++;
  }
  
  // FRONT MATTER: "This Book Belongs To" Page
  if (includeBelongsToPage) {
    if (currentPage > 1) {
      doc.addPage([pageWidth, pageHeight]);
    }
    drawBelongsToPage(doc, pageWidth, pageHeight, margin, fontName, fontSize);
    currentPage++;
  }
  
  // Track puzzle page numbers for solutions reference
  // We need to map the original puzzle index to its page number
  const puzzlePageMap = new Map<number, number>();
    
  // Filter out actual puzzles for counting
  const totalRealPuzzles = puzzles.filter(p => !('isBlank' in p)).length;
  let currentPuzzleCount = 0;

  // SECTION 1: All puzzle pages (unsolved)
  puzzles.forEach((item, index) => {
    if (currentPage > 1 || index > 0) {
      doc.addPage([pageWidth, pageHeight]);
    }
    
    // Handle Blank Page
    if ('isBlank' in item) {
      // Just leave it empty
      currentPage++;
      return;
    }

    // It is a real puzzle
    currentPuzzleCount++;
    const pageNum = currentPage;
    
    // Store the page number for this puzzle (using its index in the filtered list)
    puzzlePageMap.set(currentPuzzleCount - 1, currentPage);
    
    drawPuzzlePage(
      doc, 
      item, 
      currentPuzzleCount, 
      totalRealPuzzles, 
      title, 
      pageWidth, 
      pageHeight, 
      margin, 
      currentPage, 
      fontName, 
      fontSize
    );
    currentPage++;
  });
  
  // SECTION 2: Solutions section
  // Filter only real puzzles
  const solutionPuzzles = puzzles.filter((p): p is PuzzleResult & { chapterTitle?: string } => !('isBlank' in p));
  
  if (solutionPuzzles.length > 0) {
    const puzzlesPerPage = 2;
    const totalSolutionPages = Math.ceil(solutionPuzzles.length / puzzlesPerPage);
    
    for (let pageIndex = 0; pageIndex < totalSolutionPages; pageIndex++) {
      doc.addPage([pageWidth, pageHeight]);
      currentPage++;
      
      const startIndex = pageIndex * puzzlesPerPage;
      const endIndex = Math.min(startIndex + puzzlesPerPage, solutionPuzzles.length);
      const puzzlesOnPage = solutionPuzzles.slice(startIndex, endIndex);
    
      // Get the original page numbers for these puzzles
      const pageNumbersOnPage = puzzlesOnPage.map((_, i) => {
        const globalIndex = startIndex + i;
        return puzzlePageMap.get(globalIndex) || 0;
      });
      
      drawSolutionsPage(
        doc, 
        puzzlesOnPage, 
        pageNumbersOnPage, 
        startIndex, 
        solutionPuzzles.length, 
        title, 
        pageWidth, 
        pageHeight, 
        margin, 
        fontName, 
        fontSize
      );
    }
  }
  
  return doc;
}

export default function PDFDownloadButton(props: PDFDownloadButtonProps) {
  const handleDownload = async () => {
    const doc = await generatePDFDoc(props);
    doc.save(`${props.title.replace(/\s+/g, '_')}.pdf`);
  };
  
  return (
    <Button
      onClick={handleDownload}
      className="w-full bg-blue-600 hover:bg-blue-700 text-white"
      size="lg"
    >
      <Download className="mr-2 h-4 w-4" />
      Download PDF Book
    </Button>
  );
}

function drawTitlePage(
  doc: jsPDF,
  title: string,
  copyrightText: string,
  pageWidth: number,
  pageHeight: number,
  margin: number,
  fontName?: string,
  fontSize: number = 10 // Not used for title page, but kept for API consistency
) {
  const getFont = (defaultFont: string = 'helvetica') => {
    if (fontName && defaultFont !== 'courier') {
      return fontName;
    }
    return defaultFont;
  };
  
  // Title (fontSize only affects grid letters, not page text)
  doc.setFontSize(32);
  doc.setFont(getFont('helvetica'), 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text(title, pageWidth / 2, pageHeight / 2 - 1, { align: 'center' });
  
  // Subtitle
  doc.setFontSize(18);
  doc.setFont(getFont('helvetica'), 'normal');
  doc.text('Word Search Puzzle Book', pageWidth / 2, pageHeight / 2 + 0.3, { align: 'center' });
  
  // Copyright (if provided)
  if (copyrightText) {
    doc.setFontSize(10);
    doc.setFont(getFont('helvetica'), 'italic');
    const currentYear = new Date().getFullYear();
    doc.text(`© ${currentYear} ${copyrightText}`, pageWidth / 2, pageHeight - 1, { align: 'center' });
  }
}

function drawBelongsToPage(
  doc: jsPDF,
  pageWidth: number,
  pageHeight: number,
  margin: number,
  fontName?: string,
  fontSize: number = 10 // Not used for belongs-to page, but kept for API consistency
) {
  const getFont = (defaultFont: string = 'helvetica') => {
    if (fontName && defaultFont !== 'courier') {
      return fontName;
    }
    return defaultFont;
  };
  
  // Title (fontSize only affects grid letters, not page text)
  doc.setFontSize(24);
  doc.setFont(getFont('helvetica'), 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text('This Book Belongs To', pageWidth / 2, pageHeight / 2 - 1, { align: 'center' });
  
  // Name line
  doc.setFontSize(16);
  doc.setFont(getFont('helvetica'), 'normal');
  const lineY = pageHeight / 2 + 0.5;
  const lineWidth = 4;
  const lineX = (pageWidth - lineWidth) / 2;
  
  // Draw underline
  doc.setLineWidth(0.01);
  doc.setDrawColor(0, 0, 0);
  doc.line(lineX, lineY + 0.15, lineX + lineWidth, lineY + 0.15);
}

function drawPuzzlePage(
  doc: jsPDF,
  puzzle: PuzzleResult & { chapterTitle?: string },
  puzzleNumber: number,
  totalPuzzles: number,
  bookTitle: string,
  pageWidth: number,
  pageHeight: number,
  margin: number,
  pageNum: number,
  fontName?: string,
  fontSize: number = 10 // Font size in points for grid letters
) {
  const getFont = (defaultFont: string = 'helvetica') => {
    if (fontName && defaultFont !== 'courier') {
      return fontName;
    }
    return defaultFont;
  };
  
  const grid = puzzle.grid;
  const gridSize = grid.length;
  
  // Calculate usable width (accounting for margins)
  const usableWidth = pageWidth - margin * 2;
  const contentCenterX = pageWidth / 2;
  
  // Puzzle title - use chapter title if available (fontSize only affects grid letters)
  doc.setFontSize(16);
  doc.setFont(getFont('helvetica'), 'bold');
  doc.setTextColor(0, 0, 0);
  const puzzleTitle = puzzle.chapterTitle 
    ? `Puzzle #${puzzleNumber}: ${puzzle.chapterTitle}`
    : `Puzzle #${puzzleNumber}`;
  
  // Split long titles if needed
  const titleLines = doc.splitTextToSize(puzzleTitle, usableWidth * 0.9);
  let titleY = margin + 0.3;
  titleLines.forEach((line: string) => {
    doc.text(line, contentCenterX, titleY, { align: 'center' });
    titleY += 0.2; // Fixed line spacing
  });
  
  // Instructions - split into multiple lines to prevent bleeding
  doc.setFontSize(9);
  doc.setFont(getFont('helvetica'), 'normal');
  const instructionText = 'Find the words listed below in the grid. Words may be horizontal, vertical, or diagonal.';
  const instructionLines = doc.splitTextToSize(instructionText, usableWidth * 0.85);
  let instructionY = titleY + 0.15;
  instructionLines.forEach((line: string) => {
    doc.text(line, contentCenterX, instructionY, { align: 'center' });
    instructionY += 0.15; // Fixed line spacing
  });
  
  // Update title space based on actual content height
  const actualTitleSpace = instructionY - margin + 0.1;
  
  // Layout Logic - Dependent on dynamic PageWidth/Height
  // Use actual title space calculated above, or fallback to minimum
  const titleSpace = Math.max(actualTitleSpace, 0.8);
  
  // Dynamic word list space - smaller on small pages to maximize grid space
  const pageArea = pageWidth * pageHeight;
  let wordListSpace: number;
  if (pageArea < 45) {
    wordListSpace = 1.0; // Reduced for very small pages
  } else if (pageArea < 60) {
    wordListSpace = 1.2; // Slightly reduced for small-medium pages
  } else {
    wordListSpace = 1.5; // Full space for larger pages
  }
  
  const footerSpace = 0.3;
  const availableHeight = pageHeight - margin * 2 - titleSpace - wordListSpace - footerSpace;
  const availableWidth = usableWidth;
  
  // Calculate cell size based on available space
  // Prioritize using the larger dimension to maximize grid size
  const cellSizeByWidth = availableWidth / gridSize;
  const cellSizeByHeight = availableHeight / gridSize;
  
  // Use the larger cell size to maximize grid, but ensure it fits both dimensions
  let cellSize = Math.min(cellSizeByWidth, cellSizeByHeight);
  
  // Ensure minimum readable size - but be more generous on small pages
  const minCellSize = pageArea < 60 ? 0.12 : 0.1; // Slightly larger minimum for small pages
  const finalCellSize = Math.max(cellSize, minCellSize);
  
  const gridWidth = gridSize * finalCellSize;
  const gridHeight = gridSize * finalCellSize;
  
  // Check scaling if it somehow exceeds bounds
  const scale = Math.min(
    gridWidth > availableWidth ? availableWidth / gridWidth : 1,
    gridHeight > availableHeight ? availableHeight / gridHeight : 1
  );
  
  const scaledCellSize = finalCellSize * scale;
  const scaledGridWidth = gridWidth * scale;
  const scaledGridHeight = gridHeight * scale;
  
  // Center grid in usable area
  const startX = margin + (usableWidth - scaledGridWidth) / 2;
  const startY = margin + titleSpace;
  
  // Draw Grid
  doc.setLineWidth(0.001);
  doc.setDrawColor(0, 0, 0);
  doc.setFont(getFont('courier'), 'normal');
  
  // Use the specified point size, but ensure it fits within the cell
  // Convert cell size from inches to points (1 inch = 72 points)
  // Use 80% of cell height as maximum to leave some padding
  const cellSizeInPoints = scaledCellSize * 72;
  const maxFontSizeForCell = cellSizeInPoints * 0.8; // 80% of cell height for readability
  
  // Use the user's selected font size, but cap it at what fits in the cell
  const gridFontSize = Math.min(fontSize, maxFontSizeForCell);
  // Ensure minimum readable size
  const finalGridFontSize = Math.max(gridFontSize, 4);
  doc.setFontSize(finalGridFontSize);
  doc.setTextColor(0, 0, 0);
  
  for (let i = 0; i < gridSize; i++) {
    for (let j = 0; j < gridSize; j++) {
      const x = startX + j * scaledCellSize;
      const y = startY + i * scaledCellSize;
      
      // Safety check for bounds
      if (x >= margin - 0.1 && x + scaledCellSize <= pageWidth - margin + 0.1) {
        doc.rect(x, y, scaledCellSize, scaledCellSize);
      
      const letter = grid[i][j];
      const textWidth = doc.getTextWidth(letter);
        const textX = x + (scaledCellSize - textWidth) / 2;
        const textY = y + scaledCellSize * 0.7;
        
        doc.text(letter, textX, textY);
      }
    }
  }
  
  // Word List (fontSize only affects grid letters)
  const words = puzzle.placedWords.map(w => w.word);
  // Increased gap between grid and word list
  const wordListStartY = startY + scaledGridHeight + 0.4;
  const maxWordListY = pageHeight - margin - footerSpace - 0.1;
  const remainingSpace = maxWordListY - wordListStartY;
  
  // Increased font sizes for better readability
  doc.setFontSize(12);
  doc.setFont(getFont('helvetica'), 'bold');
  doc.text('Word List:', margin, wordListStartY);
  
  doc.setFont(getFont('helvetica'), 'normal');
  let wordListFontSize = 11;
  const lineSpacing = 0.18;
  
  // Dynamic columns based on page width
  let numColumns = pageWidth > 6 ? 3 : 2; 
  let wordsPerColumn = Math.ceil(words.length / numColumns);
  let estimatedHeight = wordsPerColumn * lineSpacing + 0.2;
  
  if (estimatedHeight > remainingSpace) {
    numColumns += 1; // Try adding a column
    wordsPerColumn = Math.ceil(words.length / numColumns);
    estimatedHeight = wordsPerColumn * lineSpacing + 0.2;
    
    if (estimatedHeight > remainingSpace) {
        // Shrink font as fallback
        const ratio = remainingSpace / estimatedHeight;
        wordListFontSize = Math.max(wordListFontSize * ratio, 8); // Increased minimum from 6 to 8
    }
  }
  
  doc.setFontSize(wordListFontSize);
  const columnWidth = (pageWidth - 2 * margin) / numColumns;
  
  for (let col = 0; col < numColumns; col++) {
    const xPos = margin + col * columnWidth;
    let currentY = wordListStartY + 0.2;
    
    for (let i = 0; i < wordsPerColumn; i++) {
      const idx = col * wordsPerColumn + i;
      if (idx < words.length && currentY < maxWordListY) {
        doc.text(words[idx], xPos, currentY);
        currentY += lineSpacing * 0.9;
      }
    }
  }
  
  // Footer (fontSize only affects grid letters)
  doc.setFontSize(8);
  doc.setFont(getFont('helvetica'), 'normal');
  doc.text(`Page ${pageNum}`, pageWidth / 2, pageHeight - margin + 0.1, { align: 'center' });
}

function drawSolutionsPage(
  doc: jsPDF,
  puzzles: Array<PuzzleResult & { chapterTitle?: string }>,
  puzzlePageNumbers: number[],
  startIndex: number,
  totalPuzzles: number,
  bookTitle: string,
  pageWidth: number,
  pageHeight: number,
  margin: number,
  fontName?: string,
  fontSize: number = 10 // Font size in points for grid letters
) {
  const getFont = (defaultFont: string = 'helvetica') => {
    if (fontName && defaultFont !== 'courier') {
      return fontName;
    }
    return defaultFont;
  };
  
  // Calculate usable dimensions
  const usableWidth = pageWidth - margin * 2;
  const contentCenterX = pageWidth / 2;
  
  // Calculate page area for dynamic sizing
  const pageArea = pageWidth * pageHeight;
  
  // Title (fontSize only affects grid letters)
  doc.setFontSize(18);
  doc.setFont(getFont('helvetica'), 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text('Solutions', contentCenterX, margin + 0.3, { align: 'center' });
  
  const titleSpace = 0.5;
  const footerSpace = 0.4;
  // Dynamic label space - more space for potential multi-line labels on small pages
  const labelSpace = Math.max(0.4, usableWidth * 0.08); // At least 0.4" or 8% of usable width
  const availableWidth = usableWidth;
  const availableHeight = pageHeight - margin * 2 - titleSpace - footerSpace - labelSpace;
  
  const gridSize = puzzles[0]?.grid.length || 15;
  
  // Dynamic grid spacing based on page size - ensure grids don't overlap
  // Reduced spacing slightly to allow larger grids while still preventing overlap
  const minGridSpacing = Math.max(0.15, usableWidth * 0.04); // At least 0.15" or 4% of usable width (reduced)
  const maxGridSpacing = Math.min(0.4, usableWidth * 0.06); // At most 0.4" or 6% of usable width (reduced)
  const gridSpacing = Math.max(minGridSpacing, Math.min(maxGridSpacing, 0.25)); // Reduced default from 0.3
  
  // Calculate single grid width with dynamic spacing (larger grids due to reduced spacing)
  const singleGridWidth = (availableWidth - gridSpacing) / 2;
  
  // Calculate cell size - ensure it fits both grids without overlap
  // Use the smaller of: width constraint or height constraint
  const maxCellSizeByWidth = singleGridWidth / gridSize;
  const maxCellSizeByHeight = availableHeight / gridSize;
  const maxCellSize = Math.min(maxCellSizeByWidth, maxCellSizeByHeight);
  
  // Ensure minimum readable size - be more generous on small pages
  let minCellSize: number;
  if (pageArea < 45) {
    minCellSize = 0.1; // Slightly larger minimum for very small pages
  } else if (pageArea < 60) {
    minCellSize = 0.09; // Medium minimum for small-medium pages
  } else {
    minCellSize = Math.max(0.08, usableWidth * 0.01); // Standard minimum
  }
  
  const cellSize = Math.max(minCellSize, Math.min(maxCellSize, 0.15));
  
  // Recalculate grid dimensions with final cell size
  const gridWidth = gridSize * cellSize;
  const gridHeight = gridSize * cellSize;
  
  // Ensure grids don't exceed available space (with safety margin to prevent overlap)
  // Use 98% of singleGridWidth to ensure no overlap between left and right grids
  const maxSafeGridWidth = singleGridWidth * 0.98;
  const actualGridWidth = Math.min(gridWidth, maxSafeGridWidth);
  const actualGridHeight = Math.min(gridHeight, availableHeight);
  const actualCellSize = actualGridWidth / gridSize;
  
  const startY = margin + titleSpace + labelSpace;
  
  // Calculate consistent font size for ALL labels (same size for all puzzles)
  // This ensures even and odd numbered puzzles have the same font size
  const maxLabelWidth = singleGridWidth * 0.9; // Use 90% of single grid width to prevent overlap
  const consistentLabelFontSize = 10; // Fixed font size for all labels - no variation
  doc.setFontSize(consistentLabelFontSize);
  doc.setFont(getFont('helvetica'), 'bold');
  
  puzzles.forEach((puzzle, index) => {
    const isLeft = index % 2 === 0;
    
    let gridX: number;
    let labelX: number;
    
    if (isLeft) {
        // Left grid: center within left half of usable area
        gridX = margin + (singleGridWidth - actualGridWidth) / 2;
        labelX = margin + singleGridWidth / 2;
    } else {
        // Right grid: center within right half of usable area
        // Ensure no overlap by using actual calculated positions
        gridX = margin + singleGridWidth + gridSpacing + (singleGridWidth - actualGridWidth) / 2;
        labelX = margin + singleGridWidth + gridSpacing + singleGridWidth / 2;
    }
    
    // Center grid vertically in available space
    const gridY = startY + (availableHeight - actualGridHeight) / 2;
    
    const puzzleNum = startIndex + index + 1;
    const origPage = puzzlePageNumbers[index];
    
    // Build label text - truncate if needed but keep font size consistent
    let labelText = puzzle.chapterTitle
      ? `Puzzle #${puzzleNum}: ${puzzle.chapterTitle} (Page ${origPage})`
      : `Puzzle #${puzzleNum} (Page ${origPage})`;
    
    // Check if text fits with consistent font size, truncate if needed (but keep font size the same)
    doc.setFontSize(consistentLabelFontSize);
    let testWidth = doc.getTextWidth(labelText);
    
    // If label is too wide, truncate the chapter title (but keep font size consistent)
    if (testWidth > maxLabelWidth && puzzle.chapterTitle) {
      // Calculate how much we need to truncate
      const baseText = `Puzzle #${puzzleNum}:  (Page ${origPage})`;
      const baseWidth = doc.getTextWidth(baseText);
      const availableWidthForTitle = maxLabelWidth - baseWidth - 10; // Leave some buffer
      
      // Truncate chapter title to fit
      let truncatedTitle = puzzle.chapterTitle;
      let truncatedText = `Puzzle #${puzzleNum}: ${truncatedTitle} (Page ${origPage})`;
      testWidth = doc.getTextWidth(truncatedText);
      
      while (testWidth > maxLabelWidth && truncatedTitle.length > 5) {
        truncatedTitle = truncatedTitle.substring(0, truncatedTitle.length - 1);
        truncatedText = `Puzzle #${puzzleNum}: ${truncatedTitle}... (Page ${origPage})`;
        testWidth = doc.getTextWidth(truncatedText);
      }
      
      labelText = truncatedText;
    }
    
    // Split label into multiple lines if needed (font size stays the same)
    doc.setFontSize(consistentLabelFontSize);
    doc.setFont(getFont('helvetica'), 'bold');
    doc.setTextColor(0, 0, 0);
    const labelLines = doc.splitTextToSize(labelText, maxLabelWidth);
    
    // Position labels above grid with proper spacing
    const labelLineHeight = consistentLabelFontSize * 0.015; // Approximate line height
    const totalLabelHeight = labelLines.length * labelLineHeight;
    let labelY = gridY - 0.15 - totalLabelHeight; // Start above grid with gap
    
    // Draw each line of the label, centered within its grid's half
    labelLines.forEach((line: string, lineIndex: number) => {
      doc.text(line, labelX, labelY, { align: 'center' });
      labelY += labelLineHeight;
    });
    
    // STEP 1: Draw solution lines FIRST (behind the grid)
    puzzle.placedWords.forEach(({ positions }) => {
        if (!positions || positions.length < 2) return;
        const [r1, c1] = positions[0];
        const [r2, c2] = positions[positions.length - 1];
        const x1 = gridX + c1 * actualCellSize + actualCellSize/2;
        const y1 = gridY + r1 * actualCellSize + actualCellSize/2;
        const x2 = gridX + c2 * actualCellSize + actualCellSize/2;
        const y2 = gridY + r2 * actualCellSize + actualCellSize/2;
        
        // Enable transparency (35% opacity)
        let transparentGState;
        try {
          transparentGState = (doc as any).createGState({ CA: 0.35, opacity: 0.35 });
          doc.setGState(transparentGState);
        } catch (err) {
          try {
            transparentGState = (doc as any).createGState({ opacity: 0.35 });
            doc.setGState(transparentGState);
          } catch (err2) {
            console.warn('Could not set transparency, drawing opaque line');
          }
        }
        
        // Draw black outline first
        doc.setDrawColor(0, 0, 0);
        doc.setLineWidth(actualCellSize * 0.95);
        doc.setLineCap('round');
        doc.line(x1, y1, x2, y2);
        
        // Draw red line
        doc.setDrawColor(255, 0, 0);
        doc.setLineWidth(actualCellSize * 0.85);
        doc.setLineCap('round');
        doc.line(x1, y1, x2, y2);
        
        // Reset transparency
        try {
          const opaqueGState = (doc as any).createGState({ CA: 1.0, opacity: 1.0 });
          doc.setGState(opaqueGState);
        } catch (err) {
          // If reset fails, that's okay
        }
    });
    
    // STEP 2: Draw grid and letters ON TOP
    doc.setLineWidth(0.002);
    doc.setDrawColor(0,0,0);
    doc.setFont(getFont('courier'), 'normal');
    // Use the specified point size, but ensure it fits within the cell
    // Convert cell size from inches to points (1 inch = 72 points)
    // Use 75% of cell height as maximum (slightly smaller font for solution grids)
    const cellSizeInPoints = actualCellSize * 72;
    const maxFontSizeForCell = cellSizeInPoints * 0.75; // 75% of cell height (reduced from 90%)
    
    // Use the user's selected font size, but make it slightly smaller for solution grids
    // Apply 0.85 multiplier to make solution fonts slightly smaller than puzzle grids
    const adjustedFontSize = fontSize * 0.85;
    
    let solutionGridFontSize: number;
    if (adjustedFontSize <= maxFontSizeForCell) {
      // Adjusted size fits, use it
      solutionGridFontSize = adjustedFontSize;
    } else {
      // Adjusted size is too large, use max that fits
      solutionGridFontSize = maxFontSizeForCell;
    }
    
    // Ensure minimum readable size
    const minFontSize = Math.max(4, maxFontSizeForCell * 0.4); // At least 40% of max, or 4pt
    const finalSolutionFontSize = Math.max(solutionGridFontSize, minFontSize);
    doc.setFontSize(finalSolutionFontSize);
    doc.setTextColor(0,0,0);
    
    for(let i=0; i<gridSize; i++) {
        for(let j=0; j<gridSize; j++) {
            const letter = puzzle.grid[i][j];
            if(letter && letter.trim()) {
               const cellX = gridX + j * actualCellSize;
               const cellY = gridY + i * actualCellSize;
               doc.rect(cellX, cellY, actualCellSize, actualCellSize);
               const w = doc.getTextWidth(letter);
               doc.text(letter, cellX + (actualCellSize - w) / 2, cellY + actualCellSize * 0.72); 
      }
    }
  }
  });
  
  // Footer - centered (fontSize only affects grid letters)
  doc.setFontSize(9);
  doc.setFont(getFont('helvetica'), 'normal');
  doc.text(`Page ${doc.internal.pages.length - 1}`, contentCenterX, pageHeight - margin + 0.15, { align: 'center' });
}
