"""
line_webhook.py
───────────────
LINE Messaging API webhook endpoint.
Handles incoming events from LINE, processes image messages,
and triggers AI extraction for health data.
"""

import hashlib
import hmac
import base64
import json
import logging

from fastapi import APIRouter, Header, HTTPException, Request

from app.dependencies import get_settings
from app.services.line_service import download_line_image, send_line_reply
from app.services.extract_health_data import extract_health_log, extract_medications
from app.services.storage_service import get_storage_service

logger = logging.getLogger(__name__)
settings = get_settings()
router = APIRouter(tags=["LINE Webhook"])


def verify_signature(body: bytes, signature: str) -> bool:
    """
    Verify the LINE webhook signature using HMAC-SHA256.

    Args:
        body: Raw request body bytes.
        signature: The x-line-signature header value.

    Returns:
        True if signature is valid.
    """
    if not settings.LINE_CHANNEL_SECRET or settings.LINE_CHANNEL_SECRET.startswith("your_"):
        logger.warning("LINE_CHANNEL_SECRET not configured. Skipping signature verification.")
        return True

    hash_value = hmac.new(
        settings.LINE_CHANNEL_SECRET.encode("utf-8"),
        body,
        hashlib.sha256,
    ).digest()
    expected_signature = base64.b64encode(hash_value).decode("utf-8")
    return hmac.compare_digest(expected_signature, signature)


@router.post("/webhook")
async def handle_webhook(
    request: Request,
    x_line_signature: str = Header(default=""),
):
    """
    LINE Messaging API webhook endpoint.

    Receives events from LINE platform, validates signature,
    and processes image messages through AI extraction.

    Flow:
    1. Validate x-line-signature header.
    2. Parse event body.
    3. For image messages: download → save → AI extract → reply with summary.
    4. For text messages: reply with usage instructions.
    """
    # ── 1. Read and validate the raw body ────────────────────
    body = await request.body()

    if not verify_signature(body, x_line_signature):
        raise HTTPException(status_code=400, detail="Invalid signature")

    # ── 2. Parse the event payload ───────────────────────────
    try:
        payload = json.loads(body)
    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="Invalid JSON body")

    events = payload.get("events", [])
    logger.info(f"Received {len(events)} event(s) from LINE")

    # ── 3. Process each event ────────────────────────────────
    for event in events:
        event_type = event.get("type")
        reply_token = event.get("replyToken", "")

        if event_type == "message":
            message = event.get("message", {})
            message_type = message.get("type")
            message_id = message.get("id")
            user_id = event.get("source", {}).get("userId", "unknown")

            logger.info(
                f"Message event: type={message_type}, "
                f"id={message_id}, user={user_id}"
            )

            if message_type == "image":
                await _handle_image_message(
                    message_id=message_id,
                    user_id=user_id,
                    reply_token=reply_token,
                )
            elif message_type == "text":
                text = message.get("text", "")
                await _handle_text_message(
                    text=text,
                    user_id=user_id,
                    reply_token=reply_token,
                )
            else:
                logger.info(f"Ignoring message type: {message_type}")

        elif event_type == "follow":
            # User added the bot as a friend
            await send_line_reply(
                reply_token,
                "🏥 สวัสดีค่ะ! ยินดีต้อนรับสู่ FamiCare\n\n"
                "ส่งรูปถ่ายสมุดสุขภาพ (สมุด NCD) หรือซองยา "
                "มาให้เราได้เลยนะคะ\n\n"
                "📋 สมุดสุขภาพ → บันทึกค่าความดัน, น้ำหนัก\n"
                "💊 ซองยา → บันทึกรายการยาที่ได้รับ\n\n"
                "เริ่มต้นโดยถ่ายรูปส่งมาเลยค่ะ! 📸",
            )

    return {"status": "ok"}


async def _handle_image_message(
    message_id: str,
    user_id: str,
    reply_token: str,
) -> None:
    """
    Process an image message:
    1. Download the image from LINE.
    2. Save to local storage.
    3. Run AI extraction for health data.
    4. Reply with a formatted summary.
    """
    try:
        # Download image from LINE
        image_bytes = await download_line_image(message_id)
        logger.info(f"Downloaded image: {len(image_bytes)} bytes")

        # Save to storage
        storage = get_storage_service()
        image_path = await storage.save(
            data=image_bytes,
            filename=f"line_{message_id}.jpg",
            content_type="image/jpeg",
        )
        logger.info(f"Image saved at: {image_path}")

        # Extract health data using AI
        health_data = await extract_health_log(image_bytes)

        # Format reply message
        reply = _format_health_log_reply(health_data)
        await send_line_reply(reply_token, reply)

    except Exception as e:
        logger.error(f"Error processing image: {e}", exc_info=True)
        await send_line_reply(
            reply_token,
            "❌ ขออภัยค่ะ เกิดข้อผิดพลาดในการอ่านรูปภาพ\n"
            "กรุณาถ่ายรูปใหม่ให้ชัดเจนและส่งมาอีกครั้งนะคะ",
        )


async def _handle_text_message(
    text: str,
    user_id: str,
    reply_token: str,
) -> None:
    """Handle text messages with usage instructions."""
    if text.lower() in ["help", "ช่วยเหลือ", "วิธีใช้"]:
        await send_line_reply(
            reply_token,
            "📖 วิธีใช้งาน FamiCare\n\n"
            "1️⃣ ถ่ายรูปสมุดสุขภาพ (NCD) → ระบบจะอ่านค่าสุขภาพให้\n"
            "2️⃣ ถ่ายรูปซองยา → ระบบจะบันทึกรายการยา\n"
            "3️⃣ ดูข้อมูลย้อนหลังได้ที่ Dashboard\n\n"
            "💡 เคล็ดลับ: ถ่ายรูปให้ชัด ไม่เบลอ จะอ่านได้แม่นยำขึ้นค่ะ",
        )
    else:
        await send_line_reply(
            reply_token,
            "📸 ส่งรูปถ่ายสมุดสุขภาพหรือซองยามาให้เราได้เลยค่ะ\n"
            "พิมพ์ 'ช่วยเหลือ' เพื่อดูวิธีใช้งาน",
        )


def _format_health_log_reply(data) -> str:
    """Format extracted health data into a readable LINE message."""
    lines = ["✅ อ่านข้อมูลสุขภาพสำเร็จ!\n"]

    if data.measured_at:
        lines.append(f"📅 วันที่ตรวจ: {data.measured_at}")
    if data.weight:
        lines.append(f"⚖️ น้ำหนัก: {data.weight} kg")
    if data.pulse:
        lines.append(f"💓 ชีพจร: {data.pulse} bpm")
    if data.bp_1_sys and data.bp_1_dia:
        lines.append(f"🩺 ความดัน (ครั้งที่ 1): {data.bp_1_sys}/{data.bp_1_dia} mmHg")
    if data.bp_2_sys and data.bp_2_dia:
        lines.append(f"🩺 ความดัน (ครั้งที่ 2): {data.bp_2_sys}/{data.bp_2_dia} mmHg")
    if data.symptoms:
        lines.append(f"🤒 อาการ: {data.symptoms}")
    if data.treatment_meds:
        lines.append("\n💊 ยาที่ได้รับ:")
        for med in data.treatment_meds:
            name = med.get("medicine_name", med.medicine_name if hasattr(med, "medicine_name") else "?")
            lines.append(f"  • {name}")
    if data.next_appointment:
        lines.append(f"\n📆 นัดครั้งถัดไป: {data.next_appointment}")

    lines.append("\n🌐 ดูข้อมูลเพิ่มเติมได้ที่ Dashboard")
    return "\n".join(lines)
