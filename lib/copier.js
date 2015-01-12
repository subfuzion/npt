var EventEmitter = require('events').EventEmitter,
    util = require('util');

module.exports = Copier;
util.inherits(Copier, EventEmitter);

function Copier() {
  if (!(this instanceof Copier)) return new Copier();
  EventEmitter.call(this);
}




