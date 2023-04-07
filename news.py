from helpers import db
from bson import ObjectId

class News:
    def __init__(self, title, description, url, image_url, source):
        self.title = title
        self.description = description
        self.url = url
        self.image_url = image_url
        self.source = source

    @staticmethod
    def get_all():
        news = db.articles.find().sort("date_posted", -1)
        return news

    @staticmethod
    def get_by_id(id):
        story = db.articles.find_one({"_id": ObjectId(id)})
        return story