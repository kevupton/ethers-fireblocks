import 'dotenv/config';
import {FireblocksSigner} from '../src/fireblocks-signer';
import {FireblocksSDK} from 'fireblocks-sdk';
import {JsonRpcProvider} from '@ethersproject/providers';
import {formatUnits, parseUnits} from 'ethers/lib/utils';
import fs from 'fs';
import path from 'path';
import {WETH9__factory} from './lib/WETH9__factory';

const FIREBLOCKS_PRIVATE_KEY = fs.readFileSync(
  path.join(__dirname, '../fireblocks_secret.key'),
  'utf8'
);
const {JSON_RPC_URL, FIREBLOCKS_API_KEY, TEST_ADDRESS, WETH_ADDRESS} =
  process.env;

if (
  !JSON_RPC_URL ||
  !FIREBLOCKS_API_KEY ||
  !FIREBLOCKS_PRIVATE_KEY ||
  !WETH_ADDRESS
) {
  throw new Error('missing environment variables');
}

describe('FireblocksSigner', () => {
  let signer: FireblocksSigner;
  let fireblocks: FireblocksSDK;
  let provider: JsonRpcProvider;

  beforeEach(async () => {
    provider = new JsonRpcProvider(JSON_RPC_URL);
    fireblocks = new FireblocksSDK(FIREBLOCKS_PRIVATE_KEY, FIREBLOCKS_API_KEY);
    signer = new FireblocksSigner(fireblocks, provider);
  });

  it.skip(
    'should be able to submit a transaction request',
    async () => {
      const tx = await signer.sendTransaction({
        to: TEST_ADDRESS,
        value: parseUnits('0.01', 'gwei'),
      });

      console.log(tx);
      console.log(await tx.wait());
    },
    1000 * 60 * 5
  );

  it(
    'should be able to sign a transaction',
    async () => {
      const content = await signer.signMessage('hello world');
      console.log('content', content);
    },
    1000 * 60 * 5
  );

  it.skip(
    'should be able to deposit to a contract',
    async () => {
      const weth = WETH9__factory.connect(WETH_ADDRESS, signer);
      const tx = await weth.deposit({
        value: parseUnits('0.01', 'gwei'),
      });
      console.log(tx);
      console.log(await tx.wait());
    },
    1000 * 60 * 5
  );
});
