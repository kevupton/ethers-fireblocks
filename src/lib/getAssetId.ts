export const CHAIN_ASSETS: Record<number, string> = {
  5: 'ETH_TEST3',
  1: 'ETH',
};

export const getAssetId = (chainId: number) => {
  if (!CHAIN_ASSETS[chainId]) {
    throw new Error('unsupported chain id');
  }

  return CHAIN_ASSETS[chainId];
};
