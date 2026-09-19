# TrustPass

## 🚀 Live MVP

**Live Demo:** https://krushnasppudot-code.github.io/student-eligibility-pass-level4/

**Network:** Midnight Preprod

**Contract Address:** `053de1327e376844f1eb64bb9b1ce77c7b766b374ee2849dd4441946ea91d3dd`

**Verified Transaction:** `7792a03f20fa8a122a4861301e04c970e8fa34bea2d85b2caa62c96ae8ae1274`

**Product:** TrustPass — Private Credit & Risk Passport

---

**Privacy-Preserving Financial Eligibility Passport on Midnight**

[![CI](../../actions/workflows/ci.yaml/badge.svg)](../../actions/workflows/ci.yaml)

TrustPass is a Level 4 Midnight Network MVP that lets a user prove they satisfy
predefined financial eligibility rules **without exposing their exact income,
credit score, or total debt on-chain**.

The project is built on Midnight's Compact smart-contract architecture, Midnight.js, ZK proofs, the 1AM wallet, and the Midnight Preprod network.

---

## Problem

Traditional financial eligibility checks (lending, credit limits, loan
applications, rent approvals) require applicants to share sensitive financial
data:

- Annual income
- Credit score
- Total debt

This reveals far more information than a verifier actually needs. For example,
if a lender only needs to know that income is at least ₹600,000, it does not
need to see the exact income figure.

## Solution

TrustPass stores the user's financial values as **private witnesses** and uses a
Midnight Compact smart contract to prove eligibility against fixed thresholds.
The verifier receives a zero-knowledge proof and the resulting public credential
state — never the underlying numbers.

The exact income, credit score, and debt values are used as private witnesses
and are **not displayed on the public credential**.

## Rules

| Requirement | Threshold |
|---|---:|
| Annual income | ≥ ₹600,000 |
| Credit score | ≥ 700 |
| Debt-to-Income (DTI) ratio | ≤ 40% |

The debt-to-income check is implemented as `debt * 100 <= income * 40`.

## Privacy model

### Private (never written to the public ledger)

- `income`
- `credit score`
- `debt`
- `secretKey` (holder secret)

### Public (visible on-chain)

- credential active state (`active`)
- credential version (`credentialVersion`)
- credential commitment / issuer identifiers
- transaction and contract metadata

## Architecture

- **Frontend:** React + TypeScript + Vite + Material UI
- **Contracts:** Compact smart contracts compiled to ZK circuits
- **Client:** Midnight.js (`@midnight-ntwrk/*` 4.1.1)
- **Wallet:** Lace (Midnight edition), DApp Connector API v4
- **Network:** Midnight Preprod
- **Proving:** Local Docker proof server (`midnightntwrk/proof-server:8.0.3`)
- **CI/CD:** GitHub Actions (compile, test, typecheck, lint, build, deploy to GitHub Pages)

## Smart contract

The TrustPass Compact contract (`contract/src/bboard.compact`) defines three
circuits:

| Circuit | Behaviour |
|---|---|
| `issueCredential` | Fails if a credential is already active; reads income, credit score and debt from private witnesses; asserts all eligibility rules; sets `active = true` |
| `proveEligibility` | Fails if the credential is inactive; re-asserts the same private-witness eligibility checks; returns `true` on success |
| `revokeCredential` | Fails if the credential is inactive; sets `active = false` and increments `credentialVersion` |

Private state (`BBoardPrivateState`) contains `secretKey`, `income`, `creditScore`
and `debt`. Witnesses (`userIncome`, `userCreditScore`, `userDebt`) hand the
private values to the circuits only during proof generation.

## User flow

1. Connect the Lace wallet (Preprod).
2. Enter private financial values (income, credit score, total debt).
3. Deploy/issue the TrustPass credential.
4. Prove eligibility.
5. Verify credential status.
6. Revoke (invalidate) the credential when required.

## Repository layout

```
.
├── contract/            # Compact contract, witnesses, managed ZK artifacts, tests
├── api/                 # Midnight.js API wrapper (deploy, join, issue, prove, revoke)
├── bboard-ui/           # React + Vite frontend
├── bboard-cli/          # Optional Node CLI (deploy / join / interact) — dev tool
├── proof-server-local.yml  # Local Docker proof server for Preprod
└── .github/workflows/   # CI + GitHub Pages deployment
```

> Internal class/file names (e.g. `BBoard*`, `bboard-ui`) are inherited from the
> official Midnight example architecture and are kept intentionally to minimise
> refactoring risk. They do not affect product behaviour.

## Prerequisites

- Node.js >= 24.11.1
- npm (workspace-managed, uses `--legacy-peer-deps` configured via `.npmrc`)
- Docker Desktop (for the local proof server)
- Midnight Compact compiler (`compact`) — the CI workflow installs it via the
  Midnight setup action
- Lace wallet (Midnight edition), browser extension installed, unlocked, and
  **funded on Preprod**
- (Optional) Midnight browser extensions that also expose the DApp Connector API,
  e.g. 1AM — TrustPass prefers Lace when it is present

## Setup

```bash
git clone https://github.com/KrushnaSPPUDoT-code/student-eligibility-pass-level4.git
cd student-eligibility-pass-level4
npm install --legacy-peer-deps
```

## Start the proof server (required for Lace proving)

Lace proves locally with the `midnightntwrk/proof-server` container. It must be
running and reachable at `http://localhost:6300`:

```bash
docker compose -f proof-server-local.yml up -d
```

Verify it is healthy:

```bash
docker ps | grep proof-server-local
```

The frontend falls back to `http://localhost:6300` when the wallet does not
supply an explicit prover URI. If you configure a different proof server in Lace
(Settings → Midnight), that URI is used instead.

## Preprod frontend

The network is driven by Vite modes:

- `.env.preprod` → `VITE_NETWORK_ID=preprod`
- `.env.preview` → `VITE_NETWORK_ID=preview`

Run the UI against **Preprod** (loads `.env.preprod`):

```bash
cd bboard-ui
npm run dev:preprod
```

> Plain `npm run dev` uses Vite's default mode and does **not** load `.env.preprod`.

Build for Preprod + GitHub Pages base path:

```bash
cd bboard-ui
npm run build
```

The build script (a) types-checks and bundles the app with
`vite build --mode preprod`, and (b) copies the managed ZK artifacts
(`keys/`, `zkir/`) from `contract/src/managed/bboard` into `dist/`.

## Tests

Contract tests (17 scenarios including boundary/edge cases):

```bash
cd contract
npm run compact   # regenerate managed artifacts from the Compact source
npm run build
npm test -- --run
```

API checks:

```bash
cd api
npm run ci
```

Frontend checks:

```bash
cd bboard-ui
npm run typecheck
npm run lint
npm run build
```

## Wallet setup

1. Install the **Lace** Midnight wallet extension and unlock it.
2. Set the network to **Preprod**.
3. Fund the wallet with NIGHT (Preprod faucet).
4. Open the TrustPass frontend and click **Deploy Risk Passport**.
5. Approve the connection and the deploy transaction in Lace.

TrustPass selects Lace automatically. If multiple compatible wallets are
installed (e.g. 1AM), Lace is preferred; the first compatible connector is used
only as a fallback.

## Privacy in depth

The ledger state contains only:

- `active: Boolean`
- `credentialVersion: Counter`
- `credentialCommitment: Bytes<32>`
- `issuer: Bytes<32>`

No income, credit-score, or debt field is ever written to public contract state.
During a proof, `userIncome`, `userCreditScore`, and `userDebt` witnesses feed
the private values into the circuit inside the proving step; the proof only
asserts the eligibility conditions.

## CI/CD

Three workflows under `.github/workflows/`:

- `ci.yaml` — compiles the contract, runs contract tests, api checks, and
  frontend typecheck/lint/build on every push/PR to `main`.
- `deploy-pages.yml` — builds and deploys the frontend to GitHub Pages.
- `scan.yaml` — Midnight code scan.

## License

Based on Midnight's example dApp architecture. Educational/demonstration project.


## 🚀 Live Preprod Deployment

### Live MVP

**GitHub Pages Demo:**  
https://krushnasppudot-code.github.io/student-eligibility-pass-level4/

**Network:** Midnight Preprod

**Deployed Contract Address:**

```text
053de1327e376844f1eb64bb9b1ce77c7b766b374ee2849dd4441946ea91d3dd
```

### Contract Verification

The deployed MVP has successfully executed the issueCredential() circuit on Midnight Preprod.

Verified transaction:

7792a03f20fa8a122a4861301e04c970e8fa34bea2d85b2caa62c96ae8ae1274

The transaction was confirmed with:

issueCredential() executed successfully
Status: SUCCESS
Contract actions: 1
Unique contracts: 1
Eligibility Rules

The private financial inputs are evaluated using:

Annual income ≥ ₹6,00,000
Credit score ≥ 700
Debt-to-income ratio ≤ 40%

The financial values are supplied as private witness data and are not stored as ordinary public ledger fields.

🌐 Product Profile

X: https://x.com/Trust_Pass

Launch post:
https://x.com/Trust_Pass/status/2101302859853963558

🎥 Demo

A short demonstration video will show the live Preprod application, wallet connection, private eligibility inputs, credential issuance, active credential state, and successful transaction verification.

