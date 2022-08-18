class Promise {
  constructor() {
    // Part 1: container for a value yet to be populated.
    this._state = 'pending'; // or 'fulfilled' or 'rejected'
    this._value = undefined;

    // Part 2: functions that should be called when the promise becomes fulfilled or rejected.
    this._onFulfilled = [];
    this._onRejected = [];
  }

  then(onFulfilled, onRejected) {
    if (typeof onFulfilled === 'function') {
      this._onFulfilled.push(onFulfilled);
    }
    if (typeof onRejected === 'function') {
      this._onRejected.push(onRejected);
    }
  }
}
