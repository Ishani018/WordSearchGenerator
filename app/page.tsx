'use client';

import { useState, useEffect, useCallback } from 'react';
import { Search, Download, Sparkles, Grid3x3, BookOpen, Edit2, Trash2, Plus, Upload, FilePlus, ChevronUp, ChevronDown, File, FileText, Type, Copy, Check, HelpCircle } from 'lucide-react';
import { generateWordsFromTheme } from '@/lib/word-generator';
import { generatePuzzle, type PuzzleResult } from '@/lib/puzzle-generator';
import PuzzlePreview from '@/components/PuzzlePreview';
import PDFDownloadButton, { PDFPageItem } from '@/components/PDFDownloadButton';
import PDFPreviewModal from '@/components/PDFPreviewModal';
import { Button } from '@/components/ui/button';
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
  const [isPdfOptionsOpen, setIsPdfOptionsOpen] = useState(true); // PDF Options collapsed state
  const [addBlankPagesBetweenChapters, setAddBlankPagesBetweenChapters] = useState(false);

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
                return upperWord.length >= 4 && 
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
            return upperWord.length >= 4 && 
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
            return upperWord.length >= 4 && 
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
        .filter(w => w.length >= 4 && /^[A-Z]+$/.test(w));
      
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
      const { words, hasClues } = parseCSV(text);

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
        const isValid = word.length >= 4 && word.length <= maxWordLength && /^[A-Z]+$/.test(word);
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
          if (cleanWord.length < 4) {
            rejectedWords.push({ word: cleanWord, reason: `Too short (${cleanWord.length} letters, min: 4)` });
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
        return word.length <= maxWordLength && word.length >= 4 && /^[A-Z]+$/.test(word);
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
      <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Left: Logo and Title */}
            <div className="flex items-center gap-3">
              <BookOpen className="h-6 w-6 text-blue-400" />
              <h1 className="text-2xl font-bold">Printable Puzzle Book Generator</h1>
            </div>
            
            {/* Center: Mode Toggle */}
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

            {/* Right: Help and Logout Buttons */}
            <div className="flex gap-2">
              <Button
                onClick={() => setShowHelpModal(true)}
                variant="outline"
                size="sm"
                className="border-slate-600 hover:bg-slate-800 text-slate-300"
                title="Help & Instructions"
              >
                <HelpCircle className="h-4 w-4 mr-2" />
                Help
              </Button>
              <Button
                onClick={handleLogout}
                variant="outline"
                size="sm"
                className="border-slate-600 hover:bg-slate-800 text-slate-300"
              >
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Layout */}
      <div className="container mx-auto px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-[400px_1fr] gap-6 h-[calc(100vh-120px)]">
          {/* Left Sidebar - Controls */}
          <aside className="space-y-4 overflow-y-auto pr-2">
            {/* Structure Generation Progress (Book Mode) - Moved to top for visibility */}
            {mode === 'book' && isGeneratingStructure && (
              <div className="bg-blue-600 rounded-lg p-4 border border-blue-500 shadow-lg">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-white">
                      {structureProgress.status || 'Generating book structure...'}
                    </span>
                    {structureProgress.total > 0 && (
                      <span className="text-xs text-blue-100 font-semibold">
                        {Math.round((structureProgress.current / structureProgress.total) * 100)}%
                      </span>
                    )}
                  </div>
                  <div className="w-full bg-blue-800 rounded-full h-4 overflow-hidden">
                    <div 
                      className="bg-white h-4 rounded-full transition-all duration-200 ease-out"
                      style={{ 
                        width: structureProgress.total > 0 
                          ? `${Math.min((structureProgress.current / structureProgress.total) * 100, 100)}%`
                          : '30%' // Indeterminate progress
                      }}
                    />
                  </div>
                  {structureProgress.total > 0 && (
                    <div className="text-xs text-blue-100 text-center">
                      {structureProgress.current} / {structureProgress.total} chapters
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Word Generation Progress (Single Mode) - Moved to top for visibility */}
            {mode === 'single' && isGeneratingWords && (
              <div className="bg-blue-600 rounded-lg p-4 border border-blue-500 shadow-lg">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-white">
                      {wordGenerationProgress.status || 'Generating words...'}
                    </span>
                    {wordGenerationProgress.total > 0 && (
                      <span className="text-xs text-blue-100 font-semibold">
                        {Math.round((wordGenerationProgress.current / wordGenerationProgress.total) * 100)}%
                      </span>
                    )}
                  </div>
                  <div className="w-full bg-blue-800 rounded-full h-4 overflow-hidden">
                    <div 
                      className="bg-white h-4 rounded-full transition-all duration-200 ease-out"
                      style={{ 
                        width: wordGenerationProgress.total > 0 
                          ? `${Math.min((wordGenerationProgress.current / wordGenerationProgress.total) * 100, 100)}%`
                          : '30%' // Indeterminate progress
                      }}
                    />
                  </div>
                  {wordGenerationProgress.total > 0 && (
                    <div className="text-xs text-blue-100 text-center">
                      {wordGenerationProgress.current} / {wordGenerationProgress.total} words
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Single CSV Import (Book Mode) */}
            {mode === 'book' && (
              <div className="bg-slate-900 rounded-lg p-4 border border-slate-800">
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Import CSV
                </label>
                <p className="text-xs text-slate-400 mb-3">
                  Upload a single CSV file with words. Words will be split into chapters based on "Words per Puzzle" setting.
                </p>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">
                      Words per Puzzle
                    </label>
                    <input
                      type="number"
                      min="5"
                      max="50"
                      value={csvWordsPerPuzzle}
                      onChange={(e) => setCsvWordsPerPuzzle(Math.max(5, Math.min(50, parseInt(e.target.value) || 15)))}
                      className="w-full px-2 py-1.5 text-sm bg-slate-800 border border-slate-700 rounded-md text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <label className="flex items-center gap-2 text-sm text-slate-300 mb-2">
                    <input
                      type="checkbox"
                      checked={enableWordValidation}
                      onChange={(e) => setEnableWordValidation(e.target.checked)}
                      className="w-4 h-4"
                    />
                    <span>Validate words with dictionary (removes spelling errors)</span>
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
                      className="w-full bg-purple-600 hover:bg-purple-700"
                      size="sm"
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Import CSV File
                    </Button>
                  </label>
                </div>
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

            {/* Chapter Management (Book Mode) */}
            {mode === 'book' && bookStructure && !isGeneratingStructure && (
              <div className="bg-slate-900 rounded-lg p-4 border border-slate-800">
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-sm font-medium text-slate-300">Pages ({bookStructure.chapters.length})</label>
                  <Button onClick={handleAddBlankPage} size="sm" variant="outline" className="h-7 text-xs border-slate-600 hover:bg-slate-800">
                    <FilePlus className="h-3 w-3 mr-1" /> Add Empty Page
                  </Button>
                </div>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {bookStructure.chapters.map((chapter, index) => {
                    const hasPuzzle = bookPuzzles.length > 0 && bookPuzzles[index] !== undefined;
                    const isSelected = selectedPuzzleIndex === index;
                    return (
                    <div key={index}>
                      <div 
                        className={`bg-slate-800 rounded p-2 flex items-center justify-between group ${chapter.isBlank ? 'border border-dashed border-slate-600' : ''} ${isSelected && hasPuzzle ? 'ring-2 ring-blue-500 bg-slate-700' : ''} ${hasPuzzle && !chapter.isBlank ? 'cursor-pointer hover:bg-slate-700' : ''}`}
                        onClick={() => {
                          if (hasPuzzle && !chapter.isBlank) {
                            setSelectedPuzzleIndex(index);
                          }
                        }}
                      >
                        <div className="flex items-center gap-2 overflow-hidden flex-1">
                          {chapter.isBlank ? <File className="h-4 w-4 text-slate-500 shrink-0" /> : <span className="text-xs text-slate-500 w-4">{index + 1}.</span>}
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
                              className="flex-1 px-2 py-1 bg-slate-700 border border-slate-600 rounded text-sm text-slate-100"
                              onClick={(e) => e.stopPropagation()}
                            />
                          ) : (
                            <span className={`text-sm truncate ${chapter.isBlank ? 'text-slate-500 italic' : 'text-slate-300'}`}>
                              {chapter.isBlank ? chapter.title : `${chapter.title} (${chapter.words.length} words)${hasPuzzle ? ' ✓' : ''}`}
                            </span>
                          )}
                        </div>
                        
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                          <button onClick={() => moveChapter(index, 'up')} disabled={index === 0} className="p-1 text-slate-400 hover:text-blue-400 disabled:opacity-30"><ChevronUp className="h-3 w-3" /></button>
                          <button onClick={() => moveChapter(index, 'down')} disabled={index === bookStructure.chapters.length-1} className="p-1 text-slate-400 hover:text-blue-400 disabled:opacity-30"><ChevronDown className="h-3 w-3" /></button>
                          {!chapter.isBlank && <button onClick={() => handleEditChapter(index)} className="p-1 text-slate-400 hover:text-blue-400" title="Edit title"><Edit2 className="h-3 w-3" /></button>}
                          {!chapter.isBlank && <button onClick={() => handleEditWords(index)} className="p-1 text-slate-400 hover:text-green-400" title="Edit words"><Search className="h-3 w-3" /></button>}
                          <button onClick={() => handleDeleteChapter(index)} className="p-1 text-slate-400 hover:text-red-400" title="Delete"><Trash2 className="h-3 w-3" /></button>
                        </div>
                      </div>
                      {editingWordsIndex === index && !chapter.isBlank && (
                        <div className="mt-2 p-3 bg-slate-800 rounded border border-slate-700">
                          <label className="block text-xs font-medium text-slate-300 mb-2">
                            Edit Words for "{chapter.title}" (comma or newline separated)
                          </label>
                          <textarea
                            autoFocus
                            value={editingWords}
                            onChange={e => setEditingWords(e.target.value)}
                            placeholder="WORD1, WORD2, WORD3..."
                            rows={4}
                            className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
                          />
                          <div className="flex gap-2 mt-2">
                            <Button onClick={() => handleSaveWords(index)} size="sm" className="bg-green-600 hover:bg-green-700 text-white">Save Words</Button>
                            <Button onClick={handleCancelEditWords} size="sm" variant="outline" className="border-slate-600 hover:bg-slate-700">Cancel</Button>
                          </div>
                          <p className="text-xs text-slate-400 mt-2">Words will be automatically converted to uppercase. Only letters allowed (4+ characters).</p>
                        </div>
                      )}
                    </div>
                    );
                  })}
                </div>
                <div className="mt-3 space-y-2">
                  <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={addBlankPagesBetweenChapters}
                      onChange={(e) => setAddBlankPagesBetweenChapters(e.target.checked)}
                      className="w-4 h-4 rounded border-slate-600 bg-slate-800 text-blue-600 focus:ring-2 focus:ring-blue-500"
                    />
                    <span>Add blank pages between chapters</span>
                  </label>
                  <Button
                    onClick={handleGeneratePuzzles}
                    disabled={isGeneratingPuzzle || bookStructure.chapters.length === 0}
                    className="w-full bg-green-600 hover:bg-green-700"
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

            {/* Consolidated Controls Block */}
            <div className="bg-slate-900 rounded-lg p-4 border border-slate-800">
              <h3 className="text-sm font-semibold text-slate-300 mb-4">Puzzle Settings</h3>
              
              <div className="space-y-4">
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
                      className="flex-1 px-3 py-2 bg-slate-800 border border-slate-700 rounded-md text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      disabled={isGeneratingStructure}
                    />
                    {mode === 'book' ? (
                      <Button
                        onClick={handleGenerateStructure}
                        disabled={isGeneratingStructure || !theme.trim()}
                        className="bg-blue-600 hover:bg-blue-700"
                        size="sm"
                      >
                        <Search className="h-4 w-4" />
                      </Button>
                    ) : (
                      <Button
                        onClick={handleGenerateWords}
                        disabled={isGeneratingWords || !theme.trim()}
                        className="bg-blue-600 hover:bg-blue-700"
                        size="sm"
                      >
                        <Search className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>

                {/* Word Validation - Directly under theme */}
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

                {/* Difficulty */}
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">
                    Difficulty
                  </label>
                  <select
                    value={difficulty}
                    onChange={(e) => setDifficulty(e.target.value as Difficulty)}
                    className="w-full px-2 py-1.5 bg-slate-800 border border-slate-700 rounded-md text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  >
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </select>
                </div>

                {/* Words per Puzzle / Number of Words */}
                {mode === 'book' ? (
                  <>
                    <div>
                      <label className="block text-xs font-medium text-slate-400 mb-1">
                        Words per Puzzle
                      </label>
                      <input
                        type="number"
                        value={wordsPerPuzzle}
                        onChange={(e) => setWordsPerPuzzle(parseInt(e.target.value) || 15)}
                        min={5}
                        max={30}
                        className="w-full px-2 py-1.5 bg-slate-800 border border-slate-700 rounded-md text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-400 mb-1">
                        Number of Chapters
                      </label>
                      <input
                        type="number"
                        value={numChapters}
                        onChange={(e) => setNumChapters(parseInt(e.target.value) || 25)}
                        min={5}
                        max={100}
                        className="w-full px-2 py-1.5 bg-slate-800 border border-slate-700 rounded-md text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      />
                    </div>
                  </>
                ) : (
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">
                      Number of Words
                    </label>
                    <input
                      type="number"
                      value={singleWords}
                      onChange={(e) => setSingleWords(parseInt(e.target.value) || 20)}
                      min={5}
                      max={50}
                      className="w-full px-2 py-1.5 bg-slate-800 border border-slate-700 rounded-md text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Chapter Management (Book Mode) */}
            {mode === 'book' && bookStructure && !isGeneratingStructure && (
              <div className="bg-slate-900 rounded-lg p-4 border border-slate-800">
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-sm font-medium text-slate-300">Pages ({bookStructure.chapters.length})</label>
                  <Button onClick={handleAddBlankPage} size="sm" variant="outline" className="h-7 text-xs border-slate-600 hover:bg-slate-800">
                    <FilePlus className="h-3 w-3 mr-1" /> Add Empty Page
                  </Button>
                </div>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {bookStructure.chapters.map((chapter, index) => {
                    const hasPuzzle = bookPuzzles.length > 0 && bookPuzzles[index] !== undefined;
                    const isSelected = selectedPuzzleIndex === index;
                    return (
                    <div key={index}>
                      <div 
                        className={`bg-slate-800 rounded p-2 flex items-center justify-between group ${chapter.isBlank ? 'border border-dashed border-slate-600' : ''} ${isSelected && hasPuzzle ? 'ring-2 ring-blue-500 bg-slate-700' : ''} ${hasPuzzle && !chapter.isBlank ? 'cursor-pointer hover:bg-slate-700' : ''}`}
                        onClick={() => {
                          if (hasPuzzle && !chapter.isBlank) {
                            setSelectedPuzzleIndex(index);
                          }
                        }}
                      >
                        <div className="flex items-center gap-2 overflow-hidden flex-1">
                          {chapter.isBlank ? <File className="h-4 w-4 text-slate-500 shrink-0" /> : <span className="text-xs text-slate-500 w-4">{index + 1}.</span>}
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
                              className="flex-1 px-2 py-1 bg-slate-700 border border-slate-600 rounded text-sm text-slate-100"
                              onClick={(e) => e.stopPropagation()}
                            />
                          ) : (
                            <span className={`text-sm truncate ${chapter.isBlank ? 'text-slate-500 italic' : 'text-slate-300'}`}>
                              {chapter.isBlank ? chapter.title : `${chapter.title} (${chapter.words.length} words)${hasPuzzle ? ' ✓' : ''}`}
                            </span>
                          )}
                        </div>
                        
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                          <button onClick={() => moveChapter(index, 'up')} disabled={index === 0} className="p-1 text-slate-400 hover:text-blue-400 disabled:opacity-30"><ChevronUp className="h-3 w-3" /></button>
                          <button onClick={() => moveChapter(index, 'down')} disabled={index === bookStructure.chapters.length-1} className="p-1 text-slate-400 hover:text-blue-400 disabled:opacity-30"><ChevronDown className="h-3 w-3" /></button>
                          {!chapter.isBlank && <button onClick={() => handleEditChapter(index)} className="p-1 text-slate-400 hover:text-blue-400" title="Edit title"><Edit2 className="h-3 w-3" /></button>}
                          {!chapter.isBlank && <button onClick={() => handleEditWords(index)} className="p-1 text-slate-400 hover:text-green-400" title="Edit words"><Search className="h-3 w-3" /></button>}
                          <button onClick={() => handleDeleteChapter(index)} className="p-1 text-slate-400 hover:text-red-400" title="Delete"><Trash2 className="h-3 w-3" /></button>
                        </div>
                      </div>
                      {editingWordsIndex === index && !chapter.isBlank && (
                        <div className="mt-2 p-3 bg-slate-800 rounded border border-slate-700">
                          <label className="block text-xs font-medium text-slate-300 mb-2">
                            Edit Words for "{chapter.title}" (comma or newline separated)
                          </label>
                          <textarea
                            autoFocus
                            value={editingWords}
                            onChange={e => setEditingWords(e.target.value)}
                            placeholder="WORD1, WORD2, WORD3..."
                            rows={4}
                            className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
                          />
                          <div className="flex gap-2 mt-2">
                            <Button onClick={() => handleSaveWords(index)} size="sm" className="bg-green-600 hover:bg-green-700 text-white">Save Words</Button>
                            <Button onClick={handleCancelEditWords} size="sm" variant="outline" className="border-slate-600 hover:bg-slate-700">Cancel</Button>
                          </div>
                          <p className="text-xs text-slate-400 mt-2">Words will be automatically converted to uppercase. Only letters allowed (4+ characters).</p>
                        </div>
                      )}
                    </div>
                    );
                  })}
                </div>
                <div className="mt-3 space-y-2">
                  <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={addBlankPagesBetweenChapters}
                      onChange={(e) => setAddBlankPagesBetweenChapters(e.target.checked)}
                      className="w-4 h-4 rounded border-slate-600 bg-slate-800 text-blue-600 focus:ring-2 focus:ring-blue-500"
                    />
                    <span>Add blank pages between chapters</span>
                  </label>
                  <Button
                    onClick={handleGeneratePuzzles}
                    disabled={isGeneratingPuzzle || bookStructure.chapters.length === 0}
                    className="w-full bg-green-600 hover:bg-green-700"
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
                <p className="text-xs text-slate-400 mt-2">Enter words separated by commas or newlines. Words will be converted to uppercase.</p>
              </div>
            )}

            {/* Generated Words Editor (Single Mode) */}
            {mode === 'single' && generatedWords.length > 0 && (
              <div className="bg-slate-900 rounded-lg p-4 border border-slate-800">
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Generated Words (Editable)
                </label>
                <textarea
                  value={generatedWords.join(', ')}
                  onChange={(e) => {
                    const words = e.target.value
                      .split(/[,\n]/)
                      .map(w => w.trim().toUpperCase())
                      .filter(w => w.length >= 4 && /^[A-Z]+$/.test(w));
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
                  rows={6}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-md text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
                <p className="text-xs text-slate-400 mt-2">Edit words here. Puzzle will auto-update when you make changes. Words must be 4+ letters, only A-Z.</p>
              </div>
            )}

            {/* Mode-specific Controls */}


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

          </aside>

          {/* Right Side - Preview */}
          <main className="overflow-hidden flex flex-col">
            {/* PDF Options - Moved to top of preview area */}
            {((mode === 'book' && bookPuzzles.length > 0) || (mode === 'single' && puzzle)) && (
              <div className="bg-slate-900 rounded-lg border border-slate-800 mb-4">
                <button
                  onClick={() => setIsPdfOptionsOpen(!isPdfOptionsOpen)}
                  className="w-full flex items-center justify-between p-4 text-left hover:bg-slate-800 transition-colors rounded-t-lg"
                >
                  <h3 className="text-sm font-semibold text-slate-300">PDF Options</h3>
                  {isPdfOptionsOpen ? (
                    <ChevronUp className="h-4 w-4 text-slate-400" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-slate-400" />
                  )}
                </button>
                {isPdfOptionsOpen && (
                  <div className="p-4 overflow-y-auto max-h-[40vh]">
                
                {/* Book Title (Book Mode Only) */}
                {mode === 'book' && (
                  <div className="mb-4">
                    <label className="block text-xs text-slate-400 mb-1">
                      Book Title
                    </label>
                    <input
                      type="text"
                      value={bookStructure?.bookTitle || ''}
                      onChange={(e) => {
                        if (bookStructure) {
                          setBookStructure({ ...bookStructure, bookTitle: e.target.value });
                        } else {
                          setBookStructure({ bookTitle: e.target.value, chapters: [] });
                        }
                      }}
                      placeholder="Enter book title"
                      className="w-full px-2 py-1.5 text-sm bg-slate-800 border border-slate-700 rounded-md text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                )}

                {/* KDP Marketing Tools (Book Mode Only) */}
                {mode === 'book' && bookStructure && bookStructure.chapters.length > 0 && (
                  <div className="mb-4 p-3 bg-slate-800 rounded border border-slate-700">
                    <label className="block text-xs font-medium text-slate-300 mb-2">KDP Marketing Tools</label>
                    <div className="flex gap-2 mb-3">
                      <Button
                        onClick={handleGenerateBookTitles}
                        disabled={isGeneratingKdpContent}
                        className="flex-1 bg-purple-600 hover:bg-purple-700 text-white"
                        size="sm"
                      >
                        {isGeneratingKdpContent && kdpContentType === 'titles' ? (
                          'Generating...'
                        ) : (
                          <>
                            <Type className="h-4 w-4 mr-2" />
                            Generate Titles
                          </>
                        )}
                      </Button>
                      <Button
                        onClick={handleGenerateKdpDescription}
                        disabled={isGeneratingKdpContent}
                        className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white"
                        size="sm"
                      >
                        {isGeneratingKdpContent && kdpContentType === 'description' ? (
                          'Generating...'
                        ) : (
                          <>
                            <FileText className="h-4 w-4 mr-2" />
                            Generate Description
                          </>
                        )}
                      </Button>
                    </div>

                    {/* Generated Titles Display */}
                    {kdpTitles && kdpTitles.length > 0 && (
                      <div className="mb-3 p-2 bg-slate-700 rounded border border-slate-600">
                        <div className="flex items-center justify-between mb-2">
                          <label className="text-xs font-medium text-slate-300">Suggested Titles:</label>
                          <button
                            onClick={() => {
                              const allTitles = kdpTitles.join('\n');
                              handleCopyToClipboard(allTitles, 'titles');
                            }}
                            className="p-1 text-slate-400 hover:text-blue-400 transition-colors"
                            title="Copy all titles"
                          >
                            {copiedText === 'titles' ? (
                              <Check className="h-3 w-3 text-green-400" />
                            ) : (
                              <Copy className="h-3 w-3" />
                            )}
                          </button>
                        </div>
                        <div className="space-y-1 max-h-32 overflow-y-auto">
                          {kdpTitles.map((title, index) => (
                            <div key={index} className="flex items-start gap-2 p-1.5 bg-slate-600 rounded hover:bg-slate-500 transition-colors">
                              <span className="text-xs text-slate-400 mt-0.5">{index + 1}.</span>
                              <span className="flex-1 text-xs text-slate-200">{title}</span>
                              <button
                                onClick={() => {
                                  handleCopyToClipboard(title, `title-${index}`);
                                  if (bookStructure) {
                                    setBookStructure({ ...bookStructure, bookTitle: title });
                                  }
                                }}
                                className="p-0.5 text-slate-400 hover:text-blue-400 transition-colors shrink-0"
                                title="Copy and use as book title"
                              >
                                {copiedText === `title-${index}` ? (
                                  <Check className="h-3 w-3 text-green-400" />
                                ) : (
                                  <Copy className="h-3 w-3" />
                                )}
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Generated Description Display */}
                    {kdpDescription && (
                      <div className="p-2 bg-slate-700 rounded border border-slate-600">
                        <div className="flex items-center justify-between mb-2">
                          <label className="text-xs font-medium text-slate-300">KDP Description:</label>
                          <button
                            onClick={() => handleCopyToClipboard(kdpDescription, 'description')}
                            className="p-1 text-slate-400 hover:text-blue-400 transition-colors"
                            title="Copy description"
                          >
                            {copiedText === 'description' ? (
                              <Check className="h-3 w-3 text-green-400" />
                            ) : (
                              <Copy className="h-3 w-3" />
                            )}
                          </button>
                        </div>
                        <p className="text-xs text-slate-300 whitespace-pre-wrap max-h-24 overflow-y-auto">{kdpDescription}</p>
                      </div>
                    )}
                  </div>
                )}
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  {/* Font Selection */}
                  <div>
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
                            'playpen-sans': '"Playpen Sans", cursive',
                            'playpen-sans-bold': '"Playpen Sans", cursive',
                            'schoolbell': '"Schoolbell", cursive',
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
                  
                  {/* Grid Letter Size */}
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">
                      Grid Letter Size ({fontSize}pt)
                    </label>
                    <input
                      type="range"
                      min="4"
                      max="20"
                      step="1"
                      value={fontSize}
                      onChange={(e) => setFontSize(parseInt(e.target.value))}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-slate-500 mt-1">
                      <span>4pt</span>
                      <span>12pt</span>
                      <span>20pt</span>
                    </div>
                  </div>

                  {/* Heading Size */}
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">
                      Puzzle Title Size ({headingSize}pt)
                    </label>
                    <input
                      type="range"
                      min="10"
                      max="24"
                      step="1"
                      value={headingSize}
                      onChange={(e) => setHeadingSize(parseInt(e.target.value))}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-slate-500 mt-1">
                      <span>10pt</span>
                      <span>16pt</span>
                      <span>24pt</span>
                    </div>
                  </div>
                </div>

                {/* Page Size Selector */}
                <div className="mb-4">
                  <label className="block text-xs text-slate-400 mb-1">Page Size (PDF)</label>
                  <select 
                    className="w-full px-2 py-1.5 text-sm bg-slate-800 border border-slate-700 rounded-md text-slate-100 mb-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    onChange={(e) => {
                      if (e.target.value === 'custom') {
                        setIsCustomSize(true);
                      } else {
                        setIsCustomSize(false);
                        const size = PAGE_SIZES.find(s => s.name === e.target.value);
                        if (size) setPageSize(size);
                      }
                    }}
                    value={isCustomSize ? 'custom' : pageSize.name}
                  >
                    {PAGE_SIZES.map(s => <option key={s.name} value={s.name}>{s.name}</option>)}
                    <option value="custom">Custom Size...</option>
                  </select>
                  
                  {isCustomSize && (
                    <div className="flex gap-2 items-center">
                      <input 
                        type="number" 
                        className="w-20 px-2 py-1 bg-slate-800 border border-slate-700 rounded text-slate-100 text-sm" 
                        placeholder="W" 
                        step="0.1"
                        value={customPageSize.width}
                        onChange={e => {
                          const w = parseFloat(e.target.value);
                          setCustomPageSize(p => ({ ...p, width: w }));
                          setPageSize({ ...pageSize, width: w });
                        }}
                      />
                      <span className="text-slate-500">x</span>
                      <input 
                        type="number" 
                        className="w-20 px-2 py-1 bg-slate-800 border border-slate-700 rounded text-slate-100 text-sm" 
                        placeholder="H" 
                        step="0.1"
                        value={customPageSize.height}
                        onChange={e => {
                          const h = parseFloat(e.target.value);
                          setCustomPageSize(p => ({ ...p, height: h }));
                          setPageSize({ ...pageSize, height: h });
                        }}
                      />
                      <span className="text-xs text-slate-400">in</span>
                    </div>
                  )}
                </div>

                {/* Book Mode Only Options */}
                {mode === 'book' && (
                  <div className="mb-4 space-y-2">
                    {/* Include Title Page */}
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={includeTitlePage}
                        onChange={(e) => setIncludeTitlePage(e.target.checked)}
                        className="w-4 h-4 text-blue-600 bg-slate-800 border-slate-700 rounded focus:ring-blue-500"
                      />
                      <span className="text-sm text-slate-300">Include Title Page</span>
                    </label>
                    
                    {/* Include "This Book Belongs To" Page */}
                    <label className="flex items-center gap-2 cursor-pointer">
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
                      <div className="mt-2">
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
                  </div>
                )}

                {/* Download Buttons */}
                <div className="space-y-2">
                  {mode === 'book' && bookPuzzles.length > 0 && (
                    <>
                      <PDFPreviewModal
                        puzzles={bookPuzzles}
                        title={bookStructure?.bookTitle || theme || 'Word Search Puzzle Book'}
                        includeTitlePage={includeTitlePage}
                        includeBelongsToPage={includeBelongsToPage}
                        copyrightText={copyrightText}
                        fontId={selectedFont}
                        fontSize={fontSize}
                        headingSize={headingSize}
                        pageFormat={pageSize}
                      />
                      <PDFDownloadButton
                        puzzles={bookPuzzles}
                        title={bookStructure?.bookTitle || theme || 'Word Search Puzzle Book'}
                        includeTitlePage={includeTitlePage}
                        includeBelongsToPage={includeBelongsToPage}
                        copyrightText={copyrightText}
                        fontId={selectedFont}
                        fontSize={fontSize}
                        headingSize={headingSize}
                        pageFormat={pageSize}
                      />
                    </>
                  )}
                  {mode === 'single' && puzzle && (
                    <>
                      <PDFPreviewModal
                        puzzles={[{ ...puzzle, chapterTitle: theme || 'Puzzle' }]}
                        title={`Word Search - ${theme || 'Puzzle'}`}
                        fontId={selectedFont}
                        fontSize={fontSize}
                        headingSize={headingSize}
                        pageFormat={pageSize}
                      />
                      <PDFDownloadButton
                        puzzles={[{ ...puzzle, chapterTitle: theme || 'Puzzle' }]}
                        title={`Word Search - ${theme || 'Puzzle'}`}
                        fontId={selectedFont}
                        fontSize={fontSize}
                        headingSize={headingSize}
                        pageFormat={pageSize}
                      />
                    </>
                  )}
                </div>
                  </div>
                )}
              </div>
            )}

            {/* Puzzle Preview */}
            <div className={`flex-1 overflow-auto min-h-0 transition-all ${!isPdfOptionsOpen ? 'min-h-[calc(100vh-200px)]' : ''}`}>
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
                <div className="h-full flex items-center justify-center bg-slate-900 rounded-lg border border-slate-800">
                  <div className="text-center">
                    <BookOpen className="h-16 w-16 mx-auto mb-4 text-slate-600" />
                    <p className="text-slate-400">Click "Generate Pages" to create puzzles for all chapters</p>
                  </div>
                </div>
              ) : (
                <div className="h-full flex items-center justify-center bg-slate-900 rounded-lg border border-slate-800 p-6">
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
    </div>
  );
}
