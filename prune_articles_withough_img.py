from helpers import db

articles_collection = db["articles"]
# Find documents with a null image_url and update them
articles_to_update = articles_collection.find({"image_url": {"$eq": None}})
updated_count = 0
for article in articles_to_update:
    article_id = article["_id"]
    result = articles_collection.update_one(
        {"_id": article_id},
        {"$set": {"image_url": "/static/img/placeholder.jpg"}},
    )
    updated_count += result.modified_count

print(f"{updated_count} documents updated.")
