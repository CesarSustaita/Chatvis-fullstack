from app import app
from flask import request
from flask import jsonify
from flask import send_from_directory

import os




"""
    This is a example to add new routes.
    
    -Remember it´s important that every route works,
    -The route are: 
        [USER VIEW]
        -Index (must be added first navbar)
        -Login (must be added first navbar)
        -Register (must be added first navbar)
        -Upload the file (must be added Second navbar)
        -Conversation, chord diagrama and classification graph (it is currently) - (must be second navbar with its routes works correctly)

        [ADMIN VIEW]
        -Upload the file (must be added Second navbar and third navbar)
        -Users registers(table) - (must be added Second navbar  and third navbar)
        -Conversation, chord diagrama and classification graph (it is currently) -(must be second navbar with its routes works correctly and third navbar)
"""
@app.route('/login')
def login():
    return render_template('login.html')

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

@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve(path):
    """
    Handles the serving of static files (Vue.js) and the index.html file.
    Returns:
        The requested file or the index.html file if the file is not found.
    """
    if path != "" and os.path.exists(app.static_folder + '/' + path):
        return send_from_directory(app.static_folder, path)
    else:
        return send_from_directory(app.static_folder, 'index.html')