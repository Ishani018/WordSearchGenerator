# Font Files - Download & Setup Guide

## 📍 Where to Place Files
**All font files must be placed in:** `public/fonts/` directory

---

## 📋 Complete Font List

You need to download **11 font files** total (5 fonts × 2 styles each + 1 single style):

### 1. Roboto
- **Files needed:**
  - `Roboto-Regular.ttf`
  - `Roboto-Bold.ttf`
- **Google Fonts page:** https://fonts.google.com/specimen/Roboto

### 2. Open Sans
- **Files needed:**
  - `OpenSans-Regular.ttf`
  - `OpenSans-Bold.ttf`
- **Google Fonts page:** https://fonts.google.com/specimen/Open+Sans

### 3. Lora
- **Files needed:**
  - `Lora-Regular.ttf`
  - `Lora-Bold.ttf`
- **Google Fonts page:** https://fonts.google.com/specimen/Lora

### 4. Playfair Display
- **Files needed:**
  - `PlayfairDisplay-Regular.ttf`
  - `PlayfairDisplay-Bold.ttf`
- **Google Fonts page:** https://fonts.google.com/specimen/Playfair+Display

### 5. Playpen Sans
- **Files needed:**
  - `PlaypenSans-Regular.ttf`
  - `PlaypenSans-Bold.ttf`
- **Google Fonts page:** https://fonts.google.com/specimen/Playpen+Sans

### 6. Schoolbell
- **Files needed:**
  - `Schoolbell-Regular.ttf`
  - (Bold variant optional - not commonly available)
- **Google Fonts page:** https://fonts.google.com/specimen/Schoolbell

---

## 📥 Method 1: Download from Google Fonts (Recommended)

### Step-by-Step Instructions:

1. **Visit the font page** (e.g., https://fonts.google.com/specimen/Roboto)

2. **Look for the download button:**
   - **Option A:** Look in the **top right corner** of the page for a button that says:
     - "Download family" 
     - "Download" (with a download icon)
     - Or a button with three dots (⋮) that opens a menu with "Download"
   
   - **Option B:** If you don't see it, try this:
     - Click on **"Select this style"** for Regular (400 weight)
     - Click on **"Select this style"** for Bold (700 weight)
     - Look for a **toolbar at the bottom** of the page that appears
     - In that toolbar, click the **download icon** (usually looks like a downward arrow or disk)
   
   - **Option C:** Right-click on the font preview text and look for download options

3. **If you still can't find it, use Method 2 below**

---

## 📥 Method 2: Direct Download URLs (Alternative)

If you can't find the download button on Google Fonts, you can use these direct download links:

### Roboto
- Regular: Visit https://fonts.google.com/specimen/Roboto, select "Regular 400", then look for download in the bottom toolbar
- Bold: Same page, select "Bold 700", then download

### Open Sans
- Regular: Visit https://fonts.google.com/specimen/Open+Sans, select "Regular 400", then download
- Bold: Same page, select "Bold 700", then download

### Lora
- Regular: Visit https://fonts.google.com/specimen/Lora, select "Regular 400", then download
- Bold: Same page, select "Bold 700", then download

### Playfair Display
- Regular: Visit https://fonts.google.com/specimen/Playfair+Display, select "Regular 400", then download
- Bold: Same page, select "Bold 700", then download

### Playpen Sans
- Regular: Visit https://fonts.google.com/specimen/Playpen+Sans, select "Regular 400", then download
- Bold: Same page, select "Bold 700", then download

**Note:** When you select a style, a toolbar appears at the bottom with a download button.

---

## 📥 Method 3: Using Google Fonts Helper (Easiest)

1. Visit: https://gwfh.mranftl.com/fonts
2. Search for each font name (Roboto, Open Sans, Lora, Playfair Display, Playpen Sans)
3. Select the font
4. Check the boxes for "Regular 400" and "Bold 700"
5. Scroll down and click "Download" - this downloads a ZIP file
6. Extract and find the `.ttf` files

---

## 🔧 After Downloading - File Processing

### For Each Font:

1. **Extract the ZIP file** (if you downloaded a ZIP):
   - Right-click the ZIP file → "Extract All"
   - Or double-click to open and drag files out

2. **Find the TTF files:**
   - Look for files ending in `.ttf`
   - You need **Regular** (or 400 weight) and **Bold** (or 700 weight)
   - Files might be named:
     - `Roboto-Regular.ttf` or `Roboto[Regular].ttf` or `Roboto-Regular_400.ttf`
     - `Roboto-Bold.ttf` or `Roboto[Bold].ttf` or `Roboto-Bold_700.ttf`

3. **Rename files to match exactly:**
   - Remove brackets `[]`, underscores `_`, or numbers like `_400`, `_700`
   - Examples:
     - `Roboto[Regular].ttf` → `Roboto-Regular.ttf`
     - `Roboto-Regular_400.ttf` → `Roboto-Regular.ttf`
     - `Roboto-Bold_700.ttf` → `Roboto-Bold.ttf`

4. **Copy to fonts directory:**
   - Copy both `.ttf` files to: `public/fonts/`
   - Make sure filenames match **exactly** (case-sensitive!)

---

## ✅ Final Checklist

After downloading all fonts, your `public/fonts/` directory should contain:

```
public/fonts/
├── README.md
├── Roboto-Regular.ttf
├── Roboto-Bold.ttf
├── OpenSans-Regular.ttf
├── OpenSans-Bold.ttf
├── Lora-Regular.ttf
├── Lora-Bold.ttf
├── PlayfairDisplay-Regular.ttf
├── PlayfairDisplay-Bold.ttf
├── PlaypenSans-Regular.ttf
├── PlaypenSans-Bold.ttf
└── Schoolbell-Regular.ttf
```

**Total: 11 .ttf files + README.md**

---

## 🔍 Quick Verification

To verify all fonts are in place, run this command in your project root:

**Windows (PowerShell):**
```powershell
dir public\fonts\*.ttf
```

**Windows (Command Prompt):**
```cmd
dir public\fonts\*.ttf
```

**Mac/Linux:**
```bash
ls public/fonts/*.ttf
```

You should see 11 `.ttf` files listed (or 10 if Schoolbell Bold is not available).

---

## ⚠️ Important Notes

- **File names are case-sensitive** - `Roboto-Regular.ttf` is different from `roboto-regular.ttf`
- **Exact names required** - The filenames must match exactly as listed above
- **TTF format only** - Make sure you're using `.ttf` files, not `.otf` or `.woff`
- **No subdirectories** - Place files directly in `public/fonts/`, not in subfolders
- **If download button is missing** - Try Method 2 or Method 3 above

---

## 🚀 After Setup

Once all font files are in place:
1. Restart your Next.js dev server (`npm run dev`)
2. The fonts will appear in the font dropdown in the app
3. You can select and use any font for PDF generation

---

## 🆘 Still Having Trouble?

If you can't find the download button:
1. Try **Method 3** (Google Fonts Helper) - it's the easiest
2. Make sure JavaScript is enabled in your browser
3. Try a different browser (Chrome, Firefox, Edge)
4. Try the mobile version of Google Fonts
5. Check if an ad blocker is interfering
