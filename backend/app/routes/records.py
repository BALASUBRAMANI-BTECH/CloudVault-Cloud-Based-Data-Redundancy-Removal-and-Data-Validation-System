from typing import Optional, List
import json
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import or_, desc, asc

from backend.app.database import get_db
from backend.app.models import Record, AuditLog
from backend.app.schemas import (
    RecordCreate,
    RecordResponse,
    DuplicateCheckResponse,
    StatsResponse,
    ReviewActionRequest,
)
from backend.app.services.normalizer import (
    normalize_name,
    normalize_email,
    normalize_phone,
    normalize_category,
    clean_whitespace,
)
from backend.app.services.validator import validate_record_payload
from backend.app.services.duplicate_detector import detect_duplicates
from backend.app.utils.logger import logger

router = APIRouter(prefix="/records", tags=["Records"])


@router.post("", response_model=DuplicateCheckResponse, status_code=status.HTTP_201_CREATED)
def create_record(payload: RecordCreate, db: Session = Depends(get_db)):
    """
    Core data processing pipeline:
    1. Input validation & completeness check
    2. Data normalization (whitespace, casing, phone formatting)
    3. Duplicate and redundancy detection (Exact, Near, False Positive)
    4. Storage or rejection decision
    """
    raw_data = payload.model_dump()
    logger.info(f"Incoming record received: {raw_data.get('name')} <{raw_data.get('email')}>")

    # Step 1: Input Validation
    is_valid, validation_errors = validate_record_payload(raw_data)
    if not is_valid:
        error_msg = "; ".join(validation_errors)
        logger.warning(f"Record validation failed: {error_msg}")
        
        # Log invalid attempt in audit log
        audit = AuditLog(
            action="INVALID_INPUT",
            status="INVALID",
            similarity_score=0.0,
            incoming_data=json.dumps(raw_data),
            reason=error_msg,
        )
        db.add(audit)
        db.commit()

        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={"message": "Data validation failed", "errors": validation_errors},
        )

    # Step 2: Data Normalization
    norm_name = normalize_name(raw_data["name"])
    norm_email = normalize_email(raw_data["email"])
    norm_phone = normalize_phone(raw_data["phone"])
    category = normalize_category(raw_data.get("category"))
    cleaned_address = clean_whitespace(raw_data.get("address", ""))
    cleaned_description = clean_whitespace(raw_data.get("description", ""))

    normalized_payload = {
        **raw_data,
        "normalized_name": norm_name,
        "normalized_email": norm_email,
        "normalized_phone": norm_phone,
        "category": category,
        "address": cleaned_address,
        "description": cleaned_description,
    }

    # Step 3: Redundancy & Duplicate Detection
    detection = detect_duplicates(normalized_payload, db)

    # Step 4: Decision & Persistence
    if detection.status == "EXACT_DUPLICATE":
        # REJECT duplicate, do not insert into records table
        audit = AuditLog(
            action="REJECTED_EXACT_DUPLICATE",
            status="EXACT_DUPLICATE",
            similarity_score=detection.similarity_score,
            matched_record_id=detection.matched_record_id,
            incoming_data=json.dumps(raw_data),
            reason=detection.reason,
        )
        db.add(audit)
        db.commit()

        return DuplicateCheckResponse(
            status="EXACT_DUPLICATE",
            message="Duplicate record detected",
            similarity_score=detection.similarity_score,
            existing_record_id=detection.matched_record_id,
            matched_record_id=detection.matched_record_id,
            action="rejected",
            reason=detection.reason,
            matching_fields=detection.matching_fields,
            differing_fields=detection.differing_fields,
            field_scores=detection.field_scores,
        )

    elif detection.status == "NEAR_DUPLICATE":
        # REJECT near duplicate
        audit = AuditLog(
            action="REJECTED_NEAR_DUPLICATE",
            status="NEAR_DUPLICATE",
            similarity_score=detection.similarity_score,
            matched_record_id=detection.matched_record_id,
            incoming_data=json.dumps(raw_data),
            reason=detection.reason,
        )
        db.add(audit)
        db.commit()

        return DuplicateCheckResponse(
            status="NEAR_DUPLICATE",
            message="Near-duplicate record detected",
            similarity_score=detection.similarity_score,
            existing_record_id=detection.matched_record_id,
            matched_record_id=detection.matched_record_id,
            action="rejected",
            reason=detection.reason,
            matching_fields=detection.matching_fields,
            differing_fields=detection.differing_fields,
            field_scores=detection.field_scores,
        )

    elif detection.status == "REVIEW_REQUIRED":
        # Store in database flagged as REVIEW_REQUIRED so it appears in the Manual Review queue
        new_record = Record(
            name=clean_whitespace(raw_data["name"]),
            email=clean_whitespace(raw_data["email"]),
            phone=clean_whitespace(raw_data["phone"]),
            address=cleaned_address,
            category=category,
            description=cleaned_description,
            normalized_name=norm_name,
            normalized_email=norm_email,
            normalized_phone=norm_phone,
            similarity_score=detection.similarity_score,
            status="REVIEW_REQUIRED",
            matched_record_id=detection.matched_record_id,
            review_reason=detection.reason,
        )
        db.add(new_record)
        db.flush()

        audit = AuditLog(
            action="PENDING_REVIEW",
            status="REVIEW_REQUIRED",
            similarity_score=detection.similarity_score,
            record_id=new_record.id,
            matched_record_id=detection.matched_record_id,
            incoming_data=json.dumps(raw_data),
            reason=detection.reason,
        )
        db.add(audit)
        db.commit()
        db.refresh(new_record)

        return DuplicateCheckResponse(
            status="REVIEW_REQUIRED",
            message="Record flagged for manual review",
            similarity_score=detection.similarity_score,
            record_id=new_record.id,
            existing_record_id=detection.matched_record_id,
            matched_record_id=detection.matched_record_id,
            action="review_required",
            reason=detection.reason,
            matching_fields=detection.matching_fields,
            differing_fields=detection.differing_fields,
            field_scores=detection.field_scores,
        )

    else:
        # UNIQUE verified record
        new_record = Record(
            name=clean_whitespace(raw_data["name"]),
            email=clean_whitespace(raw_data["email"]),
            phone=clean_whitespace(raw_data["phone"]),
            address=cleaned_address,
            category=category,
            description=cleaned_description,
            normalized_name=norm_name,
            normalized_email=norm_email,
            normalized_phone=norm_phone,
            similarity_score=detection.similarity_score,
            status="UNIQUE",
            matched_record_id=None,
            review_reason="Verified unique record",
        )
        db.add(new_record)
        db.flush()

        audit = AuditLog(
            action="STORED_UNIQUE",
            status="UNIQUE",
            similarity_score=detection.similarity_score,
            record_id=new_record.id,
            matched_record_id=None,
            incoming_data=json.dumps(raw_data),
            reason="Unique record verified successfully",
        )
        db.add(audit)
        db.commit()
        db.refresh(new_record)

        logger.info(f"Unique record #{new_record.id} stored successfully in database.")
        return DuplicateCheckResponse(
            status="UNIQUE",
            message="Unique record verified successfully",
            similarity_score=detection.similarity_score,
            record_id=new_record.id,
            action="stored",
            reason="Verified unique record.",
            matching_fields=detection.matching_fields,
            differing_fields=detection.differing_fields,
            field_scores=detection.field_scores,
        )


@router.get("", response_model=List[RecordResponse])
def get_records(
    status: Optional[str] = Query(None, description="Filter by status: UNIQUE, REVIEW_REQUIRED, APPROVED, etc."),
    category: Optional[str] = Query(None, description="Filter by category"),
    search: Optional[str] = Query(None, description="Keyword search query"),
    sort_by: str = Query("created_at", description="Field to sort by: created_at, similarity_score, name"),
    sort_order: str = Query("desc", description="Sort order: asc or desc"),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    db: Session = Depends(get_db),
):
    """Retrieve all stored records with optional filtering, searching, and pagination."""
    query = db.query(Record)

    if status and status.upper() != "ALL":
        query = query.filter(Record.status == status.upper())

    if category and category.upper() != "ALL":
        query = query.filter(Record.category.ilike(f"%{category}%"))

    if search:
        search_term = f"%{search.strip().lower()}%"
        query = query.filter(
            or_(
                Record.normalized_name.ilike(search_term),
                Record.normalized_email.ilike(search_term),
                Record.normalized_phone.ilike(search_term),
                Record.category.ilike(search_term),
                Record.description.ilike(search_term),
            )
        )

    # Sorting
    sort_column = getattr(Record, sort_by, Record.created_at)
    if sort_order.lower() == "asc":
        query = query.order_by(asc(sort_column))
    else:
        query = query.order_by(desc(sort_column))

    records = query.offset(skip).limit(limit).all()
    return records


@router.get("/stats", response_model=StatsResponse)
def get_stats(db: Session = Depends(get_db)):
    """
    Returns high-level redundancy and system metrics:
    - Total records in database
    - Unique verified records
    - Duplicates rejected (prevented)
    - Near duplicates rejected
    - Records requiring manual review
    - Category distribution
    """
    total_stored = db.query(Record).count()
    unique_records = db.query(Record).filter(Record.status.in_(["UNIQUE", "APPROVED"])).count()
    records_requiring_review = db.query(Record).filter(Record.status == "REVIEW_REQUIRED").count()

    exact_duplicates_rejected = (
        db.query(AuditLog)
        .filter(AuditLog.action == "REJECTED_EXACT_DUPLICATE")
        .count()
    )

    near_duplicates_rejected = (
        db.query(AuditLog)
        .filter(AuditLog.action == "REJECTED_NEAR_DUPLICATE")
        .count()
    )

    # Categories breakdown
    categories_dict: dict = {}
    records = db.query(Record.category).all()
    for (cat,) in records:
        c = cat or "General"
        categories_dict[c] = categories_dict.get(c, 0) + 1

    recent_activity_count = db.query(AuditLog).count()

    return StatsResponse(
        total_records=total_stored,
        unique_records=unique_records,
        duplicates_rejected=exact_duplicates_rejected,
        near_duplicates=near_duplicates_rejected,
        records_requiring_review=records_requiring_review,
        categories=categories_dict,
        recent_activity_count=recent_activity_count,
    )


@router.get("/search", response_model=List[RecordResponse])
def search_records(
    q: str = Query(..., min_length=1, description="Search query string"),
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db),
):
    """Search records across name, email, phone, category, and description."""
    search_term = f"%{q.strip().lower()}%"
    results = (
        db.query(Record)
        .filter(
            or_(
                Record.normalized_name.ilike(search_term),
                Record.normalized_email.ilike(search_term),
                Record.normalized_phone.ilike(search_term),
                Record.category.ilike(search_term),
                Record.description.ilike(search_term),
            )
        )
        .limit(limit)
        .all()
    )
    return results


@router.get("/{record_id}", response_model=RecordResponse)
def get_record(record_id: int, db: Session = Depends(get_db)):
    """Fetch details of a specific record by its primary key ID."""
    record = db.query(Record).filter(Record.id == record_id).first()
    if not record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Record with ID #{record_id} not found."
        )
    return record


@router.post("/{record_id}/approve", response_model=RecordResponse)
def approve_record(
    record_id: int,
    payload: Optional[ReviewActionRequest] = None,
    db: Session = Depends(get_db),
):
    """
    Manually approve a record that was flagged for review.
    Upgrades status to APPROVED (active unique verified record).
    """
    record = db.query(Record).filter(Record.id == record_id).first()
    if not record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Record #{record_id} not found."
        )

    logger.info(f"Manual approval requested for record #{record_id} ({record.name})")

    record.status = "APPROVED"
    record.review_reason = f"Manually approved. Notes: {payload.notes if payload else 'No reviewer notes'}"
    
    # Audit trail
    audit = AuditLog(
        action="APPROVED",
        status="APPROVED",
        similarity_score=record.similarity_score,
        record_id=record.id,
        matched_record_id=record.matched_record_id,
        reason=record.review_reason,
    )
    db.add(audit)
    db.commit()
    db.refresh(record)

    logger.info(f"Record #{record_id} approved successfully.")
    return record


@router.post("/{record_id}/reject", status_code=status.HTTP_200_OK)
def reject_record(
    record_id: int,
    payload: Optional[ReviewActionRequest] = None,
    db: Session = Depends(get_db),
):
    """
    Manually reject a record from the review queue.
    Removes the redundant entry from active records and records audit trail.
    """
    record = db.query(Record).filter(Record.id == record_id).first()
    if not record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Record #{record_id} not found."
        )

    logger.info(f"Manual rejection for record #{record_id} ({record.name})")

    audit = AuditLog(
        action="REJECTED_MANUAL",
        status="REJECTED",
        similarity_score=record.similarity_score,
        record_id=record.id,
        matched_record_id=record.matched_record_id,
        reason=f"Manually rejected during review. Notes: {payload.notes if payload else 'None'}",
    )
    db.add(audit)
    db.delete(record)
    db.commit()

    return {"message": f"Record #{record_id} rejected and removed from review queue.", "action": "rejected"}


@router.delete("/{record_id}", status_code=status.HTTP_200_OK)
def delete_record(record_id: int, db: Session = Depends(get_db)):
    """Delete a record by ID."""
    record = db.query(Record).filter(Record.id == record_id).first()
    if not record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Record #{record_id} not found."
        )

    logger.info(f"Deleting record #{record_id} ({record.name})")
    db.delete(record)
    db.commit()
    return {"message": f"Record #{record_id} deleted successfully."}
