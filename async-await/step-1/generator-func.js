// Example 1.
function* generator() {
  console.log('generator starts running');
  yield 1;
  console.log('after yield 1');
  const result = yield 2;
  console.log('yield 2 returned', result);

  yield result * Math.PI;

  return result;
}

{
  console.log('Example 1');

  // Create a generator instance, and pause it immediately.
  const instance = generator(); // prints nothing

  console.log('result of first yield', instance.next());
  // > generator starts running
  // > result of first yield { value: 1, done: false }

  console.log('result of second yield', instance.next());
  // > after yield 1
  // > result of second yield { value: 2, done: false }

  // Right now the generator function is paused at the `yield 2` step.
  // We can pass a value INTO the generator by calling .next() with an argument.
  // This value will become the returned value of `yield 2`.
  const valueToPassIntoGenerator = 42;
  console.log('result of third yield', instance.next(valueToPassIntoGenerator));
  // > yield 2 returned 42
  // > result of third yield { value: 131.94689145077132, done: false }

  console.log('result of return', instance.next());
  // > result of return { value: 42, done: true }

  console.log('what if we call next() on a "done" generator?', instance.next());
  // > what if we call next() on a "done" generator? { value: undefined, done: true }
}

// Example 2: countToInfinity() (see footnote [1])
function* countToInfinity(start) {
  let value = start;
  while (true) {
    yield value; // if this were console.log(value), it would be an infinite loop
    value += 1;
  }
}

{
  console.log('Example 2');
  // Start the generator function.
  const instance = countToInfinity(3);

  // Get a few values from it.
  console.log(instance.next());
  // > { value: 3, done: false }

  console.log(instance.next());
  // > { value: 4, done: false }

  console.log(instance.next());
  // > { value: 5, done: false }

  console.log(instance.next());
  // > { value: 6, done: false }
}

// Example 3: Consuming values in a for-of loop
{
  console.log('Example 3');

  const until = 10;
  for (const value of countToInfinity(5)) {
    console.log(value);

    // If we don't stop somewhere, then it would become an infinite loop!
    if (value === until) break;
  }
  // > 5
  // > 6
  // > 7
  // > 8
  // > 9
  // > 10

  // Notice that a for-of loop does not allow passing values into the generator function,
  // since we cannot explicitly call .next() with an argument.
}

// [1] Note, it doesn't actually count to Infinity,
//     but rather to 9007199254740992 (aka Number.MAX_SAFE_INTEGER + 1).
//     This is since 9007199254740992 + 1 === 9007199254740992 due to floating-point precision.
