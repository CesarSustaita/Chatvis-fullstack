import spacy
from spacy.tokens import DocBin
import msg_parser
# from spacy.pipeline.textcat import Config, single_label_cnn_config
import random
from spacy.util import minibatch

nlp = spacy.load("es_dep_news_trf")

def processDocs(messages):
    docs = []
    for doc, label in nlp.pipe(messages, as_tuples=True):
        doc.cats[label] = 1
        docs.append(doc)
    return docs


msgs_code = msg_parser.getMessages('model-training/training-data/codigo.txt')
msgs_logistica = msg_parser.getMessages('model-training/training-data/logistica.txt')
msgs_intrascendente = msg_parser.getMessages('model-training/training-data/intrascendente.txt')

msgs_code = [(text, "Codigo") for text in msgs_code]
msgs_logistica = [(text, "Logistica") for text in msgs_logistica]
msgs_intrascendente = [(text, "Intrascendente") for text in msgs_intrascendente]

random.shuffle(msgs_code)
random.shuffle(msgs_logistica)
random.shuffle(msgs_intrascendente)

training_percentage = 0.77

count_training_code = int(len(msgs_code) * training_percentage)
count_training_logistica = int(len(msgs_logistica) * training_percentage)
count_training_intrascendente = int(len(msgs_intrascendente) * training_percentage)

training_msgs_code = msgs_code[:count_training_code]
validatn_msgs_code = msgs_code[count_training_code:]

training_msgs_logistica = msgs_logistica[:count_training_logistica]
validatn_msgs_logistica = msgs_logistica[count_training_logistica:]

training_msgs_intrascendente = msgs_intrascendente[:count_training_intrascendente]
validatn_msgs_intrascendente = msgs_intrascendente[count_training_intrascendente:]

# Combine all training and validation messages
training_msgs = training_msgs_code + training_msgs_logistica + training_msgs_intrascendente
validatn_msgs = validatn_msgs_code + validatn_msgs_logistica + validatn_msgs_intrascendente

# Process the documents
train_docs = processDocs(training_msgs)
valid_docs = processDocs(validatn_msgs)

doc_bin_t = DocBin(docs=train_docs)
doc_bin_t.to_disk('model-training/BinDocs2/train.spacy')

doc_bin_v = DocBin(docs=valid_docs)
doc_bin_v.to_disk('model-training/BinDocs2/valid.spacy')