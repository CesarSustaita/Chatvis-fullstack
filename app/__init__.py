from flask import Flask
from datetime import timedelta
import spacy
from dotenv import load_dotenv
import os

load_dotenv('./.keys')

prefix = "chatvis2024"

app = Flask(__name__, static_folder="static", static_url_path=f"/{prefix}/static")

# TODO: Set the secret key to a secure value
app.config['SECRET_KEY'] = os.getenv("APP_SECRET_KEY")
app.config['SESSION_COOKIE_SECURE'] = True
app.config['PERMANENT_SESSION_LIFETIME'] = timedelta(minutes=15)

@app.before_request
def make_session_permanent():
    app.config['PERMANENT_SESSION_LIFETIME'] = timedelta(minutes=15)

# Load the spacy model
app.nlp = spacy.load("spacy/model-last-x-eff3")


# Import the views after the Flask app is created
from app import views
