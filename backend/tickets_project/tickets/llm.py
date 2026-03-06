"""
LLM integration module for ticket classification.

Uses Anthropic's Claude API to suggest a category and priority
based on the ticket description. All errors are caught here —
callers receive None on any failure so ticket submission is never blocked.
"""

import json
import logging
import urllib.request
import urllib.error

from django.conf import settings

logger = logging.getLogger(__name__)

# ── Prompt ────────────────────────────────────────────────────────────────────
# The prompt is explicit about output format so we can parse it reliably.
# We ask for JSON only to avoid any preamble that would break json.loads().
SYSTEM_PROMPT = """You are a support ticket classifier. Given a support ticket description, 
you must return ONLY a valid JSON object with exactly two keys: "category" and "priority".

Category must be exactly one of: billing, technical, account, general
Priority must be exactly one of: low, medium, high, critical

Priority guidelines:
- critical: system down, data loss, security breach, complete inability to work
- high: major feature broken, significant business impact, no workaround
- medium: partial functionality affected, workaround exists
- low: minor issue, cosmetic problem, general question

Category guidelines:
- billing: invoices, payments, subscriptions, refunds, pricing
- technical: bugs, errors, performance, integrations, API issues
- account: login, password, permissions, profile, access
- general: feature requests, feedback, documentation, how-to questions

Respond with ONLY the JSON object, no explanation, no markdown, no code fences."""

USER_PROMPT_TEMPLATE = """Classify this support ticket:

{description}"""
# ──────────────────────────────────────────────────────────────────────────────


def classify_ticket(description: str) -> dict | None:
    """
    Call Anthropic API and return {"suggested_category": ..., "suggested_priority": ...}.
    Returns None if the API key is missing, the call fails, or the response is unparseable.
    """
    api_key = settings.ANTHROPIC_API_KEY
    if not api_key:
        logger.warning("ANTHROPIC_API_KEY not set — skipping classification")
        return None

    payload = json.dumps({
        "model": "claude-haiku-4-5-20251001",
        "max_tokens": 100,
        "system": SYSTEM_PROMPT,
        "messages": [
            {"role": "user", "content": USER_PROMPT_TEMPLATE.format(description=description)}
        ],
    }).encode("utf-8")

    req = urllib.request.Request(
        "https://api.anthropic.com/v1/messages",
        data=payload,
        headers={
            "Content-Type": "application/json",
            "x-api-key": api_key,
            "anthropic-version": "2023-06-01",
        },
        method="POST",
    )

    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            body = json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        logger.error("Anthropic API HTTP error %s: %s", e.code, e.read().decode())
        return None
    except Exception as e:
        logger.error("Anthropic API call failed: %s", e)
        return None

    try:
        text = body["content"][0]["text"].strip()
        parsed = json.loads(text)
        category = parsed.get("category", "").lower()
        priority = parsed.get("priority", "").lower()

        valid_categories = {"billing", "technical", "account", "general"}
        valid_priorities = {"low", "medium", "high", "critical"}

        if category not in valid_categories or priority not in valid_priorities:
            logger.warning("LLM returned invalid values: category=%s priority=%s", category, priority)
            return None

        return {"suggested_category": category, "suggested_priority": priority}

    except (KeyError, json.JSONDecodeError, IndexError) as e:
        logger.error("Failed to parse LLM response: %s | raw: %s", e, body)
        return None
