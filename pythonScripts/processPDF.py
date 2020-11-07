import requests
import sys
from nltk.tokenize import RegexpTokenizer
from pathlib import Path
import requests
from nltk.tokenize import RegexpTokenizer
import PyPDF2


def processPDF(inputURL):
    copyPath = Path().absolute().joinpath('testPDF.pdf')

    # Download and Save
    document = requests.get(inputURL, allow_redirects=True)
    open(copyPath, 'wb').write(document.content)

    # Open PDF
    pdfFileObj = open(copyPath, 'rb')
    pdfReader = PyPDF2.PdfFileReader(pdfFileObj)

    # Extract Text
    pdfTexts = []
    for i in range(pdfReader.numPages):
        page = pdfReader.getPage(i)
        pageText = page.extractText()
        pageText.replace(' ', '')
        pageText.replace('\n \n', ' ')
        pageText.replace('\n', '')
        pdfTexts.append(pageText)

    pdfTexts = ''.join(pdfTexts)

    # Pre-process Text
    global textsTokenized
    tokenizer = RegexpTokenizer(r'\w+')
    textsTokenized = tokenizer.tokenize(pdfTexts)
    for i in range(len(textsTokenized)):
        textsTokenized[i].lstrip(' ')
    s = " "
    texts = s.join(textsTokenized)

    return texts


def main():
    print(processPDF(sys.argv[1]))


if __name__ == '__main__':
    main()
