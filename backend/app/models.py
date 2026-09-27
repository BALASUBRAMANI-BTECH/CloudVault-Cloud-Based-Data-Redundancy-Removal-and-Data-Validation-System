from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, Float, DateTime, ForeignKey, Index
from sqlalchemy.sql import func
from backend.app.database import Base

class Record(Base):
    __tablename__ = "records"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(String(255), nullable=False)
    email = Column(String(255), nullable=False, index=True)
    phone = Column(String(50), nullable=False, index=True)
    address = Column(Text, nullable=True)
    category = Column(String(100), nullable=False, default="General", index=True)
    description = Column(Text, nullable=True)

    # Normalized fields for fast and accurate comparison
    normalized_name = Column(String(255), nullable=False, index=True)
    normalized_email = Column(String(255), nullable=False, index=True)
    normalized_phone = Column(String(50), nullable=False, index=True)

    # Redundancy metadata
    similarity_score = Column(Float, nullable=False, default=0.0)
    status = Column(String(50), nullable=False, default="UNIQUE", index=True)
    # Status values: UNIQUE, EXACT_DUPLICATE, NEAR_DUPLICATE, REVIEW_REQUIRED, INVALID
    
    matched_record_id = Column(Integer, nullable=True)
    review_reason = Column(Text, nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False, index=True)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    __table_args__ = (
        Index("ix_records_email_phone", "normalized_email", "normalized_phone"),
        Index("ix_records_status_created", "status", "created_at"),
    )


class AuditLog(Base):
    """Logs every incoming submission event to track redundancy metrics and prevention history."""
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    action = Column(String(50), nullable=False, index=True) 
    # e.g., STORED_UNIQUE, REJECTED_EXACT_DUPLICATE, REJECTED_NEAR_DUPLICATE, PENDING_REVIEW, APPROVED, REJECTED_MANUAL
    
    status = Column(String(50), nullable=False, index=True)
    similarity_score = Column(Float, nullable=False, default=0.0)
    
    record_id = Column(Integer, nullable=True)
    matched_record_id = Column(Integer, nullable=True)
    
    incoming_data = Column(Text, nullable=True)
    reason = Column(Text, nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False, index=True)
