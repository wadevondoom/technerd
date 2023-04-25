# The above code defines several FlaskForm classes for different purposes such as creating a
# chronicle, artwork, quote, category, comment, profile, and managing images.
from flask_wtf import FlaskForm
from wtforms import (
    StringField,
    TextAreaField,
    FileField,
    SelectField,
    SubmitField,
    HiddenField,
    BooleanField,
    widgets,
    SelectMultipleField,
)
from wtforms.validators import DataRequired, Length
from flask_wtf.file import FileAllowed
from flask_login import current_user
from wtforms.validators import DataRequired, Length


# The class `ChronicleForm` defines a form with fields for title, author, prompt, content, category,
# image, and buttons for generating and saving content and images.
class ChronicleForm(FlaskForm):
    title = StringField("Title", validators=[DataRequired()])
    author = StringField("Author", validators=[DataRequired()])
    prompt = StringField("Prompt", validators=[Length(max=200)])
    content = TextAreaField("Content", validators=[DataRequired()])
    category_name = SelectField("Category", choices=[], coerce=str)
    image = FileField(
        "Image",
        validators=[
            FileAllowed(["jpg", "jpeg", "png"], "(JPG, JPEG, PNG) Images only!")
        ],
    )
    dalle_image_url = HiddenField()
    generate_content = SubmitField("Generate Content")
    generate_image = SubmitField("Generate Image")
    save_content = SubmitField("Save Content")


# This is a Flask form class for creating artwork with fields for title, category, image, text, and a
# submit button.
class ArtworkForm(FlaskForm):
    title = StringField("Title", validators=[DataRequired()])
    category_name = SelectField("Category", choices=[], coerce=str)
    image = FileField(
        "Image",
        validators=[
            FileAllowed(["jpg", "jpeg", "png"], "(JPG, JPEG, PNG) Images only!")
        ],
    )
    text = TextAreaField("Text", validators=[DataRequired()])
    submit = SubmitField("Save Artwork")


# The `QuoteForm` class is a Flask form that includes fields for a quote, author, source, and a submit
# button.
class QuoteForm(FlaskForm):
    quote = StringField("quote", validators=[DataRequired()])
    author = StringField("author", validators=[DataRequired()])
    source = StringField("source")
    qotd = StringField("qotd_url")
    submit = SubmitField("Save Quote")


# This is a Flask form class for creating a category with fields for name, description, image, and a
# submit button.
class CreateCategoryForm(FlaskForm):
    name = StringField("name", validators=[DataRequired()])
    desc = TextAreaField("desc")
    image = FileField(
        "Image",
        validators=[
            FileAllowed(["jpg", "jpeg", "png"], "(JPG, JPEG, PNG) Images only!")
        ],
    )
    submit = SubmitField("Save Category")


# The CommentForm class is a Flask form with fields for content ID, content type, avatar, author name,
# comment text, and a submit button.
class CommentForm(FlaskForm):
    content_id = HiddenField("Content ID", validators=[DataRequired()])
    content_type = HiddenField("Content Type", validators=[DataRequired()])
    avatar = HiddenField("Avatar", validators=[DataRequired()])
    author = StringField("Name", validators=[DataRequired(), Length(min=1, max=100)])
    text = TextAreaField("Comment", validators=[DataRequired(), Length(min=1, max=500)])
    submit = SubmitField("Submit")


# The class `ProfileForm` defines a form with fields for a user's nickname, activity status, special
# status, newsletter subscription, and a submit button.
class ProfileForm(FlaskForm):
    nickname = StringField("Nickname", validators=[DataRequired()])
    isActive = BooleanField("Active")
    isSpecial = BooleanField("Special")
    newsletter = BooleanField("Subscribe to Newsletter")
    submit = SubmitField("Update Profile")

# The class `ManageImagesForm` defines a form with a `SelectMultipleField` for deleting images and a
# `SubmitField` for submitting the form.
class ManageImagesForm(FlaskForm):
    delete_images = SelectMultipleField(
        "Delete Images", choices=[], option_widget=widgets.CheckboxInput()
    )
    submit = SubmitField("Delete Selected Images")
