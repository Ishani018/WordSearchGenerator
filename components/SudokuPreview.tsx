'use client';

import { useState, useEffect } from 'react';
import { Eye, EyeOff, Lightbulb, RotateCcw } from 'lucide-react';
import { SudokuPuzzle } from '@/lib/sudoku-generator';

interface SudokuPreviewProps {
  puzzle: SudokuPuzzle;
  title?: string;
}

export default function SudokuPreview({ puzzle, title = 'Sudoku Puzzle' }: SudokuPreviewProps) {
  const [showSolution, setShowSolution] = useState(false);
  const [userGrid, setUserGrid] = useState<number[][]>([]);
  const [selectedCell, setSelectedCell] = useState<[number, number] | null>(null);
  const { grid, solution } = puzzle;

  // Initialize user grid with puzzle (given numbers)
  useEffect(() => {
    setUserGrid(grid.map(row => [...row]));
  }, [grid]);

  // Handle cell click
  const handleCellClick = (row: number, col: number) => {
    // Only allow editing empty cells (not given numbers)
    if (grid[row][col] === 0) {
      setSelectedCell([row, col]);
    }
  };

  // Handle number input
  const handleNumberInput = (num: number) => {
    if (selectedCell) {
      const [row, col] = selectedCell;
      const newGrid = userGrid.map(r => [...r]);
      // Toggle: if same number, clear it; otherwise set it
      newGrid[row][col] = newGrid[row][col] === num ? 0 : num;
      setUserGrid(newGrid);
    }
  };

  // Handle keyboard input
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (!selectedCell) return;
      
      const key = e.key;
      if (key >= '1' && key <= '9') {
        handleNumberInput(parseInt(key));
      } else if (key === 'Backspace' || key === 'Delete' || key === '0') {
        const [row, col] = selectedCell;
        if (grid[row][col] === 0) {
          const newGrid = userGrid.map(r => [...r]);
          newGrid[row][col] = 0;
          setUserGrid(newGrid);
        }
      } else if (key === 'ArrowUp' && selectedCell[0] > 0) {
        setSelectedCell([selectedCell[0] - 1, selectedCell[1]]);
      } else if (key === 'ArrowDown' && selectedCell[0] < 8) {
        setSelectedCell([selectedCell[0] + 1, selectedCell[1]]);
      } else if (key === 'ArrowLeft' && selectedCell[1] > 0) {
        setSelectedCell([selectedCell[0], selectedCell[1] - 1]);
      } else if (key === 'ArrowRight' && selectedCell[1] < 8) {
        setSelectedCell([selectedCell[0], selectedCell[1] + 1]);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [selectedCell, userGrid, grid]);

  // Get hint for selected cell
  const getHint = () => {
    if (selectedCell) {
      const [row, col] = selectedCell;
      if (grid[row][col] === 0) {
        const newGrid = userGrid.map(r => [...r]);
        newGrid[row][col] = solution[row][col];
        setUserGrid(newGrid);
        setSelectedCell(null);
      }
    }
  };

  // Reset puzzle
  const resetPuzzle = () => {
    setUserGrid(grid.map(row => [...row]));
    setSelectedCell(null);
  };

  // Check if cell is correct
  const isCellCorrect = (row: number, col: number): boolean | null => {
    if (grid[row][col] !== 0) return null; // Given cell
    if (userGrid[row][col] === 0) return null; // Empty cell
    return userGrid[row][col] === solution[row][col];
  };

  // Display grid (user's input or solution)
  // Always show userGrid (puzzle with clues), only show solution when toggle is on
  const displayGrid = showSolution ? solution : userGrid;
  
  // Ensure userGrid is properly initialized with puzzle (not solution)
  // The grid should have 0s for empty cells, numbers for clues

  return (
    <div className="w-full space-y-4 p-6">
      {/* Title and Controls */}
      <div className="text-center space-y-3">
        <h2 className="text-2xl font-bold text-slate-100">{title}</h2>
        <div className="flex items-center justify-center gap-3 flex-wrap">
          <button
            onClick={getHint}
            disabled={!selectedCell || grid[selectedCell[0]][selectedCell[1]] !== 0}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
            title="Get hint for selected cell"
          >
            <Lightbulb className="h-4 w-4" />
            Hint
          </button>
          <button
            onClick={resetPuzzle}
            className="inline-flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-100 rounded-lg transition-colors"
            title="Reset puzzle to initial state"
          >
            <RotateCcw className="h-4 w-4" />
            Reset
          </button>
          <button
            onClick={() => setShowSolution(!showSolution)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-100 rounded-lg transition-colors"
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
        {selectedCell && (
          <p className="text-sm text-slate-400">
            Selected: Row {selectedCell[0] + 1}, Column {selectedCell[1] + 1}
          </p>
        )}
      </div>

      {/* Sudoku Grid */}
      <div className="flex justify-center">
        <div className="inline-block border-2 border-slate-600 bg-slate-800 rounded-lg p-2">
          <table className="border-collapse">
            <tbody>
              {displayGrid.map((row, rowIndex) => (
                <tr key={rowIndex}>
                  {row.map((cell, colIndex) => {
                    const isGiven = grid[rowIndex][colIndex] !== 0;
                    const isBoxBorder = rowIndex % 3 === 0 || colIndex % 3 === 0;
                    const isSelected = selectedCell && selectedCell[0] === rowIndex && selectedCell[1] === colIndex;
                    const isCorrect = isCellCorrect(rowIndex, colIndex);
                    const isWrong = isCorrect === false;
                    
                    return (
                      <td
                        key={`${rowIndex}-${colIndex}`}
                        onClick={() => handleCellClick(rowIndex, colIndex)}
                        className={`
                          w-12 h-12 text-center align-middle cursor-pointer
                          border border-slate-500
                          ${isBoxBorder ? 'border-slate-400' : ''}
                          ${rowIndex === 0 ? 'border-t-2 border-t-slate-400' : ''}
                          ${colIndex === 0 ? 'border-l-2 border-l-slate-400' : ''}
                          ${rowIndex === 8 ? 'border-b-2 border-b-slate-400' : ''}
                          ${colIndex === 8 ? 'border-r-2 border-r-slate-400' : ''}
                          ${isGiven ? 'bg-slate-700 text-slate-200 font-semibold' : 'bg-slate-800'}
                          ${isSelected ? 'ring-2 ring-blue-500 bg-blue-500/20' : ''}
                          ${isCorrect === true ? 'text-green-400' : ''}
                          ${isWrong ? 'text-red-400' : ''}
                          ${!isGiven && !isSelected && !isCorrect && !isWrong ? 'text-slate-300' : ''}
                          hover:bg-slate-700/50 transition-colors
                        `}
                      >
                        {cell !== 0 ? cell : ''}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Number Pad */}
      {selectedCell && grid[selectedCell[0]][selectedCell[1]] === 0 && (
        <div className="flex justify-center gap-2 mt-4">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
            <button
              key={num}
              onClick={() => handleNumberInput(num)}
              className={`w-10 h-10 rounded-lg font-semibold transition-colors ${
                userGrid[selectedCell[0]][selectedCell[1]] === num
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-700 hover:bg-slate-600 text-slate-200'
              }`}
            >
              {num}
            </button>
          ))}
          <button
            onClick={() => {
              const [row, col] = selectedCell;
              const newGrid = userGrid.map(r => [...r]);
              newGrid[row][col] = 0;
              setUserGrid(newGrid);
            }}
            className="w-10 h-10 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200 font-semibold transition-colors"
            title="Clear cell"
          >
            ✕
          </button>
        </div>
      )}

      {/* Instructions */}
      <div className="text-center text-sm text-slate-400 space-y-1">
        <p>Click a cell to select it, then press 1-9 to fill or use the number pad</p>
        <p>Use arrow keys to navigate • Press Hint to reveal the answer for selected cell</p>
      </div>
    </div>
  );
}
