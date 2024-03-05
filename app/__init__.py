from flask import Flask
import spacy

# New Flask app definition (Vue.js)
app = Flask(__name__, static_folder='dist')

# Load the spacy model
app.nlp = spacy.load('spacy/model-last-x-eff3')

# Import the views after the Flask app is created
from app import views