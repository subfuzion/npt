var _ = require('lodash'),
    async = require('async'),
    EventEmitter = require('events').EventEmitter,
    fs = require('fs'),
    fsx = require('./fsx'),
    path = require('path'),
    tarball = require('tarball-extract'),
    tmp = require('tmp'),
    util = require('util');

module.exports = Extractor;
util.inherits(Extractor, EventEmitter);

function Extractor() {
  if (!(this instanceof Extractor)) return new Extractor();
  EventEmitter.call(this);
}

/**
 *
 * @param filepath {string} path to archive
 * @param options {object}
 *   - autoDelete {boolean} keep archive after extracting it; default=false
 *   - extractDir {string} directory to extract to; default=cwd
 *   - rename {string} after extracting, optionally rename directory
 *   - overwrite {boolean} when extracting overwrite existing directory; default=false
 * @param callback
 */
Extractor.prototype.extract = function (filepath, options, callback) {
  if (typeof options === 'function') {
    callback = options;
    options = {
      extractDir: process.cwd()
    };
  }

  async.waterfall([
        // create a temp extract directory if necessary
        function (cb) {
          var info = {
            filepath: filepath,
            extractDir: options.extractDir
          };

          if (options.rename) {
            tmp.dir({keep: false}, function (err, dir) {
              info.tempDir = dir;
              info.rename = options.rename;
              return cb(err, info);
            });
          } else {
            return cb(null, info);
          }
        },

        // extract
        function (info, cb) {
          if (info.extractDir) {
            var extractDir = info.rename ? info.tempDir : info.extractDir;
            tarball.extractTarball(info.filepath, extractDir, function (err) {
              if (options.autoDelete) {
                fs.unlink(info.filepath, function (err) {
                  return cb(err, info);
                });
              } else {
                return cb(err, info);
              }
            });

          } else {
            return cb(null, info);
          }
        },

        // move and rename extracted dir, if necessary
        function (info, cb) {
          if (info.rename) {
            // there will be only one entry to move/rename
            fs.readdir(info.tempDir, function (err, files) {
              var name = files[0],
                  dest = path.join(info.extractDir, info.rename);

              fsx.mv(path.join(info.tempDir, name), dest, {clobber: options.overwrite}, function (err) {
                return cb(err, info);
              });
            });

          } else {
            return cb(null, info);
          }
        }
      ],
      function (err, result) {
        callback(err, result);
      }
  );
};

