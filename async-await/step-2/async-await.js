/**
 * Run a generator function as an async function.
 *
 * @template T
 * @param {Generator<any, T | PromiseLike<T>>} gen
 * @returns {Promise<T>}
 */
function asyncRun(gen) {
  return new Promise((resolve, reject) => {
    // TODO
  });
}
