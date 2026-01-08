'use client';

import { useState, useEffect, useCallback } from 'react';
import { 
  Eye, EyeOff, Lightbulb, RotateCcw, Undo2, Trash2, Pencil, 
  Check, Settings, ArrowLeft, ArrowRight, ArrowUp, ArrowDown 
} from 'lucide-react';
import { SudokuPuzzle } from '@/lib/sudoku-generator';

interface SudokuPreviewProps {
  puzzle: SudokuPuzzle;
  title?: string;
}

interface HistoryEntry {
  grid: number[][];
  notes: { [key: string]: number[] };
}

export default function SudokuPreview({ puzzle, title = 'Sudoku Puzzle' }: SudokuPreviewProps) {
  const [showSolution, setShowSolution] = useState(false);
  const [userGrid, setUserGrid] = useState<number[][]>([]);
  const [selectedCell, setSelectedCell] = useState<[number, number] | null>(null);
  const [isNotesMode, setIsNotesMode] = useState(false);
  const [notes, setNotes] = useState<{ [key: string]: number[] }>({});
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [validationState, setValidationState] = useState<{ [key: string]: boolean | null }>({});
  const [timer, setTimer] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(true);
  const [isSolved, setIsSolved] = useState(false);
  const { grid, solution } = puzzle;

  // Initialize user grid with puzzle (given numbers)
  useEffect(() => {
    setUserGrid(grid.map(row => [...row]));
    setNotes({});
    setHistory([]);
    setValidationState({});
    setTimer(0);
    setIsTimerRunning(true);
    setIsSolved(false);
  }, [grid]);

  // Timer effect
  useEffect(() => {
    if (!isTimerRunning || isSolved) return;
    
    const interval = setInterval(() => {
      setTimer(prev => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [isTimerRunning, isSolved]);

  // Format timer as MM:SS
  const formatTimer = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Save state to history
  const saveToHistory = useCallback((currentGrid: number[][], currentNotes: { [key: string]: number[] }) => {
    setHistory(prev => [...prev, {
      grid: currentGrid.map(row => [...row]),
      notes: JSON.parse(JSON.stringify(currentNotes))
    }]);
  }, []);

  // Undo last move
  const handleUndo = () => {
    if (history.length === 0) return;
    const lastState = history[history.length - 1];
    setUserGrid(lastState.grid);
    setNotes(lastState.notes);
    setHistory(prev => prev.slice(0, -1));
    // Clear validation for cells that were changed
    setValidationState({});
  };

  // Handle cell click
  const handleCellClick = (row: number, col: number) => {
    // Only allow editing empty cells (not given numbers)
    if (grid[row][col] === 0) {
      setSelectedCell([row, col]);
    }
  };

  // Handle number input
  const handleNumberInput = (num: number) => {
    if (!selectedCell) return;
    const [row, col] = selectedCell;
    
    // Don't allow editing given numbers
    if (grid[row][col] !== 0) return;

    // Save current state to history before making changes
    saveToHistory(userGrid, notes);

    if (isNotesMode) {
      // Toggle note in notes mode
      const key = `${row}-${col}`;
      const currentNotes = notes[key] || [];
      const newNotes = { ...notes };
      
      if (currentNotes.includes(num)) {
        newNotes[key] = currentNotes.filter(n => n !== num);
      } else {
        newNotes[key] = [...currentNotes, num].sort((a, b) => a - b);
      }
      
      if (newNotes[key].length === 0) {
        delete newNotes[key];
      }
      
      setNotes(newNotes);
      // Clear validation for this cell when notes change
      setValidationState(prev => {
        const newState = { ...prev };
        delete newState[key];
        return newState;
      });
    } else {
      // Fill or clear cell in normal mode
      const newGrid = userGrid.map(r => [...r]);
      newGrid[row][col] = newGrid[row][col] === num ? 0 : num;
      setUserGrid(newGrid);
      
      // Clear notes for this cell when filling
      const key = `${row}-${col}`;
      const newNotes = { ...notes };
      delete newNotes[key];
      setNotes(newNotes);
      
      // Clear validation for this cell when it's edited
      setValidationState(prev => {
        const newState = { ...prev };
        delete newState[key];
        return newState;
      });
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
          saveToHistory(userGrid, notes);
          const newGrid = userGrid.map(r => [...r]);
          newGrid[row][col] = 0;
          setUserGrid(newGrid);
          
          // Clear notes and validation
          const cellKey = `${row}-${col}`;
          const newNotes = { ...notes };
          delete newNotes[cellKey];
          setNotes(newNotes);
          setValidationState(prev => {
            const newState = { ...prev };
            delete newState[cellKey];
            return newState;
          });
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
  }, [selectedCell, userGrid, grid, notes, isNotesMode, saveToHistory]);

  // Get hint for selected cell
  const getHint = () => {
    if (selectedCell) {
      const [row, col] = selectedCell;
      if (grid[row][col] === 0) {
        saveToHistory(userGrid, notes);
        const newGrid = userGrid.map(r => [...r]);
        newGrid[row][col] = solution[row][col];
        setUserGrid(newGrid);
        
        // Clear notes for this cell
        const key = `${row}-${col}`;
        const newNotes = { ...notes };
        delete newNotes[key];
        setNotes(newNotes);
        
        setSelectedCell(null);
      }
    }
  };

  // Check puzzle
  const checkPuzzle = () => {
    const newValidationState: { [key: string]: boolean | null } = {};
    let allCorrect = true;
    let hasIncorrect = false;
    let filledCount = 0;
    let totalEmpty = 0;

    for (let row = 0; row < 9; row++) {
      for (let col = 0; col < 9; col++) {
        if (grid[row][col] !== 0) continue; // Skip given numbers
        
        totalEmpty++;
        const key = `${row}-${col}`;
        const userValue = userGrid[row][col];
        
        if (userValue !== 0) {
          filledCount++;
          const isCorrect = userValue === solution[row][col];
          newValidationState[key] = isCorrect;
          if (!isCorrect) {
            hasIncorrect = true;
            allCorrect = false;
          }
        }
      }
    }

    setValidationState(newValidationState);

    // Check if puzzle is complete and correct
    if (filledCount === totalEmpty && allCorrect && !hasIncorrect) {
      setIsSolved(true);
      setIsTimerRunning(false);
      // Show success message
      setTimeout(() => {
        alert('Congratulations! You solved the puzzle! 🎉');
      }, 100);
    } else if (allCorrect && !hasIncorrect && filledCount > 0) {
      // Show partial success
      setTimeout(() => {
        alert('So far so good! Keep going! ✓');
      }, 100);
    }
  };

  // Reset puzzle
  const resetPuzzle = () => {
    if (confirm('Are you sure you want to reset the puzzle? All progress will be lost.')) {
      setUserGrid(grid.map(row => [...row]));
      setNotes({});
      setHistory([]);
      setValidationState({});
      setSelectedCell(null);
      setTimer(0);
      setIsTimerRunning(true);
      setIsSolved(false);
    }
  };

  // Erase selected cell
  const handleErase = () => {
    if (!selectedCell) return;
    const [row, col] = selectedCell;
    if (grid[row][col] === 0) {
      saveToHistory(userGrid, notes);
      const newGrid = userGrid.map(r => [...r]);
      newGrid[row][col] = 0;
      setUserGrid(newGrid);
      
      const key = `${row}-${col}`;
      const newNotes = { ...notes };
      delete newNotes[key];
      setNotes(newNotes);
      
      setValidationState(prev => {
        const newState = { ...prev };
        delete newState[key];
        return newState;
      });
    }
  };

  // Display grid (user's input or solution)
  const displayGrid = showSolution ? solution : userGrid;

  // Get highlighted number (for smart highlighting)
  const highlightedNumber = selectedCell && userGrid[selectedCell[0]][selectedCell[1]] !== 0
    ? userGrid[selectedCell[0]][selectedCell[1]]
    : null;

  return (
    <div className="w-full space-y-4 p-6">
      {/* Header with Title and Timer */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-slate-100">{title}</h2>
        <div className="flex items-center gap-2 bg-slate-800/80 px-4 py-2 rounded-lg border border-slate-700/50">
          <span className="text-sm text-slate-400 mr-2">Time:</span>
          <span className="text-lg font-mono font-bold text-slate-100">{formatTimer(timer)}</span>
        </div>
      </div>

      {/* Modern Icon Toolbar */}
      <div className="flex items-center justify-center gap-2 bg-slate-900/80 backdrop-blur-sm rounded-xl p-3 border border-slate-700/50">
        {/* Group 1: Game Actions */}
        <div className="flex items-center gap-2 pr-3 border-r border-slate-700/50">
          <button
            onClick={handleUndo}
            disabled={history.length === 0}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:bg-slate-800/50 disabled:cursor-not-allowed text-slate-300 hover:text-white transition-all duration-200 group relative"
            title="Undo last move"
          >
            <Undo2 className="h-5 w-5" />
            <span className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 bg-slate-900 text-xs text-slate-300 px-2 py-1 rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap transition-opacity">
              Undo
            </span>
          </button>
          
          <button
            onClick={handleErase}
            disabled={!selectedCell || grid[selectedCell[0]][selectedCell[1]] !== 0}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:bg-slate-800/50 disabled:cursor-not-allowed text-slate-300 hover:text-white transition-all duration-200 group relative"
            title="Erase selected cell"
          >
            <Trash2 className="h-5 w-5" />
            <span className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 bg-slate-900 text-xs text-slate-300 px-2 py-1 rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap transition-opacity">
              Erase
            </span>
          </button>
          
          <button
            onClick={() => setIsNotesMode(!isNotesMode)}
            className={`p-2 rounded-lg transition-all duration-200 group relative ${
              isNotesMode 
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30' 
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white'
            }`}
            title="Toggle notes mode (pencil marks)"
          >
            <Pencil className="h-5 w-5" />
            <span className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 bg-slate-900 text-xs text-slate-300 px-2 py-1 rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap transition-opacity">
              Notes {isNotesMode ? '(ON)' : '(OFF)'}
            </span>
          </button>
        </div>

        {/* Group 2: Assistance */}
        <div className="flex items-center gap-2 px-3 border-r border-slate-700/50">
          <button
            onClick={getHint}
            disabled={!selectedCell || grid[selectedCell[0]][selectedCell[1]] !== 0}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:bg-slate-800/50 disabled:cursor-not-allowed text-slate-300 hover:text-white transition-all duration-200 group relative"
            title="Get hint for selected cell"
          >
            <Lightbulb className="h-5 w-5" />
            <span className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 bg-slate-900 text-xs text-slate-300 px-2 py-1 rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap transition-opacity">
              Hint
            </span>
          </button>
          
          <button
            onClick={checkPuzzle}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all duration-200 group relative"
            title="Check puzzle for errors"
          >
            <Check className="h-5 w-5" />
            <span className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 bg-slate-900 text-xs text-slate-300 px-2 py-1 rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap transition-opacity">
              Check
            </span>
          </button>
        </div>

        {/* Group 3: Meta */}
        <div className="flex items-center gap-2 pl-3">
          <button
            onClick={resetPuzzle}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all duration-200 group relative"
            title="Reset puzzle"
          >
            <RotateCcw className="h-5 w-5" />
            <span className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 bg-slate-900 text-xs text-slate-300 px-2 py-1 rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap transition-opacity">
              Reset
            </span>
          </button>
          
          <button
            onClick={() => setShowSolution(!showSolution)}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all duration-200 group relative"
            title={showSolution ? 'Hide solution' : 'Show solution'}
          >
            {showSolution ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            <span className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 bg-slate-900 text-xs text-slate-300 px-2 py-1 rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap transition-opacity">
              {showSolution ? 'Hide Solution' : 'Show Solution'}
            </span>
          </button>
        </div>
      </div>

      {/* Selected Cell Info */}
      {selectedCell && (
        <p className="text-center text-sm text-slate-400">
          Selected: Row {selectedCell[0] + 1}, Column {selectedCell[1] + 1}
        </p>
      )}

      {/* Sudoku Grid */}
      <div className="flex justify-center">
        <div className="inline-block border-2 border-slate-600 bg-slate-800 rounded-lg p-2">
          <table className="border-collapse">
            <tbody>
              {displayGrid.map((row, rowIndex) => (
                <tr key={rowIndex}>
                  {row.map((cell, colIndex) => {
                    const isGiven = grid[rowIndex][colIndex] !== 0;
                    // Check if this cell is on a 3x3 box boundary (thicker border)
                    const isBoxBorderTop = rowIndex % 3 === 0;
                    const isBoxBorderLeft = colIndex % 3 === 0;
                    const isBoxBorderBottom = (rowIndex + 1) % 3 === 0;
                    const isBoxBorderRight = (colIndex + 1) % 3 === 0;
                    const isSelected = selectedCell && selectedCell[0] === rowIndex && selectedCell[1] === colIndex;
                    const cellKey = `${rowIndex}-${colIndex}`;
                    const isValidated = validationState[cellKey] !== undefined;
                    const isCorrect = validationState[cellKey] === true;
                    const isWrong = validationState[cellKey] === false;
                    const cellNotes = notes[cellKey] || [];
                    const cellValue = userGrid[rowIndex][colIndex];
                    
                    // Smart highlighting: highlight cells with same number
                    const isHighlighted = highlightedNumber !== null && 
                      cellValue === highlightedNumber && 
                      cellValue !== 0 &&
                      !isSelected;
                    
                    return (
                      <td
                        key={`${rowIndex}-${colIndex}`}
                        onClick={() => handleCellClick(rowIndex, colIndex)}
                        className={`
                          w-12 h-12 text-center align-middle cursor-pointer relative
                          border border-slate-500
                          ${isBoxBorderTop ? 'border-t-2 border-t-slate-300' : ''}
                          ${isBoxBorderLeft ? 'border-l-2 border-l-slate-300' : ''}
                          ${isBoxBorderBottom ? 'border-b-2 border-b-slate-300' : ''}
                          ${isBoxBorderRight ? 'border-r-2 border-r-slate-300' : ''}
                          ${rowIndex === 0 ? 'border-t-3 border-t-slate-200' : ''}
                          ${colIndex === 0 ? 'border-l-3 border-l-slate-200' : ''}
                          ${rowIndex === 8 ? 'border-b-3 border-b-slate-200' : ''}
                          ${colIndex === 8 ? 'border-r-3 border-r-slate-200' : ''}
                          ${isGiven ? 'bg-slate-700 text-slate-200 font-semibold' : 'bg-slate-800'}
                          ${isSelected ? 'ring-2 ring-blue-500 bg-blue-500/20' : ''}
                          ${isHighlighted ? 'bg-blue-500/10' : ''}
                          ${isValidated && isCorrect ? 'text-green-400' : ''}
                          ${isValidated && isWrong ? 'text-red-400' : ''}
                          ${!isGiven && !isSelected && !isValidated && cellValue !== 0 ? 'text-blue-300' : ''}
                          ${!isGiven && !isSelected && !isValidated && cellValue === 0 ? 'text-slate-300' : ''}
                          hover:bg-slate-700/50 transition-colors
                        `}
                      >
                        {/* Main number */}
                        {cell !== 0 ? (
                          <span className="text-lg font-semibold">{cell}</span>
                        ) : cellNotes.length > 0 ? (
                          /* Notes grid (3x3 mini-grid) */
                          <div className="absolute inset-0 grid grid-cols-3 text-[8px] text-slate-400 p-0.5">
                            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                              <span 
                                key={num}
                                className={`flex items-center justify-center ${
                                  cellNotes.includes(num) ? 'text-slate-300 font-medium' : 'text-transparent'
                                }`}
                              >
                                {num}
                              </span>
                            ))}
                          </div>
                        ) : null}
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
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => {
            const [row, col] = selectedCell;
            const cellKey = `${row}-${col}`;
            const isInNotes = isNotesMode && (notes[cellKey] || []).includes(num);
            const isFilled = !isNotesMode && userGrid[row][col] === num;
            
            return (
              <button
                key={num}
                onClick={() => handleNumberInput(num)}
                className={`w-10 h-10 rounded-lg font-semibold transition-colors ${
                  isFilled || isInNotes
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-700 hover:bg-slate-600 text-slate-200'
                }`}
              >
                {num}
              </button>
            );
          })}
          <button
            onClick={() => {
              const [row, col] = selectedCell;
              saveToHistory(userGrid, notes);
              const newGrid = userGrid.map(r => [...r]);
              newGrid[row][col] = 0;
              setUserGrid(newGrid);
              
              const key = `${row}-${col}`;
              const newNotes = { ...notes };
              delete newNotes[key];
              setNotes(newNotes);
              
              setValidationState(prev => {
                const newState = { ...prev };
                delete newState[key];
                return newState;
              });
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
        <p>Use arrow keys to navigate • {isNotesMode ? 'Notes mode: Add pencil marks' : 'Normal mode: Fill cells'}</p>
      </div>
    </div>
  );
}
