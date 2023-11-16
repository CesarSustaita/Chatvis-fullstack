from app import app
from flask import render_template
from flask import request
from flask import jsonify

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/hello-world')
def hello_world():
    return render_template('hello-world.html')

@app.route('/classify', methods=['POST'])
def classify_message():
    try:
        message = request.json['message']

        doc = app.nlp(message)

        scores = doc.cats
        category = max(scores, key=scores.get)

        return jsonify({'category': category})
    
    except Exception as e:
        return jsonify({'error': str(e)})