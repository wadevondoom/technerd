import datetime
from helpers import db
from custompagination import CustomPagination
from bson import ObjectId


class Category:
    def __init__(self, name, desc, img):
        self.name = name
        self.desc = desc
        self.img = img

    def save(self):
        categories = db.categories
        category_data = {
            "name": self.name,
            "desc": self.desc,
            "img": self.img,
        }
        category_id = categories.insert_one(category_data).inserted_id
        return category_id

    @staticmethod
    def get_all():
        categories = db.categories.find()
        return categories

    @staticmethod
    def get_by_id(id):
        category = db.categories.find_one({"_id": ObjectId(id)})
        return category

    def update(self, data):
        categories = db.categories
        category_data = {
            "name": data["name"],
            "desc": data["desc"],
            "img": data["img"],
            "date_posted": datetime.utcnow(),
        }
        categories.update_one({"_id": self.id}, {"$set": category_data})
        return True

    @staticmethod
    def delete(category):
        db.categories.delete_one({"_id": category["_id"]})
        return True

    @staticmethod
    def get_paginated(page, per_page):
        categories = (
            db.categories.find()
            .sort("date_posted", -1)
            .skip((page - 1) * per_page)
            .limit(per_page)
        )
        return categories

    @staticmethod
    def count_all():
        return db.categories.count_documents({})

    @staticmethod
    def get_categories(page, per_page=5):
        categories = Category.get_paginated(page, per_page)
        total = Category.count_all()

        items = [
            Category(name=category["name"], desc=category["desc"], img=category["img"])
            for category in categories
        ]
        pagination = CustomPagination(items, page, per_page, total)

        return pagination
