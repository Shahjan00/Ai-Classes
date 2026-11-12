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
    "in Classes 1 to 12. Answer in simple, clear language a school student "
    "can understand. Use short paragraphs, bold key terms, and bullet lists "
    "where helpful. If the user writes in Hindi, answer in Hindi. Keep "
    "answers focused and under 250 words unless the question needs more."
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
    (["photosynthesis"], """**Photosynthesis** is how green plants make their own food using sunlight.
- Plants take in **carbon dioxide** from the air and **water** from the soil.
- **Chlorophyll**, the green pigment in leaves, captures sunlight.
- The plant turns these into **glucose** (food) and releases **oxygen**.
**Equation:** 6CO2 + 6H2O + sunlight -> C6H12O6 + 6O2
**Why it matters:** Almost all life on Earth depends on photosynthesis, directly or indirectly, for food and oxygen. Try this: keep one potted plant in sunlight and one in a dark cupboard for a week — the one in the dark will turn pale and weak!"""),
    (["newton", "laws of motion", "force"], """**Newton's Laws of Motion** describe how things move.
- **First Law (Inertia):** An object stays at rest or keeps moving in a straight line unless a force acts on it. That is why you lurch forward when a bus stops suddenly.
- **Second Law (F = ma):** Force = mass x acceleration. Pushing a light cycle is easier than pushing a heavy cart because the cart has more mass.
- **Third Law (Action-Reaction):** Every action has an equal and opposite reaction. A rocket pushes hot gases down, and the gases push the rocket up.
**Worked example:** A 2 kg ball is pushed with a force of 10 N. Its acceleration = F / m = 10 / 2 = **5 m/s^2**."""),
    (["fraction"], """**Fractions** show a part of a whole.
- A fraction has a **numerator** (top number, parts taken) and a **denominator** (bottom number, total parts).
- Example: 3/4 of a pizza means the pizza is cut into 4 equal parts and you ate 3.
- **Adding fractions:** first make the denominators equal. 1/2 + 1/4 = 2/4 + 1/4 = **3/4**.
- **Simplifying:** divide top and bottom by the same number. 6/8 = **3/4**.
**Worked example:** A class has 40 students and 3/5 are girls. Number of girls = 3/5 x 40 = **24**."""),
    (["electric", "current", "circuit"], """**Electricity** is the flow of electric charge, usually through a wire.
- **Current** is the flow of electrons, measured in **amperes (A)**.
- **Voltage** is the push that moves the charge, measured in **volts (V)**.
- **Resistance** opposes the flow, measured in **ohms (Ω)**.
- **Ohm's Law:** V = I x R (voltage = current x resistance).
**Worked example:** A bulb has a resistance of 10 Ω and is connected to a 20 V battery. Current = V / R = 20 / 10 = **2 A**.
**Safety tip:** Never touch switches or plugs with wet hands — water conducts electricity!"""),
    (["water cycle", "rain", "evaporation"], """The **Water Cycle** is how water keeps moving between the Earth and the sky.
- **Evaporation:** Heat from the Sun turns water from seas, lakes and rivers into vapour.
- **Condensation:** The vapour cools high up and forms tiny droplets — these are **clouds**.
- **Precipitation:** When droplets get heavy, they fall as **rain** (or snow).
- **Collection:** Rainwater gathers in rivers, lakes and underground, and the cycle starts again.
**Why it matters:** The water cycle gives us fresh drinking water and rain for crops, and it has been running for billions of years — the water you drink today may once have been drunk by a dinosaur!"""),
    (["algebra", "equation", "solve for x"], """**Algebra** is maths with letters standing for unknown numbers.
- A **variable** (like x) stands for a number we do not know yet.
- An **equation** says two things are equal, e.g. x + 5 = 12.
- **Golden rule:** do the same operation on both sides to keep the balance.
**Worked example:** Solve 2x + 3 = 11.
1. Subtract 3 from both sides: 2x = 8
2. Divide both sides by 2: x = **4**
3. Check: 2(4) + 3 = 11. Correct!
**Tip:** Always check your answer by putting it back into the original equation."""),
    (["india", "indian", "delhi", "constitution"], """**India — quick facts for school:**
- **Capital:** New Delhi. **Largest city:** Mumbai.
- **National animal:** Bengal Tiger. **National bird:** Indian Peacock.
- **National flower:** Lotus. **National river:** Ganga.
- India became independent on **15 August 1947**, and the Constitution came into force on **26 January 1950** (Republic Day).
- India has **28 states and 8 Union Territories**.
- The **Indian National Congress** was founded in 1885, and the freedom movement was led by leaders like Mahatma Gandhi, Jawaharlal Nehru and Subhas Chandra Bose.
**Remember this:** India is the world's largest democracy — over 900 million people are eligible to vote!"""),
    (["code", "coding", "python", "programming"], """**Coding basics** — how to start thinking like a programmer.
- A **program** is a set of step-by-step instructions a computer follows.
- A **variable** stores a value, e.g. `name = "Asha"`.
- A **loop** repeats work, e.g. `for i in range(5): print(i)` prints 0 to 4.
- An **if statement** makes decisions, e.g. `if marks >= 40: print("Pass")`.
**Worked example (Python):**
```python
for number in range(1, 6):
    print(number * 2)   # prints 2, 4, 6, 8, 10
```
**Tip:** Start with small programs, run them, break them, fix them — that is how real programmers learn."""),
    (["lightning", "thunder"], """**Why do we see lightning before we hear thunder?**
- **Light travels much faster than sound.** Light moves at about **3,00,000 km per second**, while sound moves at only about **343 metres per second** in air.
- Lightning and thunder are made at the **same moment** — the lightning flash heats the air so fast that it expands with a loud bang.
- Because light reaches your eyes almost instantly and sound takes time, you **see the flash first** and hear the thunder a few seconds later.
**Worked example:** If you count 3 seconds between the flash and the thunder, the storm is about 3 x 343 = **1,029 metres** (roughly 1 km) away. Every 3 seconds of gap means about 1 km of distance!
**Safety tip:** During a thunderstorm, stay indoors and away from tall trees and metal objects."""),
]

def demo_answer(question: str) -> str:
    """Pick a template by keyword, else build a generic answer."""
    q = question.lower()
    for keywords, text in DEMO_TOPICS:
        if any(k in q for k in keywords):
            return text
    # Generic fallback: explain the topic named in the question.
    topic = question.strip().rstrip("?").strip() or "this topic"
    return f"""Here is a simple explanation of **{topic}**.

- **What it is:** {topic} is an important idea you will meet often in school. Start by breaking it into small parts and understanding each part one by one.
- **Key points to remember:** write down the main definitions, learn any formula or rule step by step, and connect the idea to something you see in daily life.
- **How to study it:** read your textbook chapter once, make short notes in your own words, solve 3-4 practice questions, and revise the notes the next day.

**Worked example:** Take any question on {topic} and solve it in three steps — (1) write down what is given, (2) choose the right rule or formula, (3) calculate carefully and check your answer.

*Note: this is a demo answer. Set GROQ_API_KEY to get full AI answers from JARVISH.*"""

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
        "max_tokens": 800,
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
