"""Streamlit chat UI - Enhanced with proper tab isolation and email sharing."""

import os
import json
import uuid
import random
from typing import Any, Optional, Tuple
import re
import time
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

import httpx
import streamlit as st

BACKEND_URL = os.getenv("BACKEND_URL", "http://localhost:5003/api/v1/chat")
REQUEST_TIMEOUT = float(os.getenv("REQUEST_TIMEOUT", "1000.0"))
MAX_RETRIES = int(os.getenv("MAX_RETRIES", "0"))

# Email configuration - Fixed to RECEIVE emails at vardan.57555@gmail.com
SMTP_SERVER = os.getenv("SMTP_SERVER", "smtp.gmail.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_SENDER = "vardan.57555@gmail.com"  # Your Gmail account (SMTP authentication)
SMTP_PASSWORD = "zxla llvt vpjn vqxr"  # Gmail app password
EMAIL_RECIPIENT = "vardan.57555@gmail.com"  # WHERE YOU RECEIVE MESSAGES

INITIAL_GREETINGS = [
    "Hi! Ask me about garage builds or pricing.",
    "Welcome! Feel free to ask about garage designs, costs, or materials.",
    "Hello! I'm here to help with garage construction questions.",
    "Hey there! What would you like to know about building a garage?"
]

st.set_page_config(
    page_title="Garage Builder Assistant",
    page_icon="🤖",
    initial_sidebar_state="collapsed"
)

# Hide sidebar completely
hide_sidebar = """
<style>
    [data-testid="collapsedControl"] {
        display: none;
    }
    section[data-testid="stSidebar"] {
        display: none;
    }
</style>
"""
st.markdown(hide_sidebar, unsafe_allow_html=True)

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

def normalize_markdown_lists(text: str) -> str:
    """
    Fix inline bullets so Streamlit renders them as real lists.
    Converts:
      • Item
    into:
      - Item
    Ensures blank line before lists.
    """
    if not text:
        return text

    # Convert bullet symbols to markdown list items
    text = re.sub(r'\s*•\s*', '\n- ', text)

    # Ensure a blank line before any list
    text = re.sub(r'([^\n])\n- ', r'\1\n\n- ', text)

    return text.strip()


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

def send_email(user_email: str, phone: str, full_name: str, conversation_history: str) -> Tuple[bool, str]:
    """Send email to vardan.57555@gmail.com with user's info."""
    if not SMTP_SENDER or not SMTP_PASSWORD:
        return False, "Email configuration not set. Please contact administrator."

    try:
        # Debug: Check for non-ASCII characters
        import sys

        # Clean ALL inputs to remove non-ASCII characters
        full_name = ''.join(c if ord(c) < 128 else ' ' for c in full_name)
        user_email = ''.join(c if ord(c) < 128 else ' ' for c in user_email)
        phone = ''.join(c if ord(c) < 128 else ' ' for c in phone)
        conversation_history = ''.join(c if ord(c) < 128 else ' ' for c in conversation_history)

        # Clean constants too
        smtp_sender_clean = ''.join(c if ord(c) < 128 else ' ' for c in SMTP_SENDER)
        smtp_password_clean = ''.join(c if ord(c) < 128 else ' ' for c in SMTP_PASSWORD)

        # Build email body
        email_body = "New inquiry from Garage Builder Assistant!\n\n"
        email_body += "CONTACT INFORMATION:\n"
        email_body += f"- Name: {full_name}\n"
        email_body += f"- Email: {user_email}\n"
        email_body += f"- Phone: {phone}\n\n"
        email_body += "CONVERSATION HISTORY:\n"
        email_body += f"{conversation_history}\n\n"
        email_body += "---\n"
        email_body += f"Reply to this email to contact {full_name}."

        msg = MIMEMultipart()
        msg['From'] = user_email
        msg['To'] = "vardan.57555@gmail.com"
        msg['Reply-To'] = user_email
        msg['Subject'] = f"New Garage Builder Inquiry from {full_name}"

        msg.attach(MIMEText(email_body, 'plain'))

        server = smtplib.SMTP(SMTP_SERVER, SMTP_PORT)
        server.starttls()
        server.login(smtp_sender_clean, smtp_password_clean)
        server.sendmail(smtp_sender_clean, "vardan.57555@gmail.com", msg.as_string())
        server.quit()

        return True, "Your information has been sent successfully! We'll contact you soon."
    except Exception as e:
        # Debug output
        error_msg = str(e)
        debug_info = f"\nDEBUG INFO:\n"
        debug_info += f"SMTP_SENDER has non-ASCII: {any(ord(c) >= 128 for c in SMTP_SENDER)}\n"
        debug_info += f"SMTP_PASSWORD has non-ASCII: {any(ord(c) >= 128 for c in SMTP_PASSWORD)}\n"
        debug_info += f"user_email has non-ASCII: {any(ord(c) >= 128 for c in user_email)}\n"
        debug_info += f"full_name has non-ASCII: {any(ord(c) >= 128 for c in full_name)}\n"
        return False, f"Failed to send email: {error_msg}{debug_info}"

def get_conversation_history() -> str:
    """Format conversation history for email/export."""
    history_lines = []
    history_lines.append(f"Session ID: {st.session_state[SESSION_STATE_KEY] or 'Not started'}")
    history_lines.append(f"Generated: {time.strftime('%Y-%m-%d %H:%M:%S')}")
    history_lines.append("")

    for i, msg in enumerate(st.session_state[MESSAGES_STATE_KEY], 1):
        role = msg["role"].upper()
        content = msg["content"]
        # Remove SVG tags for email
        content = re.sub(r'<svg[^>]*>.*?</svg>', '[Image/Diagram]', content, flags=re.DOTALL)

        history_lines.append(f"[{role}]")
        history_lines.append(content)
        history_lines.append("")
        history_lines.append("-" * 60)
        history_lines.append("")

    return "\n".join(history_lines)

# Initialize session state - NOW PER TAB
if SESSION_STATE_KEY not in st.session_state:
    st.session_state[SESSION_STATE_KEY] = None

if MESSAGES_STATE_KEY not in st.session_state:
    st.session_state[MESSAGES_STATE_KEY] = [
        {"role": "assistant", "content": get_random_greeting()}
    ]

if "last_error" not in st.session_state:
    st.session_state.last_error = None

if "show_share_popup" not in st.session_state:
    st.session_state.show_share_popup = False

if "popup_triggered" not in st.session_state:
    st.session_state.popup_triggered = False

if "is_processing" not in st.session_state:
    st.session_state.is_processing = False

# Title with email button in top right
col1, col2 = st.columns([3, 1])
with col1:
    st.title("🏗️ Garage Builder Chat")
with col2:
    st.write("")  # Spacer for alignment
    if st.button("📧 Contact Us", key="share_conversation_top", use_container_width=True, type="primary"):
        st.session_state.show_share_popup = True
        st.session_state.popup_triggered = True  # Add flag to track button click

# Email Share Popup (Dialog) - Only show if explicitly triggered
if st.session_state.show_share_popup and st.session_state.get("popup_triggered", False):
    @st.dialog("📧 Send Your Inquiry")
    def share_popup():
        st.write("Share your contact information and we'll get back to you with the conversation details.")

        with st.form("share_form"):
            full_name = st.text_input("Full Name *", placeholder="John Doe")
            email = st.text_input("Email Address *", placeholder="john@example.com")
            phone = st.text_input("Phone Number *", placeholder="+1 234 567 8900")

            col1, col2 = st.columns(2)

            with col1:
                submit = st.form_submit_button("📨 Send Inquiry", use_container_width=True)
            with col2:
                cancel = st.form_submit_button("❌ Cancel", use_container_width=True)

            if cancel:
                st.session_state.show_share_popup = False
                st.session_state.popup_triggered = False
                st.rerun()

            if submit:
                # Validation
                if not full_name or not email or not phone:
                    st.error("⚠️ Please fill in all required fields.")
                    return

                # Basic email validation
                if "@" not in email or "." not in email:
                    st.error("⚠️ Please enter a valid email address.")
                    return

                # Get conversation history
                conversation_history = get_conversation_history()

                # Send email
                with st.spinner("Sending your inquiry..."):
                    success, message = send_email(email, phone, full_name, conversation_history)

                if success:
                    st.success(f"✅ {message}")
                    st.balloons()
                    time.sleep(2)
                    st.session_state.show_share_popup = False
                    st.session_state.popup_triggered = False
                    st.rerun()
                else:
                    st.error(f"❌ {message}")

    share_popup()
    # Reset the trigger flag after showing popup
    st.session_state.popup_triggered = False

# Display conversation
for msg in st.session_state[MESSAGES_STATE_KEY]:
    with st.chat_message(msg["role"]):
        content = msg["content"]
        svg, text_part = split_svg_and_text(content)

        if text_part:
            st.markdown(normalize_markdown_lists(text_part))

        if svg:
            st.write(svg, unsafe_allow_html=True)

# Show processing indicator if AI is thinking
if st.session_state.is_processing:
    with st.chat_message("assistant"):
        st.markdown("🤖 *Please wait, processing your request...*")

# Get user input
if prompt := st.chat_input("Type your question…", disabled=st.session_state.is_processing):
    # Set processing flag to true
    st.session_state.is_processing = True

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
                            st.markdown("🤖 The AI is generating a response…")

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
                    st.markdown(normalize_markdown_lists(text_part))

                if svg:
                    st.write(svg, unsafe_allow_html=True)

            st.session_state[MESSAGES_STATE_KEY].append({"role": "assistant", "content": reply})

        # Reset processing flag after response is complete
        st.session_state.is_processing = False
        st.rerun()
