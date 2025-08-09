import os

class Config:
    SECRET_KEY = os.getenv('SECRET_KEY', 'dev-secret-change-me')
    SQLALCHEMY_DATABASE_URI = os.getenv('DATABASE_URL', 'sqlite:///goodreads_clone.db')
    SQLALCHEMY_TRACK_MODIFICATIONS = False
