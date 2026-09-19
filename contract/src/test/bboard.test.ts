import { describe, it, expect } from "vitest";
import { randomBytes } from "./utils.js";
import { BBoardSimulator } from "./bboard-simulator.js";
import { setNetworkId } from "@midnight-ntwrk/midnight-js-network-id";

setNetworkId("undeployed");

describe("Private Credit & Risk Passport smart contract", () => {
  it("initializes the credential as inactive", () => {
    const simulator = new BBoardSimulator(
      randomBytes(32),
      800000n,
      750n,
      200000n,
    );

    const ledger = simulator.getLedger();

    expect(ledger.active).toEqual(false);
    expect(ledger.credentialVersion).toEqual(1n);
  });

  it("issues a credential to an eligible user", () => {
    const simulator = new BBoardSimulator(
      randomBytes(32),
      800000n,
      750n,
      200000n,
    );

    const ledger = simulator.issueCredential();

    expect(ledger.active).toEqual(true);
  });

  it("proves eligibility without exposing financial values", () => {
    const simulator = new BBoardSimulator(
      randomBytes(32),
      800000n,
      750n,
      200000n,
    );

    simulator.issueCredential();

    expect(simulator.proveEligibility()).toEqual(true);
  });

  it("rejects a user with insufficient income", () => {
    const simulator = new BBoardSimulator(
      randomBytes(32),
      500000n,
      750n,
      100000n,
    );

    expect(() => simulator.issueCredential()).toThrow(
      "Income requirement not satisfied",
    );
  });

  it("rejects a user with insufficient credit score", () => {
    const simulator = new BBoardSimulator(
      randomBytes(32),
      800000n,
      650n,
      200000n,
    );

    expect(() => simulator.issueCredential()).toThrow(
      "Credit score requirement not satisfied",
    );
  });

  it("rejects a user with excessive debt-to-income ratio", () => {
    const simulator = new BBoardSimulator(
      randomBytes(32),
      800000n,
      750n,
      400000n,
    );

    expect(() => simulator.issueCredential()).toThrow(
      "Debt-to-income ratio requirement not satisfied",
    );
  });

  it("issues a credential when income is exactly 600000", () => {
    const simulator = new BBoardSimulator(randomBytes(32), 600000n, 750n, 0n);

    const ledger = simulator.issueCredential();

    expect(ledger.active).toEqual(true);
  });

  it("rejects income just below 600000", () => {
    const simulator = new BBoardSimulator(randomBytes(32), 599999n, 750n, 0n);

    expect(() => simulator.issueCredential()).toThrow(
      "Income requirement not satisfied",
    );
  });

  it("issues a credential when credit score is exactly 700", () => {
    const simulator = new BBoardSimulator(randomBytes(32), 800000n, 700n, 0n);

    const ledger = simulator.issueCredential();

    expect(ledger.active).toEqual(true);
  });

  it("rejects credit score just below 700", () => {
    const simulator = new BBoardSimulator(randomBytes(32), 800000n, 699n, 0n);

    expect(() => simulator.issueCredential()).toThrow(
      "Credit score requirement not satisfied",
    );
  });

  it("issues a credential when debt is exactly 40% of income", () => {
    const simulator = new BBoardSimulator(
      randomBytes(32),
      800000n,
      750n,
      320000n,
    );

    const ledger = simulator.issueCredential();

    expect(ledger.active).toEqual(true);
  });

  it("rejects debt just above 40% of income", () => {
    const simulator = new BBoardSimulator(
      randomBytes(32),
      800000n,
      750n,
      320001n,
    );

    expect(() => simulator.issueCredential()).toThrow(
      "Debt-to-income ratio requirement not satisfied",
    );
  });

  it("does not expose private financial values in public state", () => {
    const simulator = new BBoardSimulator(
      randomBytes(32),
      800000n,
      750n,
      200000n,
    );

    simulator.issueCredential();

    const ledgerKeys = Object.keys(simulator.getLedger());

    expect(ledgerKeys).not.toContain("income");
    expect(ledgerKeys).not.toContain("creditScore");
    expect(ledgerKeys).not.toContain("debt");
  });

  it("does not allow a second credential while active", () => {
    const simulator = new BBoardSimulator(
      randomBytes(32),
      800000n,
      750n,
      200000n,
    );

    simulator.issueCredential();

    expect(() => simulator.issueCredential()).toThrow(
      "Credential is already active",
    );
  });

  it("revokes an active credential", () => {
    const simulator = new BBoardSimulator(
      randomBytes(32),
      800000n,
      750n,
      200000n,
    );

    simulator.issueCredential();
    const ledger = simulator.revokeCredential();

    expect(ledger.active).toEqual(false);
    expect(ledger.credentialVersion).toEqual(2n);
  });

  it("cannot prove eligibility without an active credential", () => {
    const simulator = new BBoardSimulator(
      randomBytes(32),
      800000n,
      750n,
      200000n,
    );

    expect(() => simulator.proveEligibility()).toThrow(
      "Credential is not active",
    );
  });

  it("cannot prove eligibility after revocation", () => {
    const simulator = new BBoardSimulator(
      randomBytes(32),
      800000n,
      750n,
      200000n,
    );

    simulator.issueCredential();
    simulator.revokeCredential();

    expect(() => simulator.proveEligibility()).toThrow(
      "Credential is not active",
    );
  });
});
