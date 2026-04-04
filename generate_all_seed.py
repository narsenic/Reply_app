#!/usr/bin/env python3
"""
Generate seedChapterContent.ts from extracted PDF content for all 20 chapters.
Each chapter gets 4 lessons (grammar, reading, listening, speaking) with exercises.
"""
import json
import re
import os

def esc(s):
    """Escape string for TypeScript string literal."""
    return (s.replace('\\', '\\\\')
             .replace('"', '\\"')
             .replace("'", "\\'")
             .replace('\n', '\\n')
             .replace('\r', ''))

def clean_text(s):
    """Clean extracted PDF text."""
    s = re.sub(r'©.*?All Rights reserved\d*', '', s)
    s = re.sub(r'Easy Luxembourgish\s+Level \d+', '', s)
    s = re.sub(r'Lesson \d+ Study notes', '', s)
    s = re.sub(r'Lesson notesLESSON NOTES', '', s)
    s = re.sub(r'Lesson Study notes', '', s)
    s = re.sub(r'LeVVRn nRWeV.*?NOTES', '', s)  # OCR artifacts
    s = re.sub(r'Eas\\\s*Lu\[embourgish.*?LeYel \d+', '', s)
    s = re.sub(r'\s+', ' ', s).strip()
    return s

def extract_sentences(text):
    """Extract Luxembourgish example sentences from text."""
    sentences = []
    # Pattern: Luxembourgish sentence followed by English translation
    patterns = [
        r'([A-ZËÉÄÖÜ][^.!?]*?(?:\.|\!|\?))\s+([A-Z][^.!?]*?(?:\.|\!|\?))',
    ]
    # Look for lines with Luxembourgish words
    lb_words = ['ech', 'mir', 'dir', 'hien', 'hatt', 'si', 'sinn', 'hunn', 'ass', 'geet', 'kommen', 'schwätzen']
    for line in text.split('.'):
        line = line.strip()
        if any(w in line.lower() for w in lb_words) and len(line) > 10 and len(line) < 200:
            sentences.append(line.strip() + '.')
    return sentences[:20]

def extract_vocabulary(text):
    """Extract vocabulary pairs from text."""
    vocab = []
    # Pattern: word = translation or word means translation
    for m in re.finditer(r'(\b\w+\b)\s+(?:=|means|is)\s+"([^"]+)"', text):
        vocab.append((m.group(1), m.group(2)))
    for m in re.finditer(r'"(\w+)"\s+(?:=|means|which means)\s+"([^"]+)"', text):
        vocab.append((m.group(1), m.group(2)))
    # Pattern: word (translation)
    for m in re.finditer(r'(\b[A-ZËÉÄÖÜ]\w+\b)\s+\(([^)]+)\)', text):
        if len(m.group(2)) < 50:
            vocab.append((m.group(1), m.group(2)))
    return vocab[:30]

# Load extracted PDF content
with open('pdf_content.json', 'r', encoding='utf-8') as f:
    pdf_data = json.load(f)

# Chapter definitions
CHAPTERS = [
    {"file": "1 Study Notes Nationality  (1).pdf", "level": "A1", "order": 0, "title": "Nationaliteit", "topic": "Nationalities and introductions", "desc": "Introducing yourself, saying where you are from, nationalities"},
    {"file": "2 Study Notes  gefalen (1).pdf", "level": "A1", "order": 1, "title": "Gefalen", "topic": "Likes and dislikes", "desc": "Expressing likes, dislikes, and preferences"},
    {"file": "3 Study Notes  wéidoen.pdf", "level": "A1", "order": 2, "title": "Weidoen", "topic": "Health and body parts", "desc": "Talking about pain, health issues, and body parts"},
    {"file": "4 Study Notes  Apdikt.pdf", "level": "A1", "order": 3, "title": "Apdikt", "topic": "At the pharmacy", "desc": "At the pharmacy, buying medicine, describing symptoms"},
    {"file": "5 Study Notes  An der Stad.pdf", "level": "A1", "order": 4, "title": "An der Stad", "topic": "In the city and directions", "desc": "In the city, asking for and giving directions"},
    {"file": "6 Study Notes  Prepo.pdf", "level": "A1", "order": 5, "title": "Prepo", "topic": "Prepositions", "desc": "Prepositions of place and movement"},
    {"file": "7 Study Notes  An der Stad2 .pdf", "level": "A1", "order": 6, "title": "An der Stad 2", "topic": "Shops and opening hours", "desc": "More city vocabulary, shops, and public places"},
    {"file": "8 Study Notes  Mäi Program.pdf", "level": "A1", "order": 7, "title": "Mai Program", "topic": "Daily routine", "desc": "Daily routine, schedule, telling the time"},
    {"file": "9 Study Notes  Haus.pdf", "level": "A1", "order": 8, "title": "Haus", "topic": "House and rooms", "desc": "House, rooms, furniture, and household items"},
    {"file": "10 Study Notes  Review.pdf", "level": "A1", "order": 9, "title": "Revisioun", "topic": "Review chapters 1-9", "desc": "Review and revision of chapters 1 through 9"},
    {"file": "11 Study Notes Perfect hunn.pdf", "level": "A2", "order": 0, "title": "Perfect mat hunn", "topic": "Perfect tense with hunn", "desc": "Past tense (Perfekt) formed with the auxiliary verb hunn"},
    {"file": "12 Study Notes Perfect sinn.pdf", "level": "A2", "order": 1, "title": "Perfect mat sinn", "topic": "Perfect tense with sinn", "desc": "Past tense (Perfekt) formed with the auxiliary verb sinn"},
    {"file": "13 Study Notes Vakanz.pdf", "level": "A2", "order": 2, "title": "Vakanz", "topic": "Vacation and travel", "desc": "Vacation, travel plans, booking accommodation"},
    {"file": "14 Study Notes Imperfect .pdf", "level": "A2", "order": 3, "title": "Imperfect", "topic": "Imperfect tense", "desc": "Imperfect tense for narrating past events"},
    {"file": "15 Study Notes Kleeder.pdf", "level": "A2", "order": 4, "title": "Kleeder", "topic": "Clothes and colors", "desc": "Clothes, fashion, shopping for clothing"},
    {"file": "16 Study Notes Comparison.pdf", "level": "A2", "order": 5, "title": "Verglaich", "topic": "Comparisons", "desc": "Comparing things, comparative and superlative forms"},
    {"file": "17 Study Notes well.pdf", "level": "A2", "order": 6, "title": "Well", "topic": "Because - subordinate clauses", "desc": "Using well (because) to give reasons and explanations"},
    {"file": "18 Study Notes w\u00ebllen.pdf", "level": "A2", "order": 7, "title": "Wellen", "topic": "Modal verbs", "desc": "The modal verb wellen (to want), expressing wishes"},
    {"file": "19 Study Notes Reflex v..pdf", "level": "A2", "order": 8, "title": "Reflexiv Verben 1", "topic": "Reflexive verbs part 1", "desc": "Reflexive verbs part 1, daily routine actions"},
    {"file": "20 Study Notes Reflex 2.pdf", "level": "A2", "order": 9, "title": "Reflexiv Verben 2", "topic": "Reflexive verbs part 2", "desc": "Reflexive verbs part 2, emotions and reciprocal actions"},
]



# ─────────────────────────────────────────────────────────────
# Hand-crafted lesson content for all 20 chapters based on PDF extracts
# Each chapter has: grammar, reading, listening, speaking
# Each skill has: title, content (HTML), exercises (3-5 each)
# ─────────────────────────────────────────────────────────────

ALL_CONTENT = {}

# ══════════════════════════════════════════════════════════════
# CHAPTER 1: Nationaliteit (A1)
# ══════════════════════════════════════════════════════════════
ALL_CONTENT[0] = {
    "grammar": {
        "title": "Nationality & Introduction Grammar",
        "content": '<h3>Ech sinn... - I am...</h3><p>To state your nationality, use <strong>Ech sinn</strong> + nationality adjective.</p><ul><li><strong>Ech sinn Lëtzebuerger/Lëtzebuergerin.</strong> - I am Luxembourgish (m/f).</li><li><strong>Ech sinn Franséisch.</strong> - I am French.</li><li><strong>Ech sinn Däitsch.</strong> - I am German.</li><li><strong>Ech sinn Portugisesch.</strong> - I am Portuguese.</li></ul><h4>Asking nationality</h4><p><strong>Wat bass du vun Nationaliteit?</strong> - What is your nationality?</p><h4>Where you come from</h4><p><strong>Ech kommen aus</strong> + country, <strong>vu(n)</strong> + city:</p><ul><li><strong>Ech kommen aus Frankräich vu Paräis.</strong></li><li>Exception: <strong>Ech komme vu Lëtzebuerg.</strong></li></ul><h4>Verb conjugation: kommen, schwätzen, léieren</h4><table><tr><th></th><th>kommen</th><th>schwätzen</th><th>léieren</th></tr><tr><td>ech</td><td>kommen</td><td>schwätzen</td><td>léieren</td></tr><tr><td>du</td><td>kënns</td><td>schwätz</td><td>léiers</td></tr><tr><td>hien/hatt</td><td>kënnt</td><td>schwätzt</td><td>léiert</td></tr><tr><td>mir</td><td>kommen</td><td>schwätzen</td><td>léieren</td></tr></table>',
        "exercises": [
            {"type": "multiple-choice", "prompt": "How do you say 'I am Luxembourgish' (male)?", "options": ["Ech sinn Lëtzebuerger", "Ech sinn Franséisch", "Ech sinn Portugisesch", "Ech sinn Belsch"], "correctAnswer": "Ech sinn Lëtzebuerger", "explanation": "Lëtzebuerger is the masculine form for Luxembourgish nationality."},
            {"type": "multiple-choice", "prompt": "Which preposition do you use with 'kommen' + country?", "options": ["aus", "vu", "an", "op"], "correctAnswer": "aus", "explanation": "Ech kommen aus + country. Exception: vu Lëtzebuerg."},
            {"type": "fill-blank", "prompt": "Complete: Ech ___ Franséisch. (I am French.)", "options": None, "correctAnswer": "sinn", "explanation": "Ech sinn = I am."},
            {"type": "multiple-choice", "prompt": "What does 'Wat bass du vun Nationaliteit?' mean?", "options": ["Where do you live?", "What is your nationality?", "What is your name?", "Where are you from?"], "correctAnswer": "What is your nationality?", "explanation": "Wat bass du vun Nationaliteit? asks about nationality."},
            {"type": "fill-blank", "prompt": "Complete: Du ___ aus Däitschland. (You come from Germany.)", "options": None, "correctAnswer": "kënns", "explanation": "With du, kommen becomes kënns."},
        ]
    },
    "reading": {
        "title": "At the Embassy",
        "content": '<h3>Op der Ambassade - At the Embassy</h3><p><strong>Beamten:</strong> Moien! Wann ech gelift, wéi heescht Dir?</p><p><strong>Maria:</strong> Moien! Ech heeschen Maria Silva.</p><p><strong>Beamten:</strong> A wat ass Är Nationaliteit?</p><p><strong>Maria:</strong> Ech sinn Portugisesch. Ech wunnen awer schonn 5 Joer zu Lëtzebuerg.</p><p><strong>Beamten:</strong> Schwätzt Dir Lëtzebuergesch?</p><p><strong>Maria:</strong> Jo, ech schwätzen e bëssen Lëtzebuergesch an och Franséisch.</p><p><strong>Beamten:</strong> Merci, dat ass gutt!</p><hr/><p><em>Vocabulary: Beamten = official, Ambassade = embassy, wunnen = to live, schonn = already, Joer = years, e bëssen = a little</em></p>',
        "exercises": [
            {"type": "multiple-choice", "prompt": "What is Maria's nationality?", "options": ["Luxembourgish", "French", "Portuguese", "German"], "correctAnswer": "Portuguese", "explanation": "Maria says 'Ech sinn Portugisesch'."},
            {"type": "multiple-choice", "prompt": "How long has Maria lived in Luxembourg?", "options": ["2 years", "3 years", "5 years", "10 years"], "correctAnswer": "5 years", "explanation": "'schonn 5 Joer zu Lëtzebuerg' = already 5 years."},
            {"type": "multiple-choice", "prompt": "Which languages does Maria speak?", "options": ["Only Portuguese", "Luxembourgish and French", "German and French", "Only Luxembourgish"], "correctAnswer": "Luxembourgish and French", "explanation": "She speaks 'e bëssen Lëtzebuergesch an och Franséisch'."},
            {"type": "fill-blank", "prompt": "Complete: Ech ___ Maria Silva. (My name is Maria Silva.)", "options": None, "correctAnswer": "heeschen", "explanation": "Heeschen = to be called. Ech heeschen = My name is."},
        ]
    },
    "listening": {
        "title": "Self-Introduction Listening",
        "content": '<h3>Transcript: Sech virstellen</h3><p>Moien! Mäin Numm ass Anne an ech komme vu Lëtzebuerg aus der Stad. Natierlech sinn ech Lëtzebuergerin. Ech wunnen zu Hesper, um Houwald. Ech si Lëtzebuergesch Proff. Ech schwätzen Lëtzebuergesch, Franséisch an Däitsch.</p><hr/><p><em>Vocabulary: Numm = name, natierlech = of course, Proff = teacher, Hesper = a town in Luxembourg, um Houwald = in Houwald (area)</em></p>',
        "exercises": [
            {"type": "multiple-choice", "prompt": "Where does Anne come from?", "options": ["France", "Germany", "Luxembourg City", "Belgium"], "correctAnswer": "Luxembourg City", "explanation": "'ech komme vu Lëtzebuerg aus der Stad' = from Luxembourg City."},
            {"type": "multiple-choice", "prompt": "What is Anne's profession?", "options": ["Doctor", "Teacher", "Engineer", "Nurse"], "correctAnswer": "Teacher", "explanation": "'Ech si Lëtzebuergesch Proff' = I am a Luxembourgish teacher."},
            {"type": "multiple-choice", "prompt": "How many languages does Anne speak?", "options": ["1", "2", "3", "4"], "correctAnswer": "3", "explanation": "Lëtzebuergesch, Franséisch an Däitsch = three languages."},
        ]
    },
    "speaking": {
        "title": "Introduce Yourself",
        "content": '<h3>Practice: Stell dech vir!</h3><p>Use these sentence starters to introduce yourself:</p><ul><li><strong>Moien! Mäin Numm ass...</strong> (Hello! My name is...)</li><li><strong>Ech sinn...</strong> (I am... [nationality])</li><li><strong>Ech komme vu(n)...</strong> (I come from...)</li><li><strong>Ech schwätzen...</strong> (I speak...)</li><li><strong>Ech schaffen als...</strong> (I work as...)</li><li><strong>Ech wunnen zu...</strong> (I live in...)</li></ul><p>Try to form complete sentences about yourself using these patterns.</p>',
        "exercises": [
            {"type": "multiple-choice", "prompt": "How do you say 'I live in Luxembourg'?", "options": ["Ech wunnen zu Lëtzebuerg", "Ech schaffen zu Lëtzebuerg", "Ech sinn zu Lëtzebuerg", "Ech heeschen Lëtzebuerg"], "correctAnswer": "Ech wunnen zu Lëtzebuerg", "explanation": "Wunnen = to live. Ech wunnen zu Lëtzebuerg."},
            {"type": "multiple-choice", "prompt": "How do you say 'My name is...'?", "options": ["Mäin Numm ass...", "Ech sinn...", "Ech kommen...", "Ech wunnen..."], "correctAnswer": "Mäin Numm ass...", "explanation": "Mäin Numm ass... = My name is..."},
            {"type": "fill-blank", "prompt": "Complete: Ech ___ als Ingenieur. (I work as an engineer.)", "options": None, "correctAnswer": "schaffen", "explanation": "Schaffen = to work. Ech schaffen als... = I work as..."},
        ]
    }
}

# ══════════════════════════════════════════════════════════════
# CHAPTER 2: Gefalen (A1)
# ══════════════════════════════════════════════════════════════
ALL_CONTENT[1] = {
    "grammar": {
        "title": "Likes & Dislikes Grammar",
        "content": '<h3>Gefalen - To Like</h3><p>Two ways to express likes in Luxembourgish:</p><h4>1. Verb + gär / net gär (for activities)</h4><ul><li><strong>Ech maache gär Sport.</strong> - I like doing sports.</li><li><strong>Ech gi gär an de Kino.</strong> - I like going to the cinema.</li><li><strong>Ech gi guer net gär an de Kino.</strong> - I don\'t like going to the cinema at all.</li></ul><h4>2. Gefalen (for things/people)</h4><ul><li><strong>Mir gefält meng Aarbecht.</strong> - I like my job. (lit: My job pleases me)</li><li><strong>Lëtzebuerg gefält mir ganz gutt.</strong> - I like Luxembourg very much.</li><li><strong>D\'Wieder gefält mir net.</strong> - I don\'t like the weather.</li></ul><h4>Personal Pronouns with gefalen</h4><table><tr><th>Person</th><th>Pronoun</th><th>Example</th></tr><tr><td>ech</td><td>mir</td><td>Mir gefält dat.</td></tr><tr><td>du</td><td>dir</td><td>Dir gefält dat.</td></tr><tr><td>hien/hatt</td><td>him/hir</td><td>Him gefält dat.</td></tr><tr><td>mir (we)</td><td>eis</td><td>Eis gefält dat.</td></tr></table>',
        "exercises": [
            {"type": "multiple-choice", "prompt": "How do you say 'I like that' in Luxembourgish?", "options": ["Dat gefält mir", "Ech sinn dat", "Ech hunn dat", "Dat ass gutt"], "correctAnswer": "Dat gefält mir", "explanation": "Dat gefält mir = That pleases me / I like that."},
            {"type": "multiple-choice", "prompt": "How do you say 'I like doing sports'?", "options": ["Ech maache gär Sport", "Mir gefält Sport", "Ech sinn gär Sport", "Ech hunn Sport"], "correctAnswer": "Ech maache gär Sport", "explanation": "Verb + gär for activities: Ech maache gär Sport."},
            {"type": "fill-blank", "prompt": "Complete: D'Wieder gefält mir ___. (I don't like the weather.)", "options": None, "correctAnswer": "net", "explanation": "Net = not. Gefält mir net = I don't like."},
            {"type": "multiple-choice", "prompt": "Which pronoun goes with 'du' for gefalen?", "options": ["mir", "dir", "him", "eis"], "correctAnswer": "dir", "explanation": "Du -> dir. Dir gefält dat = You like that."},
        ]
    },
    "reading": {
        "title": "Favourite Things",
        "content": '<h3>Meng Lieblingssaachen</h3><p><strong>Sophie:</strong> Ech hunn gär Schokolaad an Äis. Mäi Lieblingsessen ass Bouneschlupp!</p><p><strong>Marc:</strong> Ech maache gär Sport. Ech spillen all Samschdeg Fussball. Mäi Lieblingsfilm ass eng Komödie.</p><p><strong>Sophie:</strong> Ech maache net gär Fussball, mee ech schwamme gär.</p><p><strong>Marc:</strong> Schwammen ass och flott! Mir gefält och d\'Natur.</p><hr/><p><em>Vocabulary: Schokolaad = chocolate, Äis = ice cream, Bouneschlupp = green bean soup, spillen = to play, all Samschdeg = every Saturday, Schwammen = swimming, Natur = nature</em></p>',
        "exercises": [
            {"type": "multiple-choice", "prompt": "What is Sophie's favourite food?", "options": ["Chocolate", "Ice cream", "Bouneschlupp", "Pizza"], "correctAnswer": "Bouneschlupp", "explanation": "'Mäi Lieblingsessen ass Bouneschlupp' = My favourite food is Bouneschlupp."},
            {"type": "multiple-choice", "prompt": "When does Marc play football?", "options": ["Every Sunday", "Every Saturday", "Every Friday", "Every day"], "correctAnswer": "Every Saturday", "explanation": "'all Samschdeg' = every Saturday."},
            {"type": "multiple-choice", "prompt": "What sport does Sophie like?", "options": ["Football", "Tennis", "Swimming", "Running"], "correctAnswer": "Swimming", "explanation": "'ech schwamme gär' = I like swimming."},
        ]
    },
    "listening": {
        "title": "What Do You Like?",
        "content": '<h3>Transcript: Wat hues du gär?</h3><p>Ech heeschen Lisa. Ech hunn gär Musek, besonnesch Jazz. Ech spillen Klavier zanter 10 Joer. Ech kache gär - mäi Lieblingsplat ass Judd mat Gaardebounen. Ech maache net gär fréi opstoen!</p><hr/><p><em>Vocabulary: Musek = music, besonnesch = especially, Klavier = piano, zanter = since/for, kachen = to cook, Lieblingsplat = favourite dish, Judd mat Gaardebounen = smoked pork with broad beans, fréi opstoen = getting up early</em></p>',
        "exercises": [
            {"type": "multiple-choice", "prompt": "What instrument does Lisa play?", "options": ["Guitar", "Violin", "Piano", "Drums"], "correctAnswer": "Piano", "explanation": "'Ech spillen Klavier' = I play piano."},
            {"type": "multiple-choice", "prompt": "What is Lisa's favourite dish?", "options": ["Bouneschlupp", "Judd mat Gaardebounen", "Kniddelen", "Gromperekichelcher"], "correctAnswer": "Judd mat Gaardebounen", "explanation": "Her Lieblingsplat is Judd mat Gaardebounen."},
            {"type": "multiple-choice", "prompt": "What does Lisa NOT like?", "options": ["Music", "Cooking", "Getting up early", "Jazz"], "correctAnswer": "Getting up early", "explanation": "'Ech maache net gär fréi opstoen' = I don't like getting up early."},
        ]
    },
    "speaking": {
        "title": "Express Your Preferences",
        "content": '<h3>Practice: Sot wat dir gär hutt!</h3><p>Express your preferences using these patterns:</p><ul><li><strong>Ech maache gär...</strong> (I like doing...)</li><li><strong>Ech maache net gär...</strong> (I don\'t like doing...)</li><li><strong>Mir gefält...</strong> (I like... [thing])</li><li><strong>Mäi Lieblingsessen ass...</strong> (My favourite food is...)</li><li><strong>Mäi Lieblingsfilm ass...</strong> (My favourite film is...)</li></ul>',
        "exercises": [
            {"type": "multiple-choice", "prompt": "How do you say 'My favourite food is...'?", "options": ["Mäi Lieblingsessen ass...", "Ech iessen gär...", "Mir gefält d'Iessen...", "Ech hunn gär..."], "correctAnswer": "Mäi Lieblingsessen ass...", "explanation": "Mäi Lieblingsessen ass... = My favourite food is..."},
            {"type": "fill-blank", "prompt": "Complete: Ech ___ gär Fussball. (I like playing football.)", "options": None, "correctAnswer": "spillen", "explanation": "Spillen = to play. Ech spillen gär Fussball."},
            {"type": "multiple-choice", "prompt": "How do you say 'I don't like that at all'?", "options": ["Dat gefält mir guer net", "Dat ass net gutt", "Ech sinn net gär", "Dat maache net"], "correctAnswer": "Dat gefält mir guer net", "explanation": "Guer net = not at all. Dat gefält mir guer net."},
        ]
    }
}


# ══════════════════════════════════════════════════════════════
# CHAPTER 3: Weidoen - Health (A1)
# ══════════════════════════════════════════════════════════════
ALL_CONTENT[2] = {
    "grammar": {
        "title": "Health & Body Parts Grammar",
        "content": '<h3>Wéi geet et dir? - How are you?</h3><p>Possible answers:</p><ul><li><strong>Mir geet et gutt / ganz gutt.</strong> - I\'m feeling well / very well.</li><li><strong>Alles an der Rei.</strong> - Everything is in order.</li><li><strong>Mir geet et net esou gutt.</strong> - I\'m not feeling so well.</li><li><strong>Et ass mir schlecht.</strong> - I\'m feeling sick.</li><li><strong>Ech si krank.</strong> - I am sick.</li></ul><h4>Body pains: -wéi compounds</h4><ul><li><strong>Ech hu Kappwéi.</strong> - I have a headache.</li><li><strong>Ech hu Bauchwéi.</strong> - I have a stomachache.</li><li><strong>Ech hu Réckwéi.</strong> - I have backache.</li><li><strong>Ech hunn Halswéi.</strong> - I have a sore throat.</li><li><strong>Ech hunn Zännwéi.</strong> - I have toothache.</li></ul><h4>Wéidoen - to hurt</h4><p><strong>Meng Hand deet mir wéi.</strong> - My hand hurts. (lit: My hand does me pain)</p><p>Pattern: <strong>[body part] deet mir wéi</strong></p>',
        "exercises": [
            {"type": "multiple-choice", "prompt": "How do you say 'I have a headache'?", "options": ["Ech hu Kappwéi", "Ech hu Bauchwéi", "Ech hu Réckwéi", "Ech hu Halswéi"], "correctAnswer": "Ech hu Kappwéi", "explanation": "Kapp = head, wéi = pain. Kappwéi = headache."},
            {"type": "fill-blank", "prompt": "Complete: Mir geet et net esou ___. (I'm not feeling so well.)", "options": None, "correctAnswer": "gutt", "explanation": "Gutt = well. Mir geet et net esou gutt."},
            {"type": "multiple-choice", "prompt": "What does 'Et ass mir schlecht' mean?", "options": ["I'm feeling great", "I'm feeling sick", "I'm tired", "I'm hungry"], "correctAnswer": "I'm feeling sick", "explanation": "Schlecht = bad. Et ass mir schlecht = I'm feeling sick."},
            {"type": "multiple-choice", "prompt": "How do you say 'My hand hurts'?", "options": ["Meng Hand deet mir wéi", "Ech hu Handwéi", "Mir Hand ass krank", "Ech doen Hand wéi"], "correctAnswer": "Meng Hand deet mir wéi", "explanation": "[Body part] deet mir wéi = [body part] hurts me."},
        ]
    },
    "reading": {
        "title": "At the Doctor",
        "content": '<h3>Beim Dokter</h3><p><strong>Dokter:</strong> Moien! Wéi geet et Iech?</p><p><strong>Patient:</strong> Mir geet et net esou gutt. Ech hu Kappwéi an Halswéi.</p><p><strong>Dokter:</strong> Zanter wéini hutt Dir dat?</p><p><strong>Patient:</strong> Zanter zwee Deeg. An mäi Bauch deet mir och wéi.</p><p><strong>Dokter:</strong> Hutt Dir Féiwer?</p><p><strong>Patient:</strong> Jo, ech hunn e bësse Féiwer.</p><p><strong>Dokter:</strong> Ech verschreiwen Iech Medikamenter. Bleift am Bett a drenkt vill Waasser.</p><hr/><p><em>Vocabulary: Dokter = doctor, zanter wéini = since when, Deeg = days, Féiwer = fever, verschreiwen = to prescribe, Medikamenter = medicine, Bett = bed</em></p>',
        "exercises": [
            {"type": "multiple-choice", "prompt": "What symptoms does the patient have?", "options": ["Headache and sore throat", "Backache and fever", "Stomachache only", "Toothache"], "correctAnswer": "Headache and sore throat", "explanation": "'Ech hu Kappwéi an Halswéi' = headache and sore throat."},
            {"type": "multiple-choice", "prompt": "How long has the patient been sick?", "options": ["One day", "Two days", "One week", "Three days"], "correctAnswer": "Two days", "explanation": "'Zanter zwee Deeg' = since two days."},
            {"type": "multiple-choice", "prompt": "Does the patient have a fever?", "options": ["No", "Yes, a little", "Yes, very high", "Not mentioned"], "correctAnswer": "Yes, a little", "explanation": "'e bësse Féiwer' = a little fever."},
        ]
    },
    "listening": {
        "title": "Describing Symptoms",
        "content": '<h3>Transcript: Ech si krank</h3><p>Ech heeschen Tom an ech si krank. Mäi Kapp deet mir wéi an ech hunn Halswéi. Ech hu kee Féiwer mee ech sinn ganz midd. Ech bleiwen haut am Bett. Meng Fra seet ech soll an den Dokter goen mee ech wëll net. Ech drénken léiwer eng waarm Zopp.</p><hr/><p><em>Vocabulary: midd = tired, bleiwen = to stay, Fra = wife, seet = says, soll = should, wëll = want, léiwer = rather, waarm = warm, Zopp = soup</em></p>',
        "exercises": [
            {"type": "multiple-choice", "prompt": "Does Tom have a fever?", "options": ["Yes", "No", "A little", "Not mentioned"], "correctAnswer": "No", "explanation": "'Ech hu kee Féiwer' = I have no fever. Kee = no/none."},
            {"type": "multiple-choice", "prompt": "What does Tom's wife suggest?", "options": ["Stay in bed", "Go to the doctor", "Drink soup", "Take medicine"], "correctAnswer": "Go to the doctor", "explanation": "'Meng Fra seet ech soll an den Dokter goen' = My wife says I should go to the doctor."},
            {"type": "multiple-choice", "prompt": "What does Tom prefer to do?", "options": ["Go to the doctor", "Take medicine", "Drink warm soup", "Go to work"], "correctAnswer": "Drink warm soup", "explanation": "'Ech drénken léiwer eng waarm Zopp' = I'd rather drink a warm soup."},
        ]
    },
    "speaking": {
        "title": "Describe How You Feel",
        "content": '<h3>Practice: Wéi geet et dir?</h3><p>Practice describing how you feel:</p><ul><li><strong>Mir geet et gutt.</strong> (I\'m feeling well.)</li><li><strong>Mir geet et net esou gutt.</strong> (I\'m not feeling so well.)</li><li><strong>Ech hu [Kapp/Bauch/Réck]wéi.</strong> (I have a [head/stomach/back]ache.)</li><li><strong>Meng/Mäin [body part] deet mir wéi.</strong> (My [body part] hurts.)</li><li><strong>Ech si krank/midd.</strong> (I am sick/tired.)</li></ul>',
        "exercises": [
            {"type": "multiple-choice", "prompt": "How do you say 'I am tired'?", "options": ["Ech si midd", "Ech si krank", "Ech hu Kappwéi", "Mir geet et gutt"], "correctAnswer": "Ech si midd", "explanation": "Midd = tired. Ech si midd = I am tired."},
            {"type": "fill-blank", "prompt": "Complete: Mäi Réck deet mir ___. (My back hurts.)", "options": None, "correctAnswer": "wéi", "explanation": "Wéi = pain/sore. Deet mir wéi = hurts me."},
            {"type": "multiple-choice", "prompt": "How do you say 'Everything is in order'?", "options": ["Alles an der Rei", "Et ass gutt", "Mir geet et gutt", "Kee Problem"], "correctAnswer": "Alles an der Rei", "explanation": "Alles an der Rei = Everything is in order/OK."},
        ]
    }
}

# ══════════════════════════════════════════════════════════════
# CHAPTER 4: Apdikt - Pharmacy (A1)
# ══════════════════════════════════════════════════════════════
ALL_CONTENT[3] = {
    "grammar": {
        "title": "At the Pharmacy Grammar",
        "content": '<h3>An der Apdikt - At the Pharmacy</h3><p>Key phrases for the pharmacy:</p><ul><li><strong>Ech brauch eppes géint Kappwéi.</strong> - I need something for headache.</li><li><strong>Hutt Dir eppes géint Houscht?</strong> - Do you have something for cough?</li><li><strong>Wéi dacks soll ech dat huelen?</strong> - How often should I take that?</li></ul><h4>Useful pharmacy vocabulary</h4><ul><li><strong>Tabletten</strong> - tablets</li><li><strong>Sirop</strong> - syrup</li><li><strong>Salef</strong> - ointment</li><li><strong>Pflooschter</strong> - plaster/bandaid</li><li><strong>Rezept</strong> - prescription</li></ul><h4>Frequency expressions</h4><ul><li><strong>dräimol am Dag</strong> - three times a day</li><li><strong>all 8 Stonnen</strong> - every 8 hours</li><li><strong>virum Iessen</strong> - before eating</li><li><strong>nom Iessen</strong> - after eating</li></ul>',
        "exercises": [
            {"type": "multiple-choice", "prompt": "How do you say 'I need something for headache'?", "options": ["Ech brauch eppes géint Kappwéi", "Ech hunn Kappwéi", "Ech wëll Kappwéi", "Gitt mir Kappwéi"], "correctAnswer": "Ech brauch eppes géint Kappwéi", "explanation": "Brauch = need, eppes géint = something against/for."},
            {"type": "fill-blank", "prompt": "Complete: Dräimol am ___. (Three times a day.)", "options": None, "correctAnswer": "Dag", "explanation": "Dag = day. Dräimol am Dag = three times a day."},
            {"type": "multiple-choice", "prompt": "What does 'Tabletten' mean?", "options": ["Syrup", "Tablets", "Ointment", "Plaster"], "correctAnswer": "Tablets", "explanation": "Tabletten = tablets/pills."},
            {"type": "multiple-choice", "prompt": "What does 'nom Iessen' mean?", "options": ["Before eating", "After eating", "During eating", "Without eating"], "correctAnswer": "After eating", "explanation": "Nom = after. Nom Iessen = after eating."},
        ]
    },
    "reading": {
        "title": "At the Pharmacy",
        "content": '<h3>An der Apdikt</h3><p><strong>Client:</strong> Moien! Ech brauch eppes géint Houscht.</p><p><strong>Apdikter:</strong> Hutt Dir dréchenen Houscht oder nassen Houscht?</p><p><strong>Client:</strong> Dréchenen Houscht. An ech hunn och Kappwéi.</p><p><strong>Apdikter:</strong> Hei sinn Tabletten géint Kappwéi an e Sirop géint Houscht.</p><p><strong>Client:</strong> Wéi dacks soll ech den Sirop huelen?</p><p><strong>Apdikter:</strong> Dräimol am Dag, nom Iessen. D\'Tabletten kënnt Dir all 6 Stonnen huelen.</p><p><strong>Client:</strong> Merci! Wat kascht dat?</p><p><strong>Apdikter:</strong> Dat mecht 12 Euro 50.</p><hr/><p><em>Vocabulary: Houscht = cough, dréchen = dry, nass = wet, Apdikter = pharmacist, kascht = costs</em></p>',
        "exercises": [
            {"type": "multiple-choice", "prompt": "What type of cough does the client have?", "options": ["Wet cough", "Dry cough", "Chronic cough", "Not specified"], "correctAnswer": "Dry cough", "explanation": "'Dréchenen Houscht' = dry cough."},
            {"type": "multiple-choice", "prompt": "How often should the syrup be taken?", "options": ["Once a day", "Twice a day", "Three times a day", "Four times a day"], "correctAnswer": "Three times a day", "explanation": "'Dräimol am Dag' = three times a day."},
            {"type": "multiple-choice", "prompt": "How much does everything cost?", "options": ["10.50 Euro", "12.50 Euro", "15.00 Euro", "8.50 Euro"], "correctAnswer": "12.50 Euro", "explanation": "'12 Euro 50' = 12.50 Euro."},
        ]
    },
    "listening": {
        "title": "Pharmacy Conversation",
        "content": '<h3>Transcript: Ech brauch Medikamenter</h3><p>Moien, ech sinn d\'Marie. Ech si krank. Ech hunn Halswéi an Houscht. Ech ginn an d\'Apdikt. Den Apdikter gëtt mir e Sirop an Tabletten. Ech soll den Sirop dräimol am Dag huelen. D\'Tabletten soll ech moies an owes huelen. Ech bezuelen 15 Euro. Elo ginn ech heem an ech bleiwen am Bett.</p><hr/><p><em>Vocabulary: gëtt = gives, moies = in the morning, owes = in the evening, bezuelen = to pay, heem = home</em></p>',
        "exercises": [
            {"type": "multiple-choice", "prompt": "What symptoms does Marie have?", "options": ["Headache and fever", "Sore throat and cough", "Stomachache", "Backache"], "correctAnswer": "Sore throat and cough", "explanation": "'Halswéi an Houscht' = sore throat and cough."},
            {"type": "multiple-choice", "prompt": "When should Marie take the tablets?", "options": ["Three times a day", "Morning and evening", "Only at night", "Before meals"], "correctAnswer": "Morning and evening", "explanation": "'moies an owes' = morning and evening."},
            {"type": "fill-blank", "prompt": "Complete: Elo ginn ech ___ an ech bleiwen am Bett. (Now I go ___ and stay in bed.)", "options": None, "correctAnswer": "heem", "explanation": "Heem = home. Ech ginn heem = I go home."},
        ]
    },
    "speaking": {
        "title": "At the Pharmacy Role-Play",
        "content": '<h3>Practice: An der Apdikt</h3><p>Practice these pharmacy phrases:</p><ul><li><strong>Ech brauch eppes géint...</strong> (I need something for...)</li><li><strong>Hutt Dir eppes géint...?</strong> (Do you have something for...?)</li><li><strong>Wéi dacks soll ech dat huelen?</strong> (How often should I take that?)</li><li><strong>Wat kascht dat?</strong> (How much does that cost?)</li></ul><p>Try role-playing a pharmacy visit describing your symptoms.</p>',
        "exercises": [
            {"type": "multiple-choice", "prompt": "How do you ask 'How much does that cost?'", "options": ["Wat kascht dat?", "Wéi vill ass dat?", "Wéi deier ass dat?", "All three are correct"], "correctAnswer": "Wat kascht dat?", "explanation": "Wat kascht dat? = What does that cost?"},
            {"type": "fill-blank", "prompt": "Complete: Hutt Dir eppes ___ Bauchwéi? (Do you have something for stomachache?)", "options": None, "correctAnswer": "géint", "explanation": "Géint = against/for. Eppes géint = something for."},
            {"type": "multiple-choice", "prompt": "What does 'Rezept' mean?", "options": ["Recipe", "Prescription", "Receipt", "Remedy"], "correctAnswer": "Prescription", "explanation": "Rezept = prescription (from the doctor)."},
        ]
    }
}


# ══════════════════════════════════════════════════════════════
# CHAPTER 5: An der Stad - In the City (A1)
# ══════════════════════════════════════════════════════════════
ALL_CONTENT[4] = {
    "grammar": {
        "title": "City & Directions Grammar",
        "content": '<h3>An der Stad - In the City</h3><p>Asking for and giving directions:</p><h4>Asking directions</h4><ul><li><strong>Wou ass...?</strong> - Where is...?</li><li><strong>Wéi kommen ech op...?</strong> - How do I get to...?</li><li><strong>Ass et wäit?</strong> - Is it far?</li></ul><h4>Giving directions</h4><ul><li><strong>Gitt riets.</strong> - Go right.</li><li><strong>Gitt lénks.</strong> - Go left.</li><li><strong>Gitt riichtaus.</strong> - Go straight ahead.</li><li><strong>Huelt déi éischt/zweet/drëtt Strooss.</strong> - Take the first/second/third street.</li></ul><h4>City places</h4><ul><li><strong>d\'Gare</strong> - the train station</li><li><strong>d\'Post</strong> - the post office</li><li><strong>d\'Kierch</strong> - the church</li><li><strong>d\'Schoul</strong> - the school</li><li><strong>den Haaptbahnhof</strong> - the main station</li></ul>',
        "exercises": [
            {"type": "multiple-choice", "prompt": "How do you say 'Go right'?", "options": ["Gitt riets", "Gitt lénks", "Gitt riichtaus", "Gitt zréck"], "correctAnswer": "Gitt riets", "explanation": "Riets = right. Gitt riets = Go right."},
            {"type": "fill-blank", "prompt": "Complete: Wou ___ d'Gare? (Where is the train station?)", "options": None, "correctAnswer": "ass", "explanation": "Ass = is. Wou ass...? = Where is...?"},
            {"type": "multiple-choice", "prompt": "What does 'd'Post' mean?", "options": ["The police station", "The post office", "The hospital", "The park"], "correctAnswer": "The post office", "explanation": "D'Post = the post office."},
            {"type": "multiple-choice", "prompt": "How do you say 'Take the second street'?", "options": ["Huelt déi zweet Strooss", "Gitt déi zweet Strooss", "Kuckt déi zweet Strooss", "Fannt déi zweet Strooss"], "correctAnswer": "Huelt déi zweet Strooss", "explanation": "Huelt = take. Déi zweet Strooss = the second street."},
        ]
    },
    "reading": {
        "title": "Finding the Way",
        "content": '<h3>De Wee fannen</h3><p><strong>Tourist:</strong> Entschëllegt, wou ass d\'Gare w.e.g.?</p><p><strong>Passant:</strong> D\'Gare? Dat ass net wäit. Gitt riichtaus bis un d\'Ampel. Da gitt Dir lénks an da gitt Dir déi zweet Strooss riets.</p><p><strong>Tourist:</strong> Also riichtaus, lénks an da déi zweet riets?</p><p><strong>Passant:</strong> Genee! D\'Gare ass dann op der rietser Säit.</p><p><strong>Tourist:</strong> Merci villmools!</p><p><strong>Passant:</strong> Kee Problem! Et ass ongeféier 5 Minutten ze Fouss.</p><hr/><p><em>Vocabulary: Entschëllegt = excuse me, Passant = passerby, Ampel = traffic light, genee = exactly, rietser Säit = right side, ongeféier = approximately, ze Fouss = on foot</em></p>',
        "exercises": [
            {"type": "multiple-choice", "prompt": "What is the tourist looking for?", "options": ["The post office", "The train station", "The church", "The school"], "correctAnswer": "The train station", "explanation": "'Wou ass d'Gare?' = Where is the train station?"},
            {"type": "multiple-choice", "prompt": "How far is the station?", "options": ["2 minutes", "5 minutes on foot", "10 minutes", "15 minutes"], "correctAnswer": "5 minutes on foot", "explanation": "'ongeféier 5 Minutten ze Fouss' = approximately 5 minutes on foot."},
            {"type": "multiple-choice", "prompt": "At the traffic light, which direction?", "options": ["Right", "Left", "Straight", "Back"], "correctAnswer": "Left", "explanation": "'Da gitt Dir lénks' = Then go left."},
        ]
    },
    "listening": {
        "title": "City Tour",
        "content": '<h3>Transcript: Eng Stadtrundfahrt</h3><p>Wëllkomm zu Lëtzebuerg-Stad! Mir stinn hei virun der Gëlle Fra. Dat ass ee Monument fir d\'Zaldoten. Gitt Dir mat mir lénks, da kommen mir op d\'Plëss. Hei ass d\'Kathedral an d\'Palais vum Grand-Duc. Riichtaus gesitt Dir d\'Corniche, dat ass de schéinste Balcon vun Europa.</p><hr/><p><em>Vocabulary: Stadtrundfahrt = city tour, Gëlle Fra = Golden Lady monument, Zaldoten = soldiers, Plëss = Place (square), Kathedral = cathedral, Palais = palace, Grand-Duc = Grand Duke, Corniche = Corniche walkway, schéinste = most beautiful, Balcon = balcony</em></p>',
        "exercises": [
            {"type": "multiple-choice", "prompt": "What is the Gëlle Fra?", "options": ["A church", "A monument for soldiers", "A palace", "A park"], "correctAnswer": "A monument for soldiers", "explanation": "'ee Monument fir d'Zaldoten' = a monument for the soldiers."},
            {"type": "multiple-choice", "prompt": "What is the Corniche called?", "options": ["The most beautiful balcony of Europe", "The oldest bridge", "The biggest park", "The main street"], "correctAnswer": "The most beautiful balcony of Europe", "explanation": "'de schéinste Balcon vun Europa' = the most beautiful balcony of Europe."},
            {"type": "multiple-choice", "prompt": "What is near the Plëss?", "options": ["The train station", "The cathedral and palace", "The university", "The market"], "correctAnswer": "The cathedral and palace", "explanation": "'D'Kathedral an d'Palais vum Grand-Duc' are at the Plëss."},
        ]
    },
    "speaking": {
        "title": "Ask for Directions",
        "content": '<h3>Practice: Froen no dem Wee</h3><p>Practice asking for and giving directions:</p><ul><li><strong>Entschëllegt, wou ass...?</strong> (Excuse me, where is...?)</li><li><strong>Wéi kommen ech op...?</strong> (How do I get to...?)</li><li><strong>Gitt riets/lénks/riichtaus.</strong> (Go right/left/straight.)</li><li><strong>Ass et wäit?</strong> (Is it far?)</li></ul>',
        "exercises": [
            {"type": "multiple-choice", "prompt": "How do you say 'Excuse me'?", "options": ["Entschëllegt", "Moien", "Merci", "Pardon"], "correctAnswer": "Entschëllegt", "explanation": "Entschëllegt = Excuse me (formal)."},
            {"type": "fill-blank", "prompt": "Complete: Gitt ___. (Go straight ahead.)", "options": None, "correctAnswer": "riichtaus", "explanation": "Riichtaus = straight ahead."},
            {"type": "multiple-choice", "prompt": "How do you ask 'Is it far?'", "options": ["Ass et wäit?", "Ass et no?", "Wou ass et?", "Wéi wäit?"], "correctAnswer": "Ass et wäit?", "explanation": "Wäit = far. Ass et wäit? = Is it far?"},
        ]
    }
}

# ══════════════════════════════════════════════════════════════
# CHAPTER 6: Prepo - Prepositions (A1)
# ══════════════════════════════════════════════════════════════
ALL_CONTENT[5] = {
    "grammar": {
        "title": "Prepositions Grammar",
        "content": '<h3>Prepositiounen - Prepositions</h3><h4>Prepositions of place</h4><ul><li><strong>op</strong> - on: D\'Buch ass op dem Dësch.</li><li><strong>ënner</strong> - under: De Hond ass ënner dem Dësch.</li><li><strong>nieft</strong> - next to: D\'Lamp ass nieft dem Bett.</li><li><strong>hannert</strong> - behind: Den Auto ass hannert dem Haus.</li><li><strong>virun</strong> - in front of: Ech stinn virun der Dier.</li><li><strong>tëschent</strong> - between: D\'Apdikt ass tëschent der Post an der Bank.</li><li><strong>an</strong> - in: Ech sinn an der Kichen.</li></ul><h4>Dative case with prepositions</h4><p>These prepositions trigger the dative case:</p><ul><li>dem (masculine/neuter) → op <strong>dem</strong> Dësch</li><li>der (feminine) → an <strong>der</strong> Stad</li></ul>',
        "exercises": [
            {"type": "multiple-choice", "prompt": "What does 'op dem Dësch' mean?", "options": ["On the table", "Under the table", "Next to the table", "Behind the table"], "correctAnswer": "On the table", "explanation": "Op = on, dem Dësch = the table (dative)."},
            {"type": "fill-blank", "prompt": "Complete: De Hond ass ___ dem Dësch. (The dog is under the table.)", "options": None, "correctAnswer": "ënner", "explanation": "Ënner = under."},
            {"type": "multiple-choice", "prompt": "Which preposition means 'next to'?", "options": ["op", "ënner", "nieft", "hannert"], "correctAnswer": "nieft", "explanation": "Nieft = next to."},
            {"type": "multiple-choice", "prompt": "What case do these prepositions trigger?", "options": ["Nominative", "Accusative", "Dative", "Genitive"], "correctAnswer": "Dative", "explanation": "Place prepositions use the dative: dem (m/n), der (f)."},
        ]
    },
    "reading": {
        "title": "Where Is Everything?",
        "content": '<h3>Wou ass alles?</h3><p>Kuckt d\'Bild vun eisem Wunnzëmmer. D\'Sofa steet virun dem Fernseh. Op dem Dësch läit eng Zeitung. D\'Kaz schléift ënner dem Stull. Nieft dem Fernseh steet eng Lamp. D\'Bicher sinn am Regal hannert dem Sofa. Tëschent den zwee Fënsteren hänkt e Bild.</p><hr/><p><em>Vocabulary: Wunnzëmmer = living room, Sofa = sofa, Fernseh = TV, Zeitung = newspaper, Stull = chair, Regal = shelf, Fënsteren = windows, hänkt = hangs, Bild = picture</em></p>',
        "exercises": [
            {"type": "multiple-choice", "prompt": "Where is the cat?", "options": ["On the table", "Under the chair", "Behind the sofa", "Next to the TV"], "correctAnswer": "Under the chair", "explanation": "'D'Kaz schléift ënner dem Stull' = The cat sleeps under the chair."},
            {"type": "multiple-choice", "prompt": "Where is the sofa?", "options": ["Behind the TV", "In front of the TV", "Next to the TV", "Under the window"], "correctAnswer": "In front of the TV", "explanation": "'D'Sofa steet virun dem Fernseh' = The sofa is in front of the TV."},
            {"type": "fill-blank", "prompt": "Complete: D'Bicher sinn ___ Regal. (The books are in the shelf.)", "options": None, "correctAnswer": "am", "explanation": "Am = in the (contraction of an + dem)."},
        ]
    },
    "listening": {
        "title": "Room Description",
        "content": '<h3>Transcript: Mäi Zëmmer</h3><p>Mäi Zëmmer ass net grouss mee et ass gemittlech. Mäi Bett steet nieft der Fënster. Op dem Notstësch steet eng Lamp an e Wiecker. Meng Kleeder sinn am Schaf. Ënner dem Bett sinn meng Schong. Virun dem Schaf steet e Spigel. Ech hunn och e Schreifdësch mat engem Computer.</p><hr/><p><em>Vocabulary: gemittlech = cozy, Notstësch = nightstand, Wiecker = alarm clock, Schaf = wardrobe, Schong = shoes, Spigel = mirror, Schreifdësch = desk</em></p>',
        "exercises": [
            {"type": "multiple-choice", "prompt": "Where is the bed?", "options": ["Next to the window", "In front of the door", "Behind the desk", "Under the shelf"], "correctAnswer": "Next to the window", "explanation": "'Mäi Bett steet nieft der Fënster' = My bed is next to the window."},
            {"type": "multiple-choice", "prompt": "Where are the shoes?", "options": ["In the wardrobe", "Under the bed", "On the desk", "Next to the door"], "correctAnswer": "Under the bed", "explanation": "'Ënner dem Bett sinn meng Schong' = Under the bed are my shoes."},
            {"type": "multiple-choice", "prompt": "What is on the nightstand?", "options": ["A book and phone", "A lamp and alarm clock", "A glass of water", "Nothing"], "correctAnswer": "A lamp and alarm clock", "explanation": "'eng Lamp an e Wiecker' = a lamp and an alarm clock."},
        ]
    },
    "speaking": {
        "title": "Describe Your Room",
        "content": '<h3>Practice: Beschreif däi Zëmmer</h3><p>Describe where things are in your room:</p><ul><li><strong>... steet op dem Dësch.</strong> (... is on the table.)</li><li><strong>... ass ënner dem Bett.</strong> (... is under the bed.)</li><li><strong>... hänkt un der Mauer.</strong> (... hangs on the wall.)</li><li><strong>... steet nieft der Dier.</strong> (... is next to the door.)</li></ul>',
        "exercises": [
            {"type": "fill-blank", "prompt": "Complete: D'Lamp steet ___ dem Dësch. (The lamp is on the table.)", "options": None, "correctAnswer": "op", "explanation": "Op = on. Op dem Dësch = on the table."},
            {"type": "multiple-choice", "prompt": "How do you say 'behind the house'?", "options": ["hannert dem Haus", "virun dem Haus", "nieft dem Haus", "ënner dem Haus"], "correctAnswer": "hannert dem Haus", "explanation": "Hannert = behind. Hannert dem Haus = behind the house."},
            {"type": "multiple-choice", "prompt": "What does 'tëschent' mean?", "options": ["Above", "Below", "Between", "Around"], "correctAnswer": "Between", "explanation": "Tëschent = between."},
        ]
    }
}


# ══════════════════════════════════════════════════════════════
# CHAPTER 7: An der Stad 2 - Shops (A1)
# ══════════════════════════════════════════════════════════════
ALL_CONTENT[6] = {
    "grammar": {
        "title": "Shops & Opening Hours Grammar",
        "content": '<h3>Geschäfter an Openingszäiten</h3><h4>Types of shops</h4><ul><li><strong>d\'Bäckerei</strong> - the bakery</li><li><strong>d\'Metzlerei</strong> - the butcher</li><li><strong>de Supermarché</strong> - the supermarket</li><li><strong>d\'Apdikt</strong> - the pharmacy</li><li><strong>de Coiffeur</strong> - the hairdresser</li><li><strong>d\'Librairie</strong> - the bookshop</li></ul><h4>Opening hours</h4><ul><li><strong>Wéini ass op?</strong> - When is it open?</li><li><strong>Vun 8 bis 18 Auer.</strong> - From 8 to 6 pm.</li><li><strong>Ass et sonndes op?</strong> - Is it open on Sundays?</li><li><strong>Et ass zou.</strong> - It is closed.</li></ul><h4>Relative pronouns: deen, déi, dat</h4><p><strong>De Geschäft, deen um Eck ass.</strong> - The shop that is on the corner.</p>',
        "exercises": [
            {"type": "multiple-choice", "prompt": "What does 'd'Bäckerei' mean?", "options": ["The butcher", "The bakery", "The pharmacy", "The bookshop"], "correctAnswer": "The bakery", "explanation": "Bäckerei = bakery."},
            {"type": "fill-blank", "prompt": "Complete: Et ass ___. (It is closed.)", "options": None, "correctAnswer": "zou", "explanation": "Zou = closed. Et ass zou = It is closed."},
            {"type": "multiple-choice", "prompt": "How do you ask 'When is it open?'", "options": ["Wéini ass op?", "Wou ass op?", "Wat ass op?", "Wéi ass op?"], "correctAnswer": "Wéini ass op?", "explanation": "Wéini = when. Wéini ass op? = When is it open?"},
        ]
    },
    "reading": {
        "title": "Shopping in the City",
        "content": '<h3>Akafen an der Stad</h3><p><strong>Anna:</strong> Ech muss haut vill akafen. Als éischt ginn ech an d\'Bäckerei fir Brout.</p><p><strong>Marc:</strong> D\'Bäckerei um Eck ass gutt. Si hunn och flott Kuch.</p><p><strong>Anna:</strong> Duerno ginn ech an de Supermarché. Ech brauchen Uebst a Geméis.</p><p><strong>Marc:</strong> De Supermarché ass vun 8 bis 20 Auer op. Mee sonndes ass en zou.</p><p><strong>Anna:</strong> Dat weess ech. Haut ass Samschdeg, also kee Problem!</p><hr/><p><em>Vocabulary: akafen = to shop, als éischt = first, Brout = bread, Kuch = cake, duerno = afterwards, Uebst = fruit, Geméis = vegetables</em></p>',
        "exercises": [
            {"type": "multiple-choice", "prompt": "Where does Anna go first?", "options": ["Supermarket", "Bakery", "Pharmacy", "Butcher"], "correctAnswer": "Bakery", "explanation": "'Als éischt ginn ech an d'Bäckerei' = First I go to the bakery."},
            {"type": "multiple-choice", "prompt": "When is the supermarket closed?", "options": ["Saturday", "Sunday", "Monday", "Never"], "correctAnswer": "Sunday", "explanation": "'Sonndes ass en zou' = On Sundays it is closed."},
            {"type": "fill-blank", "prompt": "Complete: Ech brauchen Uebst a ___. (I need fruit and vegetables.)", "options": None, "correctAnswer": "Geméis", "explanation": "Geméis = vegetables."},
        ]
    },
    "listening": {
        "title": "At the Market",
        "content": '<h3>Transcript: Um Maart</h3><p>All Mëttwoch ginn ech op de Maart. De Maart ass op der Plëss Guillaume. Do kafen ech frësch Uebst a Geméis. D\'Äppel kaschten 2 Euro de Kilo. Ech kafen och Blummen fir meng Fra. De Maart ass vu moies 7 bis mëttes 1 Auer op.</p><hr/><p><em>Vocabulary: Maart = market, all Mëttwoch = every Wednesday, frësch = fresh, Äppel = apples, Kilo = kilo, Blummen = flowers, moies = morning, mëttes = noon</em></p>',
        "exercises": [
            {"type": "multiple-choice", "prompt": "When does the speaker go to the market?", "options": ["Every Monday", "Every Wednesday", "Every Saturday", "Every day"], "correctAnswer": "Every Wednesday", "explanation": "'All Mëttwoch' = every Wednesday."},
            {"type": "multiple-choice", "prompt": "How much do apples cost?", "options": ["1 Euro/kg", "2 Euro/kg", "3 Euro/kg", "5 Euro/kg"], "correctAnswer": "2 Euro/kg", "explanation": "'2 Euro de Kilo' = 2 Euro per kilo."},
            {"type": "multiple-choice", "prompt": "What does the speaker buy for his wife?", "options": ["Fruit", "Vegetables", "Flowers", "Bread"], "correctAnswer": "Flowers", "explanation": "'Blummen fir meng Fra' = flowers for my wife."},
        ]
    },
    "speaking": {
        "title": "Shopping Conversations",
        "content": '<h3>Practice: Akafen</h3><p>Practice shopping phrases:</p><ul><li><strong>Ech hätt gär...</strong> (I would like...)</li><li><strong>Wat kascht dat?</strong> (How much is that?)</li><li><strong>Wéini ass Dir op?</strong> (When are you open?)</li><li><strong>Hutt Dir...?</strong> (Do you have...?)</li></ul>',
        "exercises": [
            {"type": "multiple-choice", "prompt": "How do you say 'I would like...'?", "options": ["Ech hätt gär...", "Ech wëll...", "Ech brauch...", "Ech kafen..."], "correctAnswer": "Ech hätt gär...", "explanation": "Ech hätt gär... = I would like... (polite form)."},
            {"type": "fill-blank", "prompt": "Complete: Wat ___ dat? (How much is that?)", "options": None, "correctAnswer": "kascht", "explanation": "Kascht = costs. Wat kascht dat? = How much does that cost?"},
            {"type": "multiple-choice", "prompt": "How do you ask 'Do you have bread?'", "options": ["Hutt Dir Brout?", "Wou ass Brout?", "Gitt mir Brout", "Ech wëll Brout"], "correctAnswer": "Hutt Dir Brout?", "explanation": "Hutt Dir...? = Do you have...?"},
        ]
    }
}


# ══════════════════════════════════════════════════════════════
# CHAPTER 8: Mai Program - Daily Routine (A1)
# ══════════════════════════════════════════════════════════════
ALL_CONTENT[7] = {
    "grammar": {
        "title": "Daily Routine Grammar",
        "content": '<h3>Mäi Program - My Schedule</h3><h4>Telling the time</h4><ul><li><strong>Wéi spéit ass et?</strong> - What time is it?</li><li><strong>Et ass 8 Auer.</strong> - It is 8 o\'clock.</li><li><strong>Et ass hallwer 9.</strong> - It is half past 8.</li><li><strong>Et ass Véierel vir 10.</strong> - It is quarter to 10.</li><li><strong>Et ass Véierel no 3.</strong> - It is quarter past 3.</li></ul><h4>Daily routine verbs</h4><ul><li><strong>opstoen</strong> - to get up</li><li><strong>sech wäschen</strong> - to wash oneself</li><li><strong>Kaffi drénken</strong> - to drink coffee</li><li><strong>schaffen</strong> - to work</li><li><strong>Mëtteg iessen</strong> - to eat lunch</li><li><strong>schlofen goen</strong> - to go to sleep</li></ul><h4>Time expressions</h4><ul><li><strong>moies</strong> - in the morning</li><li><strong>mëttes</strong> - at noon</li><li><strong>nomëttes</strong> - in the afternoon</li><li><strong>owes</strong> - in the evening</li></ul>',
        "exercises": [
            {"type": "multiple-choice", "prompt": "How do you say 'half past 8'?", "options": ["Hallwer 9", "Hallwer 8", "8 an hallef", "Hallef no 8"], "correctAnswer": "Hallwer 9", "explanation": "In Luxembourgish, 'hallwer 9' = half past 8 (halfway to 9)."},
            {"type": "fill-blank", "prompt": "Complete: Wéi ___ ass et? (What time is it?)", "options": None, "correctAnswer": "spéit", "explanation": "Spéit = late. Wéi spéit ass et? = What time is it?"},
            {"type": "multiple-choice", "prompt": "What does 'opstoen' mean?", "options": ["To sit down", "To get up", "To go out", "To sleep"], "correctAnswer": "To get up", "explanation": "Opstoen = to get up/stand up."},
            {"type": "multiple-choice", "prompt": "What does 'nomëttes' mean?", "options": ["In the morning", "At noon", "In the afternoon", "In the evening"], "correctAnswer": "In the afternoon", "explanation": "Nomëttes = in the afternoon (after noon)."},
        ]
    },
    "reading": {
        "title": "A Day in My Life",
        "content": '<h3>En Dag a mengem Liewen</h3><p>Ech stinn moies um 7 Auer op. Ech wäsche mech an ech drénken e Kaffi. Um hallwer 8 fueren ech op d\'Aarbecht. Ech schaffen vun 8 bis 12 Auer. Mëttes iessen ech an der Kantine. Nomëttes schaffen ech bis 5 Auer. Owes kachen ech an ech kucken Tëlee. Um 11 Auer ginn ech schlofen.</p><hr/><p><em>Vocabulary: stinn op = get up, wäsche mech = wash myself, fueren = to drive/go, Aarbecht = work, Kantine = canteen, kachen = to cook, Tëlee = TV, schlofen = to sleep</em></p>',
        "exercises": [
            {"type": "multiple-choice", "prompt": "What time does the speaker get up?", "options": ["6 AM", "7 AM", "8 AM", "9 AM"], "correctAnswer": "7 AM", "explanation": "'Moies um 7 Auer' = in the morning at 7 o'clock."},
            {"type": "multiple-choice", "prompt": "Where does the speaker eat lunch?", "options": ["At home", "In the canteen", "At a restaurant", "At the office"], "correctAnswer": "In the canteen", "explanation": "'An der Kantine' = in the canteen."},
            {"type": "multiple-choice", "prompt": "What does the speaker do in the evening?", "options": ["Goes out", "Cooks and watches TV", "Reads a book", "Does sports"], "correctAnswer": "Cooks and watches TV", "explanation": "'Ech kachen an ech kucken Tëlee' = I cook and watch TV."},
        ]
    },
    "listening": {
        "title": "Weekend Plans",
        "content": '<h3>Transcript: Mäi Weekend</h3><p>Samschdes stinn ech spéit op, esou ëm 10 Auer. Ech fréitstécken laang mat menger Famill. Nomëttes ginn ech gär spadséieren am Park. Sonndes ginn ech an d\'Kierch an duerno iesse mir zesummen bei menge Grousselteren. Owes liesen ech e Buch oder ech kucken en Film.</p><hr/><p><em>Vocabulary: spéit = late, fréitstécken = to have breakfast, laang = long, spadséieren = to walk, Kierch = church, zesummen = together, Grousselteren = grandparents, liesen = to read</em></p>',
        "exercises": [
            {"type": "multiple-choice", "prompt": "What time does the speaker get up on Saturday?", "options": ["7 AM", "8 AM", "9 AM", "10 AM"], "correctAnswer": "10 AM", "explanation": "'Esou ëm 10 Auer' = around 10 o'clock."},
            {"type": "multiple-choice", "prompt": "Where does the family eat on Sunday?", "options": ["At home", "At a restaurant", "At the grandparents'", "At church"], "correctAnswer": "At the grandparents'", "explanation": "'Bei menge Grousselteren' = at my grandparents'."},
            {"type": "multiple-choice", "prompt": "What does the speaker do on Saturday afternoon?", "options": ["Watches TV", "Goes for a walk in the park", "Goes shopping", "Plays sports"], "correctAnswer": "Goes for a walk in the park", "explanation": "'Spadséieren am Park' = walking in the park."},
        ]
    },
    "speaking": {
        "title": "Describe Your Day",
        "content": '<h3>Practice: Beschreif däin Dag</h3><p>Describe your daily routine:</p><ul><li><strong>Ech stinn um ... Auer op.</strong> (I get up at ... o\'clock.)</li><li><strong>Ech fréitstécken um...</strong> (I have breakfast at...)</li><li><strong>Ech schaffen vun ... bis ...</strong> (I work from ... to ...)</li><li><strong>Owes maachen ech...</strong> (In the evening I do...)</li></ul>',
        "exercises": [
            {"type": "fill-blank", "prompt": "Complete: Ech stinn ___ 7 Auer op. (I get up at 7.)", "options": None, "correctAnswer": "um", "explanation": "Um = at (time). Um 7 Auer = at 7 o'clock."},
            {"type": "multiple-choice", "prompt": "How do you say 'I go to sleep'?", "options": ["Ech ginn schlofen", "Ech maachen schlofen", "Ech sinn schlofen", "Ech hunn schlofen"], "correctAnswer": "Ech ginn schlofen", "explanation": "Ginn schlofen = go to sleep."},
            {"type": "multiple-choice", "prompt": "How do you say 'quarter past 3'?", "options": ["Véierel no 3", "Véierel vir 3", "Hallwer 3", "Dräi an e Véierel"], "correctAnswer": "Véierel no 3", "explanation": "Véierel no = quarter past."},
        ]
    }
}

