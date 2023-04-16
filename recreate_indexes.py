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
client = MongoClient(db_conn_str)
db = client.technerdiac

# Create the text indexes for the 'articles' collection if they do not exist
try:
    if not index_exists(db.articles, "title_text_source_text_description_text"):
        print("Creating index for 'articles' collection...")
        db.articles.create_index(
            [("title", "text"), ("source", "text"), ("description", "text")], 
            name="title_text_source_text_description_text"
        )
        print("Index for 'articles' collection created.")
except Exception as e:
    print(f"Error creating index: {e}")
    exit(1)

# Disconnect from the database
client.close()
