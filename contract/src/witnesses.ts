import { Ledger } from "./managed/bboard/contract/index.js";
import { WitnessContext } from "@midnight-ntwrk/midnight-js-protocol/compact-runtime";

export type BBoardPrivateState = {
  readonly secretKey: Uint8Array;
  readonly income: bigint;
  readonly creditScore: bigint;
  readonly debt: bigint;
};

export const createBBoardPrivateState = (
  secretKey: Uint8Array,
  income: bigint,
  creditScore: bigint,
  debt: bigint,
): BBoardPrivateState => ({
  secretKey,
  income,
  creditScore,
  debt,
});

export const witnesses = {
  userIncome: ({
    privateState,
  }: WitnessContext<Ledger, BBoardPrivateState>): [
    BBoardPrivateState,
    bigint,
  ] => [privateState, privateState.income],

  userCreditScore: ({
    privateState,
  }: WitnessContext<Ledger, BBoardPrivateState>): [
    BBoardPrivateState,
    bigint,
  ] => [privateState, privateState.creditScore],

  userDebt: ({
    privateState,
  }: WitnessContext<Ledger, BBoardPrivateState>): [
    BBoardPrivateState,
    bigint,
  ] => [privateState, privateState.debt],
};
