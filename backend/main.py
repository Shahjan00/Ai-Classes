"""JARVISH demo backend: FastAPI server for the Learnzo JARVISH recreation
(AI teacher for Indian school students, Classes 1-12).

Two modes: live (GROQ_API_KEY set, answers stream from Groq
openai/gpt-oss-20b) or demo (no key, built-in template answers).

Run:  uvicorn main:app --port 8000
"""

import asyncio
import json
import os
import re

import httpx
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field

MODEL = "openai/gpt-oss-20b"
GROQ_URL = "https://api.groq.com/openai/v1/chat/completions"

SYSTEM_PROMPT = (
    "You are JARVISH, a friendly AI teacher for Indian school students "
    "in Classes 1 to 12. You explain out loud, like a teacher talking in "
    "class. Keep every answer SHORT and spoken: at most 4 short sentences, "
    "plain simple words, no headings, no bullet lists, no markdown, no "
    "asterisks, no long explanations. If the question needs an equation or "
    "a diagram, say it in one short sentence and stop — the green board "
    "shows the rest. If the user writes in Hindi, answer in Hindi."
)

app = FastAPI(title="JARVISH demo backend")
# Demo app: allow the Vite frontend (any origin) to call us.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


def groq_key() -> str | None:
    return os.environ.get("GROQ_API_KEY") or None


class ChatRequest(BaseModel):
    messages: list[dict] = Field(default_factory=list)
    subject: str | None = None
    cls: str | None = None
    lang: str = "en"


class NotesRequest(BaseModel):
    subject: str
    chapter: str
    cls: str
    lang: str = "en"


class BoardRequest(BaseModel):
    question: str
    subject: str | None = None
    cls: str | None = None
    lang: str = "en"


# ---------------------------------------------------------------- board specs
# A board spec is what the green chalkboard draws for ANY question — the
# frontend renders the diagram from the spec, so the board is no longer
# limited to a handful of hand-drawn topics. In live mode Groq picks the
# diagram type and fills the content; in demo mode the table below is the
# fallback (the original fixed topics plus one spec per new diagram type).
BOARD_TYPES = [
    "flow", "bars", "cycle", "scale",
    "number-line", "fraction-bars", "timeline", "formula-only",
]

BOARD_SYSTEM_PROMPT = (
    "You are JARVISH, an AI teacher for Indian school students, Classes 1 "
    "to 12. Given a question, decide if a green chalkboard visual would "
    "help explain it. If yes, return a JSON object with one key \"board\" "
    "holding {\"title\": a short title, \"diagram\": {\"type\": one of "
    "flow, bars, cycle, scale, number-line, fraction-bars, timeline, "
    "formula-only, \"labels\": short labels of at most 3 words each, "
    "\"values\": numbers for bars, \"points\": [{\"v\": number, \"label\": "
    "str}] for number-line, \"bars\": [{\"label\": str, \"taken\": int, "
    "\"total\": int}] for fraction-bars, \"events\": [{\"year\": str, "
    "\"label\": str}] for timeline, \"min\": and \"max\": numbers for "
    "number-line}, \"lines\": up to 4 short plain chalk lines that explain "
    "it step by step, \"equation\": a short formula or null}. If no visual "
    "would help, return {\"board\": null}. Reply with JSON only."
)

DEMO_BOARD_SPECS = [
    {"match": ["photosynthesis", "photo synthesis", "plant makes food", "chlorophyll"],
     "spec": {"id": "photosynthesis", "title": "Photosynthesis",
              "diagram": {"type": "flow", "labels": ["Sunlight in", "Leaf catches light", "Glucose made", "Oxygen out"]},
              "lines": ["Sunlight + water + carbon dioxide go in", "Chlorophyll in the leaf catches the sunlight",
                        "The plant makes glucose — its food", "Oxygen comes out into the air"],
              "equation": "6CO\u2082 + 6H\u2082O + sunlight \u2192 C\u2086H\u2081\u2082O\u2086 + 6O\u2082"}},
    {"match": ["newton", "first law", "inertia", "laws of motion"],
     "spec": {"id": "newton", "title": "Newton's First Law",
              "diagram": {"type": "flow", "labels": ["Still ball", "A push", "Keeps rolling", "A force stops it"]},
              "lines": ["A still thing stays still", "A moving thing keeps moving straight",
                        "Only a force can change that", "Bus stops suddenly, you lurch forward"],
              "equation": "No force = no change in motion"}},
    {"match": ["fraction", "fractions", "half", "quarter"],
     "spec": {"id": "fractions", "title": "Fractions",
              "diagram": {"type": "fraction-bars", "bars": [{"label": "3/4 taken", "taken": 3, "total": 4},
                                                             {"label": "1/4 left", "taken": 1, "total": 4}]},
              "lines": ["Bottom number = total equal parts", "Top number = parts you take",
                        "3/4 of a pizza = 3 slices out of 4", "Same bottom first, then add the tops"],
              "equation": "1/2 + 1/4 = 2/4 + 1/4 = 3/4"}},
    {"match": ["lightning", "thunder", "why do we see lightning"],
     "spec": {"id": "thunder", "title": "Lightning and thunder",
              "diagram": {"type": "flow", "labels": ["Flash made", "Light races ahead", "Sound follows", "You hear thunder"]},
              "lines": ["Light: 3,00,000 km every second", "Sound: only 343 metres every second",
                        "Same moment, light wins the race", "3 seconds gap = storm about 1 km away"],
              "equation": "distance \u2248 seconds \u00d7 343 m"}},
    {"match": ["algebra", "solve for x", "equation"],
     "spec": {"id": "algebra", "title": "Solving for x",
              "diagram": {"type": "scale", "labels": ["2x + 3", "11"]},
              "lines": ["x is a number we do not know yet", "Do the same thing on both sides",
                        "Take 3 away: 2x = 8", "Divide by 2: x = 4"],
              "equation": "2x + 3 = 11  \u2192  x = 4"}},
    {"match": ["sky blue", "blue sky", "why is the sky blue"],
     "spec": {"id": "sky-blue", "title": "Why the Sky Looks Blue",
              "diagram": {"type": "flow", "labels": ["Sunlight enters", "Air scatters light", "Blue scatters most", "Sky looks blue"]},
              "lines": ["Sunlight looks white but holds all colours", "Tiny bits of air scatter the light",
                        "Blue light scatters the most", "So the sky looks blue to your eyes"],
              "equation": "Blue scatters most"}},
    {"match": ["water cycle", "evaporation", "rain cycle"],
     "spec": {"id": "water-cycle", "title": "The Water Cycle",
              "diagram": {"type": "cycle", "labels": ["Evaporation", "Condensation", "Precipitation", "Collection"]},
              "lines": ["Sun heats water, it rises as vapour", "Vapour cools and forms clouds",
                        "Water falls back as rain", "Rivers and seas collect it again"],
              "equation": "Water keeps moving in a cycle"}},
    {"match": ["bigger planet", "biggest planet", "jupiter", "planet size", "which planet is bigger"],
     "spec": {"id": "planets", "title": "Biggest Planets",
              "diagram": {"type": "bars", "labels": ["Mercury", "Venus", "Earth", "Jupiter"],
                          "values": [4879, 12104, 12742, 139820], "unit": "km across"},
              "lines": ["Jupiter is the biggest planet", "Earth is about 11 times smaller",
                        "Mercury is the smallest here", "Size does not mean closest to the Sun"],
              "equation": "Jupiter \u2248 11 \u00d7 Earth"}},
    {"match": ["integer", "negative number", "number line"],
     "spec": {"id": "integers", "title": "Integers on a Number Line",
              "diagram": {"type": "number-line", "min": -5, "max": 5,
                          "points": [{"v": -3, "label": "-3"}, {"v": 0, "label": "0"}, {"v": 2, "label": "+2"}]},
              "lines": ["Numbers left of 0 are negative", "Numbers right of 0 are positive",
                        "-3 is smaller than +2", "0 sits in the middle"],
              "equation": "-5 < 0 < +5"}},
    {"match": ["independence", "1947", "freedom struggle", "quit india"],
     "spec": {"id": "independence", "title": "India's Freedom Struggle",
              "diagram": {"type": "timeline", "events": [{"year": "1857", "label": "First revolt"},
                                                          {"year": "1919", "label": "Jallianwala Bagh"},
                                                          {"year": "1942", "label": "Quit India"},
                                                          {"year": "1947", "label": "Freedom"}]},
              "lines": ["1857: the first big revolt", "1919: Jallianwala Bagh",
                        "1942: Quit India movement", "1947: India becomes free"],
              "equation": "15 August 1947"}},
    {"match": ["pythagoras", "pythagorean", "right triangle", "hypotenuse"],
     "spec": {"id": "pythagoras", "title": "Pythagoras Theorem",
              "diagram": {"type": "formula-only"},
              "lines": ["a and b are the short sides", "c is the longest side",
                        "Square all three sides", "a squared plus b squared equals c squared"],
              "equation": "a² + b² = c²"}},
    {"match": ["embed", "vector"],
     "spec": {"id": "embeddings", "title": "What Are Embeddings",
              "diagram": {"type": "flow",
                          "labels": ["Word", "Vector numbers", "Similar = close", "AI understands"]},
              "lines": ["A word becomes a list of numbers", "The numbers are the word's vector",
                        "Similar words get similar numbers", "AI reads the numbers, not the letters"]}},
    {"match": ["neural", "neuron"],
     "spec": {"id": "neural-net", "title": "A Neural Network",
              "diagram": {"type": "flow",
                          "labels": ["Input", "Hidden layers", "Learns patterns", "Output"]},
              "lines": ["Numbers go in", "Hidden layers find patterns",
                        "It learns from examples", "An answer comes out"]}},
]


def generic_board_spec(question: str, answer: str) -> dict:
    """Build a FRESH board from the answer itself, for any question.
    Each sentence of the answer becomes one step in a flow diagram
    (its first few words are the box label) and one chalk line below.
    This is what makes the board generate instead of serving examples:
    it only runs when no canned topic matches the question.
    The generic demo answer is filler ("Here is the simple idea..."),
    so its sentences get plain labels instead of the filler words."""
    topic = (question or 'this topic').strip().rstrip('?').strip()
    topic_label = (topic[:40] or 'This topic')
    topic_label = topic_label[0].upper() + topic_label[1:]
    filler_labels = {
        'here is the simple idea behind': topic_label,
        'break it into small parts': 'Break it into parts',
        'then connect it to': 'Connect to daily life',
    }
    sentences = [s.strip() for s in re.split(r'(?<=[.?!])\s+', answer.strip()) if s.strip()]
    sentences = sentences[:4]
    labels = []
    for s in sentences:
        low = s.lower()
        label = None
        for start, plain in filler_labels.items():
            if low.startswith(start):
                label = plain
                break
        if label is None:
            words = s.split()
            label = ' '.join(words[:4]).rstrip('.,?!') or s[:20]
        labels.append(label)
    # A flow needs at least two boxes; split one long sentence in half.
    if len(labels) < 2 and sentences:
        words = sentences[0].split()
        half = max(1, len(words) // 2)
        labels = [' '.join(words[:half]), ' '.join(words[half:]) or '...']
    title = (question or 'On the board').strip().rstrip('?').strip()
    title = (title[:50] or 'On the board')
    title = title[0].upper() + title[1:]
    return {
        'id': 'live',
        'title': title,
        'diagram': {'type': 'flow', 'labels': labels},
        'lines': [s[:80] for s in sentences],
    }


def demo_board_spec(question: str) -> dict | None:
    q = question.lower()
    for entry in DEMO_BOARD_SPECS:
        if any(k in q for k in entry["match"]):
            return entry["spec"]
    # No canned topic matches: generate a fresh board from the answer.
    return generic_board_spec(question, demo_answer(question))


async def groq_board_spec(question: str) -> dict | None:
    """Ask Groq for a board spec in JSON mode; None if no visual helps."""
    payload = {
        "model": MODEL,
        "messages": [
            {"role": "system", "content": BOARD_SYSTEM_PROMPT},
            {"role": "user", "content": question},
        ],
        "temperature": 0.3,
        "max_tokens": 400,
        "response_format": {"type": "json_object"},
    }
    headers = {
        "Authorization": f"Bearer {groq_key()}",
        "Content-Type": "application/json",
    }
    async with httpx.AsyncClient(timeout=30) as client:
        resp = await client.post(GROQ_URL, json=payload, headers=headers)
        resp.raise_for_status()
        data = json.loads(resp.json()["choices"][0]["message"]["content"])
    spec = data.get("board")
    if not spec or not isinstance(spec, dict):
        return None
    diagram = spec.get("diagram") or {}
    if diagram.get("type") not in BOARD_TYPES:
        return None
    lines = spec.get("lines") or []
    if not isinstance(lines, list):
        return None
    return {
        "id": "live",
        "title": str(spec.get("title") or "On the board")[:60],
        "diagram": diagram,
        "lines": [str(x) for x in lines[:4]],
        "equation": spec.get("equation"),
    }


# ---------------------------------------------------------------- demo answers
# Topic-keyed templates used when no Groq key is set. Each entry is matched
# against keywords in the user's latest question.

DEMO_TOPICS = [
    (["photosynthesis"], "Photosynthesis is how green plants make their own food. The plant takes sunlight, water and carbon dioxide, and turns them into food and oxygen. Look at the board, I have drawn it for you."),
    (["newton", "laws of motion", "force"], "Newton's first law is simple. A thing stays still until something pushes it, and a moving thing keeps moving until something stops it. That is why you lurch forward when the bus stops suddenly."),
    (["fraction"], "A fraction is a part of a whole. The bottom number tells you how many equal parts there are, and the top number tells you how many you take. Look at the board, I have drawn a pizza to show you."),
    (["electric", "current", "circuit"], "Electricity is the flow of tiny charged particles called electrons through a wire. The voltage is the push that moves them, and the current is how fast they flow. Ohm's law ties them together: voltage equals current times resistance."),
    (["water cycle", "rain", "evaporation"], "The water cycle is how water keeps moving between the Earth and the sky. The Sun heats water and it rises as vapour, then it cools, forms clouds, and falls back as rain."),
    (["algebra", "equation", "solve for x"], "In algebra, a letter like x stands for a number we do not know yet. To find it, do the same thing on both sides of the equals sign until x is alone. Look at the board, I will work one out for you."),
    (["india", "indian", "delhi", "constitution"], "India became independent on 15 August 1947, and the Constitution came into force on 26 January 1950. New Delhi is the capital, and India is the world's largest democracy."),
    (["code", "coding", "python", "programming"], "Coding is giving a computer step-by-step instructions. You store values in variables, repeat work with loops, and make decisions with if statements. Start small, run it, break it, fix it. That is how real programmers learn."),
    (["lightning", "thunder"], "Light travels much faster than sound. The flash and the thunder are made at the same moment, but light reaches your eyes almost instantly, so you see the flash first. Count the seconds between the flash and the thunder, every three seconds means the storm is about one kilometre away."),
    (["sky blue", "blue sky"], "The sky looks blue because of how sunlight meets the air. Sunlight holds all colours, and tiny bits of air scatter the blue light the most. Look at the board, I have drawn it for you."),
    (["jupiter", "biggest planet", "planet"], "Jupiter is the biggest planet in our solar system, about eleven times wider than Earth. Mercury is the smallest of the four here. Look at the board, I have drawn the sizes for you."),
    (["integer", "negative number"], "Integers are the whole numbers: positive, negative, and zero. On a number line, zero sits in the middle, positives go right, negatives go left. Look at the board, I have drawn it for you."),
    (["independence", "1947", "freedom"], "India became free on 15 August 1947 after a long struggle. It started with the revolt of 1857, then the Quit India movement of 1942, and finally freedom in 1947. Look at the board, I have drawn the timeline for you."),
    (["pythagoras", "pythagorean", "hypotenuse"], "Pythagoras theorem is for right triangles. The square of the longest side equals the sum of the squares of the other two sides. Look at the board, the formula is written there for you."),
]

def demo_answer(question: str) -> str:
    """Pick a template by keyword, else build a generic answer."""
    q = question.lower()
    for keywords, text in DEMO_TOPICS:
        if any(k in q for k in keywords):
            return text
    # Generic fallback: a short spoken explanation of the topic.
    topic = question.strip().rstrip("?").strip() or "this topic"
    return (
        f"Here is the simple idea behind {topic}. Break it into small parts "
        f"and understand each part one by one. Then connect it to something "
        f"you see in daily life, and it will stick."
    )

async def demo_stream(text: str):
    """Yield the text word by word, mimicking a streaming LLM."""
    for word in text.split(" "):
        yield f"data: {json.dumps({'token': word + ' '})}\n\n"
        await asyncio.sleep(0.025)
    yield f"data: {json.dumps({'done': True, 'demo': True})}\n\n"

async def groq_stream(messages: list[dict]):
    """Stream tokens from Groq's OpenAI-compatible chat completions API."""
    payload = {
        "model": MODEL,
        "messages": messages,
        "temperature": 0.7,
        "max_tokens": 320,
        "stream": True,
    }
    headers = {
        "Authorization": f"Bearer {groq_key()}",
        "Content-Type": "application/json",
    }
    async with httpx.AsyncClient(timeout=60) as client:
        async with client.stream("POST", GROQ_URL, json=payload, headers=headers) as resp:
            resp.raise_for_status()
            async for line in resp.aiter_lines():
                if not line.startswith("data:"):
                    continue
                data = line[5:].strip()
                if data == "[DONE]":
                    break
                chunk = json.loads(data)
                token = chunk["choices"][0]["delta"].get("content", "")
                if token:
                    yield f"data: {json.dumps({'token': token})}\n\n"
    yield f"data: {json.dumps({'done': True, 'demo': False})}\n\n"

def demo_notes(subject: str, chapter: str, cls: str) -> str:
    return f"""# {chapter} — {subject} (Class {cls})
## 1. What this chapter is about
{chapter} is a key chapter in {subject} for Class {cls}. Read it once slowly, then make your own short notes — writing in your own words is the fastest way to remember.
## 2. Key terms to remember
- **Definition 1:** the most important idea of the chapter — learn it word for word.
- **Definition 2:** the second core idea, and how it connects to the first.
- **Formula / Rule:** write the main formula here and practise using it in 3-4 questions.
## 3. Main points
1. Start with the basics: what the chapter is trying to explain.
2. Learn each concept with one daily-life example.
3. Practise the solved examples from your textbook before the exercises.
4. Note the common mistakes students make, and how to avoid them.
## 4. Quick revision questions
1. What is the main idea of {chapter}?
2. Explain the most important term in your own words.
3. Solve one numerical or practice question from the chapter.
4. Give one real-life example of this chapter's concept.
## 5. Exam tips
- Revise these notes the next day, then again after a week.
- Draw a diagram or flow chart — it earns marks and aids memory.
- In the exam, write neat headings and underline key terms.
*Demo notes — set GROQ_API_KEY for full AI-generated notes.*"""

# ---------------------------------------------------------------- endpoints


@app.get("/health")
def health():
    key = groq_key()
    return {
        "ok": True,
        "groq": bool(key),
        "model": MODEL,
        "mode": "live" if key else "demo",
    }


@app.post("/api/chat")
async def chat(req: ChatRequest):
    # Latest user message decides the demo topic.
    last_user = next((m.get("content", "") for m in reversed(req.messages)
                      if m.get("role") == "user"), "")
    if groq_key():
        messages = [{"role": "system", "content": SYSTEM_PROMPT}]
        messages += [{"role": m.get("role", "user"), "content": m.get("content", "")}
                     for m in req.messages]
        return StreamingResponse(groq_stream(messages), media_type="text/event-stream")
    return StreamingResponse(demo_stream(demo_answer(last_user)),
                             media_type="text/event-stream")


@app.post("/api/board")
async def board(req: BoardRequest):
    """Board spec for a question: Groq JSON mode when live, the demo table
    when no key is set. Returns {"board": spec} or {"board": null}."""
    if groq_key():
        try:
            return {"board": await groq_board_spec(req.question)}
        except Exception:
            return {"board": demo_board_spec(req.question)}
    return {"board": demo_board_spec(req.question)}


@app.post("/api/notes")
async def notes(req: NotesRequest):
    if groq_key():
        prompt = (
            f"Write clear, well-structured study notes in Markdown for "
            f"Class {req.cls} {req.subject}, chapter '{req.chapter}'. "
            f"Use headings, bullet lists and a few practice questions. "
            f"Simple language a school student can understand. "
            f"{'Answer in Hindi.' if req.lang == 'hi' else 'Answer in English.'}"
        )
        payload = {
            "model": MODEL,
            "messages": [
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": prompt},
            ],
            "temperature": 0.7,
            "max_tokens": 800,
        }
        headers = {
            "Authorization": f"Bearer {groq_key()}",
            "Content-Type": "application/json",
        }
        async with httpx.AsyncClient(timeout=60) as client:
            resp = await client.post(GROQ_URL, json=payload, headers=headers)
            resp.raise_for_status()
            return {"notes": resp.json()["choices"][0]["message"]["content"]}
    return {"notes": demo_notes(req.subject, req.chapter, req.cls)}
