import spacy
import sys

nlp = spacy.load('output/3cats/model-best')

msg = sys.argv[1]
doc = nlp(msg)

cat_scores = doc.cats
predicted_cat = max(cat_scores, key=cat_scores.get)
print("Input: ", msg)
print(cat_scores)
print("Predicted: ", predicted_cat)
print("\n\n")
