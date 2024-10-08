from helpers import db
from bson import ObjectId
from pymongo import DESCENDING


class News:
    def __init__(self, title, description, url, image_url, source):
        self.title = title
        self.description = description
        self.url = url
        self.image_url = image_url
        self.source = source

    @staticmethod
    def get_all():
        news = db.articles.find().sort("_id", -1)
        return news

    @staticmethod
    def get_by_id(id):
        story = db.articles.find_one({"_id": ObjectId(id)})
        return story

    @staticmethod
    def get_home_news():
        news = db.articles.find().sort("_id", -1).limit(10)
        return news

    @staticmethod
    def get_related_news(num_news=3):
        news = []
        for i in range(num_news):
            article = News.get_random()
            if article:
                news.append(article)
        return news

    @staticmethod
    def get_random(sample_size=1):
        article = db.articles.aggregate([{"$sample": {"size": sample_size}}])
        return next(iter(article), None)

    @staticmethod
    def delete(article):
        articles = db.articles
        articles.delete_one(
            {"_id": article["_id"]}
        )  # Changed from articles["_id"] to article["_id"]
        return True

    @staticmethod
    def count_all():
        return db.articles.count_documents({})

    @staticmethod
    def get_paginated(skip, limit):
        return db.articles.find().skip(skip).limit(limit).sort([("_id", DESCENDING)])
