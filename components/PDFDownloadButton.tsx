'use client';

import { jsPDF } from 'jspdf';
import { PuzzleResult } from '@/lib/puzzle-generator';
import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PDFDownloadButtonProps {
  puzzles: Array<PuzzleResult & { chapterTitle?: string }>;
  title: string;
}

export default function PDFDownloadButton({
  puzzles,
  title
}: PDFDownloadButtonProps) {
  const generatePDF = () => {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'in',
      format: 'letter'
    });
    
    const pageWidth = 8.5;
    const pageHeight = 11;
    const margin = 0.5;
    
    // SECTION 1: All puzzle pages (unsolved)
    puzzles.forEach((puzzle, index) => {
      if (index > 0) {
        doc.addPage();
      }
      drawPuzzlePage(doc, puzzle, index + 1, puzzles.length, title, pageWidth, pageHeight, margin);
    });
    
    // SECTION 2: Answer Keys Title Page
    doc.addPage();
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0); // Pure black
    doc.text('Answer Keys', pageWidth / 2, pageHeight / 2, { align: 'center' });
    
    // SECTION 3: All answer key pages
    puzzles.forEach((puzzle, index) => {
      doc.addPage();
      drawAnswerKeyPage(doc, puzzle, index + 1, puzzles.length, title, pageWidth, pageHeight, margin);
    });
    
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

function drawPuzzlePage(
  doc: jsPDF,
  puzzle: PuzzleResult & { chapterTitle?: string },
  puzzleNumber: number,
  totalPuzzles: number,
  bookTitle: string,
  pageWidth: number,
  pageHeight: number,
  margin: number
) {
  const grid = puzzle.grid;
  const gridSize = grid.length;
  
  // Puzzle title - use chapter title if available
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0); // Pure black
  const puzzleTitle = puzzle.chapterTitle 
    ? `Puzzle #${puzzleNumber}: ${puzzle.chapterTitle}`
    : `Puzzle #${puzzleNumber}`;
  doc.text(puzzleTitle, pageWidth / 2, margin + 0.3, { align: 'center' });
  
  // Instructions
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
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
  
  // Draw grid with thin borders - ink saver
  doc.setLineWidth(0.001); // Very thin borders
  doc.setDrawColor(0, 0, 0); // Pure black
  doc.setFont('courier', 'normal'); // Monospace for perfect alignment
  
  // Calculate font size based on cell size
  const fontSize = Math.max(Math.min(cellSize * 11, 12), 7);
  doc.setFontSize(fontSize);
  doc.setTextColor(0, 0, 0); // Pure black
  
  for (let i = 0; i < gridSize; i++) {
    for (let j = 0; j < gridSize; j++) {
      const x = startX + j * cellSize;
      const y = startY + i * cellSize;
      
      // Draw cell border (thin)
      doc.rect(x, y, cellSize, cellSize);
      
      // Draw letter centered
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
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('Word List:', margin, wordListStartY);
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  
  // Arrange words in columns to fit
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
  
  // Page number footer
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  const pageNum = doc.internal.pages.length - 1;
  doc.text(`Page ${pageNum}`, pageWidth / 2, pageHeight - margin + 0.1, { align: 'center' });
}

function drawAnswerKeyPage(
  doc: jsPDF,
  puzzle: PuzzleResult & { chapterTitle?: string },
  puzzleNumber: number,
  totalPuzzles: number,
  bookTitle: string,
  pageWidth: number,
  pageHeight: number,
  margin: number
) {
  const grid = puzzle.grid;
  const gridSize = grid.length;
  
  // Title - use chapter title if available
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0); // Pure black
  const answerTitle = puzzle.chapterTitle
    ? `Puzzle #${puzzleNumber}: ${puzzle.chapterTitle} - Answer Key`
    : `Puzzle #${puzzleNumber} - Answer Key`;
  doc.text(answerTitle, pageWidth / 2, margin + 0.3, { align: 'center' });
  
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
  doc.setDrawColor(0, 0, 0); // Pure black
  doc.setFont('courier', 'normal'); // Monospace
  
  const fontSize = Math.max(Math.min(cellSize * 11, 12), 7);
  doc.setFontSize(fontSize);
  doc.setTextColor(0, 0, 0); // Pure black
  
  for (let i = 0; i < gridSize; i++) {
    for (let j = 0; j < gridSize; j++) {
      const x = startX + j * cellSize;
      const y = startY + i * cellSize;
      
      // Draw cell border
      doc.rect(x, y, cellSize, cellSize);
      
      // Draw letter
      const letter = grid[i][j];
      const textWidth = doc.getTextWidth(letter);
      const textX = x + (cellSize - textWidth) / 2;
      const textY = y + cellSize * 0.7;
      
      doc.text(letter, textX, textY);
    }
  }
  
  // Draw answer markings - COLORED HIGHLIGHTS
  puzzle.placedWords.forEach(({ positions }, wordIndex) => {
    if (positions.length < 2) return;
    
    // Use different colors for variety (cycling through a palette)
    const colors = [
      [255, 255, 0],   // Yellow
      [173, 216, 230], // Light Blue
      [144, 238, 144], // Light Green
      [255, 182, 193], // Light Pink
      [221, 160, 221], // Plum
    ];
    const color = colors[wordIndex % colors.length];
    
    // Draw filled rectangle for each word
    const minRow = Math.min(...positions.map(p => p[0]));
    const maxRow = Math.max(...positions.map(p => p[0]));
    const minCol = Math.min(...positions.map(p => p[1]));
    const maxCol = Math.max(...positions.map(p => p[1]));
    
    const x = startX + minCol * cellSize;
    const y = startY + minRow * cellSize;
    const width = (maxCol - minCol + 1) * cellSize;
    const height = (maxRow - minRow + 1) * cellSize;
    
    // Draw filled rectangle with color
    doc.setFillColor(color[0], color[1], color[2]);
    doc.setDrawColor(color[0], color[1], color[2]);
    doc.setLineWidth(0.002);
    doc.rect(x, y, width, height, 'FD'); // 'FD' = fill and draw
  });
  
  // Word list below the grid
  const words = puzzle.placedWords.map(w => w.word);
  const wordListStartY = startY + gridHeight + 0.2;
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('Word List:', margin, wordListStartY);
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  
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
  
  // Page number footer
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  const pageNum = doc.internal.pages.length - 1;
  doc.text(`Page ${pageNum}`, pageWidth / 2, pageHeight - margin + 0.1, { align: 'center' });
}
