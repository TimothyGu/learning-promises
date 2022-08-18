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
    if (typeof onFulfilled === 'function') {
      switch (this._state) {
        case 'pending':
          // If the promise is still pending, then sign up to be notified.
          this._onFulfilled.push(onFulfilled);
          break;

        case 'fulfilled': {
          // If the promise is already fulfilled, call the callback directly.
          const value = this._value;
          _callAsynchronously(() => {
            onFulfilled(value);
          });
          break;
        }

        case 'rejected':
          // Do nothing.
          break;
      }
    }

    if (typeof onRejected === 'function') {
      switch (this._state) {
        case 'pending':
          // If the promise is still pending, then sign up to be notified.
          this._onRejected.push(onRejected);
          break;

        case 'rejected': {
          // If the promise is already rejected, call the callback directly.
          const value = this._value;
          _callAsynchronously(() => {
            onRejected(value);
          });
          break;
        }

        case 'fulfilled':
          // Do nothing.
          break;
      }
    }
  }
}

// Test code.

// A promise that is fulfilled with value 1.
const promiseWith1 = new Promise((resolve) => { resolve(1); });

const newPromise = new Promise((resolve) => {
  // !!! We call resolve with another promise.
  resolve(promiseWith1);
});

// Let's see what value we get in the new promise.
newPromise.then((value) => {
  console.log(value);
});
