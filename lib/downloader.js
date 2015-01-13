var _ = require('lodash'),
    async = require('async'),
    EventEmitter = require('events').EventEmitter,
    fs = require('fs'),
    fsx = require('./fsx'),
    path = require('path'),
    request = require('request'),
    tarball = require('tarball-extract'),
    tmp = require('tmp'),
    util = require('util');

module.exports = Downloader;
util.inherits(Downloader, EventEmitter);

function Downloader(options) {
  if (!(this instanceof Downloader)) return new Downloader(options);
  EventEmitter.call(this);
  this.options = options;
}


/**
 *
 * @param options
 *   - url {string} required
 *   - filepath {string} full pathname to use for downloaded filename;
 *     default=unique file in OS temp directory
 *   - ext {string} downloaded file extension; default='.tar.gz'
 *   - extractDir {string} download directory; default=process.cwd()
 *   - rename {string} name to give top-level directory after extraction
 *   - keep {boolean} if not true, will delete archive right after extracting
 *
 * @param callback (err, pathname)
 */
Downloader.prototype.download = function (options, callback) {
  var defaultOptions = {
    ext: '.tar.gz'
  };

  options = _.extend(defaultOptions, options);


  async.waterfall([
        // determine filepath
        function (cb) {
          var filepath = options.filepath;

          if (filepath) {
            filepath = !path.extname(filepath)
                ? filepath + options.ext
                : filepath;

            return cb(null, filepath);
          }

          tmp.file({keep: options.keep || true, postfix: options.ext}, function (err, name, fd, removeCallback) {
            cb(err, name);
          });
        },

        // make request
        function (filepath, cb) {
          options.headers = {
            'User-Agent': 'npt',
            Authorization: 'token 666a3f67eaa0416c6e1acaf4a97b3a6879e3bc77'
          };

          var out = fs.createWriteStream(filepath);
          out.on('close', function () {
            cb(null, filepath);
          });


          var stream = request(options)
              .on('error', function (err) {
                if (err) return cb(err);
              })
              .on('response', function (response) {
                if (response.statusCode != 200) {
                  var chunks = [];
                  stream
                      .on('data', function (data) {
                        chunks.push(data.toString());
                      })
                      .on('end', function () {
                        return cb(new Error(util.format('bad status: %s %s', response.statusCode, chunks.join(''))));
                      });
                } else {
                  stream.pipe(out);
                }

              });
        },

        // create a temp extract directory if necessary
        function (filepath, cb) {
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
            console.log('EXTRACTING TO: %s', extractDir);
            tarball.extractTarball(info.filepath, extractDir, function (err) {
              console.log('EXTRACTED TO: %s', extractDir);

              if (!options.keep) {
                fsx.rmdir(info.filepath, function(err) {
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
            fs.readdir(info.tempDir, function(err, files) {
              var name = files[0],
                  dest = path.join(info.extractDir, info.rename);

              fsx.mv(path.join(info.tempDir, name), dest, { clobber: true }, function(err) {
                return cb(err, info);
              });
            });

          } else {
            return cb(null, info);
          }
        }

      ],

      callback);


};

Downloader.prototype.downloadGitHub = function (url, options, callback) {
  if (typeof options === 'function') {
    callback = options;
    options = {};
  }

  options.branch = options.branch || 'master';

  if (!/[/]$/.test(url)) {
    url += '/';
  }

  url += util.format('%s/%s/%s', 'archive', options.branch, '.tar.gz');

  this.download(url, options, callback);
};