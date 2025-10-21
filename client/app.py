# streamlit_client/streamlit_app.py
"""Streamlit chat UI that summarizes price-service responses."""

import os
import time
import re
import json
from typing import Any

import httpx
import streamlit as st

# Backend URLs
BACKEND_URL = os.getenv("BACKEND_URL", "http://localhost:5003/api/v1/price/get-ai-prices")
BACKEND_STATUS_URL = os.getenv("BACKEND_STATUS_URL", "http://localhost:5003/api/v1/price/job-status")

st.set_page_config(page_title="Garage Builder Assistant", page_icon="🤖")


def format_pricing_response(payload: Any) -> str:
    """Format backend pricing string or dict response into a readable message."""

    if not payload:
        return "⚠️ Empty response received from pricing service."

    # If it's a string, try to parse it as JSON first
    if isinstance(payload, str):
        try:
            payload = json.loads(payload)
        except json.JSONDecodeError:
            # It's plain text — just return it nicely
            return payload.strip()

    # Ensure it's a dictionary
    if not isinstance(payload, dict):
        return f"⚠️ Unexpected response type: {type(payload).__name__}"

    # Handle case when backend only returns "data" or "message"
    data = (
        payload.get("data")
        or payload.get("message")
        or payload.get("result")
        or payload
    )

    # If it's a dict, unwrap one level
    if isinstance(data, dict):
        data = data.get("text") or data.get("summary") or str(data)
    # If it's not a string yet, convert it
    elif not isinstance(data, str):
        data = str(data)
    # If it's already a string, just use it as-is (DON'T call .get() on it!)

    # --- Try to extract useful info if available ---
    quote_match = re.search(r"(✅.*Price Quote Generated!)", data)
    quote_text = quote_match.group(1) if quote_match else None

    if not quote_text:
        # No structured quote – just return the text
        return data.strip()

    dim_match = re.search(r"• Dimensions:\s*(.*)", data)
    dimensions = dim_match.group(1).strip() if dim_match else "N/A"

    roof_match = re.search(r"• Roof Style:\s*(.*)", data)
    roof_style = roof_match.group(1).strip() if roof_match else "N/A"

    price_match = re.search(r"💰 \*\*ESTIMATED TOTAL PRICE: (.*)\*\*", data)
    total_price = price_match.group(1).strip() if price_match else "N/A"

    lines = [
        f"### {quote_text}",
        f"📐 **Building Specifications:**",
        f"   - Dimensions: {dimensions}",
        f"   - Roof Style: {roof_style}",
        f"💰 **Estimated Total Price: {total_price}**",
    ]

    return "\n".join(lines)


# Streamlit UI
if "messages" not in st.session_state:
    st.session_state.messages = [
        {"role": "assistant", "content": "Hi! Ask me about garage builds or pricing."}
    ]

st.title("Garage Builder Chat")

for msg in st.session_state.messages:
    with st.chat_message(msg["role"]):
        st.markdown(msg["content"])

if prompt := st.chat_input("Type your question…"):
    st.session_state.messages.append({"role": "user", "content": prompt})
    with st.chat_message("user"):
        st.markdown(prompt)

    with st.chat_message("assistant"):
        placeholder = st.empty()
        placeholder.markdown("⏳ Sending request to backend…")

        try:
            # Step 1: Send request to backend and get job_id
            timeout = httpx.Timeout(60.0)
            with httpx.Client(timeout=timeout) as client:
                response = client.post(
                    BACKEND_URL,
                    json={
                        "question": prompt,
                        "conversation": "\n".join(
                            [msg["content"] for msg in st.session_state.messages]
                        ),
                    },
                )
                response.raise_for_status()

                # Safely handle JSON or text response
                try:
                    job_data = response.json()
                except Exception:
                    job_data = response.text  # backend may return plain text

                # Try to extract job_id from JSON or text
                job_id = None
                if isinstance(job_data, dict):
                    # Safely get nested values, checking types
                    data_field = job_data.get("data", {})
                    result_field = job_data.get("result", {})

                    # Only call .get() if they're actually dicts
                    data_job_id = data_field.get("job_id") if isinstance(data_field, dict) else None
                    result_job_id = result_field.get("job_id") if isinstance(result_field, dict) else None

                    job_id = (
                        job_data.get("job_id")
                        or data_job_id
                        or result_job_id
                    )
                elif isinstance(job_data, str):
                    # Try to detect job_id pattern in text
                    match = re.search(
                        r"job[_\s:-]*id[:\s]*([a-zA-Z0-9_-]+)", job_data, re.IGNORECASE
                    )
                    if match:
                        job_id = match.group(1)

                # If no job_id, treat response as final result (no polling)
                if not job_id:
                    reply = format_pricing_response(job_data)
                    placeholder.markdown(reply)
                    st.session_state.messages.append({"role": "assistant", "content": reply})
                    st.stop()

            # Step 2: Poll backend until result is ready (with timeout safety)
            with st.spinner("Calculating pricing… this may take a while"):
                result = None
                start_time = time.time()
                while True:
                    if time.time() - start_time > 60:  # 1-minute max wait
                        result = {
                            "success": False,
                            "message": "Job timed out waiting for backend.",
                        }
                        break

                    status_resp = httpx.get(f"{BACKEND_STATUS_URL}/{job_id}", timeout=10.0)
                    status_resp.raise_for_status()
                    status_data = status_resp.json()

                    if status_data.get("status") == "completed":
                        result = status_data.get("result")
                        break
                    elif status_data.get("status") == "failed":
                        result = {"success": False, "message": "Backend job failed."}
                        break

                    time.sleep(2)

            # Step 3: Format and display result
            reply = format_pricing_response(result)

        except Exception as exc:
            reply = f"⚠️ Request failed: {exc}"

        placeholder.markdown(reply)
        st.session_state.messages.append({"role": "assistant", "content": reply})
