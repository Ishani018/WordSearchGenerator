'use client';

import { useState, useEffect, useCallback } from 'react';
import { Search, Download, Sparkles, Grid3x3, BookOpen, Edit2, Trash2, Plus, Upload } from 'lucide-react';
import { generateWordsFromTheme } from '@/lib/word-generator';
import { generatePuzzle, type PuzzleResult } from '@/lib/puzzle-generator';
import PuzzlePreview from '@/components/PuzzlePreview';
import PDFDownloadButton from '@/components/PDFDownloadButton';
import PDFPreviewModal from '@/components/PDFPreviewModal';
import { Button } from '@/components/ui/button';
import { AVAILABLE_FONTS } from '@/lib/fonts';

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
  const [numChapters, setNumChapters] = useState(25);
  
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
  
  // PDF front matter options
  const [includeTitlePage, setIncludeTitlePage] = useState(false);
  const [includeBelongsToPage, setIncludeBelongsToPage] = useState(false);
  const [copyrightText, setCopyrightText] = useState('');
  const [selectedFont, setSelectedFont] = useState('helvetica');
  const [fontSize, setFontSize] = useState(1.0); // Font size multiplier (1.0 = 100%, 1.2 = 120%, etc.)
  const [pageSize, setPageSize] = useState<'Letter' | 'A4' | '6x9' | '8x10'>('Letter');

  // Generate book structure (topic expansion) - now handles word generation on client side
  const handleGenerateStructure = useCallback(async () => {
    if (!theme.trim()) return;
    
    setIsGeneratingStructure(true);
    setStructureProgress({ current: 0, total: 100, status: 'Generating sub-themes...' });
    
    try {
      // Step 1: Get chapter titles only (no words)
      const response = await fetch('/api/generate-words', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          theme: theme.trim(),
          mode: 'expand_topic',
          numChapters: numChapters,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to generate book structure');
      }

      const data = await response.json();
      
      // Step 2: Update bookStructure immediately with empty chapters
      setBookStructure(data);
      setBookPuzzles([]);
      
      // Step 3: Generate words for each chapter on client side
      const maxWordLength = gridSize - 2;
      const totalChapters = data.chapters.length;
      
      setStructureProgress({ 
        current: 0, 
        total: totalChapters, 
        status: `Generating words for Chapter 1 of ${totalChapters}...` 
      });
      
      const allSeenWords = new Set<string>();
      const updatedChapters = [...data.chapters];
      
      // Loop through each chapter and generate words
      for (let chapterIndex = 0; chapterIndex < totalChapters; chapterIndex++) {
        const chapter = updatedChapters[chapterIndex];
        
        setStructureProgress({ 
          current: chapterIndex, 
          total: totalChapters, 
          status: `Generating words for Chapter ${chapterIndex + 1} of ${totalChapters}...` 
        });
        
        try {
          // Generate words for this specific chapter
          const wordsResponse = await fetch('/api/generate-words', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              theme: chapter.title,
              count: wordsPerPuzzle * 2, // Request more than needed for variety
              mode: 'words',
              maxWordLength: maxWordLength,
            }),
          });
          
          if (wordsResponse.ok) {
            const wordsData = await wordsResponse.json();
            const words = (wordsData.words || [])
              .map((w: string) => w.toUpperCase().trim())
              .filter((w: string) => {
                const upperWord = w;
                return upperWord.length >= 4 && 
                       upperWord.length <= maxWordLength && 
                       /^[A-Z]+$/.test(upperWord) &&
                       !allSeenWords.has(upperWord);
              });
            
            // Add unique words to seen set
            words.forEach((w: string) => allSeenWords.add(w));
            
            // Update this chapter's words
            updatedChapters[chapterIndex] = {
              ...chapter,
              words: words.slice(0, wordsPerPuzzle)
            };
            
            // Update bookStructure state so user sees progress
            setBookStructure({
              ...data,
              chapters: updatedChapters
            });
          }
        } catch (error) {
          console.error(`Error generating words for chapter "${chapter.title}":`, error);
          // Continue with other chapters even if one fails
        }
        
        // Small delay between chapters to avoid rate limiting
        if (chapterIndex < totalChapters - 1) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }
      
      // Final update
      setStructureProgress({ 
        current: totalChapters, 
        total: totalChapters, 
        status: `Generated ${totalChapters} chapters with words` 
      });
      
    } catch (error) {
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
  }, [theme, wordsPerPuzzle, numChapters, gridSize]);

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

  // Parse CSV file content
  const parseCSV = (csvText: string): { words: string[]; hasClues: boolean } => {
    const lines = csvText.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    if (lines.length === 0) return { words: [], hasClues: false };

    // Check if first line has headers (Word, Clue format)
    const firstLine = lines[0].toLowerCase();
    const hasClues = firstLine.includes('word') && firstLine.includes('clue');
    
    const words: string[] = [];
    const startIndex = hasClues ? 1 : 0; // Skip header row if present

    for (let i = startIndex; i < lines.length; i++) {
      const line = lines[i];
      if (!line) continue;

      // Parse CSV line (handle quoted values)
      const columns = line.split(',').map(col => col.trim().replace(/^"|"$/g, ''));
      
      if (hasClues) {
        // Word, Clue format - extract first column (word)
        if (columns[0]) {
          const word = columns[0].toUpperCase().trim();
          if (word && /^[A-Z]+$/.test(word)) {
            words.push(word);
          }
        }
      } else {
        // Simple word list - each line is a word
        const word = columns[0]?.toUpperCase().trim();
        if (word && /^[A-Z]+$/.test(word)) {
          words.push(word);
        }
      }
    }

    return { words, hasClues };
  };

  // Handle CSV file upload
  const handleCSVImport = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Check file extension
    if (!file.name.toLowerCase().endsWith('.csv')) {
      alert('Please upload a CSV file');
      return;
    }

    try {
      const text = await file.text();
      const { words, hasClues } = parseCSV(text);

      if (words.length === 0) {
        alert('No valid words found in CSV file. Please ensure the file contains words (one per line or in Word, Clue format).');
        return;
      }

      // Generate chapter title from filename (remove .csv extension)
      const chapterTitle = file.name.replace(/\.csv$/i, '').replace(/[_-]/g, ' ').trim() || 'Imported Chapter';

      // Initialize or update book structure
      if (!bookStructure) {
        // Create new book structure
        const newStructure: BookStructure = {
          bookTitle: 'Imported Puzzle Book',
          chapters: [{
            title: chapterTitle,
            words: words
          }]
        };
        setBookStructure(newStructure);
      } else {
        // Add chapter to existing structure
        const updated = { ...bookStructure };
        updated.chapters.push({
          title: chapterTitle,
          words: words
        });
        setBookStructure(updated);
      }

      // Clear file input
      event.target.value = '';

      alert(`✅ Successfully imported ${words.length} words from "${chapterTitle}"`);
    } catch (error) {
      console.error('Error importing CSV:', error);
      alert(`❌ Failed to import CSV file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }, [bookStructure]);

  // Handle multiple CSV files
  const handleMultipleCSVImport = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const validFiles = Array.from(files).filter(file => file.name.toLowerCase().endsWith('.csv'));
    
    if (validFiles.length === 0) {
      alert('Please select CSV files');
      return;
    }

    try {
      let newChapters: Chapter[] = [];
      
      for (const file of validFiles) {
        const text = await file.text();
        const { words } = parseCSV(text);

        if (words.length > 0) {
          const chapterTitle = file.name.replace(/\.csv$/i, '').replace(/[_-]/g, ' ').trim() || 'Imported Chapter';
          newChapters.push({
            title: chapterTitle,
            words: words
          });
        }
      }

      if (newChapters.length === 0) {
        alert('No valid words found in any CSV files');
        return;
      }

      // Initialize or update book structure
      if (!bookStructure) {
        const newStructure: BookStructure = {
          bookTitle: 'Imported Puzzle Book',
          chapters: newChapters
        };
        setBookStructure(newStructure);
      } else {
        const updated = { ...bookStructure };
        updated.chapters.push(...newChapters);
        setBookStructure(updated);
      }

      // Clear file input
      event.target.value = '';

      alert(`✅ Successfully imported ${newChapters.length} chapter(s) from ${validFiles.length} CSV file(s)`);
    } catch (error) {
      console.error('Error importing CSV files:', error);
      alert(`❌ Failed to import CSV files: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }, [bookStructure]);

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
        
        // Show summary if some puzzles failed
        const failedCount = bookStructure!.chapters.length - puzzles.length;
        if (failedCount > 0) {
          const failedChapters = bookStructure!.chapters
            .filter((_, idx) => !puzzles.some(p => p.chapterTitle === bookStructure!.chapters[idx].title))
            .map(c => c.title);
          
          alert(
            `Generated ${puzzles.length} puzzle(s) successfully.\n\n` +
            `${failedCount} puzzle(s) could not be generated:\n` +
            `${failedChapters.join(', ')}\n\n` +
            `This is likely because the words are too long for a ${gridSize}x${gridSize} grid (max word length: ${gridSize - 2}).\n\n` +
            `Try:\n` +
            `- Increasing grid size (currently ${gridSize}x${gridSize})\n` +
            `- Reducing words per puzzle (currently ${wordsPerPuzzle})\n` +
            `- Or regenerate the book structure with shorter words`
          );
        }
        return;
      }

      const chapter = bookStructure!.chapters[index];
      const wordsForPuzzle = chapter.words.slice(0, wordsPerPuzzle);

      // Validate words fit in grid
      const maxWordLength = gridSize - 2;
      const validWords = wordsForPuzzle.filter(w => {
        const word = w.toUpperCase().trim();
        return word.length <= maxWordLength && word.length >= 4 && /^[A-Z]+$/.test(word);
      });
      
      if (validWords.length === 0) {
        console.warn(`No valid words for chapter "${chapter.title}" - all ${wordsForPuzzle.length} words are too long for grid size ${gridSize}x${gridSize} (max word length: ${maxWordLength})`);
        console.warn(`Words in chapter: ${wordsForPuzzle.map(w => `${w} (${w.length})`).join(', ')}`);
        setGenerationProgress({ current: index + 1, total: bookStructure!.chapters.length });
        setTimeout(() => generateNextPuzzle(index + 1), 10);
        return;
      }
      
      if (validWords.length < wordsForPuzzle.length) {
        console.warn(`Chapter "${chapter.title}": Filtered ${wordsForPuzzle.length - validWords.length} words that don't fit (grid: ${gridSize}x${gridSize}, max length: ${maxWordLength})`);
      }

      try {
        const result = generatePuzzle(validWords, gridSize, difficulty);
        
        // Check if we got a reasonable number of placed words
        if (result.placedWords.length === 0) {
          console.warn(`No words could be placed for chapter "${chapter.title}"`);
          setGenerationProgress({ current: index + 1, total: bookStructure!.chapters.length });
          setTimeout(() => generateNextPuzzle(index + 1), 10);
          return;
        }
        
        puzzles.push({
          ...result,
          chapterTitle: chapter.title,
        });
        setGenerationProgress({ current: puzzles.length, total: bookStructure!.chapters.length });
        
        setTimeout(() => generateNextPuzzle(index + 1), 10);
      } catch (error) {
        console.error(`Error generating puzzle for chapter "${chapter.title}":`, error);
        // Continue with next puzzle instead of stopping
        setGenerationProgress({ current: index + 1, total: bookStructure!.chapters.length });
        setTimeout(() => generateNextPuzzle(index + 1), 10);
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
    <div className="min-h-screen bg-slate-950 text-slate-50" suppressHydrationWarning>
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
            {/* Bulk Import CSV (Book Mode) */}
            {mode === 'book' && (
              <div className="bg-slate-900 rounded-lg p-4 border border-slate-800">
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Bulk Import CSV
                </label>
                <p className="text-xs text-slate-400 mb-3">
                  Upload CSV files with words (one per line or Word, Clue format). Each CSV becomes a chapter.
                </p>
                <div className="space-y-2">
                  <label className="block">
                    <input
                      type="file"
                      accept=".csv"
                      multiple
                      onChange={handleMultipleCSVImport}
                      className="hidden"
                      id="csv-import-input"
                    />
                    <Button
                      type="button"
                      onClick={() => document.getElementById('csv-import-input')?.click()}
                      className="w-full bg-purple-600 hover:bg-purple-700"
                      size="sm"
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Import CSV Files
                    </Button>
                  </label>
                </div>
              </div>
            )}

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
              <div className="grid grid-cols-3 gap-2">
                {[8, 10, 12, 15, 18, 20, 22, 25, 30].map((size) => (
                  <button
                    key={size}
                    onClick={() => setGridSize(size)}
                    className={`px-3 py-2 rounded-lg border-2 transition-all text-sm ${
                      gridSize === size
                        ? 'border-blue-500 bg-blue-500/10 text-blue-400'
                        : 'border-slate-700 bg-slate-800 text-slate-300 hover:border-slate-600'
                    }`}
                  >
                    {size}×{size}
                  </button>
                ))}
              </div>
              <div className="mt-2">
                <input
                  type="number"
                  value={gridSize}
                  onChange={(e) => {
                    const val = parseInt(e.target.value);
                    if (val >= 5 && val <= 50) {
                      setGridSize(val);
                    }
                  }}
                  min={5}
                  max={50}
                  placeholder="Custom size"
                  className="w-full px-3 py-2 text-sm bg-slate-800 border border-slate-700 rounded-md text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-slate-400 mt-1">Or enter custom size (5-50)</p>
              </div>
            </div>

            {/* Mode-specific Controls */}
            {mode === 'book' ? (
              <>
                <div className="bg-slate-900 rounded-lg p-4 border border-slate-800">
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Number of Chapters
                  </label>
                  <input
                    type="number"
                    value={numChapters}
                    onChange={(e) => setNumChapters(parseInt(e.target.value) || 25)}
                    min={5}
                    max={100}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-md text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-xs text-slate-400 mt-1">
                    Number of chapters/sub-themes to generate
                  </p>
                </div>
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

            {/* PDF Front Matter Options (Book Mode) */}
            {mode === 'book' && bookPuzzles.length > 0 && (
              <>
                <div className="bg-slate-900 rounded-lg p-4 border border-slate-800">
                  <h3 className="text-sm font-semibold text-slate-300 mb-3">PDF Options</h3>
                  
                  {/* Include Title Page */}
                  <label className="flex items-center gap-2 mb-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={includeTitlePage}
                      onChange={(e) => setIncludeTitlePage(e.target.checked)}
                      className="w-4 h-4 text-blue-600 bg-slate-800 border-slate-700 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm text-slate-300">Include Title Page</span>
                  </label>
                  
                  {/* Include "This Book Belongs To" Page */}
                  <label className="flex items-center gap-2 mb-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={includeBelongsToPage}
                      onChange={(e) => setIncludeBelongsToPage(e.target.checked)}
                      className="w-4 h-4 text-blue-600 bg-slate-800 border-slate-700 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm text-slate-300">Include "This Book Belongs To" Page</span>
                  </label>
                  
                  {/* Copyright Text */}
                  {includeTitlePage && (
                    <div className="mt-3">
                      <label className="block text-xs text-slate-400 mb-1">
                        Copyright Text (optional)
                      </label>
                      <input
                        type="text"
                        value={copyrightText}
                        onChange={(e) => setCopyrightText(e.target.value)}
                        placeholder="Your Name or Company"
                        className="w-full px-2 py-1.5 text-sm bg-slate-800 border border-slate-700 rounded-md text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  )}
                  
                  {/* Answer Key Style */}
                  {/* Page Size */}
                  <div className="mt-3">
                    <label className="block text-xs text-slate-400 mb-1">
                      Page Size
                    </label>
                    <select
                      value={pageSize}
                      onChange={(e) => setPageSize(e.target.value as 'Letter' | 'A4' | '6x9' | '8x10')}
                      className="w-full px-2 py-1.5 text-sm bg-slate-800 border border-slate-700 rounded-md text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="Letter">Letter (8.5" × 11")</option>
                      <option value="A4">A4 (8.27" × 11.69")</option>
                      <option value="6x9">6" × 9"</option>
                      <option value="8x10">8" × 10"</option>
                    </select>
                  </div>

                  {/* Font Selection */}
                  <div className="mt-3">
                    <label className="block text-xs text-slate-400 mb-1">
                      Font
                    </label>
                    <select
                      value={selectedFont}
                      onChange={(e) => setSelectedFont(e.target.value)}
                      className="w-full px-2 py-1.5 text-sm bg-slate-800 border border-slate-700 rounded-md text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {AVAILABLE_FONTS.map((font) => {
                        // Get font family name for preview
                        let fontFamily = 'inherit';
                        if (font.type === 'standard') {
                          fontFamily = font.id === 'helvetica' ? 'Helvetica, Arial, sans-serif' :
                                       font.id === 'times' ? 'Times, "Times New Roman", serif' :
                                       font.id === 'courier' ? 'Courier, "Courier New", monospace' : 'inherit';
                        } else if (font.type === 'google') {
                          // Map font IDs to Google Font names
                          const fontMap: { [key: string]: string } = {
                            'roboto': 'Roboto, sans-serif',
                            'roboto-bold': 'Roboto, sans-serif',
                            'open-sans': '"Open Sans", sans-serif',
                            'open-sans-bold': '"Open Sans", sans-serif',
                            'lora': 'Lora, serif',
                            'lora-bold': 'Lora, serif',
                            'playfair-display': '"Playfair Display", serif',
                            'playfair-display-bold': '"Playfair Display", serif',
                          };
                          fontFamily = fontMap[font.id] || 'inherit';
                        }
                        
                        return (
                          <option
                            key={font.id}
                            value={font.id}
                            style={{ fontFamily }}
                          >
                            {font.name}
                          </option>
                        );
                      })}
                    </select>
                  </div>
                  
                  {/* Font Size */}
                  <div className="mt-3">
                    <label className="block text-xs text-slate-400 mb-1">
                      Font Size ({Math.round(fontSize * 100)}%)
                    </label>
                    <input
                      type="range"
                      min="0.7"
                      max="1.5"
                      step="0.05"
                      value={fontSize}
                      onChange={(e) => setFontSize(parseFloat(e.target.value))}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-slate-500 mt-1">
                      <span>70%</span>
                      <span>100%</span>
                      <span>150%</span>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <PDFPreviewModal
                    puzzles={bookPuzzles}
                    title={bookStructure?.bookTitle || theme || 'Word Search Puzzle Book'}
                    includeTitlePage={includeTitlePage}
                    includeBelongsToPage={includeBelongsToPage}
                    copyrightText={copyrightText}
                    fontId={selectedFont}
                    fontSize={fontSize}
                    pageSize={pageSize}
                  />
                  <PDFDownloadButton
                    puzzles={bookPuzzles}
                    title={bookStructure?.bookTitle || theme || 'Word Search Puzzle Book'}
                    includeTitlePage={includeTitlePage}
                    includeBelongsToPage={includeBelongsToPage}
                    copyrightText={copyrightText}
                    fontId={selectedFont}
                    fontSize={fontSize}
                    pageSize={pageSize}
                  />
                </div>
              </>
            )}
            {mode === 'single' && puzzle && (
              <>
                <div className="bg-slate-900 rounded-lg p-4 border border-slate-800">
                  <div className="mt-3">
                    <label className="block text-xs text-slate-400 mb-1">
                      Font
                    </label>
                    <select
                      value={selectedFont}
                      onChange={(e) => setSelectedFont(e.target.value)}
                      className="w-full px-2 py-1.5 text-sm bg-slate-800 border border-slate-700 rounded-md text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {AVAILABLE_FONTS.map((font) => {
                        // Get font family name for preview
                        let fontFamily = 'inherit';
                        if (font.type === 'standard') {
                          fontFamily = font.id === 'helvetica' ? 'Helvetica, Arial, sans-serif' :
                                       font.id === 'times' ? 'Times, "Times New Roman", serif' :
                                       font.id === 'courier' ? 'Courier, "Courier New", monospace' : 'inherit';
                        } else if (font.type === 'google') {
                          // Map font IDs to Google Font names
                          const fontMap: { [key: string]: string } = {
                            'roboto': 'Roboto, sans-serif',
                            'roboto-bold': 'Roboto, sans-serif',
                            'open-sans': '"Open Sans", sans-serif',
                            'open-sans-bold': '"Open Sans", sans-serif',
                            'lora': 'Lora, serif',
                            'lora-bold': 'Lora, serif',
                            'playfair-display': '"Playfair Display", serif',
                            'playfair-display-bold': '"Playfair Display", serif',
                          };
                          fontFamily = fontMap[font.id] || 'inherit';
                        }
                        
                        return (
                          <option
                            key={font.id}
                            value={font.id}
                            style={{ fontFamily }}
                          >
                            {font.name}
                          </option>
                        );
                      })}
                    </select>
                  </div>
                  
                  {/* Font Size */}
                  <div className="mt-3">
                    <label className="block text-xs text-slate-400 mb-1">
                      Font Size ({Math.round(fontSize * 100)}%)
                    </label>
                    <input
                      type="range"
                      min="0.7"
                      max="1.5"
                      step="0.05"
                      value={fontSize}
                      onChange={(e) => setFontSize(parseFloat(e.target.value))}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-slate-500 mt-1">
                      <span>70%</span>
                      <span>100%</span>
                      <span>150%</span>
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <PDFPreviewModal
                    puzzles={[{ ...puzzle, chapterTitle: theme || 'Puzzle' }]}
                    title={`Word Search - ${theme || 'Puzzle'}`}
                    fontId={selectedFont}
                    fontSize={fontSize}
                    pageSize={pageSize}
                  />
                  <PDFDownloadButton
                    puzzles={[{ ...puzzle, chapterTitle: theme || 'Puzzle' }]}
                    title={`Word Search - ${theme || 'Puzzle'}`}
                    fontId={selectedFont}
                    fontSize={fontSize}
                    pageSize={pageSize}
                  />
                </div>
              </>
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
