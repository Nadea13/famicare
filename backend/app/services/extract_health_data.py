"""
extract_health_data.py
──────────────────────
AI-powered Medical OCR service using Google Gemini 1.5 Flash.
Extracts structured health data from photos of Thai hospital NCD notebooks
and medicine bag stickers.
"""

import json
import logging

from google import genai
from google.genai import types

from app.dependencies import get_settings
from app.schemas.health_log_schema import HealthLogAIExtract
from app.schemas.medication_schema import MedicationAIExtract, MedicationBatchAIExtract

logger = logging.getLogger(__name__)
settings = get_settings()

# ── Initialize Gemini Client ────────────────────────────────
MODEL_NAME = "gemini-1.5-flash"


def get_genai_client() -> genai.Client | None:
    """Returns a GenAI client if an API key is provided, else None."""
    if not settings.GOOGLE_API_KEY or settings.GOOGLE_API_KEY.startswith("your_"):
        return None
    return genai.Client(api_key=settings.GOOGLE_API_KEY)


# ─────────────────────────────────────────────────────────────
# System Prompts
# ─────────────────────────────────────────────────────────────

HEALTH_LOG_SYSTEM_PROMPT = """คุณคือ Expert Medical OCR AI ที่เชี่ยวชาญในการอ่านสมุดบันทึกสุขภาพ (สมุด NCD / สมุดประจำตัวผู้ป่วย) ของโรงพยาบาลส่งเสริมสุขภาพตำบล (รพ.สต.) และโรงพยาบาลชุมชนในประเทศไทย

## หน้าที่ของคุณ:
1. อ่านข้อมูลจากรูปถ่ายสมุดสุขภาพที่เขียนด้วยลายมือ
2. แยกข้อมูลสุขภาพออกมาเป็นโครงสร้าง JSON ที่กำหนด
3. แปลงวันที่จากปี พ.ศ. เป็น ค.ศ. (ลบ 543) และใช้รูปแบบ ISO 8601 (YYYY-MM-DD)

## กฎการอ่านข้อมูล:
- **วันที่**: มักเขียนเป็น "วัน/เดือน/ปี พ.ศ." เช่น "15/3/68" หมายถึง 15 มีนาคม 2568 = 2025-03-15
- **น้ำหนัก**: หน่วยเป็น kg มักเขียนในช่อง "Wt" หรือ "BW"
- **ชีพจร**: หน่วยเป็น bpm มักเขียนในช่อง "P" หรือ "Pulse"
- **ความดันโลหิต**: มักเขียนเป็น "sys/dia" เช่น "130/85" — ถ้ามี 2 ครั้ง ให้แยกเป็น bp_1 และ bp_2
  - ครั้งที่ 1 (bp_1): มักเขียนในช่อง "BP1" หรือบรรทัดแรก
  - ครั้งที่ 2 (bp_2): มักเขียนในช่อง "BP2" หรือบรรทัดที่สอง
- **อาการ (symptoms)**: อ่านจากช่อง "อาการ", "S:" หรือ "CC"
- **การรักษา (treatment_raw)**: คัดลอกข้อความดิบจากช่อง "การรักษา", "Rx:", "Treatment"
- **ยาที่สั่ง (treatment_meds)**: แยกรายการยาเป็น list พร้อมชื่อยา, ขนาดยา, วิธีใช้
- **นัดครั้งถัดไป (next_appointment)**: อ่านจากช่อง "นัด", "F/U" แปลงเป็น ISO 8601

## ข้อควรระวัง:
- ถ้าอ่านไม่ออกหรือไม่แน่ใจ ให้ใส่ null แทนการเดา
- ลายมือแพทย์/พยาบาลอาจอ่านยาก ให้พยายามอ่านอย่างดีที่สุด
- ข้อมูลบางช่องอาจว่างเปล่า ให้ใส่ null ได้
- ชื่อยาอาจเป็นชื่อสามัญหรือชื่อการค้า ให้ใส่ตามที่อ่านได้"""

MEDICATION_SYSTEM_PROMPT = """คุณคือ Expert Medical OCR AI ที่เชี่ยวชาญในการอ่านสติกเกอร์ซองยาจากโรงพยาบาลในประเทศไทย

## หน้าที่ของคุณ:
1. อ่านข้อมูลจากรูปถ่ายซองยา/สติกเกอร์ยาที่ติดบนซองยา
2. แยกข้อมูลยาแต่ละตัวออกมาเป็นโครงสร้าง JSON ที่กำหนด
3. ระบุข้อบ่งใช้ (indication) และคำเตือน (warning) ของยาแต่ละตัว

## กฎการอ่านข้อมูล:
- **ชื่อยา (medicine_name)**: อ่านทั้งชื่อสามัญและชื่อการค้า ใส่ตามที่เห็นบนสติกเกอร์
- **ขนาดยา (dosage)**: เช่น "500mg", "10mg", "5ml"
- **รหัสวิธีใช้ (instruction_code)**:
  - "pc" = หลังอาหาร (post cibum)
  - "ac" = ก่อนอาหาร (ante cibum)
  - "hs" = ก่อนนอน (hora somni)
  - "prn" = เมื่อจำเป็น (pro re nata)
  - "stat" = ทันที
  - "od" = วันละ 1 ครั้ง
  - "bid" = วันละ 2 ครั้ง
  - "tid" = วันละ 3 ครั้ง
  - "qid" = วันละ 4 ครั้ง
- **วิธีใช้ภาษาไทย (instruction_thai)**: เช่น "รับประทานครั้งละ 1 เม็ด หลังอาหาร 3 เวลา"
- **ข้อบ่งใช้ (indication)**: ระบุว่ายาตัวนี้ใช้รักษาอะไร เช่น:
  - Metformin → "ควบคุมระดับน้ำตาลในเลือด (เบาหวาน)"
  - Amlodipine → "ลดความดันโลหิตสูง"
  - Simvastatin → "ลดระดับไขมันในเลือด"
  - Aspirin → "ป้องกันการเกิดลิ่มเลือด"
- **คำเตือน (warning)**: ระบุผลข้างเคียงหรือข้อควรระวัง เช่น:
  - "ห้ามรับประทานพร้อมแอลกอฮอล์"
  - "อาจทำให้ง่วงนอน ห้ามขับรถ"
  - "รับประทานพร้อมอาหารเพื่อลดอาการระคายกระเพาะ"
- **จำนวนยา (current_quantity)**: จำนวนยาในซอง
- **หน่วย (unit)**: เช่น "เม็ด", "แคปซูล", "ซอง", "ml"

## ข้อควรระวัง:
- ถ้ารูปมียาหลายซอง/หลายตัว ให้แยกข้อมูลเป็น list
- ถ้าอ่านไม่ออก ให้ใส่ null
- ข้อบ่งใช้และคำเตือนให้ใช้ความรู้ทางเภสัชกรรมประกอบการอ่าน"""


# ─────────────────────────────────────────────────────────────
# Extraction Functions
# ─────────────────────────────────────────────────────────────

async def extract_health_log(image_bytes: bytes) -> HealthLogAIExtract:
    """
    Extract structured health data from a photo of a Thai NCD notebook page.

    Uses Gemini 1.5 Flash with response_schema to guarantee structured JSON output
    matching the HealthLogAIExtract Pydantic model.

    Args:
        image_bytes: Raw bytes of the notebook photo.

    Returns:
        HealthLogAIExtract with extracted measurements and clinical notes.
    """
    logger.info("Starting health log extraction with Gemini AI...")

    # ── Mock mode (when no API key is configured) ────────────
    if not settings.GOOGLE_API_KEY or settings.GOOGLE_API_KEY.startswith("your_"):
        logger.warning("GOOGLE_API_KEY not configured. Returning mock health log data.")
        return HealthLogAIExtract(
            measured_at="2025-03-15",
            weight=65.5,
            pulse=72,
            bp_1_sys=138,
            bp_1_dia=88,
            bp_2_sys=132,
            bp_2_dia=84,
            symptoms="ไม่มีอาการผิดปกติ",
            treatment_raw="Metformin 500mg 1x3 pc, Amlodipine 5mg 1x1 pc เช้า",
            treatment_meds=[
                {
                    "medicine_name": "Metformin 500mg",
                    "dosage": "1x3",
                    "instruction": "หลังอาหาร 3 เวลา",
                },
                {
                    "medicine_name": "Amlodipine 5mg",
                    "dosage": "1x1",
                    "instruction": "หลังอาหารเช้า",
                },
            ],
            next_appointment="2025-06-15",
        )

    # ── Production mode — call Gemini AI ─────────────────────
    client = get_genai_client()
    if not client:
        logger.warning("Google AI client could not be initialized. Using mock mode.")
        # Re-using the same mock logic if client is None
        return HealthLogAIExtract(
            measured_at="2025-03-15",
            weight=65.5,
            pulse=72,
            bp_1_sys=138,
            bp_1_dia=88,
            bp_2_sys=132,
            bp_2_dia=84,
            symptoms="ไม่มีอาการผิดปกติ",
            treatment_raw="Metformin 500mg 1x3 pc, Amlodipine 5mg 1x1 pc เช้า",
            treatment_meds=[
                {
                    "medicine_name": "Metformin 500mg",
                    "dosage": "1x3",
                    "instruction": "หลังอาหาร 3 เวลา",
                },
                {
                    "medicine_name": "Amlodipine 5mg",
                    "dosage": "1x1",
                    "instruction": "หลังอาหารเช้า",
                },
            ],
            next_appointment="2025-06-15",
        )

    response = client.models.generate_content(
        model=MODEL_NAME,
        contents=[
            types.Part.from_bytes(data=image_bytes, mime_type="image/jpeg"),
            "กรุณาอ่านข้อมูลสุขภาพจากรูปสมุด NCD นี้ และแยกข้อมูลออกมาตาม JSON schema ที่กำหนด",
        ],
        config=types.GenerateContentConfig(
            system_instruction=HEALTH_LOG_SYSTEM_PROMPT,
            response_mime_type="application/json",
            response_schema=HealthLogAIExtract,
            temperature=0.1,  # Low temperature for accuracy
        ),
    )


    # Parse the structured response
    result = HealthLogAIExtract.model_validate_json(response.text)
    logger.info(f"Health log extracted: measured_at={result.measured_at}")
    return result


async def extract_medications(image_bytes: bytes) -> list[MedicationAIExtract]:
    """
    Extract structured medication data from a photo of medicine bag stickers.

    Uses Gemini 1.5 Flash with response_schema to guarantee structured JSON output
    matching the MedicationBatchAIExtract Pydantic model.

    Args:
        image_bytes: Raw bytes of the medicine bag sticker photo.

    Returns:
        List of MedicationAIExtract with extracted medication details.
    """
    logger.info("Starting medication extraction with Gemini AI...")

    # ── Mock mode (when no API key is configured) ────────────
    if not settings.GOOGLE_API_KEY or settings.GOOGLE_API_KEY.startswith("your_"):
        logger.warning("GOOGLE_API_KEY not configured. Returning mock medication data.")
        return [
            MedicationAIExtract(
                medicine_name="Metformin 500mg",
                dosage="500mg",
                instruction_code="pc",
                instruction_thai="รับประทานครั้งละ 1 เม็ด หลังอาหาร 3 เวลา",
                indication="ควบคุมระดับน้ำตาลในเลือด (เบาหวาน)",
                warning="รับประทานพร้อมอาหารเพื่อลดอาการระคายกระเพาะ",
                current_quantity=90,
                unit="เม็ด",
            ),
            MedicationAIExtract(
                medicine_name="Amlodipine 5mg",
                dosage="5mg",
                instruction_code="pc",
                instruction_thai="รับประทานครั้งละ 1 เม็ด หลังอาหารเช้า",
                indication="ลดความดันโลหิตสูง",
                warning="อาจทำให้เท้าบวม หากมีอาการให้แจ้งแพทย์",
                current_quantity=30,
                unit="เม็ด",
            ),
        ]

    # ── Production mode — call Gemini AI ─────────────────────
    client = get_genai_client()
    if not client:
        logger.warning("Google AI client could not be initialized. Using mock mode.")
        return [
            MedicationAIExtract(
                medicine_name="Metformin 500mg",
                dosage="500mg",
                instruction_code="pc",
                instruction_thai="รับประทานครั้งละ 1 เม็ด หลังอาหาร 3 เวลา",
                indication="ควบคุมระดับน้ำตาลในเลือด (เบาหวาน)",
                warning="รับประทานพร้อมอาหารเพื่อลดอาการระคายกระเพาะ",
                current_quantity=90,
                unit="เม็ด",
            ),
            MedicationAIExtract(
                medicine_name="Amlodipine 5mg",
                dosage="5mg",
                instruction_code="pc",
                instruction_thai="รับประทานครั้งละ 1 เม็ด หลังอาหารเช้า",
                indication="ลดความดันโลหิตสูง",
                warning="อาจทำให้เท้าบวม หากมีอาการให้แจ้งแพทย์",
                current_quantity=30,
                unit="เม็ด",
            ),
        ]

    response = client.models.generate_content(
        model=MODEL_NAME,
        contents=[
            types.Part.from_bytes(data=image_bytes, mime_type="image/jpeg"),
            "กรุณาอ่านข้อมูลยาจากรูปสติกเกอร์ซองยานี้ และแยกข้อมูลออกมาตาม JSON schema ที่กำหนด "
            "โปรดระบุข้อบ่งใช้ (indication) และคำเตือน (warning) ของยาแต่ละตัวด้วย",
        ],
        config=types.GenerateContentConfig(
            system_instruction=MEDICATION_SYSTEM_PROMPT,
            response_mime_type="application/json",
            response_schema=MedicationBatchAIExtract,
            temperature=0.1,
        ),
    )


    # Parse the structured response
    result = MedicationBatchAIExtract.model_validate_json(response.text)
    logger.info(f"Extracted {len(result.medications)} medications from image")
    return result.medications
