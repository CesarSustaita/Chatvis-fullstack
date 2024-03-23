from app import app
from flask import render_template
from flask import request
from flask import jsonify
from flask import Flask, render_template, redirect, url_for, request

from flask import send_from_directory


@app.route("/inicio")
def inicio():
    return render_template("inicio.html")


@app.route("/")
def index():
    """
    Renders the index.html template.

    Returns:
        The rendered index.html template.
    """
    return render_template("index.html")


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


@app.route("/login")
def login():
    return render_template("login.html")


@app.route("/register/mail")
def register_mail():
    if request.method == "POST":
        # Aquí iría tu lógica para verificar las credenciales del usuario
        # Si el inicio de sesión es exitoso, puedes redireccionar a otra página
        # por ejemplo, si el nombre de la página es 'dashboard':
        return redirect(url_for("inicio"))
    return render_template("register1.html")


@app.route("/register/account")
def register_account():
    return render_template("register2.html")


@app.route("/register/state")
def register_state():
    return render_template("register3.html")


@app.route("/register/u")
def register_u():
    return render_template("register4.html")


# @app.route('/login')
# def lector():
#   return render_template('login.html')


##@app.route('/lector')
# def login():
#   return render_template('lector.html')


@app.route("/classify", methods=["POST"])
def classify_message():
    """
    Classifies a message using a pre-trained model.

    Returns:
        A JSON response containing the predicted category and scores.

    Raises:
        Exception: If an error occurs during the classification process.
    """
    try:
        message = request.json["message"]

        doc = app.nlp(message)

        scores = doc.cats
        category = max(scores, key=scores.get)
        score_values = {k: round(v, 2) for k, v in scores.items()}

        return jsonify({"category": category, "scores": score_values})

    except Exception as e:
        return jsonify({"error": str(e)})
