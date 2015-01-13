var assert = require('assert'),
    npt = require('..'),
    Downloader = npt.Downloader,
    Packager = npt.Packager,
    path = require('path');

var fs = require('fs'),
    request = require('request'),
    util = require('util');


/*
 describe('packager tests', function () {

 it('should archive sample1', function (done) {
 var p = Packager(),
 source = path.join(__dirname, 'samples/sample1');

 p.archive({
 source: path.join(__dirname, 'samples/sample1'),
 dest: path.join(__dirname, 'output'),
 filename: 'sample1',
 autoDelete: false
 }, function (err, pathname) {
 if (err) return done(err);

 console.log('pathname: %s', pathname);

 done();
 });
 });

 });
 */

describe('downloader tests', function () {

  it.skip('should download a package from github', function (done) {
    var url = 'https://github.com/tonypujals/node-dirwalker/archive/master.tar.gz',
        target = path.join(__dirname, 'output/node-dirwalker'),
        downloader = DownLoader();


    downloader.download(url, {target: target}, function (err, path) {
      if (err) return done(err);
      console.log(path);
      done();
    });

  });

  it.skip('should download a package from github', function (done) {
    var url = 'https://github.com/tonypujals/node-dirwalker',
        target = path.join(__dirname, 'output/node-dirwalker'),
        downloader = DownLoader();


    downloader.downloadGitHub(url, {target: target, extract: true}, function (err, path) {
      if (err) return done(err);
      console.log(path);
      done();
    });

  });

  it.skip('should download a package from github using a token', function (done) {
    //var url = 'https://api.github.com/repos/aquajs/aquajs-microservice/tarball?access_token=666a3f67eaa0416c6e1acaf4a97b3a6879e3bc77',
    var url = 'https://api.github.com/repos/aquajs/aquajs-microservice/tarball',
        target = path.join(__dirname, 'output/tarball'),
        downloader = DownLoader();

    var options = {
      url: url,
      target: target,

      auth: {
        'bearer': '666a3f67eaa0416c6e1acaf4a97b3a6879e3bc77'
      }

      /*
       headers: {
       Authorization: 'token ' + '666a3f67eaa0416c6e1acaf4a97b3a6879e3bc77'
       }
       */
    }

    downloader.download(url, options, function (err, path) {
      if (err) return done(err);
      console.log(path);
      done();
    });

  });

  it.skip('should download a package from github using a token', function (done) {
    var options = {
      url: 'https://api.github.com/repos/aquajs/aquajs-microservice/tarball',
      headers: {
        'User-Agent': 'npt',
        Authorization: 'token 666a3f67eaa0416c6e1acaf4a97b3a6879e3bc77'
      }
    }

    var out = fs.createWriteStream(path.join(__dirname, 'output/tarball.tar.gz'));
    out.on('close', function () {
      console.log('close event');
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

  it('should download a package from github using a token', function (done) {
    this.timeout(5 * 60 * 1000);

    var options = {
      url: 'https://api.github.com/repos/aquajs/aquajs-microservice/tarball',
      filepath: path.join(__dirname, 'output/tarball'),
      extractDir: path.join(__dirname, 'output'),
      rename: 'aquajs-microservice'
    };

    Downloader().download(options, function (err, path) {
      if (err) return done(err);
      console.log(path);
      done();
    });

  });
});
