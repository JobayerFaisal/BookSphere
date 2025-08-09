from flask_wtf import FlaskForm
from wtforms import StringField, PasswordField, SubmitField, TextAreaField, IntegerField, SelectField
from wtforms.validators import DataRequired, Length, Email, EqualTo, URL, Optional, NumberRange

class RegisterForm(FlaskForm):
    """Form for user registration."""
    username = StringField('Username', validators=[DataRequired(), Length(min=3, max=80)])
    email = StringField('Email', validators=[DataRequired(), Email()])
    password = PasswordField('Password', validators=[DataRequired(), Length(min=6)])
    confirm = PasswordField('Confirm Password', validators=[DataRequired(), EqualTo('password')])
    submit = SubmitField('Create account')

class LoginForm(FlaskForm):
    """Form for user login."""
    email = StringField('Email', validators=[DataRequired(), Email()])
    password = PasswordField('Password', validators=[DataRequired()])
    submit = SubmitField('Sign in')

class BookForm(FlaskForm):
    """Form for adding a new book."""
    title = StringField('Title', validators=[DataRequired(), Length(max=200)])
    author = StringField('Author', validators=[DataRequired(), Length(max=200)])
    year = IntegerField('Year', validators=[Optional(), NumberRange(min=0, max=2100)])
    isbn = StringField('ISBN', validators=[Optional(), Length(max=32)])
    cover_url = StringField('Cover Image URL', validators=[Optional(), URL(require_tld=False)])
    description = TextAreaField('Description', validators=[Optional(), Length(max=5000)])
    submit = SubmitField('Save')

class ReviewForm(FlaskForm):
    """Form for submitting a book review."""
    rating = SelectField('Rating', coerce=int, choices=[(i, str(i)) for i in range(1, 6)], validators=[DataRequired()])
    text = TextAreaField('Your review', validators=[Optional(), Length(max=5000)])
    submit = SubmitField('Submit review')

class ShelfForm(FlaskForm):
    """Form for adding a book to a shelf (Want to Read, Reading, Read)."""
    status = SelectField('Shelf', choices=[('want', 'Want to Read'), ('reading', 'Reading'), ('read', 'Read')], validators=[DataRequired()])
    submit = SubmitField('Update shelf')
