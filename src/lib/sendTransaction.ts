import {
  FireblocksSDK,
  PeerType,
  TransactionArguments,
  TransactionOperation,
} from 'fireblocks-sdk';
import {formatEther, formatUnits, Logger} from 'ethers/lib/utils';
import {logger} from 'ethers';
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
    operation: TransactionOperation.CONTRACT_CALL,
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
