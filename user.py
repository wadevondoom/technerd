from flask_login import UserMixin
from helpers import db
import hashlib


class User(UserMixin):
    def __init__(self, id, name=None, email=None, picture=None, nickname=None):
        self.id = id
        self.name = name
        self.email = email
        self.picture = picture
        self.nickname = nickname

        user_db = db
        users_collection = user_db.users

        user = users_collection.find_one({"_id": self.id})
        if user is None:
            nickname = self.generate_custom_identifier(self.email)
            inserted_user = users_collection.insert_one(
                {
                    "_id": self.id,
                    "name": self.name,
                    "email": self.email,
                    "nickname": nickname,  # Store the nickname in the database
                    "picture": self.picture,
                }
            )
            self.nickname = nickname

    def __repr__(self):
        return f"<User: {self.id}>"

    @staticmethod
    def generate_custom_identifier(email):
        hashed_email = hashlib.md5(email.encode("utf-8")).hexdigest()[:10]
        identifier = f"user_{hashed_email}"
        return identifier

    @staticmethod
    def get_all():
        users = db.users.find().sort("name", 1)
        return users