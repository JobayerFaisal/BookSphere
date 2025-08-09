from flask import Blueprint, render_template, request, redirect, url_for, flash
from flask_login import login_required, current_user
from models import db, Book, Review, ShelfEntry
from forms import BookForm, ReviewForm, ShelfForm
from werkzeug.exceptions import abort




# Create the Blueprint for 'books'
books_bp = Blueprint('books', __name__)

# Route to display all books
@books_bp.route('/', methods=['GET'])
def books_list():
    q = request.args.get('q', '').strip()  # Search query
    query = Book.query
    if q:
        # Filter books based on search query (by title or author)
        like = f"%{q}%"
        query = query.filter(db.or_(Book.title.ilike(like), Book.author.ilike(like)))
    books = query.order_by(Book.title.asc()).all()  # Retrieve books, ordered by title
    return render_template('books_list.html', books=books, q=q)

# Route to add a new book (only available to logged-in users)
@books_bp.route('/add', methods=['GET', 'POST'])
@login_required
def add_book():
    form = BookForm()
    if form.validate_on_submit():
        book = Book(
            title=form.title.data,
            author=form.author.data,
            year=form.year.data,
            isbn=form.isbn.data,
            cover_url=form.cover_url.data,
            description=form.description.data,
        )
        db.session.add(book)
        db.session.commit()
        flash('Book added!', 'success')
        return redirect(url_for('books.book_detail', book_id=book.id))
    return render_template('add_book.html', form=form)

# Route to view a book's details
@books_bp.route('/<int:book_id>', methods=['GET', 'POST'])
def book_detail(book_id):
    book = db.session.get(Book, book_id) or abort(404)
    
    # Handle review form submission
    review_form = None
    if current_user.is_authenticated:
        review_form = ReviewForm()
        existing_review = Review.query.filter_by(user_id=current_user.id, book_id=book.id).first()
        if request.method == 'GET' and existing_review:
            review_form.rating.data = existing_review.rating
            review_form.text.data = existing_review.text
        
        if review_form.validate_on_submit() and request.form.get('form_name') == 'review':
            if existing_review:
                existing_review.rating = review_form.rating.data
                existing_review.text = review_form.text.data
                flash('Review updated.', 'success')
            else:
                new_review = Review(user_id=current_user.id, book_id=book.id,
                                    rating=review_form.rating.data, text=review_form.text.data)
                db.session.add(new_review)
                flash('Review added.', 'success')
            db.session.commit()
            return redirect(url_for('books.book_detail', book_id=book.id))
    
    # Handle shelf form submission (e.g., "Want to Read", "Reading", "Read")
    shelf_form = ShelfForm()
    if current_user.is_authenticated:
        existing_shelf = ShelfEntry.query.filter_by(user_id=current_user.id, book_id=book.id).first()
        if request.method == 'GET' and existing_shelf:
            shelf_form.status.data = existing_shelf.status
        if shelf_form.validate_on_submit() and request.form.get('form_name') == 'shelf':
            if existing_shelf:
                existing_shelf.status = shelf_form.status.data
            else:
                db.session.add(ShelfEntry(user_id=current_user.id, book_id=book.id, status=shelf_form.status.data))
            db.session.commit()
            flash('Shelf updated.', 'success')
            return redirect(url_for('books.book_detail', book_id=book.id))

    reviews = Review.query.filter_by(book_id=book.id).order_by(Review.created_at.desc()).all()
    user_review = None
    if current_user.is_authenticated:
        user_review = Review.query.filter_by(user_id=current_user.id, book_id=book.id).first()
    
    return render_template('book_detail.html', book=book, reviews=reviews,
                           review_form=review_form, shelf_form=shelf_form, user_review=user_review)

# Route to delete a review (only by the user who wrote it)
@books_bp.route('/reviews/<int:review_id>/delete', methods=['POST'])
@login_required
def delete_review(review_id):
    review = db.session.get(Review, review_id) or abort(404)
    if review.user_id != current_user.id:
        abort(403)  # If the review doesn't belong to the current user, raise a 403 Forbidden error
    book_id = review.book_id
    db.session.delete(review)
    db.session.commit()
    flash('Review deleted.', 'info')
    return redirect(url_for('books.book_detail', book_id=book_id))