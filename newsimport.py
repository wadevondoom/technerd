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


def get_top_news(category, num_articles):
    articles_collection = db.articles

    params = {
        "apiKey": api_key,
        "country": "us",
        "category": category,
        "pageSize": num_articles,
    }

    response = requests.get(url, params=params)

    if response.status_code == 200:
        data = response.json()
        articles = data["articles"]

        print(f"Top {num_articles} {category} news articles:")
        for index, article in enumerate(articles):
            if "urlToImage" not in article:
                continue
            print(f"{index + 1}. {article['title']} - {article['source']['name']}")

            # Insert the article into the MongoDB collection
            articles_collection.insert_one(
                {
                    "title": article["title"],
                    "description": article["description"],
                    "url": article["url"],
                    "image_url": article["urlToImage"],
                    "source": article["source"]["name"],
                    "category": category,
                }
            )
    else:
        print(f"Error: {response.status_code}")
