# Word Search Puzzle Book Generator

A professional, full-featured word search puzzle generator built with Next.js 14+ (App Router), TypeScript, and Tailwind CSS. This application generates printable puzzle books optimized for KDP (Kindle Direct Publishing) with AI-powered word generation, client-side puzzle creation, and high-quality PDF export.

## Overview

This application allows users to generate complete word search puzzle books from themes. It features two primary modes:

- **Book Mode**: Generate multi-chapter puzzle books with AI-powered topic expansion. Perfect for creating comprehensive puzzle books for publishing on platforms like Amazon KDP.
- **Single Puzzle Mode**: Generate individual puzzles for quick use, testing, or standalone puzzles.

All puzzle generation happens client-side in the browser, ensuring privacy and fast performance. The application includes secure authentication, custom alert systems, real-time progress tracking, and professional PDF generation with customizable fonts, page sizes, and layouts.

## Features

### Core Functionality

**AI-Powered Word Generation**
- Uses Groq API for fast, intelligent word generation from themes
- Supports topic expansion to automatically generate sub-themes and chapters
- Configurable word count and validation options
- Rate limiting and error handling built-in

**Client-Side Puzzle Generation**
- All grid generation happens in the browser using TypeScript algorithms
- No server-side processing required for puzzle creation
- Fast performance with no data transmission overhead
- Privacy-focused: words and puzzles never leave the browser

**High-Quality PDF Export**
- Professional PDF generation with customizable fonts, page sizes, and layouts
- Support for KDP standard page sizes with mirrored margins
- Customizable font sizes for grid letters and headings
- Solution pages with transparent red lines and black outlines
- Title pages, "Belongs To" pages, and blank page support

**PNG Export**
- Export puzzles as high-resolution images for digital use
- Perfect for social media, websites, or digital distribution

**Authentication System**
- Password-protected access with environment-based credentials
- Server-side validation with HTTP-only cookies
- Secure session management
- Support for multiple user accounts

### User Experience

**Modern Clean SaaS UI**
- Professional design with soft gray background (#F3F4F6)
- White card-style components with subtle shadows
- Indigo/Royal Blue (#4F46E5) primary action buttons
- Deep charcoal gray (#1F2937) text for optimal readability
- Outline-style secondary buttons for less prominent actions
- Fully responsive design that works on all screen sizes

**Interactive Preview**
- Hover over words to see them highlighted in the grid
- Click chapters to view individual puzzles
- Real-time puzzle updates as you edit words
- Centered content with professional card styling

**Progress Tracking**
- Prominent real-time progress bars at the top of the sidebar
- Separate progress indicators for word generation and puzzle creation
- Status messages showing current operation
- Visual feedback for all long-running operations

**Smart Instructions**
- Context-aware instructions that appear when needed
- Comprehensive help modal with detailed documentation
- Tooltips and inline help text
- Clear error messages and validation feedback

**Custom Alerts and Notifications**
- Beautiful theme-matching alert dialogs
- Toast notifications for quick feedback
- Consistent styling across all user feedback

**Organized Controls**
- Clean, vertical layout for better UX
- Collapsible sections to maximize preview space
- Logical grouping of related controls
- Segmented control for mode switching

**CSV Import and Management**
- Single CSV import with automatic chapter splitting
- Support for chapter titles directly in CSV files
- Multiple CSV format options
- Automatic word validation during import

### Advanced Features

**Word Editing**
- Edit words before generating puzzles
- Real-time preview updates
- Word validation with dictionary API
- Custom word lists support

**Smart Algorithm**
- Improved word placement with intersection prioritization
- Anti-clustering to distribute words evenly
- Difficulty-based direction filtering
- Configurable retry logic for optimal placement

**Difficulty Levels**
- Easy: Only horizontal and vertical directions
- Medium: Adds diagonal directions
- Hard: Adds reverse directions (backwards words)

**Font Customization**
- Support for Google Fonts and standard fonts in PDFs
- Adjustable font sizes with interactive sliders
- Custom heading sizes
- Font loading with fallback options

**KDP Page Sizes**
- Support for standard KDP page sizes
- Mirrored margins for book printing
- Custom page size support
- Proper margin calculations

**Book Features**
- Title pages with customizable text
- "This Book Belongs To" pages
- Blank pages between chapters
- Chapter reordering with drag-and-drop
- Chapter title editing

**KDP Marketing Tools**
- AI-powered title generator
- Amazon book description generator
- Copy-to-clipboard functionality
- SEO-optimized content suggestions

**Puzzle Navigation**
- Click on chapters to preview individual puzzles
- Puzzle counter showing current puzzle number
- Easy navigation between puzzles
- Visual indicators for generated puzzles

**Collapsible PDF Options**
- PDF customization options can be collapsed
- Maximizes preview space when not needed
- Organized settings sections
- Quick access to common options

## Tech Stack

### Frontend

- **Next.js 16.1.1** (App Router) - React framework with server-side rendering and API routes
- **React 19.2.3** - Modern UI library with hooks and context
- **TypeScript 5** - Type-safe development with strict mode
- **Tailwind CSS 4** - Utility-first CSS framework for rapid styling
- **shadcn/ui** - High-quality, accessible React components
- **Framer Motion 12.23.26** - Animation library for smooth transitions
- **Lucide React 0.562.0** - Comprehensive icon library

### PDF & Image Generation

- **jsPDF 3.0.4** - Client-side PDF generation library
- **html2canvas 1.4.1** - Canvas-based image export for PNG generation

### AI & APIs

- **Groq SDK 0.37.0** - Fast AI inference for word generation and content creation
- **Dictionary API** - Word validation via Next.js API proxy to avoid CORS issues

### Development Tools

- **ESLint** - Code linting and quality assurance
- **TypeScript** - Static type checking
- **PostCSS** - CSS processing and optimization

## Prerequisites

- **Node.js** 18+ and npm (or yarn/pnpm)
- **Groq API Key** - Get one from [Groq Console](https://console.groq.com/)
- **Modern Browser** - Chrome, Firefox, Safari, or Edge (latest versions recommended)

## Installation & Setup

### 1. Clone the Repository

```bash
git clone https://github.com/Ishani018/WordSearchGenerator.git
cd word-search-generator
```

### 2. Install Dependencies

```bash
npm install
```

This will install all required dependencies including Next.js, React, TypeScript, Tailwind CSS, and all other packages listed in `package.json`.

### 3. Set Up Environment Variables

Create a `.env.local` file in the root directory:

```env
# Groq API Configuration
# Get your API key from: https://console.groq.com/
GROQ_API_KEY=your_groq_api_key_here

# Optional: Change the model if needed
# Available models:
# - llama-3.3-70b-versatile (default, recommended for best quality)
# - llama-3.1-8b-instant (faster, lower quality)
# - mixtral-8x7b-32768 (alternative option)
# - gemma2-9b-it (alternative option)
GROQ_MODEL=llama-3.3-70b-versatile

# Authentication Credentials
# IMPORTANT: Do NOT use NEXT_PUBLIC_ prefix for passwords (they would be exposed to client)
# Passwords are validated server-side only - never exposed to browser JavaScript
ADMIN_USERNAME=Admin
ADMIN_PASSWORD=your_admin_password_here
SAMPA_USERNAME=Sampa
SAMPA_PASSWORD=your_sampa_password_here
```

**Important Security Notes:**
- Never commit `.env.local` to version control. It's already in `.gitignore`.
- Passwords should NOT have `NEXT_PUBLIC_` prefix (they're server-only)
- All password validation happens server-side via API routes
- Session tokens are stored in HTTP-only cookies (not accessible via JavaScript)

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
4. Fonts will be automatically loaded when generating PDFs

### 5. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

The development server includes:
- Hot module replacement for instant updates
- TypeScript type checking
- ESLint warnings in the console
- Source maps for debugging

### 6. Build for Production

```bash
npm run build
npm start
```

This creates an optimized production build in the `.next` directory. The build process:
- Compiles TypeScript to JavaScript
- Optimizes React components
- Minifies CSS and JavaScript
- Generates static pages where possible
- Creates optimized bundles

## Project Structure

```
word-search-generator/
├── app/                          # Next.js App Router directory
│   ├── api/                      # API routes (server-side)
│   │   ├── auth/                 # Authentication endpoint
│   │   │   └── route.ts         # Login, logout, status check
│   │   ├── generate-words/       # Word generation endpoint
│   │   │   └── route.ts         # Groq API integration with rate limiting
│   │   ├── generate-kdp-content/ # KDP marketing content generation
│   │   │   └── route.ts         # AI-powered titles and descriptions
│   │   └── validate-word/       # Word validation endpoint
│   │       └── route.ts         # Dictionary API proxy
│   ├── layout.tsx               # Root layout with providers
│   ├── page.tsx                 # Main dashboard page
│   └── globals.css              # Global styles and CSS variables
│
├── components/                   # React components
│   ├── HelpModal.tsx            # Comprehensive help and instructions modal
│   ├── InstructionsPanel.tsx    # Context-aware instructions
│   ├── LoginForm.tsx            # Authentication UI
│   ├── ExportModal.tsx          # Export options and PDF configuration
│   ├── PDFDownloadButton.tsx   # PDF generation component
│   ├── PDFPreviewModal.tsx     # PDF preview modal
│   ├── PNGDownloadButton.tsx   # PNG export component
│   ├── PuzzlePreview.tsx       # Interactive puzzle preview
│   ├── SudokuPreview.tsx       # Interactive Sudoku preview
│   └── ui/                      # shadcn/ui components
│       ├── alert-dialog.tsx     # Custom alert dialog
│       ├── button.tsx          # Button component
│       └── toast.tsx           # Toast notification system
│
├── lib/                         # Utility functions and logic
│   ├── alert.tsx                # Alert context provider
│   ├── auth-client.ts           # Client-side auth utilities
│   ├── fonts.ts                 # Font loading utilities
│   ├── puzzle-generator.ts      # Core puzzle generation algorithm
│   ├── sudoku-generator.ts      # Sudoku puzzle generation
│   ├── utils.ts                 # General utilities
│   ├── word-generator.ts        # Word generation helpers
│   └── word-validator.ts       # Word validation logic
│
├── public/                      # Static assets
│   └── fonts/                   # Custom font files (.ttf)
│       └── README.md           # Font download instructions
│
├── .env.local                   # Environment variables (not in git)
├── .gitignore                   # Git ignore rules
├── components.json              # shadcn/ui configuration
├── next.config.ts               # Next.js configuration
├── package.json                 # Dependencies and scripts
├── postcss.config.mjs          # PostCSS configuration
├── README.md                    # This file
└── tsconfig.json                # TypeScript configuration
```

## Architecture Overview

### Client-Side Architecture

The application follows a client-side heavy architecture for optimal performance and privacy:

1. **Main Dashboard** (`app/page.tsx`): Central hub with mode switching, controls, and preview
   - Manages all application state using React hooks
   - Handles user interactions and UI updates
   - Coordinates between different components
   - Manages puzzle generation workflow

2. **Puzzle Generator** (`lib/puzzle-generator.ts`): Pure TypeScript algorithm running in browser
   - No server communication required
   - Fast execution with no network latency
   - Privacy-focused: words never leave the browser
   - Sophisticated placement algorithm

3. **Word Generation**: API route calls Groq, returns words to client
   - Server-side API proxy for security
   - Rate limiting and error handling
   - Structured response format
   - Support for both single words and topic expansion

4. **PDF Generation**: jsPDF runs entirely in browser, no server needed
   - Client-side PDF creation
   - Custom font support
   - Professional layouts
   - Solution page generation

5. **State Management**: React hooks (useState, useCallback, useEffect)
   - Local component state
   - Context providers for global state
   - Optimized re-renders
   - Efficient state updates

### Server-Side Architecture

Minimal server-side code for security and performance:

1. **API Routes**: Proxy endpoints for external APIs (Groq, Dictionary API)
   - Secure API key handling
   - Rate limiting
   - Error handling and retries
   - CORS avoidance

2. **Rate Limiting**: Built-in rate limiting for Groq API calls
   - Prevents API quota exhaustion
   - Handles 429 errors gracefully
   - Automatic retry with backoff

3. **Error Handling**: Comprehensive error handling with retries
   - Network error recovery
   - API error handling
   - User-friendly error messages
   - Logging for debugging

4. **Authentication**: Secure server-side authentication
   - Password validation on server
   - HTTP-only cookie sessions
   - Secure session management
   - Multiple user support

## Key Components

### `app/page.tsx`

Main dashboard component that serves as the central hub for the entire application:

- **Mode Switching**: Toggle between Book Mode and Single Puzzle Mode
- **Puzzle Type Selection**: Choose between Word Search and Sudoku
- **Consolidated Settings**: All puzzle settings in organized sections
  - Theme input and word generation
  - Difficulty and grid size configuration
  - Word validation options
  - Words per puzzle and chapter count
- **CSV Import**: Import words from CSV files with automatic chapter splitting
- **Chapter Management**: View, edit, and organize chapters
  - Edit chapter titles
  - Edit words per chapter
  - Add blank pages
  - Reorder chapters
  - Preview individual puzzles
- **KDP Marketing Tools**: Generate book titles and descriptions
- **PDF Configuration**: Collapsible PDF options section
- **Progress Tracking**: Prominent progress bars at top of sidebar
- **Authentication Integration**: Login/logout functionality
- **Export Functionality**: PDF and PNG export options

### `lib/puzzle-generator.ts`

Core puzzle generation algorithm with sophisticated placement logic:

- **`generatePuzzle()`**: Main function that creates puzzle grid
  - Takes words, grid size, and difficulty as input
  - Returns complete puzzle with placed words
  - Handles edge cases and errors gracefully

- **Intersection Prioritization**: Tries to place words at intersections first
  - Creates denser, more professional-looking puzzles
  - Reduces empty space
  - Improves puzzle quality

- **Difficulty Levels**: Filters directions based on difficulty
  - Easy: Only horizontal and vertical
  - Medium: Adds diagonal directions
  - Hard: Adds reverse directions

- **Anti-Clustering**: Prevents words from clustering in one area
  - Tracks word placement density
  - Prefers sparse areas over dense clusters
  - Ensures words are distributed across the grid

- **Sparse Placement**: Distributes words across the grid
  - Maintains minimum distance between words
  - Prevents overlapping placements
  - Creates balanced puzzles

- **Retry Logic**: Aggressive retry mechanism for word placement
  - Attempts multiple placements per word
  - Falls back to random placement if intersection fails
  - Configurable retry count
  - Handles difficult word combinations

### `components/PDFDownloadButton.tsx`

PDF generation component with comprehensive customization options:

- **Dynamic Page Sizes**: Supports KDP standard sizes
  - 5 x 8 in
  - 5.25 x 8 in
  - 5.5 x 8.5 in
  - 6 x 9 in (Standard KDP)
  - 7 x 10 in
  - 8.5 x 8.5 in (Square)
  - 8.5 x 11 in (Letter)
  - 8.27 x 11.69 in (A4)
  - Custom sizes

- **Mirrored Margins**: Odd/even page margin handling for book printing
  - Proper gutter margins
  - Professional book layout
  - Print-ready formatting

- **Font Loading**: Custom Google Fonts support
  - Dynamic font loading
  - Fallback fonts
  - Font size customization

- **Layout Safety**: Prevents content overflow
  - Automatic scaling
  - Margin calculations
  - Page break handling

- **Solution Pages**: Generates answer keys with customizable styling
  - Transparent red lines
  - Black outlines
  - Clear word identification
  - Professional appearance

### `app/api/generate-words/route.ts`

Word generation API with comprehensive features:

- **Topic Expansion**: Generates sub-themes and chapters
  - AI-powered theme analysis
  - Automatic chapter creation
  - Structured book structure

- **Rate-Limited Batching**: Handles Groq API rate limits
  - Automatic retry on 429 errors
  - Exponential backoff
  - Request queuing

- **Error Handling**: Retry logic for 429 errors
  - Network error recovery
  - API error handling
  - User-friendly error messages

- **Response Formatting**: Returns structured data
  - Consistent data format
  - Error information
  - Warning messages

### `app/api/generate-kdp-content/route.ts`

KDP marketing content generation:

- **Title Generation**: AI-powered book title suggestions
  - SEO-optimized titles
  - Multiple variations
  - Keyword-rich content

- **Description Generation**: Amazon book description with keywords
  - Compelling descriptions
  - SEO optimization
  - Keyword integration

- **Rate Limiting**: Handles Groq API rate limits
  - Prevents quota exhaustion
  - Automatic retry
  - Error recovery

- **Error Handling**: Comprehensive error handling with retries
  - Network errors
  - API errors
  - User feedback

## Authentication

The application uses a secure server-side authentication system:

**Security Features:**
- Server-side validation: All password validation happens on the server via API routes
- HTTP-only cookies: Session tokens stored in secure, HTTP-only cookies (not accessible via JavaScript)
- Credentials storage: Passwords stored in server-only environment variables (no `NEXT_PUBLIC_` prefix)
- Session security: Passwords never exposed to client-side JavaScript bundle
- Cookie flags: Uses secure cookies with proper flags (httpOnly, secure, sameSite)

**Environment Variables:**
- `ADMIN_USERNAME` - Admin username (can be public)
- `ADMIN_PASSWORD` - Admin password (server-only, never exposed)
- `SAMPA_USERNAME` - Sampa username (can be public)
- `SAMPA_PASSWORD` - Sampa password (server-only, never exposed)

**API Routes:**
- `POST /api/auth` - Login endpoint (validates credentials server-side)
- `GET /api/auth` - Check authentication status
- `DELETE /api/auth` - Logout endpoint (clears session)

To add or modify users, update environment variables in `.env.local` and restart the server.

## API Routes

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

Sets an HTTP-only cookie on success. The cookie is secure and not accessible via JavaScript.

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

## Puzzle Generation Algorithm

The puzzle generator (`lib/puzzle-generator.ts`) uses a sophisticated algorithm to create high-quality puzzles:

### 1. Intersection Prioritization

- First attempts to place words at intersections with existing letters
- Creates denser, more professional-looking puzzles
- Reduces empty space in the grid
- Improves overall puzzle quality

### 2. Difficulty-Based Directions

The algorithm filters available directions based on difficulty level:

- **Easy**: Only horizontal and vertical directions
  - Simplest puzzles for beginners
  - Clear word placement
  - Easy to solve

- **Medium**: Adds diagonal directions
  - More challenging puzzles
  - Diagonal word placement
  - Increased complexity

- **Hard**: Adds reverse directions (backwards words)
  - Most challenging puzzles
  - Words can be placed backwards
  - Maximum difficulty

### 3. Anti-Clustering

- Tracks word placement density across the grid
- Prefers sparse areas over dense clusters
- Ensures words are distributed evenly
- Prevents concentration in one area
- Creates balanced puzzles

### 4. Retry Logic

- Attempts multiple placements per word
- Falls back to random placement if intersection fails
- Configurable retry count
- Handles difficult word combinations
- Ensures maximum word placement

### 5. Safety Gaps

- Maintains minimum distance between words
- Prevents overlapping placements
- Ensures readability
- Creates clean puzzles
- Avoids word conflicts

## Usage Guide

### Book Mode

Book Mode is designed for creating comprehensive puzzle books for publishing:

1. **Enter Theme**: Type a main theme (e.g., "Gardening", "Winter Activities", "Space Exploration")
   - The theme will be used to generate sub-themes and words
   - Be specific for better results

2. **Configure Settings**: 
   - Set difficulty level (Easy, Medium, Hard)
   - Set words per puzzle (default: 15)
   - Set number of chapters (default: 2)
   - Toggle word validation if desired
   - Configure grid size

3. **Generate Structure**: Click the search button next to theme input
   - Progress bar appears at top of sidebar
   - AI creates sub-themes for each chapter
   - Words are generated for each chapter
   - Structure appears in the Pages section

4. **Review & Edit**: 
   - View all chapters in the Pages section (below CSV import)
   - Click on any chapter to preview its puzzle
   - Edit chapter titles by clicking the edit icon
   - Edit words per chapter by clicking the words icon
   - Add blank pages using the "Add Page" button
   - Reorder chapters using up/down arrows

5. **KDP Marketing** (Optional):
   - Generate book titles using AI
   - Generate Amazon book description
   - Copy generated content to clipboard
   - Use for Amazon listing optimization

6. **Generate Puzzles**: Click "Generate Pages" button
   - Creates puzzles for all chapters
   - Shows progress bar at top
   - Updates in real-time
   - Preview puzzles as they're generated

7. **Customize PDF**: 
   - Expand PDF Options section
   - Adjust fonts, sizes, and options
   - Add title page, copyright, etc.
   - Configure page size and margins
   - Set solution page style

8. **Download PDF**: 
   - Preview PDF first to check layout
   - Download complete book
   - Ready for KDP upload

### Single Puzzle Mode

Single Puzzle Mode is perfect for quick puzzle generation:

1. **Enter Theme**: Type a theme (e.g., "Animals", "Food", "Sports")
   - Be specific for better word generation

2. **Generate Words**: Click "Generate Words" button
   - AI generates words related to theme
   - Words appear in editable text area
   - Progress indicator shows status

3. **Edit Words** (Optional): Modify words in text area
   - Add custom words
   - Remove unwanted words
   - Edit word list
   - Real-time preview updates

4. **Customize**: Set grid size and difficulty
   - Adjust grid size slider
   - Select difficulty level
   - Preview updates automatically

5. **Generate Puzzle**: Click "Generate Puzzle" button
   - Puzzle appears in preview area
   - Interactive word highlighting
   - Ready for export

6. **Download**: Export as PNG or PDF
   - PNG for digital use
   - PDF for printing
   - High-quality output

### CSV Import

The CSV import feature supports multiple formats for maximum flexibility:

#### Format 1: Simple Word List (Auto-Split)

1. **Prepare CSV**: Create CSV with words (one per line or "Word, Clue" format)
2. **Set Words per Puzzle**: Configure how many words should go into each chapter
3. **Import**: Click "Import CSV File" button
4. **Auto-Split**: Words are automatically split into chapters based on "Words per Puzzle" setting
5. **Review**: Check the Pages section below to see all generated chapters

#### Format 2: CSV with Chapter Titles

You can include chapter titles directly in your CSV file. The system will automatically detect and use them.

**Option A: Title in First Column**
```csv
"Chapter 1: Winter Words", SNOW, ICE, COLD, FROST
"Chapter 2: Summer Fun", BEACH, SUN, WAVE, SAND
```

**Option B: Title Marker Lines**
```csv
#TITLE: Chapter 1: Winter Words
SNOW
ICE
COLD
FROST

#TITLE: Chapter 2: Summer Fun
BEACH
SUN
WAVE
SAND
```

**Option C: Title on Separate Line**
```csv
Chapter 1: Winter Words
SNOW
ICE
COLD
FROST

Chapter 2: Summer Fun
BEACH
SUN
WAVE
SAND
```

**Notes:**
- Titles are automatically detected if they contain spaces, punctuation, or are longer than 20 characters
- If titles are detected, the "Words per Puzzle" setting is ignored (each title defines a chapter)
- Words are still filtered by grid size and validated if word validation is enabled
- Invalid words are automatically removed during import

## Configuration

### Grid Sizes

- **Default**: 15x15 grid
- **Range**: 5x5 to 50x50
- **Interactive Selector**: Slider in UI for easy adjustment
- **Auto-Filtering**: Words longer than grid size minus 2 are automatically filtered

### Difficulty Levels

- **Easy**: Horizontal and vertical only
  - Best for beginners
  - Simple word placement
  - Clear puzzle structure

- **Medium**: Adds diagonal directions
  - Moderate difficulty
  - More challenging placement
  - Increased complexity

- **Hard**: Adds reverse directions
  - Maximum difficulty
  - Backwards word placement
  - Most challenging puzzles

### PDF Options

- **Page Sizes**: Letter, A4, or custom KDP sizes
  - Standard sizes pre-configured
  - Custom size support
  - Proper margin calculations

- **Fonts**: Google Fonts or standard fonts
  - Multiple font options
  - Custom font loading
  - Fallback fonts

- **Font Size**: 4pt to 20pt for grid letters (adjustable slider)
  - Fine-grained control
  - Real-time preview
  - Optimal readability

- **Heading Size**: 10pt to 24pt for puzzle titles (adjustable slider)
  - Customizable titles
  - Professional appearance
  - Clear hierarchy

- **Front Matter**: Title page, "Belongs To" page
  - Customizable title pages
  - Personalization options
  - Professional formatting

- **Copyright Text**: Add copyright text that appears on all pages
  - Legal protection
  - Professional appearance
  - Consistent branding

- **Solution Style**: Transparent red lines with black outline
  - Clear word identification
  - Professional appearance
  - Easy to read

- **Collapsible UI**: PDF options can be collapsed to maximize preview space
  - Better workflow
  - More preview area
  - Organized interface

## Troubleshooting

### Word Generation Fails

**Check API Key**: Ensure `GROQ_API_KEY` is set in `.env.local`
- Verify the key is correct
- Check for typos or extra spaces
- Ensure the key is active

**Check Rate Limits**: Groq free tier has rate limits; wait and retry
- Free tier has request limits
- Wait a few minutes and retry
- Consider upgrading for higher limits

**Check Model**: Ensure `GROQ_MODEL` is valid
- Use supported model names
- Check Groq documentation for available models
- Default model is recommended

**Network Issues**: Check internet connection
- Verify connectivity
- Check firewall settings
- Try again later

### Puzzle Generation Fails

**Word Length**: Words must fit in grid (length ≤ gridSize - 2)
- Increase grid size
- Remove long words
- Check word filtering

**Too Many Words**: Reduce words per puzzle
- Lower the word count
- Increase grid size
- Use easier difficulty

**Grid Too Small**: Increase grid size
- Use larger grid
- Reduce word count
- Check word lengths

**Difficulty**: Try easier difficulty level
- Start with Easy
- Progress to harder levels
- Check word placement

### PDF Generation Issues

**Font Loading**: Ensure font files are in `public/fonts/`
- Check file locations
- Verify file names
- Check file formats

**Page Overflow**: Reduce font size or increase page size
- Adjust font size slider
- Use larger page size
- Check margins

**Missing Fonts**: Check browser console for font loading errors
- Open developer tools
- Check console for errors
- Verify font files exist

**Layout Issues**: Check page size and margins
- Verify page size settings
- Check margin calculations
- Adjust as needed

### Authentication Issues

**Check Environment Variables**: Ensure all auth environment variables are set (ADMIN_USERNAME, ADMIN_PASSWORD, etc.)
- Verify all variables are set
- Check for typos
- Ensure proper format

**Server-Side Only**: Passwords should NOT have `NEXT_PUBLIC_` prefix (they're server-only)
- Remove prefix if present
- Keep passwords server-only
- Verify security

**Check API Route**: Verify `/api/auth` route is working (check server logs)
- Check server console
- Verify route exists
- Check for errors

**Clear Cookies**: Clear browser cookies if authentication is stuck
- Clear browser data
- Try incognito mode
- Restart browser

**Restart Server**: Restart dev server after changing env vars
- Stop and restart server
- Verify changes take effect
- Check environment loading

## Deployment

### Vercel (Recommended)

Vercel is the recommended deployment platform for Next.js applications:

1. **Push Code**: Push code to GitHub repository
2. **Import Project**: Import project in Vercel dashboard
3. **Add Environment Variables**: Add all environment variables in Vercel dashboard
   - GROQ_API_KEY
   - GROQ_MODEL (optional)
   - ADMIN_USERNAME
   - ADMIN_PASSWORD
   - SAMPA_USERNAME
   - SAMPA_PASSWORD
4. **Deploy**: Vercel automatically deploys on push
5. **Verify**: Check deployment and test functionality

### Other Platforms

For other hosting platforms:

1. **Build the Project**: Run `npm run build`
2. **Set Environment Variables**: Set all environment variables on hosting platform
3. **Deploy**: Deploy the `.next` folder or use `npm start`
4. **Configure**: Set up proper Node.js version and build settings
5. **Test**: Verify deployment and functionality

### Environment Variables for Production

Ensure all environment variables from `.env.local` are set in your hosting platform:

- `GROQ_API_KEY` - Required for word generation
- `GROQ_MODEL` - Optional, defaults to llama-3.3-70b-versatile
- `ADMIN_USERNAME` - Required for authentication
- `ADMIN_PASSWORD` - Required for authentication (server-only)
- `SAMPA_USERNAME` - Required for authentication
- `SAMPA_PASSWORD` - Required for authentication (server-only)

**Important**: Never expose passwords with `NEXT_PUBLIC_` prefix in production.

## Security Considerations

**API Keys**: Never commit API keys to version control
- Use environment variables
- Keep keys secure
- Rotate keys regularly

**Authentication**: 
- Passwords stored in server-only environment variables (no `NEXT_PUBLIC_` prefix)
- All password validation happens server-side via API routes
- Session tokens stored in HTTP-only cookies (not accessible via JavaScript)
- Never expose passwords in client-side code

**Client-Side**: Most logic runs client-side; sensitive operations use API routes
- Puzzle generation is client-side
- Word generation uses API routes
- PDF generation is client-side
- Authentication is server-side

**Rate Limiting**: Built-in rate limiting for external API calls
- Prevents API quota exhaustion
- Handles errors gracefully
- Automatic retry with backoff

**CORS**: Dictionary API calls proxied through Next.js to avoid CORS issues
- Secure API access
- No CORS problems
- Proper error handling

**Session Security**: Cookies use `httpOnly`, `secure`, and `sameSite` flags
- Prevents XSS attacks
- Secure cookie transmission
- Proper session management

## Development

### Adding New Features

1. **New Components**: Add to `components/` directory
   - Follow existing component patterns
   - Use TypeScript
   - Include proper types

2. **New Utilities**: Add to `lib/` directory
   - Pure functions preferred
   - Type-safe code
   - Well-documented

3. **New API Routes**: Add to `app/api/` directory
   - Follow Next.js App Router patterns
   - Include error handling
   - Add rate limiting if needed

4. **Styling**: Use Tailwind CSS classes
   - Follow existing patterns
   - Use CSS variables
   - Maintain consistency

### Code Style

- **TypeScript**: Strict mode enabled
  - Type safety
  - Better IDE support
  - Fewer runtime errors

- **Components**: Functional components with hooks
  - Modern React patterns
  - Hooks for state management
  - Clean component structure

- **Naming**: PascalCase for components, camelCase for functions
  - Consistent naming
  - Clear conventions
  - Easy to understand

- **Imports**: Absolute imports using `@/` alias
  - Clean import paths
  - Better organization
  - Easier refactoring

### Testing

Currently no automated tests. Manual testing recommended:

- Test word generation with various themes
- Test puzzle generation with different grid sizes
- Test PDF export with different fonts and sizes
- Test CSV import with various formats
- Test authentication with different credentials
- Test error handling and edge cases
- Test responsive design on different screen sizes
- Test browser compatibility

## Contributing

Contributions are welcome! Please follow these guidelines:

1. **Fork the Repository**: Create your own fork
2. **Create Feature Branch**: Create a branch for your feature
3. **Make Changes**: Implement your changes
4. **Test Thoroughly**: Test all functionality
5. **Submit Pull Request**: Submit PR with clear description
6. **Follow Code Style**: Maintain existing code style
7. **Document Changes**: Update documentation as needed

## License

MIT License - see LICENSE file for details

## Acknowledgments

- **Groq** for fast AI inference and excellent API
- **Next.js** team for the excellent framework and documentation
- **shadcn** for beautiful, accessible UI components
- **jsPDF** for client-side PDF generation capabilities
- **Tailwind CSS** for the utility-first CSS framework
- **TypeScript** for type safety and developer experience

## Support

For issues, questions, or contributions, please open an issue on GitHub at [https://github.com/Ishani018/WordSearchGenerator](https://github.com/Ishani018/WordSearchGenerator).

---

**Built for creating professional, printable puzzle books**
