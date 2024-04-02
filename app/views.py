from app import app
from flask import jsonify
from flask import Flask, render_template, redirect, url_for, request, session, flash
from pymongo import MongoClient
from flask import send_from_directory
from app import helpers
from werkzeug.security import generate_password_hash
from datetime import timedelta

app.secret_key = "chatvis"

client = MongoClient("mongodb://localhost:27017/?directConnection=true&serverSelectionTimeoutMS=2000/")
# client = MongoClient(
    # "mongodb+srv://lj:lj12345@cluster0.jil1xg7.mongodb.net/?retryWrites=true&w=majority"
# )
db = client["test"]
users_collection = db["users"]

# TODO: Protect the routes that require authentication

# TODO: Use 'flash' to display messages to the user (e.g., success, error, warning, info)

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
    return redirect(url_for("inicio"))


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
        recaptcha_verified = helpers.verify_recaptcha(recaptcha_response)

        if not recaptcha_verified:
            error = "Por favor, verifica que no eres un robot."
            return render_template("login.html", error=error)

        email = request.form.get("email")
        password = request.form.get("password")
        
        login_successful, error = helpers.attempt_login(email, password, users_collection)

        if login_successful:
            user = users_collection.find_one({"email": email})
            # Iniciar sesión
            session.permanent = True
            session["logged_in"] = True
            session["email"] = email
            session["name"] = user.get("nombre")
            session["admin"] = user.get("admin")
            flash("Has iniciado sesión exitosamente.", "success")
            return redirect(url_for("dashboard"))
        else:
            return render_template("login.html", error=error)

    else:
        return render_template("login.html")


@app.route("/dashboard")
def dashboard():
    if "logged_in" in session:
        email = session.get("email")  # Obtener el email del usuario desde la sesión
        name = session.get("name")  # Obtener el nombre del usuario desde la sesión
        return render_template("index.html", email=email, name=name)
    else:
        flash("Inicia sesión para acceder al dashboard.", "warning")
        return redirect(url_for("login"))


# Cerrar sesión
@app.route("/logout")
def logout():
    app.config['PERMANENT_SESSION_LIFETIME'] = timedelta(minutes=-10)
    session.pop("logged_in", None)
    session.pop("email", None)
    session.pop("name", None)
    success = "Has cerrado sesión exitosamente."
    return render_template("inicio.html", success=success)


@app.route("/register/mail", methods=["GET", "POST"])
def register_mail():
    if request.method == "POST":
        # Validar datos del formulario
        email = request.form.get("email")
        password = request.form.get("password")
        password_verify = request.form.get("password_verify")
        
        datos_existentes = helpers.get_register_data()
        
        if not email or not password or not password_verify:
            error = "Por favor, completa todos los campos."
            return render_template("register1.html", error=error, datos=datos_existentes)
        
        if not helpers.is_valid_email(email):
            error = "Por favor, introduce un email válido."
            return render_template("register1.html", error=error, datos=datos_existentes)
        
        if not helpers.is_valid_password(password):
            error = "La contraseña debe tener al menos 8 caracteres, una letra mayúscula, una letra minúscula y un número o caracter especial."
            return render_template("register1.html", error=error, datos=datos_existentes)
        
        if password != password_verify:
            error = "Las contraseñas no coinciden."
            return render_template("register1.html", error=error, datos=datos_existentes)
        
        # Verificar si el email ya está registrado
        user = users_collection.find_one({"email": email})
        if user:
            error = "Ya existe una cuenta registrada con este email."
            return render_template("register1.html", error=error, datos=datos_existentes)
        
        
        # Obtener los datos del formulario
        datos = request.form.to_dict()
        # Almacenar los datos en la sesión
        session["registro_pagina1"] = datos
        datos_existentes = helpers.get_register_data()
        return render_template("register2.html", datos=datos_existentes)
    else:
        datos = helpers.get_register_data()
        return render_template("register1.html", datos=datos)
    # return render_template("register1.html")


@app.route("/register/account", methods=["GET", "POST"])
def register_account():
    if request.method == "POST":
        # Validar datos del formulario
        nombre = request.form.get("nombre")
        apellido_paterno = request.form.get("apellido_paterno")
        apellido_materno = request.form.get("apellido_materno")
        
        datos_existentes = helpers.get_register_data()
        
        if not nombre or not apellido_paterno:
            error = "Por favor, completa los campos requeridos."
            return render_template("register2.html", error=error, datos=datos_existentes)
        
        if not helpers.is_valid_name(nombre):
            error = "Por favor, introduce un nombre válido."
            return render_template("register2.html", error=error, datos=datos_existentes)

        if not helpers.is_valid_name(apellido_paterno):
            error = "Por favor, introduce un apellido paterno válido."
            return render_template("register2.html", error=error, datos=datos_existentes)
        
        if apellido_materno and not helpers.is_valid_name(apellido_materno):
            error = "Por favor, introduce un apellido materno válido."
            return render_template("register2.html", error=error, datos=datos_existentes)
        
        # Obtener los datos del formulario
        datos = request.form.to_dict()
        # Almacenar los datos en la sesión
        session["registro_pagina2"] = datos
        datos_existentes = helpers.get_register_data()
        return render_template("register3.html", datos=datos_existentes)
    else:
        # datos = session.get("registro_pagina1", {})
        datos = helpers.get_register_data()
        return render_template("register2.html", datos=datos)
    # return render_template("register2.html")


@app.route("/register/state", methods=["GET", "POST"])
def register_state():
    if request.method == "POST":
        # Validar datos del formulario
        estado = request.form.get("estado")
        ciudad = request.form.get("ciudad")
        
        datos_existentes = helpers.get_register_data()
        
        if not estado or not ciudad:
            error = "Por favor, completa los campos requeridos."
            return render_template("register3.html", error=error, datos=datos_existentes)
        
        if not helpers.is_valid_estado(estado):
            error = "Por favor, introduce un estado válido."
            return render_template("register3.html", error=error, datos=datos_existentes)
        
        if not helpers.is_valid_ciudad(ciudad):
            error = "Por favor, introduce una ciudad válida."
            return render_template("register3.html", error=error, datos=datos_existentes)
        
        # Obtener los datos del formulario
        datos = request.form.to_dict()
        # Almacenar los datos en la sesión
        session["registro_pagina3"] = datos
        datos_existentes = helpers.get_register_data()
        return render_template("register4.html", datos=datos_existentes)
    else:
        datos = helpers.get_register_data()
        return render_template("register3.html", datos=datos)
    # return render_template("register3.html")


@app.route("/register/u", methods=["GET", "POST"])
def register_u():
    if request.method == "POST":
        # Validar datos del formulario
        universidad = request.form.get("universidad")
        terminos = request.form.get("terminos")
        
        datos_existentes = helpers.get_register_data()
        
        if universidad and not helpers.is_valid_universidad(universidad):
            error = "Por favor, introduce un nombre válido de tu universidad."
            return render_template("register4.html", error=error, datos=datos_existentes)
        
        if terminos != 'accepted':
            error = "Por favor, acepta los términos y condiciones."
            return render_template("register4.html", error=error, datos=datos_existentes)
        
        # Obtener los datos del formulario
        datos = request.form.to_dict()
        # Almacenar los datos en la sesión
        session["registro_pagina4"] = datos
        # Recopilar todos los datos de la sesión
        datos_de_registro = {
            **session.get("registro_pagina1", {}),
            **session.get("registro_pagina2", {}),
            **session.get("registro_pagina3", {}),
            **datos,
            "admin": 0,
            "num_uso": 0,
        }
        
        complete, missing_field = helpers.register_data_is_complete(datos_de_registro)
        
        if not complete:
            if missing_field == 'email' or missing_field == 'password':
                error = "Completa los campos de email y contraseña."
                return render_template("register1.html", error=error, datos=datos_de_registro)
            
            if missing_field == 'nombre' or missing_field == 'apellido_paterno':
                error = "Completa los campos de nombre y apellido paterno."
                return render_template("register2.html", error=error, datos=datos_de_registro)

                
            if missing_field == 'estado' or missing_field == 'ciudad':
                error = "Completa los campos de estado y ciudad."
                return render_template("register3.html", error=error, datos=datos_de_registro)
            
            if missing_field == 'terminos':
                error = "Por favor, acepta los términos y condiciones."
                return render_template("register4.html", error=error, datos=datos_de_registro)
        
        # Encriptar la contraseña
        hashed_password = generate_password_hash(datos_de_registro["password"])
        datos_de_registro["password"] = hashed_password
        
        # Guardar los datos en la base de datos MongoDB
        users_collection.insert_one(datos_de_registro)
        
        # Limpiar la sesión después de guardar los datos
        session.pop("registro_pagina1", None)
        session.pop("registro_pagina2", None)
        session.pop("registro_pagina3", None)
        session.pop("registro_pagina4", None)
        flash("¡Registro exitoso! Ahora puedes iniciar sesión.", "success")
        return redirect(url_for("login"))
    # poner la ruta siguiente
    else:
        datos = helpers.get_register_data()
        return render_template("register4.html", datos=datos)
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
