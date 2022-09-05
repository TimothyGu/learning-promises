function asyncRun(gen) {
  return new Promise((resolve, reject) => {
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

      yieldedResult.value.then((resolvedValue) => {
        continueGenerator(resolvedValue, 'normal');
      }, (exception) => {
        continueGenerator(exception, 'throw');
      });
    }

    continueGenerator(undefined, 'normal');
  });
}

// Test code

function* fnThatThrows() {
  throw new Error('oops');
}

function* complexErrorHandling() {
  try {
    yield asyncRun(fnThatThrows());
  } catch (ex) {
    console.log(new Date(), 'caught', ex);
  }

  console.log(new Date(), 'continue running');

  try {
    yield Promise.reject(new Error('deliberate error'));
  } finally {
    console.log(new Date(), 'clean up');
  }
}

asyncRun(complexErrorHandling())
  .catch((ex) => {
    console.log(new Date(), 'got exception from complexErrorHandling', ex);
  });
