# Preprod Deployment Guide

## Network

The TrustPass MVP is deployed and tested on the Midnight Preprod network.

## Live Application

GitHub Pages:

https://krushnasppudot-code.github.io/student-eligibility-pass-level4/

## Contract

Deployed Preprod contract address:

```text
053de1327e376844f1eb64bb9b1ce77c7b766b374ee2849dd4441946ea91d3dd
```

## Verified Transaction

The deployed MVP successfully executed the issueCredential() circuit on Preprod.

```text
7792a03f20fa8a122a4861301e04c970e8fa34bea2d85b2caa62c96ae8ae1274
```

The transaction was confirmed as successful with one contract action.

## Local Setup

From the repository root:

npm install

Compile the Compact contract:

cd contract
npm run compact

Run contract tests:

npm test -- --run

Build the frontend:

cd ../bboard-ui
npm run build

Run the frontend CI checks:

npm run ci

## Local Proof Server

The repository includes:

proof-server-local.yml

The proof server can be started with:

docker compose -f proof-server-local.yml up -d

The local proof server is configured for the Midnight Preprod network.

## Deployment Verification

Before considering a deployment complete, verify:

The frontend loads successfully.
The wallet can connect to the application.
The application is configured for Preprod.
The Compact contract compiles successfully.
Contract tests pass.
The frontend builds successfully.
The deployed contract address is recorded in the README.
A successful Preprod transaction can be verified.

## Privacy

Private financial inputs are supplied to the application as witness data. The public ledger state does not contain the user's income, credit score, or debt values.

See docs/PRIVACY-AND-SECURITY.md for more details.
