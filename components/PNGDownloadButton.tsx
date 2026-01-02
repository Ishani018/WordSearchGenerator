'use client';

import html2canvas from 'html2canvas';
import { Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PNGDownloadButtonProps {
  targetId: string;
  filename: string;
  label?: string;
}

export default function PNGDownloadButton({
  targetId,
  filename,
  label = 'Download PNG'
}: PNGDownloadButtonProps) {
  const handleDownload = async () => {
    const element = document.getElementById(targetId);
    if (!element) {
      alert('Element not found for PNG export');
      return;
    }

    try {
      // Temporarily remove background for transparent export
      const originalBg = (element as HTMLElement).style.backgroundColor;
      (element as HTMLElement).style.backgroundColor = 'transparent';
      
      // Configure html2canvas for high-resolution, transparent background
      const canvas = await html2canvas(element, {
        scale: 4, // 4x scale for 300 DPI print quality (4x = 300 DPI at 72 DPI base)
        backgroundColor: null, // Transparent background for design tools
        useCORS: true,
        logging: false,
        width: element.scrollWidth,
        height: element.scrollHeight,
        windowWidth: element.scrollWidth,
        windowHeight: element.scrollHeight,
      });

      // Restore original background
      (element as HTMLElement).style.backgroundColor = originalBg;

      // Convert canvas to blob and download
      canvas.toBlob((blob) => {
        if (!blob) {
          alert('Failed to generate PNG');
          return;
        }

        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${filename.replace(/\s+/g, '_')}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }, 'image/png');
    } catch (error) {
      console.error('Error generating PNG:', error);
      alert('Failed to generate PNG. Please try again.');
    }
  };

  return (
    <Button
      onClick={handleDownload}
      className="w-full bg-purple-600 hover:bg-purple-700 text-white"
      size="lg"
    >
      <ImageIcon className="mr-2 h-4 w-4" />
      {label}
    </Button>
  );
}

