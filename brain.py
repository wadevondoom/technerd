import openai
import requests
from os import environ as env
from dotenv import find_dotenv, load_dotenv
from helpers import save_dalle_image

ENV_FILE = find_dotenv()
if ENV_FILE:
    load_dotenv(ENV_FILE)

openai.api_key = env.get("OPENAI_SECRET")


class Brain:
    def __init__(self, role, prompt):
        self.role = "user"
        self.prompt = prompt
        self.engine = "davinci-003"
        self.prompt_img_helper_text = (
            ""
        )
        self.prompt_helper_text = "Format your response in HTML. \
            Do not use H1 or H2. \
            Take persona of knowledge expert and write detailed article on the following subject:"

    def get_response(self):
        # Use the OpenAI API to generate text based on the input field
        prompt = self.prompt_helper_text + self.prompt
        print("Generating text...")
        response = openai.Completion.create(
            engine="gpt-3.5-turbo",
            prompt=prompt,
            max_tokens=4096,
            n=1,
            stop=None,
            temperature=0.7,
        )
        generated_text = response.choices[0].text.strip()
        print("Text generated: " + generated_text)
        return generated_text

    def get_dalle_image(self):
        prompt = self.prompt_img_helper_text + self.prompt
        print("Generating image...")
        response = openai.Image.create(prompt=prompt, n=1, size="1024x1024")
        image_url = response["data"][0]["url"]

        # Download the image from the OpenAI API URL
        image_response = requests.get(image_url)

        # Save the image locally and get the local URL
        local_image_url = save_dalle_image(image_response.content)

        return local_image_url
