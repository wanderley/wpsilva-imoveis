export async function mapAsync<T, U>(
  array: T[],
  callback: (item: T) => Promise<U>,
  options: { workers: number },
) {
  return batchPromises(
    array.map((item) => () => callback(item)),
    options,
  );
}

async function batchPromises<T>(
  promiseFactories: (() => Promise<T>)[],
  options: { workers: number },
) {
  const results: T[] = Array.from({ length: promiseFactories.length });
  const queue = promiseFactories.map((factory, index) => ({
    factory,
    index,
  }));

  const workers = Array.from({ length: options.workers }).map(async (_) => {
    while (queue.length > 0) {
      const next = queue.shift();
      if (next) {
        const result = await next.factory();
        results[next.index] = result;
      }
    }
  });
  await Promise.all(workers);
  return results;
}
