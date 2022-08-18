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
    try {
      initializer(resolve, reject);
    } catch (e) {
      this._reject(e);
    }
  }

  static resolve(value) {
    return new Promise((resolve) => {
      resolve(value);
    });
  }

  static reject(value) {
    return new Promise((resolve, reject) => {
      reject(value);
    });
  }

  _resolve(value) {
    if (this._state === 'pending') {
      if (value instanceof Promise) {
        // Special handling for resolving with a promise.
        const otherPromise = value;

        if (this === otherPromise) {
          this._reject(new TypeError('Chaining cycle detected'));
        } else {
          otherPromise.then(
            (value) => this._resolve(value),
            (value) => this._reject(value),
          );
        }
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

        this._onFulfilled = null;
        this._onRejected = null;
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

      this._onFulfilled = null;
      this._onRejected = null;
    }
  }

  then(onFulfilled, onRejected) {
    const returnedPromise = new Promise(() => {});

    if (typeof onFulfilled === 'function') {
      const wrappedOnFulfilled = (value) => {
        try {
          const ret = onFulfilled(value);
          returnedPromise._resolve(ret);
        } catch (e) {
          returnedPromise._reject(e);
        }
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
        try {
          const ret = onRejected(value);
          returnedPromise._resolve(ret);
        } catch (e) {
          returnedPromise._reject(e);
        }
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

  catch(onRejected) {
    this.then(null, onRejected);
  }
}
