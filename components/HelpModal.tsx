'use client';

import { X, BookOpen, Search, FileText, Download, Upload, Edit2, FilePlus, Type, Grid3x3 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function HelpModal({ isOpen, onClose }: HelpModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-slate-900 rounded-lg shadow-2xl border border-slate-700 w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-600 rounded-lg">
              <BookOpen className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">Complete User Guide</h2>
              <p className="text-sm text-slate-400">Everything you need to know about the Word Search Generator</p>
            </div>
          </div>
          <Button
            onClick={onClose}
            variant="ghost"
            size="sm"
            className="text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          {/* Overview */}
          <section>
            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <Grid3x3 className="h-5 w-5 text-blue-400" />
              Overview
            </h3>
            <div className="bg-slate-800 rounded-lg p-4 space-y-3 text-slate-300">
              <p>
                This application generates professional word search puzzle books optimized for printing and publishing on platforms like Amazon KDP (Kindle Direct Publishing).
              </p>
              <p>
                You can work in two modes: <strong className="text-white">Book Mode</strong> (for creating entire puzzle books with multiple chapters) or <strong className="text-white">Single Puzzle Mode</strong> (for creating individual puzzles).
              </p>
              <p>
                The application uses AI (Groq) to generate words from themes, validates words using a dictionary API, and creates print-ready PDFs with customizable fonts, layouts, and professional formatting.
              </p>
            </div>
          </section>

          {/* Getting Started */}
          <section>
            <h3 className="text-xl font-bold text-white mb-4">Getting Started</h3>
            <div className="bg-slate-800 rounded-lg p-4 space-y-4">
              <div>
                <h4 className="font-semibold text-white mb-2">1. Authentication</h4>
                <p className="text-slate-300 text-sm">
                  When you first visit the site, you'll see a login screen. Enter your username and password to access the application.
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-white mb-2">2. Choose Your Mode</h4>
                <p className="text-slate-300 text-sm mb-2">
                  At the top of the page, you'll see two tabs:
                </p>
                <ul className="list-disc list-inside text-slate-300 text-sm space-y-1 ml-4">
                  <li><strong className="text-white">Book Mode</strong> - Create entire puzzle books with multiple chapters</li>
                  <li><strong className="text-white">Single Puzzle Mode</strong> - Create individual puzzles</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Book Mode - Complete Workflow */}
          <section>
            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-blue-400" />
              Book Mode - Complete Workflow
            </h3>
            <div className="bg-slate-800 rounded-lg p-4 space-y-4">
              <div>
                <h4 className="font-semibold text-white mb-2">Step 1: Set Your Book Title</h4>
                <p className="text-slate-300 text-sm mb-2">
                  In the "Book Title" field (visible right after the theme input), enter your desired book title. You can also:
                </p>
                <ul className="list-disc list-inside text-slate-300 text-sm space-y-1 ml-4">
                  <li>Type a custom title directly</li>
                  <li>Generate titles using the KDP Marketing Tools (see below) and click the copy button to automatically set it as your book title</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold text-white mb-2">Step 2: Enter Theme and Generate Structure</h4>
                <p className="text-slate-300 text-sm mb-2">
                  In the "Main Theme" field, enter a broad topic (e.g., "Winter", "Gardening", "Animals"). Then:
                </p>
                <ol className="list-decimal list-inside text-slate-300 text-sm space-y-1 ml-4">
                  <li>Click the search icon button next to the theme input</li>
                  <li>The AI will generate sub-themes (chapters) related to your main theme</li>
                  <li>You'll see a progress bar showing the generation status</li>
                  <li>Once complete, chapters will appear in the "Pages" section</li>
                </ol>
              </div>

              <div>
                <h4 className="font-semibold text-white mb-2">Step 3: Configure Settings</h4>
                <p className="text-slate-300 text-sm mb-2">
                  Before generating, configure these settings:
                </p>
                <ul className="list-disc list-inside text-slate-300 text-sm space-y-1 ml-4">
                  <li><strong className="text-white">Number of Chapters</strong> - How many sub-themes to generate (default: 2)</li>
                  <li><strong className="text-white">Words Per Puzzle</strong> - How many words each puzzle should contain (default: 15)</li>
                  <li><strong className="text-white">Grid Size</strong> - Size of the puzzle grid (e.g., 15x15, 20x20)</li>
                  <li><strong className="text-white">Difficulty</strong> - Easy (horizontal/vertical only), Medium (adds diagonals), Hard (adds reverse directions)</li>
                  <li><strong className="text-white">Word Validation</strong> - When enabled, words are checked against a dictionary to remove spelling errors</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold text-white mb-2">Step 4: Review and Edit Chapters</h4>
                <p className="text-slate-300 text-sm mb-2">
                  In the "Pages" section, you can:
                </p>
                <ul className="list-disc list-inside text-slate-300 text-sm space-y-1 ml-4">
                  <li><strong className="text-white">Edit Chapter Titles</strong> - Click the edit icon (pencil) next to any chapter to rename it</li>
                  <li><strong className="text-white">Edit Words</strong> - Click the search icon next to a chapter to edit its words. Words are comma or newline separated</li>
                  <li><strong className="text-white">Reorder Chapters</strong> - Use the up/down arrow buttons to move chapters</li>
                  <li><strong className="text-white">Delete Chapters</strong> - Click the trash icon to remove a chapter</li>
                  <li><strong className="text-white">Add Blank Pages</strong> - Click "Add Empty Page" to insert blank pages anywhere in your book</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold text-white mb-2">Step 5: Add Blank Pages Between Chapters (Optional)</h4>
                <p className="text-slate-300 text-sm mb-2">
                  Check the "Add blank pages between chapters" checkbox before generating puzzles. This will:
                </p>
                <ul className="list-disc list-inside text-slate-300 text-sm space-y-1 ml-4">
                  <li>Automatically insert a blank page after each chapter</li>
                  <li>Show these blank pages in the "Pages" section so you can delete individual ones if needed</li>
                  <li>Useful for professional book layouts and note-taking pages</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold text-white mb-2">Step 6: Generate All Puzzles</h4>
                <p className="text-slate-300 text-sm mb-2">
                  Click the "Generate Pages" button. The application will:
                </p>
                <ol className="list-decimal list-inside text-slate-300 text-sm space-y-1 ml-4">
                  <li>Generate a puzzle for each chapter</li>
                  <li>Show a progress bar with current/total puzzles</li>
                  <li>Display each puzzle in the preview area as it's generated</li>
                  <li>Handle any errors gracefully (e.g., words that don't fit the grid)</li>
                </ol>
                <p className="text-slate-300 text-sm mt-2">
                  <strong className="text-yellow-400">Note:</strong> If some puzzles fail to generate, you'll see an alert with suggestions (increase grid size, reduce words, etc.).
                </p>
              </div>

              <div>
                <h4 className="font-semibold text-white mb-2">Step 7: Generate KDP Marketing Content (Optional)</h4>
                <p className="text-slate-300 text-sm mb-2">
                  In the "KDP Marketing Tools" section:
                </p>
                <ul className="list-disc list-inside text-slate-300 text-sm space-y-1 ml-4">
                  <li><strong className="text-white">Generate Titles</strong> - Click to get 5 catchy book title suggestions. Click the copy button on any title to copy it and automatically set it as your book title</li>
                  <li><strong className="text-white">Generate Description</strong> - Click to create a professional Amazon KDP product description (200-400 words) with keywords and marketing copy</li>
                </ul>
                <p className="text-slate-300 text-sm mt-2">
                  Both features use AI to analyze your chapter titles and create marketable content for your book listing.
                </p>
              </div>

              <div>
                <h4 className="font-semibold text-white mb-2">Step 8: Configure PDF Options</h4>
                <p className="text-slate-300 text-sm mb-2">
                  In the "PDF Options" section, you can customize:
                </p>
                <ul className="list-disc list-inside text-slate-300 text-sm space-y-1 ml-4">
                  <li><strong className="text-white">Title Page</strong> - Include a title page at the start of the PDF</li>
                  <li><strong className="text-white">"This Book Belongs To" Page</strong> - Add a personalized name page</li>
                  <li><strong className="text-white">Copyright Text</strong> - Enter copyright text that will appear on ALL pages (not just title page)</li>
                  <li><strong className="text-white">Font</strong> - Choose from various fonts (Helvetica, Roboto, Open Sans, Lora, Playfair Display, Playpen Sans, Schoolbell)</li>
                  <li><strong className="text-white">Font Size</strong> - Adjust the size of letters in the grid (4pt to 20pt, like MS Word)</li>
                  <li><strong className="text-white">Page Size</strong> - Select from standard KDP sizes (5x8, 6x9, 8.5x11, A4, etc.) or create a custom size</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold text-white mb-2">Step 9: Preview and Download PDF</h4>
                <p className="text-slate-300 text-sm mb-2">
                  Once puzzles are generated:
                </p>
                <ol className="list-decimal list-inside text-slate-300 text-sm space-y-1 ml-4">
                  <li>Click "Preview PDF" to see the complete book in a modal before downloading</li>
                  <li>Review the layout, fonts, and formatting</li>
                  <li>Click "Download PDF" to save the file to your computer</li>
                </ol>
                <p className="text-slate-300 text-sm mt-2">
                  The PDF includes: title page (if enabled), puzzle pages, solutions section (2 per page), page numbers, and copyright text on every page.
                </p>
              </div>
            </div>
          </section>

          {/* Single Puzzle Mode */}
          <section>
            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <Search className="h-5 w-5 text-blue-400" />
              Single Puzzle Mode - Complete Workflow
            </h3>
            <div className="bg-slate-800 rounded-lg p-4 space-y-4">
              <div>
                <h4 className="font-semibold text-white mb-2">Step 1: Enter Theme</h4>
                <p className="text-slate-300 text-sm">
                  Enter a theme in the "Main Theme" field (e.g., "Winter", "Animals", "Food").
                </p>
              </div>

              <div>
                <h4 className="font-semibold text-white mb-2">Step 2: Generate Words</h4>
                <p className="text-slate-300 text-sm mb-2">
                  Click the search icon button. The AI will generate words related to your theme. You'll see:
                </p>
                <ul className="list-disc list-inside text-slate-300 text-sm space-y-1 ml-4">
                  <li>A progress bar showing generation status</li>
                  <li>Generated words appearing in the "Generated Words" text area</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold text-white mb-2">Step 3: Edit Words (Optional)</h4>
                <p className="text-slate-300 text-sm">
                  In the "Generated Words" text area, you can directly edit the words. The puzzle will automatically update as you type. Words are comma or newline separated.
                </p>
              </div>

              <div>
                <h4 className="font-semibold text-white mb-2">Step 4: Add Custom Words (Optional)</h4>
                <p className="text-slate-300 text-sm">
                  In the "Custom Words" field, add additional words separated by commas or newlines. These will be combined with generated words.
                </p>
              </div>

              <div>
                <h4 className="font-semibold text-white mb-2">Step 5: Configure Settings</h4>
                <p className="text-slate-300 text-sm mb-2">
                  Adjust:
                </p>
                <ul className="list-disc list-inside text-slate-300 text-sm space-y-1 ml-4">
                  <li><strong className="text-white">Number of Words</strong> - How many words to use in the puzzle</li>
                  <li><strong className="text-white">Grid Size</strong> - Size of the puzzle grid</li>
                  <li><strong className="text-white">Difficulty</strong> - Easy, Medium, or Hard</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold text-white mb-2">Step 6: Preview Puzzle</h4>
                <p className="text-slate-300 text-sm mb-2">
                  The puzzle appears in the preview area. You can:
                </p>
                <ul className="list-disc list-inside text-slate-300 text-sm space-y-1 ml-4">
                  <li><strong className="text-white">Hover over words</strong> in the word list to highlight them in the grid</li>
                  <li><strong className="text-white">Click and drag</strong> on the grid to select words</li>
                  <li><strong className="text-white">Toggle "Show Solution"</strong> to see all placed words highlighted</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold text-white mb-2">Step 7: Download</h4>
                <p className="text-slate-300 text-sm">
                  Use the "Download PNG" button to save an image, or configure PDF options and download as PDF.
                </p>
              </div>
            </div>
          </section>

          {/* Advanced Features */}
          <section>
            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-400" />
              Advanced Features
            </h3>
            <div className="bg-slate-800 rounded-lg p-4 space-y-4">
              <div>
                <h4 className="font-semibold text-white mb-2 flex items-center gap-2">
                  <Upload className="h-4 w-4" />
                  CSV Import
                </h4>
                <p className="text-slate-300 text-sm mb-2">
                  Import words from CSV files (Book Bolt style format):
                </p>
                <ul className="list-disc list-inside text-slate-300 text-sm space-y-1 ml-4">
                  <li>Click "Bulk Import CSV" or "Import CSV Files"</li>
                  <li>Select one or multiple CSV files</li>
                  <li>Each CSV file becomes a new chapter in Book Mode</li>
                  <li>Words are automatically filtered by grid size and optionally validated</li>
                  <li>Supports simple word lists or "Word, Clue" format</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold text-white mb-2 flex items-center gap-2">
                  <Edit2 className="h-4 w-4" />
                  Word Editing
                </h4>
                <p className="text-slate-300 text-sm">
                  You can edit words at any time:
                </p>
                <ul className="list-disc list-inside text-slate-300 text-sm space-y-1 ml-4">
                  <li><strong className="text-white">Book Mode:</strong> Click the search icon next to any chapter to edit its words</li>
                  <li><strong className="text-white">Single Mode:</strong> Edit directly in the "Generated Words" text area</li>
                  <li>Words are automatically converted to uppercase</li>
                  <li>Only letters allowed (4+ characters)</li>
                  <li>Puzzle updates automatically when words change</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold text-white mb-2 flex items-center gap-2">
                  <FilePlus className="h-4 w-4" />
                  Blank Pages
                </h4>
                <p className="text-slate-300 text-sm">
                  Add blank pages for:
                </p>
                <ul className="list-disc list-inside text-slate-300 text-sm space-y-1 ml-4">
                  <li>Professional book layouts</li>
                  <li>Note-taking pages</li>
                  <li>Section dividers</li>
                  <li>Manual insertion: Click "Add Empty Page" button</li>
                  <li>Automatic insertion: Check "Add blank pages between chapters"</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold text-white mb-2 flex items-center gap-2">
                  <Type className="h-4 w-4" />
                  KDP Marketing Tools
                </h4>
                <p className="text-slate-300 text-sm mb-2">
                  Generate professional marketing content for Amazon KDP:
                </p>
                <ul className="list-disc list-inside text-slate-300 text-sm space-y-1 ml-4">
                  <li><strong className="text-white">Title Generator:</strong> Creates 5 SEO-friendly, catchy book title suggestions</li>
                  <li><strong className="text-white">Description Generator:</strong> Creates a complete Amazon product description (200-400 words) with keywords</li>
                  <li>Both use AI to analyze your chapter titles and create marketable content</li>
                  <li>Click copy buttons to copy individual items or all content</li>
                  <li>Title copy buttons also automatically set the title as your book title</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold text-white mb-2">PDF Customization</h4>
                <p className="text-slate-300 text-sm mb-2">
                  Professional PDF features:
                </p>
                <ul className="list-disc list-inside text-slate-300 text-sm space-y-1 ml-4">
                  <li><strong className="text-white">Fonts:</strong> Choose from 6+ professional fonts</li>
                  <li><strong className="text-white">Font Size:</strong> Adjust grid letter size (4pt-20pt)</li>
                  <li><strong className="text-white">Page Sizes:</strong> Standard KDP sizes or custom dimensions</li>
                  <li><strong className="text-white">Mirrored Margins:</strong> Automatic for professional printing (gutter/outside margins)</li>
                  <li><strong className="text-white">Copyright:</strong> Appears on every page (not just title page)</li>
                  <li><strong className="text-white">Solutions:</strong> 2 per page with page number references</li>
                  <li><strong className="text-white">Preview:</strong> See the complete PDF before downloading</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Tips & Best Practices */}
          <section>
            <h3 className="text-xl font-bold text-white mb-4">Tips & Best Practices</h3>
            <div className="bg-slate-800 rounded-lg p-4 space-y-3">
              <div className="bg-green-900/20 border border-green-700 rounded p-3">
                <p className="text-green-200 text-sm font-semibold mb-1">⚡ Speed Tips</p>
                <ul className="list-disc list-inside text-green-200/90 text-sm space-y-1 ml-2">
                  <li>Turn off Word Validation to speed up generation 2-3x (especially for proper nouns)</li>
                  <li>More chapters = more time (2 chapters ~30s, 10 chapters ~2-3min)</li>
                  <li>Use CSV import for bulk word addition instead of generating individually</li>
                </ul>
              </div>
              <div className="bg-blue-900/20 border border-blue-700 rounded p-3">
                <p className="text-blue-200 text-sm font-semibold mb-1">💡 Best Practices</p>
                <ul className="list-disc list-inside text-blue-200/90 text-sm space-y-1 ml-2">
                  <li>Start with a smaller number of chapters to test your workflow</li>
                  <li>Use appropriate grid sizes for your word lengths (grid size - 2 = max word length)</li>
                  <li>Preview PDF before final download to check formatting</li>
                  <li>Edit chapter titles to be descriptive and SEO-friendly</li>
                  <li>Use KDP Marketing Tools to generate professional titles and descriptions</li>
                </ul>
              </div>
              <div className="bg-yellow-900/20 border border-yellow-700 rounded p-3">
                <p className="text-yellow-200 text-sm font-semibold mb-1">⚠️ Troubleshooting</p>
                <ul className="list-disc list-inside text-yellow-200/90 text-sm space-y-1 ml-2">
                  <li>If puzzles fail to generate: Increase grid size, reduce words per puzzle, or change difficulty</li>
                  <li>If words are too long: Check grid size (words must be ≤ grid size - 2)</li>
                  <li>If validation removes too many words: Disable it for proper nouns or specialized terms</li>
                  <li>If PDF text bleeds: The system automatically wraps long titles and adjusts font sizes</li>
                </ul>
              </div>
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="border-t border-slate-700 p-4 bg-slate-800/50">
          <Button
            onClick={onClose}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
          >
            Got it! Close Help
          </Button>
        </div>
      </div>
    </div>
  );
}

