# AURECO: Africa University Student Portfolio & Recommendation System

**Course:** Web Technologies 
**Group:** 3

## Team Members

| # | Name | Registration No. | Email |
|---|------|------------------|-------|
| 1 | Tanatswa MANYIKA | [250503] | [tmanyika@africau.edu] |
| 2 | Learnmore MUTOVO | [250607] | [mutovol@africau.edu] |
| 3 | Shaniel MPOFU | [250858] | [shaniel.mpofu@africau.edu] |
| 4 | Tendai MUSHAYAPOKUVAKA | [250933] | [mushayapokuvakat@africau.edu] |
| 5 | Tawananyasha NYAMAPFENE | [250634] | [nyamapfenet@africau.edu] |

## Abstract

AURECO is a web-based student portfolio and AI-assisted recommendation system for Africa University. Students often struggle to prove their achievements, and lecturers and supervisors spend time verifying records and writing recommendation letters from scratch. AURECO keeps verified academic records and student-reported activities in one place. Registration is checked against official university registry records, confirmed with an emailed code, and approved by an administrator. The administrator enters grades and other academic details, while students add their own activities and projects. A student requests a recommendation from a staff member or supervisor. Google Gemini AI drafts a letter from the verified record and audits the student's portfolio, and the reviewer edits and approves every letter before the student is notified by email. The system supports four roles: student, staff, supervisor and administrator, each with its own permissions. It is built with Node.js and Express, a Neon PostgreSQL database and a web frontend, hosted on Render and Vercel. Security measures include bcrypt password hashing, JWT authentication, role-based access control and encrypted connections. A privacy policy and cookie notice explain how personal data, including data sent to the AI service, is handled.

## Repository Structure

- `AURECO_BACK/`: backend (Node.js, Express, PostgreSQL)
- `AURECO_FRONT/`: frontend
