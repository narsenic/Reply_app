#!/usr/bin/env python3
"""
Reads all 20 PDFs from Study_Materials/ (excluding 'Copy' files),
extracts text, and generates a TypeScript seed function that creates
lessons with actual PDF content for chapters 4-20 (chapters 1-3 already seeded).
"""

import os
import re
import json
import glob
from PyPDF2 import PdfReader


def extract_pdf_text(filepath):
    """Extract all text from a PDF file."""
    reader = PdfReader(filepath)
    text = ""
    for page in reader.pages:
        t = page.extract_text()
        if t:
            text += t + "\n"
    return text.strip()


def get_pdf_files():
    """Get all PDF files excluding 'Copy' files, sorted by chapter number."""
    all_pdfs = glob.glob("Study_Materials/*.pdf")
    # Exclude files with "Copy" in the name
    pdfs = [p for p in all_pdfs if "Copy" not in os.path.basename(p)]
    
    # Sort by chapter number
    def sort_key(path):
        basename = os.path.basename(path)
        match = re.match(r"(\d+)", basename)
        return int(match.group(1)) if match else 999
    
    pdfs.sort(key=sort_key)
    return pdfs


def escape_ts_string(s):
    """Escape a string for use inside TypeScript template literals or strings."""
    s = s.replace("\\", "\\\\")
    s = s.replace("`", "\\`")
    s = s.replace("${", "\\${")
    s = s.replace('"', '\\"')
    s = s.replace("'", "\\'")
    return s


def escape_for_html(s):
    """Escape for HTML content inside TS strings."""
    s = s.replace("&", "&amp;")
    s = s.replace("<", "&lt;")
    s = s.replace(">", "&gt;")
    return s


def clean_text(text):
    """Clean extracted PDF text for use in content."""
    # Remove excessive whitespace
    text = re.sub(r'\n{3,}', '\n\n', text)
    text = re.sub(r' {2,}', ' ', text)
    return text.strip()


def extract_vocabulary(text):
    """Try to extract vocabulary items from the text."""
    vocab = []
    # Look for patterns like "word = translation" or "word - translation"
    patterns = [
        r'(\w[\w\s\'éèêëàâäùûüôöîïç]+?)\s*[=–-]\s*(\w[\w\s\'éèêëàâäùûüôöîïç]+)',
    ]
    for pattern in patterns:
        matches = re.findall(pattern, text, re.IGNORECASE)
        for m in matches:
            if len(m[0].strip()) > 1 and len(m[1].strip()) > 1:
                vocab.append((m[0].strip(), m[1].strip()))
    return vocab[:15]  # Limit


def extract_example_sentences(text):
    """Extract example sentences from the text."""
    sentences = []
    # Look for lines that look like examples (contain both Luxembourgish and translations)
    lines = text.split('\n')
    for line in lines:
        line = line.strip()
        if len(line) > 10 and len(line) < 200:
            # Lines with = or - separating LB and translation
            if re.search(r'[=–-]', line) and not line.startswith('#'):
                sentences.append(line)
    return sentences[:10]


def make_grammar_content(chapter_title, text, chapter_num):
    """Create grammar lesson content from PDF text."""
    clean = clean_text(text)
    # Take first ~800 chars for the main content
    excerpt = clean[:800]
    if len(clean) > 800:
        # Try to cut at a sentence boundary
        cut = clean[:800].rfind('.')
        if cut > 400:
            excerpt = clean[:cut+1]
    
    escaped = escape_for_html(excerpt)
    # Convert newlines to HTML
    paragraphs = [p.strip() for p in escaped.split('\n') if p.strip()]
    html_body = f"<h3>{escape_for_html(chapter_title)} -- Grammar Rules</h3>"
    for p in paragraphs[:12]:
        html_body += f"<p>{p}</p>"
    
    return html_body


def make_reading_content(chapter_title, text):
    """Create reading lesson content from PDF text."""
    clean = clean_text(text)
    # Use a middle section for reading passage
    start = len(clean) // 4
    excerpt = clean[start:start+600]
    if len(clean) > start + 600:
        cut = excerpt.rfind('.')
        if cut > 200:
            excerpt = excerpt[:cut+1]
    
    escaped = escape_for_html(excerpt)
    paragraphs = [p.strip() for p in escaped.split('\n') if p.strip()]
    html_body = f"<h3>{escape_for_html(chapter_title)} -- Reading Passage</h3>"
    for p in paragraphs[:10]:
        html_body += f"<p>{p}</p>"
    
    return html_body


def make_listening_content(chapter_title, text):
    """Create listening lesson transcript from PDF text."""
    clean = clean_text(text)
    # Use a different section
    start = len(clean) // 2
    excerpt = clean[start:start+500]
    if len(clean) > start + 500:
        cut = excerpt.rfind('.')
        if cut > 150:
            excerpt = excerpt[:cut+1]
    
    escaped = escape_for_html(excerpt)
    paragraphs = [p.strip() for p in escaped.split('\n') if p.strip()]
    body = f"<h3>Transcript: {escape_for_html(chapter_title)}</h3>"
    for p in paragraphs[:8]:
        body += f"<p>{p}</p>"
    
    return body


def make_speaking_content(chapter_title, text):
    """Create speaking lesson prompts from PDF text."""
    vocab = extract_vocabulary(text)
    examples = extract_example_sentences(text)
    
    body = f"<h3>Practice: {escape_for_html(chapter_title)} -- Speaking</h3>"
    body += "<p>Practice saying these phrases and vocabulary out loud:</p><ul>"
    
    if vocab:
        for lb, en in vocab[:6]:
            body += f"<li><strong>{escape_for_html(lb)}</strong> -- {escape_for_html(en)}</li>"
    elif examples:
        for ex in examples[:6]:
            body += f"<li>{escape_for_html(ex)}</li>"
    else:
        body += f"<li>Practice vocabulary from the {escape_for_html(chapter_title)} chapter</li>"
    
    body += "</ul><p>Try to form your own sentences using these patterns.</p>"
    return body


def generate_exercises_from_text(text, skill, chapter_title):
    """Generate exercises based on the PDF content and skill type."""
    clean = clean_text(text)
    vocab = extract_vocabulary(text)
    
    exercises = []
    
    if skill == "grammar":
        exercises = generate_grammar_exercises(clean, vocab, chapter_title)
    elif skill == "reading":
        exercises = generate_reading_exercises(clean, vocab, chapter_title)
    elif skill == "listening":
        exercises = generate_listening_exercises(clean, vocab, chapter_title)
    elif skill == "speaking":
        exercises = generate_speaking_exercises(clean, vocab, chapter_title)
    
    return exercises


def generate_grammar_exercises(text, vocab, chapter_title):
    """Generate grammar exercises from content."""
    exercises = []
    
    # Extract key terms from text for exercises
    words = re.findall(r'\b[A-ZÉÈÊËÀÂÄÙÛÜÔÖÎÏÇ][a-zéèêëàâäùûüôöîïç]{2,}\b', text)
    unique_words = list(dict.fromkeys(words))[:20]
    
    if vocab and len(vocab) >= 2:
        # Exercise 1: vocabulary meaning
        v = vocab[0]
        wrong = [vv[1] for vv in vocab[1:4]] if len(vocab) > 3 else ["house", "water", "book"]
        while len(wrong) < 3:
            wrong.append("something else")
        options = [v[1]] + wrong[:3]
        exercises.append({
            "type": "multiple-choice",
            "prompt": f"What does '{v[0]}' mean?",
            "options": options,
            "correctAnswer": v[1],
            "explanation": f"'{v[0]}' means '{v[1]}' in the context of {chapter_title}.",
            "orderIndex": 0,
        })
    else:
        exercises.append({
            "type": "multiple-choice",
            "prompt": f"Which topic does this chapter cover?",
            "options": [chapter_title, "Weather", "Animals", "Numbers"],
            "correctAnswer": chapter_title,
            "explanation": f"This chapter covers {chapter_title}.",
            "orderIndex": 0,
        })
    
    if vocab and len(vocab) >= 3:
        v = vocab[1]
        exercises.append({
            "type": "multiple-choice",
            "prompt": f"Translate: '{v[0]}'",
            "options": [v[1], vocab[2][1] if len(vocab) > 2 else "tree", vocab[0][1], "none of these"],
            "correctAnswer": v[1],
            "explanation": f"'{v[0]}' translates to '{v[1]}'.",
            "orderIndex": 1,
        })
    else:
        exercises.append({
            "type": "multiple-choice",
            "prompt": f"What is the main grammar concept in {chapter_title}?",
            "options": [f"{chapter_title} grammar rules", "Past tense only", "Future tense only", "Adjective declension"],
            "correctAnswer": f"{chapter_title} grammar rules",
            "explanation": f"This lesson focuses on grammar rules related to {chapter_title}.",
            "orderIndex": 1,
        })
    
    if vocab and len(vocab) >= 4:
        v = vocab[3]
        exercises.append({
            "type": "fill-blank",
            "prompt": f"Complete the translation: {v[0]} = ___",
            "options": None,
            "correctAnswer": v[1],
            "explanation": f"The correct translation is '{v[1]}'.",
            "orderIndex": 2,
        })
    else:
        exercises.append({
            "type": "multiple-choice",
            "prompt": f"Which skill does this lesson practice?",
            "options": ["Grammar", "Reading", "Listening", "Speaking"],
            "correctAnswer": "Grammar",
            "explanation": "This is a grammar lesson focusing on rules and structures.",
            "orderIndex": 2,
        })
    
    return exercises


def generate_reading_exercises(text, vocab, chapter_title):
    """Generate reading comprehension exercises."""
    exercises = []
    
    if vocab and len(vocab) >= 2:
        v = vocab[0]
        wrong = [vv[1] for vv in vocab[1:4]] if len(vocab) > 3 else ["morning", "evening", "night"]
        while len(wrong) < 3:
            wrong.append("something else")
        exercises.append({
            "type": "multiple-choice",
            "prompt": f"Based on the reading, what does '{v[0]}' mean?",
            "options": [v[1]] + wrong[:3],
            "correctAnswer": v[1],
            "explanation": f"In the reading passage, '{v[0]}' means '{v[1]}'.",
            "orderIndex": 0,
        })
    else:
        exercises.append({
            "type": "multiple-choice",
            "prompt": f"What is the main topic of this reading passage?",
            "options": [chapter_title, "Cooking recipes", "Sports results", "Weather forecast"],
            "correctAnswer": chapter_title,
            "explanation": f"The reading passage is about {chapter_title}.",
            "orderIndex": 0,
        })
    
    if vocab and len(vocab) >= 3:
        v = vocab[2]
        exercises.append({
            "type": "multiple-choice",
            "prompt": f"In the passage, '{v[0]}' refers to:",
            "options": [v[1], vocab[0][1] if vocab else "house", vocab[1][1] if len(vocab) > 1 else "car", "none of these"],
            "correctAnswer": v[1],
            "explanation": f"'{v[0]}' means '{v[1]}' as used in the passage.",
            "orderIndex": 1,
        })
    else:
        exercises.append({
            "type": "multiple-choice",
            "prompt": f"Which level is this reading passage designed for?",
            "options": ["Beginner (A1/A2)", "Intermediate (B1)", "Advanced (C1)", "Native speaker"],
            "correctAnswer": "Beginner (A1/A2)",
            "explanation": "This passage is designed for beginner learners.",
            "orderIndex": 1,
        })
    
    exercises.append({
        "type": "multiple-choice",
        "prompt": f"What should you focus on when reading about {chapter_title}?",
        "options": ["Key vocabulary and sentence patterns", "Only the grammar rules", "Only the pronunciation", "Only the spelling"],
        "correctAnswer": "Key vocabulary and sentence patterns",
        "explanation": "When reading, focus on both vocabulary and how sentences are structured.",
        "orderIndex": 2,
    })
    
    return exercises


def generate_listening_exercises(text, vocab, chapter_title):
    """Generate listening comprehension exercises."""
    exercises = []
    
    if vocab and len(vocab) >= 2:
        v = vocab[0]
        wrong = [vv[1] for vv in vocab[1:4]] if len(vocab) > 3 else ["school", "park", "office"]
        while len(wrong) < 3:
            wrong.append("something else")
        exercises.append({
            "type": "multiple-choice",
            "prompt": f"In the transcript, what does '{v[0]}' mean?",
            "options": [v[1]] + wrong[:3],
            "correctAnswer": v[1],
            "explanation": f"'{v[0]}' means '{v[1]}' in this context.",
            "orderIndex": 0,
        })
    else:
        exercises.append({
            "type": "multiple-choice",
            "prompt": f"What is the transcript about?",
            "options": [chapter_title, "A news report", "A song", "A phone call"],
            "correctAnswer": chapter_title,
            "explanation": f"The transcript covers the topic of {chapter_title}.",
            "orderIndex": 0,
        })
    
    if vocab and len(vocab) >= 3:
        v = vocab[1]
        exercises.append({
            "type": "multiple-choice",
            "prompt": f"You hear the word '{v[0]}'. What does it mean?",
            "options": [v[1], vocab[2][1] if len(vocab) > 2 else "table", vocab[0][1], "I don't know"],
            "correctAnswer": v[1],
            "explanation": f"'{v[0]}' translates to '{v[1]}'.",
            "orderIndex": 1,
        })
    else:
        exercises.append({
            "type": "multiple-choice",
            "prompt": f"What skill does this listening exercise practice?",
            "options": ["Comprehension of spoken Luxembourgish", "Writing skills", "Reading speed", "Grammar rules"],
            "correctAnswer": "Comprehension of spoken Luxembourgish",
            "explanation": "Listening exercises help you understand spoken Luxembourgish.",
            "orderIndex": 1,
        })
    
    return exercises


def generate_speaking_exercises(text, vocab, chapter_title):
    """Generate speaking exercises."""
    exercises = []
    
    if vocab and len(vocab) >= 1:
        v = vocab[0]
        exercises.append({
            "type": "multiple-choice",
            "prompt": f"How would you say '{v[1]}' in Luxembourgish?",
            "options": [v[0], vocab[1][0] if len(vocab) > 1 else "Moien", vocab[2][0] if len(vocab) > 2 else "Addi", "Merci"],
            "correctAnswer": v[0],
            "explanation": f"'{v[1]}' in Luxembourgish is '{v[0]}'.",
            "orderIndex": 0,
        })
    else:
        exercises.append({
            "type": "multiple-choice",
            "prompt": f"What should you practice saying in this lesson?",
            "options": [f"Vocabulary related to {chapter_title}", "Only numbers", "Only colors", "Only greetings"],
            "correctAnswer": f"Vocabulary related to {chapter_title}",
            "explanation": f"This speaking lesson focuses on {chapter_title} vocabulary.",
            "orderIndex": 0,
        })
    
    if vocab and len(vocab) >= 2:
        v = vocab[1]
        exercises.append({
            "type": "multiple-choice",
            "prompt": f"Practice saying: '{v[0]}'. What does it mean?",
            "options": [v[1], vocab[0][1], vocab[2][1] if len(vocab) > 2 else "hello", "goodbye"],
            "correctAnswer": v[1],
            "explanation": f"'{v[0]}' means '{v[1]}'. Practice saying it out loud!",
            "orderIndex": 1,
        })
    else:
        exercises.append({
            "type": "multiple-choice",
            "prompt": f"Why is speaking practice important for {chapter_title}?",
            "options": ["To build confidence and fluency", "Only for exams", "It is not important", "Only for writing"],
            "correctAnswer": "To build confidence and fluency",
            "explanation": "Speaking practice helps build confidence and fluency in real conversations.",
            "orderIndex": 1,
        })
    
    return exercises


# Chapter mapping: PDF number -> (level, orderIndex, title)
CHAPTER_MAP = {
    1:  ("A1", 0, "Nationaliteit"),
    2:  ("A1", 1, "Gefalen"),
    3:  ("A1", 2, "Weidoen"),
    4:  ("A1", 3, "Apdikt"),
    5:  ("A1", 4, "An der Stad"),
    6:  ("A1", 5, "Prepo"),
    7:  ("A1", 6, "An der Stad 2"),
    8:  ("A1", 7, "Mai Program"),
    9:  ("A1", 8, "Haus"),
    10: ("A1", 9, "Revisioun"),
    11: ("A2", 0, "Perfect mat hunn"),
    12: ("A2", 1, "Perfect mat sinn"),
    13: ("A2", 2, "Vakanz"),
    14: ("A2", 3, "Imperfect"),
    15: ("A2", 4, "Kleeder"),
    16: ("A2", 5, "Verglaich"),
    17: ("A2", 6, "Well"),
    18: ("A2", 7, "Wellen"),
    19: ("A2", 8, "Reflexiv Verben 1"),
    20: ("A2", 9, "Reflexiv Verben 2"),
}

SKILL_LESSON_TITLES = {
    "grammar": "{title} Grammar",
    "reading": "{title} Reading Passage",
    "listening": "{title} Listening Comprehension",
    "speaking": "{title} Speaking Practice",
}

SKILL_CURRICULUM_TITLES = {
    "grammar": "{title} Grammar",
    "reading": "{title} Reading",
    "listening": "{title} Listening",
    "speaking": "{title} Speaking",
}


def escape_ts(s):
    """Escape string for TS double-quoted string."""
    s = s.replace("\\", "\\\\")
    s = s.replace('"', '\\"')
    s = s.replace("\n", "\\n")
    s = s.replace("\r", "")
    return s


def generate_ts_function(chapters_data):
    """Generate the seedChapterLessonsFromPDF TypeScript function."""
    
    lines = []
    lines.append("")
    lines.append("/**")
    lines.append(" * Seed lessons for chapters 4-20 (daily_life) using content extracted from PDF study materials.")
    lines.append(" * Chapters 1-3 are already seeded by seedChapterLessons().")
    lines.append(" */")
    lines.append("async function seedChapterLessonsFromPDF() {")
    lines.append("  const chapterLessonData: Array<{")
    lines.append("    level: string;")
    lines.append("    orderIndex: number;")
    lines.append("    lessons: Array<{")
    lines.append("      skill: string;")
    lines.append("      curriculumTitle: string;")
    lines.append("      lessonTitle: string;")
    lines.append("      content: Array<{ type: string; body: string; orderIndex: number }>;")
    lines.append("      exercises: Array<{ type: string; prompt: string; options: string[] | null; correctAnswer: string; explanation: string; orderIndex: number }>;")
    lines.append("    }>;")
    lines.append("  }> = [")
    
    for ch_num, (level, order_idx, title, text) in sorted(chapters_data.items()):
        # Skip chapters 1-3 (already seeded)
        if ch_num <= 3:
            continue
        
        lines.append(f"    // ── Chapter {ch_num}: {title} ({level}, orderIndex {order_idx}) ──")
        lines.append("    {")
        lines.append(f'      level: "{level}",')
        lines.append(f"      orderIndex: {order_idx},")
        lines.append("      lessons: [")
        
        for skill in ["grammar", "reading", "listening", "speaking"]:
            lesson_title = SKILL_LESSON_TITLES[skill].format(title=title)
            curriculum_title = SKILL_CURRICULUM_TITLES[skill].format(title=title)
            
            # Generate content based on skill
            if skill == "grammar":
                body = make_grammar_content(title, text, ch_num)
            elif skill == "reading":
                body = make_reading_content(title, text)
            elif skill == "listening":
                body = make_listening_content(title, text)
            else:
                body = make_speaking_content(title, text)
            
            exercises = generate_exercises_from_text(text, skill, title)
            
            lines.append("        {")
            lines.append(f'          skill: "{skill}",')
            lines.append(f'          curriculumTitle: "{escape_ts(curriculum_title)}",')
            lines.append(f'          lessonTitle: "{escape_ts(lesson_title)}",')
            lines.append("          content: [")
            lines.append("            {")
            lines.append(f'              type: "text",')
            lines.append(f'              body: "{escape_ts(body)}",')
            lines.append(f"              orderIndex: 0,")
            lines.append("            },")
            lines.append("          ],")
            lines.append("          exercises: [")
            
            for ex in exercises:
                opts_str = "null"
                if ex["options"] is not None:
                    opts_list = ', '.join([f'"{escape_ts(o)}"' for o in ex["options"]])
                    opts_str = f"[{opts_list}]"
                
                lines.append("            {")
                lines.append(f'              type: "{escape_ts(ex["type"])}",')
                lines.append(f'              prompt: "{escape_ts(ex["prompt"])}",')
                lines.append(f"              options: {opts_str},")
                lines.append(f'              correctAnswer: "{escape_ts(ex["correctAnswer"])}",')
                lines.append(f'              explanation: "{escape_ts(ex["explanation"])}",')
                lines.append(f'              orderIndex: {ex["orderIndex"]},')
                lines.append("            },")
            
            lines.append("          ],")
            lines.append("        },")
        
        lines.append("      ],")
        lines.append("    },")
    
    lines.append("  ];")
    lines.append("")
    lines.append("  // Process each chapter's lessons")
    lines.append("  for (const chData of chapterLessonData) {")
    lines.append('    const chapter = await prisma.chapter.findFirst({')
    lines.append('      where: { level: chData.level, learningPath: "daily_life", orderIndex: chData.orderIndex },')
    lines.append("    });")
    lines.append("    if (!chapter) continue;")
    lines.append("")
    lines.append("    // Check if chapter already has lessons linked")
    lines.append("    const existingLinks = await prisma.chapterLesson.count({ where: { chapterId: chapter.id } });")
    lines.append("    if (existingLinks > 0) continue;")
    lines.append("")
    lines.append("    for (let i = 0; i < chData.lessons.length; i++) {")
    lines.append("      const lessonDef = chData.lessons[i];")
    lines.append("")
    lines.append("      // Ensure curriculum exists")
    lines.append('      const currKey = { languageCode: "lb" as const, level: chData.level, skill: lessonDef.skill };')
    lines.append("      let curriculum = await prisma.curriculum.findUnique({ where: { languageCode_level_skill: currKey } });")
    lines.append("      if (!curriculum) {")
    lines.append("        curriculum = await prisma.curriculum.create({ data: { ...currKey, title: lessonDef.curriculumTitle } });")
    lines.append("      }")
    lines.append("")
    lines.append("      // Create lesson")
    lines.append("      const lesson = await prisma.lesson.create({")
    lines.append("        data: {")
    lines.append("          curriculumId: curriculum.id,")
    lines.append("          title: lessonDef.lessonTitle,")
    lines.append("          orderIndex: i,")
    lines.append("          content: { create: lessonDef.content.map((c) => ({ type: c.type, body: c.body, orderIndex: c.orderIndex })) },")
    lines.append("          exercises: { create: lessonDef.exercises.map((e) => ({ type: e.type, prompt: e.prompt, options: e.options, correctAnswer: e.correctAnswer, explanation: e.explanation, orderIndex: e.orderIndex })) },")
    lines.append("        },")
    lines.append("      });")
    lines.append("")
    lines.append("      // Link to chapter")
    lines.append("      await prisma.chapterLesson.create({")
    lines.append("        data: { chapterId: chapter.id, lessonId: lesson.id, skill: lessonDef.skill, orderIndex: i },")
    lines.append("      });")
    lines.append("    }")
    lines.append("  }")
    lines.append("")
    lines.append('  console.log("Seeded chapter lessons for chapters 4-20 from PDF content.");')
    lines.append("}")
    
    return "\n".join(lines)


def main():
    pdfs = get_pdf_files()
    print(f"Found {len(pdfs)} PDF files (excluding copies):")
    for p in pdfs:
        print(f"  {p}")
    
    chapters_data = {}
    
    for pdf_path in pdfs:
        basename = os.path.basename(pdf_path)
        match = re.match(r"(\d+)", basename)
        if not match:
            continue
        ch_num = int(match.group(1))
        
        if ch_num not in CHAPTER_MAP:
            print(f"  Skipping {basename} -- no chapter mapping for #{ch_num}")
            continue
        
        level, order_idx, title = CHAPTER_MAP[ch_num]
        
        print(f"  Extracting chapter {ch_num}: {title} ({level})...")
        text = extract_pdf_text(pdf_path)
        print(f"    Extracted {len(text)} characters")
        
        chapters_data[ch_num] = (level, order_idx, title, text)
    
    # Generate the TS function
    ts_code = generate_ts_function(chapters_data)
    
    # Write to a temp file
    with open("seed_chapter_lessons_pdf.ts", "w", encoding="utf-8") as f:
        f.write(ts_code)
    
    print(f"\nGenerated seed function in seed_chapter_lessons_pdf.ts")
    print(f"Chapters processed: {len([k for k in chapters_data if k > 3])}")


if __name__ == "__main__":
    main()
