import re
from typing import Tuple, List, Dict, Any
from backend.app.services.normalizer import clean_whitespace, normalize_phone

# Standard RFC 5322 compatible email pattern
EMAIL_REGEX = re.compile(
    r"^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$"
)

def validate_record_payload(data: Dict[str, Any]) -> Tuple[bool, List[str]]:
    """
    Validates record payload before ingestion:
    - Required fields check (name, email, phone)
    - Email format check
    - Phone number digits and length check
    - Non-empty / non-whitespace checks
    """
    errors: List[str] = []

    name = clean_whitespace(str(data.get("name", "") or ""))
    email = clean_whitespace(str(data.get("email", "") or ""))
    phone = clean_whitespace(str(data.get("phone", "") or ""))

    # 1. Required fields
    if not name:
        errors.append("Name is required and cannot be empty.")
    elif len(name) < 2:
        errors.append("Name must be at least 2 characters long.")

    if not email:
        errors.append("Email is required and cannot be empty.")
    else:
        # 2. Email format validation
        if not EMAIL_REGEX.match(email):
            errors.append(f"Invalid email format: '{email}'.")

    if not phone:
        errors.append("Phone number is required and cannot be empty.")
    else:
        # 3. Phone number validation
        normalized_digits = normalize_phone(phone)
        if len(normalized_digits) < 7 or len(normalized_digits) > 15:
            errors.append(
                f"Invalid phone number: '{phone}'. Must contain between 7 and 15 digits."
            )

    is_valid = len(errors) == 0
    return is_valid, errors
