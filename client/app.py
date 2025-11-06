"""Streamlit chat UI - Enhanced with better error handling and diagnostics."""

import os
import json
import uuid
from typing import Any, Optional, Tuple
import re
import time

import httpx
import streamlit as st

BACKEND_URL = os.getenv("BACKEND_URL", "http://localhost:5003/api/v1/chat")
REQUEST_TIMEOUT = float(os.getenv("REQUEST_TIMEOUT", "120.0"))  # Configurable timeout
MAX_RETRIES = int(os.getenv("MAX_RETRIES", "1"))  # Number of retries on timeout

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
            # Try to reach the base URL
            base_url = BACKEND_URL.replace('/api/v1/chat', '')
            response = client.get(f"{base_url}/health", follow_redirects=True)
            return True, f"Backend reachable (status: {response.status_code})"
    except httpx.ConnectError:
        return False, "Cannot connect to backend - is it running?"
    except httpx.TimeoutException:
        return False, "Backend health check timed out"
    except Exception as e:
        return False, f"Backend check failed: {str(e)}"


# Initialize session state
if SESSION_STATE_KEY not in st.session_state:
    st.session_state[SESSION_STATE_KEY] = None

if MESSAGES_STATE_KEY not in st.session_state:
    st.session_state[MESSAGES_STATE_KEY] = [
        {"role": "assistant", "content": "Hi! Ask me about garage builds or pricing."}
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

    # Health check
    if st.button("🔍 Test Backend Connection"):
        with st.spinner("Testing..."):
            healthy, message = test_backend_health()
            if healthy:
                st.success(message)
            else:
                st.error(message)

    st.divider()

    # Session info
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
                    {"role": "assistant", "content": "Hi! Ask me about garage builds or pricing."}
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
            {"role": "assistant", "content": "Hi! Ask me about garage builds or pricing."}
        ]
        st.session_state.last_error = None
        st.rerun()

    # Show last error if any
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

        # Attempt request with retries
        for attempt in range(MAX_RETRIES + 1):
            try:
                timeout = httpx.Timeout(REQUEST_TIMEOUT, connect=10.0)
                with httpx.Client(timeout=timeout) as client:
                    request_body = {"question": prompt}

                    if st.session_state[SESSION_STATE_KEY]:
                        request_body["sessionId"] = st.session_state[SESSION_STATE_KEY]

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
                break  # Success, exit retry loop

            except httpx.TimeoutException as exc:
                error_msg = f"Request timed out after {REQUEST_TIMEOUT}s"
                if attempt < MAX_RETRIES:
                    continue  # Retry
                else:
                    reply = f"⚠️ {error_msg}\n\n**Troubleshooting:**\n- Check if backend is running\n- Try a simpler question\n- Increase timeout in environment variables"
                    st.session_state.last_error = f"{error_msg}\nAttempt: {attempt + 1}/{MAX_RETRIES + 1}\nBackend: {BACKEND_URL}"

            except httpx.ConnectError as exc:
                error_msg = "Cannot connect to backend"
                reply = f"⚠️ {error_msg}\n\n**Please verify:**\n- Backend service is running on {BACKEND_URL}\n- Port 3000 is accessible\n- No firewall blocking the connection"
                st.session_state.last_error = f"{error_msg}\nBackend: {BACKEND_URL}\nError: {str(exc)}"
                break  # Don't retry connection errors

            except Exception as exc:
                error_msg = f"Request failed: {type(exc).__name__}"
                reply = f"⚠️ {error_msg}: {str(exc)}"
                st.session_state.last_error = f"{error_msg}\n{str(exc)}\nBackend: {BACKEND_URL}"
                break

        # Render response
        if reply:
            svg, text_part = split_svg_and_text(reply)

            with placeholder.container():
                if text_part:
                    st.markdown(text_part)

                if svg:
                    st.write(svg, unsafe_allow_html=True)

            st.session_state[MESSAGES_STATE_KEY].append({"role": "assistant", "content": reply})
