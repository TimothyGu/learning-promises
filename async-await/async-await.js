/**
 * Run a generator function as an async function.
 *
 * @template T
 * @param {Generator<unknown, T | PromiseLike<T>>} gen
 * @returns {Promise<T>}
 */
function asyncRun(gen) {
  return new Promise((resolve, reject) => {
    /**
     * @param {any} value
     * @param {'normal' | 'throw'} normalOrThrow
     */
    function continueGenerator(value, normalOrThrow) {
      let yieldedResult;
      try {
        if (normalOrThrow === 'normal') {
          yieldedResult = gen.next(value);
        } else {
          yieldedResult = gen.throw(value);
        }
      } catch (ex) {
        reject(ex);
        return;
      }

      if (yieldedResult.done) {
        resolve(yieldedResult.value);
        return;
      }

      Promise.resolve(yieldedResult.value).then((resolvedValue) => {
        continueGenerator(resolvedValue, 'normal');
      }, (exception) => {
        continueGenerator(exception, 'throw');
      });
    }

    continueGenerator(undefined, 'normal');
  });
}

// Test code

async function asyncFunction() {
  console.log('asyncFunction', await 42);
}

function* fauxAsyncFunction() {
  console.log('fauxAsyncFunction', yield 42);
}

asyncFunction();
asyncRun(fauxAsyncFunction());
