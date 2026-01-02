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

      // Inject a temporary style tag to override CSS variables with hex colors
      // This prevents html2canvas from trying to parse oklch()/lab() color functions
      const tempStyleId = 'png-export-temp-styles';
      let tempStyle = document.getElementById(tempStyleId) as HTMLStyleElement;
      
      if (!tempStyle) {
        tempStyle = document.createElement('style');
        tempStyle.id = tempStyleId;
        document.head.appendChild(tempStyle);
      }
      
      // Override all CSS variables that use color functions with hex equivalents
      tempStyle.textContent = `
        :root, .dark {
          --background: #ffffff !important;
          --foreground: #000000 !important;
          --card: #ffffff !important;
          --card-foreground: #000000 !important;
          --popover: #ffffff !important;
          --popover-foreground: #000000 !important;
          --primary: #000000 !important;
          --primary-foreground: #ffffff !important;
          --secondary: #f5f5f5 !important;
          --secondary-foreground: #000000 !important;
          --muted: #f5f5f5 !important;
          --muted-foreground: #666666 !important;
          --accent: #f5f5f5 !important;
          --accent-foreground: #000000 !important;
          --destructive: #dc2626 !important;
          --border: #e5e5e5 !important;
          --input: #e5e5e5 !important;
          --ring: #999999 !important;
        }
        #${targetId}, #${targetId} * {
          background-color: #ffffff !important;
          color: #000000 !important;
        }
        #${targetId} .bg-slate-800,
        #${targetId} .bg-slate-900,
        #${targetId} .bg-slate-700 {
          background-color: #1e293b !important;
        }
        #${targetId} .text-slate-300,
        #${targetId} .text-slate-200,
        #${targetId} .text-slate-100 {
          color: #cbd5e1 !important;
        }
        #${targetId} .bg-blue-500,
        #${targetId} .bg-green-500,
        #${targetId} .bg-yellow-500,
        #${targetId} .bg-red-500 {
          /* Preserve colored highlights for puzzle cells */
        }
      `;
      
      // Set explicit white background
      const originalBg = (element as HTMLElement).style.backgroundColor;
      (element as HTMLElement).style.backgroundColor = '#ffffff';
      (element as HTMLElement).style.overflow = 'visible';
      
      // Wait a moment for styles to apply
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Configure html2canvas for high-resolution export
      const canvas = await html2canvas(element, {
        scale: 4, // 4x scale for 300 DPI print quality
        backgroundColor: '#ffffff', // Use hex color (html2canvas doesn't support lab()/oklch() colors)
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
      });
      
      console.log(`Canvas created: ${canvas.width}x${canvas.height}px`);

      // Remove temporary style and restore original background
      if (tempStyle && tempStyle.parentNode) {
        tempStyle.parentNode.removeChild(tempStyle);
      }
      (element as HTMLElement).style.backgroundColor = originalBg || '';
      (element as HTMLElement).style.overflow = '';

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
