# main.py
import os
from datetime import datetime, timezone
from dotenv import load_dotenv
from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from database import engine, Base, get_db
from models import SOSEvent, User
from schemas import SOSCreate, SOSEventOut, SignupIn, LoginIn, TokenOut, ProfileOut, ProfileUpdate, PinChange
from sms import send_alerts, sms_enabled
from utils import to_float_or_none
from auth import hash_pin, verify_pin, create_access_token, get_current_user, get_current_user_optional

load_dotenv()
Base.metadata.create_all(bind=engine)

app = FastAPI(title="SafePulse Backend", version="2.0.0")

# CORS
origins = [o.strip() for o in os.getenv("CORS_ORIGINS", "").split(",") if o.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins or ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
def health():
    return {
        "status": "ok",
        "time": datetime.now(timezone.utc).isoformat(),
        "twilio_enabled": sms_enabled(),
    }

# ---------- Auth & Users ----------

@app.post("/signup", response_model=ProfileOut)
def signup(data: SignupIn, db: Session = Depends(get_db)):
    # existing phone?
    if db.query(User).filter(User.phone == data.phone).first():
        raise HTTPException(status_code=409, detail="Phone already registered")

    user = User(
        name=data.name.strip(),
        phone=data.phone.strip(),
        pin_hash=hash_pin(data.pin),
        contacts=data.contacts,           # store as JSON list
        silent=1 if data.silent else 0,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return ProfileOut(
        id=user.id, name=user.name, phone=user.phone,
        contacts=user.contacts, silent=bool(user.silent),
        created_at=user.created_at.isoformat()
    )

@app.post("/login", response_model=TokenOut)
def login(data: LoginIn, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.phone == data.phone.strip()).first()
    if not user or not verify_pin(data.pin, user.pin_hash):
        raise HTTPException(status_code=401, detail="Invalid phone or PIN")
    token = create_access_token({"sub": user.phone})
    return TokenOut(access_token=token)

@app.get("/me", response_model=ProfileOut)
def get_profile(me: User = Depends(get_current_user)):
    return ProfileOut(
        id=me.id, name=me.name, phone=me.phone,
        contacts=me.contacts, silent=bool(me.silent),
        created_at=me.created_at.isoformat()
    )

@app.put("/me", response_model=ProfileOut)
def update_profile(update: ProfileUpdate, db: Session = Depends(get_db), me: User = Depends(get_current_user)):
    if update.name is not None:
        me.name = update.name.strip() or me.name
    if update.contacts is not None:
        if len(update.contacts) < 2:
            raise HTTPException(status_code=400, detail="Need at least two contacts")
        me.contacts = update.contacts
    if update.silent is not None:
        me.silent = 1 if update.silent else 0
    db.add(me); db.commit(); db.refresh(me)
    return ProfileOut(
        id=me.id, name=me.name, phone=me.phone,
        contacts=me.contacts, silent=bool(me.silent),
        created_at=me.created_at.isoformat()
    )

@app.put("/me/pin")
def change_pin(data: PinChange, db: Session = Depends(get_db), me: User = Depends(get_current_user)):
    if not verify_pin(data.old_pin, me.pin_hash):
        raise HTTPException(status_code=401, detail="Old PIN incorrect")
    if not (len(data.new_pin) == 4 and data.new_pin.isdigit()):
        raise HTTPException(status_code=400, detail="New PIN must be 4 digits")
    me.pin_hash = hash_pin(data.new_pin)
    db.add(me); db.commit()
    return {"ok": True, "message": "PIN updated"}

# ---------- SOS (public + user-linked) ----------

@app.post("/sos", response_model=dict)
def create_sos(payload: SOSCreate, db: Session = Depends(get_db), me: User | None = Depends(get_current_user_optional)):
    lat = to_float_or_none(payload.location.lat) if payload.location else None
    lng = to_float_or_none(payload.location.lng) if payload.location else None
    acc = to_float_or_none(payload.location.accuracy) if payload.location else None

    row = SOSEvent(
        user_id=me.id if me else None,
        name=(me.name if me else payload.name).strip(),
        phone=(me.phone if me else payload.phone).strip(),
        contacts={"list": (me.contacts if me else payload.contacts)},
        lat=lat, lng=lng, accuracy=acc,
        silent=1 if (me.silent if me else payload.silent) else 0,
    )

    db.add(row); db.commit(); db.refresh(row)

    # Optional SMS
    sms_result = None
    if sms_enabled():
        nm = me.name if me else payload.name
        ph = me.phone if me else payload.phone
        msg = f"SafePulse SOS: {nm} needs help.\nPhone: +91{ph}"
        if lat is not None and lng is not None:
            msg += f"\nLocation: {lat},{lng}"
            if acc is not None: msg += f" (±{acc} m)"
        try:
            contacts = me.contacts if me else payload.contacts
            sms_result = send_alerts(msg, contacts)
        except Exception as e:
            sms_result = {"sent": 0, "error": str(e)}

    event_out = {
        "id": row.id,
        "name": row.name,
        "phone": row.phone,
        "contacts": list(row.contacts.get("list", [])) if isinstance(row.contacts, dict) else list(row.contacts),
        "lat": float(row.lat) if row.lat is not None else None,
        "lng": float(row.lng) if row.lng is not None else None,
        "accuracy": row.accuracy,
        "silent": bool(row.silent),
        "created_at": row.created_at.isoformat(),
    }
    return {"ok": True, "event": event_out, "sms": sms_result}

@app.get("/sos", response_model=dict)
def list_sos(limit: int = 20, db: Session = Depends(get_db)):
    rows = db.query(SOSEvent).order_by(SOSEvent.id.desc()).limit(limit).all()
    events = []
    for r in rows:
        events.append({
            "id": r.id, "name": r.name, "phone": r.phone,
            "contacts": list(r.contacts.get("list", [])) if isinstance(r.contacts, dict) else list(r.contacts),
            "lat": float(r.lat) if r.lat is not None else None,
            "lng": float(r.lng) if r.lng is not None else None,
            "accuracy": r.accuracy, "silent": bool(r.silent),
            "created_at": r.created_at.isoformat(),
        })
    return {"ok": True, "events": events}

@app.get("/my/sos", response_model=dict)
def my_sos(limit: int = 50, db: Session = Depends(get_db), me: User = Depends(get_current_user)):
    rows = db.query(SOSEvent).filter(SOSEvent.user_id == me.id).order_by(SOSEvent.id.desc()).limit(limit).all()
    events = []
    for r in rows:
        events.append({
            "id": r.id, "name": r.name, "phone": r.phone,
            "contacts": list(r.contacts.get("list", [])) if isinstance(r.contacts, dict) else list(r.contacts),
            "lat": float(r.lat) if r.lat is not None else None,
            "lng": float(r.lng) if r.lng is not None else None,
            "accuracy": r.accuracy, "silent": bool(r.silent),
            "created_at": r.created_at.isoformat(),
        })
    return {"ok": True, "events": events}
