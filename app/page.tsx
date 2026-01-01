'use client';

import { useState, useEffect, useCallback } from 'react';
import { Search, Download, Sparkles, Grid3x3, Settings2 } from 'lucide-react';
import { generateWordsFromTheme } from '@/lib/word-generator';
import { generatePuzzle, type PuzzleResult, type WordPosition } from '@/lib/puzzle-generator';
import PuzzlePreview from '@/components/PuzzlePreview';
import PDFDownloadButton from '@/components/PDFDownloadButton';
import { Button } from '@/components/ui/button';

type Mode = 'book' | 'single';
type Difficulty = 'easy' | 'medium' | 'hard';
type AnswerStyle = 'rectangles' | 'lines' | 'highlighting';

export default function Home() {
  const [mode, setMode] = useState<Mode>('single');
  const [theme, setTheme] = useState('');
  const [customWords, setCustomWords] = useState('');
  const [gridSize, setGridSize] = useState(15);
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const [answerStyle, setAnswerStyle] = useState<AnswerStyle>('rectangles');
  
  // Book mode settings
  const [wordsPerPuzzle, setWordsPerPuzzle] = useState(15);
  const [numPages, setNumPages] = useState(50);
  
  // Single puzzle settings
  const [singleWords, setSingleWords] = useState(20);
  
  // Generated data
  const [generatedWords, setGeneratedWords] = useState<string[]>([]);
  const [puzzle, setPuzzle] = useState<PuzzleResult | null>(null);
  const [isGeneratingWords, setIsGeneratingWords] = useState(false);
  const [isGeneratingPuzzle, setIsGeneratingPuzzle] = useState(false);

  // Generate words from theme
  const handleGenerateWords = useCallback(async () => {
    if (!theme.trim()) return;
    
    setIsGeneratingWords(true);
    try {
      const response = await fetch('/api/generate-words', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          theme: theme.trim(),
          count: mode === 'book' ? wordsPerPuzzle * 2 : singleWords * 2,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to generate words');
      }

      const data = await response.json();
      
      if (data.warning) {
        console.warn('Warning:', data.warning);
        // Show warning to user
        alert(`⚠️ ${data.warning}`);
      }
      
      setGeneratedWords(data.words || []);
    } catch (error) {
      console.error('Error generating words:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to generate words';
      alert(`❌ ${errorMessage}\n\nMake sure GROQ_API_KEY is set in your environment variables.`);
    } finally {
      setIsGeneratingWords(false);
    }
  }, [theme, mode, wordsPerPuzzle, singleWords]);

  // Generate puzzle
  const handleGeneratePuzzle = useCallback(() => {
    const wordsToUse = [
      ...generatedWords,
      ...customWords.split(/[,\n]/).map(w => w.trim().toUpperCase()).filter(w => w.length > 0)
    ].filter((w, i, arr) => arr.indexOf(w) === i); // Remove duplicates

    if (wordsToUse.length === 0) {
      alert('Please generate words or add custom words first');
      return;
    }

    setIsGeneratingPuzzle(true);
    try {
      const wordsForPuzzle = mode === 'book' 
        ? wordsToUse.slice(0, wordsPerPuzzle)
        : wordsToUse.slice(0, singleWords);
      
      const result = generatePuzzle(wordsForPuzzle, gridSize, difficulty);
      setPuzzle(result);
    } catch (error) {
      console.error('Error generating puzzle:', error);
      alert('Failed to generate puzzle');
    } finally {
      setIsGeneratingPuzzle(false);
    }
  }, [generatedWords, customWords, mode, wordsPerPuzzle, singleWords, gridSize, difficulty]);

  // Auto-generate puzzle when words change
  useEffect(() => {
    if (generatedWords.length > 0 || customWords.trim()) {
      const wordsToUse = [
        ...generatedWords,
        ...customWords.split(/[,\n]/).map(w => w.trim().toUpperCase()).filter(w => w.length > 0)
      ].filter((w, i, arr) => arr.indexOf(w) === i);

      if (wordsToUse.length === 0) return;

      const wordsForPuzzle = mode === 'book' 
        ? wordsToUse.slice(0, wordsPerPuzzle)
        : wordsToUse.slice(0, singleWords);
      
      const result = generatePuzzle(wordsForPuzzle, gridSize, difficulty);
      setPuzzle(result);
    }
  }, [generatedWords, customWords, gridSize, difficulty, mode, wordsPerPuzzle, singleWords]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-sm">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Sparkles className="h-6 w-6 text-blue-400" />
            <h1 className="text-2xl font-bold">Word Search Generator</h1>
          </div>
          <div className="flex gap-2 bg-slate-800 rounded-lg p-1">
            <button
              onClick={() => setMode('single')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                mode === 'single'
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Single Puzzle
            </button>
            <button
              onClick={() => setMode('book')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                mode === 'book'
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Book Mode
            </button>
          </div>
        </div>
      </header>

      {/* Main Layout */}
      <div className="container mx-auto px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-[400px_1fr] gap-6 h-[calc(100vh-120px)]">
          {/* Left Sidebar - Controls */}
          <aside className="space-y-4 overflow-y-auto pr-2">
            {/* Theme Input */}
            <div className="bg-slate-900 rounded-lg p-4 border border-slate-800">
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Theme
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={theme}
                  onChange={(e) => setTheme(e.target.value)}
                  placeholder="e.g., Winter, Animals..."
                  className="flex-1 px-3 py-2 bg-slate-800 border border-slate-700 rounded-md text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  onKeyDown={(e) => e.key === 'Enter' && handleGenerateWords()}
                />
                <Button
                  onClick={handleGenerateWords}
                  disabled={isGeneratingWords || !theme.trim()}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Search className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Custom Words */}
            <div className="bg-slate-900 rounded-lg p-4 border border-slate-800">
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Custom Words (Optional)
              </label>
              <textarea
                value={customWords}
                onChange={(e) => setCustomWords(e.target.value)}
                placeholder="snowflake, icicle, blizzard..."
                rows={3}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-md text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>

            {/* Grid Size Selector */}
            <div className="bg-slate-900 rounded-lg p-4 border border-slate-800">
              <label className="block text-sm font-medium text-slate-300 mb-3">
                Grid Size
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[10, 15, 20, 25].map((size) => (
                  <button
                    key={size}
                    onClick={() => setGridSize(size)}
                    className={`px-4 py-3 rounded-lg border-2 transition-all ${
                      gridSize === size
                        ? 'border-blue-500 bg-blue-500/10 text-blue-400'
                        : 'border-slate-700 bg-slate-800 text-slate-300 hover:border-slate-600'
                    }`}
                  >
                    {size}×{size}
                  </button>
                ))}
              </div>
            </div>

            {/* Mode-specific Controls */}
            {mode === 'book' ? (
              <>
                <div className="bg-slate-900 rounded-lg p-4 border border-slate-800">
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Words per Puzzle
                  </label>
                  <input
                    type="number"
                    value={wordsPerPuzzle}
                    onChange={(e) => setWordsPerPuzzle(parseInt(e.target.value) || 15)}
                    min={5}
                    max={30}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-md text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="bg-slate-900 rounded-lg p-4 border border-slate-800">
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Number of Pages
                  </label>
                  <input
                    type="number"
                    value={numPages}
                    onChange={(e) => setNumPages(parseInt(e.target.value) || 50)}
                    min={1}
                    max={200}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-md text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </>
            ) : (
              <div className="bg-slate-900 rounded-lg p-4 border border-slate-800">
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Number of Words
                </label>
                <input
                  type="number"
                  value={singleWords}
                  onChange={(e) => setSingleWords(parseInt(e.target.value) || 20)}
                  min={5}
                  max={50}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-md text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            )}

            {/* Difficulty */}
            <div className="bg-slate-900 rounded-lg p-4 border border-slate-800">
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Difficulty
              </label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value as Difficulty)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-md text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>

            {/* Answer Style */}
            <div className="bg-slate-900 rounded-lg p-4 border border-slate-800">
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Answer Style
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['rectangles', 'lines', 'highlighting'] as AnswerStyle[]).map((style) => (
                  <button
                    key={style}
                    onClick={() => setAnswerStyle(style)}
                    className={`px-3 py-2 rounded-md text-xs font-medium transition-all ${
                      answerStyle === style
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    {style.charAt(0).toUpperCase() + style.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Generate Button */}
            <Button
              onClick={handleGeneratePuzzle}
              disabled={isGeneratingPuzzle || (generatedWords.length === 0 && !customWords.trim())}
              className="w-full bg-blue-600 hover:bg-blue-700"
              size="lg"
            >
              {isGeneratingPuzzle ? 'Generating...' : 'Generate Puzzle'}
            </Button>

            {/* PDF Download */}
            {puzzle && (
              <PDFDownloadButton
                grid={puzzle.grid}
                placedWords={puzzle.placedWords}
                title={`Word Search - ${theme || 'Puzzle'}`}
                answerStyle={answerStyle}
              />
            )}
          </aside>

          {/* Right Side - Preview */}
          <main className="overflow-hidden">
            {puzzle ? (
              <PuzzlePreview
                grid={puzzle.grid}
                placedWords={puzzle.placedWords}
                title={theme || 'Word Search Puzzle'}
              />
            ) : (
              <div className="h-full flex items-center justify-center bg-slate-900 rounded-lg border border-slate-800">
                <div className="text-center">
                  <Grid3x3 className="h-16 w-16 mx-auto mb-4 text-slate-600" />
                  <p className="text-slate-400">Enter a theme and generate words to see the puzzle</p>
                </div>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
