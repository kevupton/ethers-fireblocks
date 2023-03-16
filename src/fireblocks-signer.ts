import {BigNumber, BytesLike, logger, Signer} from 'ethers';
import {Deferrable, hexlify, isBytesLike, toUtf8Bytes} from 'ethers/lib/utils';
import {Provider, TransactionRequest} from '@ethersproject/providers';
import {Logger} from '@ethersproject/logger';
import {TransactionResponse} from '@ethersproject/abstract-provider';
import {resolveProperties, shallowCopy} from '@ethersproject/properties';
import {FireblocksSDK} from 'fireblocks-sdk';
import {
  cache,
  getAssetId,
  getFireblocksAccount,
  sendTransaction,
  waitForTxInfo,
  wrapTransaction,
} from './lib';
import {signMessage} from './lib/signMessage';

export class FireblocksSigner extends Signer {
  #fireblocks: FireblocksSDK;

  constructor(fireblocks: FireblocksSDK, public readonly provider: Provider) {
    super();
    this.#fireblocks = fireblocks;
  }

  connect(provider: Provider): FireblocksSigner {
    return new FireblocksSigner(this.#fireblocks, provider);
  }

  async getAddress(): Promise<string> {
    const account = await this.getAccountDetails();
    return account.address;
  }

  async signMessage(
    message: BytesLike,
    bip44addressIndex = 0
  ): Promise<string> {
    const content = hexlify(
      isBytesLike(message) ? message : toUtf8Bytes(message)
    );

    const response = await signMessage(
      this.#fireblocks,
      await this.getAccountDetails(),
      {
        messages: [
          {
            content,
            bip44addressIndex,
          },
        ],
      }
    );
    const {signedMessages} = await waitForTxInfo(this.#fireblocks, response.id);
    if (!signedMessages) {
      return logger.throwError(
        'missing signedTransactions from response',
        Logger.errors.UNKNOWN_ERROR,
        {
          operation: 'signMessage',
          message,
        }
      );
    }

    const signature = signedMessages[0].signature;
    return `${
      signature.v ? BigNumber.from(signature.v).add(31).toHexString() : ''
    }${signature.fullSig}`;
  }

  signTransaction(): Promise<string> {
    return logger.throwError(
      'signing transactions is unsupported',
      Logger.errors.UNSUPPORTED_OPERATION,
      {
        operation: 'signTransaction',
      }
    );
  }

  async prepareTransaction(
    transaction: Deferrable<TransactionRequest>
  ): Promise<TransactionRequest> {
    transaction = shallowCopy(transaction);

    const network = await this.provider.getNetwork();

    transaction.chainId = network.chainId;

    const fromAddress = this.getAddress().then(address => {
      if (address) {
        address = address.toLowerCase();
      }
      return address;
    });

    // The JSON-RPC for eth_sendTransaction uses 90000 gas; if the user
    // wishes to use this, it is easy to specify explicitly, otherwise
    // we look it up for them.
    if (transaction.gasLimit === undefined || transaction.gasLimit === null) {
      const estimate = shallowCopy(transaction);
      estimate.from = fromAddress;
      transaction.gasLimit = this.provider.estimateGas(estimate);
    }

    transaction.to = Promise.resolve(transaction.to).then(async to => {
      if (to) {
        const address = await this.provider.resolveName(to);
        if (!address) {
          logger.throwArgumentError(
            'provided ENS name resolves to null',
            'tx.to',
            transaction.to
          );
        }
        return address;
      }
      return to;
    });

    const {tx, sender} = await resolveProperties({
      tx: resolveProperties<TransactionRequest>(transaction),
      sender: fromAddress,
    });

    if (tx.from) {
      if (tx.from.toLowerCase() !== sender) {
        logger.throwArgumentError(
          'from address mismatch',
          'transaction',
          transaction
        );
      }
    } else {
      tx.from = sender;
    }

    return tx;
  }

  async sendTransaction(
    transaction: Deferrable<TransactionRequest>
  ): Promise<TransactionResponse> {
    const tx = await this.prepareTransaction(transaction);
    const account = await this.getAccountDetails();
    const {id} = await sendTransaction(this.#fireblocks, account, tx, {});
    return wrapTransaction(this.#fireblocks, this.provider, id, tx);
  }

  async getAccountDetails() {
    return cache('fireblocksAccount', async () => {
      return getFireblocksAccount(this.#fireblocks, await this.getAssetId());
    });
  }

  async getAssetId() {
    return cache('assetId', async () => {
      const network = await this.provider.getNetwork();
      return getAssetId(network.chainId);
    });
  }
}
