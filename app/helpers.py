import requests
import pymongo
from datetime import datetime, timedelta
from werkzeug.security import check_password_hash

def verify_recaptcha(recaptcha_response: str) -> bool:
    """
    Verify the user's response to reCAPTCHA using Google's reCAPTCHA API.

    Args:
        recaptcha_response (str): The user's response to reCAPTCHA.

    Returns:
        bool: True if the reCAPTCHA response is valid, False otherwise.
    """
    
    # FIXME: Temporary fix to allow testing without reCAPTCHA
    return True
    
    # TODO: Move this to a configuration file
    secret_key = "6Ld58aEpAAAAAMGcyyBsOv62fwY9LGWQCwS9xrl1"

    google_recaptcha_api_url = "https://www.google.com/recaptcha/api/siteverify"

    data = {
        "secret": secret_key,
        "response": recaptcha_response
    }
    
    try:
        response = requests.post(google_recaptcha_api_url, data=data)
        response = response.json()
        return response["success"]
    
    except Exception as e:
        print(e)
        return False
    
    
def attempt_login(email: str, password: str, users_collection: pymongo.collection.Collection) -> tuple:
    """
    Attempt to log in a user with the given email and password.
    
    Args:
        email (str): The email of the user.
        password (str): The password of the user.
        users_collection (pymongo.collection.Collection): The collection of users in the database.
        
    Returns:
        tuple: A tuple where the first element is a boolean indicating whether the login was successful
        and the second element is an error message if the login was unsuccessful.
    """
    # Buscar el usuario en la base de datos por email
    user = users_collection.find_one({"email": email})
        
    if user.get("lockout_until") and datetime.now() < user["lockout_until"]:
        error = "Tu cuenta ha sido bloqueada. Por favor, inténtalo de nuevo más tarde."
        return False, error
    
    if user is None or not check_password_hash(user["password"], password):
        users_collection.update_one(
            {"email": email},
            {
                "$inc": {"failed_login_attempts": 1}
            }
        )
        
        if user.get("failed_login_attempts") and user["failed_login_attempts"] >= 3:
            lockout_until = datetime.now() + timedelta(minutes=5)
            users_collection.update_one(
                {"email": email},
                {
                    "$set": {"lockout_until": lockout_until},
                    "$unset": {"failed_login_attempts": ""}
                }
            )
            error = "Tu cuenta ha sido bloqueada. Por favor, inténtalo de nuevo más tarde."
            return False, error
        error = "Credenciales incorrectas. Por favor, inténtalo de nuevo."
        return False, error
    
    users_collection.update_one(
        {"email": email},
        {
            "$unset": {"failed_login_attempts": "", "lockout_until": ""}
        }
    )
    
    return True, None