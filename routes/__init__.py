from flask import Blueprint

auth_bp = Blueprint('auth', __name__, url_prefix='/auth')
books_bp = Blueprint('books', __name__, url_prefix='/books')

from . import auth, books
