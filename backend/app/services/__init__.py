from .normalizer import (
    clean_whitespace,
    normalize_name,
    normalize_email,
    normalize_phone,
    normalize_address,
    normalize_category,
)
from .validator import validate_record_payload
from .duplicate_detector import detect_duplicates, DuplicateDetectionResult

__all__ = [
    "clean_whitespace",
    "normalize_name",
    "normalize_email",
    "normalize_phone",
    "normalize_address",
    "normalize_category",
    "validate_record_payload",
    "detect_duplicates",
    "DuplicateDetectionResult",
]
