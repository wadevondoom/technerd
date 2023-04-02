from flask_login import UserMixin

class User(UserMixin):
    def __init__(self, id, name=None, email=None):
        self.id = id
        self.name = name
        self.email = email

    def __repr__(self):
        return f"<User: {self.id}>"