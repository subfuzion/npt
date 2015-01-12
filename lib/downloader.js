var _ = require('lodash'),
    async = require('async'),
    EventEmitter = require('events').EventEmitter,
    fs = require('fs'),
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


Downloader.prototype.download = function (url, options, callback) {
  if (typeof options === 'function') {
    callback = options;
    options = {};
  }

  var ext = options.ext || '.tar.gz';

  async.waterfall([
        // determine target
        function (cb) {
          if (options.target) {
            return cb(null, options.target + ext);
          }

          tmp.file({keep: options.keep || true, postfix: ext}, cb);
        },

        // make request
        function (target, cb) {
          request(url)
            .on('response', function (response) {
              if (response.statusCode !== 200) {
                callback(new Error('bad status: ' + response.statusCode));
              }
            })
            .on('end', function () {
              cb(null, target);
            })
            .on('error', function (err) {
              cb(err);
            })
            .pipe(fs.createWriteStream(target));
        },

          function(target, cb) {
            if (options.extract) {
              tarball.extractTarball(target, path.dirname(target), function(err){
                if(err) return cb(err);
                cb(null, target);
              })
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