# Africa University Student Portfolio & Recommendation System (AURECO)

> **Official Student Credentialing, AI Recommendation Letter, and Smart Opportunities Platform**  
> Developed for Africa University (AU) by the College of Engineering and Technology (CS/IS).

---

## 🌟 Overview

The **Africa University Student Portfolio & Recommendation System (AURECO)** is a unified academic credential and career acceleration platform designed specifically for Africa University students, faculty, alumni, and employer partners.

### Core Capabilities

1. **Verified Academic Portfolios & Transcripts**:
   - Official GPA and semester-by-semester course performance tracking.
   - Verified student projects, technical proficiencies, leadership roles, and honors.
   - Public shareable profiles (`#/p/:schoolId`) with tamper-evident digital verification tokens.

2. **Faculty Recommendation Letter Workflow**:
   - Students request confidential or open letters from lecturers and academic advisors.
   - Lecturers view student dossiers with one-click access to GPA, transcripts, and faculty comments.
   - **AI-Assisted Letter Drafting**: Generates context-rich, professional recommendation letters referencing authentic AU coursework and accomplishments.
   - Automated letterhead PDF compilation with digital signature and verification QR codes.

3. **Smart Opportunities & Internships Board**:
   - Curated internship, fellowship, and research postings from top regional employers (e.g., Econet, Cassava Smartech) and AU research labs.
   - Intelligent GPA and skill-matching algorithm displaying real-time compatibility scores.
   - 1-Click "Apply with Verified Portfolio" submitting certified credentials directly to opportunity posters.

4. **Dual-Path Supervisor Account Creation & Access**:
   - Self-registration with institutional verification and admin approval workflows.
   - Seamless applicant dossier previews without cross-portal session conflicts.

---

## 👥 Development Team & Collaborators

| Collaborator | GitHub Username | University Email | Role & Module Ownership |
| :--- | :--- | :--- | :--- |
| **Tendai Mushayapokuvaka** | [`mushayapokuvakat-ai`](https://github.com/mushayapokuvakat-ai) | `mushayapokuvakat@africau.edu` | **Project Lead & Monorepo Architect**: Root orchestration, public tunnel launchers, security audits, and release pipelines. |
| **T. Manyika** | [`tmanyika487`](https://github.com/tmanyika487) | `tmanyika@africau.edu` | **Backend Core & Database**: Neon PostgreSQL schema, database migrations, connection pooling, seed fixtures, and Express server bootstrap. |
| **Shaniel Mpofu** | [`leniash`](https://github.com/leniash) | `shaniel.mpofu@africau.edu` | **Authentication & Security**: JWT session management, RBAC authorization middleware, password hashing, and dual-path supervisor provisioning. |
| **Mutovol** | [`mutovol-tech`](https://github.com/mutovol-tech) | `mutovol@africau.edu` | **AI Services & Communications**: Groq/Gemini AI letter generation service, AU letterhead PDF compiler, and automated SMTP email notification pipeline. |
| **Kinnah Nyamapfene** | [`1kinnah`](https://github.com/1kinnah) | `nyamapfenet@africau.edu` | **UI/UX & Frontend Portals**: Responsive SPA shell, interactive transcripts, applicant preview modals, and the Smart Opportunities & Internships board. |

---

## 🏗️ System Architecture

```text
┌────────────────────────────────────────────────────────────────────────┐
│                        AURECO Unified Monorepo                         │
├──────────────────────────────────┬─────────────────────────────────────┤
│      AURECO_FRONT (Client)       │        AURECO_BACK (API Server)     │
│                                  │                                     │
│  • Pure Vanilla HTML5/CSS3/ES6+  │  • Node.js & Express REST API       │
│  • Client-Side Hash Router       │  • Neon Serverless PostgreSQL Pool  │
│  • Role-Based UI Rendering       │  • JWT Authentication & RBAC        │
│    (Student, Staff, Supervisor,  │  • AI Letter Synthesis (Groq/Gemini)│
│     Admin, Public Recruiter)     │  • Nodemailer & Brevo Mail Delivery │
│  • Dynamic GPA Match Engine      │  • PDFKit AU Letterhead Generator   │
└──────────────────────────────────┴─────────────────────────────────────┘
```

---

## 🚀 Quick Start Guide

### Prerequisites
- Node.js (v18.0.0 or higher recommended)
- Git

### 1-Click Launch (Recommended for Windows)
Simply double-click:
```cmd
run-public-showcase.bat
```
This launcher automatically:
1. Installs backend dependencies (if needed).
2. Verifies the Neon database connection.
3. Boots the Express API server on `http://localhost:5000`.
4. Launches a zero-config Cloudflare tunnel providing a secure public HTTPS URL.
5. Launches the frontend portal on `http://localhost:8080`.

### Manual Setup

#### 1. Backend Server
```bash
cd AURECO_BACK
cp .env.example .env
npm install
npm run migrate
npm run seed
npm start
```

#### 2. Frontend Portal
Serve `AURECO_FRONT` using any standard HTTP server (or Live Server):
```bash
cd AURECO_FRONT
npx serve -l 8080 .
```

---

## 🔒 Security & Data Integrity
- Passwords hashed using `bcryptjs` with high salt rounds.
- Strict Role-Based Access Control (`student`, `staff`, `supervisor`, `admin`).
- Database secrets and private keys isolated in `.env` (excluded from version control).
- Automatic database connection resilience and fallback mechanisms.

---

## 📄 License
Africa University College of Engineering and Technology (CET). All rights reserved.
