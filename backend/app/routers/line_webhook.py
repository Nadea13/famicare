"""
line_webhook.py
───────────────
LINE Messaging API webhook endpoint.
Handles incoming events from LINE, processes image messages,
and triggers AI extraction for health data with DB persistence.
"""

import hashlib
import hmac
import base64
import json
import logging

from fastapi import APIRouter, Header, HTTPException, Request, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.dependencies import get_settings
from app.database_config import get_db
from app.services.line_service import download_line_image, send_line_reply, get_line_profile
from app.services.extract_health_data import extract_health_log
from app.services.storage_service import get_storage_service
from app.services.user_service import get_or_create_line_user, get_patient_for_user, create_default_patient
from app.services.health_log_service import save_health_log

logger = logging.getLogger(__name__)
settings = get_settings()
router = APIRouter(tags=["LINE Webhook"])


def verify_signature(body: bytes, signature: str) -> bool:
    """Verify the LINE webhook signature using HMAC-SHA256."""
    if not settings.LINE_CHANNEL_SECRET or settings.LINE_CHANNEL_SECRET.startswith("your_"):
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
    db: AsyncSession = Depends(get_db),
):
    """LINE Messaging API webhook endpoint."""
    body = await request.body()

    if not verify_signature(body, x_line_signature):
        raise HTTPException(status_code=400, detail="Invalid signature")

    try:
        payload = json.loads(body)
    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="Invalid JSON body")

    events = payload.get("events", [])
    logger.info(f"Received {len(events)} event(s) from LINE")

    for event in events:
        event_type = event.get("type")
        reply_token = event.get("replyToken", "")
        user_id = event.get("source", {}).get("userId", "unknown")

        if event_type == "message":
            message = event.get("message", {})
            message_type = message.get("type")
            message_id = message.get("id")

            if message_type == "image":
                await _handle_image_message(
                    db=db,
                    message_id=message_id,
                    user_id=user_id,
                    reply_token=reply_token,
                )
            elif message_type == "text":
                text = message.get("text", "")
                await _handle_text_message(
                    text=text,
                    reply_token=reply_token,
                )

        elif event_type == "follow":
            # User added the bot as a friend -> Register them
            profile = await get_line_profile(user_id)
            await get_or_create_line_user(
                db, 
                user_id, 
                display_name=profile.get("displayName"),
                picture_url=profile.get("pictureUrl")
            )
            
            await send_line_reply(
                reply_token,
                f"🏥 สวัสดีค่ะคุณ {profile.get('displayName', '')}! ยินดีต้อนรับสู่ FamiCare\n\n"
                "ส่งรูปถ่ายสมุดสุขภาพ (สมุด NCD) หรือซองยา "
                "มาให้เราได้เลยนะคะ\n\n"
                "เริ่มต้นโดยถ่ายรูปส่งมาเลยค่ะ! 📸",
            )

    return {"status": "ok"}


async def _handle_image_message(
    db: AsyncSession,
    message_id: str,
    user_id: str,
    reply_token: str,
) -> None:
    """Process image message and save to DB."""
    try:
        # 1. Get or Create User & Patient
        profile = await get_line_profile(user_id)
        user = await get_or_create_line_user(
            db, 
            user_id, 
            display_name=profile.get("displayName"),
            picture_url=profile.get("pictureUrl")
        )
        
        patient = await get_patient_for_user(db, user.id)
        if not patient:
            patient = await create_default_patient(db, user)

        # 2. Download and Save Image
        image_bytes = await download_line_image(message_id)
        storage = get_storage_service()
        image_path = await storage.save(
            data=image_bytes,
            filename=f"line_{message_id}.jpg",
            content_type="image/jpeg",
        )

        # 3. AI Extract
        health_data = await extract_health_log(image_bytes)

        # 4. Save to Database
        await save_health_log(
            db=db,
            patient_id=patient.id,
            extracted_data=health_data,
            image_url=image_path
        )

        # 5. Reply to user
        reply = _format_health_log_reply(health_data, patient.name)
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


def _format_health_log_reply(data, patient_name: str) -> str:
    """Format extracted health data into a readable LINE message."""
    lines = [f"✅ บันทึกข้อมูลสุขภาพของ {patient_name} สำเร็จ!\n"]

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
    
    if data.next_appointment:
        lines.append(f"\n📆 นัดครั้งถัดไป: {data.next_appointment}")

    lines.append("\n🌐 ดูข้อมูลย้อนหลังได้ที่ Web Dashboard")
    return "\n".join(lines)
