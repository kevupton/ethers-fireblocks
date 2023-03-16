import {
  FireblocksSDK,
  PeerType,
  RawMessageData,
  TransactionOperation,
} from 'fireblocks-sdk';
import {FireblocksAccount} from './getFireblocksAccount';

export const signMessage = (
  fireblocks: FireblocksSDK,
  account: Omit<FireblocksAccount, 'address'>,
  rawMessageData: RawMessageData,
  note = ''
) => {
  return fireblocks.createTransaction({
    operation: TransactionOperation.RAW,
    assetId: account.assetId,
    source: {
      type: PeerType.VAULT_ACCOUNT,
      id: account.vaultId,
    },
    extraParameters: {
      rawMessageData,
    },
    note,
  });
};
