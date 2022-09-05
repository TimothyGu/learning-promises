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
      let yieldedResult;
      try {
        yieldedResult = gen.next(value);
      } catch (ex) {
        reject(ex);
        return;
      }

      if (yieldedResult.done) {
        resolve(yieldedResult.value);
        return;
      }

      yieldedResult.value.then((resolvedValue) => {
        continueGenerator(resolvedValue);
      }, (exception) => {
        reject(exception);
      });
    }

    continueGenerator(undefined);
  });
}

// Test code

function* fnThatThrows() {
  throw new Error('oops');
}

function* awaitRejectedPromise() {
  yield asyncRun(fnThatThrows());
}

asyncRun(fnThatThrows())
  .catch((ex) => {
    console.log(new Date(), 'got exception from fnThatThrows', ex);
  });

asyncRun(awaitRejectedPromise())
  .catch((ex) => {
    console.log(new Date(), 'got exception from awaitRejectedPromise', ex);
  });
