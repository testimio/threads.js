import child        from 'child_process';
import path         from 'path';
import EventEmitter from 'eventemitter3';

import { getConfig } from '../config';

let nextChildDebugPort = 45859;

export default class Worker extends EventEmitter {
  /**
   * @param {function|string} initialRunnable   Method or path to file to run.
   * @param {object} [options]                  Options to be passed to child.fork()
   *                                            or an integer/function `debugPort`.
   */
  constructor(initialRunnable, options = {}) {
    super();

    this.fixDebuggerPort(options, () => {
      this.slave = child.fork(path.join(__dirname, 'slave.js'), [], options);
    });
    this.slave.on('message', this.handleMessage.bind(this));
    this.slave.on('error', this.handleError.bind(this));
    this.slave.on('exit', this.emit.bind(this, 'exit'));

    if (initialRunnable) {
      this.run(initialRunnable);
    }
  }

  run(toRun) {
    if (typeof toRun === 'function') {
      this.runMethod(toRun);
    } else {
      this.runScript(toRun);
    }
    return this;
  }

  runMethod(method) {
    this.slave.send({
      initByMethod : true,
      method       : method.toString()
    });
  }

  runScript(script) {
    if (!script) { throw new Error('Must pass a function or a script path to run().'); }

    const prefixedScriptPath = path.join(getConfig().basepath.node, script);

    // attention: single script for node, array for browser
    this.slave.send({
      initByScript : true,
      script       : path.resolve(prefixedScriptPath)
    });
  }

  send(param) {
    this.slave.send({
      doRun : true,
      param
    });
    return this;
  }

  kill() {
    this.slave.kill();
    return this;
  }

  promise() {
    return new Promise((resolve, reject) => {
      this
        .once('message', resolve)
        .once('error', reject);
    });
  }

  /**
   * Need to change debug port. See https://github.com/andywer/threads.js/issues/16.
   */
  fixDebuggerPort(options, forkCallback) {
    if (typeof v8debug !== 'object') {
      forkCallback();
      return;
    }

    let debugPort = nextChildDebugPort++;

    if (options.debugPort) {
      debugPort = typeof options.debugPort === 'function'
                ? options.debugPort(debugPort) : options.debugPort;
    }

    // Temporarily change debug port number to something else.
    process.execArgv.push('--debug=' + debugPort);
    forkCallback();
    process.execArgv.pop();
  }

  handleMessage(message) {
    if (message.error) {
      const error = new Error(message.error.message);
      error.stack = message.error.stack;

      this.handleError(error);
    } else if (message.progress) {
      this.handleProgress(message.progress);
    } else {
      this.emit('message', ...message.response);
    }
  }

  handleProgress(progress) {
    this.emit('progress', progress);
  }

  handleError(error) {
    if (!this.listeners('error', true)) {
      console.error(error.stack || error);       // eslint-disable-line no-console
    }
    this.emit('error', error);
  }
}
