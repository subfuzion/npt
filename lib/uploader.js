var EventEmitter = require('events').EventEmitter,
    util = require('util');

module.exports = Uploader;
util.inherits(Uploader, EventEmitter);

function Uploader() {
  if (!(this instanceof Uploader)) return new Uploader();
  EventEmitter.call(this);
}



