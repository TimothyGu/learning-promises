# Learning JavaScript promises by building

This is a guide for implementing the JavaScript `Promise` class as a way of learning how it works under the hood. It's perhaps best for people who are familiar with the general shape of promise-based code and/or have used promises a bit in the past.

> [Skip to complete implementation](step-8/promises.js).

## Step 1: `Promise` class [[code](step-1/promises.js)]

We have to start somewhere. We make a boilerplate `Promise` class.

## Step 2: Data model [[code](step-2/promises.js) | [diff](https://github.com/TimothyGu/learning-promises/compare/by-building-tag/step-1...by-building-tag/step-2)]

A promise conceptually consists of two pieces of data: a container for a value that's yet to be populated, and a list of callback functions that get triggered when the promise gets populated (aka _fulfilled_).

In reality, it's a bit more complicated: a promise can also be "rejected", meaning that an exception occurred. A promise can also have `onRejection` callbacks that are called in those cases. So our new class also has an `_onRejected` field.

## Step 3: Creating a `Promise` [[code](step-3/promises.js) | [diff](https://github.com/TimothyGu/learning-promises/compare/by-building-tag/step-2...by-building-tag/step-3)]

A new `Promise` object can be created using its constructor, which works as follows:

```js
const initializer = (resolve, reject) => {
  // To resolve the new promise: resolve(value);
  // To reject the new promise:  reject(value);
};
const prom = new Promise(initializer);
```

The `Promise` constructor is responsible for creating the `resolve` and `reject` functions to provide to the initializer, which we do in our implementation.

A common source of confusion is how the initializer function is used. Here's the answer: the initializer function is called directly in the constructor, and not actually saved in the new promise. This is reflected in our implementation: the set of instance properties remains the same from Step 2.

When the promise gets populated, we should really call the `onFulfill` function. However, doing so is a bit tricky, so we defer that to the next step.

Further reading:
- This initializer pattern is sometimes called the [Revealing Constructor Pattern](https://blog.domenic.me/the-revealing-constructor-pattern/)

## Step 4: Calling `then` callbacks [[code](step-4/promises.js) | [diff](https://github.com/TimothyGu/learning-promises/compare/by-building-tag/step-3...by-building-tag/step-4)]

Callbacks passed to `then` are called when the promise becomes fulfilled or rejected. However, JavaScript promises guarantees that the callbacks are called _asynchronously_. In effect, we just make sure to wrap the calls in a `queueMicrotask`, which defers the function execution so that it's considered "asynchronous".

We have included some test code. Running it with Node.js shows that everything works as expected:

```
$ node step-4/promises.js
2022-08-18T04:46:12.968Z Creating new promise
2022-08-18T04:46:13.977Z Resolving the promise
2022-08-18T04:46:13.980Z First onFulfilled: 1
2022-08-18T04:46:13.981Z Second onFulfilled: 1
```

Further reading:
- [Releasing Zalgo](https://blog.izs.me/2013/08/designing-apis-for-asynchrony/), an article by Isaac Z. Schlueter, about why callbacks _should_ be called asynchronously
- [`queueMicrotask`](https://developer.mozilla.org/en-US/docs/Web/API/queueMicrotask) on MDN Web Docs

## Step 5: Resolving, not fulfulling [[code](step-5/promises.js) | [diff](https://github.com/TimothyGu/learning-promises/compare/by-building-tag/step-4...by-building-tag/step-5)]

So far, we have missed a crucial part of how promises work. Consider the following code:

```js
// A promise that is fulfilled with value 1.
const promiseWith1 = new Promise((resolve) => { resolve(1); });

const newPromise = new Promise((resolve) => {
  // !!! We call resolve with another promise.
  resolve(promiseWith1);
});

// Let's see what value we get in the new promise.
newPromise.then(value => {
  console.log(value);
});
```

With our implementation so far, the value that gets printed is `promiseWith1`. However, if you try running that code in Node.js or the browser directly, you will get `1`. 

It turns out that `resolve` actually has special handling when called with a promise. In particular, resolving with another promise "adopts" that promise's state. In other words, when the other promise gets fulfilled, this promise should get fulfilled as well; ditto for rejected.

> From a terminology standpoint, this illustrates the difference between "resolve" and "fulfill". "Resolving" has the special handling for promises, while "fulfulling" does not. To "fulfill" with value _v_ means to actually populate the promise with _v_.

We add support for this by changing the `_resolve` function. Note: no modifications are made to `_reject`, since rejecting never has special handling for promises.

Further reading:
- Proper promise implementations actually supports resolving any "thenable" (i.e., object that has a `then` method), not just promises. For details, see:
   - [ECMAScript spec](https://tc39.es/ecma262/multipage/control-abstraction-objects.html#sec-promise-resolve-functions)
   - [Promises/A+ spec](https://promisesaplus.com/#the-promise-resolution-procedure): this is a historical spec that is not as precise as ECMAScript, but IMO easier to read

## Step 6: Chaining `then` [[code](step-6/promises.js) | [diff](https://github.com/TimothyGu/learning-promises/compare/by-building-tag/step-5...by-building-tag/step-6)]

So far, we have ignored the possibility of chaining `then` calls, like so:

```js
prom
  .then(value => {
    return furtherProcessing(value);
  })
  .then(resultOfFurtherProcessing => {
    console.log(resultOfFurtherProcessing);
  });
```

We now make this possible. But first, it's important to realize that the `.then()` call happens _synchronously_, while the callback is called _asynchronously_. So it's impossible for the first `.then()` call to return the result of `furtherProcessing()`.

Instead, we make the `.then()` call return a placeholder promise that is subsequently _resolved_ with the return value of the `.then` callback.

## Step 7: The fine print

At this point, most of the implementation is complete. There are just a few last touches to add to our implementation.

### Step 7.1: Catching exceptions [[code](step-7.1/promises.js) | [diff](https://github.com/TimothyGu/learning-promises/compare/by-building-tag/step-6...by-building-tag/step-7.1)]

To ensure that exceptions get turned into a rejected promise, we need to add some `try`-`catch` constructs around user-supplied code.

### Step 7.2: Resolving a promise with itself [[code](step-7.2/promises.js) | [diff](https://github.com/TimothyGu/learning-promises/compare/by-building-tag/step-7.1...by-building-tag/step-7.2)]

It's possible to form cycles in the resolve graph (promise _a_ is resolved with promise _b_, but promise _b_ is resolved with _a_). While in general JavaScript allows this to happen, it provides special handling for one particular case, where a promise is resolved with itself.

### Step 7.3: Memory leaks [[code](step-7.3/promises.js) | [diff](https://github.com/TimothyGu/learning-promises/compare/by-building-tag/step-7.2...by-building-tag/step-7.3)]

Previously, we weren't clearing the `_onFulfilled` and `_onRejected` arrays when the promise gets fulfilled or rejected. While that was an intentional choice for brevity of implementation, we really should be doing it, so that the memory for the callbacks can be freed.

## Step 8: Shortcuts [[code](step-8/promises.js) | [diff](https://github.com/TimothyGu/learning-promises/compare/by-building-tag/step-7.3...by-building-tag/step-8)]

JavaScript also provides a few shortcuts:

Shortcut                    | Meaning
----------------------------|----------------------------------------------
`Promise.resolve(a)`        | `new Promise(resolve => resolve(a))`
`Promise.reject(a)`         | `new Promise((resolve, reject) => reject(a))`
`promise.catch(onRejected)` | `promise.then(null, onRejected)` 

We include these shortcuts in our implementation as well.
