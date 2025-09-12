---
applyTo: '**'
---
Copilot Custom Instructions for Healthcare Backend
Project Summary
This repository implements a secure, scalable backend for managing healthcare records, supporting features like patient and doctor accounts, ABHA health ID integration, medical record storage, family linking, and QR-based data sharing. Compliance with data privacy laws such as HIPAA is required.

Tech Stack
Node.js with Express for backend APIs

TypeScript for static typing

PostgreSQL (or Google Cloud SQL/Firestore) for off-chain storage

Blockchain (Ethereum-compatible, use ethers.js/web3.js) for critical data

Google Cloud Run or App Engine for hosting

RESTful API standards, FHIR data model best practices

Coding Guidelines
Use modular directory structure (routes, controllers, services, models, utils)

Type all code and APIs explicitly (TypeScript)

Validate and sanitize user input, especially for medical data

Never store sensitive credentials in code; always load from environment/config or secret managers

Document endpoints, request/response schemas, and key validation logic

Where possible, maintain comprehensive automated tests (unit/integration) for all major endpoints

Project Structure
text
/src
  /routes
  /controllers
  /services
  /models
  /utils
/tests
Dockerfile
cloudbuild.yaml
README.md
.env.example
.github/copilot-instructions.md
Build, Test, and Validation
Always run npm install before building

Use npm run build or tsc to compile TypeScript

Launch dev server with npm run dev

Run all tests with npm test

Enforce linting before PRs with npm run lint

Check for environment variable requirements in .env.example

Validate Docker builds using docker build .

Ensure new endpoints are covered in OpenAPI or API docs

Security and Compliance
All code must conform to healthcare data privacy requirements (HIPAA/GDPR)

Sensitive operations (e.g., record access, sharing via QR) must have proper role validation and logging

Use HTTPS and always validate JWT or OAuth2/ABHA token for APIs

Store blockchain keys, database URLs, etc. using environment variables and cloud secret managers

Cloud Deployment
Prefer Cloud Run (containerized) or App Engine

Configure CI/CD via cloudbuild.yaml and Google Cloud IAM

Use Google Secret Manager for credentials

Database connection details should use secret manager or environment references