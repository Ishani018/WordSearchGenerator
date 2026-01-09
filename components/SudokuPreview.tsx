'use client';

import { useState, useEffect, useCallback } from 'react';
import { 
  Eye, EyeOff, Lightbulb, RotateCcw, Undo2, Trash2, Pencil, 
  Check, Settings, Play, Pause, PenTool
} from 'lucide-react';
import { SudokuPuzzle } from '@/lib/sudoku-generator';

interface SudokuPreviewProps {
  puzzle: SudokuPuzzle;
  title?: string;
}

interface HistoryEntry {
  grid: number[][];
  notes: { [key: string]: Set<number> };
}

export default function SudokuPreview({ puzzle, title = 'Sudoku Puzzle' }: SudokuPreviewProps) {
  const [showSolution, setShowSolution] = useState(false);
  const [userGrid, setUserGrid] = useState<number[][]>([]);
  const [selectedCell, setSelectedCell] = useState<[number, number] | null>(null);
  const [isNotesMode, setIsNotesMode] = useState(false);
  const [notes, setNotes] = useState<{ [key: string]: Set<number> }>({});
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [validationState, setValidationState] = useState<{ [key: string]: boolean | null }>({});
  const [timer, setTimer] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(true);
  const [isSolved, setIsSolved] = useState(false);
  const [completedNumbers, setCompletedNumbers] = useState<Set<number>>(new Set());
  const { grid, solution } = puzzle || { grid: [], solution: [] };

  // Initialize user grid with puzzle (given numbers)
  useEffect(() => {
    if (!grid || grid.length === 0) return;
    setUserGrid(grid.map(row => [...row]));
    setNotes({});
    setHistory([]);
    setValidationState({});
    setTimer(0);
    setIsTimerRunning(true);
    setIsSolved(false);
    setSelectedCell(null);
  }, [grid]);

  // Calculate completed numbers (count === 9)
  useEffect(() => {
    const counts = new Map<number, number>();
    
    // Count all numbers in the grid (including given numbers)
    for (let row = 0; row < 9; row++) {
      for (let col = 0; col < 9; col++) {
        const value = userGrid[row]?.[col];
        if (value !== undefined && value !== 0) {
          counts.set(value, (counts.get(value) || 0) + 1);
        }
      }
    }
    
    // Find numbers that appear exactly 9 times
    const completed = new Set<number>();
    for (let num = 1; num <= 9; num++) {
      if (counts.get(num) === 9) {
        completed.add(num);
      }
    }
    
    setCompletedNumbers(completed);
  }, [userGrid]);

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
  const saveToHistory = useCallback((currentGrid: number[][], currentNotes: { [key: string]: Set<number> }) => {
    setHistory(prev => [...prev, {
      grid: currentGrid.map(row => [...row]),
      notes: Object.fromEntries(
        Object.entries(currentNotes).map(([key, value]) => [key, new Set(Array.from(value))])
      )
    }]);
  }, []);

  // Undo last move
  const handleUndo = () => {
    if (history.length === 0) return;
    const lastState = history[history.length - 1];
    setUserGrid(lastState.grid);
    setNotes(Object.fromEntries(
      Object.entries(lastState.notes).map(([key, value]) => [key, new Set(Array.from(value))])
    ));
    setHistory(prev => prev.slice(0, -1));
    // Clear validation for cells that were changed
    setValidationState({});
  };

  // Handle cell click
  const handleCellClick = (row: number, col: number) => {
    // Only allow editing empty cells (not given numbers)
    if (grid[row]?.[col] !== undefined && grid[row][col] === 0) {
      setSelectedCell([row, col]);
    }
  };

  // Handle number input
  const handleNumberInput = (num: number) => {
    if (!selectedCell) return;
    const [row, col] = selectedCell;
    
    // Don't allow editing given numbers
    if (grid[row]?.[col] !== undefined && grid[row][col] !== 0) return;

    // Save current state to history before making changes
    const notesForHistory = Object.fromEntries(
      Object.entries(notes).map(([key, value]) => [key, new Set(value)])
    );
    saveToHistory(userGrid, notesForHistory);

    if (isNotesMode) {
      // Toggle note in Candidate mode
      const key = `${row}-${col}`;
      const currentNotes = notes[key] || new Set<number>();
      const newNotes = { ...notes };
      
      if (currentNotes.has(num)) {
        // Create a new Set without the number (don't mutate the original)
        const updatedNotes = new Set(currentNotes);
        updatedNotes.delete(num);
        if (updatedNotes.size === 0) {
          delete newNotes[key];
        } else {
          newNotes[key] = updatedNotes;
        }
      } else {
        // Create a new Set with the number added
        newNotes[key] = new Set([...currentNotes, num]);
      }
      
      setNotes(newNotes);
      // Clear validation for this cell when notes change
      setValidationState(prev => {
        const newState = { ...prev };
        delete newState[key];
        return newState;
      });
    } else {
      // Fill or clear cell in Normal mode
      const newGrid = userGrid.map(r => [...r]);
      newGrid[row][col] = newGrid[row][col] === num ? 0 : num;
      setUserGrid(newGrid);
      
      // Clear notes for this cell when filling (Normal mode clears notes)
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
        if (grid[row]?.[col] !== undefined && grid[row][col] === 0) {
          const notesForHistory = Object.fromEntries(
            Object.entries(notes).map(([key, value]) => [key, new Set(Array.from(value))])
          );
          saveToHistory(userGrid, notesForHistory);
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
      if (grid[row]?.[col] !== undefined && grid[row][col] === 0 && solution[row]?.[col] !== undefined) {
        const notesForHistory = Object.fromEntries(
          Object.entries(notes).map(([key, value]) => [key, new Set(Array.from(value))])
        );
        saveToHistory(userGrid, notesForHistory);
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
        if (grid[row]?.[col] !== undefined && grid[row][col] !== 0) continue; // Skip given numbers
        
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

  // Display grid (user's input or solution)
  const displayGrid = showSolution ? solution : userGrid;

  // Get highlighted number and related cells for smart highlighting
  const selectedValue = selectedCell && userGrid[selectedCell[0]][selectedCell[1]] !== 0
    ? userGrid[selectedCell[0]][selectedCell[1]]
    : null;

  // Get related cells (same row, column, and 3x3 box)
  const getRelatedCells = useCallback((row: number, col: number): Set<string> => {
    const related = new Set<string>();
    
    // Same row
    for (let c = 0; c < 9; c++) {
      related.add(`${row}-${c}`);
    }
    
    // Same column
    for (let r = 0; r < 9; r++) {
      related.add(`${r}-${col}`);
    }
    
    // Same 3x3 box
    const boxRow = Math.floor(row / 3) * 3;
    const boxCol = Math.floor(col / 3) * 3;
    for (let r = boxRow; r < boxRow + 3; r++) {
      for (let c = boxCol; c < boxCol + 3; c++) {
        related.add(`${r}-${c}`);
      }
    }
    
    return related;
  }, []);

  const relatedCells = selectedCell ? getRelatedCells(selectedCell[0], selectedCell[1]) : new Set<string>();

  return (
    <div className="w-full space-y-4 p-6">
      {/* Top Toolbar - Clean Design */}
      <div className="flex items-center justify-between bg-slate-900/80 backdrop-blur-sm rounded-xl p-3 border border-slate-700/50">
        {/* Left: Game Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleUndo}
            disabled={history.length === 0}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:bg-slate-800/50 disabled:cursor-not-allowed text-slate-300 hover:text-white transition-all duration-200 group relative"
            title="Undo last move"
          >
            <Undo2 className="h-5 w-5" />
            <span className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 bg-slate-900 text-xs text-slate-300 px-2 py-1 rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap transition-opacity z-50">
              Undo
            </span>
          </button>
          
          <button
            onClick={resetPuzzle}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all duration-200 group relative"
            title="Restart puzzle"
          >
            <RotateCcw className="h-5 w-5" />
            <span className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 bg-slate-900 text-xs text-slate-300 px-2 py-1 rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap transition-opacity z-50">
              Restart
            </span>
          </button>
        </div>

        {/* Center: Difficulty Label */}
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-slate-300 capitalize">{puzzle.difficulty}</span>
        </div>

        {/* Right: Timer and Settings */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700/50">
            <button
              onClick={() => setIsTimerRunning(!isTimerRunning)}
              className="text-slate-300 hover:text-white transition-colors"
              title={isTimerRunning ? 'Pause timer' : 'Resume timer'}
            >
              {isTimerRunning ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            </button>
            <span className="text-sm font-mono font-bold text-slate-100 ml-1">{formatTimer(timer)}</span>
          </div>
          
          <button
            onClick={getHint}
            disabled={!selectedCell || grid[selectedCell[0]][selectedCell[1]] !== 0}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:bg-slate-800/50 disabled:cursor-not-allowed text-slate-300 hover:text-white transition-all duration-200 group relative"
            title="Get hint for selected cell"
          >
            <Lightbulb className="h-5 w-5" />
            <span className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 bg-slate-900 text-xs text-slate-300 px-2 py-1 rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap transition-opacity z-50">
              Hint
            </span>
          </button>
          
          <button
            onClick={() => setShowSolution(!showSolution)}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all duration-200 group relative"
            title={showSolution ? 'Hide solution' : 'Show solution'}
          >
            {showSolution ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            <span className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 bg-slate-900 text-xs text-slate-300 px-2 py-1 rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap transition-opacity z-50">
              {showSolution ? 'Hide Solution' : 'Show Solution'}
            </span>
          </button>
        </div>
      </div>

      {/* Title and Notes Mode Toggle */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-slate-100">{title}</h2>
        
        {/* Prominent Notes Mode Toggle */}
        <div className="flex items-center gap-3 bg-slate-900/80 backdrop-blur-sm rounded-xl p-2 border border-slate-700/50">
          <span className={`text-sm font-medium transition-colors ${!isNotesMode ? 'text-slate-100' : 'text-slate-400'}`}>
            Normal
          </span>
          <button
            onClick={() => setIsNotesMode(!isNotesMode)}
            className={`relative w-14 h-7 rounded-full transition-all duration-300 ${
              isNotesMode ? 'bg-blue-600' : 'bg-slate-700'
            }`}
            title={isNotesMode ? 'Switch to Normal mode' : 'Switch to Candidate mode'}
          >
            <span
              className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full transition-transform duration-300 ${
                isNotesMode ? 'translate-x-7' : 'translate-x-0'
              }`}
            />
          </button>
          <span className={`text-sm font-medium transition-colors flex items-center gap-1 ${isNotesMode ? 'text-blue-300' : 'text-slate-400'}`}>
            <PenTool className="h-4 w-4" />
            Candidate
          </span>
        </div>
      </div>

      {/* Check Button */}
      <div className="flex justify-center">
        <button
          onClick={checkPuzzle}
          className="inline-flex items-center gap-2 px-6 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-all duration-200 font-semibold shadow-lg shadow-green-500/30"
          title="Check puzzle for errors"
        >
          <Check className="h-5 w-5" />
          Check Puzzle
        </button>
      </div>

      {/* Sudoku Grid */}
      <div className="flex justify-center">
        {!displayGrid || displayGrid.length === 0 || !grid || grid.length === 0 ? (
          <div className="text-slate-400 p-8">No puzzle loaded</div>
        ) : (
          <div className="inline-block border-2 border-slate-600 bg-slate-800 rounded-lg p-2">
            <table className="border-collapse">
              <tbody>
                {displayGrid.map((row, rowIndex) => (
                <tr key={rowIndex}>
                  {row.map((cell, colIndex) => {
                    const isGiven = grid[rowIndex]?.[colIndex] !== undefined && grid[rowIndex][colIndex] !== 0;
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
                    const cellNotes = notes[cellKey] || new Set<number>();
                    const cellValue = userGrid[rowIndex]?.[colIndex] ?? 0;
                    
                    // Smart highlighting
                    const isRelated = relatedCells.has(cellKey) && !isSelected;
                    const isMatchingNumber = selectedValue !== null && 
                      cellValue === selectedValue && 
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
                          ${isSelected ? 'ring-4 ring-blue-500 bg-blue-500/20' : ''}
                          ${isRelated ? 'bg-slate-700/30' : ''}
                          ${isMatchingNumber ? 'bg-blue-500/20' : ''}
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
                        ) : cellNotes.size > 0 ? (
                          /* Notes grid (3x3 mini-grid) */
                          <div className="absolute inset-0 grid grid-cols-3 text-[8px] text-slate-400 p-0.5">
                            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                              <span 
                                key={num}
                                className={`flex items-center justify-center ${
                                  cellNotes.has(num) ? 'text-slate-300 font-medium' : 'text-transparent'
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
        )}
      </div>

      {/* Intelligent Number Pad */}
      <div className="flex justify-center gap-2 mt-4">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => {
          const [row, col] = selectedCell || [null, null];
          const cellKey = row !== null && col !== null ? `${row}-${col}` : null;
          const isInNotes = isNotesMode && cellKey && (notes[cellKey] || new Set<number>()).has(num);
          const isFilled = !isNotesMode && row !== null && col !== null && userGrid[row][col] === num;
          const isCompleted = completedNumbers.has(num);
          
          return (
            <button
              key={num}
              onClick={() => handleNumberInput(num)}
              disabled={!selectedCell}
              className={`
                w-12 h-12 rounded-lg font-semibold transition-all duration-200
                ${isFilled || isInNotes
                  ? 'bg-blue-600 text-white'
                  : isCompleted
                  ? 'bg-slate-800/50 text-slate-500 opacity-50 cursor-not-allowed'
                  : 'bg-slate-700 hover:bg-slate-600 text-slate-200'
                }
                ${!selectedCell ? 'opacity-50 cursor-not-allowed' : ''}
              `}
              title={isCompleted ? `All ${num}s are placed` : `Place ${num}`}
            >
              {num}
            </button>
          );
        })}
        <button
          onClick={() => {
            if (!selectedCell) return;
            const [row, col] = selectedCell;
            const notesForHistory = Object.fromEntries(
              Object.entries(notes).map(([key, value]) => [key, new Set(Array.from(value))])
            );
            saveToHistory(userGrid, notesForHistory);
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
          disabled={!selectedCell}
          className="w-12 h-12 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200 font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          title="Clear cell"
        >
          <Trash2 className="h-5 w-5 mx-auto" />
        </button>
      </div>

      {/* Instructions */}
      <div className="text-center text-sm text-slate-400 space-y-1">
        <p>Click a cell to select it, then press 1-9 to fill or use the number pad</p>
        <p>
          {isNotesMode 
            ? 'Candidate Mode: Add pencil marks (small numbers) to track possibilities'
            : 'Normal Mode: Fill cells with numbers'
          } • Use arrow keys to navigate
        </p>
      </div>
    </div>
  );
}




