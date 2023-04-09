from pymongo import MongoClient
from helpers import db


class Like:
    collection = db.likes

    @staticmethod
    def add_like(user_id, content_type, content_id):
        Like.collection.update_one(
            {
                "user_id": user_id,
                "content_type": content_type,
                "content_id": content_id,
            },
            {
                "$setOnInsert": {
                    "user_id": user_id,
                    "content_type": content_type,
                    "content_id": content_id,
                }
            },
            upsert=True,
        )

    @staticmethod
    def remove_like(user_id, content_type, content_id):
        Like.collection.delete_one(
            {"user_id": user_id, "content_type": content_type, "content_id": content_id}
        )

    @staticmethod
    def get_likes(content_type, content_id):
        return Like.collection.count_documents(
            {"content_type": content_type, "content_id": content_id}
        )

    @staticmethod
    def get_by_user_and_content_id(user_id, content_id):
        return Like.collection.find_one({"user_id": user_id, "content_id": content_id})
