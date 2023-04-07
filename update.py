from helpers import db

# Connect to MongoDB
categories = db['quote']

# Update each record with a new field called "color"
categories.update_many({}, {"$set": {"qotd": ""}})
