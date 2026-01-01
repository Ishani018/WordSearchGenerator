# Word Search Generator

A modern, browser-based word search puzzle generator built with Next.js 14+, TypeScript, and Tailwind CSS.

## Features

- 🤖 **AI-Powered Word Generation**: Uses Groq API for fast, intelligent word generation from themes
- 🎯 **Client-Side Puzzle Generation**: All puzzle grid generation happens in the browser - no server needed
- 🎨 **Modern UI**: Beautiful dark-mode dashboard with interactive controls
- 📱 **Responsive Design**: Works perfectly on all screen sizes
- 📄 **PDF Export**: Generate high-quality PDFs instantly in the browser
- ✨ **Interactive Preview**: Hover over words to see them highlighted in the grid
- 🎲 **Smart Algorithm**: Improved word placement with aggressive retry logic

## Tech Stack

- **Next.js 14+** (App Router)
- **TypeScript**
- **Tailwind CSS**
- **Groq API** - Fast AI word generation
- **shadcn/ui** - UI components
- **Framer Motion** - Animations
- **jsPDF** - PDF generation
- **Lucide React** - Icons

## Getting Started

1. Install dependencies:
```bash
npm install
```

2. Set up your Groq API key:
   - Get your API key from [Groq Console](https://console.groq.com/)
   - Create a `.env.local` file in the root directory
   - Add your API key:
   ```env
   GROQ_API_KEY=your_groq_api_key_here
   GROQ_MODEL=llama-3.3-70b-versatile
   ```

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

## Project Structure

```
word-search-generator/
├── app/              # Next.js app directory
├── components/       # React components
│   ├── PuzzlePreview.tsx
│   ├── PDFDownloadButton.tsx
│   └── ui/          # shadcn/ui components
├── lib/             # Utility functions
│   └── puzzle-generator.ts
└── public/          # Static assets
```

## Usage

1. Enter a theme (e.g., "Winter", "Animals")
2. Select grid size using the interactive grid selector
3. Configure difficulty and other settings
4. Preview the puzzle in real-time
5. Download as PDF when ready

## License

MIT
