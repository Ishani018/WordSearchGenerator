'use client';

import { jsPDF } from 'jspdf';
import { PuzzleResult } from '@/lib/puzzle-generator';
import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { loadFontForPDF, getFontById } from '@/lib/fonts';

interface PDFDownloadButtonProps {
  puzzles: Array<PuzzleResult & { chapterTitle?: string }>;
  title: string;
  includeTitlePage?: boolean;
  includeBelongsToPage?: boolean;
  copyrightText?: string;
  answerKeyStyle?: 'boxes' | 'strikethrough';
  fontId?: string;
  fontSize?: number; // Base font size multiplier (1.0 = normal, 1.2 = 20% larger, etc.)
}

export default function PDFDownloadButton({
  puzzles,
  title,
  includeTitlePage = false,
  includeBelongsToPage = false,
  copyrightText = '',
  answerKeyStyle = 'boxes',
  fontId,
  fontSize = 1.0
}: PDFDownloadButtonProps) {
  const generatePDF = async () => {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'in',
      format: 'letter'
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
    
    const pageWidth = 8.5;
    const pageHeight = 11;
    const margin = 0.5;
    let currentPage = 1;
    
    // FRONT MATTER: Title Page
    if (includeTitlePage) {
      drawTitlePage(doc, title, copyrightText, pageWidth, pageHeight, fontName, fontSize);
      currentPage++;
    }
    
    // FRONT MATTER: "This Book Belongs To" Page
    if (includeBelongsToPage) {
      if (currentPage > 1) {
        doc.addPage();
      }
      drawBelongsToPage(doc, pageWidth, pageHeight, fontName);
      currentPage++;
      currentPage++;
    }
    
    // Track puzzle page numbers for solutions reference
    const puzzlePageNumbers: number[] = [];
    
    // SECTION 1: All puzzle pages (unsolved)
    puzzles.forEach((puzzle, index) => {
      if (currentPage > 1 || index > 0) {
        doc.addPage();
      }
      const pageNum = doc.internal.pages.length;
      puzzlePageNumbers.push(pageNum);
      drawPuzzlePage(doc, puzzle, index + 1, puzzles.length, title, pageWidth, pageHeight, margin, pageNum, fontName, fontSize);
      currentPage++;
    });
    
    // SECTION 2: Solutions section - Always start on a new page
    // Group 2 grids per page
    const puzzlesPerPage = 2;
    const totalSolutionPages = Math.ceil(puzzles.length / puzzlesPerPage);
    
    for (let pageIndex = 0; pageIndex < totalSolutionPages; pageIndex++) {
      // Always add a new page for each solution page (including the first one)
      doc.addPage();
      currentPage++;
      
      const startIndex = pageIndex * puzzlesPerPage;
      const endIndex = Math.min(startIndex + puzzlesPerPage, puzzles.length);
      const puzzlesOnPage = puzzles.slice(startIndex, endIndex);
      const pageNumbersOnPage = puzzlePageNumbers.slice(startIndex, endIndex);
      
      drawSolutionsPage(doc, puzzlesOnPage, pageNumbersOnPage, startIndex, puzzles.length, title, pageWidth, pageHeight, margin, answerKeyStyle, fontName, fontSize);
    }
    
    // Download
    doc.save(`${title.replace(/\s+/g, '_')}.pdf`);
  };
  
  return (
    <Button
      onClick={generatePDF}
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
  fontName?: string,
  fontSize: number = 1.0
) {
  const getFont = (defaultFont: string = 'helvetica') => {
    if (fontName && defaultFont !== 'courier') {
      return fontName;
    }
    return defaultFont;
  };
  const applyFontSize = (baseSize: number) => baseSize * fontSize;
  
  // Title
  doc.setFontSize(applyFontSize(32));
  doc.setFont(getFont('helvetica'), 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text(title, pageWidth / 2, pageHeight / 2 - 1, { align: 'center' });
  
  // Subtitle
  doc.setFontSize(applyFontSize(18));
  doc.setFont(getFont('helvetica'), 'normal');
  doc.text('Word Search Puzzle Book', pageWidth / 2, pageHeight / 2 + 0.3, { align: 'center' });
  
  // Copyright (if provided)
  if (copyrightText) {
    doc.setFontSize(applyFontSize(10));
    doc.setFont(getFont('helvetica'), 'italic');
    const currentYear = new Date().getFullYear();
    doc.text(`© ${currentYear} ${copyrightText}`, pageWidth / 2, pageHeight - 1, { align: 'center' });
  }
}

function drawBelongsToPage(
  doc: jsPDF,
  pageWidth: number,
  pageHeight: number,
  fontName?: string,
  fontSize: number = 1.0
) {
  const getFont = (defaultFont: string = 'helvetica') => {
    // Only override if we have a custom font loaded (don't override courier for grid alignment)
    if (fontName && defaultFont !== 'courier') {
      return fontName;
    }
    return defaultFont;
  };
  const applyFontSize = (baseSize: number) => baseSize * fontSize;
  
  // Title
  doc.setFontSize(applyFontSize(24));
  doc.setFont(getFont('helvetica'), 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text('This Book Belongs To', pageWidth / 2, pageHeight / 2 - 1, { align: 'center' });
  
  // Name line
  doc.setFontSize(applyFontSize(16));
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
  fontSize: number = 1.0
) {
  const getFont = (defaultFont: string = 'helvetica') => {
    // Only override if we have a custom font loaded (don't override courier for grid alignment)
    if (fontName && defaultFont !== 'courier') {
      return fontName;
    }
    return defaultFont;
  };
  const applyFontSize = (baseSize: number) => baseSize * fontSize;
  
  const grid = puzzle.grid;
  const gridSize = grid.length;
  
  // Puzzle title - use chapter title if available
  doc.setFontSize(applyFontSize(16));
  doc.setFont(getFont('helvetica'), 'bold');
  doc.setTextColor(0, 0, 0);
  const puzzleTitle = puzzle.chapterTitle 
    ? `Puzzle #${puzzleNumber}: ${puzzle.chapterTitle}`
    : `Puzzle #${puzzleNumber}`;
  doc.text(puzzleTitle, pageWidth / 2, margin + 0.3, { align: 'center' });
  
  // Instructions
  doc.setFontSize(applyFontSize(9));
  doc.setFont(getFont('helvetica'), 'normal');
  doc.text(
    'Find the words listed below in the grid. Words may be horizontal, vertical, or diagonal.',
    pageWidth / 2,
    margin + 0.5,
    { align: 'center' }
  );
  
  // Calculate available space
  const titleSpace = 0.8;
  const wordListSpace = 1.5;
  const footerSpace = 0.3;
  const availableHeight = pageHeight - margin * 2 - titleSpace - wordListSpace - footerSpace;
  const availableWidth = pageWidth - margin * 2;
  
  // Calculate cell size
  const cellSize = Math.min(
    availableWidth / gridSize,
    availableHeight / gridSize
  );
  
  const gridWidth = gridSize * cellSize;
  const gridHeight = gridSize * cellSize;
  const startX = (pageWidth - gridWidth) / 2;
  const startY = margin + titleSpace;
  
  // Draw grid with thin borders
  doc.setLineWidth(0.001);
  doc.setDrawColor(0, 0, 0);
  doc.setFont(getFont('courier'), 'normal');
  
  const gridFontSize = Math.max(Math.min(cellSize * 11 * fontSize, 12), 7);
  doc.setFontSize(gridFontSize);
  doc.setTextColor(0, 0, 0);
  
  for (let i = 0; i < gridSize; i++) {
    for (let j = 0; j < gridSize; j++) {
      const x = startX + j * cellSize;
      const y = startY + i * cellSize;
      
      doc.rect(x, y, cellSize, cellSize);
      
      const letter = grid[i][j];
      const textWidth = doc.getTextWidth(letter);
      const textX = x + (cellSize - textWidth) / 2;
      const textY = y + cellSize * 0.7;
      
      doc.text(letter, textX, textY);
    }
  }
  
  // Word list below the grid
  const words = puzzle.placedWords.map(w => w.word);
  const wordListStartY = startY + gridHeight + 0.2;
  
  doc.setFontSize(applyFontSize(10));
  doc.setFont(getFont('helvetica'), 'bold');
  doc.text('Word List:', margin, wordListStartY);

  doc.setFont(getFont('helvetica'), 'normal');
  doc.setFontSize(applyFontSize(9));
  
  const wordsPerColumn = Math.ceil(words.length / 3);
  const columnWidth = (pageWidth - 2 * margin) / 3;
  const lineSpacing = 0.18;
  
  for (let col = 0; col < 3; col++) {
    const xPos = margin + col * columnWidth;
    let currentY = wordListStartY + 0.2;
    
    for (let i = 0; i < wordsPerColumn; i++) {
      const idx = col * wordsPerColumn + i;
      if (idx < words.length) {
        doc.text(words[idx], xPos, currentY);
        currentY += lineSpacing;
      }
    }
  }
  
  // Page number footer (dynamic)
  doc.setFontSize(applyFontSize(8));
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
  answerKeyStyle: 'boxes' | 'strikethrough' = 'boxes',
  fontName?: string,
  fontSize: number = 1.0
) {
  const getFont = (defaultFont: string = 'helvetica') => {
    // Only override if we have a custom font loaded (don't override courier for grid alignment)
    if (fontName && defaultFont !== 'courier') {
      return fontName;
    }
    return defaultFont;
  };
  const applyFontSize = (baseSize: number) => baseSize * fontSize;
  const gridSize = puzzles[0]?.grid.length || 15;
  
  // Page title at the top
  doc.setFontSize(applyFontSize(18));
  doc.setFont(getFont('helvetica'), 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text('Solutions', pageWidth / 2, margin + 0.3, { align: 'center' });
  
  // Calculate available space with proper margins
  const titleSpace = 0.5; // Space for "Solutions" title at top
  const footerSpace = 0.4; // Space for page number
  const labelSpace = 0.3; // Space for puzzle labels above grids
  const availableWidth = pageWidth - 2 * margin;
  const availableHeight = pageHeight - margin * 2 - titleSpace - footerSpace - labelSpace;
  
  // Layout: 2 grids side by side with proper spacing
  const gridSpacing = 0.5; // Space between the two grids
  const singleGridWidth = (availableWidth - gridSpacing) / 2;
  
  // Calculate cell size to fit both grids properly (ensure minimum readable size)
  const maxCellSize = Math.min(
    singleGridWidth / gridSize,
    availableHeight / gridSize
  );
  const cellSize = Math.max(maxCellSize, 0.15); // Minimum 0.15 inches per cell
  
  const gridWidth = gridSize * cellSize;
  const gridHeight = gridSize * cellSize;
  
  // Starting Y position (after title and label space)
  const startY = margin + titleSpace + labelSpace;
  
  // Draw each puzzle side by side (2 per page)
  puzzles.forEach((puzzle, index) => {
    const isLeft = index % 2 === 0;
    
    // Calculate X position: left grid or right grid
    let gridX: number;
    let labelX: number;
    
    if (isLeft) {
      // Left grid: center within left half
      gridX = margin + (singleGridWidth - gridWidth) / 2;
      labelX = margin + singleGridWidth / 2;
    } else {
      // Right grid: center within right half
      gridX = margin + singleGridWidth + gridSpacing + (singleGridWidth - gridWidth) / 2;
      labelX = margin + singleGridWidth + gridSpacing + singleGridWidth / 2;
    }
    
    // Center grid vertically in available space
    const gridY = startY + (availableHeight - gridHeight) / 2;
    
    // Puzzle number and page reference label (right above grid)
    doc.setFontSize(10);
    doc.setFont(getFont('helvetica'), 'bold');
    doc.setTextColor(0, 0, 0);
    const puzzleNum = startIndex + index + 1;
    const originalPageNum = puzzlePageNumbers[index];
    const label = puzzle.chapterTitle 
      ? `Puzzle #${puzzleNum}: ${puzzle.chapterTitle.substring(0, 25)} (Page ${originalPageNum})`
      : `Puzzle #${puzzleNum} (Page ${originalPageNum})`;
    
    // Position label directly above its grid (centered above the grid)
    const labelY = gridY - 0.15; // Small gap above grid
    doc.text(label, labelX, labelY, { align: 'center' });
    
    // Draw grid with proper borders
    doc.setLineWidth(0.002);
    doc.setDrawColor(0, 0, 0);
    doc.setFont(getFont('courier'), 'normal');
    
    // Calculate font size based on cell size (ensure readability)
    const fontSize = Math.max(Math.min(cellSize * 14, 11), 7);
    doc.setFontSize(fontSize);
    doc.setTextColor(0, 0, 0);
    
    // Draw grid cells
    for (let i = 0; i < gridSize; i++) {
      for (let j = 0; j < gridSize; j++) {
        const x = gridX + j * cellSize;
        const y = gridY + i * cellSize;
        
        // Draw cell border
        doc.rect(x, y, cellSize, cellSize);
        
        // Draw letter centered in cell
        const letter = puzzle.grid[i][j] || ' ';
        if (letter && letter.trim()) {
          const textWidth = doc.getTextWidth(letter);
          const textX = x + (cellSize - textWidth) / 2;
          const textY = y + cellSize * 0.72; // Slightly below center for better alignment
          
          doc.text(letter, textX, textY);
        }
      }
    }
    
    // Draw answer markings based on style (in red)
    doc.setDrawColor(255, 0, 0); // Red for all styles
    
    puzzle.placedWords.forEach(({ positions }) => {
      if (positions.length < 2) return;
      
      if (answerKeyStyle === 'boxes') {
        // Draw boxes around each word
        const minRow = Math.min(...positions.map(p => p[0]));
        const maxRow = Math.max(...positions.map(p => p[0]));
        const minCol = Math.min(...positions.map(p => p[1]));
        const maxCol = Math.max(...positions.map(p => p[1]));
        
        const x = gridX + minCol * cellSize;
        const y = gridY + minRow * cellSize;
        const width = (maxCol - minCol + 1) * cellSize;
        const height = (maxRow - minRow + 1) * cellSize;
        
        // Draw rectangle outline in red (no fill)
        doc.setLineWidth(0.005);
        doc.rect(x, y, width, height, 'S'); // 'S' = stroke only
      } else if (answerKeyStyle === 'strikethrough') {
        // Draw strikethrough lines through each word
        const [startRow, startCol] = positions[0];
        const [endRow, endCol] = positions[positions.length - 1];
        
        const startX = gridX + startCol * cellSize + cellSize / 2;
        const startY = gridY + startRow * cellSize + cellSize / 2;
        const endX = gridX + endCol * cellSize + cellSize / 2;
        const endY = gridY + endRow * cellSize + cellSize / 2;
        
        // Draw line through the word in red
        doc.setLineWidth(0.008);
        doc.line(startX, startY, endX, endY);
      }
    });
  });
  
  // Page number footer
  doc.setFontSize(applyFontSize(9));
  doc.setFont(getFont('helvetica'), 'normal');
  doc.setTextColor(0, 0, 0);
  const pageNum = doc.internal.pages.length - 1;
  doc.text(`Page ${pageNum}`, pageWidth / 2, pageHeight - margin + 0.15, { align: 'center' });
}
