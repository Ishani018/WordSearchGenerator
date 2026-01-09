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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-card rounded-2xl shadow-2xl border border-border w-full max-w-4xl max-h-[85vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border bg-secondary/30">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-primary/10 rounded-xl ring-1 ring-primary/20">
              <BookOpen className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-foreground tracking-tight">User Guide</h2>
              <p className="text-sm text-muted-foreground">Complete documentation for the generator</p>
            </div>
          </div>
          <Button
            onClick={onClose}
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-foreground hover:bg-secondary rounded-full h-8 w-8 p-0"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8 scroll-smooth">
          {/* Overview */}
          <section>
            <h3 className="text-lg font-bold text-foreground mb-3 flex items-center gap-2">
              <Grid3x3 className="h-5 w-5 text-primary" />
              Overview
            </h3>
            <div className="bg-secondary/50 rounded-xl p-5 border border-border/50 text-sm text-muted-foreground leading-relaxed space-y-3">
              <p>
                This application generates professional word search puzzle books optimized for printing and Amazon KDP.
              </p>
              <p>
                <strong className="text-foreground">Two Modes:</strong> Use <span className="text-foreground font-medium">Book Mode</span> for creating full books with chapters, or <span className="text-foreground font-medium">Single Puzzle Mode</span> for quick individual downloads.
              </p>
            </div>
          </section>

          {/* Quick Start Steps */}
          <section>
            <h3 className="text-lg font-bold text-foreground mb-4">Quick Start Guide</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-card border border-border rounded-xl p-4 shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold">1</span>
                  <h4 className="font-semibold text-foreground text-sm">Choose Mode</h4>
                </div>
                <p className="text-xs text-muted-foreground pl-8">Select "Book Mode" for multiple chapters or "Single Puzzle" for one-off creations.</p>
              </div>
              
              <div className="bg-card border border-border rounded-xl p-4 shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold">2</span>
                  <h4 className="font-semibold text-foreground text-sm">Enter Theme</h4>
                </div>
                <p className="text-xs text-muted-foreground pl-8">Type a topic (e.g., "Summer") and click the Search icon to auto-generate content.</p>
              </div>

              <div className="bg-card border border-border rounded-xl p-4 shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold">3</span>
                  <h4 className="font-semibold text-foreground text-sm">Generate</h4>
                </div>
                <p className="text-xs text-muted-foreground pl-8">Click "Generate Pages" to build the puzzles. Use the preview to check your work.</p>
              </div>

              <div className="bg-card border border-border rounded-xl p-4 shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold">4</span>
                  <h4 className="font-semibold text-foreground text-sm">Export</h4>
                </div>
                <p className="text-xs text-muted-foreground pl-8">Click "Export" to download a print-ready PDF with solutions included.</p>
              </div>
            </div>
          </section>

          {/* Detailed Features */}
          <section>
            <h3 className="text-lg font-bold text-foreground mb-3 flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Key Features
            </h3>
            <div className="space-y-3">
               <div className="flex gap-4 p-4 bg-secondary/30 rounded-xl border border-border/50">
                  <div className="shrink-0 p-2 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-lg h-fit">
                    <Upload className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-foreground">CSV Import</h4>
                    <p className="text-xs text-muted-foreground mt-1">
                      Bulk import words using CSV files. Supports standard word lists or "Word, Clue" format.
                      Ideal for bringing in external data efficiently.
                    </p>
                  </div>
               </div>

               <div className="flex gap-4 p-4 bg-secondary/30 rounded-xl border border-border/50">
                  <div className="shrink-0 p-2 bg-purple-500/10 text-purple-600 dark:text-purple-400 rounded-lg h-fit">
                    <Type className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-foreground">KDP Marketing Tools</h4>
                    <p className="text-xs text-muted-foreground mt-1">
                      Auto-generate SEO-friendly book titles and descriptions for your Amazon listing based on your puzzle content.
                    </p>
                  </div>
               </div>

               <div className="flex gap-4 p-4 bg-secondary/30 rounded-xl border border-border/50">
                  <div className="shrink-0 p-2 bg-green-500/10 text-green-600 dark:text-green-400 rounded-lg h-fit">
                    <FilePlus className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-foreground">Layout Control</h4>
                    <p className="text-xs text-muted-foreground mt-1">
                      Add blank pages, customize margins, choose fonts, and toggle "Belongs To" pages for a complete book feel.
                    </p>
                  </div>
               </div>
            </div>
          </section>

          {/* Tips */}
          <section>
            <h3 className="text-lg font-bold text-foreground mb-3">Pro Tips</h3>
            <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 rounded-xl p-4">
              <ul className="space-y-2 text-sm text-amber-900 dark:text-amber-200/80 list-disc list-inside">
                <li><strong>Validation:</strong> Turn off "Word Validation" if you are using specialized terms or names to speed up generation.</li>
                <li><strong>Grid Size:</strong> Ensure <code className="text-xs bg-amber-100 dark:bg-amber-900/50 px-1 py-0.5 rounded">Grid Size - 2</code> is larger than your longest word.</li>
                <li><strong>Preview:</strong> Always preview the PDF before downloading to ensure fonts and margins look correct.</li>
              </ul>
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="border-t border-border p-4 bg-secondary/50 flex justify-end">
          <Button
            onClick={onClose}
            className="bg-primary text-primary-foreground hover:opacity-90 px-8"
          >
            Close Guide
          </Button>
        </div>
      </div>
    </div>
  );
}
