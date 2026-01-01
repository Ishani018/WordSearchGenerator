const API_BASE = 'http://localhost:5000/api';

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('bookForm');
    const generateWordsBtn = document.getElementById('generateWordsBtn');
    const generateBtn = document.getElementById('generateBtn');
    const loading = document.getElementById('loading');
    const wordPreview = document.getElementById('wordPreview');
    
    // Mode switching
    let currentMode = 'book';
    const modeButtons = document.querySelectorAll('.mode-btn');
    const bookControls = document.getElementById('bookControls');
    const singleControls = document.getElementById('singleControls');
    const bookInfo = document.getElementById('bookInfo');
    const singleInfo = document.getElementById('singleInfo');
    const titleLabel = document.getElementById('titleLabel');
    const statsTitle = document.getElementById('statsTitle');
    
    modeButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            currentMode = btn.dataset.mode;
            modeButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            if (currentMode === 'book') {
                bookControls.style.display = 'grid';
                singleControls.style.display = 'none';
                bookInfo.style.display = 'block';
                singleInfo.style.display = 'none';
                titleLabel.textContent = 'Book Title';
                generateBtn.innerHTML = '<span>🚀</span> Generate Book';
                statsTitle.textContent = 'Book Stats';
                updateStats();
            } else {
                bookControls.style.display = 'none';
                singleControls.style.display = 'grid';
                bookInfo.style.display = 'none';
                singleInfo.style.display = 'block';
                titleLabel.textContent = 'Puzzle Title';
                generateBtn.innerHTML = '<span>🎯</span> Generate Puzzle';
                statsTitle.textContent = 'Puzzle Stats';
                updateStats();
            }
        });
    });
    
    // Table Selector (Microsoft Word style)
    let selectedGridSize = 15;
    const tableSelector = document.getElementById('tableSelector');
    const gridSizeLabel = document.getElementById('gridSizeLabel');
    const MAX_SIZE = 30;
    
    // Create grid cells
    function createTableSelector() {
        tableSelector.innerHTML = '';
        for (let i = 0; i < MAX_SIZE * MAX_SIZE; i++) {
            const cell = document.createElement('div');
            cell.className = 'table-selector-cell';
            cell.dataset.index = i;
            tableSelector.appendChild(cell);
        }
        
        // Mark selected cells
        highlightSelectedSize(selectedGridSize);
    }
    
    function highlightSelectedSize(size) {
        const cells = tableSelector.querySelectorAll('.table-selector-cell');
        cells.forEach(cell => {
            cell.classList.remove('highlighted', 'selected');
        });
        
        for (let row = 0; row < size; row++) {
            for (let col = 0; col < size; col++) {
                const index = row * MAX_SIZE + col;
                if (cells[index]) {
                    cells[index].classList.add('selected');
                }
            }
        }
    }
    
    function highlightHoverSize(row, col) {
        const cells = tableSelector.querySelectorAll('.table-selector-cell');
        cells.forEach(cell => {
            cell.classList.remove('highlighted');
        });
        
        // For word search, always use square grids (use the larger dimension)
        const size = Math.max(row + 1, col + 1);
        
        // Highlight square grid from top-left
        for (let r = 0; r < size; r++) {
            for (let c = 0; c < size; c++) {
                const index = r * MAX_SIZE + c;
                if (cells[index]) {
                    cells[index].classList.add('highlighted');
                }
            }
        }
        
        gridSizeLabel.textContent = `${size} × ${size}`;
    }
    
    // Initialize table selector
    createTableSelector();
    
    // Add event listeners
    const cells = tableSelector.querySelectorAll('.table-selector-cell');
    cells.forEach((cell, index) => {
        const row = Math.floor(index / MAX_SIZE);
        const col = index % MAX_SIZE;
        
        cell.addEventListener('mouseenter', () => {
            highlightHoverSize(row, col);
        });
        
        cell.addEventListener('click', () => {
            // For word search, always use square grids
            selectedGridSize = Math.max(row + 1, col + 1);
            tableSelector.dataset.selectedSize = selectedGridSize;
            highlightSelectedSize(selectedGridSize);
            gridSizeLabel.textContent = `${selectedGridSize} × ${selectedGridSize}`;
            updateStats();
        });
    });
    
    // Reset hover on mouse leave
    tableSelector.addEventListener('mouseleave', () => {
        const cells = tableSelector.querySelectorAll('.table-selector-cell');
        cells.forEach(cell => {
            cell.classList.remove('highlighted');
        });
        gridSizeLabel.textContent = `${selectedGridSize} × ${selectedGridSize}`;
    });
    
    // Style button handlers
    const styleButtons = document.querySelectorAll('.style-btn');
    let selectedStyle = 'rectangles';
    
    styleButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            styleButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            selectedStyle = btn.dataset.style;
        });
    });
    
    // Update stats dynamically
    function updateStats() {
        if (currentMode === 'book') {
            const pages = parseInt(document.getElementById('numPages').value) || 50;
            const wordsPerPuzzle = parseInt(document.getElementById('wordsPerPuzzle').value) || 15;
            document.getElementById('statPages').textContent = pages;
            document.getElementById('statWords').textContent = pages * wordsPerPuzzle;
        } else {
            const words = parseInt(document.getElementById('singleWords').value) || 20;
            document.getElementById('statPages').textContent = '1';
            document.getElementById('statWords').textContent = words;
        }
        document.getElementById('statGrid').textContent = `${selectedGridSize}×${selectedGridSize}`;
    }
    
    // Add event listeners for stats updates
    document.getElementById('numPages')?.addEventListener('input', updateStats);
    document.getElementById('wordsPerPuzzle')?.addEventListener('input', updateStats);
    document.getElementById('singleWords')?.addEventListener('input', updateStats);
    
    // Initial stats update
    updateStats();

    // Generate word list preview
    generateWordsBtn.addEventListener('click', async () => {
        const theme = document.getElementById('theme').value.trim();
        
        if (!theme) {
            alert('Please enter a theme first');
            return;
        }

        generateWordsBtn.disabled = true;
        generateWordsBtn.innerHTML = '<span>⏳</span> Generating...';
        wordPreview.innerHTML = '<p class="placeholder">Generating words...</p>';

        try {
            const response = await fetch(`${API_BASE}/generate-words`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    theme: theme,
                    count: 30
                })
            });

            if (!response.ok) {
                throw new Error('Failed to generate words');
            }

            const data = await response.json();
            displayWords(data.words);
        } catch (error) {
            console.error('Error:', error);
            wordPreview.innerHTML = '<p class="placeholder">Error generating words. Make sure Ollama is running.</p>';
        } finally {
            generateWordsBtn.disabled = false;
            generateWordsBtn.innerHTML = '<span>🔍</span> Preview Words';
        }
    });

    function displayWords(words) {
        if (!words || words.length === 0) {
            wordPreview.innerHTML = '<p class="placeholder">No words generated. Try a different theme.</p>';
            return;
        }
        
        wordPreview.innerHTML = '';
        words.forEach(word => {
            const tag = document.createElement('span');
            tag.className = 'word-tag';
            tag.textContent = word;
            wordPreview.appendChild(tag);
        });
    }

    // Generate book or single puzzle
    generateBtn.addEventListener('click', async (e) => {
        e.preventDefault();

        const formData = {
            title: document.getElementById('title').value,
            theme: document.getElementById('theme').value,
            custom_words: parseCustomWords(document.getElementById('customWords').value),
            grid_size: selectedGridSize,
            difficulty: currentMode === 'book' 
                ? document.getElementById('difficulty').value 
                : document.getElementById('singleDifficulty').value,
            answer_style: selectedStyle
        };

        if (!formData.theme) {
            alert('Please enter a theme');
            return;
        }

        if (currentMode === 'book') {
            formData.words_per_puzzle = parseInt(document.getElementById('wordsPerPuzzle').value);
            formData.num_pages = parseInt(document.getElementById('numPages').value);
        } else {
            formData.words_per_puzzle = parseInt(document.getElementById('singleWords').value);
            formData.num_pages = 1;
        }

        generateBtn.disabled = true;
        generateBtn.innerHTML = '<span>⏳</span> Generating...';
        loading.classList.remove('hidden');

        try {
            const endpoint = currentMode === 'book' ? 'generate-book' : 'generate-puzzle';
            const response = await fetch(`${API_BASE}/${endpoint}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData)
            });

            if (!response.ok) {
                throw new Error('Failed to generate');
            }

            // Download the PDF
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            const filename = currentMode === 'book' 
                ? `${formData.title.replace(/\s+/g, '_')}.pdf`
                : `${formData.title.replace(/\s+/g, '_')}_Puzzle.pdf`;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);

            alert(`${currentMode === 'book' ? 'Book' : 'Puzzle'} generated successfully! Check your downloads folder.`);
        } catch (error) {
            console.error('Error:', error);
            alert(`Error generating ${currentMode === 'book' ? 'book' : 'puzzle'}. Make sure the server is running and Ollama is available.`);
        } finally {
            generateBtn.disabled = false;
            generateBtn.innerHTML = currentMode === 'book' 
                ? '<span>🚀</span> Generate Book'
                : '<span>🎯</span> Generate Puzzle';
            loading.classList.add('hidden');
        }
    });

    function parseCustomWords(text) {
        if (!text.trim()) return [];
        
        // Split by commas or newlines, trim, and filter empty
        return text
            .split(/[,\n]/)
            .map(word => word.trim().toUpperCase())
            .filter(word => word.length > 0);
    }
});
