import os
from pymongo import MongoClient
from slugify import slugify

DBCONN = os.environ.get("DBCONN")
client = MongoClient(DBCONN)
db = client.technerdiac
artwork = db.artwork

MAX_SLUG_LENGTH = 60

for chronicle in artwork.find():
    slug = slugify(chronicle["title"])[:MAX_SLUG_LENGTH]
    print("Slug:", slug)
    artwork.update_one({"_id": chronicle["_id"]}, {"$set": {"slug": slug}})

client.close()
