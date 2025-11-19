"""Streamlit chat UI - Enhanced with proper tab isolation."""

import os
import json
import uuid
import random
from typing import Any, Optional, Tuple
import re
import time

import httpx
import streamlit as st

BACKEND_URL = os.getenv("BACKEND_URL", "http://localhost:5003/api/v1/chat")
REQUEST_TIMEOUT = float(os.getenv("REQUEST_TIMEOUT", "300.0"))
MAX_RETRIES = int(os.getenv("MAX_RETRIES", "0"))

INITIAL_GREETINGS = [
    "Hi! Ask me about garage builds or pricing.",
    "Welcome! Feel free to ask about garage designs, costs, or materials.",
    "Hello! I'm here to help with garage construction questions.",
    "Hey there! What would you like to know about building a garage?"
]

st.set_page_config(
    page_title="Garage Builder Assistant",
    page_icon="🤖",
    initial_sidebar_state="expanded"
)

def get_tab_specific_id():
    """
    Generate a unique ID for THIS browser tab using session storage.
    Each tab gets its own isolated session.
    """
    # Use browser's sessionStorage via JavaScript injection
    tab_id_script = """
    <script>
    if (!window.__STREAMLIT_TAB_ID__) {
        window.__STREAMLIT_TAB_ID__ = 'tab_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
        sessionStorage.setItem('streamlit_tab_id', window.__STREAMLIT_TAB_ID__);
    }
    </script>
    """
    st.html(tab_id_script)

    # Fallback: use Streamlit's session state for Python-side tracking
    if "tab_id" not in st.session_state:
        st.session_state.tab_id = str(uuid.uuid4())

    return st.session_state.tab_id

TAB_ID = get_tab_specific_id()
SESSION_STATE_KEY = f"sessionId_{TAB_ID}"
MESSAGES_STATE_KEY = f"messages_{TAB_ID}"

def get_random_greeting() -> str:
    """Get a random initial greeting."""
    return random.choice(INITIAL_GREETINGS)

def split_svg_and_text(content: str) -> Tuple[Optional[str], str]:
    """Split content into SVG and text parts."""
    svg_pattern = r'<svg[^>]*>.*?</svg>'
    match = re.search(svg_pattern, content, re.DOTALL)

    if match:
        svg = match.group(0)
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

def test_backend_health() -> Tuple[bool, str]:
    """Test if backend is reachable."""
    try:
        with httpx.Client(timeout=5.0) as client:
            base_url = BACKEND_URL.replace('/api/v1/chat', '')
            response = client.get(f"{base_url}/health", follow_redirects=True)
            return True, f"Backend reachable (status: {response.status_code})"
    except httpx.ConnectError:
        return False, "Cannot connect to backend - is it running?"
    except httpx.TimeoutException:
        return False, "Backend health check timed out"
    except Exception as e:
        return False, f"Backend check failed: {str(e)}"

# Initialize session state - NOW PER TAB
if SESSION_STATE_KEY not in st.session_state:
    st.session_state[SESSION_STATE_KEY] = None

if MESSAGES_STATE_KEY not in st.session_state:
    st.session_state[MESSAGES_STATE_KEY] = [
        {"role": "assistant", "content": get_random_greeting()}
    ]

if "last_error" not in st.session_state:
    st.session_state.last_error = None

st.title("🏗️ Garage Builder Chat")

# Sidebar with diagnostics
with st.sidebar:
    st.header("🔹 Connection Info")
    st.info(f"**Tab ID:** `{TAB_ID[:16]}...`")
    st.caption(f"**Backend:** {BACKEND_URL}")
    st.caption(f"**Timeout:** {REQUEST_TIMEOUT}s")

    if st.button("🔍 Test Backend Connection"):
        with st.spinner("Testing..."):
            healthy, message = test_backend_health()
            if healthy:
                st.success(message)
            else:
                st.error(message)

    st.divider()

    st.header("Session Info")
    if st.session_state[SESSION_STATE_KEY]:
        st.info(f"**Session ID:** `{st.session_state[SESSION_STATE_KEY][:16]}...`")
        st.success("✅ Session is active")

        if st.button("🔴 End Session", key="end_session"):
            try:
                with httpx.Client(timeout=10.0) as client:
                    response = client.post(
                        f"{BACKEND_URL.replace('/chat', '')}/end",
                        json={"sessionId": st.session_state[SESSION_STATE_KEY]},
                    )
                    response.raise_for_status()

                st.session_state[SESSION_STATE_KEY] = None
                st.session_state[MESSAGES_STATE_KEY] = [
                    {"role": "assistant", "content": get_random_greeting()}
                ]
                st.success("Session cleared!")
                st.rerun()
            except Exception as e:
                st.error(f"Failed to end session: {e}")
    else:
        st.warning("⏳ Waiting for first response...")

    if st.button("↻ New Conversation", key="new_conversation"):
        st.session_state[SESSION_STATE_KEY] = None
        st.session_state[MESSAGES_STATE_KEY] = [
            {"role": "assistant", "content": get_random_greeting()}
        ]
        st.session_state.last_error = None
        st.rerun()

    if st.session_state.last_error:
        st.divider()
        st.header("⚠️ Last Error")
        with st.expander("View Details"):
            st.code(st.session_state.last_error)

# Display conversation
for msg in st.session_state[MESSAGES_STATE_KEY]:
    with st.chat_message(msg["role"]):
        content = msg["content"]
        svg, text_part = split_svg_and_text(content)

        if text_part:
            st.markdown(text_part)

        if svg:
            st.write(svg, unsafe_allow_html=True)

# Get user input
if prompt := st.chat_input("Type your question…"):
    st.session_state[MESSAGES_STATE_KEY].append({"role": "user", "content": prompt})
    with st.chat_message("user"):
        st.markdown(prompt)

    with st.chat_message("assistant"):
        placeholder = st.empty()
        reply = None

        for attempt in range(MAX_RETRIES + 1):
            try:
                timeout = httpx.Timeout(REQUEST_TIMEOUT, connect=10.0)
                with httpx.Client(timeout=timeout) as client:
                    # ✅ ALWAYS include sessionId - even if None on first message
                    # Backend will create new session and return sessionId
                    request_body = {
                        "question": prompt,
                        "sessionId": st.session_state[SESSION_STATE_KEY] or ""
                    }

                    with placeholder.container():
                        if attempt > 0:
                            st.markdown(f"⏳ Retry {attempt}/{MAX_RETRIES}...")
                        else:
                            st.markdown("⏳ Sending request to backend…")

                        start_time = time.time()

                    response = client.post(BACKEND_URL, json=request_body)
                    elapsed = time.time() - start_time

                    response.raise_for_status()

                    try:
                        raw_payload = response.json()
                    except ValueError:
                        raw_payload = response.text

                session_id, reply = parse_chat_response(raw_payload)
                if session_id:
                    st.session_state[SESSION_STATE_KEY] = session_id

                st.session_state.last_error = None
                break

            except httpx.TimeoutException as exc:
                error_msg = f"Request timed out after {REQUEST_TIMEOUT}s"
                if attempt < MAX_RETRIES:
                    continue
                else:
                    reply = f"⚠️ {error_msg}\n\n**Troubleshooting:**\n- Check if backend is running\n- Try a simpler question\n- Increase timeout in environment variables"
                    st.session_state.last_error = f"{error_msg}\nAttempt: {attempt + 1}/{MAX_RETRIES + 1}\nBackend: {BACKEND_URL}"

            except httpx.ConnectError as exc:
                error_msg = "Cannot connect to backend"
                reply = f"⚠️ {error_msg}\n\n**Please verify:**\n- Backend service is running on {BACKEND_URL}\n- Port 3000 is accessible\n- No firewall blocking the connection"
                st.session_state.last_error = f"{error_msg}\nBackend: {BACKEND_URL}\nError: {str(exc)}"
                break

            except Exception as exc:
                error_msg = f"Request failed: {type(exc).__name__}"
                reply = f"⚠️ {error_msg}: {str(exc)}"
                st.session_state.last_error = f"{error_msg}\n{str(exc)}\nBackend: {BACKEND_URL}"
                break

        if reply:
            svg, text_part = split_svg_and_text(reply)

            with placeholder.container():
                if text_part:
                    st.markdown(text_part)

                if svg:
                    st.write(svg, unsafe_allow_html=True)

            st.session_state[MESSAGES_STATE_KEY].append({"role": "assistant", "content": reply})
