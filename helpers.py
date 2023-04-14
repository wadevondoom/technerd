import asyncio, json, os, uuid, imghdr
from pymongo import MongoClient
from werkzeug.utils import secure_filename
from flask import url_for

client = MongoClient(os.environ.get("DBCONN"))
db = client.technerdiac

loop = asyncio.get_event_loop()

ALLOWED_EXTENSIONS = {"jpg", "jpeg"}
UPLOAD_FOLDER = os.path.join(os.getcwd(), "static", "media", "upload")


def allowed_file(filename):
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS


def save_image(file):
    if not file:
        return None
    filename = secure_filename(file.filename)
    ext = filename.rsplit(".", 1)[1].lower()  # Get the file extension
    if ext not in ("jpg", "jpeg"):
        return None
    if file.content_length > 2 * 1024 * 1024:
        return None
    os.makedirs(UPLOAD_FOLDER, exist_ok=True)
    new_filename = str(uuid.uuid4()) + "." + ext  # Generate a unique filename
    file.save(os.path.join(UPLOAD_FOLDER, new_filename))

    # Generate a URL for the uploaded file
    url = url_for("static", filename="media/upload/" + new_filename)

    print(url)
    return url


def save_dalle_image(image_bytes):
    if not image_bytes:
        return None

    # Detect the image format
    ext = imghdr.what(None, h=image_bytes)
    if not ext:
        print("Error: Unable to detect image format.")
        return None

    os.makedirs(UPLOAD_FOLDER, exist_ok=True)
    new_filename = str(uuid.uuid4()) + "." + ext  # Generate a unique filename

    try:
        with open(os.path.join(UPLOAD_FOLDER, new_filename), "wb") as f:
            f.write(image_bytes)

        # Generate a URL for the saved file
        url = url_for("static", filename="media/upload/" + new_filename)
        print(url)
        return url
    except Exception as e:
        print(f"Error saving image: {e}")
        return None
