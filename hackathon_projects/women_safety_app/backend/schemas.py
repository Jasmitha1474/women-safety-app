# schemas.py
from pydantic import BaseModel, Field, field_validator
from typing import List, Optional

PHONE_HINT = "Indian mobile: 10 digits starting with 6–9"

class Location(BaseModel):
    lat: float
    lng: float
    accuracy: Optional[float] = None

class SOSCreate(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    phone: str = Field(description=PHONE_HINT)
    contacts: List[str] = Field(min_length=2)
    location: Optional[Location] = None
    silent: bool

    @field_validator("phone")
    @classmethod
    def _valid_india_phone(cls, v: str) -> str:
        v = (v or "").strip()
        if not (len(v) == 10 and v[0] in "6789" and v.isdigit()):
            raise ValueError(PHONE_HINT)
        return v

    @field_validator("contacts")
    @classmethod
    def _valid_contacts(cls, v: List[str]) -> List[str]:
        good = []
        for s in v:
            s = str(s).strip()
            if len(s) == 10 and s[0] in "6789" and s.isdigit():
                good.append(s)
        if len(good) < 2:
            raise ValueError("Need at least two valid contacts")
        return good

class SOSEventOut(BaseModel):
    id: int
    name: str
    phone: str
    contacts: List[str]
    lat: Optional[float] = None
    lng: Optional[float] = None
    accuracy: Optional[float] = None
    silent: bool
    created_at: str

# ---------- Auth / Users ----------

class SignupIn(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    phone: str = Field(description=PHONE_HINT)
    pin: str = Field(min_length=4, max_length=4, description="4-digit PIN")
    contacts: List[str] = Field(min_length=2)
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
        good = []
        for s in v:
            s = str(s).strip()
            if len(s) == 10 and s[0] in "6789" and s.isdigit():
                good.append(s)
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
    id: int
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
