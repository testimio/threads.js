'use strict';

exports.__esModule = true;

var _eventemitter = require('eventemitter3');

var _eventemitter2 = _interopRequireDefault(_eventemitter);

var _job = require('./job');

var _job2 = _interopRequireDefault(_job);

var _defaults = require('./defaults');

var _defaults2 = _interopRequireDefault(_defaults);

var _ = require('./');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var Pool = function (_EventEmitter) {
  _inherits(Pool, _EventEmitter);

  function Pool(threads) {
    _classCallCheck(this, Pool);

    var _this = _possibleConstructorReturn(this, _EventEmitter.call(this));

    _this.threads = Pool.spawn(threads || _defaults2.default.pool.size);
    _this.idleThreads = _this.threads.slice();
    _this.jobQueue = [];
    _this.runArgs = [];

    _this.on('newJob', _this.handleNewJob.bind(_this));

    return _this;
  }

  Pool.prototype.run = function run(args) {
    this.runArgs = args;
    return this;
  };

  Pool.prototype.send = function send() {
    if (!this.runArgs) {
      throw new Error('Pool.send() called without prior Pool.run(). You need to define what to run first.');
    }

    var job = new _job2.default(this);
    job.run(this.runArgs);
    return job.send.apply(job, arguments);
  };

  Pool.prototype.killAll = function killAll() {
    this.threads.forEach(function (thread) {
      thread.kill();
    });
  };

  Pool.prototype.queueJob = function queueJob(job) {
    this.jobQueue.push(job);
    this.dequeue();
  };

  Pool.prototype.dequeue = function dequeue() {
    if (this.jobQueue.length === 0 || this.idleThreads.length === 0) {
      return this.once('threadAvailable', this.dequeue);
    }

    var job = this.jobQueue.shift();
    var thread = this.idleThreads.shift();

    job.once('done', this.handleJobSuccess.bind(this, thread, job)).once('error', this.handleJobError.bind(this, thread, job));

    job.executeOn(thread);
  };

  Pool.prototype.handleNewJob = function handleNewJob(job) {
    this.lastCreatedJob = job;
    job.once('readyToRun', this.queueJob.bind(this, job)); // triggered by job.send()
  };

  Pool.prototype.handleJobSuccess = function handleJobSuccess(thread, job) {
    for (var _len = arguments.length, responseArgs = Array(_len > 2 ? _len - 2 : 0), _key = 2; _key < _len; _key++) {
      responseArgs[_key - 2] = arguments[_key];
    }

    this.emit.apply(this, ['done', job].concat(responseArgs));
    this.handleJobDone(thread);
  };

  Pool.prototype.handleJobError = function handleJobError(thread, job, error) {
    this.emit('error', job, error);
    this.handleJobDone(thread);
  };

  Pool.prototype.handleJobDone = function handleJobDone(thread) {
    var _this2 = this;

    this.idleThreads.push(thread);
    this.emit('threadAvailable');

    if (this.idleThreads.length === this.threads.length) {
      // run deferred to give other job.on('done') handlers time to run first
      setTimeout(function () {
        _this2.emit('finished');
      }, 0);
    }
  };

  return Pool;
}(_eventemitter2.default);

exports.default = Pool;


Pool.spawn = function (threadCount) {
  var threads = [];

  for (var threadIndex = 0; threadIndex < threadCount; threadIndex++) {
    threads.push((0, _.spawn)());
  }

  return threads;
};
//# sourceMappingURL=pool.js.map