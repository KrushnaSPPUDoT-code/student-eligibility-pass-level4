# Private Student Eligibility Pass — Product Proposal

## 1. Product Idea

Private Student Eligibility Pass is a privacy-preserving credential application built on the Midnight blockchain.

The application allows a student to hold academic eligibility information privately and prove that they satisfy predefined eligibility requirements without publicly revealing the underlying academic values.

For this Level 3 implementation, the eligibility requirements are:

- CGPA >= 8.00
- Attendance >= 75%

A student can prove eligibility without exposing their exact CGPA or attendance percentage to observers.

## 2. Problem

Students frequently need to prove that they satisfy academic requirements for scholarships, internships, programs, applications, and other opportunities.

Traditional verification requires sharing sensitive academic information such as:

- CGPA
- Attendance
- Academic credentials

This reveals more information than the verifier actually needs.

For example, if an opportunity only requires a CGPA of at least 8.00, the verifier does not need to know whether the student's CGPA is 8.21, 9.10, or 9.80.

## 3. Proposed Solution

The Student Eligibility Pass stores the student's eligibility-related information as private state and uses a Midnight smart contract to verify eligibility.

The student can:

1. Issue a credential.
2. Keep the academic values private.
3. Generate an eligibility proof.
4. Demonstrate that the eligibility conditions are satisfied.
5. Revoke the credential when required.

The proof verifies the required conditions without revealing the underlying academic values.

## 4. Privacy Model

Privacy is the core feature of the product.

### Private information

The following information is intended to remain private to the credential holder:

- Exact CGPA
- Exact attendance percentage
- Other private credential state used to evaluate eligibility

### What an observer can learn

An observer can learn that an eligibility verification/proof operation occurred and can observe public blockchain information associated with the contract and transaction.

### What an observer cannot learn

An observer should not be able to derive the student's exact:

- CGPA
- Attendance percentage
- Private credential state

The purpose of the application is therefore to prove a statement about the student's eligibility rather than disclose the underlying academic records.

## 5. Target Users

The primary users are:

- Students
- Universities and educational institutions
- Scholarship providers
- Internship and program administrators
- Organizations that need eligibility verification

## 6. Example Use Case

Suppose a scholarship requires:

- CGPA >= 8.00
- Attendance >= 75%

A student with:

- CGPA = 8.70
- Attendance = 87%

can prove that they satisfy the requirements without revealing those exact numbers to the observer.

The verifier receives the eligibility result rather than the student's complete academic record.

## 7. Midnight Technology

The application uses the Midnight privacy model and Compact smart contracts.

The Level 3 implementation includes:

- Compact smart contract
- Midnight SDK integration
- Private state handling
- Eligibility proof circuit
- Credential issuance
- Credential revocation
- Browser-based frontend
- Midnight Preprod network support

## 8. Level 3 Functionality

The implemented contract provides the following core operations:

- `issueCredential`
- `proveEligibility`
- `revokeCredential`

The project includes automated contract tests and CI/CD workflows.

## 9. Success Criteria

The product is successful when a student can:

1. Connect their Midnight wallet.
2. Issue a private eligibility credential.
3. Prove eligibility against the required thresholds.
4. Receive a successful eligibility verification result.
5. Keep the underlying academic values private.

## 10. Future Scope

Future versions can support:

- Multiple credential types
- University-issued credentials
- Different eligibility policies
- Scholarship-specific requirements
- Internship and program verification
- Credential expiration
- Selective disclosure
- Verifier-facing interfaces
- Additional privacy-preserving academic attributes
