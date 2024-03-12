from flask import Flask
import spacy

app = Flask(__name__)

# Load the spacy model
app.nlp = spacy.load("spacy/model-last-x-eff3")


# Import the views after the Flask app is created
from app import views
