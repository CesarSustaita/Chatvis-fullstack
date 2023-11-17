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


msgs_code = msg_parser.getMessages('training-data/codigo.txt')
msgs_logistica = msg_parser.getMessages('training-data/logistica.txt')
msgs_intrascendente = msg_parser.getMessages('training-data/intrascendente.txt')

msgs = [(text, "Codigo") for text in msgs_code] + \
        [(text, "Logistica") for text in msgs_logistica] + \
        [(text, "Intrascendente") for text in msgs_intrascendente]

random.shuffle(msgs)

count_training = int(len(msgs) * 0.75)

training_msgs = msgs[:count_training]
validatn_msgs = msgs[count_training:]

train_docs = processDocs(training_msgs)
valid_docs = processDocs(validatn_msgs)

doc_bin_t = DocBin(docs=train_docs)
doc_bin_t.to_disk('./BinDocs/train.spacy')

doc_bin_v = DocBin(docs=valid_docs)
doc_bin_v.to_disk('./BinDocs/valid.spacy')