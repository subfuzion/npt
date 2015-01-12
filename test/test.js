var assert = require('assert'),
    npt = require('..'),
    DownLoader = npt.Downloader;
    Packager = npt.Packager,
    path = require('path');


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

describe('downloader tests', function() {

  it.skip ('should download a package from github', function(done){
    var url = 'https://github.com/tonypujals/node-dirwalker/archive/master.tar.gz',
        target = path.join(__dirname, 'output/node-dirwalker'),
        downloader = DownLoader();


    downloader.download(url, { target: target }, function(err, path) {
      if (err) return done(err);
      console.log(path);
      done();
    });

  });

  it ('should download a package from github', function(done){
    var url = 'https://github.com/tonypujals/node-dirwalker',
        target = path.join(__dirname, 'output/node-dirwalker'),
        downloader = DownLoader();


    downloader.downloadGitHub(url, { target: target, extract: true }, function(err, path) {
      if (err) return done(err);
      console.log(path);
      done();
    });

  });
})
