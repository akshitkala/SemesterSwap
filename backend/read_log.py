import sys
import codecs

try:
    with codecs.open('error.log', 'r', 'utf-16-le') as f:
        print(f.read())
except Exception as e:
    print(e)
