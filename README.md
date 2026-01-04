# Word Search Puzzle Book Generator

A professional, full-featured word search puzzle generator built with Next.js 14+ (App Router), TypeScript, and Tailwind CSS. This application generates printable puzzle books optimized for KDP (Kindle Direct Publishing) with AI-powered word generation, client-side puzzle creation, and high-quality PDF export.

## 🎯 Overview

This application allows users to generate complete word search puzzle books from themes. It features two modes:
- **Book Mode**: Generate multi-chapter puzzle books with topic expansion
- **Single Puzzle Mode**: Generate individual puzzles for quick use

All puzzle generation happens client-side in the browser, ensuring privacy and fast performance. The application includes authentication, custom alert systems, progress tracking, and professional PDF generation with customizable fonts and layouts.

## ✨ Features

### Core Functionality
- 🤖 **AI-Powered Word Generation**: Uses Groq API for fast, intelligent word generation from themes
- 📚 **Topic Expansion**: Automatically generates sub-themes and chapters for comprehensive puzzle books
- 🎯 **Client-Side Puzzle Generation**: All grid generation happens in the browser using TypeScript algorithms
- 📄 **High-Quality PDF Export**: Professional PDF generation with customizable fonts, page sizes, and layouts
- 🖼️ **PNG Export**: Export puzzles as high-resolution images for digital use
- 🔐 **Authentication System**: Password-protected access with environment-based credentials

### User Experience
- 🎨 **Modern Dark-Mode UI**: Beautiful dashboard with Tailwind CSS styling
- 📱 **Fully Responsive**: Works perfectly on all screen sizes
- ✨ **Interactive Preview**: Hover over words to see them highlighted in the grid
- 📊 **Progress Tracking**: Real-time progress bars for word generation and puzzle creation
- 🎯 **Smart Instructions**: Context-aware instructions that appear when needed
- 🔔 **Custom Alerts**: Beautiful theme-matching alert dialogs and toast notifications

### Advanced Features
- 📝 **Word Editing**: Edit words before generating puzzles
- 📥 **CSV Import**: Bulk import words from CSV files (supports multiple formats)
- ✅ **Word Validation**: Optional dictionary validation to filter invalid words
- 🎲 **Smart Algorithm**: Improved word placement with intersection prioritization and anti-clustering
- 📏 **Difficulty Levels**: Easy (horizontal/vertical), Medium (+ diagonals), Hard (+ reverse)
- 🎨 **Font Customization**: Support for Google Fonts and standard fonts in PDFs
- 📐 **KDP Page Sizes**: Support for standard KDP page sizes with mirrored margins
- 📑 **Book Features**: Title pages, "This Book Belongs To" pages, blank pages, chapter reordering

## 🛠️ Tech Stack

### Frontend
- **Next.js 16.1.1** (App Router) - React framework with server-side rendering
- **React 19.2.3** - UI library
- **TypeScript 5** - Type-safe development
- **Tailwind CSS 4** - Utility-first CSS framework
- **shadcn/ui** - High-quality React components
- **Framer Motion 12.23.26** - Animation library
- **Lucide React 0.562.0** - Icon library

### PDF & Image Generation
- **jsPDF 3.0.4** - Client-side PDF generation
- **html2canvas 1.4.1** - Canvas-based image export

### AI & APIs
- **Groq SDK 0.37.0** - Fast AI inference for word generation
- **Dictionary API** - Word validation (via Next.js API proxy)

### Development Tools
- **ESLint** - Code linting
- **TypeScript** - Static type checking
- **PostCSS** - CSS processing

## 📋 Prerequisites

- **Node.js** 18+ and npm
- **Groq API Key** - Get one from [Groq Console](https://console.groq.com/)
- **Modern Browser** - Chrome, Firefox, Safari, or Edge (latest versions)

## 🚀 Installation & Setup

### 1. Clone the Repository

```bash
git clone https://github.com/Ishani018/WordSearchGenerator.git
cd word-search-generator
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up Environment Variables

Create a `.env.local` file in the root directory:

```env
# Groq API Configuration
# Get your API key from: https://console.groq.com/
GROQ_API_KEY=your_groq_api_key_here

# Optional: Change the model if needed
# Available models:
# - llama-3.3-70b-versatile (default, recommended)
# - llama-3.1-8b-instant
# - mixtral-8x7b-32768
# - gemma2-9b-it
GROQ_MODEL=llama-3.3-70b-versatile

# Authentication Credentials
# IMPORTANT: Do NOT use NEXT_PUBLIC_ prefix for passwords (they would be exposed to client)
# Passwords are validated server-side only - never exposed to browser JavaScript
ADMIN_USERNAME=Admin
ADMIN_PASSWORD=your_admin_password_here
SAMPA_USERNAME=Sampa
SAMPA_PASSWORD=your_sampa_password_here
```

**Important**: Never commit `.env.local` to version control. It's already in `.gitignore`.

### 4. Download Fonts (Optional)

For PDF generation with custom fonts, download the required font files:

1. Navigate to `public/fonts/README.md` for detailed instructions
2. Download fonts from Google Fonts:
   - Roboto (Regular, Bold)
   - Open Sans (Regular, Bold)
   - Lora (Regular, Bold)
   - Playfair Display (Regular, Bold)
   - Playpen Sans (Regular, Bold)
   - Schoolbell (Regular)
3. Place `.ttf` files in `public/fonts/` directory

### 5. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 6. Build for Production

```bash
npm run build
npm start
```

## 📁 Project Structure

```
word-search-generator/
├── app/                          # Next.js App Router directory
│   ├── api/                      # API routes
│   │   ├── generate-words/       # Word generation endpoint
│   │   │   └── route.ts         # Groq API integration with rate limiting
│   │   └── validate-word/       # Word validation endpoint
│   │       └── route.ts         # Dictionary API proxy
│   ├── layout.tsx               # Root layout with providers
│   ├── page.tsx                 # Main dashboard page
│   └── globals.css              # Global styles
│
├── components/                   # React components
│   ├── InstructionsPanel.tsx    # Context-aware instructions
│   ├── LoginForm.tsx            # Authentication UI
│   ├── PDFDownloadButton.tsx    # PDF generation component
│   ├── PDFPreviewModal.tsx     # PDF preview modal
│   ├── PNGDownloadButton.tsx   # PNG export component
│   ├── PuzzlePreview.tsx       # Interactive puzzle preview
│   └── ui/                      # shadcn/ui components
│       ├── alert-dialog.tsx     # Custom alert dialog
│       ├── button.tsx          # Button component
│       └── toast.tsx           # Toast notification system
│
├── lib/                         # Utility functions and logic
│   ├── alert.tsx                # Alert context provider
│   ├── auth.ts                  # Authentication configuration
│   ├── fonts.ts                 # Font loading utilities
│   ├── puzzle-generator.ts      # Core puzzle generation algorithm
│   ├── utils.ts                 # General utilities
│   ├── word-generator.ts        # Word generation helpers
│   └── word-validator.ts        # Word validation logic
│
├── public/                      # Static assets
│   └── fonts/                   # Custom font files (.ttf)
│       └── README.md           # Font download instructions
│
├── .env.local                   # Environment variables (not in git)
├── .gitignore                   # Git ignore rules
├── components.json              # shadcn/ui configuration
├── next.config.ts               # Next.js configuration
├── package.json                 # Dependencies
├── postcss.config.mjs          # PostCSS configuration
├── README.md                    # This file
└── tsconfig.json                # TypeScript configuration
```

## 🏗️ Architecture Overview

### Client-Side Architecture

The application follows a client-side heavy architecture:

1. **Main Dashboard** (`app/page.tsx`): Central hub with mode switching, controls, and preview
2. **Puzzle Generator** (`lib/puzzle-generator.ts`): Pure TypeScript algorithm running in browser
3. **Word Generation**: API route calls Groq, returns words to client
4. **PDF Generation**: jsPDF runs entirely in browser, no server needed
5. **State Management**: React hooks (useState, useCallback, useEffect)

### Server-Side Architecture

Minimal server-side code:

1. **API Routes**: Proxy endpoints for external APIs (Groq, Dictionary API)
2. **Rate Limiting**: Built-in rate limiting for Groq API calls
3. **Error Handling**: Comprehensive error handling with retries

## 🔑 Key Components

### `app/page.tsx`
Main dashboard component with:
- Mode switching (Book/Single)
- Theme input and word generation
- Grid size selector
- Difficulty settings
- Chapter management (Book Mode)
- PDF options
- Progress tracking
- Authentication integration

### `lib/puzzle-generator.ts`
Core puzzle generation algorithm:
- **`generatePuzzle()`**: Main function that creates puzzle grid
- **Intersection Prioritization**: Tries to place words at intersections first
- **Difficulty Levels**: Filters directions based on difficulty
- **Anti-Clustering**: Prevents words from clustering in one area
- **Sparse Placement**: Distributes words across the grid
- **Retry Logic**: Aggressive retry mechanism for word placement

### `components/PDFDownloadButton.tsx`
PDF generation component:
- **Dynamic Page Sizes**: Supports KDP standard sizes
- **Mirrored Margins**: Odd/even page margin handling for book printing
- **Font Loading**: Custom Google Fonts support
- **Layout Safety**: Prevents content overflow
- **Solution Pages**: Generates answer keys with customizable styling

### `app/api/generate-words/route.ts`
Word generation API:
- **Topic Expansion**: Generates sub-themes and chapters
- **Rate-Limited Batching**: Handles Groq API rate limits
- **Error Handling**: Retry logic for 429 errors
- **Response Formatting**: Returns structured data

## 🔐 Authentication

The application uses a secure server-side authentication system:

- **Server-Side Validation**: All password validation happens on the server via API routes
- **HTTP-Only Cookies**: Session tokens stored in secure, HTTP-only cookies (not accessible via JavaScript)
- **Credentials**: Stored in server-only environment variables (no `NEXT_PUBLIC_` prefix for passwords)
- **Security**: Passwords never exposed to client-side JavaScript bundle
- **Session Management**: Uses secure cookies with proper flags (httpOnly, secure, sameSite)

**Environment Variables:**
- `ADMIN_USERNAME` - Admin username (can be public)
- `ADMIN_PASSWORD` - Admin password (server-only, never exposed)
- `SAMPA_USERNAME` - Sampa username (can be public)
- `SAMPA_PASSWORD` - Sampa password (server-only, never exposed)

**API Routes:**
- `POST /api/auth` - Login endpoint (validates credentials server-side)
- `GET /api/auth` - Check authentication status
- `DELETE /api/auth` - Logout endpoint (clears session)

To add/modify users, update environment variables in `.env.local`.

## 📊 API Routes

### `POST /api/auth`

Authenticates a user and creates a session.

**Request Body:**
```typescript
{
  username: string;
  password: string;
}
```

**Response:**
```typescript
{
  success: boolean;
  error?: string;
}
```

Sets an HTTP-only cookie on success.

### `GET /api/auth`

Checks if the current user is authenticated.

**Response:**
```typescript
{
  authenticated: boolean;
}
```

### `DELETE /api/auth`

Logs out the current user by clearing the session cookie.

**Response:**
```typescript
{
  success: boolean;
}
```

### `POST /api/generate-words`

Generates words from a theme or expands a topic into chapters.

**Request Body:**
```typescript
{
  theme: string;           // Main theme (e.g., "Winter")
  count?: number;          // Number of words (for single mode)
  mode?: 'words' | 'expand_topic';
  numChapters?: number;    // Number of chapters (for expand_topic)
  maxWordLength?: number;  // Maximum word length
}
```

**Response:**
```typescript
// For 'words' mode:
{
  words: string[];
  warning?: string;
}

// For 'expand_topic' mode:
{
  bookTitle: string;
  chapters: Array<{
    title: string;
    words: string[];  // Empty initially, filled client-side
  }>;
}
```

### `POST /api/validate-word`

Validates a word against a dictionary API.

**Request Body:**
```typescript
{
  word: string;
}
```

**Response:**
```typescript
{
  valid: boolean;
  error?: string;
}
```

## 🎨 Puzzle Generation Algorithm

The puzzle generator (`lib/puzzle-generator.ts`) uses a sophisticated algorithm:

### 1. **Intersection Prioritization**
- First attempts to place words at intersections with existing letters
- Creates denser, more professional-looking puzzles

### 2. **Difficulty-Based Directions**
- **Easy**: Only horizontal and vertical
- **Medium**: Adds diagonal directions
- **Hard**: Adds reverse directions

### 3. **Anti-Clustering**
- Tracks word placement density
- Prefers sparse areas over dense clusters
- Ensures words are distributed across the grid

### 4. **Retry Logic**
- Attempts multiple placements per word
- Falls back to random placement if intersection fails
- Configurable retry count

### 5. **Safety Gaps**
- Maintains minimum distance between words
- Prevents overlapping placements

## 📖 Usage Guide

### Book Mode

1. **Enter Theme**: Type a main theme (e.g., "Gardening")
2. **Set Chapters**: Choose number of chapters (default: 2)
3. **Generate Structure**: Click "Generate Book Structure"
   - AI creates sub-themes for each chapter
   - Words are generated for each chapter
4. **Review & Edit**: 
   - Edit chapter titles
   - Edit words per chapter
   - Add blank pages
   - Reorder chapters
5. **Generate Puzzles**: Click "Generate All Puzzles"
   - Creates puzzles for all chapters
   - Shows progress bar
6. **Download PDF**: 
   - Preview PDF first
   - Customize fonts and options
   - Download complete book

### Single Puzzle Mode

1. **Enter Theme**: Type a theme (e.g., "Animals")
2. **Generate Words**: Click "Generate Words"
   - AI generates words related to theme
3. **Edit Words** (Optional): Modify words in text area
4. **Customize**: Set grid size and difficulty
5. **Download**: Export as PNG or PDF

### CSV Import

1. **Prepare CSV**: Create CSV with words (one per line or "Word, Clue" format)
2. **Import**: Click "Bulk Import CSV" or "Import CSV Files"
3. **Validation**: Optionally validate words
4. **Auto-Chapter**: Each CSV becomes a chapter (Book Mode)

## ⚙️ Configuration

### Grid Sizes
- Default: 15x15
- Range: 5x5 to 50x50
- Interactive selector in UI

### Difficulty Levels
- **Easy**: Horizontal and vertical only
- **Medium**: Adds diagonal directions
- **Hard**: Adds reverse directions

### PDF Options
- **Page Sizes**: Letter, A4, or custom KDP sizes
- **Fonts**: Google Fonts or standard fonts
- **Font Size**: 4pt to 20pt for grid letters
- **Front Matter**: Title page, "Belongs To" page
- **Solution Style**: Transparent red lines with black outline

## 🐛 Troubleshooting

### Word Generation Fails
- **Check API Key**: Ensure `GROQ_API_KEY` is set in `.env.local`
- **Check Rate Limits**: Groq free tier has rate limits; wait and retry
- **Check Model**: Ensure `GROQ_MODEL` is valid

### Puzzle Generation Fails
- **Word Length**: Words must fit in grid (length ≤ gridSize - 2)
- **Too Many Words**: Reduce words per puzzle
- **Grid Too Small**: Increase grid size
- **Difficulty**: Try easier difficulty level

### PDF Generation Issues
- **Font Loading**: Ensure font files are in `public/fonts/`
- **Page Overflow**: Reduce font size or increase page size
- **Missing Fonts**: Check browser console for font loading errors

### Authentication Issues
- **Check Environment Variables**: Ensure all `NEXT_PUBLIC_*` vars are set
- **Clear localStorage**: Clear browser storage if stuck
- **Restart Server**: Restart dev server after changing env vars

## 🚀 Deployment

### Vercel (Recommended)

1. Push code to GitHub
2. Import project in Vercel
3. Add environment variables in Vercel dashboard
4. Deploy

### Other Platforms

1. Build the project: `npm run build`
2. Set environment variables on hosting platform
3. Deploy the `.next` folder or use `npm start`

### Environment Variables for Production

Ensure all environment variables from `.env.local` are set in your hosting platform:
- `GROQ_API_KEY`
- `GROQ_MODEL` (optional)
- `ADMIN_USERNAME`
- `ADMIN_PASSWORD` (server-only, never use `NEXT_PUBLIC_` prefix)
- `SAMPA_USERNAME`
- `SAMPA_PASSWORD` (server-only, never use `NEXT_PUBLIC_` prefix)

## 🔒 Security Considerations

- **API Keys**: Never commit API keys to version control
- **Authentication**: 
  - Passwords stored in server-only environment variables (no `NEXT_PUBLIC_` prefix)
  - All password validation happens server-side via API routes
  - Session tokens stored in HTTP-only cookies (not accessible via JavaScript)
  - Never expose passwords in client-side code
- **Client-Side**: Most logic runs client-side; sensitive operations use API routes
- **Rate Limiting**: Built-in rate limiting for external API calls
- **CORS**: Dictionary API calls proxied through Next.js to avoid CORS issues
- **Session Security**: Cookies use `httpOnly`, `secure`, and `sameSite` flags

## 📝 Development

### Adding New Features

1. **New Components**: Add to `components/` directory
2. **New Utilities**: Add to `lib/` directory
3. **New API Routes**: Add to `app/api/` directory
4. **Styling**: Use Tailwind CSS classes

### Code Style

- **TypeScript**: Strict mode enabled
- **Components**: Functional components with hooks
- **Naming**: PascalCase for components, camelCase for functions
- **Imports**: Absolute imports using `@/` alias

### Testing

Currently no automated tests. Manual testing recommended:
- Test word generation with various themes
- Test puzzle generation with different grid sizes
- Test PDF export with different fonts and sizes
- Test CSV import with various formats

## 🤝 Contributing

Contributions are welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details

## 🙏 Acknowledgments

- **Groq** for fast AI inference
- **Next.js** team for the excellent framework
- **shadcn** for beautiful UI components
- **jsPDF** for client-side PDF generation

## 📞 Support

For issues, questions, or contributions, please open an issue on GitHub.

---

**Built with ❤️ for creating printable puzzle books**
