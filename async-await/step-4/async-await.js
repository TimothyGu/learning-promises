/**
 * Run a generator function as an async function.
 *
 * @template T
 * @param {Generator<any, T | PromiseLike<T>>} gen
 * @returns {Promise<T>}
 */
function asyncRun(gen) {
  return new Promise((resolve, reject) => {
    function continueGenerator(value) {
      const yieldedResult = gen.next(value);
      if (yieldedResult.done) {
        resolve(yieldedResult.value);
        return;
      }

      yieldedResult.value.then((resolvedValue) => {
        continueGenerator(resolvedValue);
      });
    }

    continueGenerator(undefined);
  });
}

// Test code

function* resolveAfter2Sec(value) {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(value);
    }, 2000);
  });
}

function* fn() {
  console.log(new Date(), 'start fn');

  const promise = asyncRun(resolveAfter2Sec(42));

  console.log(new Date(), 'before yield');
  const value = yield promise;
  console.log(new Date(), 'got value', value);

  return value * Math.PI;
}

asyncRun(fn())
  .then((returnedValue) => {
    console.log(new Date(), 'got returned value', returnedValue);
  });
console.log(new Date(), 'after starting fn()');
