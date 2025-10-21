"""Streamlit chat UI with proper session management."""

import os
import time
import re
import json
from typing import Any

import httpx
import streamlit as st

# Backend URLs
BACKEND_URL = os.getenv("BACKEND_URL", "http://localhost:5003/api/v1/chat")

st.set_page_config(page_title="Garage Builder Assistant", page_icon="🤖")


def format_pricing_response(payload: Any) -> str:
    """Format backend pricing response into readable message."""

    if not payload:
        return "⚠️ Empty response received from pricing service."

    if isinstance(payload, str):
        try:
            payload = json.loads(payload)
        except json.JSONDecodeError:
            return payload.strip()

    if not isinstance(payload, dict):
        return f"⚠️ Unexpected response type: {type(payload).__name__}"

    data = (
        payload.get("data")
        or payload.get("message")
        or payload.get("answer")
        or payload.get("result")
        or payload
    )

    if isinstance(data, dict):
        data = data.get("text") or data.get("summary") or str(data)
    elif not isinstance(data, str):
        data = str(data)

    return data.strip()


# ===== CRITICAL: Initialize or retrieve sessionId from Streamlit session state =====
if "sessionId" not in st.session_state:
    st.session_state.sessionId = None  # Will be set after first request

if "messages" not in st.session_state:
    st.session_state.messages = [
        {"role": "assistant", "content": "Hi! Ask me about garage builds or pricing."}
    ]

st.title("Garage Builder Chat")

# Display conversation history
for msg in st.session_state.messages:
    with st.chat_message(msg["role"]):
        st.markdown(msg["content"])

# Get user input
if prompt := st.chat_input("Type your question…"):
    st.session_state.messages.append({"role": "user", "content": prompt})
    with st.chat_message("user"):
        st.markdown(prompt)

    with st.chat_message("assistant"):
        placeholder = st.empty()
        placeholder.markdown("⏳ Sending request to backend…")

        try:
            timeout = httpx.Timeout(60.0)
            with httpx.Client(timeout=timeout) as client:
                # ===== CRITICAL: Build request body with sessionId if available =====
                request_body = {
                    "question": prompt,
                }
                
                # If we have a sessionId from a previous request, send it back
                if st.session_state.sessionId:
                    request_body["sessionId"] = st.session_state.sessionId
                    print(f"[Streamlit] Reusing sessionId: {st.session_state.sessionId}")
                else:
                    print("[Streamlit] First request - will get new sessionId")

                response = client.post(
                    BACKEND_URL,
                    json=request_body,
                )
                response.raise_for_status()

                # Handle response
                try:
                    job_data = response.json()
                except Exception:
                    job_data = response.text

                print(f"[Streamlit] Response: {job_data}")

                # ===== DEBUG: Print full response to see structure =====
                print(f"[Streamlit DEBUG] Full response: {job_data}")
                print(f"[Streamlit DEBUG] Response type: {type(job_data)}")
                
                # ===== CRITICAL: Extract and save sessionId =====
                if isinstance(job_data, dict):
                    print(f"[Streamlit DEBUG] Dict keys: {job_data.keys()}")
                    
                    # Save sessionId for next request
                    if "sessionId" in job_data:
                        st.session_state.sessionId = job_data["sessionId"]
                        print(f"[Streamlit] Saved sessionId: {st.session_state.sessionId}")
                    
                    # Try different possible answer field names
                    answer_text = (
                        job_data.get("answer")
                        or job_data.get("data", {}).get("answer") if isinstance(job_data.get("data"), dict) else None
                        or job_data.get("message")
                        or job_data.get("result")
                        or ""
                    )
                    
                    print(f"[Streamlit DEBUG] Extracted answer: {answer_text}")
                    reply = answer_text if answer_text else f"⚠️ Could not extract answer. Response: {job_data}"
                else:
                    print(f"[Streamlit DEBUG] Response is not a dict, it's: {job_data}")
                    reply = str(job_data)

        except Exception as exc:
            reply = f"⚠️ Request failed: {exc}"
            print(f"[Streamlit] Error: {exc}")

        placeholder.markdown(reply)
        st.session_state.messages.append({"role": "assistant", "content": reply})


# Display session info (for debugging)
with st.sidebar:
    st.header("Session Info")
    if st.session_state.sessionId:
        st.info(f"**Session ID:** `{st.session_state.sessionId}`")
        st.success("Session is active")
    else:
        st.warning("Waiting for first response...")
    
    if st.button("Clear Session"):
        st.session_state.sessionId = None
        st.session_state.messages = [
            {"role": "assistant", "content": "Hi! Ask me about garage builds or pricing."}
        ]
        st.rerun()


def end_session(session_id: str) -> bool:
    """Call backend to end a session."""
    if not session_id:
        return False
    
    try:
        with httpx.Client(timeout=10.0) as client:
            response = client.post(
                f"{BACKEND_URL.replace('/chat', '')}/end",  # Change /chat to /end
                json={"sessionId": session_id},
            )
            response.raise_for_status()
            
            result = response.json()
            print(f"[Streamlit] Session ended: {result}")
            return result.get("success", False)
    except Exception as exc:
        print(f"[Streamlit] Error ending session: {exc}")
        return False

# Update your "Clear Session" button:
with st.sidebar:
    st.header("Session Info")
    if st.session_state.sessionId:
        st.info(f"**Session ID:** `{st.session_state.sessionId}`")
        st.success("Session is active")
        
        # ===== NEW: End session button =====
        if st.button("🔴 Clear Session"):
            if end_session(st.session_state.sessionId):
                st.session_state.sessionId = None
                st.session_state.messages = [
                    {"role": "assistant", "content": "Hi! Ask me about garage builds or pricing."}
                ]
                st.success("Session cleared!")
                st.rerun()
            else:
                st.error("Failed to end session")
    else:
        st.warning("Waiting for first response...")
    
    # Also show button to start fresh (without calling backend)
    if st.button("↻ New Conversation"):
        st.session_state.sessionId = None
        st.session_state.messages = [
            {"role": "assistant", "content": "Hi! Ask me about garage builds or pricing."}
        ]
        st.rerun()