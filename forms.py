from flask_wtf import FlaskForm
from wtforms import StringField, TextAreaField, FileField, SelectField, SubmitField
from wtforms.validators import DataRequired
from flask_wtf.file import FileAllowed


class ChronicleForm(FlaskForm):
    title = StringField('Title', validators=[DataRequired()])
    author = StringField('Author', validators=[DataRequired()])
    prompt = StringField("Prompt")
    content = TextAreaField('Content', validators=[DataRequired()])
    category_name = SelectField('Category', choices=[], coerce=str)
    image = FileField('Image', validators=[FileAllowed(['jpg', 'jpeg'], 'Images only!')])
    submit = SubmitField("Save Content")
    
class ArtworkForm(FlaskForm):
    title = StringField('Title', validators=[DataRequired()])
    category_name = SelectField('Category', choices=[], coerce=str)
    image = FileField('Image', validators=[FileAllowed(['jpg', 'jpeg'], 'Images only!')])
    text = TextAreaField('Text', validators=[DataRequired()])
    submit = SubmitField("Save Artwork")

class QuoteForm(FlaskForm):
    quote = StringField('quote', validators=[DataRequired()])
    author = StringField('author', validators=[DataRequired()])
    source = StringField('source')
    source = StringField('qotd_url')
    image = FileField('Image', validators=[FileAllowed(['jpg', 'jpeg'], 'Images only!')])
    submit = SubmitField("Save Artwork")

class CreateCategoryForm(FlaskForm):
    name = StringField("name", validators=[DataRequired()])
    desc = TextAreaField("desc")
    image = FileField('Image', validators=[FileAllowed(['jpg', 'jpeg'], 'Images only!')])
    submit = SubmitField("Save Category")


class CommentForm(FlaskForm):
    comment_text = TextAreaField("Comment", validators=[DataRequired()])
