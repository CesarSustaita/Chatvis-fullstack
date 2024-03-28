import requests

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