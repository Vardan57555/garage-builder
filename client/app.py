# streamlit_client/streamlit_app.py
"""Streamlit chat UI that summarizes price-service responses."""

import os
import time
import re
from typing import Any

import httpx
import streamlit as st

# Backend URLs
BACKEND_URL = os.getenv("BACKEND_URL", "http://localhost:5003/api/v1/price/get-ai-prices")
BACKEND_STATUS_URL = os.getenv("BACKEND_STATUS_URL", "http://localhost:5003/api/v1/price/job-status")

st.set_page_config(page_title="Garage Builder Assistant", page_icon="🤖")


def format_pricing_response(payload: Any) -> str:
    """Format backend pricing string into a cleaner frontend display."""
    if not payload:
        return "⚠️ Empty response received from pricing service."

    if not isinstance(payload, dict):
        return f"⚠️ Unexpected response type: {type(payload).__name__}"

    if not payload.get("success"):
        message = payload.get("message") or payload.get("error")
        return f"⚠️ Pricing service returned an error: {message or 'Unknown error.'}"

    data = payload.get("data")
    if not data or not isinstance(data, str):
        return "⚠️ No pricing data returned."

    # Extract important info
    # 1. Quote header
    quote_match = re.search(r"(✅.*Price Quote Generated!)", data)
    quote_text = quote_match.group(1) if quote_match else "✅ Price Quote"

    # 2. Dimensions
    dim_match = re.search(r"• Dimensions:\s*(.*)", data)
    dimensions = dim_match.group(1).strip() if dim_match else "N/A"

    # 3. Roof Style
    roof_match = re.search(r"• Roof Style:\s*(.*)", data)
    roof_style = roof_match.group(1).strip() if roof_match else "N/A"

    # 4. Estimated Total Price
    price_match = re.search(r"💰 \*\*ESTIMATED TOTAL PRICE: (.*)\*\*", data)
    total_price = price_match.group(1).strip() if price_match else "N/A"

    # Build clean markdown for frontend
    lines = [
        f"### {quote_text}",
        f"📐 **Building Specifications:**",
        f"   - Dimensions: {dimensions}",
        f"   - Roof Style: {roof_style}",
        f"💰 **Estimated Total Price: {total_price}**"
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
                    json={"question": prompt, "conversation": "\n".join([msg["content"] for msg in st.session_state.messages])}
                )
                response.raise_for_status()
                job_data = response.json()
                job_id = job_data.get("job_id")
                if not job_id:
                    raise ValueError("Backend did not return a job_id.")

            # Step 2: Poll backend until result is ready
            with st.spinner("Calculating pricing… this may take a while"):
                result = None
                while True:
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
