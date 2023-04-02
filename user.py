from flask_login import UserMixin
from helpers import db
from pymongo import MongoClient


class User(UserMixin):
    def __init__(self, id, name=None, email=None, picture=None):
        self.id = id
        self.name = name
        self.email = email
        self.picture = picture

        user_db = db
        users_collection = user_db.users

        user = users_collection.find_one({"name": self.name, "email": self.email})
        if user is None:
            users_collection.insert_one(
                {
                    "name": self.name,
                    "email": self.email,
                    "picture": picture,
                }
            )

    def __repr__(self):
        return f"<User: {self.id}>"
