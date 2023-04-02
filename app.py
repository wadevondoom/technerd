import datetime
from os import environ as env
from urllib.parse import quote_plus, urlencode
from bson import ObjectId
from authlib.integrations.flask_client import OAuth
from dotenv import find_dotenv, load_dotenv
from flask import Flask, redirect, render_template, session, url_for, flash, request
from flask_login import (
    LoginManager,
    login_user,
    logout_user,
    login_required,
    current_user,
    UserMixin,
)

from user import User
from artwork import Artwork
from category import Category
from chronicle import Chronicle
from quote import Quote
from brain import Brain
from forms import ChronicleForm, CreateCategoryForm, ArtworkForm
from helpers import save_image, db


app = Flask(__name__)

app.secret_key = "YOUR_SECRET_KEY"  # Replace with a secret key of your choice
oauth = OAuth(app)

ENV_FILE = find_dotenv()
if ENV_FILE:
    load_dotenv(ENV_FILE)

auth0 = oauth.register(
    "auth0",
    client_id=env.get("AUTH0_CLIENT_ID"),
    client_secret=env.get("AUTH0_CLIENT_SECRET"),
    api_base_url=f'https://{env.get("AUTH0_DOMAIN")}',
    access_token_url=f'https://{env.get("AUTH0_DOMAIN")}/oauth/token',
    authorize_url=f'https://{env.get("AUTH0_DOMAIN")}/authorize',
    jwks_uri=f'https://{env.get("AUTH0_DOMAIN")}/.well-known/jwks.json',
    client_kwargs={"scope": "openid profile email"},
)


""" Login Loader for oauth"""
login_manager = LoginManager()
login_manager.init_app(app)


@login_manager.user_loader
def load_user(user_id):
    if "user" in session:
        user_info = session["user"]
        return User(user_id, user_info.get("name"), user_info.get("email"))
    return None


"""User accessible endpoints"""


"""Home page"""


@app.route("/")
def home():
    chronicles = Chronicle.get_home_chronicles()
    artwork = Artwork.get_related_artwork()
    quote = Quote.get_random()
    print(quote)
    return render_template(
        "home.html", chronicles=chronicles, artwork=artwork, quote=quote
    )


"""Chronicles"""


@app.route("/chronicles")
def chronicles():
    chronicles = Chronicle.get_all()
    return render_template(
        "chronicles.html", chronicles=chronicles, current_user=current_user
    )


@app.route("/artwork")
def artwork():
    artwork = Artwork.get_all()
    return render_template("artwork.html", current_user=current_user, artwork=artwork)


@app.route("/detail/<string:chronicle_id>")
def detail(chronicle_id):
    chronicle = Chronicle.get_by_id(ObjectId(chronicle_id))
    related_chrons = Chronicle.get_related_chronicles(3)
    if chronicle is None:
        flash("Could not find article.")
        redirect(url_for("home"))
    return render_template(
        "detail.html", chronicle=chronicle, related_chrons=related_chrons
    )


@app.route("/art_detail/<string:artwork_id>")
def art_detail(artwork_id):
    artwork = Artwork.get_by_id(ObjectId(artwork_id))
    related_art = Artwork.get_related_artwork(3)
    if artwork is None:
        flash("Could not find artwork.")
        redirect(url_for("artwork"))
    return render_template("art_detail.html", artwork=artwork, related_art=related_art)


"""Admin routes"""


@app.route("/admin", methods=["GET", "POST"])
@login_required
def admin():
    chronicles = Chronicle.get_all()
    artwork = Artwork.get_all()
    categories = Category.get_all()

    print(chronicles)

    return render_template(
        "admin.html",
        chronicles=chronicles,
        artwork=artwork,
        categories=categories,
    )


@app.route("/admin/artwork/create", methods=["GET", "POST"])
@login_required
def create_artwork():
    form = ArtworkForm()
    categories = Category.get_all()
    form.category_name.choices = [
        (str(category["_id"]), category["name"]) for category in categories
    ]

    # Handle GET request for page with textfield and button
    if request.method == "GET":
        return render_template("create_artwork.html", form=form)

    # Handle form validation and saving chronicle to database
    if form.validate_on_submit():
        title = form.title.data
        text = form.text.data
        category_id = ObjectId(form.category.data)
        category_name = Category.get_by_id(category_id)["name"]
        image = save_image(form.image.data)
        artwork = Artwork(title, category_name, image)
        artwork.save()
        flash("Artwork created successfully!", "success")
        return redirect(url_for("admin"))

    return render_template("create_chronicle.html", form=form, title="Create Artwork")


@app.route("/admin/chronicles/create", methods=["GET", "POST"])
@login_required
def create_chronicle():
    form = ChronicleForm()
    categories = Category.get_all()
    form.category_name.choices = [
        (str(category["_id"]), category["name"]) for category in categories
    ]

    # Handle GET request for page with textfield and button
    if request.method == "GET":
        return render_template("generate_text.html", form=form)

    # Handle POST request to generate response and populate content field
    if request.method == "POST":
        prompt = request.form.get("prompt")
        brain = Brain(role="user", prompt=prompt)
        response = brain.get_response()
        form.content.data = response
        return render_template(
            "create_chronicle.html", form=form, title="Create Chronicle"
        )

    # Handle form validation and saving chronicle to database
    if form.validate_on_submit():
        title = form.title.data
        author = form.author.data
        content = form.content.data
        category_id = ObjectId(form.category.data)
        category_name = Category.get_by_id(category_id)["name"]
        image = save_image(form.image.data)
        chronicle = Chronicle(title, author, content, category_name, image)
        chronicle.save()
        flash("Chronicle created successfully!", "success")
        return redirect(url_for("admin"))

    return render_template("create_chronicle.html", form=form, title="Create Chronicle")


@app.route("/admin/chronicles/create/save", methods=["POST"])
@login_required
def save_chronicle():
    form = ChronicleForm()
    categories = Category.get_all()
    form.category_name.choices = [
        (str(category["_id"]), category["name"]) for category in categories
    ]

    if form.validate_on_submit():
        title = form.title.data
        author = form.author.data
        content = form.content.data
        category_id = ObjectId(form.category_name.data)
        category_name = Category.get_by_id(category_id)["name"]
        image = save_image(form.image.data)
        chronicle = Chronicle(title, author, content, category_name, image)
        chronicle.save()
        flash("Chronicle created successfully!", "success")
        return redirect(url_for("admin"))

    return render_template("create_chronicle.html", form=form, title="Create Chronicle")


@app.route("/admin/artwork/create/save", methods=["POST"])
@login_required
def save_artwork():
    form = ArtworkForm()
    categories = Category.get_all()
    form.category_name.choices = [
        (str(category["_id"]), category["name"]) for category in categories
    ]

    if form.validate_on_submit():
        title = form.title.data
        category_id = ObjectId(form.category_name.data)
        category_name = Category.get_by_id(category_id)["name"]
        image = save_image(form.image.data)
        text = form.text.data
        artwork = Artwork(
            title,
            # category_id,
            category_name,
            image,
            text,
        )
        print(artwork)
        artwork.save()
        flash("Artwork created successfully!", "success")
        return redirect(url_for("admin"))

    return render_template("create_artwork.html", form=form, title="Create Artwork")



@app.route("/edit_chronicle/<id>", methods=["GET", "POST"])
@login_required
def edit_chronicle(id):
    chronicle = Chronicle.get_by_id(id)

    if request.method == "POST":
        # update the chronicle record in the database
        chronicle["title"] = request.form["title"]
        chronicle["author"] = request.form["author"]
        chronicle["content"] = request.form["content"]
        chronicle["category_name"] = request.form["category_name"]
        chronicle["date_posted"] = request.form["date_posted"]
        db["chronicles"].update_one({"_id": ObjectId(id)}, {"$set": chronicle})
        flash("Successfull saved record for : " + chronicle["title"])
        return redirect(url_for("admin"))

    # render the edit form with the current chronicle record data
    return render_template("edit_chronicle.html", chronicle=chronicle)


@app.route("/delete_chronicle/<string:chronicle_id>", methods=["POST"])
@login_required
def delete_chronicle(chronicle_id):
    # Get the chronicle by its ID
    chronicle = Chronicle.get_by_id(chronicle_id)
    if not chronicle:
        # If the chronicle doesn't exist, redirect to the admin page
        flash("Sorry, could not find the article.")
        return redirect(url_for("admin"))

    # Delete the chronicle
    Chronicle.delete(chronicle)

    # Flash success message and redirect to admin page
    flash("Chronicle deleted successfully!", "success")
    return redirect(url_for("admin"))


"""End Chronicle functions"""


@app.route("/admin/categories/create", methods=["GET", "POST"])
@login_required
def create_category():
    form = CreateCategoryForm()
    if form.validate_on_submit():
        name = form.name.data
        desc = form.desc.data
        img = save_image(form.image.data)
        category = Category(name, desc, img)
        category.save()
        flash("Category created successfully!", "success")
        return redirect(url_for("admin"))
    return render_template("create_category.html", form=form, title="Create Category")


@app.route("/delete_category/<string:category_id>", methods=["POST"])
@login_required
def delete_category(category_id):
    # Get the category by its ID
    category = Category.get_by_id(category_id)
    if not category:
        # If the chronicle doesn't exist, redirect to the admin page
        flash("Sorry, could not find the category.")
        return redirect(url_for("admin"))

    # Delete the chronicle
    Category.delete(category)

    # Flash success message and redirect to admin page
    flash("Category deleted successfully!", "success")
    return redirect(url_for("admin"))

"""End admin routes"""


"""Auth routes"""


@app.route("/login")
def login():
    return auth0.authorize_redirect(
        redirect_uri=f'https://{env.get("MY_DOMAIN")}/callback'
    )


@app.route("/callback")
def callback_handling():
    auth0.authorize_access_token()
    resp = auth0.get("userinfo")
    userinfo = resp.json()

    user = User(userinfo["sub"], userinfo.get("name"), userinfo.get("email"))
    login_user(user)

    session["user"] = userinfo  # Store the userinfo in the session

    return redirect("/")  # Redirect to your desired page after login


@app.route("/logout")
@login_required
def logout():
    logout_user()
    params = {
        "returnTo": f'https://{env.get("MY_DOMAIN")}',
        "client_id": env.get("AUTH0_CLIENT_ID"),
    }
    return redirect(f'https://{env.get("AUTH0_DOMAIN")}/v2/logout?' + urlencode(params))


@app.route("/dashboard")
@login_required
def dashboard():
    return "Welcome to the dashboard!"


@app.route("/profile")
@login_required
def profile():
    return f"Welcome, {current_user.name}!"


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=env.get("PORT", 5000))
