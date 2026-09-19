# TrustPass — Product Proposal

**Privacy-Preserving Financial Eligibility / Private Credit Risk Passport on Midnight**

## 1. Product Idea

TrustPass is a privacy-preserving financial eligibility credential built on the
Midnight blockchain. A user holds sensitive financial facts — annual income,
credit score, and total debt — **privately**, and can prove that they satisfy
predefined financial eligibility rules without publishing the exact values.

The MVP eligibility rules are:

- Income ≥ ₹600,000
- Credit Score ≥ 700
- Debt-to-Income Ratio ≤ 40%

A user proves "I meet all three requirements" without revealing any of the
underlying numbers to on-chain observers or verifiers.

## 2. Problem

Financial eligibility checks are everywhere:

- loan and credit applications
- credit-limit and BNPL approvals
- rent and lease agreements
- insurance underwriting
- employer-backed lending programs

Traditional verification forces the applicant to expose sensitive data such as
salary slips, credit reports, and full debt statements. This reveals more than
the verifier needs: if a lender only requires income ≥ ₹600,000, it should not
need to know the applicant's exact income. Broad disclosure increases identity
theft risk, discourages applicants, and is technically unnecessary when a
zero-knowledge proof can answer just the eligibility question.

## 3. Target Users

- Individuals applying for credit, loans, or rent
- Lenders and credit institutions that need eligibility verification
- Credit bureaus that want to issue verifiable eligibility credentials
- Any verifier that only needs a "pass/fail" eligibility decision

## 4. Proposed Solution

TrustPass keeps the user's financial values in **private state** and evaluates
eligibility inside a **Midnight Compact smart contract**:

1. The user enters income, credit score, and debt locally.
2. The contract's witnesses provide these values to the circuit privately.
3. The circuit asserts the three eligibility rules.
4. The result is a credential whose public state records only that the credential
   is active, its version, and issuance metadata.
5. The holder can later produce an eligibility proof and can revoke the
   credential when required.

## 5. Why Midnight

Midnight's Compact language + zero-knowledge proving is the enabling technology:

- **Private execution:** witnesses and private state never touch the public ledger.
- **Public verifiability:** the proof result and credential state are on-chain.
- **Programmable policy:** the eligibility rules are explicit Compact asserts.
- **Wallet user experience:** the Lace wallet manages keys, balancing, and
  transaction submission through the DApp Connector API v4.

## 6. Privacy Model

### Private

- `income`
- `creditScore`
- `debt`
- `secretKey`

### Public

- credential active state
- credential version
- credential commitment / issuer identifiers
- transaction and contract metadata
- proof result/state

An on-chain observer can see that an eligibility credential exists and when it is
issued, proved, or revoked — but **cannot** learn the exact income, credit score,
or debt.

## 7. Circuits

The Compact contract defines four circuits:

| Circuit | Description |
|---|---|
| `issueCredential` | Fails if a credential is already active; enforces income ≥ 600000, credit ≥ 700, DTI ≤ 40% against private witnesses; sets `active = true` |
| `proveEligibility` | Fails if inactive; re-enforces the same private-witness rules; returns `true` |
| `revokeCredential` | Fails if inactive; sets `active = false` and increments the version |
| `publicKey` | Derives a public key from holder/secret material (used for identity binding) |

## 8. Private Witnesses

- `userIncome` → returns `privateState.income`
- `userCreditScore` → returns `privateState.creditScore`
- `userDebt` → returns `privateState.debt`

The private state type `BBoardPrivateState` contains `secretKey`, `income`,
`creditScore`, and `debt`.

## 9. Public Ledger

The ledger holds only:

- `active: Boolean`
- `credentialVersion: Counter`
- `credentialCommitment: Bytes<32>`
- `issuer: Bytes<32>`

No field contains income, credit-score, or debt values.

## 10. MVP Scope

Implemented today:

- Compact contract with the three credential circuits
- Private-state witnesses for the three financial values
- Midnight.js API (`deploy`, `join`, `issueCredential`, `proveEligibility`,
  `revokeCredential`)
- React + Vite frontend with Lace (Preprod) wallet integration
- Boundary/edge-case contract test suite (17 tests)
- CI/CD: contract compile + tests + typecheck + lint + build, GitHub Pages deploy
- Local Docker proof server for Lace proving on Preprod

Not in MVP scope:

- issuer-signed credentials (currently self-declared)
- selective disclosure of individual rules
- credential expiry
- verifier-facing dashboard

## 11. Success Criteria

TrustPass is successful when a user with Preprod-funded Lace can:

1. Connect Lace.
2. Enter private financial values.
3. Deploy the Risk Passport.
4. Issue an eligibility credential (public state shows active).
5. Produce an eligibility proof without revealing values.
6. Revoke the credential and observe the version counter increment.

## 12. Future Expansion

- Issuer-endorsed credentials (banks / credit bureaus sign the private facts)
- Selective disclosure (prove only the income rule, not all three)
- Per-policy configurable thresholds without redeploying
- Credential expiry and auto-suspension
- Verifier endpoints / QR verification flows
- Additional financial metrics (e.g. savings buffer, repayment history)