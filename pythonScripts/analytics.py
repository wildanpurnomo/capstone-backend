import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import json
import sys


def Vectorizing(input, similarity):
    similarityArray = {}
    vectorizer = TfidfVectorizer(input=input, analyzer='word', ngram_range=(4, 4),
                                 min_df=0, stop_words='english')
    tfidf_matrix = vectorizer.fit_transform(input)
    J = cosine_similarity(tfidf_matrix)

    # Format the TF-IDF table into the pd.DataFrame format.
    vocab = vectorizer.get_feature_names()
    documents_tfidf_lol = [{word: tfidf_value for word, tfidf_value in zip(vocab, sent)}
                           for sent in tfidf_matrix.toarray()]

    documents_tfidf = pd.DataFrame(documents_tfidf_lol)
    documents_tfidf.fillna(0, inplace=True)

    x = 0
    for i in range(len(J)):
        for j in range(len(J[i])):
            if J[i][j] > similarity and i != j:
                updateArray = {x+1: {'index': {i, j},
                                     'similarity': "{:.2%}".format(J[i][j])}}
                x += 1
                similarityArray.update(updateArray)

    result = {}
    for key, value in similarityArray.items():
        if value not in result.values():
            result[key] = value

    if bool(result) == False:
        result = 'Tidak ada kalimat yang mirip'

    return result


def main():
    input_object = json.loads(sys.argv[1])
    threshold = sys.argv[2]
    print(Vectorizing(input_object["values"], float(threshold)))


if __name__ == '__main__':
    main()
