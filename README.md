#drainage

> Simple pausable id based queue system with shortage notification

## Install

```shell
npm install drainage
```

## Documentation

```javascript
var drainage = require('drainage');

// concurrency is by default 1
var queue = drainage({concurrency: 100}, function (task) {
  process.nextTick(function () {
    console.log(task.message);

    // Call done when the task has been handled or failed to do so
    queue.done(task);
  });
});

// All tasks must have some id, also note that queue perform no validation
// of this!
queue.push({id: 0, message: 'hallo world'});

queue.on('shortage', function (amount) {
  // `amount` is a number there is >= 0 and indicates the needed amount of tasks

  if (amount === 0) {
    // The amount of tasks there are in progress is equal to the max concurrency
    // you should consider pulling more tasks since there will soon be a shortage
  } else {
    // The amount of tasks there are in progress is less than the max concurrency
    // you should really pull more tasks if possible
  }
});

// Tasks in the queue will not be processed, tasks there are in process can still
// be completed
queue.pause();

// Start processing tasks, no need to call this unless `.pause` has been called
queue.resume();
```

##License

**The software is license under "MIT"**

> Copyright (c) 2013 Andreas Madsen
>
> Permission is hereby granted, free of charge, to any person obtaining a copy
> of this software and associated documentation files (the "Software"), to deal
> in the Software without restriction, including without limitation the rights
> to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
> copies of the Software, and to permit persons to whom the Software is
> furnished to do so, subject to the following conditions:
>
> The above copyright notice and this permission notice shall be included in
> all copies or substantial portions of the Software.
>
> THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
> IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
> FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
> AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
> LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
> OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
> THE SOFTWARE.
