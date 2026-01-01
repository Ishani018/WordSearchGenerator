/**
 * Puzzle Generator - Ported from Python word_search_generator.py
 * Generates word search puzzles entirely in the browser
 */

export type Direction = [number, number];
export type Position = [number, number];
export type WordPosition = {
  word: string;
  positions: Position[];
  direction: Direction;
};

export interface PuzzleResult {
  grid: string[][];
  placedWords: WordPosition[];
  unplacedWords: string[];
}

// All 8 directions: right, down, diagonal down-right, diagonal down-left, left, up, diagonal up-left, diagonal up-right
const DIRECTIONS: Direction[] = [
  [0, 1],   // Right
  [1, 0],   // Down
  [1, 1],   // Diagonal down-right
  [1, -1],  // Diagonal down-left
  [0, -1],  // Left
  [-1, 0],  // Up
  [-1, -1], // Diagonal up-left
  [-1, 1]   // Diagonal up-right
];

/**
 * Check if a word can be placed at the given position
 */
function canPlaceWord(
  grid: string[][],
  word: string,
  row: number,
  col: number,
  direction: Direction,
  gridSize: number
): boolean {
  const [dr, dc] = direction;
  
  // Check if word fits
  const endRow = row + (word.length - 1) * dr;
  const endCol = col + (word.length - 1) * dc;
  
  if (endRow < 0 || endRow >= gridSize || endCol < 0 || endCol >= gridSize) {
    return false;
  }
  
  // Check if cells are empty or contain matching letters
  for (let i = 0; i < word.length; i++) {
    const r = row + i * dr;
    const c = col + i * dc;
    
    if (grid[r][c] && grid[r][c] !== word[i]) {
      return false;
    }
  }
  
  return true;
}

/**
 * Place a word on the grid and return its positions
 */
function placeWord(
  grid: string[][],
  word: string,
  row: number,
  col: number,
  direction: Direction
): Position[] {
  const [dr, dc] = direction;
  const positions: Position[] = [];
  
  for (let i = 0; i < word.length; i++) {
    const r = row + i * dr;
    const c = col + i * dc;
    grid[r][c] = word[i];
    positions.push([r, c]);
  }
  
  return positions;
}

/**
 * Fill empty cells with random letters
 */
function fillEmptyCells(grid: string[][]): void {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  
  for (let i = 0; i < grid.length; i++) {
    for (let j = 0; j < grid[i].length; j++) {
      if (!grid[i][j]) {
        grid[i][j] = letters[Math.floor(Math.random() * letters.length)];
      }
    }
  }
}

/**
 * Shuffle array in place (Fisher-Yates)
 */
function shuffle<T>(array: T[]): void {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

/**
 * Generate a word search puzzle
 * Improved algorithm with aggressive retry logic
 */
export function generatePuzzle(
  words: string[],
  size: number,
  difficulty: string = 'medium'
): PuzzleResult {
  // Filter words that fit in grid
  const maxWordLength = size - 2;
  let filteredWords = words
    .map(w => w.toUpperCase().trim())
    .filter(w => w.length > 0 && w.length <= maxWordLength);
  
  // Adjust word selection based on difficulty
  if (difficulty === 'easy') {
    filteredWords = filteredWords.filter(w => w.length <= 8);
  }
  
  if (filteredWords.length === 0) {
    filteredWords = ['WORD', 'SEARCH', 'PUZZLE'];
  }
  
  // Initialize grid
  const grid: string[][] = Array(size)
    .fill(null)
    .map(() => Array(size).fill(''));
  
  const placedWords: WordPosition[] = [];
  const unplacedWords: string[] = [];
  
  // Shuffle words for randomness
  shuffle(filteredWords);
  
  // Place words with improved retry logic
  for (const word of filteredWords) {
    let placed = false;
    const maxAttempts = 2000; // Increased from 1000
    let attempts = 0;
    
    // Shuffle directions for each word
    const shuffledDirections = [...DIRECTIONS];
    shuffle(shuffledDirections);
    
    for (const direction of shuffledDirections) {
      if (placed || attempts >= maxAttempts) break;
      
      // Try multiple random starting positions
      const positionAttempts = 100; // Increased from 50
      
      for (let posAttempt = 0; posAttempt < positionAttempts; posAttempt++) {
        attempts++;
        
        if (attempts >= maxAttempts) break;
        
        // Try random starting position
        const row = Math.floor(Math.random() * size);
        const col = Math.floor(Math.random() * size);
        
        if (canPlaceWord(grid, word, row, col, direction, size)) {
          const positions = placeWord(grid, word, row, col, direction);
          placedWords.push({
            word,
            positions,
            direction
          });
          placed = true;
          break;
        }
      }
      
      if (placed) break;
    }
    
    if (!placed) {
      unplacedWords.push(word);
    }
  }
  
  // Fill empty cells with random letters
  fillEmptyCells(grid);
  
  return {
    grid,
    placedWords,
    unplacedWords
  };
}

