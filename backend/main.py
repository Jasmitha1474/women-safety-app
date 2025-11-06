# backend/main.py
from fastapi import FastAPI, HTTPException, Body
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, field_validator
from typing import List, Optional
from datetime import datetime, timedelta
from jose import jwt
from pymongo import MongoClient, errors
from dotenv import load_dotenv
import os, hashlib, requests

# -------------------- Load Env --------------------
load_dotenv()
MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017")
DB_NAME = os.getenv("MONGO_DB", "safepulse")
SECRET_KEY = os.getenv("SECRET_KEY", "supersecret")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24  # 24 hours

# ⚙️ Add this to your .env file:
# FAST2SMS_API_KEY=your_fast2sms_key_here
FAST2SMS_API_KEY = os.getenv("FAST2SMS_API_KEY")

# -------------------- DB CONNECTION --------------------
try:
    client = MongoClient(MONGO_URI, serverSelectionTimeoutMS=5000)
    client.server_info()  # Check connection
    db = client[DB_NAME]
    users = db["users"]
    users.create_index("phone", unique=True)
    print(f"✅ Connected to MongoDB: {DB_NAME}")
except errors.ServerSelectionTimeoutError:
    raise Exception("❌ Could not connect to MongoDB. Please start MongoDB service.")

# -------------------- FASTAPI SETUP --------------------
app = FastAPI(title="SafePulse API", version="2.5")

origins = [
    "http://127.0.0.1:5173",
    "http://localhost:5173",
    "http://localhost:3000",
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# -------------------- HELPERS --------------------
def hash_pin(pin: str) -> str:
    pin = str(pin).strip()
    if not pin.isdigit() or not (4 <= len(pin) <= 12):
        raise HTTPException(status_code=400, detail="PIN must be 4–12 digits.")
    return hashlib.sha256(pin.encode()).hexdigest()

def verify_pin(plain_pin: str, hashed_pin: str) -> bool:
    return hashlib.sha256(plain_pin.strip().encode()).hexdigest() == hashed_pin

def create_access_token(sub: str) -> str:
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    payload = {"sub": sub, "exp": expire}
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)

# ✅ Updated Fast2SMS helper (v3 API)
def send_sms_alert(numbers: List[str], lat: float, lng: float):
    """Send SMS alerts with live Google Maps link using Fast2SMS v3 API."""
    if not FAST2SMS_API_KEY:
        print("⚠️ FAST2SMS_API_KEY missing in .env file")
        return {"error": "missing_api_key"}

    # ✅ Clean contact numbers (remove +91 / 91 / leading 0)
    clean_numbers = [n.replace("+91", "").replace("91", "").lstrip("0") for n in numbers]

    msg = f"🚨 SOS Alert from SafePulse!\nLocation: https://maps.google.com/?q={lat},{lng}"
    url = "https://www.fast2sms.com/dev/api"

    payload = {
        "route": "v3",
        "sender_id": "TXTIND",
        "message": msg,
        "language": "english",
        "flash": "0",
        "numbers": ",".join(clean_numbers),
    }

    headers = {
        "authorization": FAST2SMS_API_KEY,
        "Content-Type": "application/json",
    }

    try:
        response = requests.post(url, json=payload, headers=headers)
        print("📩 Fast2SMS Response:", response.json())
        return response.json()
    except Exception as e:
        print("❌ SMS send failed:", e)
        return {"error": str(e)}

# -------------------- SCHEMAS --------------------
class SignupIn(BaseModel):
    name: str
    phone: str
    pin: str
    emergency_contacts: List[str] = Field(default_factory=list)
    contacts: Optional[List[str]] = Field(default_factory=list)
    silent: Optional[bool] = False

    @field_validator("emergency_contacts")
    @classmethod
    def validate_contacts(cls, v):
        v = [c.strip() for c in v if c.strip()]
        if len(v) < 2:
            raise ValueError("At least two emergency contacts are required.")
        return v

class LoginIn(BaseModel):
    phone: str
    pin: str

# -------------------- ROUTES --------------------
@app.get("/health")
def health():
    return {"status": "ok", "database": DB_NAME}

# ---------- SIGNUP ----------
@app.post("/signup", status_code=201)
def signup(payload: SignupIn):
    """Create or update a user (with hashed PIN)."""
    try:
        phone = payload.phone.strip()
        name = payload.name.strip()
        clean_contacts = [c.strip() for c in payload.emergency_contacts if c.strip()]
        new_pin_hash = hash_pin(payload.pin)

        update_fields = {
            "name": name,
            "phone": phone,
            "pin_hash": new_pin_hash,
            "emergency_contacts": clean_contacts,
            "contacts": payload.contacts or clean_contacts,
            "silent": bool(payload.silent),
            "updated_at": datetime.utcnow(),
        }

        existing = users.find_one({"phone": phone})
        if existing:
            users.update_one({"phone": phone}, {"$set": update_fields})
            action = "updated"
        else:
            users.insert_one({**update_fields, "created_at": datetime.utcnow()})
            action = "created"

        token = create_access_token(sub=phone)
        return {
            "status": action,
            "access_token": token,
            "token_type": "bearer",
        }

    except Exception as e:
        print("❌ Signup Error:", e)
        raise HTTPException(status_code=500, detail=str(e))

# ---------- LOGIN ----------
@app.post("/login")
def login(payload: LoginIn):
    """Login with phone and 4-digit PIN."""
    try:
        phone = payload.phone.strip()
        user = users.find_one({"phone": phone})
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        if not verify_pin(payload.pin, user.get("pin_hash", "")):
            raise HTTPException(status_code=401, detail="Invalid PIN")

        token = create_access_token(sub=phone)
        return {
            "access_token": token,
            "token_type": "bearer",
        }

    except HTTPException:
        raise
    except Exception as e:
        print("❌ Login Error:", e)
        raise HTTPException(status_code=500, detail="Internal server error")

# ---------- PROFILE ----------
@app.get("/profile/{phone}")
def get_profile(phone: str):
    """Fetch user profile (excluding pin hash)."""
    user = users.find_one({"phone": phone.strip()}, {"_id": 0, "pin_hash": 0})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

# ---------- USERS DEBUG ----------
@app.get("/users_debug")
def users_debug():
    """List recent users for debugging."""
    all_users = list(
        users.find({}, {"_id": 0})
        .sort([("updated_at", -1), ("created_at", -1)])
        .limit(10)
    )
    return {"count": len(all_users), "users": all_users}

# ---------- SOS ALERT ----------
@app.post("/sos")
def sos_alert(data: dict = Body(...)):
    """
    Send SMS alert to emergency contacts.
    Expected JSON body:
    {
      "contacts": ["9876543210", "9123456789"],
      "lat": 12.9716,
      "lng": 77.5946
    }
    """
    try:
        contacts = data.get("contacts", [])
        lat = data.get("lat")
        lng = data.get("lng")

        if not contacts or lat is None or lng is None:
            raise HTTPException(status_code=400, detail="Missing data")

        result = send_sms_alert(contacts, lat, lng)
        return {"status": "sent", "result": result}

    except Exception as e:
        print("❌ SOS Error:", e)
        raise HTTPException(status_code=500, detail=str(e))

# -------------------- RUN --------------------
# Run using: uvicorn main:app --reload --port 8000
