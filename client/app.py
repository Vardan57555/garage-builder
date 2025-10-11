# streamlit_client/streamlit_app.py
"""Streamlit chat UI that summarizes price-service responses."""

import os
from typing import Any, Dict, List

import httpx
import streamlit as st

BACKEND_URL = os.getenv("BACKEND_URL", "http://localhost:5003/api/v1/price/get-ai-prices")
REQUEST_TIMEOUT_SECONDS = int(os.getenv("STREAMLIT_REQUEST_TIMEOUT", "180"))

st.set_page_config(page_title="Garage Builder Assistant", page_icon="🤖")

def format_pricing_response(payload: Dict[str, Any]) -> str:
    if not payload:
        return "⚠️ Empty response received from pricing service."

    if not payload.get("success"):
        message = payload.get("message") or payload.get("error")
        return f"⚠️ Pricing service returned an error: {message or 'Unknown error.'}"

    data: Dict[str, Any] | None = payload.get("data")
    if not data:
        return "⚠️ Pricing service did not include pricing data."

    manufacturer_ids: List[str] = [
        str(item.get("manufacturer_id"))
        for item in data.get("manufacturer", [])
        if item.get("manufacturer_id") is not None
    ]
    base_structure = data.get("building_structure", [])
    structure = base_structure[0] if base_structure else {}

    lines: List[str] = []
    lines.append("### 🏗️ Pricing Summary")
    lines.append(f"- **Manufacturers**: {', '.join(manufacturer_ids) if manufacturer_ids else 'Not provided'}")
    lines.append(f"- **Max Build Length**: {data.get('building_to_maxlength', 'N/A')} ft")
    if structure:
        lines.append(
            "- **Structure Range**: "
            f"width {structure.get('min_width', 'N/A')}–{structure.get('max_width', 'N/A')} ft, "
            f"height {structure.get('min_height', 'N/A')}–{structure.get('max_height', 'N/A')} ft"
        )

    # Helper to sum only relevant cost fields
    def sum_cost_fields(collection: List[Dict[str, Any]], cost_fields: List[str]) -> float:
        total = 0.0
        for item in collection:
            for field in cost_fields:
                try:
                    total += float(item.get(field, 0))
                except (ValueError, TypeError):
                    continue
        return total

    # Define which fields to sum per category
    side_fields = [
        "side_close_cost",
        "vertical_side_cost",
        "double_leg_baserail_cost",
        "half_side_close_cost",
        "half_vertical_side_cost",
        "one_fourth_side_close_cost",
        "one_fourth_vertical_side_cost",
        "three_fourth_side_close_cost",
        "three_fourth_vertical_side_cost"
    ]

    utility_fields = side_fields.copy()
    panel_fields = ["cost"]
    checkbox_fields = ["cost"]
    checkbox_qty_fields = ["cost"]
    checkbox_dropdown_fields = ["cost"]

    # Calculate sums per category
    side_cost = sum_cost_fields(data.get("side", []), side_fields)
    utility_cost = sum_cost_fields(data.get("utility_side", []), utility_fields)
    panel_cost = sum_cost_fields(data.get("panel", []), panel_fields)
    checkbox_cost = sum_cost_fields(data.get("checkbox", []), checkbox_fields)
    checkbox_qty_cost = sum_cost_fields(data.get("checkbox_quantity", []), checkbox_qty_fields)
    checkbox_dropdown_cost = sum_cost_fields(data.get("checkbox_quantity_dropdown", []), checkbox_dropdown_fields)

    # Total price across all collections
    total_price = (
        side_cost +
        utility_cost +
        panel_cost +
        checkbox_cost +
        checkbox_qty_cost +
        checkbox_dropdown_cost
    )

    # Display cost details
    lines.append(f"- **Side Total**: ${side_cost:,.2f}")
    lines.append(f"- **Utility Side Total**: ${utility_cost:,.2f}")
    if panel_cost:
        lines.append(f"- **Panel Total**: ${panel_cost:,.2f}")
    if checkbox_cost or checkbox_qty_cost or checkbox_dropdown_cost:
        lines.append(
            f"- **Add-ons Total**: ${checkbox_cost + checkbox_qty_cost + checkbox_dropdown_cost:,.2f}"
        )

    lines.append(f"\n### 💰 **Total Price: ${total_price:,.2f}**")

    if total_price == 0:
        lines.append("_No detailed cost items were returned. Try refining the request parameters._")

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
        with st.spinner("Calculating pricing… this may take a minute or two"):
            try:
                timeout = httpx.Timeout(REQUEST_TIMEOUT_SECONDS)
                with httpx.Client(timeout=timeout) as client:
                    resp = client.post(BACKEND_URL, json={"question": prompt})
                    resp.raise_for_status()
                    response_json = resp.json()
                    reply = format_pricing_response(response_json)
            except Exception as exc:
                reply = f"⚠️ Request failed: {exc}"

        placeholder.markdown(reply)

    st.session_state.messages.append({"role": "assistant", "content": reply})
