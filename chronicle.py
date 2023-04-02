import datetime
from helpers import db
from custompagination import CustomPagination
from bson import ObjectId

class Chronicle:
    def __init__(self, title, author, content, category_name, image, date_posted=None):
        self.title = title
        self.author = author
        self.content = content
        self.category_name = category_name
        self.image = image
        self.date_posted = date_posted or datetime.datetime.utcnow()

    def save(self):
        chronicles = db.chronicles
        chronicle_data = {
            "title": self.title,
            "author": self.author,
            "content": self.content,
            "category_name": self.category_name,
            "date_posted": self.date_posted,
            "image": self.image,
        }
        chronicle_id = chronicles.insert_one(chronicle_data).inserted_id
        return chronicle_id

    @staticmethod
    def get_home_chronicles():
        chronicles = db.chronicles.find().sort("date_posted", -1).limit(3)
        return chronicles

    @staticmethod
    def get_all():
        chronicles = db.chronicles.find().sort("date_posted", -1)
        return chronicles

    @staticmethod
    def get_by_id(id):
        chronicle = db.chronicles.find_one({"_id": ObjectId(id)})
        return chronicle

    def update(self, data, file):
        chronicles = db.chronicles
        chronicle_data = {
            "title": data["title"],
            "author": data["author"],
            "content": data["content"],
            "date_posted": datetime.utcnow(),
            "image": self.image,
        }

        chronicles.update_one({"_id": self.id}, {"$set": chronicle_data})
        return True

    @staticmethod
    def delete(chronicle):
        chronicles = db.chronicles
        chronicles.delete_one({"_id": chronicle["_id"]})
        return True

    @staticmethod
    def get_random():
        chronicles = db.chronicles.aggregate([{"$sample": {"size": 1}}])
        return next(iter(chronicles), None)

    @staticmethod
    def get_related_chronicles(num_chronicles=3):
        chronicles = []
        for i in range(num_chronicles):
            chronicle = Chronicle.get_random()
            if chronicle:
                chronicles.append(chronicle)
        return chronicles
    
    @staticmethod
    def get_paginated(page, per_page):
        chronicles = db.chronicles.find().sort("date_posted", -1).skip((page - 1) * per_page).limit(per_page)
        return chronicles

    @staticmethod
    def count_all():
        return db.chronicles.count_documents({})
    
    def get_chronicles(page, per_page=5):
        chronicles = Chronicle.get_paginated(page, per_page)
        total = Chronicle.count_all()

        items = [Chronicle(title=chronicle["title"], \
                           author=chronicle["author"], \
                            content=chronicle["content"], \
                            category_name=chronicle["category_name"], \
                            image=chronicle["image"], \
                            date_posted=chronicle["date_posted"]) \
                            for chronicle in chronicles]
        pagination = CustomPagination(items, page, per_page, total)

        return pagination