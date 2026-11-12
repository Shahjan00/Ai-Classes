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
