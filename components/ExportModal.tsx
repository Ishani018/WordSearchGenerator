'use client';

import { useState, useEffect } from 'react';
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
  margins?: { left: number; right: number; top: number; bottom: number };
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
  margins = { left: 0.5, right: 0.5, top: 0.5, bottom: 0.5 },
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
  const [localMargins, setLocalMargins] = useState(margins);

  // Sync margins when modal opens or prop changes
  useEffect(() => {
    if (isOpen) {
      setLocalMargins(margins);
    }
  }, [margins, isOpen]);

  if (!isOpen) return null;

  const hasPuzzles = puzzles.length > 0;
  const displayTitle = mode === 'book' 
    ? (bookStructure?.bookTitle || bookTitle || theme || 'Word Search Puzzle Book')
    : `Word Search - ${theme || 'Puzzle'}`;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md animate-in fade-in duration-300"
      onClick={onClose}
    >
      <div
        className="relative w-[90vw] max-w-4xl max-h-[90vh] bg-slate-900/95 backdrop-blur-xl rounded-2xl shadow-2xl flex flex-col border border-slate-700/50 animate-in zoom-in-95 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-700/50 bg-gradient-to-r from-slate-900/50 to-slate-800/50">
          <h2 className="text-xl font-extrabold bg-gradient-to-r from-slate-100 to-slate-300 bg-clip-text text-transparent tracking-tight">
            Export / Download
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-800/80 rounded-xl transition-all duration-200 hover:scale-110 active:scale-95"
            aria-label="Close"
          >
            <X className="h-5 w-5 text-slate-400 hover:text-slate-200 transition-colors" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* Book Title and KDP Tools (Book Mode Only) */}
          {mode === 'book' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-200 mb-2">Book Title</label>
                <input
                  type="text"
                  value={bookStructure?.bookTitle || ''}
                  onChange={(e) => onBookTitleChange?.(e.target.value)}
                  placeholder="Enter book title"
                  className="w-full px-4 py-2.5 bg-slate-800/80 border border-slate-700/50 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 focus:bg-slate-800 transition-all duration-200 shadow-sm"
                />
              </div>

              {/* KDP Marketing Tools */}
              {bookStructure && bookStructure.chapters.length > 0 && (
                <div className="bg-slate-800/80 backdrop-blur-sm rounded-xl p-5 border border-slate-700/50 shadow-lg overflow-hidden">
                  <button
                    onClick={() => setIsKdpSectionOpen(!isKdpSectionOpen)}
                    className="w-full flex items-center justify-between mb-3 group"
                  >
                    <h3 className="text-sm font-bold text-slate-200 group-hover:text-white transition-colors">KDP Marketing Tools</h3>
                    <ChevronUp className={`h-4 w-4 text-slate-400 transition-transform duration-300 ${isKdpSectionOpen ? 'rotate-0' : 'rotate-180'}`} />
                  </button>
                  
                  {isKdpSectionOpen && (
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <Button
                          onClick={onGenerateBookTitles}
                          disabled={isGeneratingKdpContent}
                          className="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white shadow-lg shadow-purple-500/30 hover:scale-105 active:scale-95 transition-all duration-200 font-semibold"
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
                          className="w-full bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white shadow-lg shadow-indigo-500/30 hover:scale-105 active:scale-95 transition-all duration-200 font-semibold"
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
                        <div className="p-3 bg-slate-700/80 backdrop-blur-sm rounded-lg border border-slate-600/50 shadow-lg">
                          <div className="flex items-center justify-between mb-2">
                            <label className="text-xs font-bold text-slate-200">Titles:</label>
                            <button
                              onClick={() => {
                                const allTitles = kdpTitles.join('\n');
                                onCopyToClipboard?.(allTitles, 'titles');
                              }}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-blue-400 hover:bg-blue-500/10 transition-all duration-200 hover:scale-110"
                              title="Copy all titles"
                            >
                              {copiedText === 'titles' ? (
                                <Check className="h-3.5 w-3.5 text-green-400" />
                              ) : (
                                <Copy className="h-3.5 w-3.5" />
                              )}
                            </button>
                          </div>
                          <div className="space-y-1.5 max-h-24 overflow-y-auto">
                            {kdpTitles.map((title, index) => (
                              <div key={index} className="flex items-start gap-2 p-2 bg-slate-600/80 rounded-lg hover:bg-slate-500/80 transition-all duration-200 text-xs border border-slate-500/30">
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
                        <div className="p-3 bg-slate-700/80 backdrop-blur-sm rounded-lg border border-slate-600/50 shadow-lg">
                          <div className="flex items-center justify-between mb-2">
                            <label className="text-xs font-bold text-slate-200">Description:</label>
                            <button
                              onClick={() => onCopyToClipboard?.(kdpDescription, 'description')}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-blue-400 hover:bg-blue-500/10 transition-all duration-200 hover:scale-110"
                              title="Copy description"
                            >
                              {copiedText === 'description' ? (
                                <Check className="h-3.5 w-3.5 text-green-400" />
                              ) : (
                                <Copy className="h-3.5 w-3.5" />
                              )}
                            </button>
                          </div>
                          <p className="text-xs text-slate-300 whitespace-pre-wrap max-h-20 overflow-y-auto leading-relaxed">{kdpDescription}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* PDF Settings */}
          <div className="bg-slate-800/80 backdrop-blur-sm rounded-xl p-5 border border-slate-700/50 shadow-lg overflow-hidden">
            <button
              onClick={() => setIsSettingsSectionOpen(!isSettingsSectionOpen)}
              className="w-full flex items-center justify-between mb-3 group"
            >
              <h3 className="text-sm font-bold text-slate-200 group-hover:text-white transition-colors">PDF Settings</h3>
              <ChevronUp className={`h-4 w-4 text-slate-400 transition-transform duration-300 ${isSettingsSectionOpen ? 'rotate-0' : 'rotate-180'}`} />
            </button>

            {isSettingsSectionOpen && (
              <div className="space-y-5 border-t border-slate-700/50 pt-5">
                {/* Font and Page Size */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Font</label>
                    <select
                      value={selectedFont}
                      onChange={(e) => setSelectedFont(e.target.value)}
                      className="w-full px-4 py-2.5 text-sm bg-slate-700/80 border border-slate-600/50 rounded-lg text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-200 shadow-sm"
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
                        className="flex-1 px-4 py-2.5 text-sm bg-slate-700/80 border border-slate-600/50 rounded-lg text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-200 shadow-sm"
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
                            className="w-16 px-2 py-1.5 bg-slate-700/80 border border-slate-600/50 rounded-lg text-slate-100 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-200 shadow-sm" 
                            placeholder="W" 
                            step="0.1"
                            value={customPageSize.width}
                            onChange={e => {
                              const w = parseFloat(e.target.value);
                              setCustomPageSize(p => ({ ...p, width: w }));
                              setPageSize({ ...pageSize, width: w });
                            }}
                          />
                          <span className="text-slate-500 text-xs font-bold">×</span>
                          <input 
                            type="number" 
                            className="w-16 px-2 py-1.5 bg-slate-700/80 border border-slate-600/50 rounded-lg text-slate-100 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-200 shadow-sm" 
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
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-3">
                      Grid Size: <span className="text-blue-400 font-bold">{fontSize}pt</span>
                    </label>
                    <input
                      type="range"
                      min="4"
                      max="20"
                      step="1"
                      value={fontSize}
                      onChange={(e) => setFontSize(parseInt(e.target.value))}
                      className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-600"
                    />
                    <div className="flex justify-between text-xs text-slate-500 mt-2">
                      <span>4</span>
                      <span>12</span>
                      <span>20</span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-3">
                      Title Size: <span className="text-blue-400 font-bold">{headingSize}pt</span>
                    </label>
                    <input
                      type="range"
                      min="10"
                      max="24"
                      step="1"
                      value={headingSize}
                      onChange={(e) => setHeadingSize(parseInt(e.target.value))}
                      className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-600"
                    />
                    <div className="flex justify-between text-xs text-slate-500 mt-2">
                      <span>10</span>
                      <span>16</span>
                      <span>24</span>
                    </div>
                  </div>
                </div>

                {/* Book Mode Options */}
                {mode === 'book' && (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <label className="flex items-center gap-2 cursor-pointer group">
                        <input
                          type="checkbox"
                          checked={includeTitlePage}
                          onChange={(e) => setIncludeTitlePage(e.target.checked)}
                          className="w-4 h-4 text-blue-600 bg-slate-700/80 border-slate-600/50 rounded focus:ring-2 focus:ring-blue-500 transition-all"
                        />
                        <span className="text-xs text-slate-300 group-hover:text-slate-200 transition-colors font-medium">Title Page</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer group">
                        <input
                          type="checkbox"
                          checked={includeBelongsToPage}
                          onChange={(e) => setIncludeBelongsToPage(e.target.checked)}
                          className="w-4 h-4 text-blue-600 bg-slate-700/80 border-slate-600/50 rounded focus:ring-2 focus:ring-blue-500 transition-all"
                        />
                        <span className="text-xs text-slate-300 group-hover:text-slate-200 transition-colors font-medium">Belongs To Page</span>
                      </label>
                    </div>
                    {includeTitlePage && (
                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-2">Copyright</label>
                        <input
                          type="text"
                          value={copyrightText}
                          onChange={(e) => setCopyrightText(e.target.value)}
                          placeholder="Your Name or Company"
                          className="w-1/2 px-4 py-2.5 text-sm bg-slate-700/80 border border-slate-600/50 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 focus:bg-slate-700 transition-all duration-200 shadow-sm"
                        />
                      </div>
                    )}
                  </div>
                )}

                {/* Page Margins */}
                <div className="space-y-3 pt-2 border-t border-slate-700">
                  <label className="block text-xs font-medium text-slate-400 mb-2">
                    Page Margins (inches)
                  </label>
                  
                  <div className="grid grid-cols-2 gap-3">
                    {/* Inside Margin (Left) */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-2">
                        Inside Margin (Left)
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="4"
                        step="0.1"
                        value={localMargins.left}
                        onChange={(e) => {
                          const val = Math.max(0, Math.min(4, parseFloat(e.target.value) || 0));
                          setLocalMargins({ ...localMargins, left: val });
                        }}
                        className="w-full px-4 py-2.5 text-sm bg-slate-700/80 border border-slate-600/50 rounded-lg text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 focus:bg-slate-700 transition-all duration-200 shadow-sm"
                      />
                      <p className="text-xs text-slate-500 mt-1.5">Min: 0" | Max: 4"</p>
                    </div>

                    {/* Outside Margin (Right) */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-2">
                        Outside Margin (Right)
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="4"
                        step="0.1"
                        value={localMargins.right}
                        onChange={(e) => {
                          const val = Math.max(0, Math.min(4, parseFloat(e.target.value) || 0));
                          setLocalMargins({ ...localMargins, right: val });
                        }}
                        className="w-full px-4 py-2.5 text-sm bg-slate-700/80 border border-slate-600/50 rounded-lg text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 focus:bg-slate-700 transition-all duration-200 shadow-sm"
                      />
                      <p className="text-xs text-slate-500 mt-1.5">Min: 0" | Max: 4"</p>
                    </div>
                  </div>
                </div>
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
                margins={localMargins}
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
                margins={localMargins}
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

