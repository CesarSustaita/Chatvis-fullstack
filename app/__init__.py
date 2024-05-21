from flask import Flask
from datetime import timedelta
import spacy
from dotenv import load_dotenv
import os

load_dotenv('./.keys')

# TODO: Cambiar el prefijo SITE_PREFIX a "chatvis2024" en .keys
prefix = os.getenv("SITE_PREFIX")

# Cambiar según si static está en la raíz o en la carpeta del prefijo
#app = Flask(__name__, static_folder="static", static_url_path=f"/{prefix}/static")
app = Flask(__name__, static_folder="static", static_url_path=f"/static")

app.prefix = prefix

app.recaptcha_site_key = os.getenv("RECAPTCHA_SITE_KEY")

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
