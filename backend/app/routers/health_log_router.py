"""
health_log_router.py — API endpoints for health logs and medications.
"""
import uuid
from fastapi import APIRouter, HTTPException
from app.schemas import HealthLogCreate

router = APIRouter(prefix="/api", tags=["Health Data"])

MOCK_PATIENT_ID = "00000000-0000-0000-0000-000000000001"

MOCK_HEALTH_LOGS = [
    {"id": "10000000-0000-0000-0000-000000000001", "patient_id": MOCK_PATIENT_ID, "measured_at": "2025-01-15T09:00:00+07:00", "weight": 67.2, "pulse": 74, "bp_1_sys": 142, "bp_1_dia": 90, "bp_2_sys": 138, "bp_2_dia": 86, "symptoms": "ปวดหัวเล็กน้อย", "treatment_raw": "Amlodipine 5mg 1x1, Metformin 500mg 1x3", "treatment_meds": None, "next_appointment": "2025-04-15", "image_url": None, "created_at": "2025-01-15T09:30:00+07:00"},
    {"id": "10000000-0000-0000-0000-000000000002", "patient_id": MOCK_PATIENT_ID, "measured_at": "2025-02-15T09:00:00+07:00", "weight": 66.8, "pulse": 72, "bp_1_sys": 140, "bp_1_dia": 88, "bp_2_sys": 135, "bp_2_dia": 84, "symptoms": "ไม่มีอาการ", "treatment_raw": "Amlodipine 5mg, Metformin 500mg", "treatment_meds": None, "next_appointment": "2025-05-15", "image_url": None, "created_at": "2025-02-15T09:30:00+07:00"},
    {"id": "10000000-0000-0000-0000-000000000003", "patient_id": MOCK_PATIENT_ID, "measured_at": "2025-03-15T09:00:00+07:00", "weight": 66.5, "pulse": 70, "bp_1_sys": 136, "bp_1_dia": 86, "bp_2_sys": 132, "bp_2_dia": 82, "symptoms": "ไม่มีอาการ", "treatment_raw": "Amlodipine 5mg, Metformin 500mg", "treatment_meds": None, "next_appointment": "2025-06-15", "image_url": None, "created_at": "2025-03-15T09:30:00+07:00"},
    {"id": "10000000-0000-0000-0000-000000000004", "patient_id": MOCK_PATIENT_ID, "measured_at": "2025-04-15T09:00:00+07:00", "weight": 65.9, "pulse": 68, "bp_1_sys": 134, "bp_1_dia": 84, "bp_2_sys": 130, "bp_2_dia": 80, "symptoms": "สุขภาพดี", "treatment_raw": "Amlodipine 5mg, Metformin 500mg", "treatment_meds": None, "next_appointment": "2025-07-15", "image_url": None, "created_at": "2025-04-15T09:30:00+07:00"},
    {"id": "10000000-0000-0000-0000-000000000005", "patient_id": MOCK_PATIENT_ID, "measured_at": "2025-05-06T09:00:00+07:00", "weight": 65.5, "pulse": 72, "bp_1_sys": 138, "bp_1_dia": 88, "bp_2_sys": 132, "bp_2_dia": 84, "symptoms": "ไม่มีอาการ", "treatment_raw": "Amlodipine 5mg, Metformin 500mg, Simvastatin 20mg", "treatment_meds": None, "next_appointment": "2025-08-06", "image_url": None, "created_at": "2025-05-06T09:30:00+07:00"},
]

MOCK_MEDICATIONS = [
    {"id": "20000000-0000-0000-0000-000000000001", "patient_id": MOCK_PATIENT_ID, "medicine_name": "Amlodipine 5mg", "dosage": "5mg", "instruction_code": "pc", "instruction_thai": "รับประทานครั้งละ 1 เม็ด หลังอาหารเช้า", "indication": "ลดความดันโลหิตสูง", "warning": "อาจทำให้เท้าบวม", "current_quantity": 28, "unit": "เม็ด", "is_active": True, "created_at": "2025-01-15T09:30:00+07:00", "updated_at": "2025-05-06T09:30:00+07:00"},
    {"id": "20000000-0000-0000-0000-000000000002", "patient_id": MOCK_PATIENT_ID, "medicine_name": "Metformin 500mg", "dosage": "500mg", "instruction_code": "pc", "instruction_thai": "รับประทานครั้งละ 1 เม็ด หลังอาหาร 3 เวลา", "indication": "ควบคุมน้ำตาลในเลือด (เบาหวาน)", "warning": "รับประทานพร้อมอาหาร", "current_quantity": 84, "unit": "เม็ด", "is_active": True, "created_at": "2025-01-15T09:30:00+07:00", "updated_at": "2025-05-06T09:30:00+07:00"},
    {"id": "20000000-0000-0000-0000-000000000003", "patient_id": MOCK_PATIENT_ID, "medicine_name": "Simvastatin 20mg", "dosage": "20mg", "instruction_code": "hs", "instruction_thai": "รับประทานครั้งละ 1 เม็ด ก่อนนอน", "indication": "ลดระดับไขมันในเลือด", "warning": "ห้ามรับประทานร่วมกับเกรปฟรุต", "current_quantity": 30, "unit": "เม็ด", "is_active": True, "created_at": "2025-05-06T09:30:00+07:00", "updated_at": "2025-05-06T09:30:00+07:00"},
]



@router.get("/health-logs/{patient_id}")
async def get_health_logs(patient_id: str):
    """Get all health logs for a patient. MVP: returns mock data."""
    if patient_id == MOCK_PATIENT_ID or patient_id == "mock":
        return MOCK_HEALTH_LOGS
    raise HTTPException(status_code=404, detail="Patient not found")


@router.post("/health-logs", status_code=201)
async def create_health_log(data: HealthLogCreate):
    """Create a new health log. MVP: returns mock response."""
    return {"id": str(uuid.uuid4()), "status": "created", "data": data.model_dump(mode="json")}


@router.get("/patients/{patient_id}/medications")
async def get_medications(patient_id: str):
    """Get active medications. MVP: returns mock data."""
    if patient_id == MOCK_PATIENT_ID or patient_id == "mock":
        return [m for m in MOCK_MEDICATIONS if m["is_active"]]
    raise HTTPException(status_code=404, detail="Patient not found")
