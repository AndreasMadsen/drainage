
var util = require('util');
var events = require('events');

function Drainage(options, handler) {
  if (!(this instanceof Drainage)) return new Drainage(options, handler);
  events.EventEmitter.call(this);
  var self = this;

  if (typeof options === 'function') {
    handler = options;
    options = undefined;
  }

  this._handler = handler;

  // If something is in the queueValues object it is either in progress
  // or in the queue. If something is in queueIds it is definetly in
  // the queue and not in progress.
  this._queueIds = [];
  this._queueValues = {};

  this._inprogress = 0;
  this._concurrency = (options && options.concurrency) || 1;
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
    this._queueIds.push(task.id);
    this._queueValues[task.id] = task;

    this._process();
  }
};

Drainage.prototype.done = function (task) {
  this._inprogress -= 1;
  delete this._queueValues[task.id];

  this._process();
};

// internal method for draining the queue
Drainage.prototype._process = function () {
  
  while(this._inprogress < this._concurrency &&
        this._queueIds.length !== 0 &&
        this._paused === false) {
    this._inprogress += 1;
    this._handler( this._queueValues[ this._queueIds.shift() ] );
  }

  // Emit drained if there are no more items in the queue
  if  (this._queueIds.length === 0) {
    this.emit('shortage', (this._concurrency - this._inprogress));
  }
};
