from app import app
from flask import jsonify
from flask import render_template, redirect, url_for, request, session, flash
from pymongo import MongoClient
# from bson import ObjectId
# from flask import send_from_directory
from app import helpers
from werkzeug.security import generate_password_hash
from werkzeug.exceptions import BadRequest
from datetime import timedelta, datetime

app.secret_key = app.config['SECRET_KEY']
client = MongoClient(
    "mongodb+srv://lj:lj12345@cluster0.jil1xg7.mongodb.net/?retryWrites=true&w=majority"
)
db = client["test"]
users_collection = db["users"]

prefix = app.prefix

# Indice
# inicio() - /inicio
# index() - /
# login() - /login
# dashboard() - /dashboard
# logout() - /logout
# register_mail() - /register/mail
# register_account() - /register/account
# register_state() - /register/state
# register_u() - /register/u
# tabla_admin() - /tabla
# eliminar_usuario(email) - /eliminar_usuario/<string:email
# classify_message() - /classify

#################################
######      Main routes

@app.route(f"/{prefix}/inicio")
def inicio():
    return render_template("inicio.html")

@app.route(f"/{prefix}/")
def index():
    return redirect(url_for("inicio"))


#################################
######      Admin routes

@app.route(f"/{prefix}/admin/dashboard")
def admin_dashboard():
    if "logged_in" in session and session.get("admin") == 1:
        return redirect(url_for("dashboard"))
    else:
        flash("Acceso no autorizado.", "warning")
        return redirect(url_for("inicio"))

@app.route(f"/{prefix}/admin/tabla_usuarios")
def admin_tabla():
    if "logged_in" in session and session.get("admin") == 1:
        email = session.get("email")
        name = session.get("name")
        admin = session.get("admin")
        usuarios = list(users_collection.find())
        for i, usuario in enumerate(usuarios, start=1):
            usuario["contador"] = i
        switchTab = 'usuarios'
        return render_template("admin_tabla_usuarios.html", users=usuarios, mail=email, name=name, admin=admin, switchTab=switchTab, hideNavBarUsuarios=True)
    else:
        flash("Acceso no autorizado.", "warning")
        return redirect(url_for("inicio"))
    
@app.route(f"/{prefix}/admin/delete_user", methods=["POST"])
def admin_delete_user():
    if "logged_in" in session and session.get("admin") == 1:
        email = request.form.get("email")
        
        # Verificar si el email es string y válido para evitar NoSQL Injection
        if not isinstance(email, str) or not helpers.is_valid_email(email):
            flash("Error: el email no es válido.", "error")
            return redirect(url_for("admin_tabla"))
        
        # Verificar si el email es de un usuario registrado
        user = users_collection.find_one({"email": email})
        if user is None:
            flash("Error: el usuario no existe.", "error")
            return redirect(url_for("admin_tabla"))
        
        # Verificar que el usuario que se quiere eliminar no es admin
        if user.get("admin") == 1:
            flash("Esta cuenta no se puede eliminar.", "warning")
            return redirect(url_for("admin_tabla"))
        
        try:
            # Eliminar el usuario de la base de datos
            result = users_collection.delete_one({"email": email})
            if result.deleted_count == 0:
                flash("Error: la cuenta no se pudo eliminar.", "error")
                return redirect(url_for("admin_tabla"))
            else:
                flash("Usuario eliminado con éxito.", "success")
                return redirect(url_for("admin_tabla"))
        except Exception as e:
            error_msg = "Error: " + str(e)
            flash(error_msg, "error")
            return redirect(url_for("admin_tabla"))
    else:
        flash("Acceso no autorizado.", "warning")
        return render_template("login.html", site_key=app.recaptcha_site_key)


#################################
######      App routes

@app.route(f"/{prefix}/dashboard")
def dashboard():
    if "logged_in" in session:
        email = session.get("email")  # Obtener el email del usuario desde la sesión
        name = session.get("name")  # Obtener el nombre del usuario desde la sesión
        admin = session.get("admin")  # Obtener el admin del usuario desde la sesión
        switchTab = 'analisis'
        return render_template("upload_file.html", email=email, name=name, admin=admin, switchTab=switchTab, hideNavBarCargarArchivo=True)
    else:
        flash("Inicia sesión para acceder al dashboard.", "warning")
        return redirect(url_for("login"))

@app.route(f"/{prefix}/analisis", methods=["GET"])
def analisis():
    if "logged_in" in session:
        email = session.get("email")
        name = session.get("name")
        admin = session.get("admin")
        switchTab = 'analisis'
        return render_template("analisis.html", email=email, name=name, admin=admin, switchTab=switchTab, hideNavBarAnalisis=True)
    else:
        flash("Inicia sesión para acceder al dashboard.", "warning")
        return redirect(url_for("login"))
    

#################################
######      Reroute routes

@app.route(f"/{prefix}/no_file", methods=["GET"])
def no_file():
    if "logged_in" in session:
        flash("Carga un chat para analizarlo.", "info")
        return redirect(url_for("dashboard"))
    else:
        flash("Inicia sesión para acceder.", "warning")
        return redirect(url_for("login"))

@app.route(f"/{prefix}/chat_deleted", methods=["GET"])
def chat_deleted():
    if "logged_in" in session:
        flash("El chat se eliminó correctamente.", "success")
        return redirect(url_for("dashboard"))
    else:
        flash("Inicia sesión para acceder.", "warning")
        return redirect(url_for("login"))

@app.route(f"/{prefix}/no_messages", methods=["GET"])
def no_messages():
    if "logged_in" in session:
        flash("El archivo no contiene mensajes de WhatsApp.", "error")
        return redirect(url_for("dashboard"))
    else:
        flash("Inicia sesión para acceder.", "warning")
        return redirect(url_for("login"))


#################################
######      Auth routes

@app.route(f"/{prefix}/login", methods=["GET", "POST"])
def login():
    if request.method == "POST":
        recaptcha_response = request.form.get("g-recaptcha-response")
        recaptcha_verified = helpers.verify_recaptcha(recaptcha_response)
        if not recaptcha_verified:
            error = "No pudimos verificar que no eres un robot."
            return render_template("login.html", error=error, site_key=app.recaptcha_site_key)
        email = request.form.get("email")
        password = request.form.get("password")
        login_successful, error = helpers.attempt_login(
            email, password, users_collection
        )
        if login_successful:
            user = users_collection.find_one({"email": email})
            # Iniciar sesión
            users_collection.update_one(
                {"email": email},
                {"$set": {"num_uso": user.get("num_uso") + 1,
                            "last_login": datetime.now().strftime("%d-%m-%Y %H:%M:%S")}},
            )
            session.permanent = True
            session["logged_in"] = True
            session["email"] = email
            session["name"] = user.get("nombre")
            session["admin"] = user.get("admin")
            flash("Has iniciado sesión exitosamente.", "success")
            return redirect(url_for("dashboard"))
        else:
            return render_template("login.html", error=error, site_key=app.recaptcha_site_key)
    else:
        return render_template("login.html", site_key=app.recaptcha_site_key)

@app.route(f"/{prefix}/logout", methods=["GET", "POST"])
def logout():
    app.config["PERMANENT_SESSION_LIFETIME"] = timedelta(seconds=0)
    session.pop("logged_in", None)
    session.pop("email", None)
    session.pop("name", None)
    info = "Has cerrado sesión exitosamente."
    return render_template("inicio.html", info=info)


#################################
######      Register routes

@app.route(f"/{prefix}/register/mail", methods=["GET", "POST"])
def register_mail():
    if request.method == "POST":
        # Validar Recaptcha
        recaptcha_response = request.form.get("g-recaptcha-response")
        recaptcha_verified = helpers.verify_recaptcha(recaptcha_response)
        if not recaptcha_verified:
            error = "No pudimos verificar que no eres un robot."
            return render_template("register1.html", error=error, datos=[], site_key=app.recaptcha_site_key)
        
        # Validar datos del formulario
        email = request.form.get("email")
        password = request.form.get("password")
        password_verify = request.form.get("password_verify")
        datos_existentes = helpers.get_register_data()
        if not email or not password or not password_verify:
            warning = "Por favor, completa todos los campos."
            return render_template(
                "register1.html", warning=warning, datos=datos_existentes, site_key=app.recaptcha_site_key
            )
        if not helpers.is_valid_email(email):
            warning = "Por favor, introduce un email válido."
            return render_template(
                "register1.html", warning=warning, datos=datos_existentes, site_key=app.recaptcha_site_key
            )
        if not helpers.is_valid_password(password):
            warning = "La contraseña debe tener al menos 8 caracteres, una letra mayúscula, una letra minúscula y un número o caracter especial."
            return render_template(
                "register1.html", warning=warning, datos=datos_existentes, site_key=app.recaptcha_site_key
            )
        if password != password_verify:
            warning = "Las contraseñas no coinciden."
            return render_template(
                "register1.html", warning=warning, datos=datos_existentes, site_key=app.recaptcha_site_key
            )
        # Verificar si el email ya está registrado
        user = users_collection.find_one({"email": email})
        if user:
            error = "La dirección de email no está disponible."
            return render_template(
                "register1.html", error=error, datos=datos_existentes, site_key=app.recaptcha_site_key
            )
        # Obtener los datos del formulario
        datos = request.form.to_dict()
        # Eliminar campos no necesarios
        datos.pop("password_verify", None)
        datos.pop("g-recaptcha-response", None)
        # Almacenar los datos en la sesión
        session["registro_pagina1"] = datos
        datos_existentes = helpers.get_register_data()
        return render_template("register2.html", datos=datos_existentes, site_key=app.recaptcha_site_key)
    else:
        datos = helpers.get_register_data()
        return render_template("register1.html", datos=datos, site_key=app.recaptcha_site_key)


@app.route(f"/{prefix}/register/account", methods=["GET", "POST"])
def register_account():
    if request.method == "POST":
        # Validar Recaptcha
        recaptcha_response = request.form.get("g-recaptcha-response")
        recaptcha_verified = helpers.verify_recaptcha(recaptcha_response)
        if not recaptcha_verified:
            error = "No pudimos verificar que no eres un robot."
            return render_template("register2.html", error=error, datos=[], site_key=app.recaptcha_site_key)
        
        # Validar datos del formulario
        nombre = request.form.get("nombre")
        apellido_paterno = request.form.get("apellido_paterno")
        apellido_materno = request.form.get("apellido_materno")
        datos_existentes = helpers.get_register_data()
        if not nombre or not apellido_paterno:
            warning = "Por favor, completa los campos requeridos."
            return render_template(
                "register2.html", warning=warning, datos=datos_existentes, site_key=app.recaptcha_site_key
            )
        if not helpers.is_valid_name(nombre):
            warning = "Por favor, introduce un nombre válido."
            return render_template(
                "register2.html", warning=warning, datos=datos_existentes, site_key=app.recaptcha_site_key
            )
        if not helpers.is_valid_name(apellido_paterno):
            warning = "Por favor, introduce un apellido paterno válido."
            return render_template(
                "register2.html", warning=warning, datos=datos_existentes, site_key=app.recaptcha_site_key
            )
        if apellido_materno and not helpers.is_valid_name(apellido_materno):
            warning = "Por favor, introduce un apellido materno válido."
            return render_template(
                "register2.html", warning=warning, datos=datos_existentes, site_key=app.recaptcha_site_key
            )
        # Obtener los datos del formulario
        datos = request.form.to_dict()
        # Eliminar campos no necesarios
        datos.pop("g-recaptcha-response", None)
        # Almacenar los datos en la sesión
        session["registro_pagina2"] = datos
        datos_existentes = helpers.get_register_data()
        return render_template("register3.html", datos=datos_existentes, site_key=app.recaptcha_site_key)
    else:
        # datos = session.get("registro_pagina1", {})
        datos = helpers.get_register_data()
        return render_template("register2.html", datos=datos, site_key=app.recaptcha_site_key)


@app.route(f"/{prefix}/register/state", methods=["GET", "POST"])
def register_state():
    if request.method == "POST":
        # Validar Recaptcha
        recaptcha_response = request.form.get("g-recaptcha-response")
        recaptcha_verified = helpers.verify_recaptcha(recaptcha_response)
        if not recaptcha_verified:
            error = "No pudimos verificar que no eres un robot."
            return render_template("register3.html", error=error, datos=[], site_key=app.recaptcha_site_key)
        
        # Validar datos del formulario
        estado = request.form.get("estado")
        ciudad = request.form.get("ciudad")
        datos_existentes = helpers.get_register_data()
        if not estado or not ciudad:
            warning = "Por favor, completa los campos requeridos."
            return render_template(
                "register3.html", warning=warning, datos=datos_existentes, site_key=app.recaptcha_site_key
            )
        if not helpers.is_valid_estado(estado):
            warning = "Por favor, introduce un estado válido."
            return render_template(
                "register3.html", warning=warning, datos=datos_existentes, site_key=app.recaptcha_site_key
            )
        if not helpers.is_valid_ciudad(ciudad):
            warning = "Por favor, introduce una ciudad válida."
            return render_template(
                "register3.html", warning=warning, datos=datos_existentes, site_key=app.recaptcha_site_key
            )
        # Obtener los datos del formulario
        datos = request.form.to_dict()
        # Eliminar campos no necesarios
        datos.pop("g-recaptcha-response", None)
        # Almacenar los datos en la sesión
        session["registro_pagina3"] = datos
        datos_existentes = helpers.get_register_data()
        return render_template("register4.html", datos=datos_existentes, site_key=app.recaptcha_site_key)
    else:
        datos = helpers.get_register_data()
        return render_template("register3.html", datos=datos, site_key=app.recaptcha_site_key)


@app.route(f"/{prefix}/register/u", methods=["GET", "POST"])
def register_u():
    if request.method == "POST":
        # Validar Recaptcha
        recaptcha_response = request.form.get("g-recaptcha-response")
        recaptcha_verified = helpers.verify_recaptcha(recaptcha_response)
        if not recaptcha_verified:
            error = "No pudimos verificar que no eres un robot."
            return render_template("register4.html", error=error, datos=[], site_key=app.recaptcha_site_key)
        
        # Validar datos del formulario
        universidad = request.form.get("universidad")
        terminos = request.form.get("terminos")
        datos_existentes = helpers.get_register_data()
        if universidad and not helpers.is_valid_universidad(universidad):
            warning = "Por favor, introduce un nombre válido de tu universidad."
            return render_template(
                "register4.html", warning=warning, datos=datos_existentes, site_key=app.recaptcha_site_key
            )
        if terminos != "accepted":
            warning = "Por favor, acepta los términos y condiciones."
            return render_template(
                "register4.html", warning=warning, datos=datos_existentes, site_key=app.recaptcha_site_key
            )
        # Obtener los datos del formulario
        datos = request.form.to_dict()
        # Eliminar campos no necesarios
        datos.pop("g-recaptcha-response", None)
        # Almacenar los datos en la sesión
        session["registro_pagina4"] = datos
        fecha_formateada = datetime.now().strftime("%d-%m-%Y %H:%M:%S")
        # Recopilar todos los datos de la sesión
        datos_de_registro = {
            **session.get("registro_pagina1", {}),
            **session.get("registro_pagina2", {}),
            **session.get("registro_pagina3", {}),
            **datos,
            "admin": 0,
            "num_uso": 0,
            "date": fecha_formateada,
        }
        complete, missing_field = helpers.register_data_is_complete(datos_de_registro)
        if not complete:
            if missing_field == "email" or missing_field == "password":
                warning = "Completa los campos de email y contraseña."
                return render_template(
                    "register1.html", warning=warning, datos=datos_de_registro, site_key=app.recaptcha_site_key
                )
            if missing_field == "nombre" or missing_field == "apellido_paterno":
                warning = "Completa los campos de nombre y apellido paterno."
                return render_template(
                    "register2.html", warning=warning, datos=datos_de_registro, site_key=app.recaptcha_site_key
                )
            if missing_field == "estado" or missing_field == "ciudad":
                warning = "Completa los campos de estado y ciudad."
                return render_template(
                    "register3.html", warning=warning, datos=datos_de_registro, site_key=app.recaptcha_site_key
                )
            if missing_field == "terminos":
                warning = "Por favor, acepta los términos y condiciones."
                return render_template(
                    "register4.html", warning=warning, datos=datos_de_registro, site_key=app.recaptcha_site_key
                )
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
    else:
        datos = helpers.get_register_data()
        return render_template("register4.html", datos=datos, site_key=app.recaptcha_site_key)


#################################
######      Data routes

@app.route(f"/{prefix}/classify", methods=["POST"])
def classify_message():
    try:
        scores = app.nlp(request.json["message"]).cats
        category = max(scores, key=scores.get)
        score_values = {k: round(v, 2) for k, v in scores.items()}
        return jsonify({"category": category, "scores": score_values})
    except Exception as e:
        return jsonify({"error": str(e)})

@app.route(f"/{prefix}/new_analisis", methods=["PUT"])
def new_analisis():
    if request.method == "PUT" and "logged_in" in session:
        counter = request.json.get("counter")
        if counter is not None and int(counter) >= 0:
            email = session.get("email")
            user = users_collection.find_one({"email": email})
            current_counter = user.get("count_analisis")
            current_counter = current_counter if current_counter is not None else 0
            users_collection.update_one(
                {"email": email},
                {"$set": {"count_analisis": current_counter + 1}},
            )
            return jsonify({"status": "OK"})
        else:
            raise BadRequest("Bad Request")
    else:
        raise BadRequest("Bad Request")
    

#################################
######      Deprecated routes

#### Deprecated
@app.route(f"/{prefix}/tabla")
def tabla_admin():
    if "logged_in" in session and session.get("admin") == 1:
        email = session.get("email")  # Obtener el email del usuario desde la sesión
        name = session.get("name")  # Obtener el nombre del usuario desde la sesión
        admin = session.get("admin")  # Is admin?
        permission = session.get("name")
        usuarios = list(users_collection.find())

        # Agregar un contador a cada usuario
        for i, usuario in enumerate(usuarios, start=1):
            usuario["contador"] = i

        return render_template(
            "tabla_admin.html", users=usuarios, mail=email, name=name, admin=admin
        )
    else:
        return render_template("login.html", site_key=app.recaptcha_site_key)

#### Deprecated
@app.route(f"/{prefix}/eliminar_usuario/<string:email>", methods=["GET", "POST"])
def eliminar_usuario(email):
    if "logged_in" in session and session.get("admin") == 1:
        # Eliminar el usuario de la base de datos
        users_collection.delete_one({"email": email})
        flash("Usuario eliminado con éxito.", "success")
        return redirect(url_for("tabla_admin"))
    else:
        return render_template("login.html", site_key=app.recaptcha_site_key)


#################################
######      Other functions

def get_prefixed_static(filename):
    prefix = "chatvis2024"
    return f"/{prefix}/static/{filename}"