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

_Generator functions_ (`function*`) are JavaScript functions that explicitly allow pausing and continuing at specific points marked by `yield`. They typically look something like
```js
function* foo() {
  console.log('point 1');
  yield;
  console.log('point 2');
  yield;
  console.log('point 3');
}
```

Here's how a caller can control when to continue running `foo()`:
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

Code between two `yield` expressions follows the general run to completion semantics. So a concise way of describing generator functions is that they “run to completion _or `yield`”._

---

Not only can generator functions pause and continue, the `yield` keyword also allows communication between the generator function and its caller.

**From generator to caller:** The expression `yield 42` would pause the generator function and pass the value `42` back to its caller.

**From caller to generator:** The caller can deliver values _into_ the generator function by passing an argument to `.next()`, say `.next(v)`. As the function continues running, it will pretend the `yield` expression has `v` as its return value.

At this point, practice your understanding of generator functions by visiting the \[code] link in the heading. Make sure to work through the code – you’ll need a solid understanding to get the most out of the remaining steps of this guide!

Further reading:
* Wikipedia article on [generators](https://en.wikipedia.org/wiki/Generator_(computer_programming))
* MDN Web Docs article on [generator functions](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/function*)

## Step 2: Preliminaries [[code](step-2/async-await.js)]

If you look back at the [table](#actual-vs-us) at the beginning of this post, you’ll start to notice a few things:

* We will write async functions as generator functions.
* Pretty much all the work we do here will be in a single `asyncRun` function. Everything else in the “What we will implement” column is stuff built into JavaScript (`function*`, `yield`).

The `asyncRun` function is truly the centerpiece of this guide, so let’s define it more rigorously.

**Arguments:** It only takes a single argument, which will be an instance of a generator function (e.g., `asyncRun(fn())`, where `fn` is a `function*`).

**Return value:** It returns a promise (see `const promise = asyncRun(fn())`).

Notice how it returns a promise rather than a generator instance. This means that `asyncRun` itself cannot be a generator function.

Given what we now know, let us create a basic skeleton for `asyncRun`.

## Step 3: Creating a `Promise` [[code](step-3/async-await.js) | [diff](https://github.com/TimothyGu/learning-promises/compare/async-await-tag/step-2...async-await-tag/step-3)]


## Step 4: Calling `then` callbacks [[code](step-4/async-await.js) | [diff](https://github.com/TimothyGu/learning-promises/compare/async-await-tag/step-3...async-await-tag/step-4)]


## Step 5: Resolving, not fulfilling [[code](step-5/async-await.js) | [diff](https://github.com/TimothyGu/learning-promises/compare/async-await-tag/step-4...async-await-tag/step-5)]


## Step 6: Chaining `then` [[code](step-6/async-await.js) | [diff](https://github.com/TimothyGu/learning-promises/compare/async-await-tag/step-5...async-await-tag/step-6)]


## Step 7: The fine print

### Step 7.1: Catching exceptions [[code](step-7.1/async-await.js) | [diff](https://github.com/TimothyGu/learning-promises/compare/async-await-tag/step-6...async-await-tag/step-7.1)]

### Step 7.2: Resolving a promise with itself [[code](step-7.2/async-await.js) | [diff](https://github.com/TimothyGu/learning-promises/compare/async-await-tag/step-7.1...async-await-tag/step-7.2)]

### Step 7.3: Memory leaks [[code](step-7.3/async-await.js) | [diff](https://github.com/TimothyGu/learning-promises/compare/async-await-tag/step-7.2...async-await-tag/step-7.3)]

## Step 8: Shortcuts [[code](step-8/async-await.js) | [diff](https://github.com/TimothyGu/learning-promises/compare/async-await-tag/step-7.3...async-await-tag/step-8)]

