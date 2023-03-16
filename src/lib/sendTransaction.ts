import {
  FireblocksSDK,
  PeerType,
  TransactionArguments,
  TransactionOperation,
} from 'fireblocks-sdk';
import {
  formatEther,
  formatUnits,
  hexDataLength,
  Logger,
} from 'ethers/lib/utils';
import {BigNumber, logger} from 'ethers';
import {FireblocksAccount} from './getFireblocksAccount';
import {TransactionRequest} from '@ethersproject/providers';

export interface SendTransactionOptions {
  externalWalletId?: string;
  txNote?: string;
}

export const sendTransaction = (
  fireblocks: FireblocksSDK,
  account: Omit<FireblocksAccount, 'address'>,
  transaction: TransactionRequest,
  options: SendTransactionOptions
) => {
  const txArguments: TransactionArguments = {
    operation: getOperation(transaction),
    assetId: account.assetId,
    source: {
      type: PeerType.VAULT_ACCOUNT,
      id: account.vaultId,
    },
    gasPrice: transaction.gasPrice
      ? formatUnits(transaction.gasPrice.toString(), 'gwei')
      : undefined,
    gasLimit: transaction.gasLimit?.toString(),
    destination:
      'externalWalletId' in options
        ? {
            type: PeerType.EXTERNAL_WALLET,
            id: options.externalWalletId,
          }
        : {
            type: PeerType.ONE_TIME_ADDRESS,
            oneTimeAddress: {
              address:
                transaction.to ||
                logger.throwError(
                  'missing transaction to address',
                  Logger.errors.INVALID_ARGUMENT,
                  {
                    transaction,
                    account,
                    options,
                  }
                ),
            },
          },
    note: options.txNote || '',
    amount: formatEther(transaction.value?.toString() || '0'),
    extraParameters: {
      contractCallData: transaction.data,
    },
  };
  return fireblocks.createTransaction(txArguments);
};

function getOperation(transaction: TransactionRequest) {
  if (transaction.data && hexDataLength(transaction.data) > 0) {
    return TransactionOperation.CONTRACT_CALL;
  } else if (transaction.to && BigNumber.from(transaction.value || 0).gt(0)) {
    return TransactionOperation.TRANSFER;
  }
  return logger.throwError(
    'Could not determine a valid transaction type',
    Logger.errors.UNSUPPORTED_OPERATION,
    {
      transaction,
    }
  );
}
