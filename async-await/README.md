# `async`–`await`

In this guide, we will learn how the `async`–`await` keywords work in JavaScript – by building our versions of the keywords!

Unfortunately, we cannot create new keywords in JavaScript, so we will have to settle for something a bit less nice-looking but still gets the point across. See below for an example of what we will complete today.

<table id="actual-vs-us">
<thead><tr><th>Actual <code>async</code>–<code>await</code></th><th>What we will implement</th></tr></thead>
<tr><td><code>async function</code></td><td><code>function*</code></td></tr>
<tr><td><code>fn(</code>[…<var>args</var>]<code>)</code> (where <code>fn</code> is an async function)</td><td><code>asyncRun(fn(</code>[…<var>args</var>]<code>))</code></td></tr>
<tr><td><code>await</code></td><td><code>yield</code></td></tr>
<tr><td>

```js
async function fn() {
  const backgroundPromise = backgroundTask();
  const result = await fetchData();
  const result2 = await process(result);
  await backgroundPromise;
  return result2;
}

const promise = fn();
promise.then((data) => {
  console.log(data);
});
```

</td><td>

```js
function* fn() {
  const backgroundPromise = asyncRun(backgroundTask());
  const result = yield asyncRun(fetchData());
  const result2 = yield asyncRun(process(result));
  yield backgroundPromise;
  return result2;
}

const promise = asyncRun(fn());
promise.then((data) => {
  console.log(data);
});
```

</td></tr></table>

The `function*` keyword defines a special kind of JavaScript function called a _generator function._ We will be using generator functions extensively in order to simulate `async` functions.

## Step 0: Run to completion
Typically, JavaScript functions always “run to completion,” meaning that they will continue running until a value is returned or an exception is thrown.

Async functions are different. When an async function `await`s a promise, the rest of the function body is not run until the promise becomes fulfilled or rejected.

```js
async function fn() {
  console.log('Running in async function!');

  const promiseThatResolvesAfter2Sec = new Promise((resolve) => {
    setTimeout(resolve, 2000);
  });
  console.log('Uh oh');
  await promiseThatResolvesAfter2Sec;

  console.log('This gets run after two seconds');
}

fn();
console.log('Outside async function');

// > Running in async function!
// > Uh oh
// > Outside async function
// > This gets run after two seconds
```

Notice how the line “Outside async function” is printed _between_ two lines printed inside the async function. This shows that unlike typical JavaScript functions, _while_ the async function is waiting for a promise, other JavaScript code is allowed to run. More concisely, async functions do not necessarily run to completion!

Because of this fundamental difference between ordinary functions and async functions, we cannot easily implement `async`–`await` on top of ordinary functions. We need something that provides non-run-to-completion semantics.

Fortunately, JavaScript has exactly such a primitive.

## Step 1: Generator functions – functions that can pause [[code](step-1/generator-func.js)]

_Generator functions_ (`function*`) are JavaScript functions that can be suspended and resumed at specific points marked by `yield`. They typically look something like:
```js
function* foo() {
  console.log('point 1');
  yield;
  console.log('point 2');
  yield;
  console.log('point 3');
}
```

Here’s how a caller can control when to resume running `foo()`:
```js
const instance = foo();
instance.next();  // run foo() up to the first yield
// > point 1
instance.next();  // run foo() up to the second yield
// > point 2

// We can even have two instances of foo() running at the same time.
const instance2 = foo();
instance2.next();
// > point 1

instance.next();  // finish running the first instance of foo()
// > point 3
```

Code between two `yield` expressions follows the general JavaScript run-to-completion semantics. So a concise way to describe generator functions is that they “run to completion _or `yield`”._

---

Not only can generator functions be suspended and resumed, the `yield` keyword also allows communication between the generator function and its caller.

**From generator to caller:** The expression `yield 42` would suspend the generator function and pass the value `42` back to its caller.
```js
function* foo() { yield 42; }
const instance = foo();
console.log(instance.next());
// > { value: 42, done: false }
```

**From caller to generator:** The caller can deliver values _into_ the generator function by passing an argument to `.next()`, say `.next(v)`. As the function resumes running, it will pretend the `yield` expression has `v` as its return value.
```js
function* foo() { console.log(yield); }
const instance = foo();
instance.next(); // begin running the generator function until `yield`
instance.next(42);
// > 42
```

At this point, practice your understanding of generator functions by visiting the \[code] link in the heading. Make sure to work through the code – you’ll need a solid understanding to get the most out of the remaining steps of this guide!

Further reading:
* Wikipedia article on [generators](https://en.wikipedia.org/wiki/Generator_(computer_programming))
* MDN Web Docs article on [generator functions](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/function*)

## Step 2: Preliminaries [[code](step-2/async-await.js)]

If you look back at the [table](#actual-vs-us) at the beginning of this post, you might start to notice a few things:

* We will write async functions as generator functions.
* Pretty much all the work we need to do will be in a single `asyncRun` function. Everything else in the “What we will implement” column is built into JavaScript (`function*`, `yield`).

The `asyncRun` function is truly the centerpiece of this guide, so let’s define it more rigorously.

> **Arguments:** It only takes a single argument, which will be an instance of a generator function (e.g., `asyncRun(fn())`, where `fn` is a `function*`). From here on, we will call such an instance a **generator**.
>
> > _generator function_ = `function* foo() {}`  
> > _generator_ = `foo()`
>
> **Return value:** It returns a promise (see `const promise = asyncRun(fn())`).

Notice how `asyncRun` returns a promise rather than a generator. This means that `asyncRun` itself cannot be a generator function.

Given what we now know, let us create a basic skeleton for `asyncRun` with some appropriate TypeScript JSDoc.

## Step 3: First steps [[code](step-3/async-await.js) | [diff](https://github.com/TimothyGu/learning-promises/compare/async-await-tag/step-2...async-await-tag/step-3)]

Let’s try to get the simplest code working: a single `await`/`yield`.

<table>
<tr><td>

```js
async function printAwaitedValue() {
  const value = await Promise.resolve(42);
  console.log(new Date(), 'got awaited value', value);
}
printAwaitedValue();
```

</td><td>

```js
function* printYieldedValue() {
  const value = yield Promise.resolve(42);
  console.log(new Date(), 'got yielded value', value);
}
asyncRun(printYieldedValue());
```

</td></tr></table>

Conceptually, one can think of the `await` keyword as doing two separate things:
1. Suspend the current function, and
2. Arrange so that the current function is woken up when the promise becomes fulfilled or rejected.

The suspension part is exactly what `yield` does; we only need to write code to satisfy the second part.

In `asyncRun`, we first call `gen.next()` to start the generator function. If we get `done === true`, then that means the function has already returned, so we resolve the returned promise.

Otherwise, the `value` we get would be the promise that we passed into `yield` (`Promise.resolve(42)` in the above example). As such, we attach a `then` handler, and resume the function when the promise has been fulfilled.

> We will deal with error handling and promise rejection later in Step 5.

## Step 4: Multiple `await`s [[code](step-4/async-await.js) | [diff](https://github.com/TimothyGu/learning-promises/compare/async-await-tag/step-3...async-await-tag/step-4?w=1)]

We left a TODO in the previous step to handle additional `yield` values. We want to apply the same strategy earlier when the generator function yields again: if done then resolve, otherwise attach `then` handler. To avoid copying code, and also to make our code work with any number of `yield`s, we use a little recursion.

## Step 5: Error handling

Now, let’s take a look at handling errors properly.

### Step 5.1: Simple error handling [[code](step-5.1/async-await.js) | [diff](https://github.com/TimothyGu/learning-promises/compare/async-await-tag/step-4...async-await-tag/step-5.1)]

There are two potential sources of errors in an async function:

* The function itself throws an exception
  ```js
  async function foo() { throw new Error(); }
  ```

* One of the `await`ed promises becomes rejected.
  ```js
  async function foo() { await Promise.reject(new Error()); }
  ```

Exceptions thrown from a generator function shows up as an exception from `gen.next()`.  So we deal with the first case by wrapping `gen.next()` in a `try`–`catch` block.

For the second case, we can add an `onRejected` handler to `yieldedResult.value.then`.

### Step 5.2: Make `try`–`catch`–`finally` work [[code](step-5.2/async-await.js) | [diff](https://github.com/TimothyGu/learning-promises/compare/async-await-tag/step-5.1...async-await-tag/step-5.2)]

Unfortunately, the code we introduced in the previous step does not allow custom error handling within the async function:

<table>
<tr><td>

```js
async function foo() {
  try {
    await Promise.reject(new Error());
  } catch (err) {
    return 42; // default value
  }
}
```

</td><td>

```js
function* foo() {
  try {
    yield Promise.reject(new Error());
  } catch (err) {
    return 42; // default value
  }
}
```

</td></tr></table>

For us to get the desired behavior of returning 42, we essentially want the `yield` expression to throw an exception to land us in the `catch` clause. But so far, we have only been able to make `yield` return a normal value. What do we do?

It turns out that JavaScript generator objects have a [`throw`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Generator/throw) method that does exactly what we want: make the `yield` expression throw an exception. We call this method whenever an `await`ed promise ends up being rejected.

> Generator objects also have a special [`return`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Generator/return) method to make the `yield` expression acts like a `return` statement.

## Step 6: Final touches [[code](step-6/async-await.js) | [diff](https://github.com/TimothyGu/learning-promises/compare/async-await-tag/step-5.2...async-await-tag/step-6)]

It feels a bit strange, but it turns out JavaScript lets you `await` _any_ value, not just promises. For `await v`, if `v` is not a promise, then JavaScript would continue running the rest of the function pretending `await v` is the same as `v` – but asynchronously.

<table>
<tr><td>

```js
async function printAwaitedValue() {
  console.log('Before await');
  console.log(await 42);
  console.log('After await');
}
console.log('Before start');
printAwaitedValue();
console.log('After start');
// > Before start
// > Before await
// > After start
// > 42
// > After await
```

</td><td>

```js
function* printYieldedValue() {
  console.log('Before yield');
  console.log(yield 42);
  console.log('After yield');
}
console.log('Before start');
asyncRun(printYieldedValue());
console.log('After start');
// > Before start
// > Before yield
// > After start
// > 42
// > After yield
```

</td></tr></table>

At this point, we can also make the type annotation a bit stricter.

## Parting words

The approach discussed in this guide was first pioneered by the library [Co version 4](https://www.npmjs.com/package/co) by TJ Holowaychuk and Jonathan Ong, and is also used in [Babel](https://babeljs.io/repl#?browsers=&build=&builtIns=false&corejs=false&spec=false&loose=false&code_lz=IYZwngdgxgBAZgV2gFwJYHsL3egFAShgG8AoGGAJwFNkEKtgB3YVZGABQvQFtUQqAdNRDoANgDcquAIwAGQgGoYTFmwDMsgNwkAvkA&debug=false&forceAllTransforms=false&shippedProposals=false&circleciRepo=&evaluate=false&fileSize=false&timeTravel=false&sourceType=script&lineWrap=false&presets=env&prettier=true&targets=Node-7&version=7.19.0&externalPlugins=&assumptions=%7B%7D) to compile async function.

Historically, generator functions and `Promise` were introduced to JavaScript in ECMAScript 2015 (aka ES6), while async functions were introduced later in ECMAScript 2016 (aka ES7). Even though generator functions are used much by themselves, specifying it earlier created the necessary foundations for `async`–`await`. Indeed, most JavaScript engines internally implement async functions on top of generator functions.

That being said, generator functions are no slouch either, and I wish they were used more in the JavaScript ecosystem. They enable cool things like infinite iterables (see the `countToInfinity` function in step 1) and lazy pipelines, and are JavaScript’s answer to Python’s iterables. (For what it’s worth, Python has [generator functions](https://docs.python.org/3/glossary.html#term-generator) too.) Efforts like the [iter-tools](https://www.npmjs.com/package/iter-tools) package and [Iterator Helpers](https://github.com/tc39/proposal-iterator-helpers) TC39 proposal will hopefully make them even more useful.

Lastly, a few more cool things:

* [Regenerator](https://facebook.github.io/regenerator/) is a tool that translates generator functions (and by extension, async functions) to regular functions using finite state machines.
* [Async generator functions](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/async_function*) (aka `async function*`), first introduced in ES2018, allow both `await` and `yield` to appear in the same function!
