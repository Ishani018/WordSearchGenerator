'use client';

import { Grid3x3, Edit2 } from 'lucide-react';

interface InstructionsPanelProps {
  mode: 'book' | 'single';
}

export default function InstructionsPanel({ mode }: InstructionsPanelProps) {
  const bookModeInstructions = (
    <div className="space-y-3 text-base text-slate-300">
      <div>
        <ol className="list-decimal list-inside space-y-1.5 text-slate-400">
          <li>Enter a theme and click "Generate Book Structure" to create chapters</li>
          <li>Review/edit chapters, then click "Generate All Puzzles"</li>
          <li>Download PDF with preview option</li>
        </ol>
      </div>
      <div className="bg-green-900/20 border border-green-700 rounded p-2.5">
        <p className="text-sm text-green-200/90">
          <strong>⚡ Speed Tip:</strong> Turn off Word Validation to speed up 2-3x.<br />
          More chapters = more time (2 chapters ~30s, 10 chapters ~2-3min).
        </p>
      </div>
      <div className="text-sm text-slate-400 space-y-1">
        <p><strong>Features:</strong> Edit words (click <Edit2 className="h-3 w-3 inline" />), CSV import, blank pages, reorder chapters, customize fonts & PDF options</p>
      </div>
    </div>
  );

  const singleModeInstructions = (
    <div className="space-y-3 text-base text-slate-300">
      <div>
        <ol className="list-decimal list-inside space-y-1.5 text-slate-400">
          <li>Enter a theme and click "Generate Words"</li>
          <li>Edit words in the text area if needed (puzzle auto-updates)</li>
          <li>Customize grid size & difficulty, then download PNG or PDF</li>
        </ol>
      </div>
      <div className="bg-green-900/20 border border-green-700 rounded p-2.5">
        <p className="text-sm text-green-200/90">
          <strong>⚡ Speed Tip:</strong> Turn off Word Validation to speed up 2-3x.
        </p>
      </div>
      <div className="text-sm text-slate-400 space-y-1">
        <p><strong>Features:</strong> Hover words to highlight, click/drag to select, toggle solution view, customize fonts & PDF options</p>
      </div>
    </div>
  );

  return (
    <div className="text-center">
      <div className="flex items-center justify-center mb-6">
        <Grid3x3 className="h-16 w-16 text-slate-600" />
      </div>
      <div>
        {mode === 'book' ? bookModeInstructions : singleModeInstructions}
      </div>
    </div>
  );
}

