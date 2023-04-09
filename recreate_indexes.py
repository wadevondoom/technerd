from pymongo import MongoClient
import os


def index_exists(collection, index_name):
    return any(index["name"] == index_name for index in collection.list_indexes())


# Get the database connection string from the environment variable
try:
    db_conn_str = os.environ["DBCONN"]
except KeyError:
    print("Error: DBCONN environment variable not set.")
    exit(1)

# Connect to the MongoDB database
client = MongoClient(os.environ.get("DBCONN"))
db = client.technerdiac

# Create the text indexes for each collection if they do not exist
try:


    if not index_exists(db.artwork, "title_text_text"):
        print("Creating index for 'artwork' collection...")
        db.artwork.create_index(
            [("title", "text"), ("text", "text")], name="title_text_text"
        )
        print("Index for 'artwork' collection created.")

    if not index_exists(db.chronicles, "title_content_text"):
        print("Creating index for 'chronicles' collection...")
        db.chronicles.create_index(
            [("title", "text"), ("content", "text")], name="title_content_text"
        )
        print("Index for 'chronicles' collection created.")
except Exception as e:
    print(f"Error creating index: {e}")
    exit(1)

# Disconnect from the database
client.close()
