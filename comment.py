from datetime import datetime
from bson import ObjectId
from helpers import db

class Comment:
    def __init__(
        self, content_id, content_type, avatar, author, text, created_at=None, _id=None
    ):
        self._id = _id or ObjectId()
        self.content_id = content_id
        self.content_type = content_type
        self.avatar = avatar
        self.author = author
        self.text = text
        self.created_at = created_at or datetime.utcnow()

    @classmethod
    def from_dict(cls, comment_dict):
        return cls(**comment_dict)

    def to_dict(self):
        return {
            "_id": self._id,
            "content_id": self.content_id,
            "content_type": self.content_type,
            "avatar": self.avatar,
            "author": self.author,
            "text": self.text,
            "created_at": self.created_at,
        }

    @classmethod
    def save_comment(cls, content_id, content_type, avatar, author, text):
        comment = Comment(ObjectId(content_id), content_type, avatar, author, text)
        db.comments.insert_one(comment.to_dict())
        print(f"Inserted comment: {comment.to_dict()}")

    @classmethod
    def get_comments_by_content_id(cls, content_id, content_type):
        comments_cursor = db.comments.find(
            {"content_id": content_id, "content_type": content_type}
        ).sort("created_at", -1)
        return [cls.from_dict(comment) for comment in comments_cursor]

    def save(self):
        db.comments.insert_one(self.to_dict())
