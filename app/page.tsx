'use client';

import { useState, useEffect, useCallback } from 'react';
import { Search, Download, Sparkles, Grid3x3, BookOpen, Edit2, Trash2, Plus, Upload, FilePlus, ChevronUp, ChevronDown, File, FileText, Type, Copy, Check, HelpCircle, Info } from 'lucide-react';
import { generateWordsFromTheme } from '@/lib/word-generator';
import { generatePuzzle, type PuzzleResult } from '@/lib/puzzle-generator';
import PuzzlePreview from '@/components/PuzzlePreview';
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
type Difficulty = 'easy' | 'medium' | 'hard';

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

  // App state (declared before auth check)
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
  const [bookPuzzles, setBookPuzzles] = useState<PDFPageItem[]>([]);
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
  
  // Collapsible sections state
  const [isContentSectionOpen, setIsContentSectionOpen] = useState(true);
  const [isSettingsSectionOpen, setIsSettingsSectionOpen] = useState(false);
  const [isBookConfigSectionOpen, setIsBookConfigSectionOpen] = useState(false);
  
  // Page Margin Settings (in inches, converted to percentage for display)
  const [margins, setMargins] = useState({ left: 0.5, right: 0.5, top: 0.5, bottom: 0.5 });

  // Authentication handlers
  const handleLogin = () => {
    setIsAuthenticatedState(true);
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

  // Handle CSV file upload (single file, split into chapters)
  const handleCSVImport = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Check file extension
    if (!file.name.toLowerCase().endsWith('.csv')) {
      await showAlert({ message: 'Please upload a CSV file' });
      return;
    }

    try {
      const text = await file.text();
      const parseResult = parseCSV(text);

      // Check if CSV has chapters with titles
      if (parseResult.chapters && parseResult.chapters.length > 0) {
        console.log(`CSV Import: Detected ${parseResult.chapters.length} chapters with titles`);
        
        // Filter and validate words in each chapter
        const maxWordLength = gridSize - 2;
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
          event.target.value = '';
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

        // Build success message
        let message = `✅ Successfully imported ${processedChapters.length} chapter(s) with ${totalWords} word(s)`;
        message += `\n\n📌 Note: All words from each chapter will go into one puzzle.`;
        if (totalRemoved > 0) {
          message += `\n\n⚠️ Removed ${totalRemoved} word(s) that didn't fit grid size or failed validation`;
        }
        // Show word counts per chapter if any chapter has more than csvWordsPerPuzzle
        const chaptersWithManyWords = processedChapters.filter(ch => ch.words.length > csvWordsPerPuzzle);
        if (chaptersWithManyWords.length > 0) {
          message += `\n\n📊 Chapters with more than ${csvWordsPerPuzzle} words:`;
          chaptersWithManyWords.forEach(ch => {
            message += `\n  • ${ch.title}: ${ch.words.length} words (all will be in one puzzle)`;
          });
        }
        message += `\n\n📋 All Chapters: ${processedChapters.map(ch => ch.title).join(', ')}`;

        event.target.value = '';
        await showAlert({ message });
        return;
      }

      // Fallback: Original behavior (no titles in CSV, split by csvWordsPerPuzzle)
      const { words, hasClues } = parseResult;

      console.log(`CSV Import: Parsed ${words.length} words from file "${file.name}"`);
      console.log(`CSV Import: Sample words:`, words.slice(0, 5));

      if (words.length === 0) {
        await showAlert({ message: 'No valid words found in CSV file. Please ensure the file contains words (one per line or in Word, Clue format).' });
        return;
      }

      // Filter words by grid size
      const maxWordLength = gridSize - 2;
      console.log(`CSV Import: Filtering words for ${gridSize}x${gridSize} grid (max length: ${maxWordLength})`);
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
          message: `❌ No words fit the current grid size (${gridSize}x${gridSize}).\n\n` +
          `All ${words.length} words were rejected:\n${rejectedText}${moreText}\n\n` +
          `Try:\n` +
          `- Increasing grid size (currently ${gridSize}x${gridSize})\n` +
          `- Checking your CSV file format`
        });
        event.target.value = '';
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
        event.target.value = '';
        return;
      }

      // Split words into chapters based on csvWordsPerPuzzle
      const chapters: Array<{ title: string; words: string[] }> = [];
      const baseTitle = file.name.replace(/\.csv$/i, '').replace(/[_-]/g, ' ').trim() || 'Chapter';
      
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
      let message = `✅ Successfully imported ${finalWords.length} word(s) into ${chapters.length} chapter(s)`;
      
      if (removedBySize > 0 || removedByValidation > 0) {
        message += `\n\n⚠️ Removed:`;
        if (removedBySize > 0) {
          message += `\n- ${removedBySize} word(s) too long/short for ${gridSize}x${gridSize} grid`;
        }
        if (removedByValidation > 0) {
          const invalidList = invalidWords.slice(0, 5).join(', ');
          const moreText = invalidWords.length > 5 ? ` and ${invalidWords.length - 5} more` : '';
          message += `\n- ${removedByValidation} invalid/incomplete word(s): ${invalidList}${moreText}`;
        }
      }

      // Clear file input
      event.target.value = '';

      await showAlert({ message });
    } catch (error) {
      console.error('Error importing CSV:', error);
      await showAlert({ message: `❌ Failed to import CSV file: ${error instanceof Error ? error.message : 'Unknown error'}` });
    }
  }, [bookStructure, gridSize, enableWordValidation, csvWordsPerPuzzle, showAlert, showToast]);


  // Generate puzzles for all chapters
  const handleGeneratePuzzles = useCallback(() => {
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
  }, [bookStructure, wordsPerPuzzle, gridSize, difficulty, addBlankPagesBetweenChapters]);

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

  // Update selected puzzle index when puzzles are generated
  useEffect(() => {
    if (mode === 'book' && bookPuzzles.length > 0 && selectedPuzzleIndex === null) {
      setSelectedPuzzleIndex(0);
    }
  }, [bookPuzzles.length, mode, selectedPuzzleIndex]);

  // Show loading state while checking auth
  if (isCheckingAuth) {
  return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="text-slate-400">Loading...</div>
      </div>
    );
  }

  // Show login form if not authenticated
  if (!isAuthenticated) {
    return <LoginForm onLogin={handleLogin} />;
  }

  // Display logic: Handle blank pages in preview
  const displayPuzzle = mode === 'book' && bookPuzzles.length > 0 
    ? (selectedPuzzleIndex !== null && selectedPuzzleIndex < bookPuzzles.length 
        ? bookPuzzles[selectedPuzzleIndex] 
        : bookPuzzles[0])
    : puzzle;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50" suppressHydrationWarning>
      {/* Header */}
      <header className="border-b border-slate-800/50 bg-gradient-to-r from-slate-900 via-slate-900/95 to-slate-900 backdrop-blur-md shadow-lg">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Left: Logo and Title */}
            <div className="flex items-center gap-3">
              <div className="bg-blue-500/10 p-2 rounded-xl ring-2 ring-blue-500/20">
                <BookOpen className="h-6 w-6 text-blue-400 drop-shadow-lg" />
              </div>
              <h1 className="text-2xl font-extrabold bg-gradient-to-r from-slate-100 to-slate-300 bg-clip-text text-transparent tracking-tight">
                Printable Puzzle Book Generator
              </h1>
            </div>
            
            {/* Center: Mode Toggle */}
            <div className="flex gap-2 bg-slate-800/80 backdrop-blur-sm rounded-xl p-1 shadow-inner border border-slate-700/50">
              <button
                onClick={() => {
                  setMode('single');
                  setBookStructure(null);
                  setBookPuzzles([]);
                }}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                  mode === 'single'
                    ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg shadow-blue-500/30 scale-105'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'
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
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                  mode === 'book'
                    ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg shadow-blue-500/30 scale-105'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'
                }`}
              >
                Book Mode
              </button>
            </div>

            {/* Right: Export, Help and Logout Buttons */}
            <div className="flex gap-2">
              <Button
                onClick={() => setShowExportModal(true)}
                size="sm"
                className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white border-red-600 shadow-lg shadow-red-500/30 hover:scale-105 active:scale-95 transition-all duration-200"
                title="Export / Download"
              >
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              <Button
                onClick={() => setShowHelpModal(true)}
                variant="outline"
                size="sm"
                className="border-slate-600/50 hover:bg-slate-800/80 hover:border-slate-500 text-slate-300 hover:scale-105 active:scale-95 transition-all duration-200 shadow-sm"
                title="Help & Instructions"
              >
                <HelpCircle className="h-4 w-4 mr-2" />
                Help
              </Button>
              <Button
                onClick={handleLogout}
                variant="outline"
                size="sm"
                className="border-slate-600/50 hover:bg-slate-800/80 hover:border-slate-500 text-slate-300 hover:scale-105 active:scale-95 transition-all duration-200 shadow-sm"
              >
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Layout */}
      <div className="container mx-auto px-4 md:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-6 h-[calc(100vh-100px)]">
          {/* Left Sidebar - Controls */}
          <aside className="space-y-6 overflow-y-auto pr-2">
            {/* Structure Generation Progress (Book Mode) - Moved to top for visibility */}
            {mode === 'book' && isGeneratingStructure && (
              <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl p-5 border border-blue-500/50 shadow-xl shadow-blue-500/20">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-white drop-shadow-sm">
                      {structureProgress.status || 'Generating book structure...'}
                    </span>
                    {structureProgress.total > 0 && (
                      <span className="text-xs text-blue-100 font-bold bg-blue-500/30 px-2 py-1 rounded-full">
                        {Math.round((structureProgress.current / structureProgress.total) * 100)}%
                      </span>
                    )}
                  </div>
                  <div className="w-full bg-blue-800/50 rounded-full h-4 overflow-hidden shadow-inner">
                    <div 
                      className="bg-gradient-to-r from-white via-blue-50 to-white h-4 rounded-full transition-all duration-300 ease-out shadow-sm"
                      style={{ 
                        width: structureProgress.total > 0 
                          ? `${Math.min((structureProgress.current / structureProgress.total) * 100, 100)}%`
                          : '30%' // Indeterminate progress
                      }}
                    />
                  </div>
                  {structureProgress.total > 0 && (
                    <div className="text-xs text-blue-100 text-center font-medium">
                      {structureProgress.current} / {structureProgress.total} chapters
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Word Generation Progress (Single Mode) - Moved to top for visibility */}
            {mode === 'single' && isGeneratingWords && (
              <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl p-5 border border-blue-500/50 shadow-xl shadow-blue-500/20">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-white drop-shadow-sm">
                      {wordGenerationProgress.status || 'Generating words...'}
                    </span>
                    {wordGenerationProgress.total > 0 && (
                      <span className="text-xs text-blue-100 font-bold bg-blue-500/30 px-2 py-1 rounded-full">
                        {Math.round((wordGenerationProgress.current / wordGenerationProgress.total) * 100)}%
                      </span>
                    )}
                  </div>
                  <div className="w-full bg-blue-800/50 rounded-full h-4 overflow-hidden shadow-inner">
                    <div 
                      className="bg-gradient-to-r from-white via-blue-50 to-white h-4 rounded-full transition-all duration-300 ease-out shadow-sm"
                      style={{ 
                        width: wordGenerationProgress.total > 0 
                          ? `${Math.min((wordGenerationProgress.current / wordGenerationProgress.total) * 100, 100)}%`
                          : '30%' // Indeterminate progress
                      }}
                    />
                  </div>
                  {wordGenerationProgress.total > 0 && (
                    <div className="text-xs text-blue-100 text-center font-medium">
                      {wordGenerationProgress.current} / {wordGenerationProgress.total} words
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Single CSV Import (Book Mode) */}
            {mode === 'book' && (
              <div className="bg-slate-900/80 backdrop-blur-sm rounded-xl p-5 shadow-lg border border-slate-700/50 hover:border-slate-600/50 transition-all duration-200">
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Import CSV
                </label>
                <p className="text-xs text-slate-400 mb-3">
                  Upload a single CSV file with words. Words will be split into chapters based on "Words per Puzzle" setting.
                </p>
                <div className="mb-3 p-2.5 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                  <p className="text-xs text-blue-300 font-medium mb-1 flex items-center gap-1.5">
                    <Info className="h-3.5 w-3.5" />
                    Tip: Include Chapter Titles in CSV
                  </p>
                  <p className="text-xs text-blue-200/80 leading-relaxed">
                    If you include chapter titles in your CSV (using <code className="text-blue-300">#TITLE:</code> or title in first column), 
                    <strong className="text-blue-100"> all words from each chapter will go into one puzzle</strong>, regardless of the "Words per Puzzle" setting.
                  </p>
                </div>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-2">
                      Words per Puzzle
                    </label>
                    <input
                      type="number"
                      min="5"
                      max="50"
                      value={csvWordsPerPuzzle}
                      onChange={(e) => setCsvWordsPerPuzzle(Math.max(5, Math.min(50, parseInt(e.target.value) || 15)))}
                      className="w-full px-4 py-2.5 text-sm bg-slate-800/80 border border-slate-700/50 rounded-lg text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 focus:bg-slate-800 transition-all duration-200 shadow-sm"
                    />
                  </div>
                  <label className="flex items-center gap-2 text-sm text-slate-300 mb-3 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={enableWordValidation}
                      onChange={(e) => setEnableWordValidation(e.target.checked)}
                      className="w-4 h-4 rounded border-slate-600 bg-slate-800 text-blue-600 focus:ring-2 focus:ring-blue-500 transition-all"
                    />
                    <span className="group-hover:text-slate-200 transition-colors">Validate words with dictionary (removes spelling errors)</span>
                  </label>
                  <label className="block">
                    <input
                      type="file"
                      accept=".csv"
                      onChange={handleCSVImport}
                      className="hidden"
                      id="csv-import-input"
                    />
                    <Button
                      type="button"
                      onClick={() => document.getElementById('csv-import-input')?.click()}
                      className="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white shadow-lg shadow-purple-500/30 hover:scale-105 active:scale-95 transition-all duration-200 font-semibold"
                      size="sm"
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Import CSV File
                    </Button>
                  </label>
                </div>
              </div>
            )}


            {/* Content Section - Open by default */}
            <div className="bg-slate-900/80 backdrop-blur-sm rounded-xl shadow-lg border border-slate-700/50 overflow-hidden">
              <button
                onClick={() => setIsContentSectionOpen(!isContentSectionOpen)}
                className="w-full flex items-center justify-between p-4 text-left hover:bg-slate-800/50 transition-all duration-200 rounded-t-xl group"
              >
                <h3 className="text-sm font-bold text-slate-200 group-hover:text-white transition-colors">Content</h3>
                <ChevronUp className={`h-4 w-4 text-slate-400 transition-transform duration-300 ${isContentSectionOpen ? 'rotate-0' : 'rotate-180'}`} />
              </button>
              {isContentSectionOpen && (
                <div className="p-5 space-y-5 border-t border-slate-700/50">
                  {/* Main Theme */}
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-2">
                      Main Theme
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={theme}
                        onChange={(e) => setTheme(e.target.value)}
                        placeholder="e.g., Winter, Gardening..."
                        className="flex-1 px-4 py-2.5 bg-slate-800/80 border border-slate-700/50 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 focus:bg-slate-800 transition-all duration-200 text-sm shadow-sm"
                        disabled={isGeneratingStructure}
                      />
                      {mode === 'book' ? (
                        <Button
                          onClick={handleGenerateStructure}
                          disabled={isGeneratingStructure || !theme.trim()}
                          className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg shadow-blue-500/30 hover:scale-105 active:scale-95 transition-all duration-200"
                          size="sm"
                        >
                          <Search className="h-4 w-4" />
                        </Button>
                      ) : (
                        <Button
                          onClick={handleGenerateWords}
                          disabled={isGeneratingWords || !theme.trim()}
                          className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg shadow-blue-500/30 hover:scale-105 active:scale-95 transition-all duration-200"
                          size="sm"
                        >
                          <Search className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Word Validation */}
                  <div>
                    <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={enableWordValidation}
                        onChange={(e) => setEnableWordValidation(e.target.checked)}
                        className="w-4 h-4 rounded border-slate-600 bg-slate-800 text-blue-600 focus:ring-2 focus:ring-blue-500"
                      />
                      <span>Word Validation</span>
                    </label>
                    <p className="text-xs text-slate-400 mt-1 ml-6">
                      Check words against dictionary API (removes spelling errors)
                    </p>
                  </div>

                  {/* Chapter List (Book Mode) */}
                  {mode === 'book' && bookStructure && bookStructure.chapters.length > 0 && (
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="block text-xs font-medium text-slate-400">
                          Chapters ({bookStructure.chapters.length})
                        </label>
                        <Button onClick={handleAddBlankPage} size="sm" variant="outline" className="h-7 text-xs border-slate-600/50 hover:bg-slate-800/80 hover:border-slate-500 px-3 hover:scale-105 active:scale-95 transition-all duration-200 shadow-sm">
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
                                className={`bg-slate-800/80 backdrop-blur-sm rounded-lg px-3 py-2 flex items-center justify-between group text-xs transition-all duration-200 ${chapter.isBlank ? 'border border-dashed border-slate-600/50' : 'border border-slate-700/30'} ${isSelected && hasPuzzle ? 'ring-2 ring-blue-500/50 bg-slate-700/80 shadow-lg shadow-blue-500/20' : ''} ${hasPuzzle && !chapter.isBlank ? 'cursor-pointer hover:bg-slate-700/80 hover:border-slate-600/50 hover:shadow-md' : ''}`}
                                onClick={() => {
                                  if (hasPuzzle && !chapter.isBlank) {
                                    setSelectedPuzzleIndex(index);
                                  }
                                }}
                              >
                                <div className="flex items-center gap-2 overflow-hidden flex-1 min-w-0">
                                  {chapter.isBlank ? (
                                    <File className="h-3 w-3 text-slate-500 shrink-0" />
                                  ) : (
                                    <span className="text-slate-500 w-3 shrink-0">{index + 1}.</span>
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
                                      className="flex-1 px-1.5 py-0.5 bg-slate-700 border border-slate-600 rounded text-xs text-slate-100"
                                      onClick={(e) => e.stopPropagation()}
                                    />
                                  ) : (
                                    <span className={`truncate ${chapter.isBlank ? 'text-slate-500 italic' : 'text-slate-300'}`}>
                                      {chapter.isBlank ? chapter.title : (
                                        <>
                                          {chapter.title} ({chapter.words.length})
                                          {chapter.words.length > csvWordsPerPuzzle && (
                                            <span className="ml-1.5 px-1.5 py-0.5 bg-blue-500/20 text-blue-300 text-[10px] rounded border border-blue-500/30" title={`All ${chapter.words.length} words will be in one puzzle`}>
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
                                  <button onClick={() => moveChapter(index, 'up')} disabled={index === 0} className="p-1.5 rounded-md text-slate-400 hover:text-blue-400 hover:bg-blue-500/10 disabled:opacity-30 transition-all duration-200 hover:scale-110" title="Move up"><ChevronUp className="h-3 w-3" /></button>
                                  <button onClick={() => moveChapter(index, 'down')} disabled={index === bookStructure.chapters.length-1} className="p-1.5 rounded-md text-slate-400 hover:text-blue-400 hover:bg-blue-500/10 disabled:opacity-30 transition-all duration-200 hover:scale-110" title="Move down"><ChevronDown className="h-3 w-3" /></button>
                                  {!chapter.isBlank && <button onClick={() => handleEditChapter(index)} className="p-1.5 rounded-md text-slate-400 hover:text-blue-400 hover:bg-blue-500/10 transition-all duration-200 hover:scale-110" title="Edit title"><Edit2 className="h-3 w-3" /></button>}
                                  {!chapter.isBlank && <button onClick={() => handleEditWords(index)} className="p-1.5 rounded-md text-slate-400 hover:text-green-400 hover:bg-green-500/10 transition-all duration-200 hover:scale-110" title="Edit words"><Search className="h-3 w-3" /></button>}
                                  <button onClick={() => handleDeleteChapter(index)} className="p-1.5 rounded-md text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all duration-200 hover:scale-110" title="Delete"><Trash2 className="h-3 w-3" /></button>
                                </div>
                              </div>
                              {editingWordsIndex === index && !chapter.isBlank && (
                                <div className="mt-1.5 p-2 bg-slate-800 rounded border border-slate-700">
                                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                                    Edit Words for "{chapter.title}"
                                  </label>
                                  <textarea
                                    autoFocus
                                    value={editingWords}
                                    onChange={e => setEditingWords(e.target.value)}
                                    placeholder="WORD1, WORD2, WORD3..."
                                    rows={3}
                                    className="w-full px-3 py-2 bg-slate-700/80 border border-slate-600/50 rounded-lg text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50 transition-all duration-200 resize-none shadow-sm"
                                  />
                                  <div className="flex gap-2 mt-2">
                                    <Button onClick={() => handleSaveWords(index)} size="sm" className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white shadow-lg shadow-green-500/30 hover:scale-105 active:scale-95 transition-all duration-200 text-xs font-semibold">Save</Button>
                                    <Button onClick={handleCancelEditWords} size="sm" variant="outline" className="border-slate-600/50 hover:bg-slate-700/80 hover:border-slate-500 text-xs hover:scale-105 active:scale-95 transition-all duration-200">Cancel</Button>
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                      <div className="mt-3 space-y-2">
                        <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer group">
                          <input
                            type="checkbox"
                            checked={addBlankPagesBetweenChapters}
                            onChange={(e) => setAddBlankPagesBetweenChapters(e.target.checked)}
                            className="w-4 h-4 rounded border-slate-600 bg-slate-800 text-blue-600 focus:ring-2 focus:ring-blue-500 transition-all"
                          />
                          <span className="group-hover:text-slate-200 transition-colors">Add blank pages between chapters</span>
                        </label>
                        <Button
                          onClick={handleGeneratePuzzles}
                          disabled={isGeneratingPuzzle || bookStructure.chapters.length === 0}
                          className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white shadow-lg shadow-green-500/30 hover:scale-105 active:scale-95 transition-all duration-200 text-sm font-semibold"
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

                  {/* Single Mode Word Input */}
                  {mode === 'single' && (
                    <>
                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-2">
                          Number of Words
                        </label>
                        <input
                          type="number"
                          value={singleWords}
                          onChange={(e) => setSingleWords(parseInt(e.target.value) || 20)}
                          min={5}
                          max={50}
                          className="w-full px-4 py-2.5 bg-slate-800/80 border border-slate-700/50 rounded-lg text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 focus:bg-slate-800 transition-all duration-200 text-sm shadow-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-2">
                          Custom Words (Optional)
                        </label>
                        <textarea
                          value={customWords}
                          onChange={(e) => setCustomWords(e.target.value)}
                          placeholder="snowflake, icicle, blizzard..."
                          rows={3}
                          className="w-full px-4 py-2.5 bg-slate-800/80 border border-slate-700/50 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 focus:bg-slate-800 transition-all duration-200 resize-none text-sm shadow-sm"
                        />
                      </div>
                      {generatedWords.length > 0 && (
                        <div>
                          <label className="block text-xs font-semibold text-slate-300 mb-2">
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
                            className="w-full px-4 py-2.5 bg-slate-800/80 border border-slate-700/50 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 focus:bg-slate-800 transition-all duration-200 resize-none text-sm shadow-sm"
                          />
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Settings Section - Collapsed by default */}
            <div className="bg-slate-900/80 backdrop-blur-sm rounded-xl shadow-lg border border-slate-700/50 overflow-hidden">
              <button
                onClick={() => setIsSettingsSectionOpen(!isSettingsSectionOpen)}
                className="w-full flex items-center justify-between p-4 text-left hover:bg-slate-800/50 transition-all duration-200 rounded-t-xl group"
              >
                <h3 className="text-sm font-bold text-slate-200 group-hover:text-white transition-colors">Settings</h3>
                <ChevronUp className={`h-4 w-4 text-slate-400 transition-transform duration-300 ${isSettingsSectionOpen ? 'rotate-0' : 'rotate-180'}`} />
              </button>
              {isSettingsSectionOpen && (
                <div className="p-5 space-y-5 border-t border-slate-700/50">
                  {/* Grid Size - Slider */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-3">
                      Grid Size: <span className="text-blue-400 font-bold">{gridSize}×{gridSize}</span>
                    </label>
                    <input
                      type="range"
                      min="5"
                      max="30"
                      step="1"
                      value={gridSize}
                      onChange={(e) => setGridSize(parseInt(e.target.value))}
                      className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-600"
                    />
                    <div className="flex justify-between text-xs text-slate-500 mt-2">
                      <span>5</span>
                      <span>15</span>
                      <span>30</span>
                    </div>
                  </div>

                  {/* Difficulty */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-2">
                      Difficulty
                    </label>
                    <select
                      value={difficulty}
                      onChange={(e) => setDifficulty(e.target.value as Difficulty)}
                      className="w-full px-4 py-2.5 bg-slate-800/80 border border-slate-700/50 rounded-lg text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-200 text-sm shadow-sm"
                    >
                      <option value="easy">Easy</option>
                      <option value="medium">Medium</option>
                      <option value="hard">Hard</option>
                    </select>
                  </div>
                </div>
              )}
            </div>

            {/* Book Config Section - Collapsed by default (Book Mode Only) */}
            {mode === 'book' && (
              <div className="bg-slate-900/80 backdrop-blur-sm rounded-xl shadow-lg border border-slate-700/50 overflow-hidden">
                <button
                  onClick={() => setIsBookConfigSectionOpen(!isBookConfigSectionOpen)}
                  className="w-full flex items-center justify-between p-4 text-left hover:bg-slate-800/50 transition-all duration-200 rounded-t-xl group"
                >
                  <h3 className="text-sm font-bold text-slate-200 group-hover:text-white transition-colors">Book Config</h3>
                  <ChevronUp className={`h-4 w-4 text-slate-400 transition-transform duration-300 ${isBookConfigSectionOpen ? 'rotate-0' : 'rotate-180'}`} />
                </button>
                {isBookConfigSectionOpen && (
                  <div className="p-5 space-y-5 border-t border-slate-700/50">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-2">
                        Words per Puzzle
                      </label>
                      <input
                        type="number"
                        value={wordsPerPuzzle}
                        onChange={(e) => setWordsPerPuzzle(parseInt(e.target.value) || 15)}
                        min={5}
                        max={30}
                        className="w-full px-4 py-2.5 bg-slate-800/80 border border-slate-700/50 rounded-lg text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 focus:bg-slate-800 transition-all duration-200 text-sm shadow-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-2">
                        Number of Chapters
                      </label>
                      <input
                        type="number"
                        value={numChapters}
                        onChange={(e) => setNumChapters(parseInt(e.target.value) || 25)}
                        min={5}
                        max={100}
                        className="w-full px-4 py-2.5 bg-slate-800/80 border border-slate-700/50 rounded-lg text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 focus:bg-slate-800 transition-all duration-200 text-sm shadow-sm"
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Mode-specific Controls */}


            {/* Generate Button (Single Mode) */}
            {mode === 'single' && (
              <Button
                onClick={handleGenerateSinglePuzzle}
                disabled={isGeneratingPuzzle || (generatedWords.length === 0 && !customWords.trim())}
                className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-xl shadow-blue-500/30 hover:scale-105 active:scale-95 transition-all duration-200 font-bold"
                size="lg"
              >
                {isGeneratingPuzzle ? 'Generating...' : 'Generate Puzzle'}
              </Button>
            )}

            {/* Progress indicator for puzzle generation - Moved to modal overlay */}

          </aside>

          {/* Right Side - Preview */}
          <main className="overflow-hidden flex flex-col">
            {/* Puzzle Preview */}
            <div className="flex-1 overflow-auto min-h-0">
              {displayPuzzle ? (
                'isBlank' in displayPuzzle ? (
                  <div className="h-full flex items-center justify-center bg-slate-100 rounded-lg border border-slate-300 text-slate-400">
                    <div className="text-center">
                      <File className="h-16 w-16 mx-auto mb-2 text-slate-300" />
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
                <div className="h-full flex items-center justify-center bg-slate-900/80 backdrop-blur-sm rounded-xl shadow-xl border border-slate-700/50">
                  <div className="text-center">
                    <div className="bg-blue-500/10 p-4 rounded-2xl inline-block mb-4 ring-2 ring-blue-500/20">
                      <BookOpen className="h-16 w-16 mx-auto text-blue-400 drop-shadow-lg" />
                    </div>
                    <p className="text-slate-300 font-medium">Click "Generate Pages" to create puzzles for all chapters</p>
                  </div>
                </div>
              ) : (
                <div className="h-full flex items-center justify-center bg-slate-900/80 backdrop-blur-sm rounded-xl shadow-xl border border-slate-700/50 p-6">
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
        puzzles={mode === 'book' 
          ? bookPuzzles 
          : puzzle 
            ? [{ ...puzzle, chapterTitle: theme || 'Puzzle' }]
            : []}
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
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-8 border border-slate-700/50 shadow-2xl min-w-[400px] max-w-[500px] animate-in zoom-in-95 duration-300">
            <div className="space-y-5">
              <div className="text-center">
                <div className="bg-blue-500/10 p-3 rounded-2xl inline-block mb-3 ring-2 ring-blue-500/20">
                  <Sparkles className="h-8 w-8 text-blue-400 animate-pulse" />
                </div>
                <h3 className="text-xl font-extrabold bg-gradient-to-r from-slate-100 to-slate-300 bg-clip-text text-transparent mb-2">
                  Generating Puzzles...
                </h3>
                <p className="text-sm text-slate-400 font-medium">
                  {bookStructure?.chapters[generationProgress.current - 1]?.title || `Puzzle ${generationProgress.current}`}
                </p>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-slate-300">
                    Progress
                  </span>
                  <span className="text-sm text-slate-300 font-bold bg-blue-500/20 px-3 py-1 rounded-full">
                    {Math.round((generationProgress.current / generationProgress.total) * 100)}%
                  </span>
                </div>
                <div className="w-full bg-slate-800/50 rounded-full h-5 overflow-hidden shadow-inner">
                  <div 
                    className="bg-gradient-to-r from-green-500 via-green-600 to-green-500 h-5 rounded-full transition-all duration-300 ease-out shadow-lg shadow-green-500/30"
                    style={{ width: `${Math.min((generationProgress.current / generationProgress.total) * 100, 100)}%` }}
                  />
                </div>
                <div className="flex items-center justify-center text-xs text-slate-400 font-medium">
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
  );
}
