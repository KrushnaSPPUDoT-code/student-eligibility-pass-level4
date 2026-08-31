# Student Eligibility Pass

[![CI](../../actions/workflows/ci.yaml/badge.svg)](../../actions/workflows/ci.yaml)

A privacy-preserving student eligibility dApp built on the [Midnight Network](https://midnight.network/).

Student Eligibility Pass allows a student to prove that they satisfy academic eligibility requirements without revealing their exact CGPA or attendance.

The project demonstrates Midnight's privacy model, Compact smart contracts, private state, witnesses, and zero-knowledge proofs.

---

## 🎯 Project Overview

Educational institutions may need to verify whether a student satisfies requirements such as:

- Minimum CGPA
- Minimum attendance

Traditional verification requires students to disclose their actual academic values.

**Student Eligibility Pass allows a student to prove eligibility without revealing the underlying CGPA or attendance values.**

### Eligibility Requirements

| Requirement | Threshold |
|---|---:|
| CGPA | ≥ 8.00 |
| Attendance | ≥ 75% |

The student's actual academic values are maintained in private state and accessed by the Compact contract through witness functions.

---

## ✨ Features

- 🔐 Privacy-preserving eligibility verification
- 🎓 Student eligibility credential
- 🧾 Credential issuance
- ✅ Zero-knowledge eligibility proof
- 🔄 Credential revocation
- 📊 Public credential status
- 🔢 Credential version tracking
- 👛 Midnight wallet integration
- 🌐 Midnight Preprod support
- ⚡ React + TypeScript frontend
- 🧩 Compact smart contract
- 📋 Contract address display and copy functionality

---

## 🔒 Privacy Model

Privacy is the central purpose of Student Eligibility Pass.

### Private Information

The following information remains private:

- Student CGPA
- Student attendance
- Student secret/private state

The student's exact academic values do not need to be published to the blockchain.

Witness functions provide the private values to the Compact circuit when generating the eligibility proof.

### What a Blockchain Observer Can Learn

An observer can see publicly observable information such as:

- Contract address
- Public contract state
- Credential status
- Credential version
- Public transaction information
- Public state resulting from contract operations

### What an Observer Cannot Learn

The eligibility proof does not reveal the student's exact:

- CGPA
- Attendance

For example, the student can prove:

```text
CGPA ≥ 8.00
Attendance ≥ 75%
```

without publishing values such as:

```text
CGPA = 8.50
Attendance = 85%
```

The purpose of the zero-knowledge proof is to demonstrate that the required conditions are satisfied without revealing the underlying private values.

🧪 How the Privacy Proof Works
Student
   │
   │ Private CGPA + Attendance
   ▼
Private State
   │
   │ Witness Functions
   ▼
Compact Smart Contract
   │
   │ Eligibility Circuit
   ▼
Zero-Knowledge Proof
   │
   ▼
Midnight Network
   │
   ├── Public Credential Status
   ├── Credential Version
   └── Public Transaction State
Step-by-step
The student's academic information is stored in private state.
Witness functions provide the private values to the Compact circuit.
The eligibility circuit evaluates the required conditions.
Midnight generates a zero-knowledge proof.
The blockchain records the appropriate public state and transaction information.
The exact CGPA and attendance values remain private.
🏗️ Architecture
                    Student
                       │
                       ▼
              Midnight Wallet
                       │
                       ▼
             React + TypeScript UI
                       │
                       ▼
                Midnight.js API
                       │
                       ▼
              Compact Smart Contract
                       │
          ┌────────────┼────────────┐
          │            │            │
          ▼            ▼            ▼
       Issue        Prove        Revoke
     Credential   Eligibility   Credential
                       │
                       ▼
              Zero-Knowledge Proof
                       │
                       ▼
                Midnight Preprod
📁 Project Structure
student-eligibility-pass-level3/
│
├── contract/
│   └── src/
│       ├── bboard.compact
│       ├── index.ts
│       ├── witnesses.ts
│       └── managed/
│
├── api/
│   └── src/
│       ├── index.ts
│       └── common-types.ts
│
├── bboard-ui/
│   ├── src/
│   │   ├── App.tsx
│   │   ├── components/
│   │   ├── contexts/
│   │   └── hooks/
│   └── public/
│
└── README.md
⚙️ Prerequisites

Install:

Node.js
npm
Docker Desktop
Midnight Compact compiler
Midnight-compatible wallet

The application is designed to work with the Midnight Preprod network.

🚀 Installation

Clone the repository:

git clone https://github.com/KrushnaSPPUDoT-code/student-eligibility-pass-level3.git
cd student-eligibility-pass-level3

Install dependencies:

npm install
🧪 Run Tests

Run the contract test suite:

cd contract
npm test -- --run

The current test suite contains 9 tests covering:

Credential initialization
Credential issuance
Successful eligibility proof
Insufficient CGPA rejection
Insufficient attendance rejection
Duplicate credential prevention
Credential revocation
Proof without an active credential
Proof after credential revocation
🔍 Validation

Run the complete workspace checks:

npm run ci --workspace api
npm run ci --workspace contract
npm run ci --workspace bboard-ui

These checks perform TypeScript validation, linting, builds, and contract tests.

🌐 Application Flow

The application provides the following flow:

Connect the Midnight wallet.
Create or load the Student Eligibility Pass contract.
Issue an eligibility credential.
Generate a privacy-preserving eligibility proof.
View the public credential status.
Revoke the credential when required.

The exact academic values remain private during eligibility verification.

🔐 Smart Contract Operations

The Compact smart contract provides three primary operations:

issueCredential

Issues a credential when the student's private academic information satisfies the eligibility requirements.

proveEligibility

Generates a proof that the student satisfies the required conditions without exposing the exact CGPA or attendance.

revokeCredential

Revokes an active eligibility credential.

🧪 Test Results

The current contract test suite contains:

Test Files  1 passed (1)
Tests       9 passed (9)

The tests verify both successful and rejected eligibility scenarios.

🔄 CI/CD

The repository includes a GitHub Actions workflow that automatically validates the project.

The CI pipeline checks the project's TypeScript, linting, build, and testing requirements.

Repository:

https://github.com/KrushnaSPPUDoT-code/student-eligibility-pass-level3

🎥 Demo

A live demonstration and demo video will be provided as part of the project submission.

The demonstration covers:

Wallet connection
Credential creation
Eligibility proof
Privacy-preserving verification
Credential revocation
📜 License

This project is based on Midnight's example dApp structure and is intended for educational and demonstration purposes.

## 🔗 Midnight Preprod Contract

The Student Eligibility Pass contract is deployed on the **Midnight Preprod network**.

**Preprod Contract Address:**

`0200dbf964f541e1950883f5b2f539b66fd6111e46ce8e6e9551fbdd180114d5dd5b`

The frontend supports displaying and copying the deployed contract address for verification and joining an existing deployment.
