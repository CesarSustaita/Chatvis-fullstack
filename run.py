from app import app

# TODO: Ajustar SSL en producción
debug = False if app.env_is_prod else True
if __name__ == "__main__":
    app.run(debug=debug , host="0.0.0.0", port=5004, ssl_context='adhoc')