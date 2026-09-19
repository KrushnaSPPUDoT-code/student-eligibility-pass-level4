# Privacy and Security

## Privacy Model

TrustPass is designed to prove financial eligibility without exposing the user’s exact financial values on the public ledger.

The application uses private witness data for:

- Annual income
- Credit score
- Total debt

These values are supplied to the Compact circuits during the proving process.

## Eligibility Conditions

The MVP checks three private conditions:

- Annual income >= ₹6,00,000
- Credit score >= 700
- Debt-to-income ratio <= 40%

A user is eligible only when all three conditions are satisfied.

## Compact Circuits

The contract provides three main circuits:

- `issueCredential` — checks the private eligibility conditions and activates the credential.
- `proveEligibility` — verifies that the active credential satisfies the eligibility conditions.
- `revokeCredential` — deactivates the credential and increments the credential version.

## Public Ledger State

The contract exposes limited state required for the credential:

- `active`
- `credentialVersion`
- `credentialCommitment`
- `issuer`

The public ledger does not contain ordinary fields for the user’s income, credit score, or total debt.

## Private Witnesses

The application supplies the financial values through private witnesses:

- `userIncome`
- `userCreditScore`
- `userDebt`

The proof checks the required conditions without requiring the exact financial values to be written as public ledger fields.

## Logging

The API deployment flow is designed not to log private financial values or private secrets during deployment.

## Scope

TrustPass is an educational Level 4 MVP demonstrating privacy-preserving financial eligibility on the Midnight Preprod network. It should not be treated as a production financial, lending, or credit-assessment system.
