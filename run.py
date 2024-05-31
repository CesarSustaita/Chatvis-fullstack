from app import app

# TODO: Ajustar SSL en producción

if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=5004, ssl_context='adhoc')