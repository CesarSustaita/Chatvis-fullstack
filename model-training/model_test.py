import spacy
from spacy.lang.es.examples import sentences 

nlp = spacy.load("es_core_news_sm")
doc = nlp(sentences[0])
print(doc.text)

for token in doc:
    print(token.text, token.pos_, token.dep_)