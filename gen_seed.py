#!/usr/bin/env python3
"""
Generate the complete seedAllChapterLessons function for seed.ts.
Reads PDF content and creates 4 lessons per chapter (grammar, reading, listening, speaking).
"""
import json, unicodedata, re, sys, os

# Load PDF content
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
    t = re.sub(r'Lesson\s+\d+\s+Study\s+notes[^.]*\.?\s*', '', t)
    t = re.sub(r'Lesson\s+Study\s+notes[^.]*\.?\s*', '', t)
    t = re.sub(r'LeVVRn\s+nRWeV', '', t)
    t = re.sub(r'\s+', ' ', t)
    return t.strip()

def get_pdf(idx):
    nk = unicodedata.normalize('NFC', pdf_keys[idx])
    return clean(nfc[nk])

def esc(s):
    return s.replace('\\','\\\\').replace('"','\\"').replace('\n','\\n').replace('\r','').replace('\t',' ')

def make_html(raw, title, skill, max_len=2500):
    if skill == 'grammar':
        c = raw[:max_len]
    elif skill == 'reading':
        c = raw[:2000]
    elif skill == 'listening':
        mid = len(raw)//3
        c = raw[mid:mid+1800]
    else:
        start = max(0, len(raw)-2000)
        c = raw[start:][:1500]
    ld = c.rfind('.')
    if ld > len(c)//3: c = c[:ld+1]
    sents = [s.strip() for s in re.split(r'(?<=[.!?])\s+', c) if len(s.strip())>5]
    h = f'<h3>{title}</h3>'
    for s in sents[:16]:
        h += f'<p>{s}</p>'
    return h

# All exercises for all 20 chapters, 4 skills each
EX = {}

# Ch0: Nationaliteit
EX[0] = {
  "grammar": {"title":"Nationality Grammar Rules","ex":[
    {"t":"multiple-choice","p":"How do you say I come from France?","o":["Ech kommen aus Frankräich","Ech wunnen a Frankräich","Ech sinn Frankräich","Ech ginn op Frankräich"],"c":"Ech kommen aus Frankräich","e":"Use kommen aus + country name."},
    {"t":"multiple-choice","p":"What is the feminine form of I am Luxembourgish?","o":["Ech si Lëtzebuergerin","Ech si Lëtzebuerger","Ech si Lëtzebuergesch","Ech si Lëtzebuerg"],"c":"Ech si Lëtzebuergerin","e":"Feminine nationality adds -in: Lëtzebuergerin."},
    {"t":"fill-blank","p":"Complete: Ech wunnen ___ Lëtzebuerg.","o":None,"c":"zu","e":"Exception: use zu for Luxembourg."},
    {"t":"multiple-choice","p":"How do you form language names?","o":["Add -(e)sch","Add -er","Add -in","Add -ung"],"c":"Add -(e)sch","e":"Languages use -(e)sch: Lëtzebuergesch, Englesch."}
  ]},
  "reading": {"title":"Introducing Yourself Reading","ex":[
    {"t":"multiple-choice","p":"What preposition is used with kommen for countries?","o":["aus","zu","an","op"],"c":"aus","e":"Ech kommen aus + country."},
    {"t":"multiple-choice","p":"What does Ech si Lëtzebuergesch Proff mean?","o":["I am a Luxembourgish teacher","I am Luxembourgish","I speak Luxembourgish","I study Luxembourgish"],"c":"I am a Luxembourgish teacher","e":"Proff = teacher. No article before professions."},
    {"t":"fill-blank","p":"Complete: Ech kommen aus England ___ London.","o":None,"c":"vu","e":"Use vu(n) for cities."}
  ]},
  "listening": {"title":"Nationalities Listening","ex":[
    {"t":"multiple-choice","p":"What is the conjugation of kommen with du?","o":["du kënns","du komms","du kommen","du kënnt"],"c":"du kënns","e":"Kommen is irregular: du kënns."},
    {"t":"multiple-choice","p":"What is the past participle of schwätzen?","o":["geschwat","geschwätzt","schwätzt","geschwätzen"],"c":"geschwat","e":"Participle of schwätzen is geschwat."},
    {"t":"multiple-choice","p":"How do you say I am Italian (woman)?","o":["Ech sinn Italienerin","Ech sinn Italiener","Ech sinn Italienesch","Ech sinn Italien"],"c":"Ech sinn Italienerin","e":"Feminine: add -in. Italienerin."}
  ]},
  "speaking": {"title":"Introduce Yourself Speaking","ex":[
    {"t":"multiple-choice","p":"How do you say My name is Anne?","o":["Mäin Numm ass Anne","Ech heeschen Anne","Ech sinn Anne","Ech kommen Anne"],"c":"Mäin Numm ass Anne","e":"Mäin Numm ass... = My name is..."},
    {"t":"fill-blank","p":"Complete: Ech schwätze ___. (I speak Luxembourgish.)","o":None,"c":"Lëtzebuergesch","e":"Lëtzebuergesch = Luxembourgish language."},
    {"t":"multiple-choice","p":"What does an zwar mean?","o":["more precisely","and also","but rather","of course"],"c":"more precisely","e":"An zwar = more precisely."}
  ]}
}

# Ch1: Gefalen
EX[1] = {
  "grammar": {"title":"Likes and Dislikes Grammar","ex":[
    {"t":"multiple-choice","p":"How do you say I like red wine using gefalen?","o":["De roude Wäi gefält mir","Ech gefalen de roude Wäi","Ech hunn de roude Wäi","Mir gefält net"],"c":"De roude Wäi gefält mir","e":"Gefalen = to please: De roude Wäi gefält mir."},
    {"t":"multiple-choice","p":"What does Ech hunn gär Schokolaad mean?","o":["I like chocolate","I have chocolate","I eat chocolate","I want chocolate"],"c":"I like chocolate","e":"Hunn gär + noun = to like."},
    {"t":"fill-blank","p":"Complete: Mir ___ de Kaffi net.","o":None,"c":"gefält","e":"Mir gefält... net = I don't like..."},
    {"t":"multiple-choice","p":"How do you ask Did you like the food?","o":["Huet iech d'Iessen geschmaacht?","Gefält dir d'Iessen?","Hues du gär d'Iessen?","Wëlls du d'Iessen?"],"c":"Huet iech d'Iessen geschmaacht?","e":"Schmäichten for food taste."}
  ]},
  "reading": {"title":"Preferences Reading","ex":[
    {"t":"multiple-choice","p":"What does Mäi Lieblingsessen mean?","o":["My favourite food","My lunch","My cooking","My recipe"],"c":"My favourite food","e":"Lieblings- = favourite, Essen = food."},
    {"t":"multiple-choice","p":"How do you say I don't like football at all?","o":["Fussball gefält mir guer net","Ech hunn net gär Fussball","Ech spillen net Fussball","Fussball ass net gutt"],"c":"Fussball gefält mir guer net","e":"Guer net = not at all."},
    {"t":"fill-blank","p":"Complete: Ech hunn ___ gär Musek.","o":None,"c":"och","e":"Och = also/too."}
  ]},
  "listening": {"title":"What Do You Like Listening","ex":[
    {"t":"multiple-choice","p":"What does besonnesch mean?","o":["especially","beautiful","boring","basic"],"c":"especially","e":"Besonnesch = especially."},
    {"t":"multiple-choice","p":"What is Judd mat Gaardebounen?","o":["Smoked pork with broad beans","Beef stew","Fish soup","Potato salad"],"c":"Smoked pork with broad beans","e":"Traditional Luxembourgish dish."},
    {"t":"fill-blank","p":"Complete: Ech spillen Klavier ___ 10 Joer.","o":None,"c":"zanter","e":"Zanter = since/for (duration)."}
  ]},
  "speaking": {"title":"Express Preferences Speaking","ex":[
    {"t":"multiple-choice","p":"How do you ask What do you like? (informal)","o":["Wat hues du gär?","Wat gefält dir?","Wat wëlls du?","Wat méchs du gär?"],"c":"Wat hues du gär?","e":"Wat hues du gär? = What do you like?"},
    {"t":"fill-blank","p":"Complete: Ech hunn net gär fréi ___.","o":None,"c":"opstoen","e":"Opstoen = to get up."},
    {"t":"multiple-choice","p":"What does Kachen mean?","o":["Cooking","Coughing","Catching","Calling"],"c":"Cooking","e":"Kachen = cooking."}
  ]}
}

# Ch2: Weidoen
EX[2] = {
  "grammar": {"title":"Pain and Body Parts Grammar","ex":[
    {"t":"multiple-choice","p":"How do you say My head hurts?","o":["Mäi Kapp deet mir wéi","Ech hunn Kapp","Mäi Kapp ass gutt","Ech sinn Kapp"],"c":"Mäi Kapp deet mir wéi","e":"Weidoen: Mäi Kapp deet mir wéi = My head hurts."},
    {"t":"multiple-choice","p":"What does Bauchpéng mean?","o":["Headache","Stomachache","Backache","Toothache"],"c":"Stomachache","e":"Bauch = stomach, Péng = pain."},
    {"t":"fill-blank","p":"Complete: Ech hunn ___. (I have a headache.)","o":None,"c":"Kappwéi","e":"Kappwéi = headache (Kapp + wéi)."}
  ]},
  "reading": {"title":"At the Doctor Reading","ex":[
    {"t":"multiple-choice","p":"What does Wat feelt Iech? mean?","o":["What is wrong?","Where are you?","What is your name?","How old are you?"],"c":"What is wrong?","e":"Wat feelt Iech? = What is wrong with you?"},
    {"t":"multiple-choice","p":"What does Féiwer mean?","o":["Fever","Fear","Fire","Finger"],"c":"Fever","e":"Féiwer = fever."},
    {"t":"fill-blank","p":"Complete: Ech hunn ___. (I have a sore throat.)","o":None,"c":"Halswéi","e":"Halswéi = sore throat (Hals + wéi)."}
  ]},
  "listening": {"title":"Body Parts Listening","ex":[
    {"t":"multiple-choice","p":"What does Kapp mean?","o":["Hand","Foot","Head","Arm"],"c":"Head","e":"Kapp = head."},
    {"t":"multiple-choice","p":"Where are the eyes, nose, and mouth?","o":["On the hands","In the face","On the shoulders","On the feet"],"c":"In the face","e":"Am Gesiicht = in the face."},
    {"t":"multiple-choice","p":"What does Féiss mean?","o":["Fingers","Feet","Face","Arms"],"c":"Feet","e":"Féiss = feet."}
  ]},
  "speaking": {"title":"Describe Symptoms Speaking","ex":[
    {"t":"multiple-choice","p":"How do you say I don't feel well?","o":["Ech fillen mech net gutt","Ech sinn net gutt","Ech hunn net gutt","Ech ginn net gutt"],"c":"Ech fillen mech net gutt","e":"Fillen = to feel. Ech fillen mech net gutt."},
    {"t":"fill-blank","p":"Complete: Mäi Réck deet mir ___. (My back hurts.)","o":None,"c":"wéi","e":"Wéi = pain/sore. Deet mir wéi = hurts me."},
    {"t":"multiple-choice","p":"What does Erkältung mean?","o":["A cold","An allergy","A fever","A headache"],"c":"A cold","e":"Erkältung = a cold."}
  ]}
}

# Ch3: Apdikt
EX[3] = {
  "grammar": {"title":"Pharmacy Grammar","ex":[
    {"t":"multiple-choice","p":"What does mussen mean?","o":["must/have to","can","want","should"],"c":"must/have to","e":"Mussen = must/have to. Ech muss Medikamenter huelen."},
    {"t":"multiple-choice","p":"How do you say I need pills?","o":["Ech brauch Pëllen","Ech hunn Pëllen","Ech sinn Pëllen","Ech ginn Pëllen"],"c":"Ech brauch Pëllen","e":"Brauchen = to need. Ech brauch Pëllen = I need pills."},
    {"t":"fill-blank","p":"Complete: Ech ___ dës Medikamenter huelen. (I must take these medicines.)","o":None,"c":"muss","e":"Muss = must (with ech)."},
    {"t":"multiple-choice","p":"What does zweemol den Dag mean?","o":["twice a day","two days","every two hours","two pills"],"c":"twice a day","e":"Zweemol = twice, den Dag = a day."}
  ]},
  "reading": {"title":"At the Pharmacy Reading","ex":[
    {"t":"multiple-choice","p":"What does Apdikt mean?","o":["Pharmacy","Hospital","Doctor","Clinic"],"c":"Pharmacy","e":"Apdikt = pharmacy."},
    {"t":"multiple-choice","p":"What does Crème mean in this context?","o":["Cream/ointment","Ice cream","Coffee cream","Face cream"],"c":"Cream/ointment","e":"Crème = cream/ointment (medicine)."},
    {"t":"fill-blank","p":"Complete: Ech hu mech ___. (I caught a cold.)","o":None,"c":"erkaalt","e":"Sech erkaalen = to catch a cold. Erkaalt = past participle."}
  ]},
  "listening": {"title":"Pharmacy Dialogue Listening","ex":[
    {"t":"multiple-choice","p":"What does houscht mean?","o":["cough","hurt","heal","help"],"c":"cough","e":"Houscht = cough. Hien houscht = He coughs."},
    {"t":"multiple-choice","p":"What does d'Gripp mean?","o":["The flu","The grip","The cold","The fever"],"c":"The flu","e":"D'Gripp = the flu."},
    {"t":"fill-blank","p":"Complete: Si kënnen net ___. (They cannot sleep.)","o":None,"c":"schlofen","e":"Schlofen = to sleep."}
  ]},
  "speaking": {"title":"Pharmacy Conversation Speaking","ex":[
    {"t":"multiple-choice","p":"How do you say I have a cough?","o":["Ech houscht","Ech hunn Houscht","Ech sinn Houscht","Ech doen Houscht"],"c":"Ech houscht","e":"Houscht = cough (verb). Ech houscht = I cough."},
    {"t":"fill-blank","p":"Complete: Ech brauch eng ___ géint Kappwéi. (I need a pill for headache.)","o":None,"c":"Pëll","e":"Pëll = pill. Géint = against/for."},
    {"t":"multiple-choice","p":"What does verschreiwen mean?","o":["to prescribe","to write","to describe","to subscribe"],"c":"to prescribe","e":"Verschreiwen = to prescribe (medicine)."}
  ]}
}

# Ch4: An der Stad
EX[4] = {
  "grammar": {"title":"City Directions Grammar","ex":[
    {"t":"multiple-choice","p":"How do you say Excuse me in Luxembourgish?","o":["Entschëllegt","Moien","Merci","Pardon"],"c":"Entschëllegt","e":"Entschëllegt = Excuse me (formal)."},
    {"t":"multiple-choice","p":"What does riichtaus mean?","o":["straight ahead","turn right","turn left","go back"],"c":"straight ahead","e":"Riichtaus = straight ahead."},
    {"t":"fill-blank","p":"Complete: Kënnt Dir mir ___, wou...? (Can you tell me where...?)","o":None,"c":"soen","e":"Soen = to say/tell. Kënnt Dir mir soen = Can you tell me."},
    {"t":"multiple-choice","p":"What does op der rietser Säit mean?","o":["on the right side","on the left side","straight ahead","behind"],"c":"on the right side","e":"Rietser = right, Säit = side."}
  ]},
  "reading": {"title":"In the City Reading","ex":[
    {"t":"multiple-choice","p":"What does Bicherbuttek mean?","o":["Bookshop","Bakery","Butcher","Bank"],"c":"Bookshop","e":"Bicher = books, Buttek = shop."},
    {"t":"multiple-choice","p":"What does vis-à-vis mean?","o":["opposite","next to","behind","above"],"c":"opposite","e":"Vis-à-vis = opposite (from French)."},
    {"t":"fill-blank","p":"Complete: De Buttek ass op der ___ Säit. (The shop is on the left side.)","o":None,"c":"lénkser","e":"Lénkser = left. Op der lénkser Säit = on the left side."}
  ]},
  "listening": {"title":"Asking Directions Listening","ex":[
    {"t":"multiple-choice","p":"What does Gare mean?","o":["Train station","Garage","Garden","Gallery"],"c":"Train station","e":"Gare = train station."},
    {"t":"multiple-choice","p":"What does nobäi mean?","o":["nearby","far away","behind","above"],"c":"nearby","e":"Nobäi = nearby."},
    {"t":"fill-blank","p":"Complete: Dir gitt eng Minutt ___. (You go one minute straight.)","o":None,"c":"riichtaus","e":"Riichtaus = straight ahead."}
  ]},
  "speaking": {"title":"Give Directions Speaking","ex":[
    {"t":"multiple-choice","p":"How do you say Go left?","o":["Gitt lénks","Gitt riets","Gitt riichtaus","Gitt zréck"],"c":"Gitt lénks","e":"Gitt lénks = Go left."},
    {"t":"fill-blank","p":"Complete: Et ass ___ ewech. (It is far away.)","o":None,"c":"wäit","e":"Wäit = far. Wäit ewech = far away."},
    {"t":"multiple-choice","p":"What does zu Fouss goen mean?","o":["to go on foot","to go by car","to go by bus","to go fast"],"c":"to go on foot","e":"Zu Fouss = on foot. Zu Fouss goen = to walk."}
  ]}
}

# Ch5: Prepo
EX[5] = {
  "grammar": {"title":"Prepositions Grammar","ex":[
    {"t":"multiple-choice","p":"What does Gëtt et hei eng Bäckerei? mean?","o":["Is there a bakery here?","Do you have a bakery?","Where is the bakery?","I want a bakery"],"c":"Is there a bakery here?","e":"Gëtt et = Is there / There is."},
    {"t":"multiple-choice","p":"Which preposition means opposite?","o":["vis-à-vis","niewent","hannert","ënner"],"c":"vis-à-vis","e":"Vis-à-vis = opposite."},
    {"t":"fill-blank","p":"Complete: D'Bäckerei ass ___ der Schoul. (The bakery is next to the school.)","o":None,"c":"niewent","e":"Niewent = next to."},
    {"t":"multiple-choice","p":"What does zou mean?","o":["closed","open","far","near"],"c":"closed","e":"Zou = closed. Op = open."}
  ]},
  "reading": {"title":"Places in Town Reading","ex":[
    {"t":"multiple-choice","p":"What does Mëttesstonn mean?","o":["Lunchtime","Midnight","Morning","Evening"],"c":"Lunchtime","e":"Mëttesstonn = lunchtime."},
    {"t":"multiple-choice","p":"What does all Dag mean?","o":["every day","all day","one day","that day"],"c":"every day","e":"All Dag = every day."},
    {"t":"fill-blank","p":"Complete: D'Bäckerei ass ___ 7 Auer moies op. (The bakery is open from 7am.)","o":None,"c":"vu","e":"Vu = from (time). Vu 7 Auer = from 7 o'clock."}
  ]},
  "listening": {"title":"Opening Hours Listening","ex":[
    {"t":"multiple-choice","p":"What does Schwämm mean?","o":["Swimming pool","Swamp","Shower","Stream"],"c":"Swimming pool","e":"Schwämm = swimming pool."},
    {"t":"multiple-choice","p":"What does Bibliothéik mean?","o":["Library","Bookshop","School","Museum"],"c":"Library","e":"Bibliothéik = library."},
    {"t":"fill-blank","p":"Complete: Et gëtt ___ op der Gare. (There is one at the station.)","o":None,"c":"een","e":"Een = one. Et gëtt een = There is one."}
  ]},
  "speaking": {"title":"Ask About Places Speaking","ex":[
    {"t":"multiple-choice","p":"How do you ask Is there a pharmacy here?","o":["Gëtt et hei eng Apdikt?","Wou ass d'Apdikt?","Hutt dir eng Apdikt?","Ass d'Apdikt op?"],"c":"Gëtt et hei eng Apdikt?","e":"Gëtt et hei + article + noun = Is there a ... here?"},
    {"t":"fill-blank","p":"Complete: D'Geschäft ass ___ der Kierch. (The shop is behind the church.)","o":None,"c":"hannert","e":"Hannert = behind."},
    {"t":"multiple-choice","p":"What does Rendez-Vous mean?","o":["Appointment","Restaurant","Meeting point","Date"],"c":"Appointment","e":"Rendez-Vous = appointment (from French)."}
  ]}
}

# Ch6: An der Stad 2
EX[6] = {
  "grammar": {"title":"City Vocabulary 2 Grammar","ex":[
    {"t":"multiple-choice","p":"What does Geschäft mean?","o":["Shop/store","Business","Gift","History"],"c":"Shop/store","e":"Geschäft = shop/store."},
    {"t":"multiple-choice","p":"How do you say I am looking for the centre?","o":["Ech sichen den Zentrum","Ech fannen den Zentrum","Ech ginn an den Zentrum","Ech kucken den Zentrum"],"c":"Ech sichen den Zentrum","e":"Sichen = to look for/search."},
    {"t":"fill-blank","p":"Complete: Kënnt Dir mir ___? (Can you help me?)","o":None,"c":"hëllefen","e":"Hëllefen = to help."},
    {"t":"multiple-choice","p":"What does ongeféier mean?","o":["approximately","unfortunately","certainly","exactly"],"c":"approximately","e":"Ongeféier = approximately."}
  ]},
  "reading": {"title":"Shopping in Town Reading","ex":[
    {"t":"multiple-choice","p":"What does Plaz mean?","o":["Square/place","Palace","Plate","Plan"],"c":"Square/place","e":"Plaz = square/place."},
    {"t":"multiple-choice","p":"What does iwwer mean?","o":["over/across","under","beside","behind"],"c":"over/across","e":"Iwwer = over/across."},
    {"t":"fill-blank","p":"Complete: Den Zentrum ass nëmmen 10 Minutten vun ___. (The centre is only 10 minutes from here.)","o":None,"c":"hei","e":"Hei = here. Vun hei = from here."}
  ]},
  "listening": {"title":"City Information Listening","ex":[
    {"t":"multiple-choice","p":"What does gemittlech mean?","o":["cosy/leisurely","quickly","sadly","loudly"],"c":"cosy/leisurely","e":"Gemittlech = cosy/leisurely."},
    {"t":"multiple-choice","p":"What does dono mean?","o":["afterwards","before","during","never"],"c":"afterwards","e":"Dono = afterwards."},
    {"t":"fill-blank","p":"Complete: Fir d'éischt ginn ech an ___. (First I go to the pharmacy.)","o":None,"c":"d'Apdikt","e":"Fir d'éischt = first. D'Apdikt = the pharmacy."}
  ]},
  "speaking": {"title":"City Conversations Speaking","ex":[
    {"t":"multiple-choice","p":"How do you say please (abbreviated)?","o":["w.e.g.","s.v.p.","b.t.w.","a.s.a.p."],"c":"w.e.g.","e":"W.e.g. = wann ech gelift = please."},
    {"t":"fill-blank","p":"Complete: Ech ginn ___ Japaner iessen. (I go to eat at the Japanese restaurant.)","o":None,"c":"bei de","e":"Bei de = at the (restaurant). Ginn bei de Japaner iessen."},
    {"t":"multiple-choice","p":"What does séier mean?","o":["quickly","slowly","sadly","happily"],"c":"quickly","e":"Séier = quickly."}
  ]}
}

# Ch7: Mai Program
EX[7] = {
  "grammar": {"title":"Daily Routine Grammar","ex":[
    {"t":"multiple-choice","p":"How do you say in the morning in Luxembourgish?","o":["moies","owes","mëttes","nuets"],"c":"moies","e":"Moies = in the morning."},
    {"t":"multiple-choice","p":"What does Auer mean?","o":["hour/o'clock","our","ear","eye"],"c":"hour/o'clock","e":"Auer = hour/o'clock. Um 8 Auer = at 8 o'clock."},
    {"t":"fill-blank","p":"Complete: Ech stinn ___ 7 Auer op. (I get up at 7 o'clock.)","o":None,"c":"um","e":"Um = at (time). Um 7 Auer = at 7 o'clock."},
    {"t":"multiple-choice","p":"What does owes mean?","o":["in the evening","always","outside","over"],"c":"in the evening","e":"Owes = in the evening."}
  ]},
  "reading": {"title":"A Day in Town Reading","ex":[
    {"t":"multiple-choice","p":"What does Mëtteg mean?","o":["Afternoon/noon","Midnight","Morning","Evening"],"c":"Afternoon/noon","e":"Mëtteg = afternoon/noon."},
    {"t":"multiple-choice","p":"What does éier mean?","o":["before","after","during","always"],"c":"before","e":"Éier = before. Éier ech heemkommen = before I come home."},
    {"t":"fill-blank","p":"Complete: Ech ginn an d'Schwämm an ___ ech heemkommen... (before I come home)","o":None,"c":"éier","e":"Éier = before."}
  ]},
  "listening": {"title":"Daily Schedule Listening","ex":[
    {"t":"multiple-choice","p":"What does heemkommen mean?","o":["to come home","to welcome","to arrive","to leave"],"c":"to come home","e":"Heemkommen = to come home. Heem = home."},
    {"t":"multiple-choice","p":"What does Elteren mean?","o":["Parents","Elderly","Older","Ancestors"],"c":"Parents","e":"Elteren = parents."},
    {"t":"fill-blank","p":"Complete: Haut de ___ ginn ech an d'Schwämm. (This afternoon I go to the pool.)","o":None,"c":"Mëtteg","e":"Haut de Mëtteg = this afternoon."}
  ]},
  "speaking": {"title":"Describe Your Day Speaking","ex":[
    {"t":"multiple-choice","p":"How do you say I go to work?","o":["Ech ginn op d'Aarbecht","Ech schaffen op d'Aarbecht","Ech kommen op d'Aarbecht","Ech sinn op d'Aarbecht"],"c":"Ech ginn op d'Aarbecht","e":"Ginn op d'Aarbecht = to go to work."},
    {"t":"fill-blank","p":"Complete: Ech iessen zu ___ (I eat lunch)","o":None,"c":"Mëtteg","e":"Zu Mëtteg iessen = to eat lunch."},
    {"t":"multiple-choice","p":"What does nach séier mean?","o":["quickly still","not yet","very fast","too slow"],"c":"quickly still","e":"Nach séier = quickly still / just quickly."}
  ]}
}

# Ch8: Haus
EX[8] = {
  "grammar": {"title":"House Vocabulary Grammar","ex":[
    {"t":"multiple-choice","p":"What does Wunneng mean?","o":["Flat/apartment","House","Room","Building"],"c":"Flat/apartment","e":"Wunneng = flat/apartment."},
    {"t":"multiple-choice","p":"What does um drëtte Stack mean?","o":["on the third floor","in the third room","at three o'clock","three stairs"],"c":"on the third floor","e":"Stack = floor. Um drëtte Stack = on the third floor."},
    {"t":"fill-blank","p":"Complete: Ech hunn zwee ___. (I have two bedrooms.)","o":None,"c":"Schlofzëmmeren","e":"Schlofzëmmer = bedroom. Plural: Schlofzëmmeren."},
    {"t":"multiple-choice","p":"What does zimlech grouss mean?","o":["quite big","very small","extremely tall","fairly new"],"c":"quite big","e":"Zimlech = quite/fairly. Grouss = big."}
  ]},
  "reading": {"title":"My Home Reading","ex":[
    {"t":"multiple-choice","p":"What does Stuff mean?","o":["Living room","Stuff/things","Kitchen","Bedroom"],"c":"Living room","e":"Stuff = living room."},
    {"t":"multiple-choice","p":"What does Buedzëmmer mean?","o":["Bathroom","Bedroom","Basement","Balcony"],"c":"Bathroom","e":"Buedzëmmer = bathroom."},
    {"t":"fill-blank","p":"Complete: Ech hunn eng ___ Kichen. (I have a kitchen.)","o":None,"c":"gemittlech","e":"Gemittlech = cosy. Eng gemittlech Kichen = a cosy kitchen."}
  ]},
  "listening": {"title":"Describing Homes Listening","ex":[
    {"t":"multiple-choice","p":"What does Gaart mean?","o":["Garden","Garage","Gate","Gallery"],"c":"Garden","e":"Gaart = garden."},
    {"t":"multiple-choice","p":"What does deier mean?","o":["expensive","cheap","dear","dark"],"c":"expensive","e":"Deier = expensive. Bëlleg = cheap."},
    {"t":"fill-blank","p":"Complete: Ass dëst Haus ___? (Is this house expensive?)","o":None,"c":"deier","e":"Deier = expensive."}
  ]},
  "speaking": {"title":"Describe Your Home Speaking","ex":[
    {"t":"multiple-choice","p":"How do you say I live in an apartment?","o":["Ech wunnen an engem Appartement","Ech sinn an engem Appartement","Ech hunn en Appartement","Ech ginn an en Appartement"],"c":"Ech wunnen an engem Appartement","e":"Wunnen an engem = to live in a."},
    {"t":"fill-blank","p":"Complete: Meng Wunneng huet keng ___. (My flat has no garage.)","o":None,"c":"Garage","e":"Keng = no (feminine). Keng Garage = no garage."},
    {"t":"multiple-choice","p":"What does leider net mean?","o":["unfortunately not","gladly not","lately not","luckily not"],"c":"unfortunately not","e":"Leider = unfortunately. Leider net = unfortunately not."}
  ]}
}

# Ch9: Revisioun
EX[9] = {
  "grammar": {"title":"Review Grammar","ex":[
    {"t":"multiple-choice","p":"Translate: Ech wunnen zu Lëtzebuerg zu Mamer","o":["I live in Luxembourg in Mamer","I come from Luxembourg from Mamer","I work in Luxembourg in Mamer","I go to Luxembourg to Mamer"],"c":"I live in Luxembourg in Mamer","e":"Wunnen zu = to live in."},
    {"t":"multiple-choice","p":"What does Villmools merci mean?","o":["Thank you very much","Many times","Very good","Much better"],"c":"Thank you very much","e":"Villmools merci = Thank you very much."},
    {"t":"fill-blank","p":"Complete: Mir gefält d'Wieder guer ___ hei. (I don't like the weather at all here.)","o":None,"c":"net","e":"Guer net = not at all."},
    {"t":"multiple-choice","p":"What does Ah sou? mean?","o":["Oh really?","Oh no!","Oh yes!","Oh well!"],"c":"Oh really?","e":"Ah sou? = Oh really? / Is that so?"}
  ]},
  "reading": {"title":"Translation Challenge Reading","ex":[
    {"t":"multiple-choice","p":"What does Natierlech mean?","o":["Of course","Naturally","National","Neutral"],"c":"Of course","e":"Natierlech = of course/naturally."},
    {"t":"multiple-choice","p":"What does Firwat mean?","o":["Why","Where","When","How"],"c":"Why","e":"Firwat = why."},
    {"t":"fill-blank","p":"Complete: Ech schwätzen natierlech Englesch mee ___ Franséisch. (I speak of course English but also French.)","o":None,"c":"och","e":"Och = also. Mee och = but also."}
  ]},
  "listening": {"title":"Conversations Review Listening","ex":[
    {"t":"multiple-choice","p":"What does Majo mean?","o":["Well (filler word)","Maybe","Major","My job"],"c":"Well (filler word)","e":"Majo = well (conversation filler)."},
    {"t":"multiple-choice","p":"What does am Moment mean?","o":["at the moment","in a moment","for a moment","the moment"],"c":"at the moment","e":"Am Moment = at the moment."},
    {"t":"fill-blank","p":"Complete: Ech mengen ech hu mech ___. (I think I caught a cold.)","o":None,"c":"erkaalt","e":"Sech erkaalen = to catch a cold."}
  ]},
  "speaking": {"title":"Review Conversations Speaking","ex":[
    {"t":"multiple-choice","p":"How do you say Good morning (formal)?","o":["Gudde Moien","Moien","Äddi","Salut"],"c":"Gudde Moien","e":"Gudde Moien = Good morning (formal)."},
    {"t":"fill-blank","p":"Complete: Wéi geet et ___? (How are you? formal)","o":None,"c":"Iech","e":"Iech = you (formal dative). Wéi geet et Iech?"},
    {"t":"multiple-choice","p":"What does immens gutt mean?","o":["very good/a lot","always good","sometimes good","not good"],"c":"very good/a lot","e":"Immens = very/immensely. Immens gutt = very good."}
  ]}
}

# Ch10: Perfect mat hunn (A2)
EX[10] = {
  "grammar": {"title":"Perfect Tense with hunn Grammar","ex":[
    {"t":"multiple-choice","p":"How do you form the regular past participle?","o":["ge- + root + -t","ge- + root + -en","root + -t","ge- + root"],"c":"ge- + root + -t","e":"Regular: ge- + root + -t. schaffen -> geschafft."},
    {"t":"multiple-choice","p":"What is the past participle of spillen (to play)?","o":["gespillt","gespillen","gespill","spillt"],"c":"gespillt","e":"Spill + ge- + -t = gespillt."},
    {"t":"fill-blank","p":"Complete: Ech hunn de Moie ___. (I worked this morning.)","o":None,"c":"geschafft","e":"Geschafft = past participle of schaffen."},
    {"t":"multiple-choice","p":"What is the past participle of iessen (to eat)?","o":["giess","geiessen","geiesst","iess"],"c":"giess","e":"Iessen is irregular: giess."}
  ]},
  "reading": {"title":"What Did You Do Yesterday Reading","ex":[
    {"t":"multiple-choice","p":"What does gëschter mean?","o":["yesterday","today","tomorrow","always"],"c":"yesterday","e":"Gëschter = yesterday."},
    {"t":"multiple-choice","p":"What does ugeruff mean?","o":["called (phone)","got up","arrived","left"],"c":"called (phone)","e":"Ugeruff = past participle of uruffen (to call)."},
    {"t":"fill-blank","p":"Complete: Ech hu gëschter laang ___. (I slept late yesterday.)","o":None,"c":"geschlof","e":"Geschlof = past participle of schlofen (to sleep)."}
  ]},
  "listening": {"title":"Past Tense Listening","ex":[
    {"t":"multiple-choice","p":"What does gedronk mean?","o":["drank","thought","dried","dreamed"],"c":"drank","e":"Gedronk = past participle of drénken (to drink)."},
    {"t":"multiple-choice","p":"What is a separable verb example?","o":["uruffen (to call)","schaffen (to work)","iessen (to eat)","drénken (to drink)"],"c":"uruffen (to call)","e":"Uruffen: un + ruffen. Separable: ge- goes in middle: ugeruff."},
    {"t":"fill-blank","p":"Complete: Meng Noperen hunn en neien Auto ___. (My neighbours bought a new car.)","o":None,"c":"kaaft","e":"Kaaft = past participle of kafen (to buy)."}
  ]},
  "speaking": {"title":"Talk About Your Day Speaking","ex":[
    {"t":"multiple-choice","p":"How do you say I cooked yesterday?","o":["Ech hu gëschter gekacht","Ech kachen gëschter","Ech wäert gëschter kachen","Ech sinn gëschter gekacht"],"c":"Ech hu gëschter gekacht","e":"Perfect with hunn: Ech hu + time + past participle."},
    {"t":"fill-blank","p":"Complete: Wat hues du gëschter ___? (What did you do yesterday?)","o":None,"c":"gemaach","e":"Gemaach = past participle of maachen (to do/make)."},
    {"t":"multiple-choice","p":"Where does the past participle go in the sentence?","o":["At the very end","After the subject","Before hunn","At the beginning"],"c":"At the very end","e":"Past participle always goes at the end of the sentence."}
  ]}
}

# Ch11: Perfect mat sinn (A2)
EX[11] = {
  "grammar": {"title":"Perfect Tense with sinn Grammar","ex":[
    {"t":"multiple-choice","p":"When do you use sinn instead of hunn in perfect tense?","o":["Change of place or state","Always with regular verbs","Only with food verbs","With all verbs"],"c":"Change of place or state","e":"Use sinn when there is a change of place (A to B) or change of state."},
    {"t":"multiple-choice","p":"What is the past participle of goen (to go)?","o":["gaang(en)","gegoen","goeng","gegaang"],"c":"gaang(en)","e":"Goen -> gaang or gaangen (irregular)."},
    {"t":"fill-blank","p":"Complete: Ech sinn op London ___. (I flew to London.)","o":None,"c":"geflunn","e":"Geflunn = past participle of fléien (to fly)."},
    {"t":"multiple-choice","p":"What is the past participle of fueren (to drive)?","o":["gefuer","gefueren","gefuert","fuert"],"c":"gefuer","e":"Fueren -> gefuer (irregular)."}
  ]},
  "reading": {"title":"Travel Stories Reading","ex":[
    {"t":"multiple-choice","p":"What does opstoen mean?","o":["to get up","to stand still","to stop","to open"],"c":"to get up","e":"Opstoen = to get up. Participle: opgestan(en)."},
    {"t":"multiple-choice","p":"Why does aschlofen use sinn?","o":["Change of state (awake to asleep)","It is regular","It uses hunn","It is a food verb"],"c":"Change of state (awake to asleep)","e":"Aschlofen = to fall asleep. Change of state -> sinn."},
    {"t":"fill-blank","p":"Complete: Ech si géint 5h30 ___. (I came home at 5:30.)","o":None,"c":"heemkomm","e":"Heemkomm = past participle of heemkommen (to come home)."}
  ]},
  "listening": {"title":"Movement Verbs Listening","ex":[
    {"t":"multiple-choice","p":"What does gelaf mean?","o":["ran","laughed","lived","learned"],"c":"ran","e":"Gelaf = past participle of lafen (to run)."},
    {"t":"multiple-choice","p":"What does ukomm mean?","o":["arrived","overcome","upcoming","income"],"c":"arrived","e":"Ukomm = past participle of ukommen (to arrive)."},
    {"t":"fill-blank","p":"Complete: Ech si mam Zuch op Paräis ___. (I took the train to Paris.)","o":None,"c":"gefuer","e":"Gefuer = past participle of fueren."}
  ]},
  "speaking": {"title":"Describe Past Movements Speaking","ex":[
    {"t":"multiple-choice","p":"How do you say I went to bed early?","o":["Ech si fréi an d'Bett gaangen","Ech hu fréi an d'Bett gaangen","Ech war fréi am Bett","Ech ginn fréi an d'Bett"],"c":"Ech si fréi an d'Bett gaangen","e":"Goen uses sinn: Ech si... gaangen."},
    {"t":"fill-blank","p":"Complete: Wéini bass du gëschter ___? (When did you get up yesterday?)","o":None,"c":"opgestanen","e":"Opgestanen = past participle of opstoen."},
    {"t":"multiple-choice","p":"What does Ech war midd mean?","o":["I was tired","I was in the middle","I was mild","I was mixed"],"c":"I was tired","e":"War = was (imperfect of sinn). Midd = tired."}
  ]}
}
