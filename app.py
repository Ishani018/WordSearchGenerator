from flask import Flask, request, jsonify, send_file, send_from_directory
from flask_cors import CORS
import os
from dotenv import load_dotenv
from word_search_generator import WordSearchGenerator
from pdf_exporter import PDFExporter
import tempfile
import zipfile
import io

# Load .env file (ignore parsing errors - it's optional)
try:
    load_dotenv()
except Exception as e:
    # Silently ignore .env parsing errors - it's optional
    pass

app = Flask(__name__, static_folder='static')
CORS(app)

# Check if .env file exists (optional - only needed for custom Ollama settings)
import os
if os.path.exists('.env'):
    print("✓ Found .env file")
else:
    print("ℹ No .env file found (optional - only needed for custom OLLAMA_BASE_URL or OLLAMA_MODEL)")

# Initialize generator (will print API status)
print("\n" + "="*50)
print("Initializing Word Search Generator...")
print("="*50)
generator = WordSearchGenerator()
print("="*50 + "\n")

exporter = PDFExporter()

@app.route('/api/generate-words', methods=['POST'])
def generate_words():
    """Generate word list from theme using AI"""
    data = request.json
    theme = data.get('theme', '')
    count = data.get('count', 20)
    
    words = generator.generate_words_from_theme(theme, count)
    return jsonify({'words': words})

@app.route('/api/generate-book', methods=['POST'])
def generate_book():
    """Generate complete word search book"""
    data = request.json
    
    config = {
        'title': data.get('title', 'Word Search Puzzle Book'),
        'theme': data.get('theme', ''),
        'custom_words': data.get('custom_words', []),
        'grid_size': data.get('grid_size', 15),
        'words_per_puzzle': data.get('words_per_puzzle', 15),
        'num_pages': data.get('num_pages', 50),
        'difficulty': data.get('difficulty', 'medium'),
        'answer_style': data.get('answer_style', 'rectangles')
    }
    
    # Generate all puzzles
    puzzles = generator.generate_book(config)
    
    # Create PDF
    pdf_buffer = exporter.create_book_pdf(puzzles, config)
    
    return send_file(
        pdf_buffer,
        mimetype='application/pdf',
        as_attachment=True,
        download_name=f"{config['title'].replace(' ', '_')}.pdf"
    )

@app.route('/api/generate-puzzle', methods=['POST'])
def generate_puzzle():
    """Generate a single word search puzzle"""
    data = request.json
    
    config = {
        'title': data.get('title', 'Word Search Puzzle'),
        'theme': data.get('theme', ''),
        'custom_words': data.get('custom_words', []),
        'grid_size': data.get('grid_size', 15),
        'words_per_puzzle': data.get('words_per_puzzle', 20),
        'num_pages': 1,
        'difficulty': data.get('difficulty', 'medium'),
        'answer_style': data.get('answer_style', 'rectangles')
    }
    
    # Generate single puzzle
    puzzles = generator.generate_book(config)
    
    # Create PDF
    pdf_buffer = exporter.create_book_pdf(puzzles, config)
    
    return send_file(
        pdf_buffer,
        mimetype='application/pdf',
        as_attachment=True,
        download_name=f"{config['title'].replace(' ', '_')}_Puzzle.pdf"
    )

@app.route('/api/health', methods=['GET'])
def health():
    return jsonify({'status': 'ok'})

@app.route('/api/check-api', methods=['GET'])
def check_api():
    """Check if Ollama is configured and available"""
    import os
    
    status = {
        'ollama_available': generator.ollama_available,
        'ollama_base_url': generator.ollama_base_url,
        'ollama_model': generator.ollama_model,
        'using_fallback': not generator.ollama_available
    }
    return jsonify(status)

@app.route('/')
def index():
    return send_from_directory('static', 'index.html')

@app.route('/style.css')
def style():
    return send_from_directory('static', 'style.css')

@app.route('/script.js')
def script():
    return send_from_directory('static', 'script.js')

if __name__ == '__main__':
    app.run(debug=True, port=5000)

