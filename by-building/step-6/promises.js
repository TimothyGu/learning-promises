function _callAsynchronously(func) {
  // Queue a microtask to call func().
  // This has the effect of delaying calling func() a bit,
  // enough so that this counts as calling func() "asynchronously".
  queueMicrotask(func);
}

class Promise {
  constructor(initializer) {
    // Part 1: container for a value yet to be populated.
    this._state = 'pending'; // or 'fulfilled' or 'rejected'
    this._value = undefined;

    // Part 2: functions that should be called when the promise becomes fulfilled or rejected.
    this._onFulfilled = [];
    this._onRejected = [];

    const resolve = (value) => this._resolve(value);
    const reject = (value) => this._reject(value);
    initializer(resolve, reject);
  }

  _resolve(value) {
    if (this._state === 'pending') {
      if (value instanceof Promise) {
        // Special handling for resolving with a promise.
        const otherPromise = value;

        otherPromise.then(
          (value) => this._resolve(value),
          (value) => this._reject(value),
        );
      } else {
        // Not a promise; fulfill with the value.
        this._state = 'fulfilled';
        this._value = value;

        for (const onFulfilled of this._onFulfilled) {
          // Do not call onFulfilled right away.
          // We need to guarantee `onFulfilled` is called "asynchronously".
          _callAsynchronously(() => {
            onFulfilled(value);
          });
        }
      }
    }
  }

  _reject(value) {
    if (this._state === 'pending') {
      this._state = 'rejected';
      this._value = value;

      for (const onRejected of this._onRejected) {
        // See comment in _resolve().
        _callAsynchronously(() => {
          onRejected(value);
        });
      }
    }
  }

  then(onFulfilled, onRejected) {
    const returnedPromise = new Promise(() => {});

    if (typeof onFulfilled === 'function') {
      const wrappedOnFulfilled = (value) => {
        const ret = onFulfilled(value);
        returnedPromise._resolve(ret);
      };

      switch (this._state) {
        case 'pending':
          // If the promise is still pending, then sign up to be notified.
          this._onFulfilled.push(wrappedOnFulfilled);
          break;

        case 'fulfilled': {
          // If the promise is already fulfilled, call the callback directly.
          const value = this._value;
          _callAsynchronously(() => {
            wrappedOnFulfilled(value);
          });
          break;
        }

        case 'rejected':
          // Do nothing.
          break;
      }
    }

    if (typeof onRejected === 'function') {
      const wrappedOnRejected = (value) => {
        const ret = onRejected(value);
        returnedPromise._resolve(ret);
      };

      switch (this._state) {
        case 'pending':
          // If the promise is still pending, then sign up to be notified.
          this._onRejected.push(wrappedOnRejected);
          break;

        case 'rejected': {
          // If the promise is already rejected, call the callback directly.
          const value = this._value;
          _callAsynchronously(() => {
            wrappedOnRejected(value);
          });
          break;
        }

        case 'fulfilled':
          // Do nothing.
          break;
      }
    }

    // If neither callback is provided, the new promise should forward the current promise.
    if (typeof onFulfilled !== 'function' && typeof onRejected !== 'function') {
      returnedPromise._resolve(this);
    }

    return returnedPromise;
  }
}

// Test code.

// A promise that eventually gets fulfilled with value 1.
const promiseWith1 = new Promise((resolve) => {
  setTimeout(() => {
    console.log(new Date(), 'resolving initial promise with 1');
    resolve(1);
  }, 1000);
});

promiseWith1
  .then((prevValue) => {
    // Return a promise that after 1 sec gets fulfilled with 3.
    console.log(new Date(), 'received value:', prevValue);
    return new Promise((resolve) => {
      setTimeout(() => {
        console.log(new Date(), 'resolving chained then');
        resolve(prevValue + 2);
      }, 1000);
    });
  })
  .then((finalValue) => {
    console.log(new Date(), 'final value:', finalValue);
  });

console.log(new Date(), 'after chaining then()');
