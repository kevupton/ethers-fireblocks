# ethers-fireblocks

Integrate Fireblocks into ethers, using a signer. 

## Installation

```bash
# npm
npm i -s ethers-fireblocks
# yarn
yarn add ethers-fireblocks
```

## Usage

```ts
import {FireblocksSigner} from "ethers-fireblocks";
import {JsonRpcProvider} from "@ethersproject/providers";
import {FireblocksSDK} from "fireblocks-sdk";

const fireblocks = new FireblocksSDK(privateKey, apiKey);

// Can be any kind of ethers `Provider`
const provider = new JsonRpcProvider('someRPCURl');

// create the signer
const signer = new FireblocksSigner(fireblocks, provider);
```
