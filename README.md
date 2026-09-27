# CloudVault – Cloud-Based Data Redundancy Removal and Data Validation System

> **CodeAlpha Cloud Computing Internship — Project Submission**  
> *A production-grade, cloud-architected data cleansing and validation platform featuring multi-stage Levenshtein fuzzy matching, exact duplicate prevention, false-positive mitigation, and a human-in-the-loop manual review workflow.*

---

## 📌 1. Project Overview & Problem Statement

Modern enterprise cloud architectures ingest millions of records across customer forms, partner feeds, CRM migrations, and IoT pipelines. Unchecked data ingestion results in **severe data redundancy**, including:
1. **Identical / Exact Duplicates:** Redundant submissions wasting database storage and compute bandwidth.
2. **Near Duplicates:** Records differing only by capitalization, excess whitespace, telephone formatting (`+91 98765 43210` vs `9876543210`), or minor typographical errors.
3. **False Positives:** Naive deduplication algorithms erroneously reject unique individuals who happen to share common names (e.g. *Arun Kumar*, *David Miller*) despite possessing completely distinct emails and phone numbers.
4. **Data Corruption & Invalid Formats:** Incomplete records, malformed email addresses, and truncated phone numbers polluting production databases.

### Objectives
- **Automated Validation:** Intercept and validate all incoming records before database ingestion.
- **Normalization Engine:** Standardize text, casing, whitespace, and telephone numbers to canonical formats.
- **Multi-Stage Redundancy Detection:** Calculate Levenshtein and token-sort similarity scores ($0 - 100\%$) using **RapidFuzz**.
- **Configurable Redundancy Thresholds:**
  - $\ge 90\%$: **NEAR DUPLICATE** $\rightarrow$ Automatic Rejection
  - $70\% - 89\%$: **REVIEW REQUIRED** $\rightarrow$ Flagged for Human Review
  - $< 70\%$: **UNIQUE** $\rightarrow$ Stored in Database
- **False-Positive Mitigation:** Detect name collisions with distinct credentials and route them to a dedicated review workspace.
- **Production Cloud Architecture:** Built with **FastAPI**, **PostgreSQL / SQLAlchemy**, **React (Vite)**, and **Docker**.

---

## 🏗️ 2. System Architecture

```
                                  [ Users / Client Web Apps ]
                                               │
                                               ▼
                              ┌──────────────────────────────────┐
                              │    React 18 + Vite Dashboard     │
                              │ (Nginx Alpine / AWS S3 + CF CDN) │
                              └──────────────────────────────────┘
                                               │
                                       HTTP REST / JSON
                                               ▼
                              ┌──────────────────────────────────┐
                              │       FastAPI ASGI Server        │
                              │    (Docker / AWS ECS Fargate)    │
                              └──────────────────────────────────┘
                                               │
                        ┌──────────────────────┴──────────────────────┐
                        ▼                                             ▼
       ┌─────────────────────────────────┐           ┌─────────────────────────────────┐
       │   7-Stage Cleansing Pipeline    │           │    SQLAlchemy 2.0 ORM Engine    │
       │  - Regex / RFC 5322 Validator   │           │   - Indexed Canonical Lookups   │
       │  - NFKC Text & Phone Normalizer │           │   - Connection Pool & Retry     │
       │  - Exact Match Hash Check       │           └─────────────────────────────────┘
       │  - RapidFuzz Multi-Field Scorer │                            │
       │  - False-Positive Classifier    │                            ▼
       └─────────────────────────────────┘           ┌─────────────────────────────────┐
                        │                            │      PostgreSQL Database        │
                        ▼                            │        (cloudvault_db)          │
       ┌─────────────────────────────────┐           │   - records table               │
       │     Decision & Action Engine    │           │   - audit_logs table            │
       │  • UNIQUE ──> [STORE]           │           └─────────────────────────────────┘
       │  • DUPLICATE ──> [REJECT]       │
       │  • REVIEW ──> [MANUAL QUEUE]    │
       └─────────────────────────────────┘
```

---

## ⚙️ 3. Duplicate Detection Methodology

The duplicate detection pipeline follows a deterministic 4-stage pipeline:

```mermaid
graph TD
    A[Incoming Record Submission] --> B[Data Validation: RFC 5322 Email & Phone Digits]
    B -->|Invalid| C[Reject with 422 Unprocessable Entity & Log Audit]
    B -->|Valid| D[Normalization: NFKC, Lowercase, Space Collapse, Phone Digits Extraction]
    D --> E{Exact Match Check: Email + Phone + Name}
    E -->|Exact Match Found| F[Status: EXACT_DUPLICATE | Action: REJECT 100%]
    E -->|No Exact Match| G[RapidFuzz Multi-Field Scoring across Active Candidates]
    G --> H{False Positive Analysis: Name Sim >= 85% & Credentials Differ}
    H -->|Yes: Name match, Diff Email/Phone| I[Status: REVIEW_REQUIRED | Action: QUEUE_FOR_REVIEW]
    H -->|No| J{Weighted Score Threshold Evaluation}
    J -->|Score >= 90%| K[Status: NEAR_DUPLICATE | Action: REJECT]
    J -->|70% <= Score < 90%| L[Status: REVIEW_REQUIRED | Action: QUEUE_FOR_REVIEW]
    J -->|Score < 70%| M[Status: UNIQUE | Action: STORE TO DATABASE]
```

### Multi-Field Weighted Formula
$$\text{Similarity Score} = 0.35 \times S_{\text{name}} + 0.35 \times S_{\text{email}} + 0.20 \times S_{\text{phone}} + 0.10 \times S_{\text{address}}$$

Where:
- $S_{\text{name}}$: `fuzz.token_sort_ratio(norm_name_1, norm_name_2)` (handles word reordering e.g., "Kumar Rahul" vs "Rahul Kumar").
- $S_{\text{email}}$: Weighted email ratio ($70\%$ local username match + $30\%$ domain match to avoid false inflation from common domains like `@gmail.com`).
- $S_{\text{phone}}$: Exact canonical digits comparison ($100\%$) or normalized string ratio.
- $S_{\text{address}}$: Token-set ratio for geographic similarity.

---

## 🗄️ 4. Database Schema Design

Database: **`cloudvault_db`**

### `records` Table
| Column Name | Data Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `INTEGER` | PRIMARY KEY, AUTO_INCREMENT | Unique internal identifier |
| `name` | `VARCHAR(255)` | NOT NULL | User submitted full name |
| `email` | `VARCHAR(255)` | NOT NULL, INDEXED | User submitted email |
| `phone` | `VARCHAR(50)` | NOT NULL, INDEXED | User submitted phone number |
| `address` | `TEXT` | NULLABLE | Physical location or address |
| `category` | `VARCHAR(100)` | NOT NULL, DEFAULT 'Customer' | Business categorization |
| `description` | `TEXT` | NULLABLE | Notes or lead details |
| `normalized_name` | `VARCHAR(255)` | NOT NULL, INDEXED | Stripped, lowercase canonical name |
| `normalized_email`| `VARCHAR(255)` | NOT NULL, INDEXED | Lowercase canonical email |
| `normalized_phone`| `VARCHAR(50)` | NOT NULL, INDEXED | Standard 10-digit/E.164 digits |
| `similarity_score`| `FLOAT` | NOT NULL, DEFAULT 0.0 | Calculated redundancy score |
| `status` | `VARCHAR(50)` | NOT NULL, INDEXED | `UNIQUE`, `EXACT_DUPLICATE`, `NEAR_DUPLICATE`, `REVIEW_REQUIRED`, `APPROVED` |
| `matched_record_id`| `INTEGER` | NULLABLE | Existing record candidate ID |
| `review_reason` | `TEXT` | NULLABLE | Explanation of redundancy or review trigger |
| `created_at` | `TIMESTAMP WITH TZ`| INDEXED, DEFAULT NOW() | Ingestion timestamp |
| `updated_at` | `TIMESTAMP WITH TZ`| DEFAULT NOW() | Last update timestamp |

### `audit_logs` Table
Tracks every single submission event (stored, rejected exact duplicate, rejected near duplicate, invalid input, approval, rejection) so historical metrics and prevention statistics persist accurately.

---

## 🚀 5. API Reference & Swagger Documentation

Interactive OpenAPI / Swagger UI is available at **`http://localhost:8000/docs`** and ReDoc at **`http://localhost:8000/redoc`**.

### Core Endpoints

#### 1. System Health Check
`GET /health`
```json
{
  "status": "healthy",
  "app_name": "CloudVault – Cloud-Based Data Redundancy Removal System",
  "version": "1.0.0",
  "database": "healthy",
  "timestamp": "2026-09-27T10:58:34.956784"
}
```

#### 2. Submit Record for Redundancy Check
`POST /records`
- **Request Body:**
```json
{
  "name": "Rahul Kumar",
  "email": "rahul@gmail.com",
  "phone": "+91 98765 43210",
  "address": "45 MG Road, Bangalore",
  "category": "Customer",
  "description": "Enterprise lead"
}
```

- **Response if Exact Duplicate:**
```json
{
  "status": "EXACT_DUPLICATE",
  "message": "Duplicate record detected",
  "similarity_score": 100.0,
  "existing_record_id": 1,
  "matched_record_id": 1,
  "action": "rejected",
  "reason": "Identical record already exists with matching name, email, and phone.",
  "matching_fields": ["name", "email", "phone"],
  "differing_fields": [],
  "field_scores": {"name": 100.0, "email": 100.0, "phone": 100.0, "address": 100.0}
}
```

- **Response if Unique:**
```json
{
  "status": "UNIQUE",
  "message": "Unique record verified successfully",
  "similarity_score": 32.5,
  "record_id": 25,
  "action": "stored",
  "reason": "Verified unique record."
}
```

- **Response if Review Required (False-Positive Discrimination):**
```json
{
  "status": "REVIEW_REQUIRED",
  "message": "Potential false positive flagged for manual review",
  "similarity_score": 80.8,
  "record_id": 26,
  "matched_record_id": 2,
  "action": "review_required",
  "reason": "High name similarity but important identifying fields differ."
}
```

#### 3. Aggregate Redundancy Statistics
`GET /records/stats`
```json
{
  "total_records": 15,
  "unique_records": 11,
  "duplicates_rejected": 5,
  "near_duplicates": 1,
  "records_requiring_review": 4,
  "categories": {
    "Customer": 5,
    "Enterprise": 3,
    "Engineering": 2,
    "Healthcare": 1
  },
  "recent_activity_count": 24
}
```

#### 4. Search Records
`GET /records/search?q=Rahul`

#### 5. Manual Approval / Rejection
- `POST /records/{id}/approve` $\rightarrow$ Promotes status to `APPROVED`
- `POST /records/{id}/reject` $\rightarrow$ Rejects and removes from active queue

---

## 💻 6. Local Development Setup

### Prerequisites
- Python 3.10+
- Node.js 18+ and npm
- (Optional) PostgreSQL or Docker

### 1. Clone & Configure Environment
```bash
git clone https://github.com/your-username/CloudVault.git
cd CloudVault
cp .env.example .env
```

### 2. Backend Setup
```bash
# Create virtual environment
python -m venv backend/venv

# Activate virtual environment
# Windows PowerShell:
.\backend\venv\Scripts\Activate.ps1
# Linux / macOS:
source backend/venv/bin/activate

# Install dependencies
pip install -r backend/requirements.txt

# Run database seed (Generates 23 realistic test records)
python database/seed.py

# Start FastAPI dev server
uvicorn backend.app.main:app --reload --host 127.0.0.1 --port 8000
```

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
Open **`http://localhost:5173`** in your browser.

---

## 🐳 7. Docker & Containerized Deployment

Run the entire stack with a single command:

```bash
docker compose up --build
```

This launches three containerized microservices:
1. **`cloudvault_postgres`**: PostgreSQL 15 database on port `5432` with volume persistence.
2. **`cloudvault_backend`**: FastAPI application on port `8000`.
3. **`cloudvault_frontend`**: Production React SPA served via Nginx Alpine on port `3000`.

To stop services:
```bash
docker compose down -v
```

---

## 🧪 8. Automated Testing Suite

CloudVault includes 11 automated test suites using `pytest` and FastAPI's `TestClient` with an isolated SQLite in-memory engine:

```bash
# Run automated tests
pytest -v
```

### Test Coverage Highlights:
- ✅ `test_valid_unique_record`: Verifies pristine unique record storage.
- ✅ `test_exact_duplicate_detection`: Validates 100% duplicate rejection.
- ✅ `test_near_duplicate_detection`: Validates casing, spaces, and phone formatting normalization.
- ✅ `test_false_positive_discrimination`: Validates that distinct individuals with identical names are flagged for manual review rather than rejected.
- ✅ `test_invalid_email_format`: Verifies RFC 5322 regex validation.
- ✅ `test_invalid_phone_number`: Rejects invalid length or non-digit numbers.
- ✅ `test_empty_required_field`: Rejects missing mandatory fields.
- ✅ `test_manual_approval`: Validates status promotion from `REVIEW_REQUIRED` to `APPROVED`.
- ✅ `test_manual_rejection`: Validates manual removal from review queue.
- ✅ `test_search_api`: Verifies multi-attribute keyword search.
- ✅ `test_statistics_api`: Verifies accurate redundancy metrics calculation.

---

## ☁️ 9. AWS Cloud Deployment Architecture

For production deployment on Amazon Web Services (AWS):

```
       [ Client Browser ]
               │
               ▼  Route 53 DNS + SSL Certificate (ACM)
       [ CloudFront CDN ]
               │
               ▼
       [ S3 Bucket ] (Static React Build)
               │
               ▼  API Requests (/api/*)
       [ Application Load Balancer (ALB) ]
               │
               ▼
       [ AWS ECS Fargate ] (FastAPI Backend Task Definition)
               │
               ▼  Private Subnet (VPC Security Group)
       [ AWS RDS PostgreSQL ] (Multi-AZ Database Instance)
```

### Step-by-Step AWS Setup:
1. **Database:** Provision an **AWS RDS PostgreSQL** instance (`cloudvault_db`), configure a Security Group allowing inbound traffic on port 5432 only from the backend ECS task.
2. **Backend API:**
   - Push backend Docker image to **AWS Elastic Container Registry (ECR)**:
     ```bash
     aws ecr get-login-password | docker login --username AWS --password-stdin <aws-account-id>.dkr.ecr.<region>.amazonaws.com
     docker build -t cloudvault-backend -f backend/Dockerfile .
     docker tag cloudvault-backend:latest <aws-account-id>.dkr.ecr.<region>.amazonaws.com/cloudvault-backend:latest
     docker push <aws-account-id>.dkr.ecr.<region>.amazonaws.com/cloudvault-backend:latest
     ```
   - Deploy as an **AWS ECS Fargate Task** or **AWS App Runner** service. Configure environment variables (`DATABASE_URL`, `SECRET_KEY`) securely using **AWS Secrets Manager**.
3. **Frontend:**
   - Run `npm run build` in `frontend/`.
   - Sync `dist/` to an **AWS S3 Bucket** configured for static website hosting.
   - Configure **AWS CloudFront** with SSL certificate from AWS Certificate Manager (ACM) for global low-latency distribution.

---

## 🔮 10. Future Enhancements

- **Vector Embeddings & Semantic Deduplication:** Integrate pgvector with lightweight embeddings (e.g. `sentence-transformers`) for multi-lingual semantic matching.
- **Bulk CSV / Parquet Ingestion Worker:** Asynchronous Celery + Redis worker pool for streaming high-throughput file uploads (100k+ records).
- **Webhooks & Event Bus:** AWS SNS/SQS event dispatch whenever a duplicate is prevented or a manual review is requested.
- **Role-Based Access Control (RBAC):** OAuth2 / JWT authentication separating standard data submitters from Review Officers.

---

## 📜 11. Internship Details

- **Program:** CodeAlpha Cloud Computing Internship
- **Task:** Task 1 – Cloud-Based Data Redundancy Removal System
- **Developer:** CodeAlpha Intern
- **License:** MIT License
