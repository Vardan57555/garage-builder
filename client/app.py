"""Streamlit chat UI - Database persistence with SVG email support."""
import os
import json
import uuid
import random
from typing import Any, List, Optional, Tuple
import re
import time
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.mime.image import MIMEImage
import base64
import httpx
import streamlit as st
import sqlite3
from pathlib import Path

BACKEND_URL = os.getenv("BACKEND_URL", "http://localhost:5003/api/v1/chat")
REQUEST_TIMEOUT = float(os.getenv("REQUEST_TIMEOUT", "1000.0"))
MAX_RETRIES = int(os.getenv("MAX_RETRIES", "0"))

# Email configuration
SMTP_SERVER = os.getenv("SMTP_SERVER", "smtp.gmail.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_SENDER = "vardan.57555@gmail.com"
SMTP_PASSWORD = "zxla llvt vpjn vqxr"
EMAIL_RECIPIENT = "vardan.57555@gmail.com"

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

# Database setup
DB_PATH = Path(".streamlit/chat_history.db")
DB_PATH.parent.mkdir(exist_ok=True)

def init_db():
    """Initialize SQLite database."""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS conversations (
            session_id TEXT PRIMARY KEY,
            messages TEXT NOT NULL,
            backend_session_id TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    conn.commit()
    conn.close()

def load_conversation(session_id: str) -> Tuple[List[dict], Optional[str]]:
    """Load conversation from database."""
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        cursor.execute(
            "SELECT messages, backend_session_id FROM conversations WHERE session_id = ?",
            (session_id,)
        )
        result = cursor.fetchone()
        conn.close()

        if result:
            messages = json.loads(result[0])
            backend_session_id = result[1]
            return messages, backend_session_id
    except Exception as e:
        st.warning(f"Error loading conversation: {str(e)}")

    return [], None

def save_conversation(session_id: str, messages: List[dict], backend_session_id: Optional[str]):
    """Save conversation to database."""
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()

        cursor.execute(
            """
            INSERT OR REPLACE INTO conversations
            (session_id, messages, backend_session_id, updated_at)
            VALUES (?, ?, ?, CURRENT_TIMESTAMP)
            """,
            (session_id, json.dumps(messages), backend_session_id)
        )
        conn.commit()
        conn.close()
    except Exception as e:
        st.warning(f"Error saving conversation: {str(e)}")

# Initialize database
init_db()

def split_svg_and_text(content: str) -> Tuple[Optional[str], str, bool]:
    """Split content into SVG, text, and whether it has contact button marker."""
    svg_pattern = r'<svg[^>]*>.*?</svg>'
    match = re.search(svg_pattern, content, re.DOTALL)

    has_contact_button = "[📧 Contact Us](#contact-button)" in content

    if match:
        svg = match.group(0)
        text = content[:match.start()] + content[match.end():]
        text = text.replace("[📧 Contact Us](#contact-button)", "").strip()
        return svg, text, has_contact_button

    text = content.replace("[📧 Contact Us](#contact-button)", "").strip()
    return None, text, has_contact_button

def normalize_markdown_lists(text: str) -> str:
    """Fix inline bullets for proper Streamlit rendering."""
    if not text:
        return text
    text = re.sub(r'\s*•\s*', '\n- ', text)
    text = re.sub(r'([^\n])\n- ', r'\1\n\n- ', text)
    return text.strip()

def format_pricing_response(payload: Any) -> str:
    """Extract human-readable message from backend payload."""
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
    """Parse backend response and return session ID with formatted answer."""
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
            payload.get("message") or payload.get("error") or payload.get("errors") or payload
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

def get_conversation_history_content() -> Tuple[str, str, List[dict]]:
    """Return plain text history, HTML history, and inline image attachments."""
    attachments: List[dict] = []
    image_index: int = 1
    html_parts = []
    plain_lines: List[str] = []

    html_parts.append("<html><body style='font-family: Arial, sans-serif;'>")
    html_parts.append(f"<h2>Garage Builder Assistant - Conversation History</h2>")
    html_parts.append(f"<p><strong>Session ID:</strong> {st.session_state.get('backend_session_id') or 'Not started'}</p>")
    html_parts.append(f"<p><strong>Generated:</strong> {time.strftime('%Y-%m-%d %H:%M:%S')}</p>")
    html_parts.append("<hr/>")

    plain_lines.append(f"Session ID: {st.session_state.get('backend_session_id') or 'Not started'}")
    plain_lines.append(f"Generated: {time.strftime('%Y-%m-%d %H:%M:%S')}")
    plain_lines.append("")

    for i, msg in enumerate(st.session_state.get("messages", []), 1):
        role = msg["role"].upper()
        content = msg["content"]

        content = re.sub(r'\[📧 Contact Us\]\(#contact-button\)', '', content)

        bg_color = "#e3f2fd" if role == "USER" else "#f5f5f5"
        html_parts.append(f"<div style='margin: 20px 0; padding: 15px; background-color: {bg_color}; border-radius: 8px;'>")
        html_parts.append(f"<h3 style='margin-top: 0; color: #1976d2;'>{role}</h3>")
        plain_lines.append(f"[{role}]")

        img_pattern = r'!\[([^\]]*)\]\(data:image/([^;]+);base64,([^)]+)\)'
        img_matches = list(re.finditer(img_pattern, content))

        svg_pattern = r'<svg[^>]*>.*?</svg>'
        svg_match = re.search(svg_pattern, content, re.DOTALL)

        if img_matches:
            rendered_text = content
            for img_match in reversed(img_matches):
                alt_text = img_match.group(1) or "Garage Rendering"
                img_format = img_match.group(2)
                base64_data = img_match.group(3)

                try:
                    image_bytes = base64.b64decode(base64_data)
                except Exception:
                    image_bytes = b""

                cid = f"garage_rendering_{image_index}"
                image_index += 1

                attachments.append({
                    "cid": cid,
                    "mime": img_format,
                    "data": image_bytes,
                    "alt": alt_text,
                })

                rendered_text = (
                    rendered_text[:img_match.start()]
                    + f"<div style='margin: 15px 0; text-align: center;'>"
                    + f"<img src=\"cid:{cid}\" alt=\"{alt_text}\" style=\"max-width: 100%; max-height: 600px; height: auto; border: 2px solid #1976d2; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);\"/>"
                    + f"<p style='font-size: 14px; color: #666; margin-top: 10px; font-style: italic;'>{alt_text}</p>"
                    + "</div>"
                    + rendered_text[img_match.end():]
                )

                plain_lines.append(f"[Image attached: {alt_text}]")

            text_html = rendered_text.replace('\n', '<br/>')
            text_html = re.sub(r'\*\*(.*?)\*\*', r'<strong>\\1</strong>', text_html)
            text_html = re.sub(r'\*(.*?)\*', r'<em>\\1</em>', text_html)
            text_html = re.sub(r'•\s*', '&bull; ', text_html)
            html_parts.append(f"<p>{text_html}</p>")

        elif svg_match:
            svg = svg_match.group(0)
            text = content[:svg_match.start()] + content[svg_match.end():]

            if text.strip():
                text_html = text.replace('\n', '<br/>')
                text_html = re.sub(r'\*\*(.*?)\*\*', r'<strong>\\1</strong>', text_html)
                text_html = re.sub(r'\*(.*?)\*', r'<em>\\1</em>', text_html)
                text_html = re.sub(r'•\s*', '&bull; ', text_html)
                html_parts.append(f"<p>{text_html}</p>")
                plain_lines.append(text.strip())

            html_parts.append(f"<div style='margin: 15px 0; text-align: center;'>{svg}</div>")
            plain_lines.append('[SVG diagram included]')

        else:
            text_html = content.replace('\n', '<br/>')
            text_html = re.sub(r'\*\*(.*?)\*\*', r'<strong>\\1</strong>', text_html)
            text_html = re.sub(r'\*(.*?)\*', r'<em>\\1</em>', text_html)
            text_html = re.sub(r'•\s*', '&bull; ', text_html)
            html_parts.append(f"<p>{text_html}</p>")
            plain_lines.append(content.strip())

        html_parts.append("</div>")
        html_parts.append("<hr style='border: none; border-top: 1px solid #ddd;' />")
        plain_lines.append("-" * 60)
        plain_lines.append("")

    html_parts.append("</body></html>")
    return "\n".join(plain_lines).strip(), "\n".join(html_parts), attachments

def send_email(user_email: str, phone: str, full_name: str, plain_history: str, html_history: str, attachments: List[dict]) -> Tuple[bool, str]:
    """Send email with user's info, conversation history, and embedded images."""
    if not SMTP_SENDER or not SMTP_PASSWORD:
        return False, "Email configuration not set. Please contact administrator."

    try:
        full_name = ''.join(c if ord(c) < 128 else ' ' for c in full_name)
        user_email = ''.join(c if ord(c) < 128 else ' ' for c in user_email)
        phone = ''.join(c if ord(c) < 128 else ' ' for c in phone)

        smtp_sender_clean = ''.join(c if ord(c) < 128 else ' ' for c in SMTP_SENDER)
        smtp_password_clean = ''.join(c if ord(c) < 128 else ' ' for c in SMTP_PASSWORD)

        plain_body = "New inquiry from Garage Builder Assistant!\n\n"
        plain_body += "CONTACT INFORMATION:\n"
        plain_body += f"- Name: {full_name}\n"
        plain_body += f"- Email: {user_email}\n"
        plain_body += f"- Phone: {phone}\n\n"
        plain_body += "CONVERSATION HISTORY:\n"
        plain_body += f"{plain_history}\n\n"
        plain_body += "---\n"
        plain_body += f"Reply to this email to contact {full_name}."

        html_body = f"""
        <html>
        <body style='font-family: Arial, sans-serif;'>
            <h1>New Inquiry from Garage Builder Assistant</h1>

            <div style='background-color: #f0f0f0; padding: 20px; border-radius: 8px; margin: 20px 0;'>
                <h2>Contact Information</h2>
                <p><strong>Name:</strong> {full_name}</p>
                <p><strong>Email:</strong> {user_email}</p>
                <p><strong>Phone:</strong> {phone}</p>
            </div>

            <hr style='border: 2px solid #1976d2; margin: 30px 0;'/>

            {html_history}

            <hr style='border: 2px solid #1976d2; margin: 30px 0;'/>

            <p style='color: #666; font-style: italic;'>
                Reply to this email to contact {full_name} at {user_email}
            </p>
        </body>
        </html>
        """

        msg = MIMEMultipart('alternative')
        msg['From'] = user_email
        msg['To'] = EMAIL_RECIPIENT
        msg['Reply-To'] = user_email
        msg['Subject'] = f"New Garage Builder Inquiry from {full_name}"

        msg.attach(MIMEText(plain_body, 'plain'))
        msg.attach(MIMEText(html_body, 'html'))

        for attachment in attachments:
            if not attachment.get("data"):
                continue
            img = MIMEImage(attachment["data"], _subtype=attachment["mime"])
            img.add_header('Content-ID', f"<{attachment['cid']}>")
            img.add_header('Content-Disposition', 'inline', filename=f"{attachment['cid']}.{attachment['mime']}")
            msg.attach(img)

        server = smtplib.SMTP(SMTP_SERVER, SMTP_PORT)
        server.starttls()
        server.login(smtp_sender_clean, smtp_password_clean)
        server.sendmail(smtp_sender_clean, EMAIL_RECIPIENT, msg.as_string())
        server.quit()

        return True, "Your information has been sent successfully! We'll contact you soon."
    except Exception as e:
        return False, f"Failed to send email: {str(e)}"

# Get or create session ID from URL
query_params = st.query_params
if "sid" in query_params:
    session_id = query_params["sid"]
else:
    session_id = str(uuid.uuid4())
    st.query_params["sid"] = session_id

# Initialize session state
if "user_session_id" not in st.session_state:
    st.session_state.user_session_id = session_id
    messages, backend_session_id = load_conversation(session_id)
    st.session_state.messages = messages if messages else [
        {"role": "assistant", "content": random.choice(INITIAL_GREETINGS)}
    ]
    st.session_state.backend_session_id = backend_session_id

if "show_share_popup" not in st.session_state:
    st.session_state.show_share_popup = False

if "popup_triggered" not in st.session_state:
    st.session_state.popup_triggered = False

if "is_processing" not in st.session_state:
    st.session_state.is_processing = False

if "pending_prompt" not in st.session_state:
    st.session_state.pending_prompt = None

st.title("🏗️ Garage Builder Chat")

# Display conversation
for msg_idx, msg in enumerate(st.session_state.messages):
    with st.chat_message(msg["role"]):
        content = msg["content"]
        svg, text_part, has_contact = split_svg_and_text(content)

        if text_part:
            st.markdown(normalize_markdown_lists(text_part))

        if svg:
            st.write(svg, unsafe_allow_html=True)

        if has_contact:
            if st.button("📧 Contact Us", key=f"contact_inline_{msg_idx}", type="primary"):
                st.session_state.show_share_popup = True
                st.session_state.popup_triggered = True
                st.rerun()

# Email popup dialog
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
                if not full_name or not email or not phone:
                    st.error("⚠️ Please fill in all required fields.")
                    return

                if "@" not in email or "." not in email:
                    st.error("⚠️ Please enter a valid email address.")
                    return

                plain_history, html_history, attachments = get_conversation_history_content()

                with st.spinner("Sending your inquiry..."):
                    success, message = send_email(
                        email,
                        phone,
                        full_name,
                        plain_history,
                        html_history,
                        attachments
                    )

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
    st.session_state.popup_triggered = False

# Chat input - disabled when processing
if prompt := st.chat_input("Type your question…", disabled=st.session_state.is_processing):
    st.session_state.pending_prompt = prompt
    st.session_state.is_processing = True
    st.rerun()

# Process pending message
if st.session_state.is_processing and st.session_state.pending_prompt:
    prompt = st.session_state.pending_prompt
    st.session_state.pending_prompt = None

    # Add user message to history
    st.session_state.messages.append({"role": "user", "content": prompt})
    save_conversation(st.session_state.user_session_id, st.session_state.messages, st.session_state.backend_session_id)

    # Display user message
    with st.chat_message("user"):
        st.markdown(prompt)

    # Get AI response
    with st.chat_message("assistant"):
        placeholder = st.empty()
        reply = None

        for attempt in range(MAX_RETRIES + 1):
            try:
                timeout = httpx.Timeout(REQUEST_TIMEOUT, connect=10.0)
                with httpx.Client(timeout=timeout) as client:
                    request_body = {
                        "question": prompt,
                        "sessionId": st.session_state.backend_session_id or ""
                    }

                    with placeholder.container():
                        if attempt > 0:
                            st.markdown(f"⏳ Retry {attempt}/{MAX_RETRIES}...")
                        else:
                            st.markdown("🤖 The AI is generating a response…")

                    response = client.post(BACKEND_URL, json=request_body)
                    response.raise_for_status()

                    try:
                        raw_payload = response.json()
                    except ValueError:
                        raw_payload = response.text

                session_id_new, reply = parse_chat_response(raw_payload)
                if session_id_new:
                    st.session_state.backend_session_id = session_id_new

                break

            except httpx.TimeoutException:
                if attempt < MAX_RETRIES:
                    continue
                reply = f"⚠️ Request timed out after {REQUEST_TIMEOUT}s"
            except httpx.ConnectError:
                reply = f"⚠️ Cannot connect to backend at {BACKEND_URL}"
                break
            except Exception as exc:
                reply = f"⚠️ Request failed: {str(exc)}"
                break

        if reply:
            svg, text_part, has_contact = split_svg_and_text(reply)

            with placeholder.container():
                if text_part:
                    st.markdown(normalize_markdown_lists(text_part))

                if svg:
                    st.write(svg, unsafe_allow_html=True)

                if has_contact:
                    if st.button("📧 Contact Us", key="contact_new_msg", type="primary"):
                        st.session_state.show_share_popup = True
                        st.session_state.popup_triggered = True
                        st.rerun()

            st.session_state.messages.append({"role": "assistant", "content": reply})
            save_conversation(st.session_state.user_session_id, st.session_state.messages, st.session_state.backend_session_id)

    st.session_state.is_processing = False
    st.rerun()
