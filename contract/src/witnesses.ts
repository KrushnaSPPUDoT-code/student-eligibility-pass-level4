import { Ledger } from "./managed/bboard/contract/index.js";
import { WitnessContext } from "@midnight-ntwrk/midnight-js-protocol/compact-runtime";

export type BBoardPrivateState = {
  readonly secretKey: Uint8Array;
  readonly cgpa: bigint;
  readonly attendance: bigint;
};

export const createBBoardPrivateState = (
  secretKey: Uint8Array,
  cgpa: bigint,
  attendance: bigint,
): BBoardPrivateState => ({
  secretKey,
  cgpa,
  attendance,
});

export const witnesses = {
  studentCgpa: ({
    privateState,
  }: WitnessContext<Ledger, BBoardPrivateState>): [
    BBoardPrivateState,
    bigint,
  ] => [privateState, privateState.cgpa],

  studentAttendance: ({
    privateState,
  }: WitnessContext<Ledger, BBoardPrivateState>): [
    BBoardPrivateState,
    bigint,
  ] => [privateState, privateState.attendance],
};
