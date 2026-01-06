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
  const gridRef = useRef<HTMLDivElement>(null);
  
  // Create a map of word positions for quick lookup
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

  // Create a reverse map: cell position -> words that contain it
  const cellToWordsMap = useMemo(() => {
    const map = new Map<string, string[]>();
    placedWords.forEach(({ word, positions }) => {
      positions.forEach(([r, c]) => {
        const key = `${r},${c}`;
        if (!map.has(key)) {
          map.set(key, []);
        }
        map.get(key)!.push(word);
      });
    });
    return map;
  }, [placedWords]);

  // Create a set of all solution positions
  const allSolutionPositions = useMemo(() => {
    const positions = new Set<string>();
    placedWords.forEach(({ positions: wordPositions }) => {
      wordPositions.forEach(([r, c]) => {
        positions.add(`${r},${c}`);
      });
    });
    return positions;
  }, [placedWords]);
  
  // Check if a cell is part of the hovered word
  const isCellHighlighted = (row: number, col: number): boolean => {
    if (showSolution) {
      return allSolutionPositions.has(`${row},${col}`);
    }
    if (selectedCells.size > 0) {
      return selectedCells.has(`${row},${col}`);
    }
    if (!hoveredWord) return false;
    const positionSet = wordPositionMap.get(hoveredWord);
    if (!positionSet) return false;
    return positionSet.has(`${row},${col}`);
  };

  // Find word from selected cells
  const findWordFromSelection = useCallback((cells: Set<string>): string | null => {
    if (cells.size === 0) return null;
    
    // Check each word to see if all selected cells match
    for (const { word, positions } of placedWords) {
      const wordCells = new Set(positions.map(([r, c]) => `${r},${c}`));
      
      // Check if selection exactly matches a word
      if (cells.size === wordCells.size) {
        let matches = true;
        for (const cell of cells) {
          if (!wordCells.has(cell)) {
            matches = false;
            break;
          }
        }
        if (matches) {
          return word;
        }
      }
    }
    
    return null;
  }, [placedWords]);

  // Handle mouse down - start selection
  const handleMouseDown = useCallback((row: number, col: number) => {
    if (showSolution) return; // Don't allow selection when solution is shown
    
    setIsSelecting(true);
    setSelectionStart([row, col]);
    setSelectedCells(new Set([`${row},${col}`]));
  }, [showSolution]);

  // Handle mouse move - update selection
  const handleMouseMove = useCallback((row: number, col: number) => {
    if (!isSelecting || !selectionStart || showSolution) return;
    
    const [startRow, startCol] = selectionStart;
    const selected = new Set<string>();
    
    // Calculate all cells between start and current position
    const rowDiff = row - startRow;
    const colDiff = col - startCol;
    const rowStep = rowDiff === 0 ? 0 : (rowDiff > 0 ? 1 : -1);
    const colStep = colDiff === 0 ? 0 : (colDiff > 0 ? 1 : -1);
    
    // Only allow straight lines (horizontal, vertical, or diagonal)
    if (rowStep !== 0 && colStep !== 0 && Math.abs(rowDiff) !== Math.abs(colDiff)) {
      // Not a valid line, just select the start cell
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

  // Handle mouse up - finalize selection
  const handleMouseUp = useCallback(() => {
    if (!isSelecting) return;
    
    setIsSelecting(false);
    
    // Check if selection matches a word
    const foundWord = findWordFromSelection(selectedCells);
    if (foundWord) {
      // Highlight the word and clear selection after a moment
      setHoveredWord(foundWord);
      setTimeout(() => {
        setSelectedCells(new Set());
        setHoveredWord(null);
      }, 1000);
    } else {
      // Clear selection if no word found
      setTimeout(() => {
        setSelectedCells(new Set());
      }, 300);
    }
    
    setSelectionStart(null);
  }, [isSelecting, selectedCells, findWordFromSelection]);

  // Handle mouse leave - cancel selection
  const handleMouseLeave = useCallback(() => {
    if (isSelecting) {
      setIsSelecting(false);
      setSelectedCells(new Set());
      setSelectionStart(null);
    }
  }, [isSelecting]);
  
  const gridSize = grid.length;
  const maxWidth = 600;
  const cellSize = Math.min(maxWidth / gridSize, 28);

  const filename = showSolution 
    ? `${title.replace(/\s+/g, '_')}_Solution`
    : `${title.replace(/\s+/g, '_')}_Puzzle`;
  
  return (
    <div className="flex flex-col h-full bg-slate-900 rounded-lg p-6 overflow-hidden">
      {/* Title and Controls */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-white">{title}</h2>
        <div className="flex items-center gap-2">
          {/* Show Solution Toggle */}
          <button
            onClick={() => {
              setShowSolution(!showSolution);
              setSelectedCells(new Set());
              setHoveredWord(null);
            }}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${
              showSolution
                ? 'bg-green-600 text-white'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            {showSolution ? (
              <>
                <EyeOff className="h-4 w-4" />
                Hide Solution
              </>
            ) : (
              <>
                <Eye className="h-4 w-4" />
                Show Solution
              </>
            )}
          </button>
        </div>
      </div>
      
      {/* Exportable Container */}
      <div id="puzzle-preview-container" className="flex-1 flex gap-4 overflow-hidden min-h-0 bg-white p-4 rounded-lg">
        <div className="flex-1 flex gap-4 overflow-hidden min-h-0">
        {/* Grid */}
          <div 
            ref={gridRef}
            className="flex-1 flex items-center justify-center overflow-auto"
            onMouseLeave={handleMouseLeave}
            onMouseUp={handleMouseUp}
          >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            className="inline-block"
          >
            <div
                className="grid gap-px bg-slate-700 p-2 rounded-lg shadow-2xl select-none"
              style={{
                gridTemplateColumns: `repeat(${gridSize}, minmax(0, 1fr))`,
                width: `${gridSize * cellSize + 16}px`,
              }}
            >
              {grid.map((row, rowIndex) =>
                row.map((cell, colIndex) => {
                  const isHighlighted = isCellHighlighted(rowIndex, colIndex);
                    const isSelected = selectedCells.has(`${rowIndex},${colIndex}`);
                    const cellKey = `${rowIndex},${colIndex}`;
                    
                  return (
                    <motion.div
                      key={`${rowIndex}-${colIndex}`}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: (rowIndex * gridSize + colIndex) * 0.001 }}
                        onMouseDown={(e) => {
                          e.preventDefault();
                          handleMouseDown(rowIndex, colIndex);
                        }}
                        onMouseEnter={() => handleMouseMove(rowIndex, colIndex)}
                      className={`
                        aspect-square flex items-center justify-center
                        text-sm font-semibold
                        border border-slate-600
                        transition-all duration-200
                          cursor-pointer
                        ${isHighlighted 
                            ? showSolution
                              ? 'bg-green-500 text-white border-green-400 shadow-lg z-10'
                              : isSelected
                                ? 'bg-purple-500 text-white border-purple-400 shadow-lg scale-105 z-10'
                                : 'bg-blue-500 text-white border-blue-400 shadow-lg scale-105 z-10'
                            : 'bg-slate-800 text-slate-200 hover:bg-slate-700'
                        }
                      `}
                      style={{
                        width: `${cellSize}px`,
                        height: `${cellSize}px`,
                          fontSize: `${Math.max(cellSize * 0.35, 9)}px`,
                          userSelect: 'none',
                      }}
                    >
                      {cell}
                    </motion.div>
                  );
                })
              )}
            </div>
          </motion.div>
        </div>
        
        {/* Word List */}
          <div className="w-56 bg-slate-800 rounded-lg p-4 overflow-y-auto">
            <h3 className="text-sm font-semibold text-white mb-3">Word List</h3>
            {!showSolution && (
              <p className="text-xs text-slate-400 mb-2">Click and drag on the grid to find words!</p>
            )}
            <div className="space-y-2.5">
            {placedWords.map(({ word }, index) => (
              <motion.div
                key={word}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.03 }}
                  onMouseEnter={() => !showSolution && setHoveredWord(word)}
                  onMouseLeave={() => !showSolution && setHoveredWord(null)}
                className={`
                    px-2.5 py-1.5 rounded-md cursor-pointer text-sm
                  transition-all duration-200
                    ${showSolution
                      ? 'bg-green-600 text-white'
                      : hoveredWord === word
                    ? 'bg-blue-500 text-white shadow-lg scale-105'
                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                  }
                `}
              >
                <span className="font-medium">{word}</span>
              </motion.div>
            ))}
          </div>
        </div>
        </div>
      </div>

      {/* PNG Download Button */}
      <div className="mt-4">
        <PNGDownloadButton
          targetId="puzzle-preview-container"
          filename={filename}
          label={showSolution ? 'Download Solution PNG' : 'Download Puzzle PNG'}
        />
      </div>
    </div>
  );
}
