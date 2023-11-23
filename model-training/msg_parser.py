import re

def getMessages(filename):
    messages = []
    with open(filename, "r", encoding="utf-8") as file:
        lines = file.readlines()
    
    message = ""
    for line in lines:
        if re.match(r'\[\d{2}/\d{2}/\d{2} \d{2}:\d{2}:\d{2}\]', line):
            if message:
                messages.append(message)
            
            message = line.strip()
        else:
            message += line.strip()

    if message:
        messages.append(message)
    
    return messages