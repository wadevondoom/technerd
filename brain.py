import openai
from os import environ as env
from dotenv import find_dotenv, load_dotenv


ENV_FILE = find_dotenv()
if ENV_FILE:
    load_dotenv(ENV_FILE)

openai.api_key =env.get("OPENAI_SECRET"),

class Brain:
    def __init__(self, role, prompt):
        self.role = "user"
        self.prompt = prompt
        self.engine = "davinci-003"
        self.prompt_helper_text = "Format your response in HTML. \
            Do not use H1 or H2. \
            Take persona of knowledge expert and write detailed article on the following subject:"

    def get_response(self):
        # Use the OpenAI API to generate text based on the input field
        prompt = self.prompt_helper_text + self.prompt
        print("Generating text...")
        response = openai.Completion.create(
            engine="text-davinci-003",
            prompt=prompt,
            max_tokens=2048,
            n=1,
            stop=None,
            temperature=0.7,
        )
        generated_text = response.choices[0].text.strip()
        print("Text generated: " + generated_text)
        return generated_text