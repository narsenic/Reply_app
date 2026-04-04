#!/usr/bin/env python3
"""Generate seedAllChapterLessons.ts with lesson content for all 20 chapters."""
import json, unicodedata, re, sys

data = json.load(open('pdf_content.json', encoding='utf-8'))
nfc = {}
for k, v in data.items():
    nfc[unicodedata.normalize('NFC', k)] = v

pdf_keys = [
    '1 Study Notes Nationality  (1).pdf',
    '2 Study Notes  gefalen (1).pdf',
    '3 Study Notes  w\u00e9idoen.pdf',
    '4 Study Notes  Apdikt.pdf',
    '5 Study Notes  An der Stad.pdf',
    '6 Study Notes  Prepo.pdf',
    '7 Study Notes  An der Stad2 .pdf',
    '8 Study Notes  M\u00e4i Program.pdf',
    '9 Study Notes  Haus.pdf',
    '10 Study Notes  Review.pdf',
    '11 Study Notes Perfect hunn.pdf',
    '12 Study Notes Perfect sinn.pdf',
    '13 Study Notes Vakanz.pdf',
    '14 Study Notes Imperfect .pdf',
    '15 Study Notes Kleeder.pdf',
    '16 Study Notes Comparison.pdf',
    '17 Study Notes well.pdf',
    '18 Study Notes w\u00ebllen.pdf',
    '19 Study Notes Reflex v..pdf',
    '20 Study Notes Reflex 2.pdf',
]

chapters = [
    {"t":"Nationaliteit","l":"A1","o":0},
    {"t":"Gefalen","l":"A1","o":1},
    {"t":"Weidoen","l":"A1","o":2},
    {"t":"Apdikt","l":"A1","o":3},
    {"t":"An der Stad","l":"A1","o":4},
    {"t":"Prepo","l":"A1","o":5},
    {"t":"An der Stad 2","l":"A1","o":6},
    {"t":"Mai Program","l":"A1","o":7},
    {"t":"Haus","l":"A1","o":8},
    {"t":"Revisioun","l":"A1","o":9},
    {"t":"Perfect mat hunn","l":"A2","o":0},
    {"t":"Perfect mat sinn","l":"A2","o":1},
    {"t":"Vakanz","l":"A2","o":2},
    {"t":"Imperfect","l":"A2","o":3},
    {"t":"Kleeder","l":"A2","o":4},
    {"t":"Verglaich","l":"A2","o":5},
    {"t":"Well","l":"A2","o":6},
    {"t":"Wellen","l":"A2","o":7},
    {"t":"Reflexiv Verben 1","l":"A2","o":8},
    {"t":"Reflexiv Verben 2","l":"A2","o":9},
]

def clean(t):
    t = t.replace(chr(0), '')
    t = re.sub(r'\u00a9\s*Luxembourgish with Anne[.\s]*All Rights reserved\s*\d*', '', t)
    t = re.sub(r'Easy Luxembourgish\s+Level \d', '', t)
    t = re.sub(r'Eas\\\s*Lu\[embourgish\s+LeYel \d', '', t)
    t = re.sub(r'Lesson\s*notes\s*LESSON\s*NOTES', '', t)
    t = re.sub(r'Lesson\s+\d+\s+Study\s+notes', '', t)
    t = re.sub(r'Lesson\s+Study\s+notes', '', t)
    t = re.sub(r'LeVVRn\s+nRWeV', '', t)
    t = re.sub(r'\s+', ' ', t)
    return t.strip()

def get_pdf(idx):
    nk = unicodedata.normalize('NFC', pdf_keys[idx])
    return clean(nfc[nk])

def esc(s):
    return s.replace('\\','\\\\').replace('"','\\"').replace("'","\\'").replace('\n','\\n').replace('\r','')

def make_grammar_html(raw, title):
    c = raw[:2500]
    ld = c.rfind('.')
    if ld > 1200: c = c[:ld+1]
    sents = [s.strip() for s in re.split(r'(?<=[.!?])\s+', c) if len(s.strip())>5]
    h = f'<h3>{title} - Grammar</h3>'
    for s in sents[:18]:
        h += f'<p>{s}</p>'
    return h

def make_reading_html(raw, title):
    c = raw[:2000]
    ld = c.rfind('.')
    if ld > 800: c = c[:ld+1]
    sents = [s.strip() for s in re.split(r'(?<=[.!?])\s+', c) if len(s.strip())>5]
    h = f'<h3>{title} - Reading</h3>'
    for s in sents[:14]:
        h += f'<p>{s}</p>'
    return h

def make_listening_html(raw, title):
    mid = len(raw)//3
    c = raw[mid:mid+1500]
    ld = c.rfind('.')
    if ld > 400: c = c[:ld+1]
    sents = [s.strip() for s in re.split(r'(?<=[.!?])\s+', c) if len(s.strip())>5]
    h = f'<h3>{title} - Listening Transcript</h3>'
    for s in sents[:12]:
        h += f'<p>{s}</p>'
    return h

def make_speaking_html(raw, title):
    end = len(raw)
    start = max(0, end - 1500)
    c = raw[start:end][:1200]
    ld = c.rfind('.')
    if ld > 300: c = c[:ld+1]
    sents = [s.strip() for s in re.split(r'(?<=[.!?])\s+', c) if len(s.strip())>5]
    h = f'<h3>{title} - Speaking Practice</h3><p>Practice these phrases out loud:</p>'
    for s in sents[:10]:
        h += f'<p>{s}</p>'
    return h

print("Functions loaded, generating exercises...", file=sys.stderr)
