from helpers import db

# Connect to MongoDB
categories = db['categories']

# Update each record with a new field called "color"
categories.update_many({}, {"$set": {"color": "#ffa500"}})
