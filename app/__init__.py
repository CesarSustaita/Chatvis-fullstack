from flask import Flask
from datetime import timedelta
import spacy


app = Flask(__name__, static_folder="static", static_url_path="/static")

# TODO: Set the secret key to a secure value
app.config['SECRET_KEY'] = "chatvis-secret-key-f03949f"
app.config['SESSION_COOKIE_SECURE'] = True
app.config['PERMANENT_SESSION_LIFETIME'] = timedelta(minutes=15)

@app.before_request
def make_session_permanent():
    app.config['PERMANENT_SESSION_LIFETIME'] = timedelta(minutes=15)

# Load the spacy model
app.nlp = spacy.load("spacy/model-last-x-eff3")


# Import the views after the Flask app is created
from app import views
