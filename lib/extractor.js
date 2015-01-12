var EventEmitter = require('events').EventEmitter,
    util = require('util');

module.exports = Extractor;
util.inherits(Extractor, EventEmitter);

function Extractor() {
  if (!(this instanceof Extractor)) return new Extractor();
  EventEmitter.call(this);
}



