import {Bytes, logger, Signer} from "ethers";
import {Deferrable} from "ethers/lib/utils";
import {TransactionRequest} from "@ethersproject/providers";
import {FireblocksProvider} from "./fireblocks-provider";
import {Logger} from "@ethersproject/logger";

export class FireblocksSigner extends Signer {
  connect(provider: FireblocksProvider): Signer {
    return undefined;
  }

  getAddress(): Promise<string> {
    return logger.throwError("fireblocks signer is not aware of an address", Logger.errors.UNSUPPORTED_OPERATION, {
      operation: "signTransaction"
    });
  }

  signMessage(message: Bytes | string): Promise<string> {
    return logger.throwError("fetching balance is unsupported for fireblocks provider", Logger.errors.UNSUPPORTED_OPERATION, {
      operation: "signTransaction"
    });
  }

  signTransaction(
    transaction: Deferrable<TransactionRequest>
  ): Promise<string> {
    return logger.throwError("fetching balance is unsupported for fireblocks provider", Logger.errors.UNSUPPORTED_OPERATION, {
      operation: "signTransaction"
    });
  }
}
