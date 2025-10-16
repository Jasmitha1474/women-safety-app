# schemas.py
from pydantic import BaseModel, Field, field_validator
from typing import List, Optional
from datetime import datetime

PHONE_HINT = "Indian mobile: 10 digits starting with 6–9"


# ---------- Location Schema ----------
class Location(BaseModel):
    lat: Optional[float] = None
    lng: Optional[float] = None
    accuracy: Optional[float] = None


# ---------- SOS ----------
class SOSCreate(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    phone: str = Field(description=PHONE_HINT)
    contacts: List[str] = Field(min_length=2)
    location: Optional[Location] = None
    silent: bool = False

    @field_validator("phone")
    @classmethod
    def _valid_phone(cls, v: str) -> str:
        v = (v or "").strip()
        if not (len(v) == 10 and v[0] in "6789" and v.isdigit()):
            raise ValueError(PHONE_HINT)
        return v

    @field_validator("contacts")
    @classmethod
    def _valid_contacts(cls, v: List[str]) -> List[str]:
        good = [s.strip() for s in v if len(s.strip()) == 10 and s[0] in "6789" and s.isdigit()]
        if len(good) < 2:
            raise ValueError("Need at least two valid contacts")
        return good


class SOSEventOut(BaseModel):
    id: str
    name: str
    phone: str
    contacts: List[str]
    lat: Optional[float] = None
    lng: Optional[float] = None
    accuracy: Optional[float] = None
    silent: bool
    created_at: datetime


# ---------- Auth / Users ----------
class SignupIn(BaseModel):
    name: str
    phone: str
    pin: str
    contacts: List[str]
    silent: bool = False

    @field_validator("phone")
    @classmethod
    def _valid_phone(cls, v: str) -> str:
        v = (v or "").strip()
        if not (len(v) == 10 and v[0] in "6789" and v.isdigit()):
            raise ValueError(PHONE_HINT)
        return v

    @field_validator("pin")
    @classmethod
    def _valid_pin(cls, v: str) -> str:
        if not (len(v) == 4 and v.isdigit()):
            raise ValueError("PIN must be exactly 4 digits")
        return v

    @field_validator("contacts")
    @classmethod
    def _valid_contacts(cls, v: List[str]) -> List[str]:
        good = [s.strip() for s in v if len(s.strip()) == 10 and s[0] in "6789" and s.isdigit()]
        if len(good) < 2:
            raise ValueError("Need at least two valid contacts")
        return good


class LoginIn(BaseModel):
    phone: str
    pin: str


class TokenOut(BaseModel):
    access_token: str
    token_type: str = "bearer"


class ProfileOut(BaseModel):
    id: str
    name: str
    phone: str
    contacts: List[str]
    silent: bool
    created_at: str


class ProfileUpdate(BaseModel):
    name: Optional[str] = None
    contacts: Optional[List[str]] = None
    silent: Optional[bool] = None


class PinChange(BaseModel):
    old_pin: str
    new_pin: str
