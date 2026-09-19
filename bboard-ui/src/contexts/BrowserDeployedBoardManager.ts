// This file is part of midnightntwrk/example-bboard.
// Copyright (C) Midnight Foundation
// SPDX-License-Identifier: Apache-2.0
// Licensed under the Apache License, Version 2.0 (the "License");
// You may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
// http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import {
  BBoardAPI,
  type BBoardCircuitKeys,
  type BBoardProviders,
  type DeployedBBoardAPI,
} from '../../../api/src/index';
import { type ContractAddress, fromHex, toHex } from '@midnight-ntwrk/midnight-js-protocol/compact-runtime';
import {
  BehaviorSubject,
  catchError,
  concatMap,
  filter,
  firstValueFrom,
  interval,
  map,
  type Observable,
  take,
  tap,
  throwError,
  timeout,
} from 'rxjs';
import { pipe as fnPipe } from 'fp-ts/function';
import { type Logger } from 'pino';
import { ConnectedAPI, type ConnectionStatus, type InitialAPI } from '@midnight-ntwrk/dapp-connector-api';
import { FetchZkConfigProvider } from '@midnight-ntwrk/midnight-js-fetch-zk-config-provider';
import { httpClientProofProvider } from '@midnight-ntwrk/midnight-js-http-client-proof-provider';
import { indexerPublicDataProvider } from '@midnight-ntwrk/midnight-js-indexer-public-data-provider';
import semver from 'semver';
import {
  Binding,
  FinalizedTransaction,
  Proof,
  SignatureEnabled,
  Transaction,
  TransactionId,
} from '@midnight-ntwrk/midnight-js-protocol/ledger';
import { BBoardPrivateState } from '@midnight-ntwrk/bboard-contract';
import { inMemoryPrivateStateProvider } from '../in-memory-private-state-provider';
import { NetworkId } from '@midnight-ntwrk/midnight-js-network-id';
import type { UnboundTransaction } from '@midnight-ntwrk/midnight-js-types';

/**
 * An in-progress Risk Passport deployment.
 */
export interface InProgressBoardDeployment {
  readonly status: 'in-progress';
}

/**
 * A deployed Risk Passport deployment.
 */
export interface DeployedBoardDeployment {
  readonly status: 'deployed';

  /**
   * The {@link DeployedBBoardAPI} instance when connected to an on network Risk Passport contract.
   */
  readonly api: DeployedBBoardAPI;
}

/**
 * A failed Risk Passport deployment.
 */
export interface FailedBoardDeployment {
  readonly status: 'failed';

  /**
   * The error that caused the deployment to fail.
   */
  readonly error: Error;
}

/**
 * A Risk Passport deployment.
 */
export type BoardDeployment = InProgressBoardDeployment | DeployedBoardDeployment | FailedBoardDeployment;

/**
 * Provides access to Risk Passport deployments.
 */
export interface DeployedBoardAPIProvider {
  /**
   * Gets the observable set of board deployments.
   *
   * @remarks
   * This property represents an observable array of {@link BoardDeployment}, each also an
   * observable. Changes to the array will be emitted as boards are resolved (deployed or joined),
   * while changes to each underlying board can be observed via each item in the array.
   */
  readonly boardDeployments$: Observable<Array<Observable<BoardDeployment>>>;

  /**
   * Joins or deploys a Risk Passport contract.
   *
   * @param contractAddress An optional contract address to use when resolving.
   * @returns An observable board deployment.
   *
   * @remarks
   * For a given `contractAddress`, the method will attempt to find and join the identified Risk Passport
   * contract; otherwise it will attempt to deploy a new one.
   */
  readonly resolve: (
    contractAddress?: ContractAddress,
    income?: bigint,
    creditScore?: bigint,
    debt?: bigint,
  ) => Observable<BoardDeployment>;
}

/**
 * A {@link DeployedBoardAPIProvider} that manages Risk Passport deployments in a browser setting.
 *
 * @remarks
 * {@link BrowserDeployedBoardManager} configures and manages a connection to the 1AM
 * wallet, along with a collection of additional providers that work in a web-browser setting.
 */
export class BrowserDeployedBoardManager implements DeployedBoardAPIProvider {
  readonly #boardDeploymentsSubject: BehaviorSubject<Array<BehaviorSubject<BoardDeployment>>>;
  #initializedProviders: Promise<BBoardProviders> | undefined;

  /**
   * Initializes a new {@link BrowserDeployedBoardManager} instance.
   *
   * @param logger The `pino` logger to for logging.
   */
  constructor(private readonly logger: Logger) {
    this.#boardDeploymentsSubject = new BehaviorSubject<Array<BehaviorSubject<BoardDeployment>>>([]);
    this.boardDeployments$ = this.#boardDeploymentsSubject;
  }

  /** @inheritdoc */
  readonly boardDeployments$: Observable<Array<Observable<BoardDeployment>>>;

  /** @inheritdoc */
  resolve(
    contractAddress?: ContractAddress,
    income = 800000n,
    creditScore = 750n,
    debt = 200000n,
  ): Observable<BoardDeployment> {
    const deployments = this.#boardDeploymentsSubject.value;
    let deployment = deployments.find(
      (deployment) =>
        deployment.value.status === 'deployed' && deployment.value.api.deployedContractAddress === contractAddress,
    );

    if (deployment) {
      return deployment;
    }

    deployment = new BehaviorSubject<BoardDeployment>({
      status: 'in-progress',
    });

    if (contractAddress) {
      void this.joinDeployment(deployment, contractAddress);
    } else {
      void this.deployDeployment(deployment, income, creditScore, debt);
    }

    this.#boardDeploymentsSubject.next([...deployments, deployment]);

    return deployment;
  }

  private getProviders(): Promise<BBoardProviders> {
    // We use a cached `Promise` to hold the providers. This will:
    //
    // 1. Cache and re-use the providers (including the configured connector API), and
    // 2. Act as a synchronization point if multiple contract deploys or joins run concurrently.
    //    Concurrent calls to `getProviders()` will receive, and ultimately await, the same
    //    `Promise`.
    return this.#initializedProviders ?? (this.#initializedProviders = initializeProviders(this.logger));
  }

  private async deployDeployment(
    deployment: BehaviorSubject<BoardDeployment>,
    income: bigint,
    creditScore: bigint,
    debt: bigint,
  ): Promise<void> {
    try {
      const providers = await this.getProviders();
      const api = await BBoardAPI.deploy(providers, income, creditScore, debt, this.logger);

      deployment.next({
        status: 'deployed',
        api,
      });
    } catch (error: unknown) {
      this.logger.error({ error }, 'Risk passport deployment failed');
      deployment.next({
        status: 'failed',
        error: error instanceof Error ? error : new Error(String(error)),
      });
    }
  }

  private async joinDeployment(
    deployment: BehaviorSubject<BoardDeployment>,
    contractAddress: ContractAddress,
  ): Promise<void> {
    try {
      const providers = await this.getProviders();
      const api = await BBoardAPI.join(providers, contractAddress, this.logger);

      deployment.next({
        status: 'deployed',
        api,
      });
    } catch (error: unknown) {
      this.logger.error({ error }, 'Risk passport join failed');
      deployment.next({
        status: 'failed',
        error: error instanceof Error ? error : new Error(String(error)),
      });
    }
  }
}

/** @internal */
const withStage = async <T>(stage: string, action: () => Promise<T>): Promise<T> => {
  try {
    return await action();
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`${stage}: ${message}`);
  }
};

/** @internal */
const initializeProviders = async (logger: Logger): Promise<BBoardProviders> => {
  const networkId = import.meta.env.VITE_NETWORK_ID as NetworkId;

  const connectedAPI = await withStage('wallet connection', () => connectToWallet(logger, networkId));

  const zkConfigPath = new URL(import.meta.env.BASE_URL, window.location.origin).toString(); // '../../../contract/src/managed/bboard';
  console.log('>>> ZK CONFIG BASE URL <<<', JSON.stringify(zkConfigPath));
  const keyMaterialProvider = new FetchZkConfigProvider<BBoardCircuitKeys>(zkConfigPath, fetch.bind(window));
  const config = await withStage('wallet configuration', () => connectedAPI.getConfiguration());
  console.log('>>> PROVER URL FROM WALLET <<<', config.proverServerUri);
  console.log('>>> INDEXER URL FROM WALLET <<<', config.indexerUri);

  const proverServerUri = config.proverServerUri;
  if (!proverServerUri) {
    throw new Error('1AM wallet did not provide a prover server URL');
  }

  const inMemoryBBoardPrivateStateProvider = inMemoryPrivateStateProvider<string, BBoardPrivateState>();
  const shieldedAddresses = await withStage('wallet addresses', () => connectedAPI.getShieldedAddresses());
  return {
    privateStateProvider: inMemoryBBoardPrivateStateProvider,
    zkConfigProvider: keyMaterialProvider,
    proofProvider: httpClientProofProvider(proverServerUri, keyMaterialProvider),
    publicDataProvider: indexerPublicDataProvider(config.indexerUri, config.indexerWsUri),
    walletProvider: {
      getCoinPublicKey(): string {
        return shieldedAddresses.shieldedCoinPublicKey;
      },
      getEncryptionPublicKey(): string {
        return shieldedAddresses.shieldedEncryptionPublicKey;
      },
      balanceTx: async (tx: UnboundTransaction, ttl?: Date): Promise<FinalizedTransaction> => {
        try {
          logger.info({ tx, ttl }, 'Balancing transaction via wallet');
          const serializedTx = toHex(tx.serialize());
          const received = await connectedAPI.balanceUnsealedTransaction(serializedTx, { payFees: true });
          return Transaction.deserialize<SignatureEnabled, Proof, Binding>(
            'signature',
            'proof',
            'binding',
            fromHex(received.tx),
          );
        } catch (e) {
          logger.error({ error: e }, 'Error balancing transaction via wallet');
          throw e;
        }
      },
    },
    midnightProvider: {
      submitTx: async (tx: FinalizedTransaction): Promise<TransactionId> => {
        await connectedAPI.submitTransaction(toHex(tx.serialize()));
        const txIdentifiers = tx.identifiers();
        const txId = txIdentifiers[0]; // Return the first transaction ID
        logger.info({ txIdentifiers }, 'Submitted transaction via wallet');
        return txId;
      },
    },
  };
};

/** @internal */
const COMPATIBLE_CONNECTOR_API_VERSION = '4.x';

/**
 * A wallet connector that is compatible with the DApp Connector API version
 * supported by this application.
 *
 * @internal
 */
type CompatibleWallet = {
  /**
   * The key under which the wallet registered itself in `window.midnight`
   * (e.g. `1am` for the 1AM wallet or `mnLace` for the Midnight Lace wallet).
   */
  readonly id: string;
  readonly api: InitialAPI;
};

/** @internal */
const getCompatibleWallets = (): CompatibleWallet[] => {
  if (!window.midnight) return [];
  return Object.entries(window.midnight).flatMap(([id, wallet]): CompatibleWallet[] => {
    if (
      !!wallet &&
      typeof wallet === 'object' &&
      'apiVersion' in wallet &&
      semver.satisfies(wallet.apiVersion, COMPATIBLE_CONNECTOR_API_VERSION)
    ) {
      return [{ id, api: wallet }];
    }
    return [];
  });
};

/** @internal */
const is1AMWallet = (wallet: CompatibleWallet): boolean =>
  [wallet.id, wallet.api.rdns, wallet.api.name]
    .filter((value): value is string => !!value)
    .join(' ')
    .toLowerCase()
    .includes('1am');

/** @internal */
const getPreferredCompatibleWallet = (): CompatibleWallet | undefined => {
  const wallets = getCompatibleWallets();
  // Prefer the 1AM wallet when present so that other compatible wallets
  // (e.g. Midnight Lace) are not accidentally selected instead.
  return wallets.find(is1AMWallet) ?? wallets[0];
};

/**
 * Calls `connect()`, timeboxing only the waiting for the wallet's
 * authorization popup. This step is gated on a human approving the
 * connection, so it legitimately takes far longer than a plain API call while
 * still failing instead of hanging if the popup is never acted upon.
 *
 * @internal
 */
const connectWithAuthorizationTimeout = async (
  initialWallet: CompatibleWallet,
  networkId: string,
): Promise<ConnectedAPI> => {
  const authorizationTimeout = new Promise<never>((_, reject) =>
    setTimeout(
      () =>
        reject(
          new Error('Timed out waiting for 1AM authorization. Did you approve the connection in the 1AM wallet popup?'),
        ),
      120_000,
    ),
  );

  return Promise.race([initialWallet.api.connect(networkId), authorizationTimeout]);
};

/**
 * Polls the connected wallet until it reports a `connected` state instead of
 * assuming `getConnectionStatus()` is already settled the moment `connect()`
 * resolves (which is not guaranteed for every connector). Throws with the last
 * observed status if the wallet never becomes connected.
 *
 * @internal
 */
const waitForConnectedStatus = async (connectedAPI: ConnectedAPI, logger: Logger): Promise<ConnectionStatus> => {
  const statusTimeoutMs = 10_000;
  const pollIntervalMs = 250;
  const deadline = new Date(Date.now() + statusTimeoutMs);
  let lastStatus: ConnectionStatus | undefined;

  while (new Date() < deadline) {
    lastStatus = await connectedAPI.getConnectionStatus();
    if (lastStatus.status === 'connected') {
      return lastStatus;
    }
    logger.trace({ status: lastStatus.status }, 'Wallet connection not ready yet; retrying');
    await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
  }

  throw new Error(`Wallet connection did not become "connected" (last status: ${lastStatus?.status ?? 'unknown'})`);
};

/** @internal */
const connectToWallet = (logger: Logger, networkId: string): Promise<ConnectedAPI> => {
  return firstValueFrom(
    fnPipe(
      interval(100),
      map(() => getPreferredCompatibleWallet()),
      tap((wallet) => {
        if (wallet) {
          logger.info(
            { walletId: wallet.id, walletName: wallet.api.name, apiVersion: wallet.api.apiVersion },
            is1AMWallet(wallet) ? 'Using 1AM wallet connector' : 'Using compatible wallet connector',
          );
        } else {
          logger.info('Check for wallet connector API');
        }
      }),
      filter((wallet): wallet is CompatibleWallet => !!wallet),
      tap((wallet) => {
        logger.info(
          { walletId: wallet.id, walletName: wallet.api.name, apiVersion: wallet.api.apiVersion },
          'Compatible wallet connector API found. Connecting.',
        );
      }),
      take(1),
      timeout({
        first: 1_000,
        with: () =>
          throwError(() => {
            logger.error('Could not find wallet connector API');

            return new Error(
              'Could not find the 1AM wallet connector. Please make sure the 1AM wallet extension is installed and enabled, then retry.',
            );
          }),
      }),
      concatMap(async (initialWallet) => {
        logger.info(
          { walletId: initialWallet.id, walletName: initialWallet.api.name },
          'Prompting 1AM wallet authorization popup',
        );
        console.log(
          '>>> PROMPTING WALLET AUTHORIZATION <<<',
          JSON.stringify({ walletId: initialWallet.id, walletName: initialWallet.api.name }),
        );
        const connectedAPI = await connectWithAuthorizationTimeout(initialWallet, networkId);
        const connectionStatus = await waitForConnectedStatus(connectedAPI, logger);
        const status = {
          walletId: initialWallet.id,
          walletName: initialWallet.api.name,
          apiVersion: initialWallet.api.apiVersion,
          connectionStatus: connectionStatus.status,
          requestedNetworkId: networkId,
          walletNetworkId: 'networkId' in connectionStatus ? connectionStatus.networkId : undefined,
        };
        logger.info(status, 'Wallet connector API enabled status');
        console.log('>>> WALLET CONNECTED <<<', JSON.stringify(status));
        return connectedAPI;
      }),
      catchError((error) => {
        const message = error instanceof Error ? error.message : String(error);
        const stack = error instanceof Error ? error.stack : undefined;
        logger.error({ errorMessage: message, stack }, 'Wallet connector API error (diagnostic)');
        console.error('>>> WALLET CONNECTOR ERROR <<<', message);
        if (stack) {
          console.error(stack);
        }
        return throwError(() => (error instanceof Error ? error : new Error(message)));
      }),
    ),
  );
};
