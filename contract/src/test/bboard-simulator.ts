import {
  type CircuitContext,
  QueryContext,
  sampleContractAddress,
  createConstructorContext,
  CostModel,
} from "@midnight-ntwrk/compact-runtime";

import {
  Contract,
  type Ledger,
  ledger,
} from "../managed/bboard/contract/index.js";

import { type BBoardPrivateState, witnesses } from "../witnesses.js";

export class BBoardSimulator {
  readonly contract: Contract<BBoardPrivateState>;
  circuitContext: CircuitContext<BBoardPrivateState>;

  constructor(secretKey: Uint8Array, cgpa = 850n, attendance = 85n) {
    this.contract = new Contract<BBoardPrivateState>(witnesses);

    const {
      currentPrivateState,
      currentContractState,
      currentZswapLocalState,
    } = this.contract.initialState(
      createConstructorContext(
        {
          secretKey,
          cgpa,
          attendance,
        },
        "0".repeat(64),
      ),
    );

    this.circuitContext = {
      currentPrivateState,
      currentZswapLocalState,
      costModel: CostModel.initialCostModel(),
      currentQueryContext: new QueryContext(
        currentContractState.data,
        sampleContractAddress(),
      ),
    };
  }

  public getLedger(): Ledger {
    return ledger(this.circuitContext.currentQueryContext.state);
  }

  public getPrivateState(): BBoardPrivateState {
    return this.circuitContext.currentPrivateState;
  }

  public issueCredential(): Ledger {
    this.circuitContext = this.contract.impureCircuits.issueCredential(
      this.circuitContext,
    ).context;

    return this.getLedger();
  }

  public proveEligibility(): boolean {
    return this.contract.impureCircuits.proveEligibility(this.circuitContext)
      .result;
  }

  public revokeCredential(): Ledger {
    this.circuitContext = this.contract.impureCircuits.revokeCredential(
      this.circuitContext,
    ).context;

    return this.getLedger();
  }
}
