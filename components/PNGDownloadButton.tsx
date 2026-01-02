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
      alert(`Element with ID "${targetId}" not found for PNG export`);
      return;
    }

    const button = document.activeElement as HTMLElement;
    const originalText = button?.textContent;
    
    try {
      // Show loading state
      if (button) {
        button.textContent = 'Generating...';
        button.setAttribute('disabled', 'true');
      }

      // Wait a bit for any animations to settle
      await new Promise(resolve => setTimeout(resolve, 200));

      // Scroll element into view to ensure it's rendered
      element.scrollIntoView({ behavior: 'instant', block: 'center' });
      await new Promise(resolve => setTimeout(resolve, 100));

      // Get element dimensions - use getBoundingClientRect for accurate size
      const rect = element.getBoundingClientRect();
      const width = Math.max(rect.width, element.scrollWidth || 800);
      const height = Math.max(rect.height, element.scrollHeight || 600);
      
      console.log(`Capturing element: ${width}x${height}px (rect: ${rect.width}x${rect.height})`);

      // Temporarily ensure element is visible and has proper dimensions
      const originalOverflow = (element as HTMLElement).style.overflow;
      const originalBg = (element as HTMLElement).style.backgroundColor;
      (element as HTMLElement).style.overflow = 'visible';
      (element as HTMLElement).style.backgroundColor = '#ffffff'; // Use hex color instead of CSS functions
      
      // Configure html2canvas for high-resolution export
      // Use white background to avoid color parsing issues, then make transparent in post-processing
      const canvas = await html2canvas(element, {
        scale: 4, // 4x scale for 300 DPI print quality
        backgroundColor: '#ffffff', // Use hex color (html2canvas doesn't support lab() colors)
        useCORS: true,
        logging: false,
        allowTaint: false,
        removeContainer: false,
        imageTimeout: 15000,
        width: width,
        height: height,
        x: 0,
        y: 0,
        scrollX: 0,
        scrollY: 0,
        ignoreElements: (el) => {
          // Ignore elements that might cause color parsing issues
          return false;
        },
      });
      
      // If we want transparent background, we need to process the canvas
      // For now, we'll use white background which works better with html2canvas
      
      console.log(`Canvas created: ${canvas.width}x${canvas.height}px`);

      // Restore original styles
      (element as HTMLElement).style.overflow = originalOverflow;
      (element as HTMLElement).style.backgroundColor = originalBg;

      // Convert canvas to blob and download
      canvas.toBlob((blob) => {
        // Restore button state
        if (button) {
          button.textContent = originalText || label;
          button.removeAttribute('disabled');
        }

        if (!blob) {
          alert('Failed to generate PNG blob from canvas. The canvas might be empty.');
          return;
        }

        try {
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `${filename.replace(/\s+/g, '_')}.png`;
          link.style.display = 'none';
          document.body.appendChild(link);
          link.click();
          
          // Clean up after a delay
          setTimeout(() => {
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
          }, 100);
        } catch (downloadError) {
          console.error('Error downloading PNG:', downloadError);
          alert(`Failed to download PNG: ${downloadError instanceof Error ? downloadError.message : 'Unknown error'}`);
        }
      }, 'image/png', 1.0); // Highest quality
    } catch (error) {
      console.error('Error generating PNG:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      alert(`Failed to generate PNG: ${errorMessage}\n\nCheck browser console (F12) for details.`);
      
      // Restore button state on error
      if (button) {
        button.textContent = originalText || label;
        button.removeAttribute('disabled');
      }
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
