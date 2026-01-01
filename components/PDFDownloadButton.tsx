'use client';

import { jsPDF } from 'jspdf';
import { WordPosition } from '@/lib/puzzle-generator';
import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PDFDownloadButtonProps {
  grid: string[][];
  placedWords: WordPosition[];
  title: string;
  answerStyle?: 'rectangles' | 'lines' | 'highlighting';
}

export default function PDFDownloadButton({
  grid,
  placedWords,
  title,
  answerStyle = 'rectangles'
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
    const gridSize = grid.length;
    
    // Page 1: Puzzle
    drawPuzzlePage(doc, grid, placedWords, title, pageWidth, pageHeight, margin, gridSize);
    
    // Page 2: Answer Key
    doc.addPage();
    drawAnswerKeyPage(doc, grid, placedWords, title, pageWidth, pageHeight, margin, gridSize, answerStyle);
    
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
      Download PDF
    </Button>
  );
}

function drawPuzzlePage(
  doc: jsPDF,
  grid: string[][],
  placedWords: WordPosition[],
  title: string,
  pageWidth: number,
  pageHeight: number,
  margin: number,
  gridSize: number
) {
  // Title at top
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text(title, pageWidth / 2, margin + 0.3, { align: 'center' });
  
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
  const titleSpace = 0.8; // Title + instructions
  const wordListSpace = 1.5; // Space for word list at bottom
  const availableHeight = pageHeight - margin * 2 - titleSpace - wordListSpace;
  const availableWidth = pageWidth - margin * 2;
  
  // Calculate cell size to fit both width and height
  const cellSize = Math.min(
    availableWidth / gridSize,
    availableHeight / gridSize
  );
  
  const gridWidth = gridSize * cellSize;
  const gridHeight = gridSize * cellSize;
  const startX = (pageWidth - gridWidth) / 2;
  const startY = margin + titleSpace;
  
  // Draw grid with thin borders
  doc.setLineWidth(0.002); // Very thin borders
  doc.setDrawColor(0, 0, 0);
  doc.setFont('helvetica', 'normal');
  
  // Calculate font size based on cell size
  const fontSize = Math.max(Math.min(cellSize * 12, 14), 8);
  doc.setFontSize(fontSize);
  
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
      const textY = y + cellSize * 0.7; // Vertically centered
      
      doc.text(letter, textX, textY);
    }
  }
  
  // Word list below the grid
  const words = placedWords.map(w => w.word);
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
}

function drawAnswerKeyPage(
  doc: jsPDF,
  grid: string[][],
  placedWords: WordPosition[],
  title: string,
  pageWidth: number,
  pageHeight: number,
  margin: number,
  gridSize: number,
  answerStyle: string
) {
  // Title at top
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text(`${title} - Answer Key`, pageWidth / 2, margin + 0.3, { align: 'center' });
  
  // Instructions
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(
    'Answer Key: Words are marked in the grid below.',
    pageWidth / 2,
    margin + 0.5,
    { align: 'center' }
  );
  
  // Calculate available space
  const titleSpace = 0.8;
  const wordListSpace = 1.5;
  const availableHeight = pageHeight - margin * 2 - titleSpace - wordListSpace;
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
  doc.setLineWidth(0.002);
  doc.setDrawColor(0, 0, 0);
  doc.setFont('helvetica', 'normal');
  
  const fontSize = Math.max(Math.min(cellSize * 12, 14), 8);
  doc.setFontSize(fontSize);
  
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
  
  // Draw answer markings
  if (answerStyle === 'rectangles') {
    doc.setDrawColor(255, 0, 0); // Red
    doc.setLineWidth(0.008); // Thin but visible
    placedWords.forEach(({ positions }) => {
      if (positions.length < 2) return;
      
      const minRow = Math.min(...positions.map(p => p[0]));
      const maxRow = Math.max(...positions.map(p => p[0]));
      const minCol = Math.min(...positions.map(p => p[1]));
      const maxCol = Math.max(...positions.map(p => p[1]));
      
      const x = startX + minCol * cellSize;
      const y = startY + minRow * cellSize;
      const width = (maxCol - minCol + 1) * cellSize;
      const height = (maxRow - minRow + 1) * cellSize;
      
      doc.rect(x, y, width, height);
    });
  } else if (answerStyle === 'lines') {
    doc.setDrawColor(255, 0, 0);
    doc.setLineWidth(0.01);
    placedWords.forEach(({ positions }) => {
      for (let i = 0; i < positions.length - 1; i++) {
        const [r1, c1] = positions[i];
        const [r2, c2] = positions[i + 1];
        
        const x1 = startX + c1 * cellSize + cellSize / 2;
        const y1 = startY + r1 * cellSize + cellSize / 2;
        const x2 = startX + c2 * cellSize + cellSize / 2;
        const y2 = startY + r2 * cellSize + cellSize / 2;
        
        doc.line(x1, y1, x2, y2);
      }
    });
  } else if (answerStyle === 'highlighting') {
    doc.setFillColor(255, 255, 200); // Light yellow
    placedWords.forEach(({ positions }) => {
      positions.forEach(([r, c]) => {
        const x = startX + c * cellSize;
        const y = startY + r * cellSize;
        doc.rect(x, y, cellSize, cellSize, 'F');
      });
    });
  }
  
  // Word list below the grid
  const words = placedWords.map(w => w.word);
  const wordListStartY = startY + gridHeight + 0.2;
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setDrawColor(0, 0, 0);
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
}
