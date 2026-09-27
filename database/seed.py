"""
CloudVault Database Seeding Script
===================================
Seeds the database with at least 20 realistic records demonstrating:
- Unique records
- Exact duplicates (rejected)
- Near duplicates (whitespace, casing, phone formats, minor typos - rejected)
- False positives / similar names with distinct emails & phones (flagged for review)
- Different phone number formatting (+91, parentheses, spaces)
- Invalid records (validation error demo)
"""

import sys
import os

# Add root directory to path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

from sqlalchemy.orm import Session
from backend.app.database import engine, SessionLocal, Base
from backend.app.models import Record, AuditLog
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

# Sample dataset
SAMPLE_DATASET = [
    # -------------------------------------------------------------
    # 1. INITIAL UNIQUE BASELINE RECORDS
    # -------------------------------------------------------------
    {
        "name": "Rahul Kumar",
        "email": "rahul@gmail.com",
        "phone": "9876543210",
        "address": "45 MG Road, Indiranagar, Bangalore",
        "category": "Customer",
        "description": "Premium tier account customer",
        "expected": "UNIQUE"
    },
    {
        "name": "Arun Kumar",
        "email": "arun@gmail.com",
        "phone": "9876512345",
        "address": "12 Anna Salai, Chennai, Tamil Nadu",
        "category": "Vendor",
        "description": "Hardware supply vendor",
        "expected": "UNIQUE"
    },
    {
        "name": "Priya Sharma",
        "email": "priya.sharma@techcorp.in",
        "phone": "+91 98230 45678",
        "address": "7th Floor, Cyber City, Gurugram",
        "category": "Partner",
        "description": "Strategic Cloud Alliance Lead",
        "expected": "UNIQUE"
    },
    {
        "name": "David Miller",
        "email": "david.miller@apexglobal.com",
        "phone": "+1 (415) 555-0199",
        "address": "500 Howard Street, San Francisco, CA",
        "category": "Enterprise",
        "description": "North America Region Director",
        "expected": "UNIQUE"
    },
    {
        "name": "Sneha Roy",
        "email": "sneha.roy@biocare.org",
        "phone": "9845012390",
        "address": "Sector 5, Salt Lake, Kolkata",
        "category": "Healthcare",
        "description": "Clinical research coordinator",
        "expected": "UNIQUE"
    },
    {
        "name": "Vikramaditya Rao",
        "email": "v.rao@solarsolutions.co",
        "phone": "9900112233",
        "address": "Banjara Hills, Hyderabad, Telangana",
        "category": "Customer",
        "description": "Renewable energy client",
        "expected": "UNIQUE"
    },
    {
        "name": "Elena Rostova",
        "email": "elena.r@nordicfin.com",
        "phone": "+44 20 7946 0912",
        "address": "25 Bank Street, Canary Wharf, London",
        "category": "Finance",
        "description": "Investment risk analyst",
        "expected": "UNIQUE"
    },
    {
        "name": "Karthik Sundaram",
        "email": "karthik.s@autocraft.io",
        "phone": "9789012345",
        "address": "OMR IT Corridor, Chennai",
        "category": "Engineering",
        "description": "Embedded firmware architect",
        "expected": "UNIQUE"
    },

    # -------------------------------------------------------------
    # 2. EXACT DUPLICATES (Must be detected and rejected)
    # -------------------------------------------------------------
    {
        "name": "Rahul Kumar",
        "email": "rahul@gmail.com",
        "phone": "9876543210",
        "address": "45 MG Road, Indiranagar, Bangalore",
        "category": "Customer",
        "description": "Exact duplicate submission attempt",
        "expected": "EXACT_DUPLICATE"
    },
    {
        "name": "David Miller",
        "email": "david.miller@apexglobal.com",
        "phone": "+1 (415) 555-0199",
        "address": "500 Howard Street, San Francisco, CA",
        "category": "Enterprise",
        "description": "Re-submission from customer form",
        "expected": "EXACT_DUPLICATE"
    },

    # -------------------------------------------------------------
    # 3. NEAR DUPLICATES (Variations in casing, spaces, phone formats)
    # -------------------------------------------------------------
    {
        "name": "   Rahul    Kumar   ",
        "email": "RAHUL@GMAIL.COM",
        "phone": "+91 98765 43210",
        "address": "45 MG Road, Indiranagar, Bangalore",
        "category": "Customer",
        "description": "Casing and spacing variation of Rahul Kumar",
        "expected": "NEAR_DUPLICATE / EXACT_DUPLICATE"
    },
    {
        "name": "Priya   Sharma",
        "email": "priya.sharma@techcorp.in",
        "phone": "9823045678",
        "address": "Cyber City, Gurugram",
        "category": "Partner",
        "description": "Phone format variation (+91 vs 10 digits)",
        "expected": "NEAR_DUPLICATE / EXACT_DUPLICATE"
    },
    {
        "name": "Rahull Kumar",  # Minor typo in name, slight email alteration
        "email": "rahul.k98@gmail.com",
        "phone": "9876543210",
        "address": "MG Road, Bangalore",
        "category": "Customer",
        "description": "Slight spelling typo in Rahul Kumar",
        "expected": "NEAR_DUPLICATE"
    },
    {
        "name": "David Miller",
        "email": "david.miller@apexglobal.com",
        "phone": "+1 415 555 0198",  # 1 digit difference in phone
        "address": "500 Howard Street, San Francisco, CA",
        "category": "Enterprise",
        "description": "Phone number typo with identical name & corporate email",
        "expected": "NEAR_DUPLICATE"
    },
    {
        "name": "Sneha Roy",
        "email": "SNEHA.ROY@BIOCARE.ORG",
        "phone": "+91 98450 12390",
        "address": "Salt Lake, Kolkata",
        "category": "Healthcare",
        "description": "Uppercase email and spaced phone format",
        "expected": "NEAR_DUPLICATE / EXACT_DUPLICATE"
    },

    # -------------------------------------------------------------
    # 4. FALSE POSITIVES / REVIEW REQUIRED
    # (Identical or similar name, but distinct email and phone)
    # -------------------------------------------------------------
    {
        "name": "Arun Kumar",
        "email": "arun123@gmail.com",
        "phone": "9123456789",
        "address": "42 Race Course Road, Coimbatore, Tamil Nadu",
        "category": "Customer",
        "description": "Different person with same common name Arun Kumar",
        "expected": "REVIEW_REQUIRED"
    },
    {
        "name": "Rahul Kumar",
        "email": "rahul.enterprise@cloudconsulting.com",
        "phone": "9811223344",
        "address": "Koramangala 4th Block, Bangalore",
        "category": "Enterprise",
        "description": "Different professional with same common name",
        "expected": "REVIEW_REQUIRED"
    },
    {
        "name": "David Miller",
        "email": "d.miller99@freemail.net",
        "phone": "+1 (212) 555-8844",
        "address": "New York, NY",
        "category": "Customer",
        "description": "Same name David Miller in different state and email",
        "expected": "REVIEW_REQUIRED"
    },

    # -------------------------------------------------------------
    # 5. ADDITIONAL UNIQUE RECORDS ACROSS DOMAINS
    # -------------------------------------------------------------
    {
        "name": "Ananya Sen",
        "email": "ananya.sen@deepai.labs",
        "phone": "9830112233",
        "address": "Park Street, Kolkata",
        "category": "Engineering",
        "description": "Machine Learning Engineer",
        "expected": "UNIQUE"
    },
    {
        "name": "Carlos Mendoza",
        "email": "cmendoza@latamretail.com",
        "phone": "+52 55 1234 5678",
        "address": "Paseo de la Reforma, Mexico City",
        "category": "Retail",
        "description": "Supply chain coordinator",
        "expected": "UNIQUE"
    },
    {
        "name": "Fatima Al-Mansoor",
        "email": "fatima.m@gulfenergy.ae",
        "phone": "+971 4 312 3456",
        "address": "DIFC Gate Tower, Dubai, UAE",
        "category": "Enterprise",
        "description": "Infrastructure operations lead",
        "expected": "UNIQUE"
    },

    # -------------------------------------------------------------
    # 6. INVALID RECORDS (For Validation Flow Testing)
    # -------------------------------------------------------------
    {
        "name": "",
        "email": "missingname@test.com",
        "phone": "9876543210",
        "category": "Invalid",
        "description": "Missing name test",
        "expected": "INVALID"
    },
    {
        "name": "Malformed Email User",
        "email": "not-an-email-address",
        "phone": "9876543210",
        "category": "Invalid",
        "description": "Invalid email format test",
        "expected": "INVALID"
    },
    {
        "name": "Short Phone User",
        "email": "shortphone@test.com",
        "phone": "1234",
        "category": "Invalid",
        "description": "Invalid short phone test",
        "expected": "INVALID"
    }
]

def seed_database():
    """Initializes tables and processes the 23 sample records."""
    logger.info("Initializing database tables...")
    Base.metadata.create_all(bind=engine)

    db: Session = SessionLocal()
    try:
        # Clear existing data for clean seed
        logger.info("Clearing previous records and audit logs...")
        db.query(AuditLog).delete()
        db.query(Record).delete()
        db.commit()

        processed_count = 0
        unique_stored = 0
        duplicates_rejected = 0
        near_duplicates_rejected = 0
        reviews_flagged = 0
        invalids_rejected = 0

        print("\n" + "=" * 80)
        print("CLOUDVAULT DATA REDUNDANCY REMOVAL - SEED & SIMULATION")
        print("=" * 80)

        for idx, item in enumerate(SAMPLE_DATASET, start=1):
            print(f"\n[Record #{idx:02d}] Processing: '{item['name']}' <{item['email']}>")
            
            # Step 1: Validation
            is_valid, errors = validate_record_payload(item)
            if not is_valid:
                invalids_rejected += 1
                print(f"  ❌ VALIDATION ERROR (Rejected): {'; '.join(errors)}")
                audit = AuditLog(
                    action="INVALID_INPUT",
                    status="INVALID",
                    similarity_score=0.0,
                    reason="; ".join(errors),
                )
                db.add(audit)
                db.commit()
                continue

            # Step 2: Normalization
            norm_name = normalize_name(item["name"])
            norm_email = normalize_email(item["email"])
            norm_phone = normalize_phone(item["phone"])
            category = normalize_category(item.get("category"))
            addr = clean_whitespace(item.get("address", ""))
            desc = clean_whitespace(item.get("description", ""))

            normalized = {
                **item,
                "normalized_name": norm_name,
                "normalized_email": norm_email,
                "normalized_phone": norm_phone,
                "category": category,
                "address": addr,
                "description": desc,
            }

            # Step 3: Duplicate detection
            detection = detect_duplicates(normalized, db)

            # Step 4: Decision handling
            if detection.status == "EXACT_DUPLICATE":
                duplicates_rejected += 1
                print(f"  🚫 EXACT DUPLICATE (Rejected) | Score: {detection.similarity_score}% | Reason: {detection.reason}")
                audit = AuditLog(
                    action="REJECTED_EXACT_DUPLICATE",
                    status="EXACT_DUPLICATE",
                    similarity_score=detection.similarity_score,
                    matched_record_id=detection.matched_record_id,
                    reason=detection.reason,
                )
                db.add(audit)
                db.commit()

            elif detection.status == "NEAR_DUPLICATE":
                near_duplicates_rejected += 1
                print(f"  ⚠️  NEAR DUPLICATE (Rejected)  | Score: {detection.similarity_score}% | Reason: {detection.reason}")
                audit = AuditLog(
                    action="REJECTED_NEAR_DUPLICATE",
                    status="NEAR_DUPLICATE",
                    similarity_score=detection.similarity_score,
                    matched_record_id=detection.matched_record_id,
                    reason=detection.reason,
                )
                db.add(audit)
                db.commit()

            elif detection.status == "REVIEW_REQUIRED":
                reviews_flagged += 1
                rec = Record(
                    name=clean_whitespace(item["name"]),
                    email=clean_whitespace(item["email"]),
                    phone=clean_whitespace(item["phone"]),
                    address=addr,
                    category=category,
                    description=desc,
                    normalized_name=norm_name,
                    normalized_email=norm_email,
                    normalized_phone=norm_phone,
                    similarity_score=detection.similarity_score,
                    status="REVIEW_REQUIRED",
                    matched_record_id=detection.matched_record_id,
                    review_reason=detection.reason,
                )
                db.add(rec)
                db.flush()
                print(f"  🔍 REVIEW REQUIRED (Queued)   | Score: {detection.similarity_score}% | Reason: {detection.reason}")
                audit = AuditLog(
                    action="PENDING_REVIEW",
                    status="REVIEW_REQUIRED",
                    similarity_score=detection.similarity_score,
                    record_id=rec.id,
                    matched_record_id=detection.matched_record_id,
                    reason=detection.reason,
                )
                db.add(audit)
                db.commit()

            else:
                unique_stored += 1
                rec = Record(
                    name=clean_whitespace(item["name"]),
                    email=clean_whitespace(item["email"]),
                    phone=clean_whitespace(item["phone"]),
                    address=addr,
                    category=category,
                    description=desc,
                    normalized_name=norm_name,
                    normalized_email=norm_email,
                    normalized_phone=norm_phone,
                    similarity_score=detection.similarity_score,
                    status="UNIQUE",
                    review_reason="Verified unique record",
                )
                db.add(rec)
                db.flush()
                print(f"  ✅ UNIQUE RECORD (Stored)     | Record ID #{rec.id} | Verified unique")
                audit = AuditLog(
                    action="STORED_UNIQUE",
                    status="UNIQUE",
                    similarity_score=detection.similarity_score,
                    record_id=rec.id,
                    reason="Verified unique record",
                )
                db.add(audit)
                db.commit()

            processed_count += 1

        print("\n" + "=" * 80)
        print("SEEDING SUMMARY")
        print("=" * 80)
        print(f"Total Submissions Evaluated:  {len(SAMPLE_DATASET)}")
        print(f"Unique Records Stored:        {unique_stored}")
        print(f"Exact Duplicates Prevented:   {duplicates_rejected}")
        print(f"Near Duplicates Prevented:    {near_duplicates_rejected}")
        print(f"Records Queued for Review:    {reviews_flagged}")
        print(f"Invalid Records Blocked:      {invalids_rejected}")
        print("=" * 80 + "\n")

    finally:
        db.close()

if __name__ == "__main__":
    seed_database()
