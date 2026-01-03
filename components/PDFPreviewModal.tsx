'use client';

import { useState } from 'react';
import { Eye, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { generatePDFDoc, type PDFDownloadButtonProps } from './PDFDownloadButton';

export default function PDFPreviewModal(props: PDFDownloadButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const handlePreview = async () => {
    setIsGenerating(true);
    setIsOpen(true);
    
    try {
      // Pass all props including the new pageFormat
      const doc = await generatePDFDoc(props);
      const blob = doc.output('blob');
      const url = URL.createObjectURL(blob);
      setPdfUrl(url);
    } catch (error) {
      console.error('Error generating PDF preview:', error);
      alert('Failed to generate PDF preview');
      setIsOpen(false);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    if (pdfUrl) {
      URL.revokeObjectURL(pdfUrl);
      setPdfUrl(null);
    }
  };

  return (
    <>
      <Button
        onClick={handlePreview}
        className="w-full bg-purple-600 hover:bg-purple-700 text-white"
        size="lg"
        disabled={isGenerating}
      >
        <Eye className="mr-2 h-4 w-4" />
        {isGenerating ? 'Generating Preview...' : 'Preview PDF'}
      </Button>

      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
          onClick={handleClose}
        >
          <div
            className="relative w-[90vw] h-[90vh] bg-white rounded-lg shadow-2xl flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b bg-slate-50">
              <h2 className="text-lg font-semibold text-slate-900">PDF Preview - {props.pageFormat.width}" x {props.pageFormat.height}"</h2>
              <button
                onClick={handleClose}
                className="p-2 hover:bg-slate-200 rounded-full transition-colors"
                aria-label="Close"
              >
                <X className="h-5 w-5 text-slate-600" />
              </button>
            </div>
            <div className="flex-1 overflow-hidden bg-slate-100 p-4 flex items-center justify-center">
              {isGenerating ? (
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
                  <p className="text-slate-600">Generating PDF preview...</p>
                </div>
              ) : pdfUrl ? (
                <iframe
                  src={pdfUrl}
                  className="w-full h-full border-0 shadow-lg"
                  title="PDF Preview"
                />
              ) : null}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
