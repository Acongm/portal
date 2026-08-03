function createCounter() {
  let counter = 0;
  const myFunction = function () {
    // console.log('this:', this);
    // console.log('this.counter:', this.counter);
    // if (!this.counter) {
    //   this.counter = 0;
    // }
    counter = counter + 1;

    return counter;
  };
  return myFunction;
}
const increment = createCounter();

const c1 = increment();

const c2 = increment();

const c3 = increment();

console.log('example increment', c1, c2, c3);

function memoizeFunction(func) {
  var cache = {};
  return function () {
    var key = arguments[0];
    if (cache[key]) {
      return cache[key];
    } else {
      console.log('memoizeFunction');
      var val = func.apply(this, arguments);
      cache[key] = val;
      return val;
    }
  };
}

var fibonacci = memoizeFunction(function (n) {
  return n === 0 || n === 1 ? n : fibonacci(n - 1) + fibonacci(n - 2);
});
