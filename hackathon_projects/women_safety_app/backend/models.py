# models.py
from datetime import datetime
from sqlalchemy import String, Float, TIMESTAMP, text, ForeignKey
from sqlalchemy.dialects.mysql import BIGINT, TINYINT, JSON, DECIMAL
from sqlalchemy.orm import Mapped, mapped_column, relationship
from database import Base

class User(Base):
    __tablename__ = "users"
    id: Mapped[int] = mapped_column(BIGINT(unsigned=True), primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    phone: Mapped[str] = mapped_column(String(10), nullable=False, unique=True)
    pin_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    contacts: Mapped[dict] = mapped_column(JSON, nullable=False)  # store list directly
    silent: Mapped[int] = mapped_column(TINYINT(1), nullable=False, default=0)
    created_at: Mapped[datetime] = mapped_column(
        TIMESTAMP, nullable=False, server_default=text("CURRENT_TIMESTAMP")
    )

    sos_events: Mapped[list["SOSEvent"]] = relationship("SOSEvent", back_populates="user")

class SOSEvent(Base):
    __tablename__ = "sos_events"
    id: Mapped[int] = mapped_column(BIGINT(unsigned=True), primary_key=True, autoincrement=True)

    user_id: Mapped[int | None] = mapped_column(BIGINT(unsigned=True), ForeignKey("users.id"), nullable=True)
    user: Mapped[User | None] = relationship("User", back_populates="sos_events")

    name: Mapped[str] = mapped_column(String(100), nullable=False)
    phone: Mapped[str] = mapped_column(String(10), nullable=False)
    contacts: Mapped[dict] = mapped_column(JSON, nullable=False)  # {"list":[...]} or just list
    lat: Mapped[float | None] = mapped_column(DECIMAL(10, 7), nullable=True)
    lng: Mapped[float | None] = mapped_column(DECIMAL(10, 7), nullable=True)
    accuracy: Mapped[float | None] = mapped_column(Float, nullable=True)
    silent: Mapped[int] = mapped_column(TINYINT(1), nullable=False, default=0)
    created_at: Mapped[datetime] = mapped_column(
        TIMESTAMP, nullable=False, server_default=text("CURRENT_TIMESTAMP")
    )
