from helpers import db, save_image


class Quote:
    def __init__(self, quote, author, source, qotd_url=None, image=None):
        self.quote = quote
        self.author = author
        self.source = source
        self.qotd_url = qotd_url
        self.image = image

    def save(self):
        quotes = db.quotes
        quote_data = {
            "quote": self.quote,
            "author": self.author,
            "source": self.source,
            "qotd_url": self.qotd_url,
            "image": self.image,
        }
        quote_id = quotes.insert_one(quote_data).inserted_id
        return quote_id

    @staticmethod
    def get_all():
        quotes = db.quotes.find()
        return quotes

    @staticmethod
    def get_random(sample_size=1):
        quote = db.quotes.aggregate([{"$sample": {"size": sample_size}}])
        return next(iter(quote), None)

    @staticmethod
    def get_by_id(id):
        quote = db.quotes.find_one({"_id": id})
        return quote

    def update(self, data):
        quote = db.quotes
        quote_data = {
            "quote_text": self.quote_text,
            "author": self.author,
            "source": self.source,
            "qotd_url": self.qotd_url,
            "image": self.image,
        }
        quote.update_one({"_id": self.id}, {"$set": quote_data})
        return True

    @staticmethod
    def delete(id):
        quote = db.quotes
        quote.delete_one({"_id": id})
        return True

    @staticmethod
    def get_related_quotes(num_quotes=3):
        quotes = []
        for i in range(num_quotes):
            quote = Quote.get_random()
            if quote:
                quotes.append(quote)
        return quotes
