import { type MidnightProviders } from '@midnight-ntwrk/midnight-js-types';
import { type FoundContract } from '@midnight-ntwrk/midnight-js-contracts';
import type { BBoardPrivateState } from '../../contract/src/witnesses.js';
import type { Contract, Witnesses, Ledger } from '../../contract/src/index.js';

export const bboardPrivateStateKey = 'bboardPrivateState';
export type PrivateStateId = typeof bboardPrivateStateKey;

export type PrivateStates = {
  readonly bboardPrivateState: BBoardPrivateState;
};

export type BBoardContract = Contract<BBoardPrivateState, Witnesses<BBoardPrivateState>>;

export type BBoardCircuitKeys = Exclude<keyof BBoardContract['impureCircuits'], number | symbol>;

export type BBoardProviders = MidnightProviders<BBoardCircuitKeys, PrivateStateId, BBoardPrivateState>;

export type DeployedBBoardContract = FoundContract<BBoardContract>;

export type BBoardDerivedState = Ledger;
