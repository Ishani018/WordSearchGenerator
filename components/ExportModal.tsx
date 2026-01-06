'use client';

import { useState } from 'react';
import { X, Download, Eye, Type, FileText, Copy, Check, ChevronUp, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import PDFDownloadButton, { PDFPageItem } from './PDFDownloadButton';
import PDFPreviewModal from './PDFPreviewModal';
import { AVAILABLE_FONTS } from '@/lib/fonts';

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

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'book' | 'single';
  puzzles: PDFPageItem[];
  bookTitle?: string;
  theme?: string;
  bookStructure?: {
    bookTitle: string;
    chapters: Array<{ title: string; words: string[]; isBlank?: boolean }>;
  } | null;
  kdpTitles?: string[] | null;
  kdpDescription?: string | null;
  isGeneratingKdpContent?: boolean;
  kdpContentType?: 'description' | 'titles' | null;
  onGenerateBookTitles?: () => void;
  onGenerateKdpDescription?: () => void;
  onCopyToClipboard?: (text: string, id: string) => void;
  copiedText?: string | null;
  onBookTitleChange?: (title: string) => void;
}

export default function ExportModal({
  isOpen,
  onClose,
  mode,
  puzzles,
  bookTitle,
  theme,
  bookStructure,
  kdpTitles,
  kdpDescription,
  isGeneratingKdpContent = false,
  kdpContentType = null,
  onGenerateBookTitles,
  onGenerateKdpDescription,
  onCopyToClipboard,
  copiedText = null,
  onBookTitleChange,
}: ExportModalProps) {
  // PDF Settings State
  const [selectedFont, setSelectedFont] = useState('helvetica');
  const [fontSize, setFontSize] = useState(10);
  const [headingSize, setHeadingSize] = useState(16);
  const [pageSize, setPageSize] = useState(PAGE_SIZES[6]); // Default Letter
  const [customPageSize, setCustomPageSize] = useState({ width: 8.5, height: 11 });
  const [isCustomSize, setIsCustomSize] = useState(false);
  const [includeTitlePage, setIncludeTitlePage] = useState(false);
  const [includeBelongsToPage, setIncludeBelongsToPage] = useState(false);
  const [copyrightText, setCopyrightText] = useState('');
  const [isKdpSectionOpen, setIsKdpSectionOpen] = useState(true);
  const [isSettingsSectionOpen, setIsSettingsSectionOpen] = useState(true);

  if (!isOpen) return null;

  const hasPuzzles = puzzles.length > 0;
  const displayTitle = mode === 'book' 
    ? (bookStructure?.bookTitle || bookTitle || theme || 'Word Search Puzzle Book')
    : `Word Search - ${theme || 'Puzzle'}`;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative w-[90vw] max-w-4xl max-h-[90vh] bg-slate-900 rounded-lg shadow-2xl flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-700">
          <h2 className="text-lg font-semibold text-slate-200">Export / Download</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-800 rounded-full transition-colors"
            aria-label="Close"
          >
            <X className="h-5 w-5 text-slate-400" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* Book Title and KDP Tools (Book Mode Only) */}
          {mode === 'book' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-slate-300 mb-2">Book Title</label>
                <input
                  type="text"
                  value={bookStructure?.bookTitle || ''}
                  onChange={(e) => onBookTitleChange?.(e.target.value)}
                  placeholder="Enter book title"
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-md text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* KDP Marketing Tools */}
              {bookStructure && bookStructure.chapters.length > 0 && (
                <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
                  <button
                    onClick={() => setIsKdpSectionOpen(!isKdpSectionOpen)}
                    className="w-full flex items-center justify-between mb-3"
                  >
                    <h3 className="text-sm font-semibold text-slate-300">KDP Marketing Tools</h3>
                    {isKdpSectionOpen ? (
                      <ChevronUp className="h-4 w-4 text-slate-400" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-slate-400" />
                    )}
                  </button>
                  
                  {isKdpSectionOpen && (
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-2">
                        <Button
                          onClick={onGenerateBookTitles}
                          disabled={isGeneratingKdpContent}
                          className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                          size="sm"
                        >
                          {isGeneratingKdpContent && kdpContentType === 'titles' ? (
                            'Generating...'
                          ) : (
                            <>
                              <Type className="h-3 w-3 mr-1.5" />
                              Generate Titles
                            </>
                          )}
                        </Button>
                        <Button
                          onClick={onGenerateKdpDescription}
                          disabled={isGeneratingKdpContent}
                          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white"
                          size="sm"
                        >
                          {isGeneratingKdpContent && kdpContentType === 'description' ? (
                            'Generating...'
                          ) : (
                            <>
                              <FileText className="h-3 w-3 mr-1.5" />
                              Generate Description
                            </>
                          )}
                        </Button>
                      </div>

                      {/* Generated Titles */}
                      {kdpTitles && kdpTitles.length > 0 && (
                        <div className="p-2 bg-slate-700 rounded border border-slate-600">
                          <div className="flex items-center justify-between mb-1.5">
                            <label className="text-xs font-medium text-slate-300">Titles:</label>
                            <button
                              onClick={() => {
                                const allTitles = kdpTitles.join('\n');
                                onCopyToClipboard?.(allTitles, 'titles');
                              }}
                              className="p-0.5 text-slate-400 hover:text-blue-400 transition-colors"
                              title="Copy all titles"
                            >
                              {copiedText === 'titles' ? (
                                <Check className="h-3 w-3 text-green-400" />
                              ) : (
                                <Copy className="h-3 w-3" />
                              )}
                            </button>
                          </div>
                          <div className="space-y-1 max-h-24 overflow-y-auto">
                            {kdpTitles.map((title, index) => (
                              <div key={index} className="flex items-start gap-1.5 p-1 bg-slate-600 rounded hover:bg-slate-500 transition-colors text-xs">
                                <span className="text-slate-400 mt-0.5">{index + 1}.</span>
                                <span className="flex-1 text-slate-200">{title}</span>
                                <button
                                  onClick={() => {
                                    onCopyToClipboard?.(title, `title-${index}`);
                                    if (bookStructure) {
                                      onBookTitleChange?.(title);
                                    }
                                  }}
                                  className="p-0.5 text-slate-400 hover:text-blue-400 transition-colors shrink-0"
                                  title="Copy and use as book title"
                                >
                                  {copiedText === `title-${index}` ? (
                                    <Check className="h-2.5 w-2.5 text-green-400" />
                                  ) : (
                                    <Copy className="h-2.5 w-2.5" />
                                  )}
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Generated Description */}
                      {kdpDescription && (
                        <div className="p-2 bg-slate-700 rounded border border-slate-600">
                          <div className="flex items-center justify-between mb-1.5">
                            <label className="text-xs font-medium text-slate-300">Description:</label>
                            <button
                              onClick={() => onCopyToClipboard?.(kdpDescription, 'description')}
                              className="p-0.5 text-slate-400 hover:text-blue-400 transition-colors"
                              title="Copy description"
                            >
                              {copiedText === 'description' ? (
                                <Check className="h-3 w-3 text-green-400" />
                              ) : (
                                <Copy className="h-3 w-3" />
                              )}
                            </button>
                          </div>
                          <p className="text-xs text-slate-300 whitespace-pre-wrap max-h-20 overflow-y-auto">{kdpDescription}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* PDF Settings */}
          <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
            <button
              onClick={() => setIsSettingsSectionOpen(!isSettingsSectionOpen)}
              className="w-full flex items-center justify-between mb-3"
            >
              <h3 className="text-sm font-semibold text-slate-300">PDF Settings</h3>
              {isSettingsSectionOpen ? (
                <ChevronUp className="h-4 w-4 text-slate-400" />
              ) : (
                <ChevronDown className="h-4 w-4 text-slate-400" />
              )}
            </button>

            {isSettingsSectionOpen && (
              <div className="space-y-4">
                {/* Font and Page Size */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Font</label>
                    <select
                      value={selectedFont}
                      onChange={(e) => setSelectedFont(e.target.value)}
                      className="w-full px-2 py-1.5 text-sm bg-slate-700 border border-slate-600 rounded-md text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {AVAILABLE_FONTS.map((font) => {
                        let fontFamily = 'inherit';
                        if (font.type === 'standard') {
                          fontFamily = font.id === 'helvetica' ? 'Helvetica, Arial, sans-serif' :
                                       font.id === 'times' ? 'Times, "Times New Roman", serif' :
                                       font.id === 'courier' ? 'Courier, "Courier New", monospace' : 'inherit';
                        } else if (font.type === 'google') {
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
                          <option key={font.id} value={font.id} style={{ fontFamily }}>
                            {font.name}
                          </option>
                        );
                      })}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Page Size</label>
                    <div className="flex gap-1.5">
                      <select 
                        className="flex-1 px-2 py-1.5 text-sm bg-slate-700 border border-slate-600 rounded-md text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                        <option value="custom">Custom...</option>
                      </select>
                      {isCustomSize && (
                        <div className="flex gap-1 items-center">
                          <input 
                            type="number" 
                            className="w-14 px-1 py-1 bg-slate-700 border border-slate-600 rounded text-slate-100 text-xs" 
                            placeholder="W" 
                            step="0.1"
                            value={customPageSize.width}
                            onChange={e => {
                              const w = parseFloat(e.target.value);
                              setCustomPageSize(p => ({ ...p, width: w }));
                              setPageSize({ ...pageSize, width: w });
                            }}
                          />
                          <span className="text-slate-500 text-xs">×</span>
                          <input 
                            type="number" 
                            className="w-14 px-1 py-1 bg-slate-700 border border-slate-600 rounded text-slate-100 text-xs" 
                            placeholder="H" 
                            step="0.1"
                            value={customPageSize.height}
                            onChange={e => {
                              const h = parseFloat(e.target.value);
                              setCustomPageSize(p => ({ ...p, height: h }));
                              setPageSize({ ...pageSize, height: h });
                            }}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Font Sizes */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Grid Size ({fontSize}pt)</label>
                    <input
                      type="range"
                      min="4"
                      max="20"
                      step="1"
                      value={fontSize}
                      onChange={(e) => setFontSize(parseInt(e.target.value))}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-slate-500 mt-0.5">
                      <span>4</span>
                      <span>12</span>
                      <span>20</span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Title Size ({headingSize}pt)</label>
                    <input
                      type="range"
                      min="10"
                      max="24"
                      step="1"
                      value={headingSize}
                      onChange={(e) => setHeadingSize(parseInt(e.target.value))}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-slate-500 mt-0.5">
                      <span>10</span>
                      <span>16</span>
                      <span>24</span>
                    </div>
                  </div>
                </div>

                {/* Book Mode Options */}
                {mode === 'book' && (
                  <div className="space-y-2">
                    <div className="grid grid-cols-2 gap-3">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={includeTitlePage}
                          onChange={(e) => setIncludeTitlePage(e.target.checked)}
                          className="w-4 h-4 text-blue-600 bg-slate-700 border-slate-600 rounded focus:ring-blue-500"
                        />
                        <span className="text-xs text-slate-300">Title Page</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={includeBelongsToPage}
                          onChange={(e) => setIncludeBelongsToPage(e.target.checked)}
                          className="w-4 h-4 text-blue-600 bg-slate-700 border-slate-600 rounded focus:ring-blue-500"
                        />
                        <span className="text-xs text-slate-300">Belongs To Page</span>
                      </label>
                    </div>
                    {includeTitlePage && (
                      <div>
                        <label className="block text-xs text-slate-400 mb-1">Copyright</label>
                        <input
                          type="text"
                          value={copyrightText}
                          onChange={(e) => setCopyrightText(e.target.value)}
                          placeholder="Your Name or Company"
                          className="w-1/2 px-2 py-1.5 text-sm bg-slate-700 border border-slate-600 rounded-md text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Download Buttons */}
          {hasPuzzles && (
            <div className="grid grid-cols-2 gap-3">
              <PDFPreviewModal
                puzzles={puzzles}
                title={displayTitle}
                includeTitlePage={includeTitlePage}
                includeBelongsToPage={includeBelongsToPage}
                copyrightText={copyrightText}
                fontId={selectedFont}
                fontSize={fontSize}
                headingSize={headingSize}
                pageFormat={pageSize}
              />
              <PDFDownloadButton
                puzzles={puzzles}
                title={displayTitle}
                includeTitlePage={includeTitlePage}
                includeBelongsToPage={includeBelongsToPage}
                copyrightText={copyrightText}
                fontId={selectedFont}
                fontSize={fontSize}
                headingSize={headingSize}
                pageFormat={pageSize}
              />
            </div>
          )}

          {!hasPuzzles && (
            <div className="text-center py-8 text-slate-400">
              <p>Generate puzzles first to export</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

