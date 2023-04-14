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

class ChronicleForm(FlaskForm):
    title = StringField("Title", validators=[DataRequired()])
    author = StringField("Author", validators=[DataRequired()])
    prompt = StringField("Prompt", validators=[Length(max=200)])
    content = TextAreaField("Content", validators=[DataRequired()])
    category_name = SelectField("Category", choices=[], coerce=str)
    image = FileField(
        "Image", validators=[FileAllowed(["jpg", "jpeg"], "Images only!")]
    )
    dalle_image_url = HiddenField()
    generate_content = SubmitField("Generate Content")
    generate_image = SubmitField("Generate Image")
    save_content = SubmitField("Save Content")



class ArtworkForm(FlaskForm):
    title = StringField("Title", validators=[DataRequired()])
    category_name = SelectField("Category", choices=[], coerce=str)
    image = FileField(
        "Image", validators=[FileAllowed(["jpg", "jpeg"], "Images only!")]
    )
    text = TextAreaField("Text", validators=[DataRequired()])
    submit = SubmitField("Save Artwork")


class QuoteForm(FlaskForm):
    quote = StringField("quote", validators=[DataRequired()])
    author = StringField("author", validators=[DataRequired()])
    source = StringField("source")
    qotd = StringField("qotd_url")
    submit = SubmitField("Save Quote")


class CreateCategoryForm(FlaskForm):
    name = StringField("name", validators=[DataRequired()])
    desc = TextAreaField("desc")
    image = FileField(
        "Image", validators=[FileAllowed(["jpg", "jpeg"], "Images only!")]
    )
    submit = SubmitField("Save Category")


class CommentForm(FlaskForm):
    content_id = HiddenField("Content ID", validators=[DataRequired()])
    content_type = HiddenField("Content Type", validators=[DataRequired()])
    avatar = HiddenField("Avatar", validators=[DataRequired()])
    author = StringField("Name", validators=[DataRequired(), Length(min=1, max=100)])
    text = TextAreaField("Comment", validators=[DataRequired(), Length(min=1, max=500)])
    submit = SubmitField("Submit")


class ProfileForm(FlaskForm):
    nickname = StringField("Nickname", validators=[DataRequired()])
    isActive = BooleanField("Active")
    isSpecial = BooleanField("Special")
    newsletter = BooleanField("Subscribe to Newsletter")
    submit = SubmitField("Update Profile")


class ManageImagesForm(FlaskForm):
    delete_images = SelectMultipleField("Delete Images", choices=[], option_widget=widgets.CheckboxInput())
    submit = SubmitField("Delete Selected Images")