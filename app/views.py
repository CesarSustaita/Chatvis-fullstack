from app import app
from flask import jsonify
from flask import Flask, render_template, redirect, url_for, request, session
from pymongo import MongoClient
from flask import send_from_directory
from app.helpers import verify_recaptcha, attempt_login, is_valid_email, is_valid_password
from werkzeug.security import generate_password_hash

app.secret_key = "chatvis"

client = MongoClient("mongodb://localhost:27017/?directConnection=true&serverSelectionTimeoutMS=2000/")
# client = MongoClient(
    # "mongodb+srv://lj:lj12345@cluster0.jil1xg7.mongodb.net/?retryWrites=true&w=majority"
# )
db = client["test"]
users_collection = db["users"]
registro_exitoso = db["users"]

# TODO: Protect the routes that require authentication


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
    return render_template("inicio.html")


"""
    This is a example to add new routes.    
    -Remember it's important that every route works,
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


@app.route("/login", methods=["GET", "POST"])
def login():
    if request.method == "POST":
        recaptcha_response = request.form.get("g-recaptcha-response")
        recaptcha_verified = verify_recaptcha(recaptcha_response)

        if not recaptcha_verified:
            error = "Por favor, verifica que no eres un robot."
            return render_template("login.html", error=error)

        email = request.form.get("email")
        password = request.form.get("password")
        
        login_successful, error = attempt_login(email, password, users_collection)

        if login_successful:
            user = users_collection.find_one({"email": email})
            # Iniciar sesión
            session.permanent = True
            session["logged_in"] = True
            session["email"] = email
            session["name"] = user.get("nombre")
            session["admin"] = user.get("admin")
            return redirect(url_for("dashboard"))
        else:
            return render_template("login.html", error=error)

    else:
        return render_template("login.html")


@app.route("/dashboard")
def dashboard():
    if "logged_in" in session:
        email = session["email"]
        name = session.get("name")  # Obtener el nombre del usuario desde la sesión
        return render_template("index.html", email=email, name=name)
    else:
        return redirect(url_for("login"))


# Cerrar sesión
@app.route("/logout")
def logout():
    session.pop("logged_in", None)
    session.pop("email", None)
    session.pop("name", None)
    return redirect(url_for("login"))


@app.route("/register/mail", methods=["GET", "POST"])
def register_mail():
    if request.method == "POST":
        # Validar datos del formulario
        email = request.form.get("email")
        password = request.form.get("password")
        password_verify = request.form.get("password_verify")
        
        if not email or not password or not password_verify:
            error = "Por favor, completa todos los campos."
            return render_template("register1.html", error=error)
        
        if not is_valid_email(email):
            error = "Por favor, introduce un email válido."
            return render_template("register1.html", error=error)
        
        if not is_valid_password(password):
            error = "La contraseña debe tener al menos 8 caracteres, una letra mayúscula, una letra minúscula y un número o caracter especial."
            return render_template("register1.html", error=error)
        
        if password != password_verify:
            error = "Las contraseñas no coinciden."
            return render_template("register1.html", error=error)
        
        # Verificar si el email ya está registrado
        user = users_collection.find_one({"email": email})
        if user:
            error = "Ya existe una cuenta registrada con este email."
            return render_template("register1.html", error=error)
        
        
        # Obtener los datos del formulario
        datos = request.form.to_dict()
        # Almacenar los datos en la sesión
        session["registro_pagina1"] = datos
        success = "El email y la contraseña son válidos. Continúa con el registro."
        return render_template("register2.html", success=success)
    else:
        return render_template("register1.html")
    # return render_template("register1.html")


@app.route("/register/account", methods=["GET", "POST"])
def register_account():
    if request.method == "POST":
        # Obtener los datos del formulario
        datos = request.form.to_dict()
        # Almacenar los datos en la sesión
        session["registro_pagina2"] = datos
        return redirect(url_for("register_state"))
    else:
        # datos = session.get("registro_pagina1", {})
        return render_template("register2.html")
    # return render_template("register2.html")


@app.route("/register/state", methods=["GET", "POST"])
def register_state():
    if request.method == "POST":
        # Obtener los datos del formulario
        datos = request.form.to_dict()
        # Almacenar los datos en la sesión
        session["registro_pagina3"] = datos
        return redirect(url_for("register_u"))
    else:
        return render_template("register3.html")
    # return render_template("register3.html")


@app.route("/register/u", methods=["GET", "POST"])
def register_u():
    if request.method == "POST":
        # Obtener los datos del formulario
        datos = request.form.to_dict()
        # Almacenar los datos en la sesión
        session["registro_pagina4"] = datos
        # Recopilar todos los datos de la sesión
        hashed_password = generate_password_hash(
            session["registro_pagina2"]["password"]
        )
        registro_completo = {
            **session.get("registro_pagina1", {}),
            **session.get("registro_pagina2", {}),
            **session.get("registro_pagina3", {}),
            **datos,
            "password": hashed_password,
            "admin": 0,
            "num_uso": 0,
        }
        # Guardar los datos en la base de datos MongoDB
        registro_exitoso.insert_one(registro_completo)
        # Limpiar la sesión después de guardar los datos
        session.pop("registro_pagina1", None)
        session.pop("registro_pagina2", None)
        session.pop("registro_pagina3", None)
        session.pop("registro_pagina4", None)
        return redirect(url_for("index"))
    # poner la ruta siguiente
    else:
        return render_template("register4.html")
    # return render_template("register4.html")


@app.route("/tabla")
def tabla_admin():
    if "logged_in" in session:
        permission = session.get("name")
        usuarios = list(users_collection.find())
        return render_template("tabla_admin.html", users=usuarios)


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
