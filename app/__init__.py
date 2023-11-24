from flask import Flask
import spacy

app = Flask(__name__)

# Load the spacy model
app.nlp = spacy.load('spacy/model-best-x-eff')

# Import the views after the Flask app is created
from app import views