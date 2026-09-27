from datetime import datetime
from typing import Optional, List, Dict
from pydantic import BaseModel, Field, ConfigDict

class RecordBase(BaseModel):
    name: str = Field(..., json_schema_extra={"example": "Rahul Kumar"}, description="Full name")
    email: str = Field(..., json_schema_extra={"example": "rahul@gmail.com"}, description="Email address")
    phone: str = Field(..., json_schema_extra={"example": "9876543210"}, description="Phone number")
    address: Optional[str] = Field(None, json_schema_extra={"example": "123 Cloud Ave, Bangalore"}, description="Physical or mailing address")
    category: Optional[str] = Field("Customer", json_schema_extra={"example": "Customer"}, description="Record category/classification")
    description: Optional[str] = Field(None, json_schema_extra={"example": "Enterprise account lead"}, description="Optional notes or description")

class RecordCreate(RecordBase):
    pass

class RecordResponse(RecordBase):
    id: int
    normalized_name: str
    normalized_email: str
    normalized_phone: str
    similarity_score: float
    status: str
    matched_record_id: Optional[int] = None
    review_reason: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

class DuplicateCheckResponse(BaseModel):
    status: str
    message: str
    similarity_score: float
    action: str
    record_id: Optional[int] = None
    existing_record_id: Optional[int] = None
    matched_record_id: Optional[int] = None
    reason: Optional[str] = None
    matching_fields: Optional[List[str]] = []
    differing_fields: Optional[List[str]] = []
    field_scores: Optional[Dict[str, float]] = {}

class StatsResponse(BaseModel):
    total_records: int
    unique_records: int
    duplicates_rejected: int
    near_duplicates: int
    records_requiring_review: int
    categories: Dict[str, int] = {}
    recent_activity_count: int = 0

class ReviewActionRequest(BaseModel):
    action: str = Field(..., json_schema_extra={"example": "APPROVE"}, description="APPROVE or REJECT")
    notes: Optional[str] = Field(None, description="Optional reviewer notes")

class HealthResponse(BaseModel):
    status: str
    app_name: str
    version: str
    database: str
    timestamp: datetime
