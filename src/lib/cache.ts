export type CacheKey = string | symbol | number;

const store: Record<CacheKey, unknown> = {};

export const cache = <T>(
  key: string | symbol | number,
  callback: () => T
): T => {
  if (!store[key]) {
    store[key] = callback();
  }

  return store[key] as T;
};
