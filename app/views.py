from app import app
from flask import render_template
from flask import request
from flask import jsonify


@app.route('/')
def index():
    """
    Renders the index.html template.

    Returns:
        The rendered index.html template.
    """
    return render_template('index.html')

@app.route('/classify', methods=['POST'])
def classify_message():
    """
    Classifies a message using a pre-trained model.

    Returns:
        A JSON response containing the predicted category and scores.

    Raises:
        Exception: If an error occurs during the classification process.
    """
    try:
        message = request.json['message']

        doc = app.nlp(message)

        scores = doc.cats
        category = max(scores, key=scores.get)
        score_values = {k: round(v, 2) for k, v in scores.items()}

        return jsonify({
            'category': category,
            'scores': score_values
        })
    
    except Exception as e:
        return jsonify({'error': str(e)})
    
    