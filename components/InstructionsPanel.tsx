'use client';

import { Grid3x3 } from 'lucide-react';

interface InstructionsPanelProps {
  mode: 'book' | 'single';
}

export default function InstructionsPanel({ mode }: InstructionsPanelProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-4">
      <Grid3x3 className="h-16 w-16 text-foreground" />
      <p className="text-lg font-medium text-foreground text-center">
        {mode === 'book' 
          ? 'Enter a theme and generate book structure to get started'
          : 'Enter a theme and generate words to get started'
        }
      </p>
    </div>
  );
}
