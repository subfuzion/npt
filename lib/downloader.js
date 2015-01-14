var _ = require('lodash'),
    async = require('async'),
    EventEmitter = require('events').EventEmitter,
    Extractor = require('./extractor'),
    fs = require('fs'),
    fsx = require('./fsx'),
    path = require('path'),
    request = require('request'),
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
 *   - headers
 *     Ex:
 *        options.headers = {
 *          'User-Agent': 'npt',
 *          Authorization: 'token xxxxx'
 *        };
 *
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

        // extract
        function (filepath, cb) {
          if (options.extractDir) {
            Extractor().extract(filepath, options, cb);
          } else {
            cb(null, filepath);
          }
        }

      ],

      callback
  );
};

Downloader.prototype.downloadGitHub = function (url, options, callback) {
  if (typeof options === 'function') {
    callback = options;
    options = {};
  }

  options = _.clone(options);
  options.url = url;
  options.branch = options.branch || 'master';

  if (!/[/]$/.test(options.url)) {
    options.url += '/';
  }

  options.url += util.format('%s/%s/%s', 'archive', options.branch, '.tar.gz');

  this.download(options, callback);
};

