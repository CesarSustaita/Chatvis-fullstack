from flask import Flask
from datetime import timedelta
import spacy
from dotenv import load_dotenv
import os

# TODO: Cambiar a True en producción
env_is_prod = False

load_dotenv('./.keys')

# TODO: Cambiar el prefijo SITE_PREFIX a "chatvis2024" o según sea adecuado en .keys
if env_is_prod:
    prefix = os.getenv("SITE_PREFIX")
else:
    prefix = os.getenv("SITE_PREFIX_DEV")

# TODO: Ajustar la ruta de la carpeta static según sea necesario
if env_is_prod:
    app = Flask(__name__, static_folder="static", static_url_path=f"/{prefix}/static")
else:
    app = Flask(__name__, static_folder="static", static_url_path="/static")

app.prefix = prefix

if env_is_prod:
    app.recaptcha_site_key = os.getenv("RECAPTCHA_SITE_KEY")
else:
    app.recaptcha_site_key = os.getenv("RECAPTCHA_SITE_KEY_DEV")

# TODO: Set the secret key to a secure value in .keys
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
