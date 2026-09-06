# Digital Certificate Verification System

An enterprise-grade, cryptographically verifiable digital certificate issuance, verification, and academic credential management platform built with React, Node.js/Express, TypeScript, Tailwind CSS, and PostgreSQL.

---

## 🌟 Features

### 1. Public Verification & Cryptographic Auditing
- **Instant Lookup**: Verify any academic certificate using either its unique Certificate ID (e.g. `CERT-2026-NITS-8841`) or its 64-character SHA-256 cryptographic hash.
- **Cryptographic Tamper Detection**: Computes a deterministic SHA-256 hash across immutable attributes (ID, recipient email, issuer name, event title, issue date) to detect unauthorized edits.
- **Tampering Simulator**: Test and demonstrate integrity checks by modifying simulated certificate attributes in real-time to watch verification fail when hashes mismatch.
- **Status Lifecycle**: Supports `Active`, `Revoked`, `Tampered`, and `Invalid` states with audit reasons and timestamps.
- **Scannable QR Codes**: Every certificate embeds a scannable verification payload linking directly to the authentic record.

### 2. Multi-Role Access Control
- **Student Portal**:
  - View personal earned credentials and download print-ready PDF certificates.
  - Submit external credentials (AWS, Coursera, NPTEL) with file attachments for faculty review.
  - Track activity points and achievement tiers (**Diamond**, **Platinum**, **Gold**, **Silver**).
  - Browse and register for academic hackathons, workshops, and symposiums.
- **Faculty / Issuer Console**:
  - Issue cryptographically signed digital certificates with custom grades and metadata.
  - Host inter-institutional academic hackathons and courses.
  - Review, approve, or reject student-submitted external certificates with reward point allocation (+25 to +100 points).
  - Revoke certificates with recorded audit justification and timestamps.
- **Super Administrator Console**:
  - System-wide governance across all institutions, issuers, and students.
  - Accredit and onboard new universities, autonomous colleges, and certifying authorities.
  - Real-time audit logs of every certificate query and verification attempt.
  - High-level system statistics (issuance rates, active vs. revoked ratios, accredited bodies).

### 3. Academic Events & Competitions
- Catalog of collegiate hackathons, symposiums, workshops, and professional courses.
- Activity point rewards tied to event participation and winning placements.
- Integrated issuance modal to issue bulk or individual certificates to event participants.

### 4. Accredited Institutions Directory
- Directory of accredited higher education institutions and certification bodies.
- Institution codes, verification status badges, contact emails, and external web portals.

### 5. Competitive Student Leaderboard
- Real-time ranking of students across departments and institutions.
- Top-3 podium visualization with medal badges.
- Filtering by department and quick search.

### 6. Official PDF Certificate Generation
- High-fidelity PDF export with formal typography, official gold seal, institution branding, authorized signature, and embedded verification QR code.

---

## 🏗️ Architecture & Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 18, TypeScript, Vite, Tailwind CSS, Lucide React |
| **Backend** | Express.js, TypeScript, tsx, esbuild |
| **Database** | PostgreSQL (Embedded PGlite engine with relational schemas) |
| **Cryptography** | Node.js / Web Crypto SHA-256 hashing |
| **Document Export** | jsPDF, html2canvas, qrcode |

---

## 📁 Project Structure
