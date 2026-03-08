import os
import json
import google.generativeai as genai

genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

model = genai.GenerativeModel("gemini-1.5-flash")

PROMPT = """
You are a support ticket classifier.

Classify the following support ticket description.

Categories:
billing
technical
account
general

Priorities:
low
medium
high
critical

Return ONLY JSON in this format:

{
 "suggested_category": "technical",
 "suggested_priority": "high"
}

Description:
"""


def classify_ticket(description):
    try:
        response = model.generate_content(PROMPT + description)

        text = response.text.strip()

        data = json.loads(text)

        return {
            "suggested_category": data.get("suggested_category", "general"),
            "suggested_priority": data.get("suggested_priority", "medium")
        }

    except Exception:
        return {
            "suggested_category": "general",
            "suggested_priority": "medium"
        }