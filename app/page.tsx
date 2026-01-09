'use client';

import { useState, useEffect, useCallback } from 'react';
import { Search, Download, Sparkles, Grid3x3, BookOpen, Edit2, Trash2, Plus, Upload, FilePlus, ChevronUp, ChevronDown, File, FileText, Type, Copy, Check, HelpCircle, Info } from 'lucide-react';
import { generateWordsFromTheme } from '@/lib/word-generator';
import { generatePuzzle, type PuzzleResult } from '@/lib/puzzle-generator';
import { generateSudoku, generateSudokuPuzzles, type SudokuPuzzle } from '@/lib/sudoku-generator';
import PuzzlePreview from '@/components/PuzzlePreview';
import SudokuPreview from '@/components/SudokuPreview';
import { PDFPageItem } from '@/components/PDFDownloadButton';
import { Button } from '@/components/ui/button';
import ExportModal from '@/components/ExportModal';
import { AVAILABLE_FONTS } from '@/lib/fonts';
import { validateWords } from '@/lib/word-validator';
import LoginForm from '@/components/LoginForm';
import { checkAuthStatus, logout as logoutClient } from '@/lib/auth-client';
import { useAlert } from '@/lib/alert';
import { useToast } from '@/components/ui/toast';
import InstructionsPanel from '@/components/InstructionsPanel';
import HelpModal from '@/components/HelpModal';

type Mode = 'book' | 'single';
type PuzzleType = 'word-search' | 'sudoku';
type Difficulty = 'easy' | 'medium' | 'hard' | 'expert';

// KDP Standard Sizes
const PAGE_SIZES = [
  { name: '5 x 8 in', width: 5, height: 8 },
  { name: '5.25 x 8 in', width: 5.25, height: 8 },
  { name: '5.5 x 8.5 in', width: 5.5, height: 8.5 },
  { name: '6 x 9 in (Standard KDP)', width: 6, height: 9 },
  { name: '7 x 10 in', width: 7, height: 10 },
  { name: '8.5 x 8.5 in (Square)', width: 8.5, height: 8.5 },
  { name: '8.5 x 11 in (Letter)', width: 8.5, height: 11 },
  { name: '8.27 x 11.69 in (A4)', width: 8.27, height: 11.69 },
];

interface Chapter {
  title: string;
  words: string[];
  isBlank?: boolean; // New Flag
}

interface BookStructure {
  bookTitle: string;
  chapters: Chapter[];
}

export default function Home() {
  // Authentication state
  const [isAuthenticated, setIsAuthenticatedState] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [showModeSelection, setShowModeSelection] = useState(false);

  // App state (declared before auth check)
  const [puzzleType, setPuzzleType] = useState<PuzzleType | null>(null);
  const [mode, setMode] = useState<Mode>('book');
  const [theme, setTheme] = useState('');
  const [customWords, setCustomWords] = useState('');
  const [gridSize, setGridSize] = useState(15);
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  
  // Book mode settings
  const [wordsPerPuzzle, setWordsPerPuzzle] = useState(15);
  const [numChapters, setNumChapters] = useState(2);
  
  // Single puzzle settings
  const [singleWords, setSingleWords] = useState(20);
  
  // Chapter management
  const [bookStructure, setBookStructure] = useState<BookStructure | null>(null);
  const [editingChapterIndex, setEditingChapterIndex] = useState<number | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [editingWordsIndex, setEditingWordsIndex] = useState<number | null>(null);
  const [editingWords, setEditingWords] = useState<string>('');
  const [kdpDescription, setKdpDescription] = useState<string | null>(null);
  const [kdpTitles, setKdpTitles] = useState<string[] | null>(null);
  const [isGeneratingKdpContent, setIsGeneratingKdpContent] = useState(false);
  const [kdpContentType, setKdpContentType] = useState<'description' | 'titles' | null>(null);
  const [copiedText, setCopiedText] = useState<string | null>(null);
  const [showHelpModal, setShowHelpModal] = useState(false);
  
  // Generated data
  const [generatedWords, setGeneratedWords] = useState<string[]>([]);
  const [puzzle, setPuzzle] = useState<PuzzleResult | null>(null);
  const [sudokuPuzzle, setSudokuPuzzle] = useState<SudokuPuzzle | null>(null);
  const [bookPuzzles, setBookPuzzles] = useState<PDFPageItem[]>([]);
  const [bookSudokus, setBookSudokus] = useState<SudokuPuzzle[]>([]);
  const [isGeneratingWords, setIsGeneratingWords] = useState(false);
  const [isGeneratingStructure, setIsGeneratingStructure] = useState(false);
  const [isGeneratingPuzzle, setIsGeneratingPuzzle] = useState(false);
  const [generationProgress, setGenerationProgress] = useState({ current: 0, total: 0 });
  const [structureProgress, setStructureProgress] = useState({ current: 0, total: 0, status: '' });
  const [wordGenerationProgress, setWordGenerationProgress] = useState({ current: 0, total: 0, status: '' });
  
  // Page Settings
  const [pageSize, setPageSize] = useState(PAGE_SIZES[6]); // Default Letter
  const [customPageSize, setCustomPageSize] = useState({ width: 8.5, height: 11 });
  const [isCustomSize, setIsCustomSize] = useState(false);
  
  // PDF front matter options
  const [includeTitlePage, setIncludeTitlePage] = useState(false);
  const [includeBelongsToPage, setIncludeBelongsToPage] = useState(false);
  const [copyrightText, setCopyrightText] = useState('');
  const [selectedFont, setSelectedFont] = useState('helvetica');
  const [fontSize, setFontSize] = useState(10); // Font size in points (like MS Word/Google Docs)
  const [headingSize, setHeadingSize] = useState(16); // Heading size in points for puzzle titles
  const [enableWordValidation, setEnableWordValidation] = useState(true); // Enable dictionary validation
  const [csvWordsPerPuzzle, setCsvWordsPerPuzzle] = useState(15); // Words per puzzle for CSV import
  const [selectedPuzzleIndex, setSelectedPuzzleIndex] = useState<number | null>(null); // Selected puzzle index for preview
  const [addBlankPagesBetweenChapters, setAddBlankPagesBetweenChapters] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  
  // CSV import state - store CSV content before processing
  const [pendingCSV, setPendingCSV] = useState<{ content: string; fileName: string } | null>(null);
  const [csvGridSize, setCsvGridSize] = useState(15); // Grid size for CSV import
  
  // Collapsible sections state
  const [isContentSectionOpen, setIsContentSectionOpen] = useState(true);
  const [isSettingsSectionOpen, setIsSettingsSectionOpen] = useState(false);
  const [isBookConfigSectionOpen, setIsBookConfigSectionOpen] = useState(false);
  
  // Keep Sudoku Settings open by default
  useEffect(() => {
    if (puzzleType === 'sudoku') {
      setIsSettingsSectionOpen(true);
    }
  }, [puzzleType]);
  
  // Page Margin Settings (in inches, converted to percentage for display)
  const [margins, setMargins] = useState({ left: 0.5, right: 0.5, top: 0.5, bottom: 0.5 });

  // Authentication handlers
  const handleLogin = () => {
    setIsAuthenticatedState(true);
    setShowModeSelection(true); // Show mode selection modal after login
  };

  const handleLogout = async () => {
    await logoutClient();
    setIsAuthenticatedState(false);
  };

  // Check authentication on mount
  useEffect(() => {
    const verifyAuth = async () => {
      try {
        const authStatus = await checkAuthStatus();
        setIsAuthenticatedState(authStatus);
      } catch (error) {
        console.error('Auth check failed:', error);
        setIsAuthenticatedState(false);
      } finally {
        setIsCheckingAuth(false);
      }
    };
    verifyAuth();
  }, []);

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
            let words = (wordsData.words || [])
              .map((w: string) => w.toUpperCase().trim())
              .filter((w: string) => {
                const upperWord = w;
                return upperWord.length >= 3 && 
                       upperWord.length <= maxWordLength && 
                       /^[A-Z]+$/.test(upperWord) &&
                       !allSeenWords.has(upperWord);
              });
            
            // Validate words if enabled
            if (enableWordValidation && words.length > 0) {
              setStructureProgress({ 
                current: chapterIndex, 
                total: totalChapters, 
                status: `Validating words for Chapter ${chapterIndex + 1} of ${totalChapters}...` 
              });
              const { valid } = await validateWords(words);
              words = valid;
            }
            
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
  }, [theme, numChapters, wordsPerPuzzle, gridSize, enableWordValidation]);

  // Generate single Sudoku puzzle
  const handleGenerateSingleSudoku = useCallback(() => {
    setIsGeneratingPuzzle(true);
    try {
      const sudoku = generateSudoku(difficulty);
      setSudokuPuzzle(sudoku);
      setPuzzle(null); // Clear word search puzzle
    } catch (error) {
      console.error('Error generating Sudoku:', error);
      alert('❌ Failed to generate Sudoku puzzle');
    } finally {
      setIsGeneratingPuzzle(false);
    }
  }, [difficulty]);

  // Generate words from theme (for single puzzle mode)
  const handleGenerateWords = useCallback(async () => {
    if (!theme.trim()) return;
    
    setIsGeneratingWords(true);
    setWordGenerationProgress({ current: 0, total: 100, status: 'Generating words from AI...' });
    
    try {
      const wordCount = singleWords * 2;
      
      setWordGenerationProgress({ current: 20, total: 100, status: 'Requesting words from AI...' });
      
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

      setWordGenerationProgress({ current: 50, total: 100, status: 'Processing words...' });
      
      const data = await response.json();
      
      if (data.warning) {
        console.warn('Warning:', data.warning);
        alert(`⚠️ ${data.warning}`);
      }
      
      let words = data.words || [];
      
      // Validate words if enabled
      if (enableWordValidation && words.length > 0) {
        setWordGenerationProgress({ current: 60, total: 100, status: 'Filtering words by grid size...' });
        
        const maxWordLength = gridSize - 2;
        // First filter by grid size
        words = words
          .map((w: string) => w.toUpperCase().trim())
          .filter((w: string) => {
            const upperWord = w;
            return upperWord.length >= 3 && 
                   upperWord.length <= maxWordLength && 
                   /^[A-Z]+$/.test(upperWord);
          });
        
        // Then validate with dictionary API
        if (words.length > 0) {
          setWordGenerationProgress({ current: 70, total: 100, status: `Validating ${words.length} words...` });
          const { valid } = await validateWords(words);
          words = valid;
          setWordGenerationProgress({ current: 90, total: 100, status: 'Finalizing...' });
        }
      } else {
        setWordGenerationProgress({ current: 70, total: 100, status: 'Filtering words by grid size...' });
        
        // Still filter by grid size even if validation is disabled
        const maxWordLength = gridSize - 2;
        words = words
          .map((w: string) => w.toUpperCase().trim())
          .filter((w: string) => {
            const upperWord = w;
            return upperWord.length >= 3 && 
                   upperWord.length <= maxWordLength && 
                   /^[A-Z]+$/.test(upperWord);
          });
        setWordGenerationProgress({ current: 90, total: 100, status: 'Finalizing...' });
      }
      
      setWordGenerationProgress({ current: 100, total: 100, status: `Generated ${words.length} words!` });
      setGeneratedWords(words);
    } catch (error) {
      console.error('Error generating words:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to generate words';
      alert(`❌ ${errorMessage}\n\nMake sure GROQ_API_KEY is set in your environment variables.`);
      setWordGenerationProgress({ current: 0, total: 0, status: '' });
    } finally {
      setTimeout(() => {
        setIsGeneratingWords(false);
        setTimeout(() => setWordGenerationProgress({ current: 0, total: 0, status: '' }), 2000);
      }, 500);
    }
  }, [theme, singleWords, gridSize, enableWordValidation]);

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

  // Edit chapter words
  const handleEditWords = (index: number) => {
    if (bookStructure && !bookStructure.chapters[index].isBlank) {
      setEditingWordsIndex(index);
      setEditingWords(bookStructure.chapters[index].words.join(', '));
    }
  };

  // Save chapter words edit
  const handleSaveWords = (index: number) => {
    if (bookStructure && editingWordsIndex === index) {
      const updated = { ...bookStructure };
      // Parse words from comma-separated or newline-separated string
      const words = editingWords
        .split(/[,\n]/)
        .map(w => w.trim().toUpperCase())
        .filter(w => w.length >= 3 && /^[A-Z]+$/.test(w));
      
      updated.chapters[index].words = words;
      setBookStructure(updated);
      setEditingWordsIndex(null);
      setEditingWords('');
      setBookPuzzles([]); // Clear generated puzzles since words changed
    }
  };

  // Cancel word editing
  const handleCancelEditWords = () => {
    setEditingWordsIndex(null);
    setEditingWords('');
  };

  // Get alert and toast functions
  const { alert: showAlert } = useAlert();
  const { toast: showToast } = useToast();

  // Generate KDP Description
  const handleGenerateKdpDescription = async () => {
    if (!bookStructure || bookStructure.chapters.length === 0) {
      await showAlert({ message: 'Please generate book structure with chapters first' });
      return;
    }

    const chapterTitles = bookStructure.chapters
      .filter(c => !c.isBlank)
      .map(c => c.title);

    if (chapterTitles.length === 0) {
      await showAlert({ message: 'Please add at least one chapter with a title' });
      return;
    }

    setIsGeneratingKdpContent(true);
    setKdpContentType('description');
    setKdpDescription(null);

    try {
      const response = await fetch('/api/generate-kdp-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'description',
          bookTitle: bookStructure.bookTitle,
          chapterTitles,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate description');
      }

      setKdpDescription(data.description);
      showToast('Description generated successfully!', 'success');
    } catch (error) {
      console.error('Error generating KDP description:', error);
      await showAlert({ message: error instanceof Error ? error.message : 'Failed to generate description' });
    } finally {
      setIsGeneratingKdpContent(false);
    }
  };

  // Generate Book Titles
  const handleGenerateBookTitles = async () => {
    if (!bookStructure || bookStructure.chapters.length === 0) {
      await showAlert({ message: 'Please generate book structure with chapters first' });
      return;
    }

    const chapterTitles = bookStructure.chapters
      .filter(c => !c.isBlank)
      .map(c => c.title);

    if (chapterTitles.length === 0) {
      await showAlert({ message: 'Please add at least one chapter with a title' });
      return;
    }

    setIsGeneratingKdpContent(true);
    setKdpContentType('titles');
    setKdpTitles(null);

    try {
      const response = await fetch('/api/generate-kdp-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'titles',
          bookTitle: bookStructure.bookTitle,
          chapterTitles,
          count: 5,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate titles');
      }

      setKdpTitles(data.titles);
      showToast('Titles generated successfully!', 'success');
    } catch (error) {
      console.error('Error generating book titles:', error);
      await showAlert({ message: error instanceof Error ? error.message : 'Failed to generate titles' });
    } finally {
      setIsGeneratingKdpContent(false);
    }
  };

  // Copy text to clipboard with fallback
  const handleCopyToClipboard = async (text: string, type: string) => {
    try {
      // Try modern clipboard API first
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
        setCopiedText(type);
        showToast('Copied to clipboard!', 'success');
        setTimeout(() => setCopiedText(null), 2000);
      } else {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        try {
          const successful = document.execCommand('copy');
          if (successful) {
            setCopiedText(type);
            showToast('Copied to clipboard!', 'success');
            setTimeout(() => setCopiedText(null), 2000);
          } else {
            throw new Error('execCommand failed');
          }
        } finally {
          document.body.removeChild(textArea);
        }
      }
    } catch (error) {
      console.error('Failed to copy:', error);
      // Don't show alert for clipboard errors, just log
      showToast('Copy failed. Please select and copy manually.', 'error');
    }
  };

  // Delete chapter
  const handleDeleteChapter = (index: number) => {
    if (bookStructure) {
      const chapter = bookStructure.chapters[index];
      const isBlank = chapter.isBlank;
      if (confirm(isBlank ? "Remove this blank page?" : `Delete chapter "${chapter.title}"?`)) {
        const updated = { ...bookStructure };
        updated.chapters.splice(index, 1);
        setBookStructure(updated);
        setBookPuzzles([]);
      }
    }
  };

  // NEW: Add Blank Page
  const handleAddBlankPage = () => {
    if (!bookStructure) {
      setBookStructure({ bookTitle: 'My Puzzle Book', chapters: [] });
    }
    setBookStructure(prev => {
      if (!prev) return null;
      return {
        ...prev,
        chapters: [...prev.chapters, { title: 'Blank Page', words: [], isBlank: true }]
      };
    });
  };

  // NEW: Move Chapter
  const moveChapter = (index: number, direction: 'up' | 'down') => {
    if (!bookStructure) return;
    const newChapters = [...bookStructure.chapters];
    if (direction === 'up' && index > 0) {
      [newChapters[index], newChapters[index - 1]] = [newChapters[index - 1], newChapters[index]];
    } else if (direction === 'down' && index < newChapters.length - 1) {
      [newChapters[index], newChapters[index + 1]] = [newChapters[index + 1], newChapters[index]];
    }
    setBookStructure({ ...bookStructure, chapters: newChapters });
    setBookPuzzles([]); // Reset puzzles as order changed
  };

  // Parse CSV file content
  // Helper function to check if a string looks like a title (not a word)
  const looksLikeTitle = (text: string): boolean => {
    if (!text) return false;
    // Titles typically have spaces, punctuation, or are longer than typical words
    return text.includes(' ') || text.length > 20 || /[^A-Za-z0-9\s]/.test(text);
  };

  // Helper function to check if a line is a title marker
  const isTitleMarker = (line: string): boolean => {
    const lower = line.toLowerCase().trim();
    return lower.startsWith('#title:') || lower.startsWith('title:') || lower.startsWith('chapter:');
  };

  // Extract title from a title marker line
  const extractTitleFromMarker = (line: string): string | null => {
    const match = line.match(/^(?:#)?title:\s*(.+)$/i) || line.match(/^chapter:\s*(.+)$/i);
    return match ? match[1].trim() : null;
  };

  const parseCSV = (csvText: string): { 
    words: string[]; 
    hasClues: boolean;
    chapters?: Array<{ title: string; words: string[] }>;
  } => {
    const lines = csvText.split('\n').map(line => line.trim());
    if (lines.length === 0) return { words: [], hasClues: false };

    // Check if first line has headers (Word, Clue format)
    const firstLine = lines[0].toLowerCase();
    const hasClues = firstLine.includes('word') && firstLine.includes('clue');
    
    // Try to detect if CSV has chapter titles
    let hasTitles = false;
    let chapters: Array<{ title: string; words: string[] }> = [];
    
    // Check for title markers or title-like first columns
    for (const line of lines) {
      if (!line) continue;
      if (isTitleMarker(line)) {
        hasTitles = true;
        break;
      }
      const columns = line.split(',').map(col => col.trim().replace(/^"|"$/g, ''));
      if (columns.length > 1 && looksLikeTitle(columns[0])) {
        hasTitles = true;
        break;
      }
    }

    // If titles detected, parse chapters
    if (hasTitles) {
      let currentTitle: string | null = null;
      let currentWords: string[] = [];
      const startIndex = hasClues ? 1 : 0;

      for (let i = startIndex; i < lines.length; i++) {
        const line = lines[i];
        if (!line) {
          // Empty line - if we have a title and words, save the chapter
          if (currentTitle && currentWords.length > 0) {
            chapters.push({ title: currentTitle, words: currentWords });
            currentTitle = null;
            currentWords = [];
          }
          continue;
        }

        // Check if this is a title marker
        if (isTitleMarker(line)) {
          // Save previous chapter if exists
          if (currentTitle && currentWords.length > 0) {
            chapters.push({ title: currentTitle, words: currentWords });
          }
          // Extract new title
          currentTitle = extractTitleFromMarker(line) || 'Untitled Chapter';
          currentWords = [];
          continue;
        }

        // Parse CSV line
        const columns = line.split(',').map(col => col.trim().replace(/^"|"$/g, ''));
        
        // Check if first column is a title
        if (columns.length > 1 && looksLikeTitle(columns[0])) {
          // Save previous chapter if exists
          if (currentTitle && currentWords.length > 0) {
            chapters.push({ title: currentTitle, words: currentWords });
          }
          // First column is title, rest are words
          currentTitle = columns[0];
          currentWords = [];
          
          // Extract words from remaining columns
          for (let j = 1; j < columns.length; j++) {
            const word = columns[j]?.toUpperCase().trim();
            if (word && /^[A-Z]+$/.test(word) && word.length >= 3) {
              currentWords.push(word);
            }
          }
        } else {
          // Regular word line
          if (hasClues) {
            // Word, Clue format - extract first column (word)
            if (columns[0]) {
              const word = columns[0].toUpperCase().trim();
              if (word && /^[A-Z]+$/.test(word)) {
                if (currentTitle) {
                  currentWords.push(word);
                } else {
                  // No title yet, use default
                  if (chapters.length === 0 || chapters[chapters.length - 1].words.length > 0) {
                    chapters.push({ title: 'Chapter ' + (chapters.length + 1), words: [] });
                  }
                  chapters[chapters.length - 1].words.push(word);
                }
              }
            }
          } else {
            // Simple word list
            const word = columns[0]?.toUpperCase().trim();
            if (word && /^[A-Z]+$/.test(word)) {
              if (currentTitle) {
                currentWords.push(word);
              } else {
                // No title yet, use default
                if (chapters.length === 0 || chapters[chapters.length - 1].words.length > 0) {
                  chapters.push({ title: 'Chapter ' + (chapters.length + 1), words: [] });
                }
                chapters[chapters.length - 1].words.push(word);
              }
            }
          }
        }
      }

      // Save last chapter if exists
      if (currentTitle && currentWords.length > 0) {
        chapters.push({ title: currentTitle, words: currentWords });
      } else if (currentTitle && currentWords.length === 0 && chapters.length > 0) {
        // Title with no words - merge with previous or create empty
        chapters.push({ title: currentTitle, words: [] });
      }

      // Filter out empty chapters
      chapters = chapters.filter(ch => ch.words.length > 0);

      if (chapters.length > 0) {
        return { words: [], hasClues, chapters };
      }
    }

    // Fallback to original parsing (no titles detected)
    const words: string[] = [];
    const startIndex = hasClues ? 1 : 0;

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

  // Handle CSV file upload - just store the content, don't process yet
  const handleCSVFileSelect = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Check file extension
    if (!file.name.toLowerCase().endsWith('.csv')) {
      await showAlert({ message: 'Please upload a CSV file' });
      event.target.value = '';
      return;
    }

    try {
      const text = await file.text();
      // Store CSV content for processing after grid size selection
      setPendingCSV({ content: text, fileName: file.name });
      // Reset grid size to default
      setCsvGridSize(15);
      event.target.value = '';
    } catch (error) {
      console.error('Error reading CSV file:', error);
      await showAlert({ message: `❌ Failed to read CSV file: ${error instanceof Error ? error.message : 'Unknown error'}` });
      event.target.value = '';
    }
  }, [showAlert]);

  // Process CSV import after grid size is selected
  const processCSVImport = useCallback(async () => {
    if (!pendingCSV) return;

    try {
      const parseResult = parseCSV(pendingCSV.content);

      // Check if CSV has chapters with titles
      if (parseResult.chapters && parseResult.chapters.length > 0) {
        console.log(`CSV Import: Detected ${parseResult.chapters.length} chapters with titles`);
        
        // Filter and validate words in each chapter
        const maxWordLength = csvGridSize - 2;
        const processedChapters: Array<{ title: string; words: string[] }> = [];
        let totalWords = 0;
        let totalRemoved = 0;

        for (const chapter of parseResult.chapters) {
          // Filter words by grid size
          const wordsFilteredBySize = chapter.words.filter(w => {
            const word = w.toUpperCase().trim();
            return word.length >= 3 && word.length <= maxWordLength && /^[A-Z]+$/.test(word);
          });

          // Validate words if enabled
          let finalWords = wordsFilteredBySize;
          if (enableWordValidation && wordsFilteredBySize.length > 0) {
            const { valid } = await validateWords(wordsFilteredBySize, () => {});
            finalWords = valid;
          }

          if (finalWords.length > 0) {
            processedChapters.push({
              title: chapter.title,
              words: finalWords
            });
            totalWords += finalWords.length;
            totalRemoved += chapter.words.length - finalWords.length;
          }
        }

        if (processedChapters.length === 0) {
          await showAlert({ 
            message: '❌ No valid words found in any chapter. Please check your CSV file format and grid size settings.' 
          });
          setPendingCSV(null);
          return;
        }

        // Initialize or update book structure
        const newStructure: BookStructure = {
          bookTitle: bookStructure?.bookTitle || 'Imported Puzzle Book',
          chapters: bookStructure ? [...bookStructure.chapters, ...processedChapters] : processedChapters
        };
        setBookStructure(newStructure);
        
        // Auto-expand Content section
        setIsContentSectionOpen(true);

        // Build success message (shortened)
        let message = `✅ Imported ${processedChapters.length} chapter(s) with ${totalWords} word(s)`;
        if (totalRemoved > 0) {
          message += `\n⚠️ ${totalRemoved} word(s) removed (didn't fit grid or failed validation)`;
        }

        setPendingCSV(null);
        await showAlert({ message });
        return;
      }

      // Fallback: Original behavior (no titles in CSV, split by csvWordsPerPuzzle)
      const { words, hasClues } = parseResult;

      console.log(`CSV Import: Parsed ${words.length} words from file "${pendingCSV?.fileName}"`);
      console.log(`CSV Import: Sample words:`, words.slice(0, 5));

      if (words.length === 0) {
        await showAlert({ message: 'No valid words found in CSV file. Please ensure the file contains words (one per line or in Word, Clue format).' });
        setPendingCSV(null);
        return;
      }

      // Filter words by grid size
      const maxWordLength = csvGridSize - 2;
      console.log(`CSV Import: Filtering words for ${csvGridSize}x${csvGridSize} grid (max length: ${maxWordLength})`);
      const wordsFilteredBySize = words.filter(w => {
        const word = w.toUpperCase().trim();
        const isValid = word.length >= 3 && word.length <= maxWordLength && /^[A-Z]+$/.test(word);
        if (!isValid) {
          console.log(`CSV Import: Rejected "${word}" - length: ${word.length}, valid: ${/^[A-Z]+$/.test(word)}`);
        }
        return isValid;
      });
      console.log(`CSV Import: ${wordsFilteredBySize.length} words passed size filter (out of ${words.length})`);

      if (wordsFilteredBySize.length === 0) {
        // Show which words were rejected and why
        const rejectedWords: Array<{ word: string; reason: string }> = [];
        for (const word of words) {
          const cleanWord = word.toUpperCase().trim();
          if (cleanWord.length < 3) {
            rejectedWords.push({ word: cleanWord, reason: `Too short (${cleanWord.length} letters, min: 3)` });
          } else if (cleanWord.length > maxWordLength) {
            rejectedWords.push({ word: cleanWord, reason: `Too long (${cleanWord.length} letters, max: ${maxWordLength})` });
          } else if (!/^[A-Z]+$/.test(cleanWord)) {
            rejectedWords.push({ word: cleanWord, reason: `Contains non-letter characters` });
          }
        }
        
        const rejectedSample = rejectedWords.slice(0, 10);
        const rejectedText = rejectedSample.map(r => `  • "${r.word}" - ${r.reason}`).join('\n');
        const moreText = rejectedWords.length > 10 ? `\n  ... and ${rejectedWords.length - 10} more` : '';
        
        await showAlert({
          message: `❌ No words fit the selected grid size (${csvGridSize}x${csvGridSize}).\n\n` +
          `All ${words.length} words were rejected:\n${rejectedText}${moreText}\n\n` +
          `Try:\n` +
          `- Increasing grid size (currently ${csvGridSize}x${csvGridSize})\n` +
          `- Checking your CSV file format`
        });
        setPendingCSV(null);
        return;
      }

      // Validate words if enabled
      let finalWords = wordsFilteredBySize;
      let invalidWords: string[] = [];
      
      if (enableWordValidation) {
        showToast('Validating words... This may take a moment.', 'info');
        const { valid, invalid } = await validateWords(wordsFilteredBySize, (validated, total) => {
          console.log(`Validated ${validated}/${total} words...`);
        });
        finalWords = valid;
        invalidWords = invalid;
      }

      if (finalWords.length === 0) {
        await showAlert({ message: '❌ No valid words found after validation. Please check your CSV file.' });
        setPendingCSV(null);
        return;
      }

      // Split words into chapters based on csvWordsPerPuzzle
      const chapters: Array<{ title: string; words: string[] }> = [];
      const baseTitle = pendingCSV?.fileName.replace(/\.csv$/i, '').replace(/[_-]/g, ' ').trim() || 'Chapter';
      
      for (let i = 0; i < finalWords.length; i += csvWordsPerPuzzle) {
        const chapterWords = finalWords.slice(i, i + csvWordsPerPuzzle);
        const chapterNum = Math.floor(i / csvWordsPerPuzzle) + 1;
        chapters.push({
          title: `${baseTitle} ${chapterNum}`,
          words: chapterWords
        });
      }

      // Initialize or update book structure
      const newStructure: BookStructure = {
        bookTitle: bookStructure?.bookTitle || 'Imported Puzzle Book',
        chapters: bookStructure ? [...bookStructure.chapters, ...chapters] : chapters
      };
      setBookStructure(newStructure);
      
      // Auto-expand Content section to show imported chapters
      setIsContentSectionOpen(true);

      // Build success message
      const removedBySize = words.length - wordsFilteredBySize.length;
      const removedByValidation = enableWordValidation ? wordsFilteredBySize.length - finalWords.length : 0;
      let message = `✅ Imported ${finalWords.length} word(s) into ${chapters.length} chapter(s)`;
      
      if (removedBySize > 0 || removedByValidation > 0) {
        const totalRemoved = removedBySize + removedByValidation;
        message += `\n⚠️ ${totalRemoved} word(s) removed (didn't fit grid or failed validation)`;
      }

      setPendingCSV(null);
      await showAlert({ message });
    } catch (error) {
      console.error('Error importing CSV:', error);
      await showAlert({ message: `❌ Failed to import CSV file: ${error instanceof Error ? error.message : 'Unknown error'}` });
      setPendingCSV(null);
    }
  }, [pendingCSV, bookStructure, csvGridSize, enableWordValidation, csvWordsPerPuzzle, showAlert, showToast]);


  // Generate puzzles for all chapters
  const handleGeneratePuzzles = useCallback(() => {
    // For Sudoku, generate directly (no chapters needed, just puzzle numbers)
    if (puzzleType === 'sudoku') {
      setIsGeneratingPuzzle(true);
      setGenerationProgress({ current: 0, total: 1 });
      setBookSudokus([]);
      
      const sudokus: SudokuPuzzle[] = [];
      
      // Generate only 1 Sudoku puzzle for book mode
      const sudoku = generateSudoku(difficulty);
      sudokus.push(sudoku);
      setGenerationProgress({ current: 1, total: 1 });
      
      setBookSudokus(sudokus);
      setBookPuzzles([]); // Clear word search puzzles
      setIsGeneratingPuzzle(false);
      setGenerationProgress({ current: 0, total: 0 });
      return;
    }
    
    // Word Search generation (existing logic)
    if (!bookStructure || bookStructure.chapters.length === 0) {
      alert('Please generate book structure first');
      return;
    }

    setIsGeneratingPuzzle(true);
    
    // If "Add blank pages between chapters" is enabled, add them to bookStructure first
    let chaptersToProcess: Chapter[];
    if (addBlankPagesBetweenChapters) {
      const updatedChapters: Chapter[] = [];
      bookStructure.chapters.forEach((chapter, index) => {
        updatedChapters.push(chapter);
        // Add blank page after this chapter if not the last chapter and next is not blank
        if (index < bookStructure.chapters.length - 1) {
          const nextChapter = bookStructure.chapters[index + 1];
          if (!nextChapter.isBlank && !chapter.isBlank) {
            updatedChapters.push({ title: 'Blank Page', words: [], isBlank: true });
          }
        }
      });
      // Update bookStructure to include blank pages so they show in the UI
      setBookStructure({ ...bookStructure, chapters: updatedChapters });
      chaptersToProcess = updatedChapters;
    } else {
      chaptersToProcess = bookStructure.chapters;
    }
    
    setGenerationProgress({ current: 0, total: chaptersToProcess.length });
    setBookPuzzles([]);

    const puzzles: PDFPageItem[] = [];

    const generateNextPuzzle = (index: number) => {
      if (index >= chaptersToProcess.length) {
        setBookPuzzles(puzzles);
        setIsGeneratingPuzzle(false);
        setGenerationProgress({ current: 0, total: 0 });
        
        // Show summary if some puzzles failed
        const realChapters = chaptersToProcess.filter(c => !c.isBlank);
        const failedCount = realChapters.length - puzzles.filter(p => !('isBlank' in p)).length;
        if (failedCount > 0) {
          const failedChapters = realChapters
            .filter((_, idx) => {
              const chapterIndex = chaptersToProcess.findIndex(c => c === realChapters[idx]);
              return !puzzles.some((p, pIdx) => {
                if ('isBlank' in p) return false;
                const puzzleChapterIndex = chaptersToProcess.findIndex(c => c.title === (p as PuzzleResult & { chapterTitle?: string }).chapterTitle);
                return puzzleChapterIndex === chapterIndex;
              });
            })
            .map(c => c.title);
          
          const maxWordLength = gridSize - 2;
          alert(
            `Generated ${puzzles.filter(p => !('isBlank' in p)).length} puzzle(s) successfully.\n\n` +
            `${failedCount} puzzle(s) could not be generated:\n` +
            `${failedChapters.join(', ')}\n\n` +
            `Possible reasons:\n` +
            `- Words don't fit the ${gridSize}x${gridSize} grid (max word length: ${maxWordLength})\n` +
            `- Puzzle generator couldn't place the words (try different difficulty or fewer words)\n\n` +
            `Try:\n` +
            `- Increasing grid size (currently ${gridSize}x${gridSize})\n` +
            `- Reducing words per puzzle (currently ${wordsPerPuzzle})\n` +
            `- Changing difficulty level\n` +
            `- Or regenerate the book structure with shorter words`
          );
        }
        return;
      }

      const chapter = chaptersToProcess[index];

      // Handle Blank Page
      if (chapter.isBlank) {
        puzzles.push({ isBlank: true, chapterTitle: 'Blank Page' });
        setGenerationProgress({ current: index + 1, total: chaptersToProcess.length });
        setTimeout(() => generateNextPuzzle(index + 1), 5); // Fast forward
        return;
      }

      // Normal Puzzle Generation logic...
      const wordsForPuzzle = chapter.words.slice(0, wordsPerPuzzle);
      const maxWordLength = gridSize - 2;
      const validWords = wordsForPuzzle.filter(w => {
        const word = w.toUpperCase().trim();
        return word.length <= maxWordLength && word.length >= 3 && /^[A-Z]+$/.test(word);
      });
      
      if (validWords.length === 0) {
        const wordLengths = wordsForPuzzle.map(w => `${w} (${w.length} letters)`).join(', ');
        console.warn(`No valid words for chapter "${chapter.title}" - all ${wordsForPuzzle.length} words don't fit grid size ${gridSize}x${gridSize} (max word length: ${maxWordLength})`);
        console.warn(`Words in chapter: ${wordLengths}`);
        console.warn(`Note: Words should be between 4 and ${maxWordLength} letters for a ${gridSize}x${gridSize} grid`);
        setGenerationProgress({ current: index + 1, total: chaptersToProcess.length });
        setTimeout(() => generateNextPuzzle(index + 1), 10);
        return;
      }
      
      if (validWords.length < wordsForPuzzle.length) {
        console.warn(`Chapter "${chapter.title}": Filtered ${wordsForPuzzle.length - validWords.length} words that don't fit (grid: ${gridSize}x${gridSize}, max length: ${maxWordLength})`);
      }

      try {
        const result = generatePuzzle(validWords.length > 0 ? validWords : ['PUZZLE'], gridSize, difficulty);
        
        // Check if we got a reasonable number of placed words
        if (result.placedWords.length === 0) {
          console.warn(`No words could be placed for chapter "${chapter.title}"`);
          setGenerationProgress({ current: index + 1, total: chaptersToProcess.length });
          setTimeout(() => generateNextPuzzle(index + 1), 10);
          return;
        }
        
        puzzles.push({
          ...result,
          chapterTitle: chapter.title,
        });
        
        setGenerationProgress({ current: puzzles.length, total: chaptersToProcess.length });
        
        setTimeout(() => generateNextPuzzle(index + 1), 10);
      } catch (error) {
        console.error(`Error generating puzzle for chapter "${chapter.title}":`, error);
        // Continue with next puzzle instead of stopping
        setGenerationProgress({ current: index + 1, total: chaptersToProcess.length });
        setTimeout(() => generateNextPuzzle(index + 1), 10);
      }
    };

    generateNextPuzzle(0);
  }, [bookStructure, wordsPerPuzzle, gridSize, difficulty, addBlankPagesBetweenChapters, puzzleType]);

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

  // Auto-generate single puzzle when words change (only for word search)
  useEffect(() => {
    if (puzzleType === 'word-search' && mode === 'single' && (generatedWords.length > 0 || customWords.trim())) {
      const wordsToUse = [
        ...generatedWords,
        ...customWords.split(/[,\n]/).map(w => w.trim().toUpperCase()).filter(w => w.length > 0)
      ].filter((w, i, arr) => arr.indexOf(w) === i);

      if (wordsToUse.length === 0) return;

      const wordsForPuzzle = wordsToUse.slice(0, singleWords);
      const result = generatePuzzle(wordsForPuzzle, gridSize, difficulty);
      setPuzzle(result);
      setSudokuPuzzle(null); // Clear Sudoku
    }
  }, [generatedWords, customWords, gridSize, difficulty, mode, singleWords, puzzleType]);

  // Update selected puzzle index when puzzles are generated
  useEffect(() => {
    if (mode === 'book' && puzzleType === 'word-search' && bookPuzzles.length > 0 && selectedPuzzleIndex === null) {
      setSelectedPuzzleIndex(0);
    }
    if (mode === 'book' && puzzleType === 'sudoku' && bookSudokus.length > 0 && selectedPuzzleIndex === null) {
      setSelectedPuzzleIndex(0);
    }
  }, [bookPuzzles.length, bookSudokus.length, mode, selectedPuzzleIndex, puzzleType]);

  // Show loading state while checking auth
  if (isCheckingAuth) {
  return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  // Show login form if not authenticated
  if (!isAuthenticated) {
    return <LoginForm onLogin={handleLogin} />;
  }

  // Show mode selection modal if puzzle type not selected
  if (showModeSelection || puzzleType === null) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="bg-card/95 backdrop-blur-md rounded-2xl shadow-2xl border border-border/50 p-8 max-w-md w-full">
          <div className="text-center mb-8">
            <div className="bg-primary/10 p-4 rounded-xl inline-block mb-4 ring-2 ring-ring/20">
              <BookOpen className="h-12 w-12 text-primary" />
            </div>
            <h2 className="text-3xl font-extrabold text-foreground tracking-tight mb-2">
              Choose Your Mode
            </h2>
            <p className="text-muted-foreground text-sm">
              Select the type of puzzle you want to generate
            </p>
          </div>

          <div className="space-y-4">
            <button
              onClick={() => {
                setPuzzleType('word-search');
                setShowModeSelection(false);
                setPuzzle(null);
                setSudokuPuzzle(null);
                setBookPuzzles([]);
                setBookSudokus([]);
              }}
              className="w-full p-6 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 rounded-xl text-primary-foreground font-bold text-lg shadow-lg shadow-purple-500/30 hover:scale-105 active:scale-95 transition-all duration-200 flex items-center justify-center gap-3"
            >
              <Search className="h-6 w-6" />
              Word Search
            </button>

            <button
              onClick={() => {
                setPuzzleType('sudoku');
                setShowModeSelection(false);
                setPuzzle(null);
                setSudokuPuzzle(null);
                setBookPuzzles([]);
                setBookSudokus([]);
              }}
              className="w-full p-6 bg-primary text-primary-foreground hover:opacity-90 rounded-xl text-primary-foreground font-bold text-lg shadow-sm hover:scale-105 active:scale-95 transition-all duration-200 flex items-center justify-center gap-3"
            >
              <Grid3x3 className="h-6 w-6" />
              Sudoku
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Display logic: Handle blank pages in preview
  const displayPuzzle = mode === 'book' && puzzleType === 'word-search' && bookPuzzles.length > 0 
    ? (selectedPuzzleIndex !== null && selectedPuzzleIndex < bookPuzzles.length 
        ? bookPuzzles[selectedPuzzleIndex] 
        : bookPuzzles[0])
    : puzzle;
  
  // Display logic for Sudoku
  const displaySudoku = mode === 'book' && puzzleType === 'sudoku' && bookSudokus.length > 0
    ? (selectedPuzzleIndex !== null && selectedPuzzleIndex < bookSudokus.length
        ? bookSudokus[selectedPuzzleIndex]
        : bookSudokus[0])
    : sudokuPuzzle;

  return (
    <div className="min-h-screen bg-background text-foreground relative" suppressHydrationWarning>
      {/* Mesh Gradient Background - Creative workspace */}
      <div className="absolute inset-0 z-0 bg-mesh-pattern opacity-100 pointer-events-none" />
      
      <div className="relative z-10">
      {/* Header */}
      <header className="border-b border-border bg-background/80 backdrop-blur-md shadow-lg sticky top-0 z-20">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Left: Logo and Title */}
            <div className="flex items-center gap-3">
              <div className="bg-primary/10 p-2 rounded-xl ring-2 ring-ring/20">
                <BookOpen className="h-6 w-6 text-primary drop-shadow-lg" />
              </div>
              <h1 className="text-2xl font-extrabold text-foreground tracking-tight">
                Printable Puzzle Book Generator
+          </h1>
            </div>
            
            {/* Center: Mode Toggle */}
            <div className="flex items-center gap-3">
              {/* Mode Toggle */}
              <div className="flex gap-2 bg-secondary/80 backdrop-blur-sm rounded-xl p-1 shadow-inner border border-border/50">
                <button
                  onClick={() => {
                    setMode('single');
                    setBookStructure(null);
                    setBookPuzzles([]);
                    setBookSudokus([]);
                  }}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                    mode === 'single'
                      ? 'bg-primary text-primary-foreground hover:opacity-90 shadow-sm scale-105'
                      : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
                  }`}
                >
                  Single Puzzle
                </button>
                <button
                  onClick={() => {
                    setMode('book');
                    setPuzzle(null);
                    setSudokuPuzzle(null);
                    setGeneratedWords([]);
                  }}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                    mode === 'book'
                      ? 'bg-primary text-primary-foreground hover:opacity-90 shadow-sm scale-105'
                      : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
                  }`}
                >
                  Book Mode
                </button>
              </div>
            </div>

            {/* Right: Export, Help and Logout Buttons */}
            <div className="flex gap-2">
              <Button
                onClick={() => setShowExportModal(true)}
                size="sm"
                className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-primary-foreground border-red-600 shadow-lg shadow-red-500/30 hover:scale-105 active:scale-95 transition-all duration-200"
                title="Export / Download"
              >
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              <Button
                onClick={() => setShowHelpModal(true)}
                variant="outline"
                size="sm"
                className="border-border/50 hover:bg-secondary/80 hover:border-border text-foreground hover:scale-105 active:scale-95 transition-all duration-200 shadow-sm"
                title="Help & Instructions"
              >
                <HelpCircle className="h-4 w-4 mr-2" />
                Help
              </Button>
              <Button
                onClick={handleLogout}
                variant="outline"
                size="sm"
                className="border-border/50 hover:bg-secondary/80 hover:border-border text-foreground hover:scale-105 active:scale-95 transition-all duration-200 shadow-sm"
              >
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Sticky Status Pill for Progress */}
      {(mode === 'book' && isGeneratingStructure) || (mode === 'single' && isGeneratingWords) ? (
        <div className="sticky top-[73px] z-30 mx-auto max-w-2xl px-4 mt-4">
          <div className="bg-primary/95 backdrop-blur-xl rounded-full px-6 py-3 shadow-xl border border-primary/20 flex items-center justify-between">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="w-2 h-2 rounded-full bg-primary-foreground animate-pulse" />
              <span className="text-sm font-semibold text-primary-foreground truncate">
                {mode === 'book' 
                  ? (structureProgress.status || 'Generating book structure...')
                  : (wordGenerationProgress.status || 'Generating words...')
                }
              </span>
            </div>
            {(mode === 'book' && structureProgress.total > 0) || (mode === 'single' && wordGenerationProgress.total > 0) ? (
              <>
                <div className="flex-1 mx-4 max-w-[200px]">
                  <div className="w-full bg-primary-foreground/20 rounded-full h-2 overflow-hidden">
                    <div 
                      className="bg-primary-foreground h-2 rounded-full transition-all duration-300"
                      style={{ 
                        width: mode === 'book'
                          ? `${Math.min((structureProgress.current / structureProgress.total) * 100, 100)}%`
                          : `${Math.min((wordGenerationProgress.current / wordGenerationProgress.total) * 100, 100)}%`
                      }}
                    />
                  </div>
                </div>
                <span className="text-xs font-bold text-primary-foreground whitespace-nowrap">
                  {mode === 'book' 
                    ? `${structureProgress.current}/${structureProgress.total}`
                    : `${wordGenerationProgress.current}/${wordGenerationProgress.total}`
                  }
                </span>
              </>
            ) : (
              <div className="w-16 h-2 bg-primary-foreground/20 rounded-full overflow-hidden ml-4">
                <div className="h-full bg-primary-foreground rounded-full animate-pulse" style={{ width: '30%' }} />
              </div>
            )}
          </div>
        </div>
      ) : null}

      {/* Main Layout */}
      <div className="container mx-auto px-4 md:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-6 h-[calc(100vh-100px)]">
          {/* Left Sidebar - Floating Glass Panel */}
          <aside className="bg-white/70 dark:bg-card/70 backdrop-blur-xl rounded-2xl shadow-xl p-6 space-y-6 overflow-y-auto border border-border/20">
            {/* Change Mode Button */}
            <button
              onClick={() => setShowModeSelection(true)}
              className="w-full bg-primary text-primary-foreground hover:opacity-90 text-primary-foreground font-semibold py-3 px-4 rounded-xl shadow-sm hover:scale-105 active:scale-95 transition-all duration-200 flex items-center justify-center gap-2"
            >
              <Grid3x3 className="h-5 w-5" />
              Change Mode
            </button>


            {/* Single CSV Import (Book Mode) - Only for Word Search */}
            {mode === 'book' && puzzleType === 'word-search' && (
              <div className="bg-white/50 dark:bg-card/50 rounded-xl p-5 space-y-4">
                <label className="block text-sm font-medium text-foreground mb-2">
                  Import CSV
                </label>
                <p className="text-xs text-muted-foreground mb-3">
                  Upload a single CSV file with words. Words will be split into chapters based on "Words per Puzzle" setting.
                </p>
                <div className="mb-3 p-2.5 bg-primary/10 border border-primary/30 rounded-lg">
                  <p className="text-xs text-foreground font-medium mb-1 flex items-center gap-1.5">
                    <Info className="h-3.5 w-3.5" />
                    Tip: Include Chapter Titles in CSV
                  </p>
                  <p className="text-xs text-muted-foreground/80 leading-relaxed">
                    If you include chapter titles in your CSV (using <code className="text-foreground">#TITLE:</code> or title in first column), 
                    <strong className="text-primary-foreground"> all words from each chapter will go into one puzzle</strong>, regardless of the "Words per Puzzle" setting.
          </p>
        </div>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-foreground mb-2">
                      Words per Puzzle
                    </label>
                    <input
                      type="number"
                      min="5"
                      max="50"
                      value={csvWordsPerPuzzle}
                      onChange={(e) => setCsvWordsPerPuzzle(Math.max(5, Math.min(50, parseInt(e.target.value) || 15)))}
                      className="w-full px-4 py-2.5 text-sm bg-secondary rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:bg-secondary/80 transition-all duration-200"
                    />
                  </div>
                  <label className="flex items-center gap-2 text-sm text-foreground mb-3 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={enableWordValidation}
                      onChange={(e) => setEnableWordValidation(e.target.checked)}
                      className="w-4 h-4 rounded border-border bg-secondary text-primary focus:ring-2 focus:ring-ring transition-all"
                    />
                    <span className="group-hover:text-foreground transition-colors">Validate words with dictionary (removes spelling errors)</span>
                  </label>
                  <label className="block">
                    <input
                      type="file"
                      accept=".csv"
                      onChange={handleCSVFileSelect}
                      className="hidden"
                      id="csv-import-input"
                    />
                    <Button
                      type="button"
                      onClick={() => document.getElementById('csv-import-input')?.click()}
                      className="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-primary-foreground shadow-lg shadow-purple-500/30 hover:scale-105 active:scale-95 transition-all duration-200 font-semibold"
                      size="sm"
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Import CSV File
                    </Button>
                  </label>
                  
                  {/* Grid Size Selector - appears after CSV upload */}
                  {pendingCSV && (
                    <div className="mt-4 p-4 bg-primary/10 border border-primary/30 rounded-lg">
                      <label className="block text-xs font-semibold text-foreground mb-3">
                        Select Grid Size for Import
                      </label>
                      <div className="mb-3">
                        <label className="block text-xs font-semibold text-foreground mb-2">
                          Grid Size: <span className="text-primary font-bold">{csvGridSize}×{csvGridSize}</span>
                        </label>
                        <input
                          type="range"
                          min="5"
                          max="30"
                          step="1"
                          value={csvGridSize}
                          onChange={(e) => setCsvGridSize(parseInt(e.target.value))}
                          className="w-full h-2 bg-secondary rounded-lg appearance-none cursor-pointer accent-primary"
                        />
                        <div className="flex justify-between text-xs text-foreground0 mt-2">
                          <span>5</span>
                          <span>15</span>
                          <span>30</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">
                          Max word length: {csvGridSize - 2} letters
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          onClick={processCSVImport}
                          className="flex-1 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-primary-foreground shadow-lg shadow-green-500/30 hover:scale-105 active:scale-95 transition-all duration-200 font-semibold"
                          size="sm"
                        >
                          Process Import
                        </Button>
                        <Button
                          type="button"
                          onClick={() => setPendingCSV(null)}
                          variant="outline"
                          className="border-border/50 hover:bg-secondary/80 hover:border-border text-xs hover:scale-105 active:scale-95 transition-all duration-200"
                          size="sm"
                        >
                          Cancel
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground/80 mt-2">
                        File: {pendingCSV.fileName}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}


            {/* Sudoku Settings - Single collapsible section */}
            {puzzleType === 'sudoku' ? (
              <div className="bg-white/50 dark:bg-card/50 rounded-xl overflow-hidden">
                <button
                  onClick={() => setIsSettingsSectionOpen(!isSettingsSectionOpen)}
                  className="w-full flex items-center justify-between p-4 text-left hover:bg-white/80 dark:hover:bg-card/80 transition-all duration-200 rounded-t-xl group"
                >
                  <h3 className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">Sudoku Settings</h3>
                  <ChevronUp className={`h-4 w-4 text-muted-foreground transition-transform duration-300 ${isSettingsSectionOpen ? 'rotate-0' : 'rotate-180'}`} />
                </button>
                {isSettingsSectionOpen && (
                  <div className="p-5 space-y-5">
                    {/* Difficulty */}
                    <div>
                      <label className="block text-xs font-semibold text-foreground mb-2">
                        Difficulty
                      </label>
                      <select
                        value={difficulty}
                        onChange={(e) => setDifficulty(e.target.value as Difficulty)}
                        className="w-full px-4 py-2.5 bg-secondary rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:bg-secondary/80 transition-all duration-200 text-sm"
                      >
                        <option value="easy">Easy (36-45 clues)</option>
                        <option value="medium">Medium (30-35 clues)</option>
                        <option value="hard">Hard (25-29 clues)</option>
                        <option value="expert">Expert (17-24 clues)</option>
                      </select>
                    </div>
                    
                    {/* Generate Button - Only for Book Mode (Single mode has button at bottom) */}
                    {mode === 'book' && (
                      <>
                        <Button
                          onClick={handleGeneratePuzzles}
                          disabled={isGeneratingPuzzle}
                          className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-primary-foreground shadow-lg shadow-green-500/30 hover:scale-105 active:scale-95 transition-all duration-200 text-sm font-semibold"
                          size="sm"
                        >
                          {isGeneratingPuzzle 
                            ? `Generating... ${generationProgress.current}/${generationProgress.total}`
                            : 'Generate Sudoku Puzzles'}
                        </Button>
                        
                        {/* Puzzle List for Sudoku (Book Mode) - Simple numbered list */}
                        {bookSudokus.length > 0 && (
                          <div className="mt-4">
                            <label className="block text-xs font-medium text-muted-foreground mb-2">
                              Puzzles ({bookSudokus.length})
                            </label>
                            <div className="space-y-1 max-h-48 overflow-y-auto">
                              {bookSudokus.map((sudoku, index) => {
                                const isSelected = selectedPuzzleIndex === index;
                                return (
                                  <div
                                    key={index}
                                    className={`bg-secondary/80 backdrop-blur-sm rounded-lg px-3 py-2 flex items-center justify-between group text-xs transition-all duration-200 border border-border/30 cursor-pointer hover:bg-secondary/80 hover:border-border/50 hover:shadow-md ${
                                      isSelected ? 'ring-2 ring-ring/50 bg-secondary/80 shadow-sm/20' : ''
                                    }`}
                                    onClick={() => setSelectedPuzzleIndex(index)}
                                  >
                                    <span className="text-foreground">
                                      Puzzle {index + 1} ✓
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <>
                {/* Content Section - Open by default */}
                <div className="bg-white/50 dark:bg-card/50 rounded-xl overflow-hidden">
                  <button
                    onClick={() => setIsContentSectionOpen(!isContentSectionOpen)}
                    className="w-full flex items-center justify-between p-4 text-left hover:bg-white/80 dark:hover:bg-card/80 transition-all duration-200 rounded-t-xl group"
                  >
                    <h3 className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">Content</h3>
                    <ChevronUp className={`h-4 w-4 text-muted-foreground transition-transform duration-300 ${isContentSectionOpen ? 'rotate-0' : 'rotate-180'}`} />
                  </button>
                  {isContentSectionOpen && (
                    <div className="p-5 space-y-5">
                  {/* Main Theme - Only for Word Search */}
                  {puzzleType === 'word-search' && (
                    <div>
                      <label className="block text-xs font-medium text-muted-foreground mb-2">
                        Main Theme
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={theme}
                          onChange={(e) => setTheme(e.target.value)}
                          placeholder="e.g., Winter, Gardening..."
                          className="flex-1 px-4 py-2.5 bg-secondary rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:bg-secondary/80 transition-all duration-200 text-sm"
                          disabled={isGeneratingStructure}
                        />
                        {mode === 'book' ? (
                          <Button
                            onClick={handleGenerateStructure}
                            disabled={isGeneratingStructure || !theme.trim()}
                            className="bg-primary text-primary-foreground hover:opacity-90 text-primary-foreground shadow-sm hover:scale-105 active:scale-95 transition-all duration-200"
                            size="sm"
                          >
                            <Search className="h-4 w-4" />
                          </Button>
                        ) : (
                          <Button
                            onClick={handleGenerateWords}
                            disabled={isGeneratingWords || !theme.trim()}
                            className="bg-primary text-primary-foreground hover:opacity-90 text-primary-foreground shadow-sm hover:scale-105 active:scale-95 transition-all duration-200"
                            size="sm"
                          >
                            <Search className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  )}
                  

                  {/* Word Validation - Only for Word Search */}
                  {puzzleType === 'word-search' && (
                    <div>
                      <label className="flex items-center gap-2 text-xs text-foreground cursor-pointer">
                        <input
                          type="checkbox"
                          checked={enableWordValidation}
                          onChange={(e) => setEnableWordValidation(e.target.checked)}
                          className="w-4 h-4 rounded border-border bg-secondary text-primary focus:ring-2 focus:ring-ring"
                        />
                        <span>Word Validation</span>
                      </label>
                      <p className="text-xs text-muted-foreground mt-1 ml-6">
                        Check words against dictionary API (removes spelling errors)
                      </p>
                    </div>
                  )}


                  {/* Chapter List (Book Mode) - Only for Word Search */}
                  {mode === 'book' && puzzleType === 'word-search' && bookStructure && bookStructure.chapters.length > 0 && (
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="block text-xs font-medium text-muted-foreground">
                          Chapters ({bookStructure.chapters.length})
                        </label>
                        <Button onClick={handleAddBlankPage} size="sm" variant="outline" className="h-7 text-xs border-border/50 hover:bg-secondary/80 hover:border-border px-3 hover:scale-105 active:scale-95 transition-all duration-200 shadow-sm">
                          <FilePlus className="h-3 w-3 mr-1" /> Add Page
                        </Button>
                      </div>
                      <div className="space-y-1 max-h-48 overflow-y-auto">
                        {bookStructure.chapters.map((chapter, index) => {
                          const hasPuzzle = bookPuzzles.length > 0 && bookPuzzles[index] !== undefined;
                          const isSelected = selectedPuzzleIndex === index;
                          return (
                            <div key={index}>
                              <div
                                className={`bg-secondary/80 backdrop-blur-sm rounded-lg px-3 py-2 flex items-center justify-between group text-xs transition-all duration-200 ${chapter.isBlank ? 'border border-dashed border-border/50' : 'border border-border/30'} ${isSelected && hasPuzzle ? 'ring-2 ring-ring/50 bg-secondary/80 shadow-sm/20' : ''} ${hasPuzzle && !chapter.isBlank ? 'cursor-pointer hover:bg-secondary/80 hover:border-border/50 hover:shadow-md' : ''}`}
                                onClick={() => {
                                  if (hasPuzzle && !chapter.isBlank) {
                                    setSelectedPuzzleIndex(index);
                                  }
                                }}
                              >
                                <div className="flex items-center gap-2 overflow-hidden flex-1 min-w-0">
                                  {chapter.isBlank ? (
                                    <File className="h-3 w-3 text-foreground0 shrink-0" />
                                  ) : (
                                    <span className="text-foreground0 w-3 shrink-0">{index + 1}.</span>
                                  )}
                                  {editingChapterIndex === index ? (
                                    <input 
                                      autoFocus 
                                      value={editingTitle} 
                                      onChange={e => setEditingTitle(e.target.value)} 
                                      onKeyDown={e => {
                                        if (e.key === 'Enter') handleSaveChapter(index);
                                        if (e.key === 'Escape') {
                                          setEditingChapterIndex(null);
                                          setEditingTitle('');
                                        }
                                      }}
                                      className="flex-1 px-1.5 py-0.5 bg-secondary border border-border rounded text-xs text-foreground"
                                      onClick={(e) => e.stopPropagation()}
                                    />
                                  ) : (
                                    <span className={`truncate ${chapter.isBlank ? 'text-foreground0 italic' : 'text-foreground'}`}>
                                      {chapter.isBlank ? chapter.title : (
                                        <>
                                          {chapter.title}
                                          {puzzleType === 'word-search' && ` (${chapter.words.length})`}
                                          {puzzleType === 'word-search' && chapter.words.length > csvWordsPerPuzzle && (
                                            <span className="ml-1.5 px-1.5 py-0.5 bg-primary/20 text-foreground text-[10px] rounded border border-primary/30" title={`All ${chapter.words.length} words will be in one puzzle`}>
                                              All in one
                                            </span>
                                          )}
                                          {hasPuzzle && ' ✓'}
                                        </>
                                      )}
                                    </span>
                                  )}
                                </div>
                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all duration-200 shrink-0" onClick={(e) => e.stopPropagation()}>
                                  <button onClick={() => moveChapter(index, 'up')} disabled={index === 0} className="p-1.5 rounded-md text-muted-foreground hover:text-primary hover:bg-primary/10 disabled:opacity-30 transition-all duration-200 hover:scale-110" title="Move up"><ChevronUp className="h-3 w-3" /></button>
                                  <button onClick={() => moveChapter(index, 'down')} disabled={index === bookStructure.chapters.length-1} className="p-1.5 rounded-md text-muted-foreground hover:text-primary hover:bg-primary/10 disabled:opacity-30 transition-all duration-200 hover:scale-110" title="Move down"><ChevronDown className="h-3 w-3" /></button>
                                  {!chapter.isBlank && <button onClick={() => handleEditChapter(index)} className="p-1.5 rounded-md text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all duration-200 hover:scale-110" title="Edit title"><Edit2 className="h-3 w-3" /></button>}
                                  {!chapter.isBlank && puzzleType === 'word-search' && <button onClick={() => handleEditWords(index)} className="p-1.5 rounded-md text-muted-foreground hover:text-green-400 hover:bg-green-500/10 transition-all duration-200 hover:scale-110" title="Edit words"><Search className="h-3 w-3" /></button>}
                                  <button onClick={() => handleDeleteChapter(index)} className="p-1.5 rounded-md text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition-all duration-200 hover:scale-110" title="Delete"><Trash2 className="h-3 w-3" /></button>
                                </div>
                              </div>
                              {editingWordsIndex === index && !chapter.isBlank && (
                                <div className="mt-1.5 p-2 bg-secondary rounded border border-border">
                                  <label className="block text-xs font-medium text-foreground mb-1.5">
                                    Edit Words for "{chapter.title}"
                                  </label>
                                  <textarea
                                    autoFocus
                                    value={editingWords}
                                    onChange={e => setEditingWords(e.target.value)}
                                    placeholder="WORD1, WORD2, WORD3..."
                                    rows={3}
                                    className="w-full px-3 py-2 bg-secondary rounded-lg text-xs text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:bg-secondary/80 transition-all duration-200 resize-none"
                                  />
                                  <div className="flex gap-2 mt-2">
                                    <Button onClick={() => handleSaveWords(index)} size="sm" className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-primary-foreground shadow-lg shadow-green-500/30 hover:scale-105 active:scale-95 transition-all duration-200 text-xs font-semibold">Save</Button>
                                    <Button onClick={handleCancelEditWords} size="sm" variant="outline" className="border-border/50 hover:bg-secondary/80 hover:border-border text-xs hover:scale-105 active:scale-95 transition-all duration-200">Cancel</Button>
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                      <div className="mt-3 space-y-2">
                        <label className="flex items-center gap-2 text-xs text-foreground cursor-pointer group">
                          <input
                            type="checkbox"
                            checked={addBlankPagesBetweenChapters}
                            onChange={(e) => setAddBlankPagesBetweenChapters(e.target.checked)}
                            className="w-4 h-4 rounded border-border bg-secondary text-primary focus:ring-2 focus:ring-ring transition-all"
                          />
                          <span className="group-hover:text-foreground transition-colors">Add blank pages between chapters</span>
                        </label>
                        <Button
                          onClick={handleGeneratePuzzles}
                          disabled={isGeneratingPuzzle || (puzzleType === 'word-search' && (!bookStructure || bookStructure.chapters.length === 0))}
                          className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-primary-foreground shadow-lg shadow-green-500/30 hover:scale-105 active:scale-95 transition-all duration-200 text-sm font-semibold"
                          size="sm"
                        >
                          {isGeneratingPuzzle 
                            ? `Generating... ${generationProgress.current}/${generationProgress.total}`
                            : 'Generate Pages'
                          }
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Single Mode Word Input - Only for Word Search */}
                  {mode === 'single' && puzzleType === 'word-search' && (
                    <>
                      <div>
                        <label className="block text-xs font-semibold text-foreground mb-2">
                          Number of Words
                        </label>
                        <input
                          type="number"
                          value={singleWords}
                          onChange={(e) => setSingleWords(parseInt(e.target.value) || 20)}
                          min={5}
                          max={50}
                          className="w-full px-4 py-2.5 bg-secondary rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:bg-secondary/80 transition-all duration-200 text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-foreground mb-2">
                          Custom Words (Optional)
                        </label>
                        <textarea
                          value={customWords}
                          onChange={(e) => setCustomWords(e.target.value)}
                          placeholder="snowflake, icicle, blizzard..."
                          rows={3}
                          className="w-full px-4 py-2.5 bg-secondary/80 border border-border/50 rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/50 focus:border-ring/50 focus:bg-secondary transition-all duration-200 resize-none text-sm shadow-sm"
                        />
                      </div>
                      {generatedWords.length > 0 && (
                        <div>
                          <label className="block text-xs font-semibold text-foreground mb-2">
                            Generated Words (Editable)
                          </label>
                          <textarea
                            value={generatedWords.join(', ')}
                            onChange={(e) => {
                              const words = e.target.value
                                .split(/[,\n]/)
                                .map(w => w.trim().toUpperCase())
                                .filter(w => w.length >= 3 && /^[A-Z]+$/.test(w));
                              setGeneratedWords(words);
                              if (words.length > 0) {
                                const maxWordLength = gridSize - 2;
                                const validWords = words.filter(w => w.length <= maxWordLength);
                                if (validWords.length > 0) {
                                  try {
                                    const result = generatePuzzle(validWords.slice(0, singleWords), gridSize, difficulty);
                                    setPuzzle(result);
                                  } catch (error) {
                                    console.error('Error generating puzzle:', error);
                                  }
                                }
                              }
                            }}
                            placeholder="WORD1, WORD2, WORD3..."
                            rows={4}
                            className="w-full px-4 py-2.5 bg-secondary/80 border border-border/50 rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/50 focus:border-ring/50 focus:bg-secondary transition-all duration-200 resize-none text-sm shadow-sm"
                          />
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Settings Section - Only for Word Search */}
            {puzzleType === 'word-search' && (
              <>
                <div className="bg-card/80 backdrop-blur-sm rounded-xl shadow-lg border border-border/50 overflow-hidden">
                  <button
                    onClick={() => setIsSettingsSectionOpen(!isSettingsSectionOpen)}
                    className="w-full flex items-center justify-between p-4 text-left hover:bg-secondary/50 transition-all duration-200 rounded-t-xl group"
                  >
                    <h3 className="text-sm font-bold text-foreground group-hover:text-primary-foreground transition-colors">Settings</h3>
                    <ChevronUp className={`h-4 w-4 text-muted-foreground transition-transform duration-300 ${isSettingsSectionOpen ? 'rotate-0' : 'rotate-180'}`} />
                  </button>
                  {isSettingsSectionOpen && (
                    <div className="p-5 space-y-5 border-t border-border/50">
                      {/* Grid Size - Slider */}
                      <div>
                        <label className="block text-xs font-semibold text-foreground mb-3">
                          Grid Size: <span className="text-primary font-bold">{gridSize}×{gridSize}</span>
                        </label>
                        <input
                          type="range"
                          min="5"
                          max="30"
                          step="1"
                          value={gridSize}
                          onChange={(e) => setGridSize(parseInt(e.target.value))}
                          className="w-full h-2 bg-secondary rounded-lg appearance-none cursor-pointer accent-primary"
                        />
                        <div className="flex justify-between text-xs text-foreground0 mt-2">
                          <span>5</span>
                          <span>15</span>
                          <span>30</span>
                        </div>
                      </div>
                      
                      {/* Difficulty */}
                      <div>
                        <label className="block text-xs font-semibold text-foreground mb-2">
                          Difficulty
                        </label>
                        <select
                          value={difficulty}
                          onChange={(e) => setDifficulty(e.target.value as Difficulty)}
                          className="w-full px-4 py-2.5 bg-secondary rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:bg-secondary/80 transition-all duration-200 text-sm"
                        >
                          <option value="easy">Easy</option>
                          <option value="medium">Medium</option>
                          <option value="hard">Hard</option>
                        </select>
                      </div>
                    </div>
                  )}
                </div>

                {/* Book Config Section - Only for Word Search Book Mode */}
                {mode === 'book' && (
                  <div className="bg-card/80 backdrop-blur-sm rounded-xl shadow-lg border border-border/50 overflow-hidden">
                    <button
                      onClick={() => setIsBookConfigSectionOpen(!isBookConfigSectionOpen)}
                      className="w-full flex items-center justify-between p-4 text-left hover:bg-secondary/50 transition-all duration-200 rounded-t-xl group"
                    >
                      <h3 className="text-sm font-bold text-foreground group-hover:text-primary-foreground transition-colors">Book Config</h3>
                      <ChevronUp className={`h-4 w-4 text-muted-foreground transition-transform duration-300 ${isBookConfigSectionOpen ? 'rotate-0' : 'rotate-180'}`} />
                    </button>
                    {isBookConfigSectionOpen && (
                      <div className="p-5 space-y-5 border-t border-border/50">
                        <div>
                          <label className="block text-xs font-semibold text-foreground mb-2">
                            Words per Puzzle
                          </label>
                          <input
                            type="number"
                            value={wordsPerPuzzle}
                            onChange={(e) => setWordsPerPuzzle(parseInt(e.target.value) || 15)}
                            min={5}
                            max={30}
                            className="w-full px-4 py-2.5 bg-secondary rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:bg-secondary/80 transition-all duration-200 text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-foreground mb-2">
                            Number of Chapters
                          </label>
                          <input
                            type="number"
                            value={numChapters}
                            onChange={(e) => setNumChapters(parseInt(e.target.value) || 25)}
                            min={5}
                            max={100}
                            className="w-full px-4 py-2.5 bg-secondary rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:bg-secondary/80 transition-all duration-200 text-sm"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
            
            {/* Close the outer fragment from line 1675 */}
            </>
            )}

            {/* Mode-specific Controls */}


            {/* Generate Button (Single Mode) */}
            {mode === 'single' && (
              <Button
                onClick={() => {
                  if (puzzleType === 'sudoku') {
                    handleGenerateSingleSudoku();
                  } else {
                    handleGenerateSinglePuzzle();
                  }
                }}
                disabled={puzzleType === 'word-search' && isGeneratingPuzzle && (generatedWords.length === 0 && !customWords.trim())}
                className="w-full bg-primary text-primary-foreground hover:opacity-90 text-primary-foreground shadow-sm hover:scale-105 active:scale-95 transition-all duration-200 font-bold"
                size="lg"
              >
                {isGeneratingPuzzle ? 'Generating...' : 'Generate Puzzle'}
              </Button>
            )}

            {/* Progress indicator for puzzle generation - Moved to modal overlay */}

          </aside>

          {/* Right Side - Preview - Darker workspace for paper effect */}
          <main className="bg-slate-100 dark:bg-slate-900/50 rounded-xl shadow-inner overflow-hidden p-6 flex flex-col">
            {/* Puzzle Preview */}
            <div className="flex-1 overflow-auto min-h-0">
              {puzzleType === 'sudoku' ? (
                displaySudoku ? (
                  <SudokuPreview
                    puzzle={displaySudoku}
                    title={mode === 'book' && bookSudokus.length > 0
                      ? `Puzzle ${(selectedPuzzleIndex !== null ? selectedPuzzleIndex : 0) + 1} of ${bookSudokus.length}`
                      : 'Sudoku Puzzle'}
                  />
                ) : (
                  <div className="h-full flex items-center justify-center bg-card/50 rounded-lg border border-border/50 text-muted-foreground">
                    <div className="text-center">
                      <Grid3x3 className="h-16 w-16 mx-auto mb-2 text-foreground0" />
                      <p className="text-muted-foreground">No Sudoku puzzle generated yet</p>
                      <p className="text-xs mt-1 text-foreground0">
                        {mode === 'single' 
                          ? 'Click "Generate Puzzle" to create a Sudoku'
                          : 'Generate book structure and click "Generate Pages" to create Sudoku puzzles'}
                      </p>
                    </div>
                  </div>
                )
              ) : displayPuzzle ? (
                'isBlank' in displayPuzzle ? (
                  <div className="h-full flex items-center justify-center bg-secondary rounded-lg border border-border text-muted-foreground">
                    <div className="text-center">
                      <File className="h-16 w-16 mx-auto mb-2 text-foreground" />
                      <p>Blank Page</p>
                      <p className="text-xs mt-1">(Will be empty in PDF)</p>
                    </div>
                  </div>
                ) : (
                  <PuzzlePreview
                    grid={(displayPuzzle as PuzzleResult).grid}
                    placedWords={(displayPuzzle as PuzzleResult).placedWords}
                    title={mode === 'book' && 'chapterTitle' in displayPuzzle
                      ? `${displayPuzzle.chapterTitle} - Puzzle ${bookPuzzles.findIndex(p => p === displayPuzzle) + 1} of ${bookPuzzles.length}`
                      : theme || 'Word Search Puzzle'
                    }
                  />
                )
              ) : mode === 'book' && bookStructure ? (
                <div className="h-full flex items-center justify-center bg-card/80 backdrop-blur-sm rounded-xl shadow-xl border border-border/50">
                  <div className="text-center">
                    <div className="bg-primary/10 p-4 rounded-2xl inline-block mb-4 ring-2 ring-ring/20">
                      <BookOpen className="h-16 w-16 mx-auto text-primary drop-shadow-lg" />
                    </div>
                    <p className="text-foreground font-medium">Click "Generate Pages" to create puzzles for all chapters</p>
                  </div>
                </div>
              ) : (
                <div className="h-full flex items-center justify-center bg-card/80 backdrop-blur-sm rounded-xl shadow-xl border border-border/50 p-6">
                  <div className="w-full max-w-2xl">
                    <InstructionsPanel mode={mode} />
                  </div>
                </div>
              )}
        </div>
      </main>
        </div>
      </div>

      {/* Help Modal */}
      <HelpModal isOpen={showHelpModal} onClose={() => setShowHelpModal(false)} />

      {/* Export Modal */}
      <ExportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        mode={mode}
        puzzles={puzzleType === 'sudoku'
          ? (mode === 'book'
              ? bookSudokus.map((sudoku, idx) => ({ ...sudoku, chapterTitle: bookStructure?.chapters[idx]?.title }))
              : sudokuPuzzle
                ? [{ ...sudokuPuzzle, chapterTitle: theme || 'Sudoku Puzzle' }]
                : [])
          : (mode === 'book' 
              ? bookPuzzles 
              : puzzle 
                ? [{ ...puzzle, chapterTitle: theme || 'Puzzle' }]
                : [])}
        bookTitle={bookStructure?.bookTitle}
        theme={theme}
        bookStructure={bookStructure}
        kdpTitles={kdpTitles}
        kdpDescription={kdpDescription}
        isGeneratingKdpContent={isGeneratingKdpContent}
        kdpContentType={kdpContentType}
        onGenerateBookTitles={handleGenerateBookTitles}
        onGenerateKdpDescription={handleGenerateKdpDescription}
        onCopyToClipboard={handleCopyToClipboard}
        copiedText={copiedText}
        onBookTitleChange={(title) => {
          if (bookStructure) {
            setBookStructure({ ...bookStructure, bookTitle: title });
          } else {
            setBookStructure({ bookTitle: title, chapters: [] });
          }
        }}
      />

      {/* Progress Modal Overlay - Centered with blurred backdrop */}
      {isGeneratingPuzzle && mode === 'book' && generationProgress.total > 0 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-card rounded-2xl p-8 border border-border shadow-2xl min-w-[400px] max-w-[500px] animate-in zoom-in-95 duration-300">
            <div className="space-y-5">
              <div className="text-center">
                <div className="bg-primary/10 p-3 rounded-2xl inline-block mb-3 ring-2 ring-ring/20">
                  <Sparkles className="h-8 w-8 text-primary animate-pulse" />
                </div>
                <h3 className="text-xl font-extrabold text-foreground tracking-tight mb-2">
                  Generating Puzzles...
                </h3>
                <p className="text-sm text-muted-foreground font-medium">
                  {bookStructure?.chapters[generationProgress.current - 1]?.title || `Puzzle ${generationProgress.current}`}
                </p>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-foreground">
                    Progress
                  </span>
                  <span className="text-sm text-foreground font-bold bg-primary/20 px-3 py-1 rounded-full">
                    {Math.round((generationProgress.current / generationProgress.total) * 100)}%
                  </span>
                </div>
                <div className="w-full bg-secondary/50 rounded-full h-5 overflow-hidden shadow-inner">
                  <div 
                    className="bg-gradient-to-r from-green-500 via-green-600 to-green-500 h-5 rounded-full transition-all duration-300 ease-out shadow-lg shadow-green-500/30"
                    style={{ width: `${Math.min((generationProgress.current / generationProgress.total) * 100, 100)}%` }}
                  />
                </div>
                <div className="flex items-center justify-center text-xs text-muted-foreground font-medium">
                  <span>
                    {generationProgress.current} of {generationProgress.total} puzzles
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}
