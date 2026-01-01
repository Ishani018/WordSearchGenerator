from reportlab.lib.pagesizes import letter, A4
from reportlab.lib.units import inch
from reportlab.lib import colors
from reportlab.pdfgen import canvas
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import Paragraph, Spacer, PageBreak
from reportlab.lib.enums import TA_CENTER
from typing import List, Dict
import io

class PDFExporter:
    def __init__(self):
        self.page_width, self.page_height = letter
        self.margin = 0.75 * inch
        self.grid_margin = 0.5 * inch
    
    def create_book_pdf(self, puzzles: List[Dict], config: Dict) -> io.BytesIO:
        """Create a complete PDF book with puzzles and answer keys"""
        buffer = io.BytesIO()
        c = canvas.Canvas(buffer, pagesize=letter)
        
        title = config.get('title', 'Word Search Puzzle Book')
        answer_style = config.get('answer_style', 'rectangles')
        
        # Generate puzzle pages and answer key pages
        for i, puzzle in enumerate(puzzles):
            # Puzzle page
            self._draw_puzzle_page(c, puzzle, title)
            c.showPage()
            
            # Answer key page
            self._draw_answer_key_page(c, puzzle, title, answer_style)
            c.showPage()
        
        c.save()
        buffer.seek(0)
        return buffer
    
    def _draw_puzzle_page(self, c: canvas.Canvas, puzzle: Dict, title: str):
        """Draw a puzzle page"""
        # Title area (top section)
        title_height = 1.3 * inch
        c.setFont("Helvetica-Bold", 20)
        c.drawCentredString(self.page_width / 2, self.page_height - 0.6 * inch, title)
        
        # Page number
        c.setFont("Helvetica", 10)
        page_text = f"Page {puzzle['page_number']}"
        c.drawCentredString(self.page_width / 2, self.page_height - 0.85 * inch, page_text)
        
        # Instructions area (bottom section)
        instructions_height = 0.8 * inch
        c.setFont("Helvetica", 9)
        instructions = "Find the words listed below in the grid above. Words may be horizontal, vertical, or diagonal."
        # Wrap instructions if needed
        instructions_y = 0.4 * inch
        c.drawString(self.margin, instructions_y, instructions)
        
        # Calculate available space for grid and word list
        available_height = self.page_height - title_height - instructions_height
        words = puzzle['words']
        
        # Estimate word list height (3 columns, 0.22 inch per word)
        words_per_column = (len(words) + 2) // 3
        word_list_height = max(words_per_column * 0.22 * inch, 1.0 * inch)
        
        # Calculate grid size and position
        grid = puzzle['grid']
        grid_size = puzzle['grid_size']
        grid_available_height = available_height - word_list_height - 0.3 * inch  # 0.3 inch spacing
        
        cell_size = min(
            (self.page_width - 2 * self.margin) / grid_size,
            grid_available_height / grid_size
        )
        
        start_x = (self.page_width - grid_size * cell_size) / 2
        grid_bottom = instructions_height + word_list_height + 0.3 * inch
        start_y = grid_bottom + grid_size * cell_size
        
        # Draw grid cells
        for i in range(grid_size):
            for j in range(grid_size):
                x = start_x + j * cell_size
                y = start_y - (i + 1) * cell_size
                
                # Draw cell border
                c.rect(x, y, cell_size, cell_size)
                
                # Draw letter
                letter = grid[i][j]
                font_size = max(int(cell_size * 0.35), 8)
                c.setFont("Helvetica", font_size)
                text_width = c.stringWidth(letter, "Helvetica", font_size)
                c.drawString(
                    x + (cell_size - text_width) / 2,
                    y + cell_size * 0.3,
                    letter
                )
        
        # Draw word list (positioned between grid and instructions)
        word_list_y = instructions_height + word_list_height - 0.1 * inch
        c.setFont("Helvetica", 11)
        
        # Word list in columns with better spacing
        words_per_column = (len(words) + 2) // 3
        column_width = (self.page_width - 2 * self.margin) / 3
        line_spacing = 0.22 * inch
        
        for col in range(3):
            x_pos = self.margin + col * column_width
            for i in range(words_per_column):
                idx = col * words_per_column + i
                if idx < len(words):
                    c.drawString(x_pos, word_list_y - i * line_spacing, words[idx])
    
    def _draw_answer_key_page(self, c: canvas.Canvas, puzzle: Dict, title: str, style: str):
        """Draw an answer key page with specified style"""
        # Title area (top section)
        title_height = 1.3 * inch
        c.setFont("Helvetica-Bold", 20)
        c.drawCentredString(self.page_width / 2, self.page_height - 0.6 * inch, f"{title} - Answer Key")
        
        # Page number
        c.setFont("Helvetica", 10)
        page_text = f"Page {puzzle['page_number']} - Answers"
        c.drawCentredString(self.page_width / 2, self.page_height - 0.85 * inch, page_text)
        
        # Instructions area (bottom section)
        instructions_height = 0.8 * inch
        c.setFont("Helvetica", 9)
        instructions = "Answer Key: Words are marked in the grid above."
        instructions_y = 0.4 * inch
        c.drawString(self.margin, instructions_y, instructions)
        
        # Calculate available space for grid and word list
        available_height = self.page_height - title_height - instructions_height
        words = puzzle['words']
        
        # Estimate word list height (3 columns, 0.22 inch per word)
        words_per_column = (len(words) + 2) // 3
        word_list_height = max(words_per_column * 0.22 * inch, 1.0 * inch)
        
        # Calculate grid size and position
        grid = puzzle['grid']
        grid_size = puzzle['grid_size']
        word_positions = puzzle['word_positions']
        grid_available_height = available_height - word_list_height - 0.3 * inch  # 0.3 inch spacing
        
        cell_size = min(
            (self.page_width - 2 * self.margin) / grid_size,
            grid_available_height / grid_size
        )
        
        start_x = (self.page_width - grid_size * cell_size) / 2
        grid_bottom = instructions_height + word_list_height + 0.3 * inch
        start_y = grid_bottom + grid_size * cell_size
        
        # Draw grid cells
        for i in range(grid_size):
            for j in range(grid_size):
                x = start_x + j * cell_size
                y = start_y - (i + 1) * cell_size
                
                # Draw cell border
                c.rect(x, y, cell_size, cell_size)
                
                # Draw letter
                letter = grid[i][j]
                font_size = max(int(cell_size * 0.35), 8)
                c.setFont("Helvetica", font_size)
                text_width = c.stringWidth(letter, "Helvetica", font_size)
                c.drawString(
                    x + (cell_size - text_width) / 2,
                    y + cell_size * 0.3,
                    letter
                )
        
        # Draw answer markings based on style (adjust coordinates for new layout)
        if style == 'rectangles':
            self._draw_rectangles(c, word_positions, start_x, start_y, cell_size, grid_size)
        elif style == 'lines':
            self._draw_lines(c, word_positions, start_x, start_y, cell_size, grid_size)
        elif style == 'highlighting':
            self._draw_highlighting(c, word_positions, start_x, start_y, cell_size, grid_size)
        
        # Word list (positioned between grid and instructions)
        word_list_y = instructions_height + word_list_height - 0.1 * inch
        c.setFont("Helvetica", 11)
        
        words_per_column = (len(words) + 2) // 3
        column_width = (self.page_width - 2 * self.margin) / 3
        line_spacing = 0.22 * inch
        
        for col in range(3):
            x_pos = self.margin + col * column_width
            for i in range(words_per_column):
                idx = col * words_per_column + i
                if idx < len(words):
                    c.drawString(x_pos, word_list_y - i * line_spacing, words[idx])
    
    def _draw_rectangles(self, c: canvas.Canvas, word_positions: Dict, start_x: float, 
                        start_y: float, cell_size: float, grid_size: int):
        """Draw rectangles around found words"""
        c.setStrokeColor(colors.red)
        c.setLineWidth(2)
        
        for word, positions in word_positions.items():
            if len(positions) < 2:
                continue
            
            # Find bounding box
            min_row = min(p[0] for p in positions)
            max_row = max(p[0] for p in positions)
            min_col = min(p[1] for p in positions)
            max_col = max(p[1] for p in positions)
            
            x = start_x + min_col * cell_size
            # Adjust y coordinate for new layout (grid grows downward from start_y)
            y = start_y - (max_row + 1) * cell_size
            width = (max_col - min_col + 1) * cell_size
            height = (max_row - min_row + 1) * cell_size
            
            c.rect(x, y, width, height)
    
    def _draw_lines(self, c: canvas.Canvas, word_positions: Dict, start_x: float,
                   start_y: float, cell_size: float, grid_size: int):
        """Draw lines through found words"""
        c.setStrokeColor(colors.red)
        c.setLineWidth(3)
        
        for word, positions in word_positions.items():
            if len(positions) < 2:
                continue
            
            # Draw line through all positions
            for i in range(len(positions) - 1):
                r1, c1 = positions[i]
                r2, c2 = positions[i + 1]
                
                x1 = start_x + c1 * cell_size + cell_size / 2
                # Adjust y coordinate for new layout (grid grows downward from start_y)
                y1 = start_y - (r1 + 0.5) * cell_size
                x2 = start_x + c2 * cell_size + cell_size / 2
                y2 = start_y - (r2 + 0.5) * cell_size
                
                c.line(x1, y1, x2, y2)
    
    def _draw_highlighting(self, c: canvas.Canvas, word_positions: Dict, start_x: float,
                          start_y: float, cell_size: float, grid_size: int):
        """Draw highlighting over found words"""
        c.setFillColor(colors.yellow)
        c.setStrokeColor(colors.yellow)
        c.setFillAlpha(0.3)
        
        for word, positions in word_positions.items():
            for r, c_pos in positions:
                x = start_x + c_pos * cell_size
                # Adjust y coordinate for new layout (grid grows downward from start_y)
                y = start_y - (r + 1) * cell_size
                c.rect(x, y, cell_size, cell_size, fill=1, stroke=0)

