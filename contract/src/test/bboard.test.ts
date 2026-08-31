import { describe, it, expect } from "vitest";
import { randomBytes } from "./utils.js";
import { BBoardSimulator } from "./bboard-simulator.js";
import { setNetworkId } from "@midnight-ntwrk/midnight-js-network-id";

setNetworkId("undeployed");

describe("Student Eligibility Pass smart contract", () => {
  it("initializes the credential as inactive", () => {
    const simulator = new BBoardSimulator(randomBytes(32), 850n, 85n);

    const ledger = simulator.getLedger();

    expect(ledger.active).toEqual(false);
    expect(ledger.credentialVersion).toEqual(1n);
  });

  it("issues a credential to an eligible student", () => {
    const simulator = new BBoardSimulator(randomBytes(32), 850n, 85n);

    const ledger = simulator.issueCredential();

    expect(ledger.active).toEqual(true);
  });

  it("proves eligibility without exposing the student's values", () => {
    const simulator = new BBoardSimulator(randomBytes(32), 850n, 85n);

    simulator.issueCredential();

    expect(simulator.proveEligibility()).toEqual(true);
  });

  it("rejects a student with insufficient CGPA", () => {
    const simulator = new BBoardSimulator(randomBytes(32), 750n, 85n);

    expect(() => simulator.issueCredential()).toThrow(
      "CGPA requirement not satisfied",
    );
  });

  it("rejects a student with insufficient attendance", () => {
    const simulator = new BBoardSimulator(randomBytes(32), 850n, 70n);

    expect(() => simulator.issueCredential()).toThrow(
      "Attendance requirement not satisfied",
    );
  });

  it("does not allow a second credential while active", () => {
    const simulator = new BBoardSimulator(randomBytes(32), 850n, 85n);

    simulator.issueCredential();

    expect(() => simulator.issueCredential()).toThrow(
      "Credential is already active",
    );
  });

  it("revokes an active credential", () => {
    const simulator = new BBoardSimulator(randomBytes(32), 850n, 85n);

    simulator.issueCredential();
    const ledger = simulator.revokeCredential();

    expect(ledger.active).toEqual(false);
    expect(ledger.credentialVersion).toEqual(2n);
  });

  it("cannot prove eligibility without an active credential", () => {
    const simulator = new BBoardSimulator(randomBytes(32), 850n, 85n);

    expect(() => simulator.proveEligibility()).toThrow(
      "Credential is not active",
    );
  });

  it("cannot prove eligibility after revocation", () => {
    const simulator = new BBoardSimulator(randomBytes(32), 850n, 85n);

    simulator.issueCredential();
    simulator.revokeCredential();

    expect(() => simulator.proveEligibility()).toThrow(
      "Credential is not active",
    );
  });
});
