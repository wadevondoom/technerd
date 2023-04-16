import random, string, os
from os import environ as env
import boto3
from urllib.parse import quote_plus, urlencode
from bson import ObjectId
from authlib.integrations.flask_client import OAuth
from dotenv import find_dotenv, load_dotenv
from flask import (
    Flask,
    redirect,
    render_template,
    session,
    url_for,
    flash,
    request,
    jsonify,
    render_template_string,
)
from flask_wtf.csrf import CSRFProtect
from flask_login import (
    LoginManager,
    login_user,
    logout_user,
    login_required,
    current_user,
)
from flask_cors import CORS
from pymongo import DESCENDING
from user import User
from artwork import Artwork
from category import Category
from chronicle import Chronicle
from quote import Quote
from brain import Brain
from forms import (
    ChronicleForm,
    CreateCategoryForm,
    ArtworkForm,
    CommentForm,
    ProfileForm,
    QuoteForm,
    ManageImagesForm,
)
from helpers import save_image, save_dalle_image, db
from news import News
from comment import Comment
from like import Like
from user import User
from newsimport import get_top_news


app = Flask(__name__)
CORS(app)


def cloudfront_url_for(endpoint, **values):
    if endpoint == "static":
        return f"https://d2cpmpsgqfmt9q.cloudfront.net{url_for(endpoint, **values)}"
    return url_for(endpoint, **values)


app.jinja_env.globals.update(url_for=cloudfront_url_for)
app.config.update(
    {
        "SECRET_KEY": "".join(
            random.choices(
                string.ascii_uppercase + string.ascii_lowercase + string.digits, k=32
            )
        )
    }
)
csrf = CSRFProtect(app)
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
        user_db = db
        users_collection = user_db.users
        user = users_collection.find_one({"_id": user_id})
        if user:
            # Use user_info instead of user
            return User(
                user_id,
                user.get("name"),
                user.get("email"),
                user_info.get("picture"),  # Use user_info instead of user
                user.get("nickname"),
                user.get("isActive"),
                user.get("isAdmin"),
                user.get("isSpecial"),
                user.get("newsletter"),
            )
    return None


""" BCDR Function """
s3 = boto3.client(
    "s3",
    aws_access_key_id=os.environ.get("AWS_ACCESS_KEY_ID"),
    aws_secret_access_key=os.environ.get("AWS_SECRET_ACCESS_KEY"),
)

BUCKET_NAME = os.environ.get("BUCKET_NAME")
FOLDER_TO_BACKUP = "/app/static"


@app.route("/admin/bcdr")
@login_required
def bcdr():
    user_image = current_user.picture if current_user.is_authenticated else None
    return render_template("bcdr.html", user_image=user_image)


@app.route("/admin/backup", methods=["POST"])
@login_required
def backup():
    backed_up_files = []
    for root, _, files in os.walk(FOLDER_TO_BACKUP):
        for file in files:
            local_path = os.path.join(root, file)
            s3_path = os.path.relpath(local_path, FOLDER_TO_BACKUP)
            s3.upload_file(local_path, BUCKET_NAME, s3_path)
            backed_up_files.append(s3_path)
    return jsonify(
        {"message": "Backup completed successfully", "files": backed_up_files}
    )


@app.route("/admin/recovery", methods=["POST"])
@login_required
def recovery():
    recovered_files = []
    for obj in s3.list_objects_v2(Bucket=BUCKET_NAME)["Contents"]:
        s3_path = obj["Key"]
        local_path = os.path.join(FOLDER_TO_BACKUP, s3_path)

        # Skip if it's a folder
        if s3_path.endswith("/"):
            continue

        # Create directories if they don't exist
        os.makedirs(os.path.dirname(local_path), exist_ok=True)

        # Download the file
        s3.download_file(BUCKET_NAME, s3_path, local_path)
        recovered_files.append(local_path)

    # Render the list of recovered files in a HTML response
    return render_template_string(
        """
        <h1>Recovery completed successfully</h1>
        <ul>
        {% for file in files %}
            <li>{{ file }}</li>
        {% endfor %}
        </ul>
        <a href="/admin/bcdr">Back to admin</a>
    """,
        files=recovered_files,
    )


"""Home page"""


@app.route("/")
def home():
    chronicles = Chronicle.get_home_chronicles()
    artwork = Artwork.get_related_artwork()
    quote = Quote.get_random()
    news = News.get_home_news()
    print(news)
    user_image = current_user.picture if current_user.is_authenticated else None
    return render_template(
        "home.html",
        chronicles=chronicles,
        artwork=artwork,
        quote=quote,
        user_image=user_image,
        news=news,
    )


"""Chronicles"""


@app.route("/chronicles")
def chronicles():
    chronicles = Chronicle.get_all()
    user_image = current_user.picture if current_user.is_authenticated else None
    return render_template(
        "chronicles.html",
        chronicles=chronicles,
        current_user=current_user,
        user_image=user_image,
    )


@app.route("/detail/<string:chronicle_id>", methods=["GET", "POST"])
def detail(chronicle_id):
    chronicle = Chronicle.get_by_id(ObjectId(chronicle_id))
    related_chrons = Chronicle.get_related_chronicles(3)
    user_image = current_user.picture if current_user.is_authenticated else None

    if chronicle is None:
        flash("Could not find chronicle.")
        redirect(url_for("chronicles"))

    form = CommentForm()

    if request.method == "POST":
        author = current_user.nickname if current_user.is_authenticated else "Anonymous"
        avatar = current_user.picture
        Comment.save_comment(chronicle_id, "chronicle", avatar, author, form.text.data)
        print(f"Comment saved")
        flash("Your comment has been posted.")
        return redirect(url_for("detail", chronicle_id=chronicle_id))

    comments = Comment.get_comments_by_content_id(ObjectId(chronicle_id), "chronicle")

    like_count = Like.get_likes("chronicle", chronicle_id)

    user_id = current_user.get_id()
    liked = False
    if user_id:
        existing_like = db.likes.find_one(
            {"user_id": user_id, "content_id": ObjectId(chronicle_id)}
        )
        if existing_like:
            liked = True

    return render_template(
        "detail.html",
        chronicle=chronicle,
        related_chrons=related_chrons,
        user_image=user_image,
        form=form,
        comments=comments,
        like_count=like_count,
        liked=liked,
    )


@app.route("/detail/<string:chronicle_id>/like", methods=["POST"])
def like_chronicle(chronicle_id):
    user_id = current_user.get_id()
    if user_id is None:
        flash("You need to log in to like chronicle.")
        return redirect(url_for("login"))

    like = Like.get_by_user_and_content_id(user_id, chronicle_id)
    if like is not None:
        flash("You already liked this chronicle.")
        return redirect(url_for("detail", chronicle_id=chronicle_id))

    Like.add_like(user_id, "chronicle", chronicle_id)
    chronicle = Chronicle.get_by_id(ObjectId(chronicle_id))
    chronicle["likes"] += 1
    db.chronicles.update_one(
        {"_id": ObjectId(chronicle_id)}, {"$set": {"likes": chronicle["likes"]}}
    )
    flash("Chronicle liked.")
    return redirect(url_for("detail", chronicle_id=chronicle_id))


""" Game route / in dev """


@app.route("/game")
@login_required
def games():
    user_image = current_user.picture if current_user.is_authenticated else None
    return render_template(
        "game.html",
        user_image=user_image,
    )


@app.route("/play_nis")
@login_required
def play_nis():
    user_image = current_user.picture if current_user.is_authenticated else None
    return render_template("play_nis.html", user_image=user_image)

@app.route("/play_carwars")
@login_required
def play_cw():
    user_image = current_user.picture if current_user.is_authenticated else None
    return render_template("play_carwarring.html", user_image=user_image)


@app.route("/play_count", methods=["POST"])
def update_play_count():
    db.game_data.update_one({"_id": "play_count"}, {"$inc": {"count": 1}})
    return jsonify({"status": "success"})


@app.route("/save_score", methods=["POST"])
def save_score():
    score = request.json["score"]
    name = request.json["name"]
    db.nis_scores.insert_one({"name": name, "score": score})
    return jsonify({"status": "success"})


@app.route("/get_top_scores", methods=["GET"])
def get_top_scores():
    top_scores = db.scores.find().sort("score", DESCENDING).limit(5)
    return jsonify(
        [{"name": score["name"], "score": score["score"]} for score in top_scores]
    )


""" Artwork """


@app.route("/artwork")
def artwork():
    artwork = Artwork.get_all()
    user_image = current_user.picture if current_user.is_authenticated else None
    return render_template(
        "artwork.html",
        current_user=current_user,
        artwork=artwork,
        user_image=user_image,
    )


@app.route("/art_detail/<string:artwork_id>/like", methods=["POST"])
def like_artwork(artwork_id):
    user_id = current_user.get_id()
    if user_id is None:
        flash("You need to log in to like artwork.")
        return redirect(url_for("login"))

    like = Like.get_by_user_and_content_id(user_id, artwork_id)
    if like is not None:
        flash("You already liked this artwork.")
        return redirect(url_for("art_detail", like=like, artwork_id=artwork_id))

    Like.add_like(user_id, "artwork", artwork_id)
    artwork = Artwork.get_by_id(ObjectId(artwork_id))
    artwork["likes"] += 1
    db.artwork.update_one(
        {"_id": ObjectId(artwork_id)}, {"$set": {"likes": artwork["likes"]}}
    )
    flash("Artwork liked.")
    return redirect(url_for("art_detail", artwork_id=artwork_id))


@app.route("/art_detail/<string:artwork_id>", methods=["GET", "POST"])
def art_detail(artwork_id):
    artwork = Artwork.get_by_id(ObjectId(artwork_id))
    related_art = Artwork.get_related_artwork(3)
    user_image = current_user.picture if current_user.is_authenticated else None

    if artwork is None:
        flash("Could not find artwork.")
        redirect(url_for("artwork"))

    form = CommentForm()

    if request.method == "POST":
        author = current_user.nickname if current_user.is_authenticated else "Anonymous"
        avatar = current_user.picture
        Comment.save_comment(artwork_id, "art", avatar, author, form.text.data)
        print(f"Comment saved")
        flash("Your comment has been posted.")
        return redirect(url_for("art_detail", artwork_id=artwork_id))

    comments = Comment.get_comments_by_content_id(ObjectId(artwork_id), "art")

    like_count = Like.get_likes("artwork", artwork_id)

    user_id = current_user.get_id()
    liked = False
    if user_id:
        existing_like = db.likes.find_one(
            {"user_id": user_id, "content_id": ObjectId(artwork_id)}
        )
        if existing_like:
            liked = True

    return render_template(
        "art_detail.html",
        artwork=artwork,
        related_art=related_art,
        user_image=user_image,
        form=form,
        comments=comments,
        like_count=like_count,
        liked=liked,
    )


@app.route("/news")
def news():
    news_items = list(News.get_all())
    user_image = current_user.picture if current_user.is_authenticated else None

    return render_template(
        "news.html",
        news=news_items,
        user_image=user_image,
    )


@app.route("/n_detail/<string:news_id>", methods=["GET", "POST"])
def n_detail(news_id):
    article = News.get_by_id(ObjectId(news_id))
    related_n = News.get_related_news(3)
    user_image = current_user.picture if current_user.is_authenticated else None

    if article is None:
        flash("Could not find article.")
        redirect(url_for("news"))

    form = CommentForm()

    if request.method == "POST":
        author = current_user.nickname if current_user.is_authenticated else "Anonymous"
        avatar = current_user.picture
        Comment.save_comment(news_id, "news", avatar, author, form.text.data)
        print(f"Comment saved")
        flash("Your comment has been posted.")
        return redirect(url_for("n_detail", news_id=news_id))

    comments = Comment.get_comments_by_content_id(ObjectId(news_id), "news")

    return render_template(
        "n_detail.html",
        news=article,
        related_news=related_n,
        user_image=user_image,
        form=form,
        comments=comments,
    )


@app.route("/quotes")
def quotes():
    quotes = Quote.get_all()
    user_image = current_user.picture if current_user.is_authenticated else None
    return render_template(
        "quotes.html", quotes=quotes, title="Our Favorite Quotes", user_image=user_image
    )


@app.route("/q_detail/<string:quote_id>", methods=["GET", "POST"])
def q_detail(quote_id):
    quote = Quote.get_by_id(ObjectId(quote_id))
    related_q = Quote.get_related_quotes(3)
    user_image = current_user.picture if current_user.is_authenticated else None

    if quote is None:
        flash("Could not find quote.")
        redirect(url_for("quotes"))

    form = CommentForm()

    if request.method == "POST":
        author = current_user.nickname if current_user.is_authenticated else "Anonymous"
        avatar = current_user.picture
        Comment.save_comment(quote_id, "quote", avatar, author, form.text.data)
        print(f"Comment saved")
        flash("Your comment has been posted.")
        return redirect(url_for("q_detail", quote_id=quote_id))

    comments = Comment.get_comments_by_content_id(ObjectId(quote_id), "quote")

    return render_template(
        "q_detail.html",
        quote=quote,
        related_q=related_q,
        user_image=user_image,
        form=form,
        comments=comments,
    )


@app.route("/search", methods=["GET", "POST"])
def search():
    if request.method == "POST":
        search_keyword = request.form["search"]

        # Perform a search in each collection and store content type, _id, title, image, and content
        articles_results = [
            {
                "type": "news_detail",
                "_id": str(doc["_id"]),
                "title": doc["title"],
                "source": doc["source"],
                "image_url": doc["image_url"],
                "description": doc["description"][:120],
            }
            for doc in db.articles.find({"$text": {"$search": search_keyword}})
        ]
        quotes_results = [
            {
                "type": "q_detail",
                "_id": str(doc["_id"]),
                "author": doc["author"],
                "source": doc["source"],
                "quote": doc["quote"][:120],
            }
            for doc in db.quotes.find({"$text": {"$search": search_keyword}})
        ]
        artwork_results = [
            {
                "type": "art_detail",
                "_id": str(doc["_id"]),
                "title": doc["title"],
                "image": doc["image"],
                "text": doc["text"][:120],
            }
            for doc in db.artwork.find({"$text": {"$search": search_keyword}})
        ]
        chronicle_results = [
            {
                "type": "detail",
                "_id": str(doc["_id"]),
                "title": doc["title"],
                "image": doc["image"],
                "content": doc["content"][:120],
            }
            for doc in db.chronicles.find({"$text": {"$search": search_keyword}})
        ]

        return render_template(
            "search_results.html",
            articles_results=articles_results,
            quotes_results=quotes_results,
            artwork_results=artwork_results,
            chronicle_results=chronicle_results,
        )

    return render_template("search.html")


"""Admin routes"""

""" Helper function for search reslts """


def create_url(content_type, _id):
    return f"/{content_type}/{_id}"


@app.route("/admin", methods=["GET", "POST"])
@login_required
def admin():
    if not current_user.isAdmin:
        flash("You do not have permission to access this page.", "danger")
        return redirect(url_for("home"))

    if request.method == "POST" and request.form.get("get_news"):
        category = request.form.get("category")
        num_articles = int(request.form.get("num_articles"))
        get_top_news(category, num_articles)

    chronicles = Chronicle.get_all()
    artwork = Artwork.get_all()
    categories = Category.get_all()
    quotes = Quote.get_all()
    news = News.get_all()
    users = User.get_all()
    user_image = current_user.picture if current_user.is_authenticated else None

    return render_template(
        "admin.html",
        chronicles=chronicles,
        artwork=artwork,
        categories=categories,
        news=news,
        user_image=user_image,
        users=users,
        quotes=quotes,
    )


@app.route("/admin/artwork/create", methods=["GET", "POST"])
@login_required
def create_artwork():
    form = ArtworkForm()
    categories = Category.get_all()
    user_image = current_user.picture if current_user.is_authenticated else None
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

    return render_template(
        "create_chronicle.html",
        form=form,
        title="Create Artwork",
        user_image=user_image,
    )


@app.route("/admin/chronicles/create", methods=["GET", "POST"])
@login_required
def create_chronicle():
    form = ChronicleForm()
    categories = Category.get_all()
    user_image = current_user.picture if current_user.is_authenticated else None
    form.category_name.choices = [
        (str(category["_id"]), category["name"]) for category in categories
    ]

    # Handle form validation and saving chronicle to database
    if form.validate_on_submit():
        title = form.title.data
        author = form.author.data
        content = form.content.data
        category_id = ObjectId(form.category_name.data)
        category_name = Category.get_by_id(category_id)["name"]
        image = None

        if form.image.data:
            # If an image file is uploaded
            image = save_image(form.image.data)
        elif form.generate_image.data:
            # If the "Generate Image" button is clicked
            prompt = form.prompt.data or title
            brain = Brain("user", prompt)
            image_bytes = brain.get_dalle_image()
            image = save_dalle_image(image_bytes)
        elif form.dalle_image_url.data:
            # If the DALLE generated image URL is available
            image = form.dalle_image_url.data

        chronicle = Chronicle(title, author, content, category_name, image)
        chronicle.save()
        flash("Chronicle created successfully!", "success")
        return redirect(url_for("admin"))

    return render_template(
        "create_chronicle.html",
        form=form,
        user_image=user_image,
        title="Create Chronicle",
    )


@app.route("/generate_content", methods=["POST"])
@login_required
def generate_content():
    data = request.get_json()
    prompt = data.get("prompt")
    brain = Brain("user", prompt)
    generated_text = brain.get_response()
    return jsonify({"generated_text": generated_text})


@app.route("/generate_image", methods=["POST"])
@login_required
def generate_image():
    data = request.get_json()
    prompt = data.get("prompt")
    brain = Brain("user", prompt)
    image_url = brain.get_dalle_image()
    return jsonify({"image_url": image_url})


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
    form = ChronicleForm()
    categories = Category.get_all()
    user_image = current_user.picture if current_user.is_authenticated else None
    form.category_name.choices = [
        (str(category["_id"]), category["name"]) for category in categories
    ]

    if request.method == "POST":
        # Get the category object using the category ID
        category_id = request.form["category_name"]
        category = Category.get_by_id(category_id)

        # update the chronicle record in the database
        chronicle["title"] = request.form["title"]
        chronicle["author"] = request.form["author"]
        chronicle["content"] = request.form["content"]
        chronicle["category_name"] = category["name"]  # Assign the category name
        chronicle["date_posted"] = request.form["date_posted"]
        db["chronicles"].update_one({"_id": ObjectId(id)}, {"$set": chronicle})
        flash("Successfull saved record for : " + chronicle["title"])
        return redirect(url_for("admin"))

    # render the edit form with the current chronicle record data
    return render_template(
        "edit_chronicle.html", form=form, chronicle=chronicle, user_image=user_image
    )


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


""" Image management """


@app.route("/admin/images", methods=["GET", "POST"])
@login_required
def manage_images():
    user_image = current_user.picture if current_user.is_authenticated else None
    image_folder = os.path.join("static", "media", "upload")
    image_files = [
        f
        for f in os.listdir(image_folder)
        if os.path.isfile(os.path.join(image_folder, f))
    ]
    form = ManageImagesForm()
    form.delete_images.choices = [(img, img) for img in image_files]

    def local_url_for(endpoint, **values):
        if endpoint == "static":
            filename = values.get("filename")
            if filename:
                return url_for(endpoint, filename=filename)
        return url_for(endpoint, **values)

    if form.validate_on_submit():
        images_to_delete = request.form.getlist("delete_images")
        for img in images_to_delete:
            os.remove(os.path.join(image_folder, img))
        flash("Selected images deleted successfully!", "success")
        return redirect(url_for("manage_images"))

    return render_template(
        "manage_images.html",
        images=image_files,
        form=form,
        url_for=local_url_for,
        user_image=user_image,
    )


@app.route("/edit_quote/<id>", methods=["GET", "POST"])
@login_required
def edit_quote(id):
    quote = Quote.get_by_id(id)
    form = QuoteForm()
    user_image = current_user.picture if current_user.is_authenticated else None

    if request.method == "POST":
        # update the chronicle record in the database
        quote["quote"] = request.form["title"]
        quote["author"] = request.form["author"]
        quote["source"] = request.form["source"]
        quote["qotd"] = request.form["qotd"]  # Assign the category name
        db["quotes"].update_one({"_id": ObjectId(id)}, {"$set": quote})
        flash("Successfull saved record for : " + quote["quote"])
        return redirect(url_for("admin"))

    # render the edit form with the current chronicle record data
    return render_template(
        "edit_quote.html", form=form, quote=quote, user_image=user_image
    )


@app.route("/delete_quote/<quote_id>", methods=["POST"])
@login_required
def delete_quote(quote_id):
    quote = db["quotes"].find_one({"_id": ObjectId(quote_id)})
    if quote:
        db["quotes"].delete_one({"_id": ObjectId(quote_id)})
        flash("Successfully deleted quote: " + quote["quote"])
    else:
        flash("Quote not found.")
    return redirect(url_for("admin"))


@app.route("/admin/categories/create", methods=["GET", "POST"])
@login_required
def create_category():
    form = CreateCategoryForm()
    user_image = current_user.picture if current_user.is_authenticated else None
    if form.validate_on_submit():
        name = form.name.data
        desc = form.desc.data
        img = save_image(form.image.data)
        category = Category(name, desc, img)
        category.save()
        flash("Category created successfully!", "success")
        return redirect(url_for("admin"))
    return render_template(
        "create_category.html",
        form=form,
        title="Create Category",
        user_image=user_image,
    )


@app.route("/delete_category/<string:category_id>", methods=["POST"])
@login_required
def delete_category(category_id):
    # Get the chronicle by its ID
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


@app.route("/delete_artwork/<string:artwork_id>", methods=["POST"])
@login_required
def delete_artwork(artwork_id):
    # Convert the artwork_id to ObjectId
    artwork_id = ObjectId(artwork_id)

    # Get the artwork by its ID
    artwork = Artwork.get_by_id(artwork_id)
    if not artwork:
        # If the artwork doesn't exist, redirect to the admin page
        flash("Sorry, could not find the artwork.")
        return redirect(url_for("admin"))

    # Delete the artwork
    Artwork.delete(artwork)

    # Flash success message and redirect to admin page
    flash("Artwork deleted successfully!", "success")
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


@app.route("/profile", methods=["GET", "POST"])
@login_required
def profile():
    form = ProfileForm()

    if request.method == "GET":
        form.nickname.process_data(current_user.nickname)
        form.newsletter.process_data(current_user.newsletter)
        if current_user.isAdmin:
            form.isActive.process_data(current_user.isActive)
            form.isSpecial.process_data(current_user.isSpecial)

    if form.validate_on_submit():
        print("Form is submitted and valid")
        user_data = {"nickname": form.nickname.data, "newsletter": form.newsletter.data}

        if current_user.isAdmin:
            user_data["isActive"] = form.isActive.data
            user_data["isSpecial"] = form.isSpecial.data

        current_user.update(user_data)
        print(f"Updated user data: {user_data}")

        return redirect(url_for("profile"))

    print(f"Form errors: {form.errors}")

    user_image = current_user.picture if current_user.is_authenticated else None
    return render_template(
        "profile.html", user=current_user, user_image=user_image, form=form
    )


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=env.get("PORT", 5000))
