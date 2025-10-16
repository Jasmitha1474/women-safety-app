# backend/main.py
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, field_validator
from typing import List
from datetime import datetime, timedelta
from jose import jwt
from pymongo import MongoClient, errors
from dotenv import load_dotenv
import os, hashlib

# -------------------- Load Env --------------------
load_dotenv()
MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017")
DB_NAME = os.getenv("MONGO_DB", "safepulse")
SECRET_KEY = os.getenv("SECRET_KEY", "supersecret")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24

# -------------------- DB --------------------
client = MongoClient(MONGO_URI)
db = client[DB_NAME]
users = db["users"]
try:
    users.create_index("phone", unique=True)
except Exception:
    pass
print(f"✅ Connected to MongoDB database: {DB_NAME}")

# -------------------- FastAPI --------------------
app = FastAPI(title="SafePulse API")

origins = ["http://127.0.0.1:5173", "http://localhost:5173"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# -------------------- Helper Functions --------------------
def hash_pin(pin: str) -> str:
    """Use SHA256 instead of bcrypt to avoid version issues."""
    clean = str(pin).strip()
    if not clean.isdigit() or not (4 <= len(clean) <= 12):
        raise HTTPException(status_code=400, detail="PIN must be 4–12 digits.")
    hashed = hashlib.sha256(clean.encode()).hexdigest()
    return hashed

def verify_pin(plain_pin: str, hashed_pin: str) -> bool:
    return hashlib.sha256(plain_pin.strip().encode()).hexdigest() == hashed_pin

def create_access_token(sub: str) -> str:
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode = {"sub": sub, "exp": expire}
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

# -------------------- Schemas --------------------
class SignupIn(BaseModel):
    name: str
    phone: str
    pin: str
    emergency_contacts: List[str] = Field(min_items=2)

    @field_validator("emergency_contacts")
    @classmethod
    def at_least_two(cls, v):
        if len(v) < 2:
            raise ValueError("At least two emergency contacts required")
        return v

class LoginIn(BaseModel):
    phone: str
    pin: str

# -------------------- Routes --------------------
@app.get("/health")
def health():
    return {"status": "ok", "db": DB_NAME}

@app.post("/signup", status_code=201)
def signup(payload: SignupIn):
    try:
        hashed = hash_pin(payload.pin)
        doc = {
            "name": payload.name.strip(),
            "phone": payload.phone.strip(),
            "pin_hash": hashed,
            "emergency_contacts": [c.strip() for c in payload.emergency_contacts],
        }
        #Find user
        existing = users.find_one({"phone": doc["phone"]})
        if existing:
            #Update user
            users.update_one(
                {"phone": doc["phone"]},
                {"$set": {**doc, "updated_at": datetime.utcnow()}},
            )
            action = "updated"
        else:
            #Insert new user
            users.insert_one({**doc, "created_at": datetime.utcnow()})
            action = "created"

        token = create_access_token(sub=doc["phone"])
        return {"access_token": token, "token_type": "bearer", "status": action}
    except Exception as e:
        print("❌ Signup error:", e)
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/login")
def login(payload: LoginIn):
    try:
        user = users.find_one({"phone": payload.phone.strip()})
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        if not verify_pin(payload.pin, user.get("pin_hash", "")):
            raise HTTPException(status_code=401, detail="Invalid PIN")
        token = create_access_token(sub=payload.phone.strip())
        return {"access_token": token, "token_type": "bearer"}
    except HTTPException:
        raise
    except Exception as e:
        print("❌ Login error:", e)
        raise HTTPException(status_code=500, detail="Internal server error")

#List all users
@app.get("/users_debug")
def users_debug():
    items = list(
        users.find({}, {"_id": 0, "name": 1, "phone": 1, "emergency_contacts": 1})
        .sort([("created_at", -1), ("updated_at", -1)])
        .limit(10)
    )
    return {"count": len(items), "users": items}

# -------------------- Run --------------------
# uvicorn main:app --reload --port 8000
