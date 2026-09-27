import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from backend.app.main import app
from backend.app.database import Base, get_db
from backend.app.models import Record

# Use in-memory SQLite for blazing fast, isolated automated testing
SQLALCHEMY_TEST_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    SQLALCHEMY_TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

@pytest.fixture(scope="function")
def db_session():
    Base.metadata.create_all(bind=engine)
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(bind=engine)

@pytest.fixture(scope="function")
def client(db_session):
    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


# ==============================================================================
# 1. Valid Unique Record Test
# ==============================================================================
def test_valid_unique_record(client):
    payload = {
        "name": "Sarah Connor",
        "email": "sarah.connor@skyvault.io",
        "phone": "+1 415 555 2671",
        "address": "404 Cyberdyne Way, Los Angeles",
        "category": "Customer",
        "description": "Verified VIP client"
    }
    response = client.post("/records", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["status"] == "UNIQUE"
    assert data["action"] == "stored"
    assert data["record_id"] is not None
    assert data["similarity_score"] == 0.0


# ==============================================================================
# 2. Exact Duplicate Test (Identical incoming record)
# ==============================================================================
def test_exact_duplicate_detection(client):
    initial = {
        "name": "Rahul Kumar",
        "email": "rahul@gmail.com",
        "phone": "9876543210",
        "address": "MG Road, Bangalore",
        "category": "Customer"
    }
    r1 = client.post("/records", json=initial)
    assert r1.status_code == 201
    assert r1.json()["status"] == "UNIQUE"

    # Submit exact same record
    r2 = client.post("/records", json=initial)
    assert r2.status_code == 201
    data = r2.json()
    assert data["status"] == "EXACT_DUPLICATE"
    assert data["action"] == "rejected"
    assert data["similarity_score"] >= 98.0
    assert "already exists" in data["reason"].lower()


# ==============================================================================
# 3. Near Duplicate Test (Minor formatting/casing/whitespace variations)
# ==============================================================================
def test_near_duplicate_detection(client):
    initial = {
        "name": "Rahul Kumar",
        "email": "rahul@gmail.com",
        "phone": "9876543210",
        "address": "Bangalore"
    }
    client.post("/records", json=initial)

    # Incoming with extra spaces, uppercase, +91 phone formatting
    near_dup = {
        "name": "  Rahul   Kumar  ",
        "email": "RAHUL@GMAIL.COM",
        "phone": "+91 98765 43210",
        "address": "Bangalore"
    }
    response = client.post("/records", json=near_dup)
    assert response.status_code == 201
    data = response.json()
    # Normalized version becomes identical or near duplicate
    assert data["status"] in ["EXACT_DUPLICATE", "NEAR_DUPLICATE"]
    assert data["action"] == "rejected"
    assert data["similarity_score"] >= 90.0


# ==============================================================================
# 4. False Positive Test (Same name, but different email and phone)
# ==============================================================================
def test_false_positive_discrimination(client):
    record1 = {
        "name": "Arun Kumar",
        "email": "arun@gmail.com",
        "phone": "9876512345",
        "address": "Chennai, Tamil Nadu"
    }
    client.post("/records", json=record1)

    # Record with identical name but distinct email & phone
    record2 = {
        "name": "Arun Kumar",
        "email": "arun123@gmail.com",
        "phone": "9123456789",
        "address": "Coimbatore, Tamil Nadu"
    }
    response = client.post("/records", json=record2)
    assert response.status_code == 201
    data = response.json()
    assert data["status"] == "REVIEW_REQUIRED"
    assert data["action"] == "review_required"
    assert "identifying fields" in data["reason"].lower()
    assert data["record_id"] is not None


# ==============================================================================
# 5. Invalid Email Format Test
# ==============================================================================
def test_invalid_email_format(client):
    invalid_record = {
        "name": "John Doe",
        "email": "invalid-email-at-domain",
        "phone": "9876543210"
    }
    response = client.post("/records", json=invalid_record)
    assert response.status_code == 422
    assert "Invalid email format" in str(response.json())


# ==============================================================================
# 6. Invalid Phone Number Test
# ==============================================================================
def test_invalid_phone_number(client):
    invalid_phone = {
        "name": "Jane Smith",
        "email": "jane@example.com",
        "phone": "123"  # too short
    }
    response = client.post("/records", json=invalid_phone)
    assert response.status_code == 422
    assert "Invalid phone number" in str(response.json())


# ==============================================================================
# 7. Empty Required Field Test
# ==============================================================================
def test_empty_required_field(client):
    empty_name = {
        "name": "   ",
        "email": "test@example.com",
        "phone": "9876543210"
    }
    response = client.post("/records", json=empty_name)
    assert response.status_code == 422
    assert "Name is required" in str(response.json())


# ==============================================================================
# 8. Manual Approval Workflow Test
# ==============================================================================
def test_manual_approval(client):
    # Create record that flags for review
    r1 = {
        "name": "Arun Kumar",
        "email": "arun@gmail.com",
        "phone": "9876512345",
    }
    client.post("/records", json=r1)

    r2 = {
        "name": "Arun Kumar",
        "email": "arun.distinct@gmail.com",
        "phone": "9123456780",
    }
    res = client.post("/records", json=r2)
    record_id = res.json()["record_id"]
    assert res.json()["status"] == "REVIEW_REQUIRED"

    # Approve record
    approval_resp = client.post(
        f"/records/{record_id}/approve",
        json={"action": "APPROVE", "notes": "Verified distinct identity via employee badge."}
    )
    assert approval_resp.status_code == 200
    assert approval_resp.json()["status"] == "APPROVED"


# ==============================================================================
# 9. Manual Rejection Workflow Test
# ==============================================================================
def test_manual_rejection(client):
    r1 = {
        "name": "David Miller",
        "email": "david@cloud.org",
        "phone": "9876511111",
    }
    client.post("/records", json=r1)

    r2 = {
        "name": "David Miller",
        "email": "david.corp@cloud.org",
        "phone": "9876522222",
    }
    res = client.post("/records", json=r2)
    record_id = res.json()["record_id"]

    # Reject record
    reject_resp = client.post(
        f"/records/{record_id}/reject",
        json={"action": "REJECT", "notes": "Confirmed duplicate person."}
    )
    assert reject_resp.status_code == 200
    assert reject_resp.json()["action"] == "rejected"

    # Verify removed from records
    get_resp = client.get(f"/records/{record_id}")
    assert get_resp.status_code == 404


# ==============================================================================
# 10. Search API Test
# ==============================================================================
def test_search_api(client):
    client.post("/records", json={
        "name": "Priya Sharma",
        "email": "priya.sharma@fintech.in",
        "phone": "9823012345",
        "category": "Partner"
    })
    client.post("/records", json={
        "name": "Amit Patel",
        "email": "amit.patel@logistics.com",
        "phone": "9823099999",
        "category": "Vendor"
    })

    search_res = client.get("/records/search?q=priya")
    assert search_res.status_code == 200
    results = search_res.json()
    assert len(results) == 1
    assert results[0]["name"] == "Priya Sharma"


# ==============================================================================
# 11. Statistics API Test
# ==============================================================================
def test_statistics_api(client):
    # Unique record
    client.post("/records", json={
        "name": "Original Record",
        "email": "original@domain.com",
        "phone": "9876500001",
        "category": "Customer"
    })

    # Exact duplicate attempt
    client.post("/records", json={
        "name": "Original Record",
        "email": "original@domain.com",
        "phone": "9876500001",
        "category": "Customer"
    })

    stats_resp = client.get("/records/stats")
    assert stats_resp.status_code == 200
    stats = stats_resp.json()
    assert stats["total_records"] == 1
    assert stats["unique_records"] == 1
    assert stats["duplicates_rejected"] == 1
    assert stats["records_requiring_review"] == 0
