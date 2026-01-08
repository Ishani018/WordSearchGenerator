/**
 * Sudoku puzzle generator
 * Generates valid 9x9 Sudoku puzzles with varying difficulty levels
 * 
 * Core Rules:
 * 1. Grid Structure: 9x9 grid divided into nine 3x3 subgrids
 * 2. Value Range: Each cell contains 1-9
 * 3. Row Constraint: Every row contains 1-9 exactly once
 * 4. Column Constraint: Every column contains 1-9 exactly once
 * 5. Subgrid Constraint: Every 3x3 subgrid contains 1-9 exactly once
 */

export interface SudokuPuzzle {
  grid: number[][]; // 9x9 grid with 0 for empty cells
  solution: number[][]; // Complete solution
  difficulty: 'easy' | 'medium' | 'hard' | 'expert';
}

/**
 * Helper Function: Check if a number can be placed at a given position
 * Validates Row, Column, and Subgrid constraints
 * 
 * @param grid - 9x9 grid
 * @param row - Row index (0-8)
 * @param col - Column index (0-8)
 * @param num - Number to check (1-9)
 * @returns true if num can be placed without violating constraints
 */
function isValidPlacement(
  grid: number[][],
  row: number,
  col: number,
  num: number
): boolean {
  // Check Row Constraint: num must not exist in current row
  for (let c = 0; c < 9; c++) {
    if (grid[row][c] === num) return false;
  }

  // Check Column Constraint: num must not exist in current column
  for (let r = 0; r < 9; r++) {
    if (grid[r][col] === num) return false;
  }

  // Check Subgrid Constraint: num must not exist in current 3x3 box
  const boxRow = Math.floor(row / 3) * 3;
  const boxCol = Math.floor(col / 3) * 3;
  for (let r = boxRow; r < boxRow + 3; r++) {
    for (let c = boxCol; c < boxCol + 3; c++) {
      if (grid[r][c] === num) return false;
    }
  }

  return true; // num violates none of the constraints
}

/**
 * Generator Function: Fill board using backtracking algorithm
 * Step A: Generate a Full Valid Board (The Solution)
 * 
 * Algorithm:
 * 1. Find the first empty cell (value 0)
 * 2. Try numbers 1-9 in randomized order (shuffling is important for variety)
 * 3. If a number is valid, place it and recurse
 * 4. If recursion fails (no valid numbers left), backtrack (reset cell to 0)
 * 5. Once all 81 cells are filled, you have a "Seed" board
 * 
 * @param grid - 9x9 grid (modified in place)
 * @returns true if board is successfully filled
 */
function fillBoard(grid: number[][]): boolean {
  // Iterate through all cells (0,0 to 8,8)
  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      // Find the first empty cell
      if (grid[row][col] === 0) {
        // Try numbers 1-9 in a random order (shuffling is important for variety)
        const numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9];
        // Fisher-Yates shuffle for true randomness
        for (let i = numbers.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [numbers[i], numbers[j]] = [numbers[j], numbers[i]];
        }

        // Try each number in shuffled order
        for (const num of numbers) {
          // Check if the number is valid (obeys Row, Col, and Subgrid constraints)
          if (isValidPlacement(grid, row, col, num)) {
            // Place the number
            grid[row][col] = num;
            // Recurse to next cell
            if (fillBoard(grid)) {
              return true; // Successfully filled the board
            }
            // If recursion failed, backtrack (reset cell to 0)
            grid[row][col] = 0;
          }
        }
        // If you get stuck (no valid numbers left for a cell), backtrack
        return false;
      }
    }
  }
  // Once all 81 cells are filled, you have a "Seed" board
  return true; // Grid is complete
}

/**
 * Step A: Generate a Full Valid Board (The Solution)
 * 
 * Start with an empty 9x9 grid and fill it using backtracking
 * 
 * @returns Complete valid 9x9 Sudoku solution
 */
function generateCompleteSudoku(): number[][] {
  // Start with an empty 9x9 grid
  const grid: number[][] = Array(9)
    .fill(null)
    .map(() => Array(9).fill(0));

  // Optimization: Fill diagonal 3x3 boxes first (they don't conflict with each other)
  // This speeds up generation significantly
  for (let box = 0; box < 3; box++) {
    const numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9];
    // Shuffle for randomness
    for (let i = numbers.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [numbers[i], numbers[j]] = [numbers[j], numbers[i]];
    }

    let index = 0;
    const startRow = box * 3;
    const startCol = box * 3;
    for (let r = startRow; r < startRow + 3; r++) {
      for (let c = startCol; c < startCol + 3; c++) {
        grid[r][c] = numbers[index++];
      }
    }
  }

  // Fill the rest using backtracking
  fillBoard(grid);
  return grid;
}

/**
 * Count the number of solutions (for uniqueness check)
 * 
 * Uses linear index-based backtracking to avoid double-counting:
 * - Recursive helper solve(index) where index is linear cell position (0-80)
 * - If index === 81, increment count (base case: full board found)
 * - If count >= limit, return true to stop searching early
 * - Calculate row and col from index
 * - If cell is not 0, recurse to next index
 * - If cell is 0, try numbers 1-9, recurse, and backtrack
 */
function countSolutions(grid: number[][], limit: number = 2): number {
  let count = 0;

  function solve(index: number): boolean {
    // Base case: all 81 cells processed (valid solution found)
    if (index === 81) {
      count++;
      // Return true if we've reached the limit (to stop searching early)
      if (count >= limit) {
        return true;
      }
      return false;
    }

    // Calculate row and col from linear index
    const row = Math.floor(index / 9);
    const col = index % 9;

    // If cell is already filled, move to next cell
    if (grid[row][col] !== 0) {
      return solve(index + 1);
    }

    // Cell is empty (0), try numbers 1-9
    for (let num = 1; num <= 9; num++) {
      if (isValidPlacement(grid, row, col, num)) {
        grid[row][col] = num;
        // Recursively try to solve next cell
        if (solve(index + 1)) {
          // Limit reached, stop searching
          return true;
        }
        // Backtrack: reset cell to 0
        grid[row][col] = 0;
      }
    }
    // No valid number found for this cell
    return false;
  }

  solve(0);
  return count;
}

/**
 * Step B: Create the Puzzle (Digging Holes)
 * 
 * Puzzle Creator: removeDigits(grid, difficulty)
 * 
 * Algorithm:
 * 1. Start with a fully filled board from Step A
 * 2. Remove k digits based on difficulty
 * 3. Crucial Step: After removing digits, check that the puzzle still has 
 *    exactly one unique solution. If removing a number creates a puzzle with 
 *    multiple possible solutions, put that number back and try removing a different one.
 * 
 * Difficulty Levels (clues remaining):
 * - Easy: Leave ~36-45 clues (remove 36-45)
 * - Medium: Leave ~30-35 clues (remove 46-51)
 * - Hard: Leave ~25-29 clues (remove 52-56)
 * - Expert: Leave ~17-24 clues (remove 57-64, 17 is mathematical minimum)
 * 
 * @param grid - Complete valid Sudoku solution
 * @param difficulty - Difficulty level
 * @returns Puzzle grid with some cells removed (set to 0)
 */
function removeCells(
  grid: number[][],
  difficulty: 'easy' | 'medium' | 'hard' | 'expert'
): number[][] {
  // Take the "Seed" board from Step A
  const puzzle = grid.map((row) => [...row]);
  
  // Remove k digits based on difficulty
  // Total cells = 81, so cells to remove = 81 - clues to leave
  const difficultyRanges = {
    easy: { min: 36, max: 45 },      // Remove 36-45, leave 36-45 clues
    medium: { min: 46, max: 51 },    // Remove 46-51, leave 30-35 clues
    hard: { min: 52, max: 56 },      // Remove 52-56, leave 25-29 clues
    expert: { min: 57, max: 64 },    // Remove 57-64, leave 17-24 clues (17 is minimum)
  };
  
  const range = difficultyRanges[difficulty];
  // Randomly select number of cells to remove within the difficulty range
  const numToRemove = Math.floor(Math.random() * (range.max - range.min + 1)) + range.min;
  
  // Generate all positions (0,0 to 8,8)
  const positions: Array<[number, number]> = [];
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      positions.push([r, c]);
    }
  }

  // Shuffle positions for random removal order
  for (let i = positions.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [positions[i], positions[j]] = [positions[j], positions[i]];
  }

  // Try removing cells one by one, ensuring uniqueness
  let removed = 0;
  for (const [row, col] of positions) {
    if (removed >= numToRemove) break;

    // Remove the digit
    const originalValue = puzzle[row][col];
    puzzle[row][col] = 0;

    // Crucial Step: Check if puzzle still has exactly one unique solution
    const testGrid = puzzle.map((r) => [...r]);
    const solutions = countSolutions(testGrid, 2);

    if (solutions === 1) {
      // Puzzle still has unique solution, keep it removed
      removed++;
    } else {
      // If removing creates multiple solutions, put that number back
      puzzle[row][col] = originalValue;
    }
  }

  return puzzle;
}

/**
 * Generate a Sudoku puzzle with specified difficulty
 * 
 * Process:
 * 1. Step A: Generate a full valid board (the solution)
 * 2. Step B: Create the puzzle by removing digits while ensuring unique solution
 * 
 * @param difficulty - Difficulty level: 'easy' | 'medium' | 'hard' | 'expert'
 * @returns Sudoku puzzle with grid (puzzle), solution, and difficulty
 */
export function generateSudoku(
  difficulty: 'easy' | 'medium' | 'hard' | 'expert' = 'medium'
): SudokuPuzzle {
  // Step A: Generate complete solution (full valid board)
  const solution = generateCompleteSudoku();

  // Step B: Create the puzzle by removing cells (digging holes)
  const grid = removeCells(solution, difficulty);

  return {
    grid,
    solution,
    difficulty,
  };
}

/**
 * Generate multiple Sudoku puzzles
 * 
 * @param count - Number of puzzles to generate
 * @param difficulty - Difficulty level: 'easy' | 'medium' | 'hard' | 'expert'
 * @returns Array of Sudoku puzzles
 */
export function generateSudokuPuzzles(
  count: number,
  difficulty: 'easy' | 'medium' | 'hard' | 'expert' = 'medium'
): SudokuPuzzle[] {
  const puzzles: SudokuPuzzle[] = [];
  for (let i = 0; i < count; i++) {
    puzzles.push(generateSudoku(difficulty));
  }
  return puzzles;
}

