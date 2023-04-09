import requests
from helpers import db
from dotenv import load_dotenv, find_dotenv
from os import environ as env

ENV_FILE = find_dotenv()
if ENV_FILE:
    load_dotenv(ENV_FILE)

# Replace YOUR_API_KEY with the API key you obtained from Google News
api_key = env.get("NEWS_API_KEY")
url = "https://newsapi.org/v2/top-headlines"

print(f"API Key: {api_key}")

params = {"apiKey": api_key, "country": "us", "category": "technology", "pageSize": 20}

response = requests.get(url, params=params)

if response.status_code == 200:
    data = response.json()
    articles = data["articles"]

    # Select the desired collection
    articles_collection = db.articles

    print("Top 20 Science news articles:")
    for index, article in enumerate(articles[:20]):
        print(f"{index + 1}. {article['title']} - {article['source']['name']}")

        # Insert the article into the MongoDB collection
        articles_collection.insert_one(
            {
                "title": article["title"],
                "description": article["description"],
                "url": article["url"],
                "image_url": article["urlToImage"],
                "source": article["source"]["name"],
            }
        )
else:
    print(f"Error: {response.status_code}")
