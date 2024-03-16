from flask import Flask
import spacy


app = Flask(__name__, static_folder='static', static_url_path='/static')


# Load the spacy model
app.nlp = spacy.load('spacy/model-last-x-eff3')


# Import the views after the Flask app is created
from app import views

