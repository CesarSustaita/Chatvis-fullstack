import re

def getMessages(filename):
    messages = []
    
    with open(filename, "r", encoding="utf-8") as file:
        lines = file.readlines()
    
    message = ""
    for line in lines:
        line = line.strip()
        match = re.match(r'(\[\d{1,2}[-/. ]\d{1,2}[-/. ]\d{1,2}(,)?[- ]\d{1,2}[:.]\d{1,2}([:.]\d{1,2})?( (a\.m\.|p\.m\.|AM|PM))?\]|\d{1,2}[-/. ]\d{1,2}[-/. ]\d{1,2}(,)?[- ]\d{1,2}[:.]\d{1,2}([:.]\d{1,2})?( (a\.m\.|p\.m\.|AM|PM))? -)(.*:)?(.*)', 
                        line)
        if match:
            if message:
                messages.append(message)
            
            message = match.groups()[-1].strip()
        else:
            message += line.strip()

    if message:
        messages.append(message)
    
    return messages