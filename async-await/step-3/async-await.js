/**
 * Run a generator function as an async function.
 *
 * @template T
 * @param {Generator<any, T>} gen
 * @returns {Promise<T>}
 */
function asyncRun(gen) {
  return new Promise((resolve, reject) => {
    const yieldedResult = gen.next();
    if (yieldedResult.done) {
      resolve(yieldedResult.value);
      return;
    }

    yieldedResult.value.then((resolvedValue) => {
      const yieldedResult = gen.next(resolvedValue);
      // TODO: handle more yielded values
    });
  });
}

// Test code

function* printYieldedValue() {
  console.log(new Date(), 'starting printYieldedValue');
  const value = yield Promise.resolve(42);
  console.log(new Date(), 'got yielded value', value);
}

asyncRun(printYieldedValue());
console.log(new Date(), 'after starting printYieldedValue()');
