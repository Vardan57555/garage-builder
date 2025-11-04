"""Streamlit chat UI - Simple SVG rendering fix."""

import os
import json
import uuid
from typing import Any, Optional, Tuple
import re

import httpx
import streamlit as st

BACKEND_URL = os.getenv("BACKEND_URL", "http://localhost:5003/api/v1/chat")

st.set_page_config(
    page_title="Garage Builder Assistant",
    page_icon="🤖",
    initial_sidebar_state="expanded"
)

def get_or_create_tab_id():
    """Get tab ID from URL query params, or create new one if missing."""
    try:
        query_params = st.query_params
        if "tabId" in query_params:
            tab_id = query_params["tabId"]
            if isinstance(tab_id, list):
                tab_id = tab_id[0]
            return tab_id
    except:
        pass

    new_tab_id = str(uuid.uuid4())
    st.query_params["tabId"] = new_tab_id
    return new_tab_id

TAB_ID = get_or_create_tab_id()
SESSION_STATE_KEY = f"sessionId_{TAB_ID}"
MESSAGES_STATE_KEY = f"messages_{TAB_ID}"


def split_svg_and_text(content: str) -> Tuple[Optional[str], str]:
    """
    Split content into SVG and text parts.
    Returns (svg_string, remaining_text)
    """
    # Find SVG using simple regex
    svg_pattern = r'<svg[^>]*>.*?</svg>'
    match = re.search(svg_pattern, content, re.DOTALL)

    if match:
        svg = match.group(0)
        # Remove SVG from text
        text = content[:match.start()] + content[match.end():]
        return svg, text.strip()

    return None, content


def format_pricing_response(payload: Any) -> str:
    """Extract a human-readable message from backend payload fragments."""

    if payload is None:
        return "⚠️ Empty response received from pricing service."

    if isinstance(payload, str):
        stripped = payload.strip()
        return stripped or "⚠️ Empty response received from pricing service."

    if isinstance(payload, dict):
        for key in ("message", "text", "summary", "answer", "response", "content"):
            value = payload.get(key)
            if isinstance(value, str) and value.strip():
                return value.strip()

        data_value = payload.get("data")
        if isinstance(data_value, str):
            stripped = data_value.strip()
            if stripped:
                return stripped
        elif data_value is not None:
            try:
                return json.dumps(data_value, indent=2, default=str)
            except TypeError:
                return str(data_value)

        try:
            return json.dumps(payload, indent=2, default=str)
        except TypeError:
            return str(payload)

    return str(payload)


def parse_chat_response(payload: Any) -> Tuple[Optional[str], str]:
    """Parse full backend response and return session ID with formatted answer."""

    if payload is None:
        return None, "⚠️ Empty response received from pricing service."

    if isinstance(payload, str):
        try:
            payload = json.loads(payload)
        except json.JSONDecodeError:
            stripped = payload.strip()
            return None, stripped or "⚠️ Empty response received from pricing service."

    if not isinstance(payload, dict):
        return None, f"⚠️ Unexpected response type: {type(payload).__name__}"

    if payload.get("success") is False:
        error_message = format_pricing_response(
            payload.get("message")
            or payload.get("error")
            or payload.get("errors")
            or payload
        )
        return None, f"⚠️ Backend error: {error_message}"

    content = payload.get("data") or payload.get("result") or payload
    session_id: Optional[str] = None
    answer_source: Any = content

    if isinstance(content, dict):
        session_id = content.get("sessionId") or content.get("session_id")
        for key in ("answer", "message", "result", "text"):
            if key in content and content[key] not in (None, ""):
                answer_source = content[key]
                break
        else:
            answer_source = content

    return session_id, format_pricing_response(answer_source)


# ✅ INITIALIZE: Use tab-specific keys
if SESSION_STATE_KEY not in st.session_state:
    st.session_state[SESSION_STATE_KEY] = None

if MESSAGES_STATE_KEY not in st.session_state:
    st.session_state[MESSAGES_STATE_KEY] = [
        {"role": "assistant", "content": "Hi! Ask me about garage builds or pricing."}
    ]

st.title("🏗️ Garage Builder Chat")

# ✅ DEBUG INFO
with st.sidebar:
    st.header("🔹 Tab Info")
    st.info(f"**Tab ID:** `{TAB_ID[:16]}...`")
    st.caption("Each tab has a unique ID. Open a new tab and see a different ID!")

# ✅ DISPLAY CONVERSATION
for msg in st.session_state[MESSAGES_STATE_KEY]:
    with st.chat_message(msg["role"]):
        content = msg["content"]

        # ✅ NEW: Split SVG from text
        svg, text_part = split_svg_and_text(content)

        # Display text
        if text_part:
            st.markdown(text_part)

        # Display SVG using HTML
        if svg:
            st.write(svg, unsafe_allow_html=True)

# Get user input
if prompt := st.chat_input("Type your question…"):
    st.session_state[MESSAGES_STATE_KEY].append({"role": "user", "content": prompt})
    with st.chat_message("user"):
        st.markdown(prompt)

    with st.chat_message("assistant"):
        placeholder = st.empty()

        try:
            timeout = httpx.Timeout(60.0)
            with httpx.Client(timeout=timeout) as client:
                request_body = {"question": prompt}

                if st.session_state[SESSION_STATE_KEY]:
                    request_body["sessionId"] = st.session_state[SESSION_STATE_KEY]

                with placeholder.container():
                    st.markdown("⏳ Sending request to backend…")

                response = client.post(BACKEND_URL, json=request_body)
                response.raise_for_status()

                try:
                    raw_payload = response.json()
                except ValueError:
                    raw_payload = response.text

            session_id, reply = parse_chat_response(raw_payload)
            if session_id:
                st.session_state[SESSION_STATE_KEY] = session_id

        except Exception as exc:
            reply = f"⚠️ Request failed: {exc}"

        # ✅ RENDER RESPONSE
        svg, text_part = split_svg_and_text(reply)

        with placeholder.container():
            if text_part:
                st.markdown(text_part)

            if svg:
                st.write(svg, unsafe_allow_html=True)

        st.session_state[MESSAGES_STATE_KEY].append({"role": "assistant", "content": reply})


def end_session(session_id: str) -> bool:
    """Call backend to end a session."""
    if not session_id:
        return False

    try:
        with httpx.Client(timeout=10.0) as client:
            response = client.post(
                f"{BACKEND_URL.replace('/chat', '')}/end",
                json={"sessionId": session_id},
            )
            response.raise_for_status()

            try:
                result = response.json()
            except ValueError:
                return False

            if isinstance(result, dict):
                data = result.get("data") if isinstance(result.get("data"), dict) else None
                if data and "success" in data:
                    return bool(data.get("success"))
                return bool(result.get("success"))

            return False
    except Exception:
        return False


with st.sidebar:
    st.header("Session Info")

    if st.session_state[SESSION_STATE_KEY]:
        st.info(f"**Session ID:** `{st.session_state[SESSION_STATE_KEY][:16]}...`")
        st.success("✅ Session is active")

        if st.button("🔴 End Session", key="end_session"):
            if end_session(st.session_state[SESSION_STATE_KEY]):
                st.session_state[SESSION_STATE_KEY] = None
                st.session_state[MESSAGES_STATE_KEY] = [
                    {"role": "assistant", "content": "Hi! Ask me about garage builds or pricing."}
                ]
                st.success("Session cleared!")
                st.rerun()
            else:
                st.error("Failed to end session")
    else:
        st.warning("⏳ Waiting for first response...")

    if st.button("↻ New Conversation", key="new_conversation"):
        st.session_state[SESSION_STATE_KEY] = None
        st.session_state[MESSAGES_STATE_KEY] = [
            {"role": "assistant", "content": "Hi! Ask me about garage builds or pricing."}
        ]
        st.rerun()
