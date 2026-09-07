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
