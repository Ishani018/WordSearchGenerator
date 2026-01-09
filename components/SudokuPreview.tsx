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
    <div className="w-full h-full flex flex-col bg-card/50 backdrop-blur-xl rounded-xl p-6 shadow-sm border border-border/50">
      
      {/* Header & Toolbar */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-foreground tracking-tight">{title}</h2>
        
        {/* Compact Toolbar */}
        <div className="flex items-center gap-2 bg-secondary/50 p-1 rounded-lg border border-border/50">
          <button onClick={handleUndo} disabled={history.length === 0} className="p-2 rounded-md hover:bg-background text-muted-foreground hover:text-foreground disabled:opacity-30 transition-all" title="Undo">
            <Undo2 className="h-4 w-4" />
          </button>
          <div className="w-px h-4 bg-border mx-1" />
          <button onClick={resetPuzzle} className="p-2 rounded-md hover:bg-background text-muted-foreground hover:text-destructive transition-all" title="Reset">
            <RotateCcw className="h-4 w-4" />
          </button>
          <div className="w-px h-4 bg-border mx-1" />
           <button onClick={() => setShowSolution(!showSolution)} className={`p-2 rounded-md transition-all ${showSolution ? 'bg-primary text-primary-foreground' : 'hover:bg-background text-muted-foreground hover:text-foreground'}`} title="Toggle Solution">
            {showSolution ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </div>

      <div className="flex-1 flex gap-6 min-h-0">
        {/* Main Grid Area */}
        <div className="flex-1 flex flex-col items-center justify-center bg-background/50 rounded-xl border border-border/50 p-4">
          
          {/* Status Bar */}
          <div className="w-full max-w-md flex items-center justify-between mb-4 text-sm">
             <div className="flex items-center gap-2 px-3 py-1 bg-secondary rounded-full border border-border">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <span className="font-mono font-medium text-foreground">{formatTimer(timer)}</span>
             </div>
             <div className="flex items-center gap-4">
                <span className="font-medium text-muted-foreground capitalize">{puzzle.difficulty}</span>
                <button onClick={() => setIsNotesMode(!isNotesMode)} className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition-colors ${isNotesMode ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground hover:bg-secondary/80'}`}>
                  <PenTool className="h-3 w-3" />
                  {isNotesMode ? 'NOTES ON' : 'NOTES OFF'}
                </button>
             </div>
          </div>

          {/* The Grid */}
          {!displayGrid || displayGrid.length === 0 ? (
             <div className="text-muted-foreground">No puzzle loaded</div>
          ) : (
            <div className="inline-block border-2 border-foreground bg-foreground rounded-lg overflow-hidden shadow-xl">
              <table className="border-collapse bg-background">
                <tbody>
                  {displayGrid.map((row, rowIndex) => (
                    <tr key={rowIndex}>
                      {row.map((cell, colIndex) => {
                        const isGiven = grid[rowIndex]?.[colIndex] !== undefined && grid[rowIndex][colIndex] !== 0;
                        const isBoxBorderBottom = (rowIndex + 1) % 3 === 0 && rowIndex !== 8;
                        const isBoxBorderRight = (colIndex + 1) % 3 === 0 && colIndex !== 8;
                        const isSelected = selectedCell && selectedCell[0] === rowIndex && selectedCell[1] === colIndex;
                        const cellKey = `${rowIndex}-${colIndex}`;
                        const isValidated = validationState[cellKey] !== undefined;
                        const isCorrect = validationState[cellKey] === true;
                        const isWrong = validationState[cellKey] === false;
                        const cellNotes = notes[cellKey] || new Set<number>();
                        const cellValue = userGrid[rowIndex]?.[colIndex] ?? 0;
                        const isRelated = relatedCells.has(cellKey) && !isSelected;
                        const isMatchingNumber = selectedValue !== null && cellValue === selectedValue && cellValue !== 0 && !isSelected;
                        
                        return (
                          <td
                            key={`${rowIndex}-${colIndex}`}
                            onClick={() => handleCellClick(rowIndex, colIndex)}
                            className={`
                              w-12 h-12 text-center align-middle cursor-pointer relative transition-colors duration-75
                              border-r border-b border-border/40
                              ${isBoxBorderBottom ? '!border-b-2 !border-b-foreground/30' : ''}
                              ${isBoxBorderRight ? '!border-r-2 !border-r-foreground/30' : ''}
                              ${isGiven ? 'bg-secondary/50 text-foreground font-bold text-xl' : 'bg-background text-primary text-xl font-medium'}
                              ${isSelected ? '!bg-primary/20 !ring-inset !ring-2 !ring-primary z-10' : ''}
                              ${isRelated ? 'bg-secondary/30' : ''}
                              ${isMatchingNumber ? 'bg-yellow-500/20 text-yellow-700 dark:text-yellow-400' : ''}
                              ${isWrong ? '!bg-red-500/20 !text-red-600' : ''}
                              ${isCorrect ? '!text-green-600' : ''}
                              hover:bg-secondary/60
                            `}
                          >
                            {cell !== 0 ? cell : cellNotes.size > 0 && (
                              <div className="grid grid-cols-3 gap-px p-0.5 w-full h-full pointer-events-none">
                                {[1,2,3,4,5,6,7,8,9].map(n => (
                                  <div key={n} className="flex items-center justify-center text-[8px] leading-none text-muted-foreground/80">
                                    {cellNotes.has(n) ? n : ''}
                                  </div>
                                ))}
                              </div>
                            )}
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

        {/* Sidebar Controls */}
        <div className="w-64 flex flex-col gap-4">
          {/* Numpad */}
          <div className="bg-card rounded-xl p-4 border border-border/50 shadow-sm">
             <div className="grid grid-cols-3 gap-2">
                {[1,2,3,4,5,6,7,8,9].map(num => {
                   const isCompleted = completedNumbers.has(num);
                   return (
                     <button
                       key={num}
                       onClick={() => handleNumberInput(num)}
                       disabled={!selectedCell || isCompleted}
                       className={`
                         aspect-square rounded-lg font-bold text-lg transition-all
                         ${isCompleted 
                            ? 'opacity-20 bg-muted text-muted-foreground' 
                            : 'bg-secondary hover:bg-primary hover:text-primary-foreground text-foreground shadow-sm hover:shadow-md hover:-translate-y-0.5 active:translate-y-0'
                         }
                       `}
                     >
                       {num}
                     </button>
                   );
                })}
             </div>
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
               className="w-full mt-3 py-2 flex items-center justify-center gap-2 text-destructive hover:bg-destructive/10 rounded-lg transition-colors font-medium text-sm"
             >
               <Trash2 className="h-4 w-4" /> Clear Cell
             </button>
          </div>

          <button onClick={checkPuzzle} className="w-full py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl shadow-lg shadow-green-500/20 font-bold transition-all hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2">
            <Check className="h-5 w-5" /> Check Solution
          </button>
        </div>
      </div>
    </div>
  );
}




