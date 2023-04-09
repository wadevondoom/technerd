from helpers import db
import datetime
from custompagination import CustomPagination
from bson import ObjectId


class Artwork:
    def __init__(
        self,
        title,
        category_name,
        image,
        text,
        date_posted=None,
        likes=0,
        page_views=0,
    ):
        self.title = title
        self.category_name = category_name
        self.image = image
        self.text = text
        self.date_posted = date_posted or datetime.datetime.utcnow()
        self.likes = likes
        self.page_views = page_views or 0

    def __repr__(self):
        return f"<Artwork: {self.title}>"

    def save(self):
        artwork = db.artwork
        artwork_data = {
            "title": self.title,
            "category_name": self.category_name,
            "image": self.image,
            "text": self.text,
            "date_posted": self.date_posted,
            "likes": self.likes,  # Add likes attribute
            "page_views": self.page_views,  # Add page_views attribute
        }
        artwork_id = artwork.insert_one(artwork_data).inserted_id
        return artwork_id

    @staticmethod
    def get_all():
        artwork = db.artwork.find()
        return artwork

    @staticmethod
    def get_random():
        artwork = db.artwork.aggregate([{"$sample": {"size": 1}}])
        return next(iter(artwork), None)

    @staticmethod
    def get_related_artwork(num_artwork=5):
        artworks = []
        for i in range(num_artwork):
            artwork = Artwork.get_random()
            if artwork:
                artworks.append(artwork)
        return artworks

    @staticmethod
    def get_by_id(id):
        art = db.artwork.find_one({"_id": id})
        if art:
            Artwork.increment_page_views(id)
        return art

    def update(self, data):
        artwork = db.artwork
        artwork_data = {
            "title": self.title,
            "category_name": self.category_name,
            "image": self.image,
            "text": self.text,
            "date_posted": datetime.utcnow(),
        }
        artwork.update_one({"_id": self.id}, {"$set": artwork_data})
        return True

    @staticmethod
    def delete(artwork):
        db.artwork.delete_one({"_id": artwork["_id"]})
        return True

    @staticmethod
    def get_paginated(page, per_page):
        artwork = (
            db.artwork.find()
            .sort("date_posted", -1)
            .skip((page - 1) * per_page)
            .limit(per_page)
        )
        return artwork

    @staticmethod
    def count_all():
        return db.artwork.count_documents({})

    @staticmethod
    def get_artwork(page, per_page=5):
        artworks = Artwork.get_paginated(page, per_page)
        total = Artwork.count_all()

        items = [
            Artwork(
                image=artwork["image"],
                title=artwork["title"],
                desc=artwork.get("desc", ""),
                text=artwork.get("text", ""),
                category_name=artwork.get("category_name", ""),
            )
            for artwork in artworks
        ]
        pagination = CustomPagination(items, page, per_page, total)

        return pagination

    @classmethod
    def increment_page_views(cls, artwork_id):
        db.artwork.update_one(
            {"_id": ObjectId(artwork_id)}, {"$inc": {"page_views": 1}}
        )

    @classmethod
    def increment_likes(cls, artwork_id):
        db.artwork.update_one({"_id": ObjectId(artwork_id)}, {"$inc": {"likes": 1}})
