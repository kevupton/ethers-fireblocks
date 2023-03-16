import {logger} from 'ethers';
import {Logger} from '@ethersproject/logger';
import {FireblocksSDK} from 'fireblocks-sdk';

export interface FireblocksAccount {
  address: string;
  vaultId: string;
  assetId: string;
}

export const getFireblocksAccount = async (
  fireblocks: FireblocksSDK,
  assetId: string
): Promise<FireblocksAccount> => {
  const pageInfo = await fireblocks.getVaultAccountsWithPageInfo({
    minAmountThreshold: 1e-18,
    assetId,
  });
  for (let i = 0; i < pageInfo.accounts.length; i++) {
    const account = pageInfo.accounts[i];
    const addresses = await fireblocks.getDepositAddresses(account.id, assetId);

    const address = addresses.find(({type}) => type === 'Permanent');
    if (address) {
      return {
        address: address.address,
        vaultId: account.id,
        assetId: assetId,
      };
    }
  }

  return logger.throwError(
    'no supported address for ' + assetId,
    Logger.errors.ACTION_REJECTED,
    {
      operation: 'getFireblocksAddress',
    }
  );
};
