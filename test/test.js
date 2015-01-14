var assert = require('assert'),
    fsex = require('fs-extra'),
    path = require('path'),
    npt = require('..'),
    Downloader = npt.Downloader,
    Extractor = npt.Extractor,
    Packager = npt.Packager;

var fs = require('fs'),
    request = require('request'),
    util = require('util');

var outputDir = path.join(__dirname, 'output');

before(function () {
  fsex.removeSync(outputDir);
  fsex.ensureDirSync(outputDir);
});

describe('packager tests', function () {

  it('should archive sample1', function (done) {
    var p = Packager(),
        source = path.join(__dirname, 'samples/sample1');

    p.archive({
      source: source,
      dest: path.join(__dirname, 'output'),
      filename: 'sample1',
      autoDelete: false
    }, function (err, pathname) {
      if (err) return done(err);

      assert.equal(pathname, path.join(__dirname, 'output', 'sample1.tar.gz'));
      assert(fs.existsSync(pathname));
      console.log('--deleting ' + pathname);
      fs.unlinkSync(pathname);

      done();
    });
  });

});

describe('downloader tests', function () {

  it('should download a public package from github', function (done) {
    // this is a url to a public repo, not the github api
    var url = 'https://github.com/tonypujals/node-dirwalker';

    var options = {
      filepath: path.join(__dirname, 'output', 'node-dirwalker.tar.gz'),
      extractDir: path.join(__dirname, 'output'),
      rename: 'node-dirwalker'
    };

    Downloader().downloadGitHub(url, options, function (err, result) {
      if (err) return done(err);
      console.log(result);

      if (options.keep) {
        if (options.filepath) assert.equal(result.filepath, options.filepath);
        assert(fs.existsSync(result.filepath));
        console.log('--deleting ' + result.filepath);
        fs.unlinkSync(result.filepath);
      }

      var expectedDir = path.join(options.extractDir, options.rename);
      assert(fs.existsSync(expectedDir));
      fsex.removeSync(expectedDir);

      done();
    });

  });

  it('should download a package from github', function (done) {
    var options = {
      keep: true,
      url: 'https://github.com/tonypujals/node-dirwalker/archive/master.tar.gz',
      filepath: path.join(__dirname, 'output', 'node-dirwalker.tar.gz'),
      extractDir: path.join(__dirname, 'output'),
      rename: 'node-dirwalker'
    };

    Downloader().download(options, function (err, result) {
      if (err) return done(err);
      console.log(result);

      if (options.keep) {
        if (options.filepath) assert.equal(result.filepath, options.filepath);
        assert(fs.existsSync(result.filepath));
        console.log('--deleting ' + result.filepath);
        fs.unlinkSync(result.filepath);
      }

      var expectedDir = path.join(options.extractDir, options.rename);
      assert(fs.existsSync(expectedDir));
      fsex.removeSync(expectedDir);

      done();
    });

  });

  it('should download a package from github using a token', function (done) {
    var options = {
      keep: true,
      url: 'https://api.github.com/repos/aquajs/aquajs-microservice/tarball',
      headers: {
        'User-Agent': 'npt',
        Authorization: 'token 666a3f67eaa0416c6e1acaf4a97b3a6879e3bc77'
      }
    }

    var outfile = path.join(__dirname, 'output/tarball.tar.gz');
    var out = fs.createWriteStream(outfile);
    out.on('close', function () {
      assert(fs.existsSync(outfile));
      console.log('--deleting' + outfile);
      fs.unlinkSync(outfile);

      done();
    });


    var stream = request(options)
        .on('error', function (err) {
          if (err) return done(err);
        })
        .on('response', function (response) {
          if (response.statusCode != 200) {
            var chunks = [];
            stream
                .on('data', function (data) {
                  chunks.push(data.toString());
                })
                .on('end', function () {
                  return done(new Error(util.format('bad status: %s %s', response.statusCode, chunks.join(''))));
                });
          } else {
            stream.pipe(out);
          }

        });

  });

  it('should download a package from github using a token with Downloader', function (done) {
    this.timeout(10 * 1000);

    var destPath = path.join(__dirname, 'output'),
        destFile = path.join(destPath, 'tarball'),
        expectedDestFile = destFile + '.tar.gz',
        destRename = 'node-dirwalker';

    var options = {
      keep: true,
      url: 'https://api.github.com/repos/tonypujals/node-dirwalker/tarball',
      filepath: destFile,
      extractDir: destPath,
      rename: destRename,
      headers: {
        'User-Agent': 'npt',
        Authorization: 'token 666a3f67eaa0416c6e1acaf4a97b3a6879e3bc77'
      }
    };

    Downloader().download(options, function (err, result) {
      if (err) return done(err);

      var outfile = result.filepath,
          expectedFile = destFile + '.tar.gz';
      assert.equal(outfile, expectedFile);
      if (options.keep) {
        // verify that it was kept, before deleting
        assert(fs.existsSync(expectedFile));
        console.log('--deleting ' + expectedFile);
        fs.unlinkSync(expectedFile);
      }

      var outdir = path.join(result.extractDir, result.rename),
          expectedDir = path.join(destPath, destRename);
      assert.equal(outdir, expectedDir);
      assert(fs.existsSync(expectedDir));
      console.log('--deleting ' + expectedDir);
      fsex.removeSync(expectedDir);

      done();
    });

  });

});

describe('Extractor tests', function() {
  it ('should extract sample1.tar.gz to sample-1', function(done) {
    var filepath = path.join(__dirname, 'samples/sample1.tar.gz');
    var options = {
      extractDir: outputDir,
      rename: 'sample-1'
    };

    Extractor().extract(filepath, options, function(err, result) {
      if (err) return done(err);

      console.log(result);
      var unarchiveDir = path.join(outputDir, options.rename);
      assert(fs.existsSync(unarchiveDir));
      console.log('--deleting ' + unarchiveDir);
      fsex.removeSync(unarchiveDir);

      done();
    });
  });

});
