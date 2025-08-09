import sqlite3

def init_db():
    """Initialize the database and create the books table if it doesn't exist."""
    conn = sqlite3.connect('library.db')
    c = conn.cursor()
    c.execute('''
        CREATE TABLE IF NOT EXISTS books (
            id INTEGER PRIMARY KEY,
            title TEXT,
            author TEXT,
            genre TEXT,
            year INTEGER,
            cover_image TEXT
        )
    ''')
    conn.commit()
    conn.close()

def add_book(title, author, genre, year, cover_image):
    """Add a new book to the database."""
    conn = sqlite3.connect('library.db')
    c = conn.cursor()
    c.execute('''
        INSERT INTO books (title, author, genre, year, cover_image)
        VALUES (?, ?, ?, ?, ?)
    ''', (title, author, genre, year, cover_image))
    conn.commit()
    conn.close()

def get_books():
    """Retrieve all books from the database."""
    conn = sqlite3.connect('library.db')
    c = conn.cursor()
    c.execute('SELECT * FROM books')
    books = c.fetchall()
    conn.close()
    return books

def get_book_by_id(book_id):
    """Retrieve a book by its ID."""
    conn = sqlite3.connect('library.db')
    c = conn.cursor()
    c.execute('SELECT * FROM books WHERE id = ?', (book_id,))
    book = c.fetchone()
    conn.close()
    return book

def update_book(book_id, title, author, genre, year, cover_image):
    """Update an existing book's details."""
    conn = sqlite3.connect('library.db')
    c = conn.cursor()
    c.execute('''
        UPDATE books SET title = ?, author = ?, genre = ?, year = ?, cover_image = ?
        WHERE id = ?
    ''', (title, author, genre, year, cover_image, book_id))
    conn.commit()
    conn.close()

def delete_book(book_id):
    """Delete a book from the database."""
    conn = sqlite3.connect('library.db')
    c = conn.cursor()
    c.execute('DELETE FROM books WHERE id = ?', (book_id,))
    conn.commit()
    conn.close()
