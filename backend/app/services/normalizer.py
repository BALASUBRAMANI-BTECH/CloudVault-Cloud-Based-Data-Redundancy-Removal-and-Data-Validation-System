import re
import unicodedata

def clean_whitespace(text: str) -> str:
    """Removes extra spaces, leading and trailing whitespace."""
    if not text:
        return ""
    # Unicode normalize
    text = unicodedata.normalize("NFKC", str(text))
    # Replace multiple whitespace characters with a single space
    return re.sub(r"\s+", " ", text).strip()

def normalize_name(name: str) -> str:
    """
    Normalizes person/entity name:
    Example: ' Rahul   Kumar ' -> 'rahul kumar'
    """
    cleaned = clean_whitespace(name)
    return cleaned.lower()

def normalize_email(email: str) -> str:
    """
    Normalizes email address:
    Example: ' RAHUL@GMAIL.COM ' -> 'rahul@gmail.com'
    """
    cleaned = clean_whitespace(email)
    return cleaned.lower()

def normalize_phone(phone: str) -> str:
    """
    Normalizes phone number to standard digits:
    Example: '+91 98765 43210' -> '9876543210'
    Example: '(123) 456-7890' -> '1234567890'
    """
    if not phone:
        return ""
    # Extract only digits
    digits = re.sub(r"\D", "", str(phone))
    
    # Handle country codes: India +91 (12 digits), 0-prefix (11 digits), US +1 (11 digits)
    if len(digits) == 12 and digits.startswith("91"):
        return digits[2:]
    if len(digits) == 11 and digits.startswith("0"):
        return digits[1:]
    if len(digits) == 11 and digits.startswith("1"):
        return digits[1:]
        
    return digits

def normalize_address(address: str | None) -> str:
    """Normalizes address string."""
    if not address:
        return ""
    cleaned = clean_whitespace(address).lower()
    # Remove excessive punctuation
    return re.sub(r"[,\-\.#]", " ", cleaned).strip()

def normalize_category(category: str | None) -> str:
    """Normalizes category name."""
    if not category:
        return "General"
    cleaned = clean_whitespace(category)
    return cleaned.title()
