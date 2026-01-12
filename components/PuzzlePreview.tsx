'use client';

import { motion } from 'framer-motion';
import { WordPosition } from '@/lib/puzzle-generator';
import { useState, useMemo, useRef, useCallback } from 'react';
import PNGDownloadButton from './PNGDownloadButton';
import { Eye, EyeOff } from 'lucide-react';

interface PuzzlePreviewProps {
  grid: string[][];
  placedWords: WordPosition[];
  title?: string;
}

export default function PuzzlePreview({ grid, placedWords, title = 'Word Search Puzzle' }: PuzzlePreviewProps) {
  const [hoveredWord, setHoveredWord] = useState<string | null>(null);
  const [showSolution, setShowSolution] = useState(false);
  const [selectedCells, setSelectedCells] = useState<Set<string>>(new Set());
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectionStart, setSelectionStart] = useState<[number, number] | null>(null);
  const [wordListFontSize, setWordListFontSize] = useState(14);
  const [foundWords, setFoundWords] = useState<Set<string>>(new Set()); // Track found/valid words
  const [invalidSelection, setInvalidSelection] = useState<Set<string>>(new Set()); // Track invalid selections
  const gridRef = useRef<HTMLDivElement>(null);
  
  const wordPositionMap = useMemo(() => {
    const map = new Map<string, Set<string>>();
    placedWords.forEach(({ word, positions }) => {
      const key = `${word}`;
      const positionSet = new Set<string>();
      positions.forEach(([r, c]) => {
        positionSet.add(`${r},${c}`);
      });
      map.set(key, positionSet);
    });
    return map;
  }, [placedWords]);

  const allSolutionPositions = useMemo(() => {
    const positions = new Set<string>();
    placedWords.forEach(({ positions: wordPositions }) => {
      wordPositions.forEach(([r, c]) => {
        positions.add(`${r},${c}`);
      });
    });
    return positions;
  }, [placedWords]);

  const isCellHighlighted = (row: number, col: number): boolean => {
    if (showSolution) return allSolutionPositions.has(`${row},${col}`);
    const cellKey = `${row},${col}`;
    if (invalidSelection.has(cellKey)) return true; // Invalid selection (red)
    if (selectedCells.size > 0) return selectedCells.has(cellKey);
    // Check if cell is part of any found word
    for (const foundWord of foundWords) {
      const positionSet = wordPositionMap.get(foundWord);
      if (positionSet && positionSet.has(cellKey)) return true;
    }
    if (!hoveredWord) return false;
    const positionSet = wordPositionMap.get(hoveredWord);
    return positionSet ? positionSet.has(cellKey) : false;
  };

  const findWordFromSelection = useCallback((cells: Set<string>): string | null => {
    if (cells.size === 0) return null;
    for (const { word, positions } of placedWords) {
      const wordCells = new Set(positions.map(([r, c]) => `${r},${c}`));
      if (cells.size === wordCells.size) {
        let matches = true;
        for (const cell of cells) {
          if (!wordCells.has(cell)) { matches = false; break; }
        }
        if (matches) return word;
      }
    }
    return null;
  }, [placedWords]);

  const handleMouseDown = useCallback((row: number, col: number) => {
    if (showSolution) return;
    setIsSelecting(true);
    setSelectionStart([row, col]);
    setSelectedCells(new Set([`${row},${col}`]));
    setInvalidSelection(new Set()); // Clear any previous invalid selection
  }, [showSolution]);

  const handleMouseMove = useCallback((row: number, col: number) => {
    if (!isSelecting || !selectionStart || showSolution) return;
    const [startRow, startCol] = selectionStart;
    const selected = new Set<string>();
    const rowDiff = row - startRow;
    const colDiff = col - startCol;
    const rowStep = rowDiff === 0 ? 0 : (rowDiff > 0 ? 1 : -1);
    const colStep = colDiff === 0 ? 0 : (colDiff > 0 ? 1 : -1);
    
    if (rowStep !== 0 && colStep !== 0 && Math.abs(rowDiff) !== Math.abs(colDiff)) {
      selected.add(`${startRow},${startCol}`);
    } else {
      const steps = Math.max(Math.abs(rowDiff), Math.abs(colDiff)) + 1;
      for (let i = 0; i < steps; i++) {
        const r = startRow + i * rowStep;
        const c = startCol + i * colStep;
        if (r >= 0 && r < grid.length && c >= 0 && c < grid[0].length) {
          selected.add(`${r},${c}`);
        }
      }
    }
    setSelectedCells(selected);
  }, [isSelecting, selectionStart, showSolution, grid]);

  const handleMouseUp = useCallback(() => {
    if (!isSelecting) return;
    setIsSelecting(false);
    const foundWord = findWordFromSelection(selectedCells);
    if (foundWord) {
      // Valid word found - add to found words and keep it green
      setFoundWords(prev => new Set([...prev, foundWord]));
      setSelectedCells(new Set());
      setHoveredWord(null);
    } else if (selectedCells.size > 0) {
      // Invalid selection - show red, then clear after 2 seconds
      setInvalidSelection(new Set(selectedCells));
      setSelectedCells(new Set());
      setTimeout(() => {
        setInvalidSelection(new Set());
      }, 2000);
    }
    setSelectionStart(null);
  }, [isSelecting, selectedCells, findWordFromSelection]);

  const handleMouseLeave = useCallback(() => {
    if (isSelecting) {
      setIsSelecting(false);
      setSelectedCells(new Set());
      setSelectionStart(null);
    }
  }, [isSelecting]);

  const gridSize = grid.length;
  const maxWidth = 600;
  const cellSize = Math.min(maxWidth / gridSize, 36); // Larger cells for cleaner look
  const filename = showSolution ? `${title}_Solution` : `${title}_Puzzle`;

  // Get hovered word positions for highlighter effect
  const hoveredPositions = useMemo(() => {
    if (!hoveredWord || showSolution) return new Set<string>();
    const positionSet = wordPositionMap.get(hoveredWord);
    return positionSet || new Set<string>();
  }, [hoveredWord, showSolution, wordPositionMap]);

  return (
    <div className="flex flex-col h-full">
      
      {/* Title and Controls */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-foreground tracking-tight">
          {title}
        </h2>
        
        <button
          onClick={() => {
            setShowSolution(!showSolution);
            setSelectedCells(new Set());
            setHoveredWord(null);
            if (!showSolution) {
              // When hiding solution, clear found words
              setFoundWords(new Set());
              setInvalidSelection(new Set());
            }
          }}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2 hover:scale-105 active:scale-95 border ${
            showSolution
              ? 'bg-primary text-primary-foreground border-primary shadow-md'
              : 'bg-secondary text-secondary-foreground hover:bg-secondary/80 border-transparent'
          }`}
        >
          {showSolution ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          {showSolution ? 'Hide Solution' : 'Show Solution'}
        </button>
      </div>
      
      {/* Content Container - Paper on Desk */}
      <div id="puzzle-preview-container" className="flex-1 flex gap-6 overflow-hidden min-h-0">
        
        {/* Grid Area - Physical Paper Effect */}
        <div 
          ref={gridRef}
          className="flex-1 flex items-center justify-center overflow-auto p-8 rounded-xl"
          onMouseLeave={handleMouseLeave}
          onMouseUp={handleMouseUp}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            className="inline-block"
          >
            {/* Paper Container */}
            <div className="bg-white rounded-lg shadow-2xl shadow-black/5 p-8 relative">
              {/* Subtle grain texture */}
              <div className="absolute inset-0 rounded-lg opacity-[0.03] pointer-events-none" 
                   style={{
                     backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
                   }}
              />
              
              {/* Grid */}
              <div
                className="grid gap-px bg-border/30 p-3 rounded select-none relative"
                style={{
                  gridTemplateColumns: `repeat(${gridSize}, minmax(0, 1fr))`,
                  width: `${gridSize * cellSize + 24}px`,
                }}
              >
                {/* Highlighter overlay for hovered word */}
                {!showSolution && hoveredWord && Array.from(hoveredPositions).map((pos, idx) => {
                  const [r, c] = pos.split(',').map(Number);
                  return (
                    <div
                      key={`highlight-${pos}-${idx}`}
                      className="absolute bg-yellow-400/70 rounded-sm pointer-events-none z-0"
                      style={{
                        left: `${c * cellSize + 12}px`,
                        top: `${r * cellSize + 12}px`,
                        width: `${cellSize}px`,
                        height: `${cellSize}px`,
                      }}
                    />
                  );
                })}
                
                {grid.map((row, rowIndex) =>
                  row.map((cell, colIndex) => {
                    const isHighlighted = isCellHighlighted(rowIndex, colIndex);
                    const isSelected = selectedCells.has(`${rowIndex},${colIndex}`);
                    const isHovered = hoveredPositions.has(`${rowIndex},${colIndex}`);
                    const isInvalid = invalidSelection.has(`${rowIndex},${colIndex}`);
                    const isFound = Array.from(foundWords).some(word => {
                      const positionSet = wordPositionMap.get(word);
                      return positionSet ? positionSet.has(`${rowIndex},${colIndex}`) : false;
                    });
                    
                    return (
                      <motion.div
                        key={`${rowIndex}-${colIndex}`}
                        onMouseDown={(e) => { e.preventDefault(); handleMouseDown(rowIndex, colIndex); }}
                        onMouseEnter={() => handleMouseMove(rowIndex, colIndex)}
                        className={`
                          aspect-square flex items-center justify-center
                          text-base font-semibold transition-all duration-200 cursor-pointer relative z-10
                          ${showSolution
                            ? isHighlighted
                              ? 'bg-green-600 text-white rounded-sm font-bold'
                              : 'bg-white text-foreground'
                            : isInvalid
                              ? 'bg-red-500 text-white rounded-sm font-bold'
                              : isFound
                                ? 'bg-green-500 text-white rounded-sm font-bold'
                                : isSelected
                                  ? 'bg-indigo-700 text-white scale-105 shadow-md rounded-sm font-bold'
                                  : isHovered
                                    ? 'bg-yellow-400/90 text-foreground rounded-sm font-semibold'
                                    : 'bg-white text-foreground hover:bg-gray-50'
                          }
                        `}
                        style={{
                          width: `${cellSize}px`,
                          height: `${cellSize}px`,
                          fontSize: `${Math.max(cellSize * 0.45, 12)}px`, // Larger, cleaner letters
                        }}
                      >
                        {cell}
                      </motion.div>
                    );
                  })
                )}
              </div>
            </div>
          </motion.div>
        </div>
        
        {/* Word List Sidebar */}
        <div className="w-64 bg-white/80 dark:bg-card/80 rounded-xl p-5 overflow-y-auto border border-border/30 flex flex-col shadow-lg">
          <div className="flex items-center justify-between mb-4 pb-4 border-b border-border/50">
            <h3 className="text-sm font-bold text-foreground">Word List</h3>
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Size</span>
              <input
                type="number"
                min="8"
                max="24"
                value={wordListFontSize}
                onChange={(e) => setWordListFontSize(Math.max(8, Math.min(24, parseInt(e.target.value) || 14)))}
                className="w-12 px-1.5 py-0.5 text-xs bg-secondary border border-border rounded text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto space-y-1 pr-1">
            {placedWords.map(({ word }, index) => (
              <motion.div
                key={word}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.02 }}
                onMouseEnter={() => !showSolution && setHoveredWord(word)}
                onMouseLeave={() => !showSolution && setHoveredWord(null)}
                className={`
                  px-3 py-2 rounded-md cursor-pointer text-sm font-medium transition-colors
                  ${showSolution
                    ? 'text-green-600 dark:text-green-400 bg-green-500/10'
                    : foundWords.has(word)
                      ? 'bg-green-500 text-white shadow-sm'
                      : hoveredWord === word
                        ? 'bg-primary text-primary-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
                  }
                `}
                style={{ fontSize: `${wordListFontSize}px` }}
              >
                {word}
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-6 flex justify-end">
        <PNGDownloadButton
          targetId="puzzle-preview-container"
          filename={filename}
          label={showSolution ? 'Download Solution' : 'Download Puzzle'}
        />
      </div>
    </div>
  );
}
