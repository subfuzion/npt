var fsex = require('fs-extra'),
    path = require('path'),
    util = require('util');

// This module intended for file system utility methods, but it
// may go away. Right now, it's just a simple wrapper over the
// very convenient fs-extra module.


exports.cp = function(src, dest, options, cb) {
  fsex.copy(src, dest, options, cb);
}

exports.mv = function(src, dest, options, cb) {
  if (typeof options === 'function') {
    cb = options;
    options = {};
  }

  // fx-extra move has a bug - the clobber option doesn't work
  if (options.clobber) {
    exports.rmdir(dest, function(err) {
      if (err) return cb(err);
      return fsex.move(src, dest, options, cb);
    })
  } else {
    fsex.move(src, dest, options, cb);
  }
}

exports.rmdir = function(dir, cb) {
  fsex.remove(dir, cb);
}

