import random
import string
from typing import List, Dict, Tuple, Optional
import os

# Import requests for Ollama API calls
try:
    import requests
    REQUESTS_AVAILABLE = True
except ImportError:
    REQUESTS_AVAILABLE = False

class WordSearchGenerator:
    def __init__(self):
        # Initialize Ollama (completely FREE, runs locally)
        self.ollama_base_url = os.getenv('OLLAMA_BASE_URL', 'http://localhost:11434')
        self.ollama_model = os.getenv('OLLAMA_MODEL', 'llama2')  # Default model
        self.ollama_available = False
        
        if not REQUESTS_AVAILABLE:
            print("✗ Ollama support requires 'requests' library (install with: pip install requests)")
            print("⚠ Will use fallback word lists")
            return
        
        try:
            # Test if Ollama is running
            response = requests.get(f"{self.ollama_base_url}/api/tags", timeout=2)
            if response.status_code == 200:
                self.ollama_available = True
                print("✓ Ollama detected and running (completely FREE, local)")
                # Try to get available models
                try:
                    models_data = response.json()
                    if 'models' in models_data and models_data['models']:
                        available_models = [m.get('name', '').split(':')[0] for m in models_data['models']]
                        print(f"  Available models: {', '.join(available_models[:5])}")
                        # Prefer llama3.2, llama3, llama2, or mistral if available
                        # Try to match full model names first, then partial matches
                        preferred_models = ['llama3.2', 'llama3.1', 'llama3', 'llama2', 'mistral', 'phi']
                        model_found = False
                        for preferred in preferred_models:
                            for model in available_models:
                                if model == preferred or model.startswith(preferred + ':'):
                                    self.ollama_model = model.split(':')[0]  # Use full model name
                                    print(f"  Using model: {self.ollama_model}")
                                    model_found = True
                                    break
                            if model_found:
                                break
                        # If no preferred model found, use the first available
                        if not model_found and available_models:
                            self.ollama_model = available_models[0]
                            print(f"  Using model: {self.ollama_model}")
                except Exception as e:
                    print(f"  Could not parse models: {e}")
                    pass
            else:
                print(f"✗ Ollama not accessible (status code: {response.status_code})")
                print("⚠ Will use fallback word lists")
        except requests.exceptions.ConnectionError:
            print("✗ Ollama not running or not accessible")
            print("  Please start Ollama: https://ollama.ai")
            print("⚠ Will use fallback word lists")
        except Exception as e:
            print(f"✗ Ollama error: {e}")
            print("⚠ Will use fallback word lists")
        
        self.directions = [
            (0, 1),   # Right
            (1, 0),   # Down
            (1, 1),   # Diagonal down-right
            (1, -1),  # Diagonal down-left
            (0, -1),  # Left
            (-1, 0),  # Up
            (-1, -1), # Diagonal up-left
            (-1, 1)   # Diagonal up-right
        ]
    
    def generate_words_from_theme(self, theme: str, count: int = 20) -> List[str]:
        """Generate word list from theme using Ollama"""
        print(f"\n🔍 Generating {count} words for theme: '{theme}'")
        
        # Use Ollama
        if self.ollama_available:
            try:
                print("🤖 Generating words with Ollama (FREE, local)...")
                words = self._generate_with_ollama(theme, count)
                print(f"✓ Successfully generated {len(words)} words using Ollama")
                return words
            except Exception as e:
                print(f"✗ Ollama error: {e}")
                import traceback
                traceback.print_exc()
        
        # Fallback to predefined lists
        print("⚠ Using fallback word lists (Ollama not available or API call failed)")
        return self._get_fallback_words(theme, count)
    
    def _generate_with_ollama(self, theme: str, count: int) -> List[str]:
        """Generate words using Ollama API (local, free)"""
        if not REQUESTS_AVAILABLE:
            raise ValueError("requests library is required for Ollama")
        
        prompt = f"""Generate exactly {count} words related to the theme "{theme}".

Requirements:
- Return EXACTLY {count} words
- One word per line
- All words in UPPERCASE
- Words must be between 4 and 12 letters long
- Words should be suitable for word search puzzles
- Do NOT include numbers, bullet points, dashes, or any other formatting
- Do NOT include explanations or descriptions
- Just list the words, one per line

Example format:
WORD1
WORD2
WORD3
...

Generate {count} words now:"""
        
        try:
            # Call Ollama API
            response = requests.post(
                f"{self.ollama_base_url}/api/generate",
                json={
                    "model": self.ollama_model,
                    "prompt": prompt,
                    "stream": False,
                    "options": {
                        "temperature": 0.7,
                        "num_predict": count * 15  # Estimate tokens needed
                    }
                },
                timeout=60  # Ollama can be slow
            )
            
            if response.status_code != 200:
                raise ValueError(f"Ollama API returned status {response.status_code}: {response.text}")
            
            response_data = response.json()
            response_text = response_data.get('response', '')
            
            if not response_text:
                raise ValueError("Empty response from Ollama")
            
            print(f"  Raw response length: {len(response_text)} characters")
            
            # Parse words from response
            words = []
            seen = set()
            
            # Strategy 1: Split by newlines (most common format)
            for line in response_text.split('\n'):
                line = line.strip().upper()
                # Remove common prefixes like "1.", "-", "*", etc.
                line = line.lstrip('0123456789.-*•()[] ')
                # Remove trailing punctuation
                line = line.rstrip('.,;:!?')
                # Split by common separators (comma, semicolon, etc.)
                for word in line.replace(',', ' ').replace(';', ' ').replace('|', ' ').split():
                    word = word.strip().upper().rstrip('.,;:!?')
                    # Only keep alphabetic words of appropriate length
                    if word and word.isalpha() and 4 <= len(word) <= 12 and word not in seen:
                        seen.add(word)
                        words.append(word)
            
            # Strategy 2: If we didn't get enough, try splitting entire response by spaces
            if len(words) < count:
                for word in response_text.replace('\n', ' ').replace(',', ' ').split():
                    word = word.strip().upper().rstrip('.,;:!?')
                    if word and word.isalpha() and 4 <= len(word) <= 12 and word not in seen:
                        seen.add(word)
                        words.append(word)
            
            print(f"  Parsed {len(words)} unique words from response")
            
            # If we still don't have enough words, make additional API calls
            attempts = 0
            max_attempts = 3
            while len(words) < count and attempts < max_attempts:
                needed = count - len(words)
                print(f"  Need {needed} more words. Making additional request (attempt {attempts + 1}/{max_attempts})...")
                try:
                    existing_words_str = ', '.join(words[:20])  # Show first 20 to avoid too long prompt
                    additional_prompt = f"""Generate {needed} MORE words related to "{theme}".

IMPORTANT: Do NOT repeat any of these words: {existing_words_str}

Requirements:
- Generate exactly {needed} NEW words
- One word per line
- All in UPPERCASE
- 4-12 letters each
- No formatting, just the words

Generate {needed} words now:"""
                    
                    additional_response = requests.post(
                        f"{self.ollama_base_url}/api/generate",
                        json={
                            "model": self.ollama_model,
                            "prompt": additional_prompt,
                            "stream": False,
                            "options": {
                                "temperature": 0.8,
                                "num_predict": needed * 15
                            }
                        },
                        timeout=60
                    )
                    
                    if additional_response.status_code == 200:
                        additional_data = additional_response.json()
                        additional_text = additional_data.get('response', '')
                        
                        new_words_found = 0
                        for line in additional_text.split('\n'):
                            line = line.strip().upper().lstrip('0123456789.-*•()[] ').rstrip('.,;:!?')
                            for word in line.replace(',', ' ').replace(';', ' ').replace('|', ' ').split():
                                word = word.strip().upper().rstrip('.,;:!?')
                                if word and word.isalpha() and 4 <= len(word) <= 12 and word not in seen:
                                    seen.add(word)
                                    words.append(word)
                                    new_words_found += 1
                                    if len(words) >= count:
                                        break
                            if len(words) >= count:
                                break
                        
                        print(f"  Found {new_words_found} new words. Total: {len(words)} words")
                        attempts += 1
                        
                        # If we didn't get any new words, break to avoid infinite loop
                        if new_words_found == 0:
                            print(f"  No new words found in this attempt, stopping")
                            break
                    else:
                        print(f"  Additional request failed with status {additional_response.status_code}")
                        break
                except Exception as e:
                    print(f"  Additional request failed: {e}")
                    break
            
            if len(words) >= count:
                return words[:count]
            elif words:
                print(f"⚠ Only got {len(words)} words from Ollama, expected {count}")
                return words
            else:
                raise ValueError("No valid words extracted from Ollama response")
                
        except requests.exceptions.RequestException as e:
            raise ValueError(f"Ollama API request failed: {e}")
        except Exception as e:
            raise ValueError(f"Ollama error: {e}")
    
    def _get_fallback_words(self, theme: str, count: int) -> List[str]:
        """Fallback word lists when Ollama is unavailable"""
        theme_lower = theme.lower()
        word_banks = {
            'winter': ['SNOWFLAKE', 'ICICLE', 'BLIZZARD', 'FROST', 'SNOWMAN', 'MITTENS', 'SCARF', 'HOTCHOCOLATE', 'FIREPLACE', 'WINTER', 'COLD', 'ICE', 'SKI', 'SLED', 'SNOWBALL'],
            'summer': ['BEACH', 'SUNSHINE', 'VACATION', 'SWIMMING', 'ICE CREAM', 'BARBECUE', 'SUNSET', 'OCEAN', 'SAND', 'WAVES', 'SUNGLASSES', 'HAT', 'SANDALS', 'POOL', 'PICNIC'],
            'animals': ['ELEPHANT', 'LION', 'TIGER', 'BEAR', 'WOLF', 'DEER', 'RABBIT', 'SQUIRREL', 'EAGLE', 'OWL', 'SHARK', 'WHALE', 'DOLPHIN', 'PENGUIN', 'KANGAROO'],
            'food': ['PIZZA', 'BURGER', 'PASTA', 'SALAD', 'SANDWICH', 'SOUP', 'STEAK', 'CHICKEN', 'FISH', 'RICE', 'BREAD', 'CHEESE', 'FRUIT', 'VEGETABLE', 'DESSERT']
        }
        
        for key, words in word_banks.items():
            if key in theme_lower:
                return words[:count]
        
        # Default generic words
        return ['WORD', 'SEARCH', 'PUZZLE', 'FIND', 'GRID', 'LETTER', 'SOLVE', 'CHALLENGE', 'BRAIN', 'GAME', 'FUN', 'ENJOY', 'LEARN', 'PLAY', 'SOLVE'][:count]
    
    def generate_book(self, config: Dict) -> List[Dict]:
        """Generate a complete book of word search puzzles with unique words across puzzles"""
        puzzles = []
        
        num_pages = config.get('num_pages', 50)
        words_per_puzzle = config.get('words_per_puzzle', 15)
        total_words_needed = num_pages * words_per_puzzle
        
        # Combine custom words with AI-generated words
        all_words = config.get('custom_words', [])
        if config.get('theme'):
            # Generate enough words to ensure uniqueness across all puzzles
            # Generate extra to account for filtering and ensure we have enough
            words_to_generate = max(total_words_needed * 2, 100)
            ai_words = self.generate_words_from_theme(
                config['theme'], 
                words_to_generate
            )
            all_words.extend([w for w in ai_words if w not in all_words])
        
        # Remove duplicates and ensure uppercase
        all_words = list(set([w.upper().strip() for w in all_words if w.strip()]))
        
        # Track used words to ensure uniqueness across puzzles
        used_words = set()
        words_pool = all_words.copy()
        random.shuffle(words_pool)  # Randomize the pool
        
        # If we don't have enough words, generate more
        if len(words_pool) < total_words_needed and config.get('theme'):
            print(f"⚠ Only have {len(words_pool)} words, need {total_words_needed}. Generating more...")
            additional_needed = total_words_needed - len(words_pool) + 50  # Extra buffer
            additional_words = self.generate_words_from_theme(
                config['theme'],
                additional_needed
            )
            for word in additional_words:
                word_upper = word.upper().strip()
                if word_upper and word_upper not in words_pool:
                    words_pool.append(word_upper)
        
        # Fallback if still not enough
        if len(words_pool) < total_words_needed:
            print(f"⚠ Warning: Only {len(words_pool)} unique words available, but need {total_words_needed}")
            print("   Some words may repeat across puzzles")
        
        word_index = 0
        
        for page_num in range(num_pages):
            # Select unique words for this puzzle
            words_for_puzzle = []
            attempts = 0
            max_attempts = len(words_pool) * 2
            
            while len(words_for_puzzle) < words_per_puzzle and attempts < max_attempts:
                if word_index >= len(words_pool):
                    # Cycle through words if we run out (shouldn't happen with enough words)
                    word_index = 0
                    random.shuffle(words_pool)
                
                word = words_pool[word_index]
                word_index += 1
                
                # Only add if not used in this puzzle and fits grid size
                grid_size = config.get('grid_size', 15)
                max_word_length = grid_size - 2
                if word not in words_for_puzzle and len(word) <= max_word_length:
                    words_for_puzzle.append(word)
                
                attempts += 1
            
            # If we still don't have enough words, fill with any available words
            if len(words_for_puzzle) < words_per_puzzle:
                for word in words_pool:
                    if word not in words_for_puzzle and len(word) <= max_word_length:
                        words_for_puzzle.append(word)
                        if len(words_for_puzzle) >= words_per_puzzle:
                            break
            
            # Fallback if still not enough
            if len(words_for_puzzle) < words_per_puzzle:
                fallback_words = ['WORD', 'SEARCH', 'PUZZLE', 'FIND', 'GRID', 'LETTER', 'SOLVE']
                for word in fallback_words:
                    if word not in words_for_puzzle:
                        words_for_puzzle.append(word)
                        if len(words_for_puzzle) >= words_per_puzzle:
                            break
            
            puzzle = self.generate_puzzle(
                words_for_puzzle,
                config.get('grid_size', 15),
                config.get('difficulty', 'medium')
            )
            
            puzzle['page_number'] = page_num + 1
            puzzle['title'] = config.get('title', 'Word Search Puzzle Book')
            puzzles.append(puzzle)
        
        return puzzles
    
    def generate_puzzle(self, words: List[str], grid_size: int, difficulty: str = 'medium') -> Dict:
        """Generate a single word search puzzle"""
        # Filter words that fit in grid
        max_word_length = grid_size - 2
        words = [w for w in words if len(w) <= max_word_length]
        
        if not words:
            words = ['WORD', 'SEARCH', 'PUZZLE']
        
        # Adjust word selection based on difficulty
        if difficulty == 'easy':
            words = [w for w in words if len(w) <= 8]
        elif difficulty == 'hard':
            # Include longer words
            pass
        
        grid = [['' for _ in range(grid_size)] for _ in range(grid_size)]
        placed_words = []
        word_positions = {}  # Track positions for answer key
        
        # Place words
        attempts = 0
        max_attempts = 1000
        
        for word in words:
            if attempts > max_attempts:
                break
            
            placed = False
            random.shuffle(self.directions)
            
            for direction in self.directions:
                if attempts > max_attempts:
                    break
                
                # Try random starting positions
                for _ in range(50):
                    attempts += 1
                    row = random.randint(0, grid_size - 1)
                    col = random.randint(0, grid_size - 1)
                    
                    if self._can_place_word(grid, word, row, col, direction, grid_size):
                        positions = self._place_word(grid, word, row, col, direction)
                        placed_words.append(word)
                        word_positions[word] = positions
                        placed = True
                        break
                
                if placed:
                    break
        
        # Fill empty cells with random letters
        self._fill_empty_cells(grid)
        
        return {
            'grid': grid,
            'words': placed_words,
            'word_positions': word_positions,
            'grid_size': grid_size
        }
    
    def _can_place_word(self, grid: List[List[str]], word: str, row: int, col: int, 
                       direction: Tuple[int, int], grid_size: int) -> bool:
        """Check if a word can be placed at the given position"""
        dr, dc = direction
        
        # Check if word fits
        end_row = row + (len(word) - 1) * dr
        end_col = col + (len(word) - 1) * dc
        
        if end_row < 0 or end_row >= grid_size or end_col < 0 or end_col >= grid_size:
            return False
        
        # Check if cells are empty or contain matching letters
        for i, letter in enumerate(word):
            r = row + i * dr
            c = col + i * dc
            
            if grid[r][c] and grid[r][c] != letter:
                return False
        
        return True
    
    def _place_word(self, grid: List[List[str]], word: str, row: int, col: int, 
                   direction: Tuple[int, int]) -> List[Tuple[int, int]]:
        """Place a word on the grid and return its positions"""
        dr, dc = direction
        positions = []
        
        for i, letter in enumerate(word):
            r = row + i * dr
            c = col + i * dc
            grid[r][c] = letter
            positions.append((r, c))
        
        return positions
    
    def _fill_empty_cells(self, grid: List[List[str]]):
        """Fill empty cells with random letters"""
        for i in range(len(grid)):
            for j in range(len(grid[i])):
                if not grid[i][j]:
                    grid[i][j] = random.choice(string.ascii_uppercase)

