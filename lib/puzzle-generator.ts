/**
 * Puzzle Generator - Ported from Python word_search_generator.py
 * Generates word search puzzles entirely in the browser
 * Enhanced with intersection prioritization and real difficulty levels
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

// Direction definitions - separated by type
const HORIZONTAL_RIGHT: Direction = [0, 1];
const VERTICAL_DOWN: Direction = [1, 0];
const DIAGONAL_DOWN_RIGHT: Direction = [1, 1];
const DIAGONAL_DOWN_LEFT: Direction = [1, -1];
const HORIZONTAL_LEFT: Direction = [0, -1];
const VERTICAL_UP: Direction = [-1, 0];
const DIAGONAL_UP_LEFT: Direction = [-1, -1];
const DIAGONAL_UP_RIGHT: Direction = [-1, 1];

// Straight directions (horizontal and vertical, forward only)
const STRAIGHT_DIRECTIONS: Direction[] = [
  HORIZONTAL_RIGHT,
  VERTICAL_DOWN
];

// Diagonal directions (diagonal, forward only)
const DIAGONAL_DIRECTIONS: Direction[] = [
  DIAGONAL_DOWN_RIGHT,
  DIAGONAL_DOWN_LEFT
];

// Reverse directions (all reverse directions)
const REVERSE_DIRECTIONS: Direction[] = [
  HORIZONTAL_LEFT,
  VERTICAL_UP,
  DIAGONAL_UP_LEFT,
  DIAGONAL_UP_RIGHT
];

// All 8 directions
const ALL_DIRECTIONS: Direction[] = [
  ...STRAIGHT_DIRECTIONS,
  ...DIAGONAL_DIRECTIONS,
  ...REVERSE_DIRECTIONS
];

/**
 * Get allowed directions based on difficulty level
 */
function getAllowedDirections(difficulty: string): Direction[] {
  switch (difficulty.toLowerCase()) {
    case 'easy':
      // Only straight directions (horizontal and vertical, forward only)
      return [...STRAIGHT_DIRECTIONS];
    case 'medium':
      // Straight + diagonal directions (forward only)
      return [...STRAIGHT_DIRECTIONS, ...DIAGONAL_DIRECTIONS];
    case 'hard':
      // All 8 directions including reverse
      return ALL_DIRECTIONS;
    default:
      // Default to medium
      return [...STRAIGHT_DIRECTIONS, ...DIAGONAL_DIRECTIONS];
  }
}

/**
 * Create a map of occupied letter positions: letter -> Set of positions
 */
function createOccupiedMap(grid: string[][]): Map<string, Set<string>> {
  const occupiedMap = new Map<string, Set<string>>();
  
  for (let i = 0; i < grid.length; i++) {
    for (let j = 0; j < grid[i].length; j++) {
      const letter = grid[i][j];
      if (letter) {
        if (!occupiedMap.has(letter)) {
          occupiedMap.set(letter, new Set());
        }
        occupiedMap.get(letter)!.add(`${i},${j}`);
      }
    }
  }
  
  return occupiedMap;
}

/**
 * Find ALL intersection opportunities for a word
 * Returns ALL positions where the word can cross existing letters (not just the first)
 * This allows us to shuffle and pick randomly to prevent clustering
 */
function findAllIntersectionOpportunities(
  grid: string[][],
  word: string,
  occupiedMap: Map<string, Set<string>>,
  directions: Direction[],
  gridSize: number
): Array<{ row: number; col: number; direction: Direction; intersectionIndex: number; intersections: number }> {
  const opportunities: Array<{ row: number; col: number; direction: Direction; intersectionIndex: number; intersections: number }> = [];
  
  // For each letter in the word, check if we can place it to intersect with existing letters
  for (let letterIndex = 0; letterIndex < word.length; letterIndex++) {
    const letter = word[letterIndex];
    const occupiedPositions = occupiedMap.get(letter);
    
    if (!occupiedPositions || occupiedPositions.size === 0) {
      continue; // No existing letters to intersect with
    }
    
    // For each occupied position of this letter, try to place the word crossing it
    for (const posStr of occupiedPositions) {
      const [occupiedRow, occupiedCol] = posStr.split(',').map(Number);
      
      // Try each direction
      for (const direction of directions) {
        const [dr, dc] = direction;
        
        // Calculate where the word would start if letterIndex is at (occupiedRow, occupiedCol)
        const startRow = occupiedRow - letterIndex * dr;
        const startCol = occupiedCol - letterIndex * dc;
        
        // Check if this placement is valid
        if (canPlaceWord(grid, word, startRow, startCol, direction, gridSize)) {
          // Count total intersections
          const intersections = countIntersections(grid, word, startRow, startCol, direction, gridSize);
          
          opportunities.push({
            row: startRow,
            col: startCol,
            direction,
            intersectionIndex: letterIndex,
            intersections
          });
        }
      }
    }
  }
  
  // DON'T sort - we'll shuffle and pick randomly to prevent clustering
  return opportunities;
}

/**
 * Check if a word placement has a safety gap from parallel words
 * Returns true if there's at least 1 empty row/column between parallel words (unless they cross)
 */
function hasSafetyGap(
  grid: string[][],
  word: string,
  row: number,
  col: number,
  direction: Direction,
  placedWords: WordPosition[],
  gridSize: number
): boolean {
  const [dr, dc] = direction;
  
  // Calculate new word's bounding box
  const newWordPositions: Position[] = [];
  for (let i = 0; i < word.length; i++) {
    newWordPositions.push([row + i * dr, col + i * dc]);
  }
  
  const newMinRow = Math.min(...newWordPositions.map(p => p[0]));
  const newMaxRow = Math.max(...newWordPositions.map(p => p[0]));
  const newMinCol = Math.min(...newWordPositions.map(p => p[1]));
  const newMaxCol = Math.max(...newWordPositions.map(p => p[1]));
  
  // Check against all placed words
  for (const placedWord of placedWords) {
    const [pdr, pdc] = placedWord.direction;
    
    // Check if words are parallel (same direction or opposite)
    const isParallel = 
      (dr === pdr && dc === pdc) || 
      (dr === -pdr && dc === -pdc) ||
      (dr === 0 && pdr === 0) || // Both horizontal
      (dc === 0 && pdc === 0);   // Both vertical
    
    if (!isParallel) {
      continue; // Words cross, no gap needed
    }
    
    // Calculate placed word's bounding box
    const placedMinRow = Math.min(...placedWord.positions.map(p => p[0]));
    const placedMaxRow = Math.max(...placedWord.positions.map(p => p[0]));
    const placedMinCol = Math.min(...placedWord.positions.map(p => p[1]));
    const placedMaxCol = Math.max(...placedWord.positions.map(p => p[1]));
    
    // Check if bounding boxes are too close (within 1 cell)
    // For horizontal words, check row distance
    if (dr === 0 && pdr === 0) {
      const rowDistance = Math.min(
        Math.abs(newMinRow - placedMaxRow),
        Math.abs(newMaxRow - placedMinRow)
      );
      if (rowDistance <= 1) {
        return false; // Too close horizontally
      }
    }
    
    // For vertical words, check column distance
    if (dc === 0 && pdc === 0) {
      const colDistance = Math.min(
        Math.abs(newMinCol - placedMaxCol),
        Math.abs(newMaxCol - placedMinCol)
      );
      if (colDistance <= 1) {
        return false; // Too close vertically
      }
    }
    
    // For diagonal words, check if they're in the same diagonal line and too close
    if (dr !== 0 && dc !== 0 && pdr !== 0 && pdc !== 0) {
      // Check if any cells are adjacent
      for (const [nr, nc] of newWordPositions) {
        for (const [pr, pc] of placedWord.positions) {
          const rowDiff = Math.abs(nr - pr);
          const colDiff = Math.abs(nc - pc);
          if (rowDiff <= 1 && colDiff <= 1 && (rowDiff + colDiff) <= 1) {
            return false; // Too close diagonally
          }
        }
      }
    }
  }
  
  return true; // Has safety gap or words cross
}

/**
 * Find sparse areas of the grid (areas with fewer placed words)
 * Returns positions that are far from existing words
 */
function findSparsePlacements(
  grid: string[][],
  word: string,
  directions: Direction[],
  placedWords: WordPosition[],
  gridSize: number
): Array<{ row: number; col: number; direction: Direction; sparsity: number }> {
  const options: Array<{ row: number; col: number; direction: Direction; sparsity: number }> = [];
  
  // If no words placed, prefer corners and edges, but also allow center for variety
  if (placedWords.length === 0) {
    const preferredPositions = [
      // Corners
      [0, 0], [0, gridSize - 1],
      [gridSize - 1, 0], [gridSize - 1, gridSize - 1],
      // Edges (middle of each edge)
      [0, Math.floor(gridSize / 2)],
      [Math.floor(gridSize / 2), 0],
      [gridSize - 1, Math.floor(gridSize / 2)],
      [Math.floor(gridSize / 2), gridSize - 1],
    ];
    
    for (const [prefRow, prefCol] of preferredPositions) {
      for (const direction of directions) {
        if (canPlaceWord(grid, word, prefRow, prefCol, direction, gridSize)) {
          options.push({
            row: prefRow,
            col: prefCol,
            direction,
            sparsity: 100 // Maximum sparsity for first word
          });
        }
      }
    }
    
    // If we found some positions, return them; otherwise fall through to general sparse search
    if (options.length > 0) {
      return options;
    }
  }
  
  // Calculate distance from each placed word for each valid position
  for (const direction of directions) {
    const [dr, dc] = direction;
    
    // Calculate valid starting positions
    let minRow = 0;
    let maxRow = gridSize - 1;
    let minCol = 0;
    let maxCol = gridSize - 1;
    
    // Adjust bounds based on direction
    if (dr < 0) minRow = Math.abs(dr) * (word.length - 1);
    if (dr > 0) maxRow = gridSize - 1 - dr * (word.length - 1);
    if (dc < 0) minCol = Math.abs(dc) * (word.length - 1);
    if (dc > 0) maxCol = gridSize - 1 - dc * (word.length - 1);
    
    // Sample positions (don't check every single one for performance)
    const sampleRate = Math.max(1, Math.floor((maxRow - minRow + 1) / 10));
    
    for (let row = minRow; row <= maxRow; row += sampleRate) {
      for (let col = minCol; col <= maxCol; col += sampleRate) {
        if (canPlaceWord(grid, word, row, col, direction, gridSize)) {
          // Calculate minimum distance to any placed word
          let minDistance = Infinity;
          
          for (const placedWord of placedWords) {
            for (const [pr, pc] of placedWord.positions) {
              // Calculate distance from this position to placed word
              const distance = Math.sqrt(
                Math.pow(row - pr, 2) + Math.pow(col - pc, 2)
              );
              minDistance = Math.min(minDistance, distance);
            }
          }
          
          options.push({
            row,
            col,
            direction,
            sparsity: minDistance
          });
        }
      }
    }
  }
  
  // Sort by sparsity (descending) - prefer positions far from existing words
  options.sort((a, b) => b.sparsity - a.sparsity);
  
  return options;
}

/**
 * Count how many letters would intersect with existing words
 */
function countIntersections(
  grid: string[][],
  word: string,
  row: number,
  col: number,
  direction: Direction,
  gridSize: number
): number {
  const [dr, dc] = direction;
  let intersections = 0;
  
  for (let i = 0; i < word.length; i++) {
    const r = row + i * dr;
    const c = col + i * dc;
    
    // Check bounds before accessing
    if (r >= 0 && r < gridSize && c >= 0 && c < gridSize && grid[r] && grid[r][c]) {
      // If cell already has a matching letter, it's an intersection
      if (grid[r][c] === word[i]) {
        intersections++;
      }
    }
  }
  
  return intersections;
}

/**
 * Find all possible placement positions for a word, sorted by intersection count
 */
function findPlacementOptions(
  grid: string[][],
  word: string,
  directions: Direction[],
  gridSize: number
): Array<{ row: number; col: number; direction: Direction; intersections: number }> {
  const options: Array<{ row: number; col: number; direction: Direction; intersections: number }> = [];
  
  for (const direction of directions) {
    const [dr, dc] = direction;
    
    // Calculate valid starting positions
    let minRow = 0;
    let maxRow = gridSize - 1;
    let minCol = 0;
    let maxCol = gridSize - 1;
    
    // Adjust bounds based on direction
    if (dr < 0) minRow = Math.abs(dr) * (word.length - 1);
    if (dr > 0) maxRow = gridSize - 1 - dr * (word.length - 1);
    if (dc < 0) minCol = Math.abs(dc) * (word.length - 1);
    if (dc > 0) maxCol = gridSize - 1 - dc * (word.length - 1);
    
    // Try all valid positions
    for (let row = minRow; row <= maxRow; row++) {
      for (let col = minCol; col <= maxCol; col++) {
        if (canPlaceWord(grid, word, row, col, direction, gridSize)) {
          const intersections = countIntersections(grid, word, row, col, direction, gridSize);
          options.push({ row, col, direction, intersections });
        }
      }
    }
  }
  
  // Sort by intersection count (descending) - prioritize positions with more intersections
  options.sort((a, b) => b.intersections - a.intersections);
  
  return options;
}

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
  
  // Validate starting position
  if (row < 0 || row >= gridSize || col < 0 || col >= gridSize) {
    return false;
  }
  
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
    
    // Double-check bounds (safety check)
    if (r < 0 || r >= gridSize || c < 0 || c >= gridSize) {
      return false;
    }
    
    // Check if grid cell exists and has conflicting letter
    if (grid[r] && grid[r][c] && grid[r][c] !== word[i]) {
      return false;
    }
  }
  
  return true;
}

/**
 * Place a word on the grid and return its positions
 * IMPORTANT: This function assumes canPlaceWord was called first and returned true
 * It includes safety checks to prevent any word from being cut off
 */
function placeWord(
  grid: string[][],
  word: string,
  row: number,
  col: number,
  direction: Direction,
  gridSize: number
): Position[] {
  const [dr, dc] = direction;
  const positions: Position[] = [];
  
  // Safety check: verify word fits completely before placing
  const endRow = row + (word.length - 1) * dr;
  const endCol = col + (word.length - 1) * dc;
  
  if (row < 0 || row >= gridSize || col < 0 || col >= gridSize ||
      endRow < 0 || endRow >= gridSize || endCol < 0 || endCol >= gridSize) {
    // Word doesn't fit - don't place it
    console.warn(`Cannot place word "${word}": out of bounds (row: ${row}, col: ${col}, direction: [${dr}, ${dc}], gridSize: ${gridSize})`);
    return [];
  }
  
  for (let i = 0; i < word.length; i++) {
    const r = row + i * dr;
    const c = col + i * dc;
    
    // Double-check bounds for each cell
    if (r < 0 || r >= gridSize || c < 0 || c >= gridSize) {
      console.error(`Word "${word}" being cut off at position ${i}! Cell (${r}, ${c}) is out of bounds.`);
      // Don't place the word if any cell is out of bounds
      return [];
    }
    
    // Verify grid cell exists
    if (!grid[r] || grid[r][c] === undefined) {
      console.error(`Word "${word}" cannot be placed: grid cell (${r}, ${c}) doesn't exist.`);
      return [];
    }
    
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
 * Generate a word search puzzle with intersection prioritization
 * Enhanced algorithm that creates denser, more professional puzzles
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
  
  // Get allowed directions for this difficulty
  const allowedDirections = getAllowedDirections(difficulty);
  
  // Sort words by length (longest first) - preserve this basic rule
  const sortedWords = [...filteredWords].sort((a, b) => b.length - a.length);
  
  // Calculate 25% threshold for "island" placement (force sparse placement)
  const islandThreshold = Math.ceil(sortedWords.length * 0.25);
  let islandCount = 0;
  
  // Place words with anti-clustering logic
  for (let wordIndex = 0; wordIndex < sortedWords.length; wordIndex++) {
    const word = sortedWords[wordIndex];
    let placed = false;
    
    // Maintain a map of occupied letter positions
    const occupiedMap = createOccupiedMap(grid);
    
    // THE 25% RULE: Force random placement in sparse areas for ~25% of words
    const shouldForceIsland = 
      placedWords.length === 0 || // First word always starts an island
      islandCount < islandThreshold || // Haven't reached 25% yet
      (wordIndex < sortedWords.length * 0.25 && Math.random() < 0.5); // Early words have higher chance
    
    if (shouldForceIsland && occupiedMap.size > 0) {
      // Find sparse placements (far from existing words)
      const sparseOptions = findSparsePlacements(
        grid,
        word,
        allowedDirections,
        placedWords,
        size
      );
      
      // Shuffle sparse options and try them
      shuffle(sparseOptions);
      
      for (const option of sparseOptions.slice(0, 20)) { // Try top 20 sparse options
        if (placed) break;
        
        // Prefer options with safety gaps
        if (hasSafetyGap(grid, word, option.row, option.col, option.direction, placedWords, size) || 
            Math.random() < 0.7) { // 70% chance to require gap, 30% allow without
          const positions = placeWord(
            grid,
            word,
            option.row,
            option.col,
            option.direction,
            size
          );
          
          if (positions.length === word.length) {
            placedWords.push({
              word,
              positions,
              direction: option.direction
            });
            placed = true;
            islandCount++;
            break;
          }
        }
      }
    }
    
    // RANDOMIZE ANCHORS: Find ALL intersection opportunities, shuffle, pick randomly
    if (!placed && occupiedMap.size > 0) {
      const allIntersections = findAllIntersectionOpportunities(
        grid,
        word,
        occupiedMap,
        allowedDirections,
        size
      );
      
      // Shuffle ALL intersection opportunities (not just the first)
      shuffle(allIntersections);
      
      // Try intersections, but prefer ones with safety gaps
      for (const opportunity of allIntersections) {
        if (placed) break;
        
        // Prefer intersections with safety gaps, but allow some without
        if (hasSafetyGap(grid, word, opportunity.row, opportunity.col, opportunity.direction, placedWords, size) ||
            opportunity.intersections > 1 || // Multiple intersections are good
            Math.random() < 0.6) { // 60% chance to require gap
          const positions = placeWord(
            grid,
            word,
            opportunity.row,
            opportunity.col,
            opportunity.direction,
            size
          );
          
          if (positions.length === word.length) {
            placedWords.push({
              word,
              positions,
              direction: opportunity.direction
            });
            placed = true;
            break;
          }
        }
      }
    }
    
    // Fallback: Try all placement options with safety gap preference
    if (!placed) {
      const options = findPlacementOptions(grid, word, allowedDirections, size);
      
      // Score options: prioritize safety gaps and sparsity
      const scoredOptions = options.map(option => {
        const hasGap = hasSafetyGap(grid, word, option.row, option.col, option.direction, placedWords, size);
        const gapScore = hasGap ? 10 : 0;
        const intersectionScore = option.intersections * 5;
        const score = gapScore + intersectionScore;
        return { ...option, score, hasGap };
      });
      
      // Sort by score (descending)
      scoredOptions.sort((a, b) => b.score - a.score);
      
      // Shuffle top options to add randomness
      const topOptions = scoredOptions.slice(0, Math.min(30, scoredOptions.length));
      shuffle(topOptions);
      
      for (const option of topOptions) {
        if (placed) break;
        
        const positions = placeWord(
          grid,
          word,
          option.row,
          option.col,
          option.direction,
          size
        );
        
        if (positions.length === word.length) {
          placedWords.push({
            word,
            positions,
            direction: option.direction
          });
          placed = true;
          break;
        }
      }
    }
    
    // Final fallback: Random placement anywhere it fits
    if (!placed) {
      const maxAttempts = 200;
      let attempts = 0;
      
      const shuffledDirections = [...allowedDirections];
      shuffle(shuffledDirections);
      
      for (const direction of shuffledDirections) {
        if (placed || attempts >= maxAttempts) break;
        
        const [dr, dc] = direction;
        const maxRow = size - 1 - Math.max(0, dr * (word.length - 1));
        const maxCol = size - 1 - Math.max(0, dc * (word.length - 1));
        const minRow = Math.max(0, -dr * (word.length - 1));
        const minCol = Math.max(0, -dc * (word.length - 1));
        
        for (let attempt = 0; attempt < 20; attempt++) {
          attempts++;
          if (attempts >= maxAttempts) break;
          
          const row = minRow + Math.floor(Math.random() * (maxRow - minRow + 1));
          const col = minCol + Math.floor(Math.random() * (maxCol - minCol + 1));
          
          if (canPlaceWord(grid, word, row, col, direction, size)) {
            const positions = placeWord(grid, word, row, col, direction, size);
            
            if (positions.length === word.length) {
              placedWords.push({
                word,
                positions,
                direction
              });
              placed = true;
              break;
            }
          }
        }
        
        if (placed) break;
      }
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
