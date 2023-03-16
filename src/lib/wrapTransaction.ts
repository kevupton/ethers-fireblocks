import {TransactionResponse} from '@ethersproject/abstract-provider';
import {waitForTxHash} from './waitForTxHash';
import {FireblocksSDK} from 'fireblocks-sdk';
import {Provider, TransactionRequest} from '@ethersproject/providers';
import {hexlify} from 'ethers/lib/utils';
import {BigNumber} from 'ethers';

export const wrapTransaction = (
  fireblocks: FireblocksSDK,
  provider: Provider,
  id: string,
  tx: TransactionRequest
): TransactionResponse => {
  return {
    chainId: tx.chainId!,
    confirmations: 0,
    data: hexlify(tx.data || '0x'),
    from: tx.from!,
    gasLimit: BigNumber.from(tx.gasLimit!),
    nonce: 0,
    value: BigNumber.from(tx.value || 0),
    async wait(confirmations, timeout?: number) {
      const hash = await waitForTxHash(fireblocks, id);
      return provider.waitForTransaction(hash, confirmations, timeout);
    },
    hash: id,
  };
};
