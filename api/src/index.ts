import * as BBoard from '../../contract/src/managed/bboard/contract/index.js';

import { type ContractAddress } from '@midnight-ntwrk/midnight-js-protocol/compact-runtime';
import { type Logger } from 'pino';
import {
  type BBoardContract,
  type BBoardProviders,
  type DeployedBBoardContract,
  bboardPrivateStateKey,
  type BBoardDerivedState,
} from './common-types.js';

import { CompiledBBoardContractContract } from '../../contract/src/index.js';
import * as utils from './utils/index.js';

import { deployContract, findDeployedContract } from '@midnight-ntwrk/midnight-js-contracts';

import { Observable } from 'rxjs';

import { type BBoardPrivateState, createBBoardPrivateState } from '../../contract/src/witnesses.js';

export interface DeployedBBoardAPI {
  readonly deployedContractAddress: ContractAddress;
  readonly state$: Observable<BBoardDerivedState>;

  issueCredential: () => Promise<void>;
  proveEligibility: () => Promise<boolean>;
  revokeCredential: () => Promise<void>;
}

export class BBoardAPI implements DeployedBBoardAPI {
  private constructor(
    public readonly deployedContract: DeployedBBoardContract,
    providers: BBoardProviders,
    private readonly logger?: Logger,
  ) {
    this.deployedContractAddress = deployedContract.deployTxData.public.contractAddress;

    providers.privateStateProvider.setContractAddress(this.deployedContractAddress);

    this.state$ = providers.publicDataProvider
      .contractStateObservable(this.deployedContractAddress, { type: 'latest' })
      .pipe(
        // Convert the raw state returned by the indexer into our Compact ledger.
        (source) =>
          new Observable<BBoardDerivedState>((subscriber) => {
            const subscription = source.subscribe({
              next: (contractState) => {
                try {
                  subscriber.next(BBoard.ledger(contractState.data));
                } catch (error) {
                  subscriber.error(error);
                }
              },
              error: (error) => subscriber.error(error),
              complete: () => subscriber.complete(),
            });

            return () => subscription.unsubscribe();
          }),
      );
  }

  readonly deployedContractAddress: ContractAddress;

  readonly state$: Observable<BBoardDerivedState>;

  async issueCredential(): Promise<void> {
    this.logger?.info('issuingCredential');

    const txData = await this.deployedContract.callTx.issueCredential();

    this.logger?.trace({
      transactionAdded: {
        circuit: 'issueCredential',
        txHash: txData.public.txHash,
        blockHeight: txData.public.blockHeight,
      },
    });
  }

  async proveEligibility(): Promise<boolean> {
    this.logger?.info('provingEligibility');

    const txData = await this.deployedContract.callTx.proveEligibility();

    this.logger?.trace({
      transactionAdded: {
        circuit: 'proveEligibility',
        txHash: txData.public.txHash,
        blockHeight: txData.public.blockHeight,
      },
    });

    return txData.private.result;
  }

  async revokeCredential(): Promise<void> {
    this.logger?.info('revokingCredential');

    const txData = await this.deployedContract.callTx.revokeCredential();

    this.logger?.trace({
      transactionAdded: {
        circuit: 'revokeCredential',
        txHash: txData.public.txHash,
        blockHeight: txData.public.blockHeight,
      },
    });
  }

  static async deploy(providers: BBoardProviders, logger?: Logger): Promise<BBoardAPI> {
    logger?.info('deployContract');

    const deployedBBoardContract = await deployContract(providers, {
      compiledContract: CompiledBBoardContractContract,
      privateStateId: bboardPrivateStateKey,
      initialPrivateState: createBBoardPrivateState(utils.randomBytes(32), 850n, 85n),
    });

    logger?.trace({
      contractDeployed: {
        finalizedDeployTxData: deployedBBoardContract.deployTxData.public,
      },
    });

    return new BBoardAPI(deployedBBoardContract, providers, logger);
  }

  static async join(providers: BBoardProviders, contractAddress: ContractAddress, logger?: Logger): Promise<BBoardAPI> {
    logger?.info({ contractAddress }, 'JOIN STEP 1: starting join');

    const initialPrivateState = await BBoardAPI.getPrivateState(providers, contractAddress);

    logger?.info('JOIN STEP 2: private state ready');

    logger?.info('JOIN STEP 3: calling findDeployedContract');

    const deployedBBoardContract = await findDeployedContract<BBoardContract>(providers, {
      contractAddress,
      compiledContract: CompiledBBoardContractContract,
      privateStateId: bboardPrivateStateKey,
      initialPrivateState,
    });

    logger?.info('JOIN STEP 4: findDeployedContract completed');

    return new BBoardAPI(deployedBBoardContract, providers, logger);
  }

  private static async getPrivateState(
    providers: BBoardProviders,
    contractAddress: ContractAddress,
  ): Promise<BBoardPrivateState> {
    providers.privateStateProvider.setContractAddress(contractAddress);

    const existingPrivateState = await providers.privateStateProvider.get(bboardPrivateStateKey);

    return existingPrivateState ?? createBBoardPrivateState(utils.randomBytes(32), 850n, 85n);
  }
}

export * as utils from './utils/index.js';

export * from './common-types.js';
