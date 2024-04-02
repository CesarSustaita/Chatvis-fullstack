import requests
import pymongo
from datetime import datetime, timedelta
from werkzeug.security import check_password_hash
import re

def verify_recaptcha(recaptcha_response: str) -> bool:
    """
    Verify the user's response to reCAPTCHA using Google's reCAPTCHA API.

    Args:
        recaptcha_response (str): The user's response to reCAPTCHA.

    Returns:
        bool: True if the reCAPTCHA response is valid, False otherwise.
    """
    
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
    
    if user is None:
        error = "Credenciales incorrectas. Por favor, inténtalo de nuevo."
        return False, error
        
    if user.get("lockout_until") and datetime.now() < user["lockout_until"]:
        error = "Esta cuenta ha sido bloqueada. Por favor, inténtalo de nuevo más tarde."
        return False, error
    
    if not check_password_hash(user["password"], password):
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
            error = "Esta cuenta ha sido bloqueada. Por favor, inténtalo de nuevo más tarde."
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

def is_valid_email(email: str) -> bool:
    """
    Check if the email is valid.
    
    Args:
        email (str): The email to validate.
        
    Returns:
        bool: True if the email is valid, False otherwise.
    """
    # pattern = r'/[A-Z0-9._%+-]+@[A-Z0-9-]+.+.[A-Z]{2,4}/$'
    pattern = r'^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$'
    return re.match(pattern, email) is not None

def is_valid_password(password: str) -> bool:
    """
    Check if the password is valid.
    
    Args:
        password (str): The password to validate.
        
    Returns:
        bool: True if the password is valid, False otherwise.
    """
    if len(password) < 8:
        return False
    
    if not any(char.isupper() for char in password):
        return False
    
    if not any(char.islower() for char in password):
        return False
    
    # Check if the password contains at least one digit or special character
    if not (any(char.isdigit() for char in password) \
        or any(char in "!\"\'#$%&/=?¡|°¨*,.-;:_<>€@¿\{\}[]()" for char in password)):
        return False
    
    # Example of a valid password: "aK#sZ{}x[]"
    return True