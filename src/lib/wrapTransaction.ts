import {TransactionResponse} from '@ethersproject/abstract-provider';
import {waitForTxInfo} from './waitForTxInfo';
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
      const {txHash} = await waitForTxInfo(fireblocks, id);
      return provider.waitForTransaction(txHash, confirmations, timeout);
    },
    hash: id,
  };
};
