
var test = require('tap').test;
var drainage = require('./drainage.js');

var JOBS = "abcdefghijklmnopqrstuvxyz".split('').map(function (value, index) {
  return {id: index, job: value};
});

test('can process simple job with 1 concurrency', function (t) {
  var jobnum = 0;
  var queue = drainage(function (task) {
    process.nextTick(function () {
      t.deepEqual(task, JOBS[jobnum]);
      queue.done(task);
      
      if (++jobnum === 2) {
        t.end();
      }
    });
  });

  queue.push(JOBS[0]);
  queue.push(JOBS[1]);
});

test('will emit shortage once tasks is needed', function (t) {
  var jobnum = 0;
  var queue = drainage(function (task) {
    process.nextTick(function () {
      t.deepEqual(task, JOBS[jobnum]);
      queue.done(task);

      if (++jobnum === 2) {
        t.end();
      }
    });
  });

  queue.once('shortage', function (amount) {
    t.equal(amount, 1);

    queue.once('shortage', function (amount) {
      t.equal(amount, 0);

      queue.once('shortage', function (amount) {
        t.equal(amount, 1);

        queue.push(JOBS[1]);
      });
    });

    queue.push(JOBS[0]);
  });
});

test('no more jobs will be perfromed when paused', function (t) {
  var jobnum = 0;

  var queue = drainage(function (task) {
    process.nextTick(function () {
      t.deepEqual(task, JOBS[jobnum]);
      queue.done(task);

      jobnum += 1;
    });
  });

  queue.push(JOBS[0]);
  queue.push(JOBS[1]);
  queue.pause();
  setImmediate(function () {
    t.equal(jobnum, 1);
    queue.resume();
    
    setImmediate(function () {
      t.equal(jobnum, 2);
      t.end();
    });
  });
});

test('concurrency set to 2', function (t) {
  var jobnum = 0;
  var result = [];
  
  // If two jobs has been running in parallel the result will have the [i, i+1]
  // structure.
  var expected = [];
  for (var i = 1; i <= 25; i++) {
    expected.push([i, i === JOBS.length ? JOBS.length : i + 1]);
  }
  
  var queue = drainage({concurrency: 2}, function (task) {
    var i = ++jobnum;
    process.nextTick(function () {
      result.push([i, jobnum]);
      queue.done(task);
      
      if (i === JOBS.length) {
        t.deepEqual(result, expected);
        t.end();
      }
    });
  });
  
  // Add all jobs
  JOBS.forEach(queue.push.bind(queue));
});

test('can not push same task ID', function (t) {
  var jobnum = 0;
  var queue = drainage(function (task) {
    process.nextTick(function () {
      t.deepEqual(task, JOBS[jobnum]);
      queue.done(task);
      jobnum += 1;
    });
  });
  
  queue.push(JOBS[0]);
  queue.push(JOBS[0]);
  
  setImmediate(function () {
    t.equal(jobnum, 1);
    t.end();
  });
});
