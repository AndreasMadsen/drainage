
var util = require('util');
var events = require('events');

function arrays(from, to) {
  var seq = {};
  for (var i = from; i <= to; i++) {
    seq[i] = [];
  }
  return seq;
}

function Drainage(options, handler) {
  if (!(this instanceof Drainage)) return new Drainage(options, handler);
  events.EventEmitter.call(this);
  var self = this;

  if (typeof options === 'function') {
    handler = options;
    options = undefined;
  }

  this._handler = handler;
  this._priority = (options && Array.isArray(options.priority)) ? options.priority : false;
  this._concurrency = (options && options.concurrency) ? options.concurrency : 1;

  // If something is in the queueValues object it is either in progress
  // or in the queue. If something is in queueIds it is definetly in
  // the queue and not in progress.
  this._queueLength = 0;
  this._queueIds = this._priority ? arrays(this._priority[0], this._priority[1]) : [];
  this._queueValues = {};

	this._shortageEmitting = false;
  this._inprogress = 0;
  this._paused = false;

  // Something could have happend, at least emit drain if not
  process.nextTick(function () {
    self._process();
  });
}
module.exports = Drainage;
util.inherits(Drainage, events.EventEmitter);

// Start and resume the job manager
Drainage.prototype.resume = function () {
  this._paused = false;
  this.emit('resume');
  this._process();
};

Drainage.prototype.pause = function () {
  this._paused = true;
  this.emit('pause');
};

// Add and remove jobs
Drainage.prototype.push = function (task) {
  if (this._queueValues.hasOwnProperty(task.id) === false) {
    if (this._priority) {
      this._queueIds[task.priority].push(task.id);
    } else {
      this._queueIds.push(task.id);
    }

    this._queueLength += 1;
    this._queueValues[task.id] = task;

    this._process();
  }
};

Drainage.prototype.done = function (task) {
  this._inprogress -= 1;
  delete this._queueValues[task.id];

  this._process();
};

// get the next task ordered by priority where high number is more important
Drainage.prototype._nextTask = function () {
  if (this._priority) {
    for (var i = this._priority[1]; i >= this._priority[0]; i--) {
      if (this._queueIds[i].length !== 0) {
        this._queueLength -= 1;
        return this._queueValues[ this._queueIds[i].shift() ];
      }
    }
  } else {
    this._queueLength -= 1;
    return this._queueValues[ this._queueIds.shift() ];
  }
};

// internal method for draining the queue
Drainage.prototype._process = function () {
  var self = this;

  while(this._inprogress < this._concurrency &&
        this._queueLength !== 0 &&
        this._paused === false) {
    this._inprogress += 1;
    this._handler(this._nextTask());
  }

  // Await a tick to insure that only one shortage event will be emitted
  if (this._shortageEmitting === false && this._queueLength === 0) {
    this._shortageEmitting = true;

    process.nextTick(function () {
      self._shortageEmitting = false;

      // Emit drained if there are no more items in the queue
      if (self._queueLength === 0) {
        self.emit('shortage', (self._concurrency - self._inprogress));
      }
    });
  }
};
