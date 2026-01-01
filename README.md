# Word Search Generator

A powerful tool for generating complete word search puzzle books with AI-powered word list generation, customizable formatting, and bulk export capabilities.

## Features

### Core Generation Features
- **Rapid Full-Book Creation**: Generate complete word search books (puzzles + answer keys) in minutes
- **Automated Word Lists**: AI generates relevant word lists from themes (e.g., "Winter")
- **Custom Word Input**: Manually add specific words alongside auto-generated ones

### Customization Options
- **Theme & Title Control**: Custom book titles and themes
- **Grid Sizes**: 10x10, 15x15 (Large Print), 20x20 (Standard)
- **Puzzle Configuration**: Control words per puzzle and total pages
- **Difficulty Settings**: Easy, Medium, Hard

### Design Features
- **Answer Key Styles**: Rectangles, Straight Lines, or Highlighting
- **Bulk Exporting**: Export all pages at once
- **Clean Formatting**: Auto-formatted pages with word lists

## Setup

1. Install dependencies:
```bash
pip install -r requirements.txt
```

2. Set up environment variables (create `.env` file):

**FREE Options (Recommended):**

```bash
# Option 1: Ollama (100% FREE, runs locally)
# Install Ollama from https://ollama.ai, then run: ollama pull llama3.2
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama3.2

# Option 2: Groq (FREE tier - very fast!)
# Get free API key from https://console.groq.com
GROQ_API_KEY=your_groq_api_key_here

# Option 3: Gemini (has free tier)
GEMINI_API_KEY=your_gemini_api_key_here
```

**Paid Options:**
```bash
# OpenAI (paid)
OPENAI_API_KEY=your_openai_api_key_here
```

**Note:** The tool will try APIs in this order: Ollama (free) → Groq (free) → Gemini → OpenAI → Fallback lists

3. Run the application:
```bash
python app.py
```

4. Open your browser to `http://localhost:5000`

## Usage

1. Enter a theme (e.g., "Winter")
2. Optionally add custom words
3. Configure grid size, difficulty, and page count
4. Select answer key style
5. Generate and download your complete book!

