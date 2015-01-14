var _ = require('lodash'),
    archiver = require('archiver'),
    async = require('async'),
    DirWalker = require('node-dirwalker'),
    EventEmitter = require('events').EventEmitter,
    fs = require('fs'),
    os = require('os'),
    path = require('path'),
    tmp = require('tmp'),
    util = require('util');

var defaultOptions = {
  source: process.cwd(),
  dest: os.tmpdir(),
  ext: '.tar.gz',
  autoDelete: true
};

var walkerOptions = {
  // attempt to load .npmignore; if not found, then attempt to load .gitignore
  ignoreFiles: ['.npmignore, .gitignore'],

  // see: https://docs.npmjs.com/misc/developers
  defaultIgnore: [
    // HACK: added node_modules for now since not handling bundledDependencies
    'node_modules/',
    '.*.swp',
    '_*',
    'DS_Store',
    '.git',
    '.hg',
    '.lock-wscript',
    '.svn',
    '.wafpickle-*',
    'CVS',
    'npm-debug.log'
  ],

  // see: https://docs.npmjs.com/misc/developers
  neverIgnore: [
    'package.json',
    'README.*'
  ]
};


module.exports = Packager;
util.inherits(Packager, EventEmitter);

function Packager() {
  if (!(this instanceof Packager)) return new Packager();
  EventEmitter.call(this);
}


/**
 * Creates an archive (gzip tarball) from a source directory
 * @param options {object}
 *   - source {string} source package directory; default=current working directory
 *   - dest {string} directory for writing package archive; default=OS temp dir
 *   - filename {string} name of generated archive; default=name of sourcePath directory
 *   - ext {string} add ext to filename if doesn't have one already; default='.tgz'
 *   - autoDelete {boolean} auto delete file on process exit; default=false
 * @param callback (err, pathname)
 *   - pathname {string} pathname to package archive
 */
Packager.prototype.archive = function (options, callback) {
  if (typeof options == 'function') {
    callback = options;
    options = {};
  }

  options = _.extend(defaultOptions, options);

  async.waterfall([
        function (cb) {
          filePathFromOptions(options, cb);
        },

        function (pathname, cb) {
          pack(options.source, pathname, walkerOptions, cb);
        }
      ],

      callback
  );

};


function pack(dir, target, options, callback) {
  //console.log('dir: %s, target: %s', dir, target);

  var out = fs.createWriteStream(target);

  var archive = archiver('tar', {
    gzip: true,
    gzipOptions: {
      level: 1
    }
  });

  out.on('close', function() {
    //console.log(archive.pointer() + ' total bytes');
    //console.log('archiver has been finalized and the output file descriptor has closed.');
    callback(null, target);
  });

  archive.on('error', function(err) {
    return callback(err);
  });

  archive.pipe(out);

  var walker = DirWalker(options),
      errors = [];

  walker
      .on('entry', function (entry) {
        //console.log(entry);
        archive.append(fs.createReadStream(entry.pathname), { name: entry.relname })
      })
      .on('error', function (err) {
        //console.log(err);
        errors.push(err);
      })
      .on('close', function () {
        if (errors.length) {
          return callback(new Error('Failed to create archive'), errors);
        }

        archive.finalize();
      });

  walker.walk(dir, {recurse: true});
}

/**
 * This function will generate the destination archive filename based on the
 * provided options, returning the full pathname to the archive.
 *
 *   - If options.filename is set
 *     - if the filename includes an extension, it will be used as the archive name
 *     - if the filename does not include an extension but one is set in options.ext,
 *       then the archive name will be filename plus ext (if the caller did not set
 *       options.ext, it will default to '.tgz')
 *   - If options.filename is not provided, a random filename will be generated
 *     - if options.ext provides an ext, it will be used; otherwise the ext
 *       will default to '.tgz'
 *   - The final pathname will be returned in the callback
 *     - if options.dest is set, this will be used for the path component; otherwise
 *     - the os temp directory will be used
 *   - If options.autoDelete is set, a handler will be registered with the process
 *     to delete the file on exit. The file will only be deleted on graceful exit
 *     because registering a SIGINT handler replaces the installed default handler
 *     that resets the terminal.
 *
 * @param options
 * @param callback (err, pathname)
 */
function filePathFromOptions(options, callback) {
  // select the filename, and if it doesn't have an extension, append the
  // provided extension, and forward full pathname to next task
  var filename = options.filename,
      ext = options.ext,
      pathname;

  if (filename) {
    if (!path.extname(filename) && ext) {
      filename += ext;
    }

    pathname = path.join(options.dest, filename);

    // register auto delete on process exit
    if (options.autoDelete) {
      process.on('exit', function () {
        try {
          fs.unlinkSync(pathname);
        } catch (err) {
          // oh well
        }
      });
    }

    return callback(null, pathname);
  }

  // otherwise, generate a temp filename and forward to next task
  tmp.tmpName({
    dir: options.dest,
    keep: !options.autoDelete,
    prefix: '',
    postfix: options.ext
  }, function (err, pathname) {
    if (err) return callback(err);
    callback(null, pathname);
  });

}

