from typing import Dict, Any, List, Optional
from rapidfuzz import fuzz
from sqlalchemy.orm import Session

from backend.app.models import Record
from backend.app.config import settings
from backend.app.services.normalizer import (
    normalize_name,
    normalize_email,
    normalize_phone,
    normalize_address,
)
from backend.app.utils.logger import logger

class DuplicateDetectionResult:
    def __init__(
        self,
        status: str,
        message: str,
        similarity_score: float,
        action: str,
        reason: str,
        matched_record_id: Optional[int] = None,
        matching_fields: Optional[List[str]] = None,
        differing_fields: Optional[List[str]] = None,
        field_scores: Optional[Dict[str, float]] = None,
    ):
        self.status = status
        self.message = message
        self.similarity_score = round(similarity_score, 2)
        self.action = action
        self.reason = reason
        self.matched_record_id = matched_record_id
        self.matching_fields = matching_fields or []
        self.differing_fields = differing_fields or []
        self.field_scores = field_scores or {}

    def to_dict(self) -> Dict[str, Any]:
        return {
            "status": self.status,
            "message": self.message,
            "similarity_score": self.similarity_score,
            "action": self.action,
            "reason": self.reason,
            "matched_record_id": self.matched_record_id,
            "matching_fields": self.matching_fields,
            "differing_fields": self.differing_fields,
            "field_scores": self.field_scores,
        }


def detect_duplicates(
    incoming_data: Dict[str, Any],
    db: Session,
    near_dup_threshold: float = settings.NEAR_DUPLICATE_THRESHOLD,
    review_threshold: float = settings.REVIEW_THRESHOLD,
) -> DuplicateDetectionResult:
    """
    Executes the multi-stage duplicate and redundancy detection pipeline:
    1. Exact duplicate check against normalized indices.
    2. Fuzzy similarity comparison across candidate records.
    3. Multi-field weighted scoring.
    4. False positive discrimination logic.
    5. Action classification (STORE / REJECT / REVIEW_REQUIRED).
    """
    norm_name = incoming_data.get("normalized_name") or normalize_name(incoming_data.get("name", ""))
    norm_email = incoming_data.get("normalized_email") or normalize_email(incoming_data.get("email", ""))
    norm_phone = incoming_data.get("normalized_phone") or normalize_phone(incoming_data.get("phone", ""))
    norm_addr = normalize_address(incoming_data.get("address", ""))

    logger.info(f"Evaluating record for redundancy: '{norm_name}' <{norm_email}> [{norm_phone}]")

    # ---------------------------------------------------------
    # STAGE 1: Exact Duplicate Check (Fast Database Lookup)
    # ---------------------------------------------------------
    # Check 1A: Exact match on all three primary identifiers
    exact_match = (
        db.query(Record)
        .filter(
            Record.normalized_email == norm_email,
            Record.normalized_phone == norm_phone,
            Record.normalized_name == norm_name,
            Record.status.in_(["UNIQUE", "APPROVED"]),
        )
        .first()
    )

    if exact_match:
        logger.warning(f"EXACT DUPLICATE detected matching record #{exact_match.id}")
        return DuplicateDetectionResult(
            status="EXACT_DUPLICATE",
            message="Duplicate record detected",
            similarity_score=100.0,
            action="rejected",
            reason="Identical record already exists with matching name, email, and phone.",
            matched_record_id=exact_match.id,
            matching_fields=["name", "email", "phone"],
            differing_fields=[],
            field_scores={"name": 100.0, "email": 100.0, "phone": 100.0, "address": 100.0},
        )

    # Check 1B: Exact match on both email and phone (unambiguous identity collision)
    email_phone_match = (
        db.query(Record)
        .filter(
            Record.normalized_email == norm_email,
            Record.normalized_phone == norm_phone,
            Record.status.in_(["UNIQUE", "APPROVED"]),
        )
        .first()
    )

    if email_phone_match:
        logger.warning(f"EXACT DUPLICATE (email & phone match) with record #{email_phone_match.id}")
        name_sim = fuzz.token_sort_ratio(norm_name, email_phone_match.normalized_name)
        return DuplicateDetectionResult(
            status="EXACT_DUPLICATE",
            message="Duplicate record detected",
            similarity_score=98.0,
            action="rejected",
            reason="Existing record shares the exact same email and phone number.",
            matched_record_id=email_phone_match.id,
            matching_fields=["email", "phone"],
            differing_fields=["name"] if name_sim < 85 else [],
            field_scores={"name": name_sim, "email": 100.0, "phone": 100.0},
        )

    # ---------------------------------------------------------
    # STAGE 2: Candidate Retrieval & Near-Duplicate Comparison
    # ---------------------------------------------------------
    # Fetch all active stored records (or candidate matches in larger databases)
    candidates = db.query(Record).filter(Record.status.in_(["UNIQUE", "APPROVED"])).all()

    if not candidates:
        logger.info("Database has no prior records. Record is UNIQUE.")
        return DuplicateDetectionResult(
            status="UNIQUE",
            message="Unique record verified successfully",
            similarity_score=0.0,
            action="stored",
            reason="First verified record in the system.",
            matched_record_id=None,
            matching_fields=[],
            differing_fields=["name", "email", "phone", "address"],
            field_scores={"name": 0.0, "email": 0.0, "phone": 0.0, "address": 0.0},
        )

    highest_score = 0.0
    best_candidate: Optional[Record] = None
    best_breakdown: Dict[str, Any] = {}

    for cand in candidates:
        # Calculate individual field similarity scores (0 - 100)
        name_sim = float(fuzz.token_sort_ratio(norm_name, cand.normalized_name))
        # Email similarity: weight username heavily (70%) and domain (30%)
        # This prevents common domains like @gmail.com from falsely inflating similarity
        if "@" in norm_email and "@" in cand.normalized_email:
            u1, d1 = norm_email.split("@", 1)
            u2, d2 = cand.normalized_email.split("@", 1)
            user_sim = float(fuzz.ratio(u1, u2))
            domain_sim = float(fuzz.ratio(d1, d2))
            email_sim = 0.70 * user_sim + 0.30 * domain_sim if norm_email != cand.normalized_email else 100.0
        else:
            email_sim = float(fuzz.ratio(norm_email, cand.normalized_email))

        # Phone similarity: exact digits match = 100, else string ratio
        if norm_phone and cand.normalized_phone and norm_phone == cand.normalized_phone:
            phone_sim = 100.0
        elif norm_phone and cand.normalized_phone:
            phone_sim = float(fuzz.ratio(norm_phone, cand.normalized_phone))
        else:
            phone_sim = 0.0

        # Address similarity
        cand_addr = normalize_address(cand.address)
        if norm_addr and cand_addr:
            address_sim = float(fuzz.token_set_ratio(norm_addr, cand_addr))
        else:
            address_sim = 50.0 if not norm_addr and not cand_addr else 0.0

        # Weighted aggregate score
        # Name: 35%, Email: 35%, Phone: 20%, Address: 10%
        weighted_score = (
            0.35 * name_sim +
            0.35 * email_sim +
            0.20 * phone_sim +
            0.10 * address_sim
        )

        if weighted_score > highest_score:
            highest_score = weighted_score
            best_candidate = cand
            best_breakdown = {
                "name": name_sim,
                "email": email_sim,
                "phone": phone_sim,
                "address": address_sim,
            }

    # Identify matching and differing fields based on field comparison
    matching_fields = [k for k, v in best_breakdown.items() if v >= 80.0]
    differing_fields = [k for k, v in best_breakdown.items() if v < 80.0]

    # ---------------------------------------------------------
    # STAGE 3: False Positive & Edge-Case Detection
    # ---------------------------------------------------------
    # Example requirement: Same or very similar name (e.g., Arun Kumar)
    # but different email (arun@ vs arun123@) and/or different phone.
    # We must NOT blindly classify as duplicate; flag as REVIEW_REQUIRED.
    if best_breakdown.get("name", 0) >= 85.0 and best_candidate:
        email_differs = norm_email != best_candidate.normalized_email
        phone_differs = norm_phone != best_candidate.normalized_phone

        # If name matches but identifying credentials (email and/or phone) are distinct
        if email_differs and (phone_differs or best_breakdown.get("email", 0) < 85.0):
            logger.info(
                f"FALSE POSITIVE rule triggered: High name similarity ({best_breakdown.get('name')}%) "
                f"but differing email ({norm_email} vs {best_candidate.normalized_email}) "
                f"and phone ({norm_phone} vs {best_candidate.normalized_phone})."
            )
            return DuplicateDetectionResult(
                status="REVIEW_REQUIRED",
                message="Potential false positive flagged for manual review",
                similarity_score=highest_score,
                action="review_required",
                reason="High name similarity but important identifying fields differ.",
                matched_record_id=best_candidate.id,
                matching_fields=[f for f in matching_fields if f not in differing_fields],
                differing_fields=list(set(differing_fields + (["email"] if email_differs else []) + (["phone"] if phone_differs else []))),
                field_scores=best_breakdown,
            )

    # If email is identical or near-identical (>=95%) but name or phone differs moderately
    if best_breakdown.get("email", 0) >= 95.0 and highest_score < near_dup_threshold and best_candidate:
        logger.info("Identical email detected with differing details. Flagging for review.")
        return DuplicateDetectionResult(
            status="REVIEW_REQUIRED",
            message="Same email address detected with differing identity details",
            similarity_score=highest_score,
            action="review_required",
            reason="Same email address found but other details vary. Manual verification required.",
            matched_record_id=best_candidate.id,
            matching_fields=matching_fields,
            differing_fields=differing_fields,
            field_scores=best_breakdown,
        )

    # ---------------------------------------------------------
    # STAGE 4: Threshold Evaluation
    # ---------------------------------------------------------
    if highest_score >= near_dup_threshold:
        logger.warning(
            f"NEAR DUPLICATE detected: score={highest_score:.2f} >= threshold={near_dup_threshold} "
            f"with candidate #{best_candidate.id}"
        )
        return DuplicateDetectionResult(
            status="NEAR_DUPLICATE",
            message="Near-duplicate record detected and prevented",
            similarity_score=highest_score,
            action="rejected",
            reason=f"Record is too similar ({highest_score:.1f}%) to existing record #{best_candidate.id}.",
            matched_record_id=best_candidate.id if best_candidate else None,
            matching_fields=matching_fields,
            differing_fields=differing_fields,
            field_scores=best_breakdown,
        )

    elif highest_score >= review_threshold:
        logger.info(
            f"REVIEW REQUIRED: score={highest_score:.2f} within [{review_threshold}, {near_dup_threshold}]"
        )
        return DuplicateDetectionResult(
            status="REVIEW_REQUIRED",
            message="Record flagged for manual review due to moderate similarity",
            similarity_score=highest_score,
            action="review_required",
            reason=f"Moderate similarity ({highest_score:.1f}%) detected with existing record #{best_candidate.id}.",
            matched_record_id=best_candidate.id if best_candidate else None,
            matching_fields=matching_fields,
            differing_fields=differing_fields,
            field_scores=best_breakdown,
        )

    else:
        logger.info(f"UNIQUE record verified: similarity_score={highest_score:.2f} < {review_threshold}")
        return DuplicateDetectionResult(
            status="UNIQUE",
            message="Unique record verified successfully",
            similarity_score=highest_score,
            action="stored",
            reason="No existing records exceed redundancy thresholds.",
            matched_record_id=best_candidate.id if best_candidate else None,
            matching_fields=matching_fields,
            differing_fields=differing_fields,
            field_scores=best_breakdown,
        )
