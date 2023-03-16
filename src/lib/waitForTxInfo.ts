import {logger} from 'ethers';
import {Logger} from '@ethersproject/logger';
import {
  FireblocksSDK,
  TransactionResponse,
  TransactionStatus,
} from 'fireblocks-sdk';

const FINAL_TRANSACTIONS: TransactionStatus[] = [
  TransactionStatus.COMPLETED,
  TransactionStatus.FAILED,
  TransactionStatus.CANCELLED,
  TransactionStatus.BLOCKED,
  TransactionStatus.REJECTED,
];

export const waitForTxInfo = async (
  fireblocks: FireblocksSDK,
  txId: string,
  retryDelay?: number,
  timeoutMs?: number
): Promise<TransactionResponse> => {
  let resolve!: (value: TransactionResponse) => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<TransactionResponse>((res, rej) => {
    resolve = res;
    reject = rej;
  });

  let hasTimedOut = false;
  const clearTimeout = createTimeout(() => {
    hasTimedOut = true;
    reject(
      logger.makeError(
        `waitForTxCompletion() for txId ${txId} timed out`,
        Logger.errors.TIMEOUT,
        {
          operation: 'waitForTransaction',
          txId,
          timeoutMs,
        }
      )
    );
  }, timeoutMs);

  tryGetTxInfo(txId, fireblocks, () => !hasTimedOut, retryDelay)
    .then(txInfo => {
      clearTimeout();
      resolve(txInfo);
    })
    .catch(error => reject(error));

  return promise;
};

const tryGetTxInfo = async (
  txId: string,
  fireblocks: FireblocksSDK,
  shouldRetry: () => boolean,
  retryDelay = 1000
): Promise<TransactionResponse> => {
  do {
    const txInfo = await fireblocks.getTransactionById(txId).catch(error => {
      logger.debug('trying to get tx id', error);
      return undefined;
    });

    if (txInfo && FINAL_TRANSACTIONS.includes(txInfo.status)) {
      if (txInfo.status !== TransactionStatus.COMPLETED) {
        logger.throwError(
          `Transaction was not completed successfully. Final Status: ${txInfo.status}`,
          Logger.errors.ACTION_REJECTED,
          {
            operation: 'waitForTransaction',
            txInfo,
            status: txInfo.status,
          }
        );
      }

      return txInfo;
    }

    await new Promise(r => setTimeout(r, retryDelay));
  } while (shouldRetry());

  return logger.throwError(
    'Failed fetching txHash',
    Logger.errors.UNKNOWN_ERROR,
    {
      operation: 'waitForTransaction',
      txId,
    }
  );
};

const createTimeout = (cb: () => void, timeoutMs?: number) => {
  const timeout = timeoutMs ? setTimeout(cb, timeoutMs) : undefined;
  return () => clearTimeout(timeout);
};
