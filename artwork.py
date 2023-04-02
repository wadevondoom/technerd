from helpers import db
import datetime
from custompagination import CustomPagination


class Artwork:
    def __init__(self, title, category_name, image, text, date_posted=None):
        self.title = title
        self.category_name = category_name
        self.image = image
        self.text = text
        self.date_posted = datetime.datetime.utcnow(),

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
        artwork = db.artwork
        artwork.delete_one({"_id": artwork["_id"]})
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
                category_name=artwork.get("category_name",""),
            )
            for artwork in artworks
        ]
        pagination = CustomPagination(items, page, per_page, total)

        return pagination
