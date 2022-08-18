class Promise {
  constructor(initializer) {
    // Part 1: container for a value yet to be populated.
    this._state = 'pending'; // or 'fulfilled' or 'rejected'
    this._value = undefined;

    // Part 2: functions that should be called when the promise becomes fulfilled or rejected.
    this._onFulfilled = [];
    this._onRejected = [];

    const resolve = value => this._resolve(value);
    const reject = value => this._reject(value);
    initializer(resolve, reject);
  }

  _resolve(value) {
    if (this._state === 'pending') {
      this._state = 'fulfilled';
      this._value = value;

      // TODO: call each function in this._onFulfilled
    }
  }

  _reject(value) {
    if (this._state === 'pending') {
      this._state = 'rejected';
      this._value = value;

      // TODO: call each function in this._onRejected
    }
  }

  then(onFulfilled, onRejected) {
    if (typeof onFulfilled === 'function') {
      switch (this._state) {
        case 'pending':
          // If the promise is still pending, then sign up to be notified.
          this._onFulfilled.push(onFulfilled);
          break;

        case 'fulfilled':
          // If the promise is already fulfilled, call the callback directly.

          // TODO: call onFulfilled(this._value)
          break;

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

        case 'rejected':
          // If the promise is already rejected, call the callback directly.

          // TODO: call onRejected(this._value)
          break;

        case 'fulfilled':
          // Do nothing.
          break;
      }
    }
  }
}
