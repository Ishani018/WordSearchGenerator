'use client';

import { motion } from 'framer-motion';
import { WordPosition } from '@/lib/puzzle-generator';
import { useState, useMemo } from 'react';

interface PuzzlePreviewProps {
  grid: string[][];
  placedWords: WordPosition[];
  title?: string;
}

export default function PuzzlePreview({ grid, placedWords, title = 'Word Search Puzzle' }: PuzzlePreviewProps) {
  const [hoveredWord, setHoveredWord] = useState<string | null>(null);
  
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
  
  // Check if a cell is part of the hovered word
  const isCellHighlighted = (row: number, col: number): boolean => {
    if (!hoveredWord) return false;
    const positionSet = wordPositionMap.get(hoveredWord);
    if (!positionSet) return false;
    return positionSet.has(`${row},${col}`);
  };
  
  const gridSize = grid.length;
  const maxWidth = 600;
  const cellSize = Math.min(maxWidth / gridSize, 28);

  return (
    <div className="flex flex-col h-full bg-slate-900 rounded-lg p-6 border border-slate-800 overflow-hidden">
      {/* Title */}
      <h2 className="text-xl font-bold text-white mb-4 text-center">{title}</h2>
      
      <div className="flex-1 flex gap-4 overflow-hidden min-h-0">
        {/* Grid */}
        <div className="flex-1 flex items-center justify-center overflow-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            className="inline-block"
          >
            <div
              className="grid gap-px bg-slate-700 p-2 rounded-lg shadow-2xl"
              style={{
                gridTemplateColumns: `repeat(${gridSize}, minmax(0, 1fr))`,
                width: `${gridSize * cellSize + 16}px`,
              }}
            >
              {grid.map((row, rowIndex) =>
                row.map((cell, colIndex) => {
                  const isHighlighted = isCellHighlighted(rowIndex, colIndex);
                  return (
                    <motion.div
                      key={`${rowIndex}-${colIndex}`}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: (rowIndex * gridSize + colIndex) * 0.001 }}
                      className={`
                        aspect-square flex items-center justify-center
                        text-sm font-semibold
                        border border-slate-600
                        transition-all duration-200
                        ${isHighlighted 
                          ? 'bg-blue-500 text-white border-blue-400 shadow-lg scale-105 z-10' 
                          : 'bg-slate-800 text-slate-200 hover:bg-slate-700'
                        }
                      `}
                      style={{
                        width: `${cellSize}px`,
                        height: `${cellSize}px`,
                        fontSize: `${Math.max(cellSize * 0.35, 9)}px`,
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
        <div className="w-56 bg-slate-800 rounded-lg p-4 border border-slate-700 overflow-y-auto">
          <h3 className="text-sm font-semibold text-white mb-3">Word List</h3>
          <div className="space-y-1.5">
            {placedWords.map(({ word }, index) => (
              <motion.div
                key={word}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.03 }}
                onMouseEnter={() => setHoveredWord(word)}
                onMouseLeave={() => setHoveredWord(null)}
                className={`
                  px-2.5 py-1.5 rounded-md cursor-pointer text-sm
                  transition-all duration-200
                  ${hoveredWord === word
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
  );
}

