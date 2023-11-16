#start by importing boto3 library
import boto3

#setup client object
client = boto3.client('comprehend')

#specify endpoint arn
endpointarn = "arn:aws:comprehend:us-east-2:038610837455:document-classifier-endpoint/newtextcassifier"

#text for inference
#txt = "hola xddxxd "

with open('./chat(1).txt', 'r', encoding='utf-8') as file:
    txt = file.read()

#call api and store response
response=client.classify_document(Text=txt,EndpointArn=endpointarn)

#show results
print('hola mundo')
response['Classes']