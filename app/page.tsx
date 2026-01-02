'use client';

import { useState, useEffect, useCallback } from 'react';
import { Search, Download, Sparkles, Grid3x3, BookOpen, Edit2, Trash2, Plus } from 'lucide-react';
import { generateWordsFromTheme } from '@/lib/word-generator';
import { generatePuzzle, type PuzzleResult } from '@/lib/puzzle-generator';
import PuzzlePreview from '@/components/PuzzlePreview';
import PDFDownloadButton from '@/components/PDFDownloadButton';
import { Button } from '@/components/ui/button';

type Mode = 'book' | 'single';
type Difficulty = 'easy' | 'medium' | 'hard';

interface Chapter {
  title: string;
  words: string[];
}

interface BookStructure {
  bookTitle: string;
  chapters: Chapter[];
}

export default function Home() {
  const [mode, setMode] = useState<Mode>('book');
  const [theme, setTheme] = useState('');
  const [customWords, setCustomWords] = useState('');
  const [gridSize, setGridSize] = useState(15);
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  
  // Book mode settings
  const [wordsPerPuzzle, setWordsPerPuzzle] = useState(15);
  
  // Single puzzle settings
  const [singleWords, setSingleWords] = useState(20);
  
  // Chapter management
  const [bookStructure, setBookStructure] = useState<BookStructure | null>(null);
  const [editingChapterIndex, setEditingChapterIndex] = useState<number | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  
  // Generated data
  const [generatedWords, setGeneratedWords] = useState<string[]>([]);
  const [puzzle, setPuzzle] = useState<PuzzleResult | null>(null);
  const [bookPuzzles, setBookPuzzles] = useState<Array<PuzzleResult & { chapterTitle: string }>>([]);
  const [isGeneratingWords, setIsGeneratingWords] = useState(false);
  const [isGeneratingStructure, setIsGeneratingStructure] = useState(false);
  const [isGeneratingPuzzle, setIsGeneratingPuzzle] = useState(false);
  const [generationProgress, setGenerationProgress] = useState({ current: 0, total: 0 });
  const [structureProgress, setStructureProgress] = useState({ current: 0, total: 0, status: '' });

  // Generate book structure (topic expansion)
  const handleGenerateStructure = useCallback(async () => {
    if (!theme.trim()) return;
    
    setIsGeneratingStructure(true);
    setStructureProgress({ current: 0, total: 100, status: 'Generating sub-themes...' });
    
    // Simulate progress updates while waiting for API
    let progressInterval: NodeJS.Timeout | null = null;
    const startProgress = () => {
      let current = 0;
      progressInterval = setInterval(() => {
        current += 2;
        if (current <= 80) { // Cap at 80% until we get real data
          setStructureProgress(prev => ({
            ...prev,
            current,
            status: `Generating sub-themes... ${current}%`
          }));
        }
      }, 200) as NodeJS.Timeout;
    };
    
    startProgress();
    
    try {
      const response = await fetch('/api/generate-words', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          theme: theme.trim(),
          mode: 'expand_topic',
          wordsPerChapter: wordsPerPuzzle,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to generate book structure');
      }

      const data = await response.json();
      
      // Clear progress interval
      if (progressInterval) clearInterval(progressInterval);
      
      // Update with real data
      if (data.chapters && data.chapters.length > 0) {
        setStructureProgress({ 
          current: 100, 
          total: 100, 
          status: `Generated ${data.chapters.length} chapters` 
        });
      }
      
      setBookStructure(data);
      setBookPuzzles([]);
    } catch (error) {
      if (progressInterval) clearInterval(progressInterval);
      console.error('Error generating structure:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to generate book structure';
      alert(`❌ ${errorMessage}\n\nMake sure GROQ_API_KEY is set in your environment variables.`);
      setStructureProgress({ current: 0, total: 0, status: '' });
    } finally {
      setTimeout(() => {
        setIsGeneratingStructure(false);
        setTimeout(() => setStructureProgress({ current: 0, total: 0, status: '' }), 2000);
      }, 500);
    }
  }, [theme, wordsPerPuzzle]);

  // Generate words from theme (for single puzzle mode)
  const handleGenerateWords = useCallback(async () => {
    if (!theme.trim()) return;
    
    setIsGeneratingWords(true);
    try {
      const wordCount = singleWords * 2;
      
      const response = await fetch('/api/generate-words', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          theme: theme.trim(),
          count: wordCount,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to generate words');
      }

      const data = await response.json();
      
      if (data.warning) {
        console.warn('Warning:', data.warning);
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
  }, [theme, singleWords]);

  // Edit chapter title
  const handleEditChapter = (index: number) => {
    if (bookStructure) {
      setEditingChapterIndex(index);
      setEditingTitle(bookStructure.chapters[index].title);
    }
  };

  // Save chapter title edit
  const handleSaveChapter = (index: number) => {
    if (bookStructure && editingTitle.trim()) {
      const updated = { ...bookStructure };
      updated.chapters[index].title = editingTitle.trim();
      setBookStructure(updated);
      setEditingChapterIndex(null);
      setEditingTitle('');
    }
  };

  // Delete chapter
  const handleDeleteChapter = (index: number) => {
    if (bookStructure && confirm(`Delete chapter "${bookStructure.chapters[index].title}"?`)) {
      const updated = { ...bookStructure };
      updated.chapters.splice(index, 1);
      setBookStructure(updated);
      // Regenerate puzzles if they exist
      if (bookPuzzles.length > 0) {
        setBookPuzzles([]);
      }
    }
  };

  // Generate puzzles for all chapters
  const handleGeneratePuzzles = useCallback(() => {
    if (!bookStructure || bookStructure.chapters.length === 0) {
      alert('Please generate book structure first');
      return;
    }

    setIsGeneratingPuzzle(true);
    setGenerationProgress({ current: 0, total: bookStructure.chapters.length });
    setBookPuzzles([]);

    const puzzles: Array<PuzzleResult & { chapterTitle: string }> = [];

    const generateNextPuzzle = (index: number) => {
      if (index >= bookStructure!.chapters.length) {
        setBookPuzzles(puzzles);
        setIsGeneratingPuzzle(false);
        setGenerationProgress({ current: 0, total: 0 });
        return;
      }

      const chapter = bookStructure!.chapters[index];
      const wordsForPuzzle = chapter.words.slice(0, wordsPerPuzzle);

      try {
        const result = generatePuzzle(wordsForPuzzle, gridSize, difficulty);
        puzzles.push({
          ...result,
          chapterTitle: chapter.title,
        });
        setGenerationProgress({ current: puzzles.length, total: bookStructure!.chapters.length });
        
        setTimeout(() => generateNextPuzzle(index + 1), 10);
      } catch (error) {
        console.error(`Error generating puzzle for chapter "${chapter.title}":`, error);
        alert(`Failed to generate puzzle for "${chapter.title}"`);
        setBookPuzzles(puzzles);
        setIsGeneratingPuzzle(false);
        setGenerationProgress({ current: 0, total: 0 });
      }
    };

    generateNextPuzzle(0);
  }, [bookStructure, wordsPerPuzzle, gridSize, difficulty]);

  // Generate single puzzle
  const handleGenerateSinglePuzzle = useCallback(() => {
    const wordsToUse = [
      ...generatedWords,
      ...customWords.split(/[,\n]/).map(w => w.trim().toUpperCase()).filter(w => w.length > 0)
    ].filter((w, i, arr) => arr.indexOf(w) === i);

    if (wordsToUse.length === 0) {
      alert('Please generate words or add custom words first');
      return;
    }

    setIsGeneratingPuzzle(true);
    try {
      const wordsForPuzzle = wordsToUse.slice(0, singleWords);
      const result = generatePuzzle(wordsForPuzzle, gridSize, difficulty);
      setPuzzle(result);
      setBookPuzzles([]);
    } catch (error) {
      console.error('Error generating puzzle:', error);
      alert('Failed to generate puzzle');
    } finally {
      setIsGeneratingPuzzle(false);
    }
  }, [generatedWords, customWords, singleWords, gridSize, difficulty]);

  // Auto-generate single puzzle when words change
  useEffect(() => {
    if (mode === 'single' && (generatedWords.length > 0 || customWords.trim())) {
      const wordsToUse = [
        ...generatedWords,
        ...customWords.split(/[,\n]/).map(w => w.trim().toUpperCase()).filter(w => w.length > 0)
      ].filter((w, i, arr) => arr.indexOf(w) === i);

      if (wordsToUse.length === 0) return;

      const wordsForPuzzle = wordsToUse.slice(0, singleWords);
      const result = generatePuzzle(wordsForPuzzle, gridSize, difficulty);
      setPuzzle(result);
    }
  }, [generatedWords, customWords, gridSize, difficulty, mode, singleWords]);

  const displayPuzzle = mode === 'book' && bookPuzzles.length > 0 
    ? bookPuzzles[0] 
    : puzzle;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-sm">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BookOpen className="h-6 w-6 text-blue-400" />
            <h1 className="text-2xl font-bold">Printable Puzzle Book Generator</h1>
          </div>
          <div className="flex gap-2 bg-slate-800 rounded-lg p-1">
            <button
              onClick={() => {
                setMode('single');
                setBookStructure(null);
                setBookPuzzles([]);
              }}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                mode === 'single'
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Single Puzzle
            </button>
            <button
              onClick={() => {
                setMode('book');
                setPuzzle(null);
                setGeneratedWords([]);
              }}
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
                Main Theme
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={theme}
                  onChange={(e) => setTheme(e.target.value)}
                  placeholder="e.g., Winter, Gardening..."
                  className="flex-1 px-3 py-2 bg-slate-800 border border-slate-700 rounded-md text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={isGeneratingStructure}
                />
                {mode === 'book' ? (
                  <Button
                    onClick={handleGenerateStructure}
                    disabled={isGeneratingStructure || !theme.trim()}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Search className="h-4 w-4" />
                  </Button>
                ) : (
                  <Button
                    onClick={handleGenerateWords}
                    disabled={isGeneratingWords || !theme.trim()}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Search className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>

            {/* Structure Generation Progress (Book Mode) */}
            {mode === 'book' && isGeneratingStructure && (
              <div className="bg-slate-900 rounded-lg p-4 border border-slate-800">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-300">
                      {structureProgress.status || 'Generating book structure...'}
                    </span>
                    {structureProgress.total > 0 && (
                      <span className="text-xs text-slate-400 font-semibold">
                        {Math.round((structureProgress.current / structureProgress.total) * 100)}%
                      </span>
                    )}
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-3 overflow-hidden">
                    <div 
                      className="bg-blue-600 h-3 rounded-full transition-all duration-200 ease-out"
                      style={{ 
                        width: structureProgress.total > 0 
                          ? `${Math.min((structureProgress.current / structureProgress.total) * 100, 100)}%`
                          : '30%' // Indeterminate progress
                      }}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Chapter Management (Book Mode) */}
            {mode === 'book' && bookStructure && !isGeneratingStructure && (
              <div className="bg-slate-900 rounded-lg p-4 border border-slate-800">
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-sm font-medium text-slate-300">
                    Chapters ({bookStructure.chapters.length})
                  </label>
                </div>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {bookStructure.chapters.map((chapter, index) => (
                    <div key={index} className="bg-slate-800 rounded p-2 flex items-center justify-between group">
                      {editingChapterIndex === index ? (
                        <div className="flex-1 flex gap-1">
                          <input
                            type="text"
                            value={editingTitle}
                            onChange={(e) => setEditingTitle(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleSaveChapter(index);
                              if (e.key === 'Escape') {
                                setEditingChapterIndex(null);
                                setEditingTitle('');
                              }
                            }}
                            className="flex-1 px-2 py-1 bg-slate-700 border border-slate-600 rounded text-sm text-slate-100"
                            autoFocus
                          />
                          <button
                            onClick={() => handleSaveChapter(index)}
                            className="px-2 py-1 bg-blue-600 text-white rounded text-xs"
                          >
                            Save
                          </button>
                        </div>
                      ) : (
                        <>
                          <span className="text-sm text-slate-300 flex-1 truncate">
                            {index + 1}. {chapter.title} ({chapter.words.length} words)
                          </span>
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => handleEditChapter(index)}
                              className="p-1 text-slate-400 hover:text-blue-400"
                              title="Edit"
                            >
                              <Edit2 className="h-3 w-3" />
                            </button>
                            <button
                              onClick={() => handleDeleteChapter(index)}
                              className="p-1 text-slate-400 hover:text-red-400"
                              title="Delete"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
                <Button
                  onClick={handleGeneratePuzzles}
                  disabled={isGeneratingPuzzle || bookStructure.chapters.length === 0}
                  className="w-full mt-3 bg-green-600 hover:bg-green-700"
                  size="sm"
                >
                  {isGeneratingPuzzle 
                    ? `Generating... ${generationProgress.current}/${generationProgress.total}`
                    : 'Generate Pages'
                  }
                </Button>
              </div>
            )}

            {/* Custom Words (Single Mode) */}
            {mode === 'single' && (
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
            )}

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

            {/* Generate Button (Single Mode) */}
            {mode === 'single' && (
              <Button
                onClick={handleGenerateSinglePuzzle}
                disabled={isGeneratingPuzzle || (generatedWords.length === 0 && !customWords.trim())}
                className="w-full bg-blue-600 hover:bg-blue-700"
                size="lg"
              >
                {isGeneratingPuzzle ? 'Generating...' : 'Generate Puzzle'}
              </Button>
            )}

            {/* Progress indicator for puzzle generation */}
            {isGeneratingPuzzle && mode === 'book' && generationProgress.total > 0 && (
              <div className="bg-slate-900 rounded-lg p-4 border border-slate-800">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-300">
                      Generating Puzzles...
                    </span>
                    <span className="text-xs text-slate-400 font-semibold">
                      {Math.round((generationProgress.current / generationProgress.total) * 100)}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-3 overflow-hidden">
                    <div 
                      className="bg-green-600 h-3 rounded-full transition-all duration-200 ease-out"
                      style={{ width: `${Math.min((generationProgress.current / generationProgress.total) * 100, 100)}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span>
                      {bookStructure?.chapters[generationProgress.current - 1]?.title || `Puzzle ${generationProgress.current}`}
                    </span>
                    <span>
                      {generationProgress.current}/{generationProgress.total}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* PDF Download */}
            {mode === 'book' && bookPuzzles.length > 0 && (
              <PDFDownloadButton
                puzzles={bookPuzzles}
                title={bookStructure?.bookTitle || theme || 'Word Search Puzzle Book'}
              />
            )}
            {mode === 'single' && puzzle && (
              <PDFDownloadButton
                puzzles={[{ ...puzzle, chapterTitle: theme || 'Puzzle' }]}
                title={`Word Search - ${theme || 'Puzzle'}`}
              />
            )}
          </aside>

          {/* Right Side - Preview */}
          <main className="overflow-hidden">
            {displayPuzzle ? (
              <PuzzlePreview
                grid={displayPuzzle.grid}
                placedWords={displayPuzzle.placedWords}
                title={mode === 'book' && 'chapterTitle' in displayPuzzle
                  ? `${displayPuzzle.chapterTitle} - Puzzle ${bookPuzzles.findIndex(p => p === displayPuzzle) + 1} of ${bookPuzzles.length}`
                  : theme || 'Word Search Puzzle'
                }
              />
            ) : mode === 'book' && bookStructure ? (
              <div className="h-full flex items-center justify-center bg-slate-900 rounded-lg border border-slate-800">
                <div className="text-center">
                  <BookOpen className="h-16 w-16 mx-auto mb-4 text-slate-600" />
                  <p className="text-slate-400">Click "Generate Pages" to create puzzles for all chapters</p>
                </div>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center bg-slate-900 rounded-lg border border-slate-800">
                <div className="text-center">
                  <Grid3x3 className="h-16 w-16 mx-auto mb-4 text-slate-600" />
                  <p className="text-slate-400">
                    {mode === 'book' 
                      ? 'Enter a theme and click "Generate Book Structure" to create chapters'
                      : 'Enter a theme and generate words to see the puzzle'
                    }
                  </p>
                </div>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
