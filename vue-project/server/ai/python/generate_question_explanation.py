import json
import os
import sys
import urllib.error
import urllib.request
from pathlib import Path


GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions"
MODEL = "openai/gpt-oss-120b"
SCHEMA_PATH = Path(__file__).resolve().parents[1] / "schema" / "phishing_question_schema.json"

CATEGORY_LABELS = {
    "student": "students",
    "company": "business users",
    "general": "general users",
}

GENERATED_FIELDS = [
    "title",
    "sender_name",
    "sender_email",
    "body",
    "is_phishing",
    "phishing_type",
    "has_link",
    "has_attachment",
    "explanation",
]


def load_schema() -> dict:
    with SCHEMA_PATH.open("r", encoding="utf-8") as f:
        return json.load(f)


def strip_schema_descriptions(value):
    if isinstance(value, dict):
        return {
            key: strip_schema_descriptions(item)
            for key, item in value.items()
            if key != "description"
        }
    if isinstance(value, list):
        return [strip_schema_descriptions(item) for item in value]
    return value


def build_generation_schema(source_schema: dict) -> dict:
    question_props = source_schema["properties"]["questions"]["items"]["properties"]
    generated_props = {name: question_props[name] for name in GENERATED_FIELDS}

    return {
        "type": "object",
        "additionalProperties": False,
        "properties": {
            "questions": {
                "type": "array",
                "items": {
                    "type": "object",
                    "additionalProperties": False,
                    "properties": generated_props,
                    "required": GENERATED_FIELDS,
                },
            },
        },
        "required": ["questions"],
    }


def build_messages(category: str, count: int, is_phishing: bool) -> list[dict[str, str]]:
    mail_type = "phishing" if is_phishing else "safe legitimate"
    explanation_hint = (
        "explanation means: why dangerous, warning signs, correct action."
        if is_phishing
        else "explanation means: why safe, notable points, safe action."
    )
    fixed_values = (
        "Set is_phishing=true and choose phishing_type."
        if is_phishing
        else "Set is_phishing=false, phishing_type=null, and avoid dangerous links/attachments."
    )

    return [
        {
            "role": "system",
            "content": "Return schema-valid JSON. Write visible text in Japanese.",
        },
        {
            "role": "user",
            "content": (
                f"Create {count} {mail_type} training email for {category}. "
                f"{fixed_values} {explanation_hint} Use fictional names/domains."
            ),
        },
    ]


def extract_json(content: str) -> dict:
    text = content.strip()
    if text.startswith("```"):
        lines = text.splitlines()
        if lines and lines[0].startswith("```"):
            lines = lines[1:]
        if lines and lines[-1].startswith("```"):
            lines = lines[:-1]
        text = "\n".join(lines).strip()

    return json.loads(text)


def validate_result(result: dict, category: str, count: int, is_phishing: bool) -> dict:
    questions = result.get("questions")
    if not isinstance(questions, list):
        raise ValueError("AI response must include a questions array")
    if len(questions) != count:
        raise ValueError(f"AI response must include exactly {count} questions")

    for index, question in enumerate(questions, start=1):
        if not isinstance(question, dict):
            raise ValueError(f"Question {index} must be an object")
        if question.get("category") != category:
            question["category"] = category
        question["is_phishing"] = is_phishing
        question.setdefault("dangerous_links", [])
        question.setdefault("dangerous_attachments", [])
        question.setdefault("safe_attachments", [])
        question.setdefault("is_decoy", False)
        question.setdefault("is_active", True)
        if not is_phishing:
            question["phishing_type"] = None
            question["dangerous_links"] = []
            question["dangerous_attachments"] = []
        elif question.get("phishing_type") is None:
            question["phishing_type"] = "credential_theft"

    return {"questions": questions}


def read_error_body(error: urllib.error.HTTPError) -> str:
    body = error.read().decode("utf-8", errors="replace").strip()
    if not body:
        return error.reason or "empty response body"
    return body


def generate_questions(category: str, count: int, is_phishing: bool) -> dict:
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        raise ValueError("GROQ_API_KEY is not set")

    schema = build_generation_schema(strip_schema_descriptions(load_schema()))
    payload = {
        "model": MODEL,
        "messages": build_messages(category, count, is_phishing),
        "temperature": 0.7,
        "max_completion_tokens": 3000,
        "response_format": {
            "type": "json_schema",
            "json_schema": {
                "name": "phishing_question_generation",
                "strict": True,
                "schema": schema,
            },
        },
    }

    request = urllib.request.Request(
        GROQ_API_URL,
        data=json.dumps(payload, separators=(",", ":")).encode("utf-8"),
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
            "Accept": "application/json",
            "User-Agent": "u-22-phish-trap/1.0",
        },
        method="POST",
    )

    try:
        with urllib.request.urlopen(request, timeout=110) as response:
            body = response.read().decode("utf-8")
    except urllib.error.HTTPError as e:
        error_body = read_error_body(e)
        if e.code == 403 and "1010" in error_body:
            raise RuntimeError(
                "Groq API returned Cloudflare 1010 access denied. "
                "The request was blocked before model execution. "
                "Try again after changing network/VPN settings, or contact Groq support with the error. "
                f"Original response: {error_body}"
            ) from e
        raise RuntimeError(f"Groq API error {e.code}: {error_body}") from e

    data = json.loads(body)
    content = data["choices"][0]["message"]["content"]
    return validate_result(extract_json(content), category, count, is_phishing)


def main():
    try:
        data = json.loads(sys.stdin.read())
        category = data.get("category")
        count = data.get("count", 1)
        is_phishing = data.get("isPhishing")

        if category not in CATEGORY_LABELS:
            raise ValueError("category must be student, company, or general")
        if count != 1:
            raise ValueError("count must be 1")
        if not isinstance(is_phishing, bool):
            raise ValueError("isPhishing must be boolean")

        result = generate_questions(category, count, is_phishing)
        print(json.dumps(result, ensure_ascii=False))
    except Exception as e:
        print(json.dumps({"error": str(e)}, ensure_ascii=False), file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
