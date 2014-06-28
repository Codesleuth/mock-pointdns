Mock PointDNS
=============

[![Build Status](https://travis-ci.org/Codesleuth/mock-pointdns.svg?branch=master)](https://travis-ci.org/Codesleuth/mock-pointdns)

Helps integrate with the PointDNS API through acceptance testing.

## Getting Started

1. Clone the repo: `git clone https://github.com/codesleuth/mock-pointdns && cd mock-pointdns`
2. Install the dependencies: `npm install`

To use the mock server in testing, take a look at the following example:

```javascript
var mockpointdns = require('mock-pointdns'),
    request = require('supertest');

describe('Verify Mock PointDNS Server', function () {

  var apitoken;
  var zone;
  var mockServer;
  var mockServerUrl;

  before(function (done) {
    apitoken = mockpointdns.setApiToken();
    zone = mockpointdns.addZone();

    mockServer = mockpointdns.app.listen(process.env.PORT, process.env.IP, function () {
      mockServerUrl = 'http://' + process.env.IP + ':' + process.env.PORT;
      done();
    });
  });

  it('/zones should return the expected zone', function (done) {
    request(mockServerUrl)
      .get('/zones')
      .auth('', apitoken)
      .expect(200)
      .expect([{ zone: zone }])
      .end(done);
  });

  after(function (done) {
    mockServer.close(done);
  });
});
```

`npm start` will launch a sample app that shows how to configure and use this mock server.

`npm test` will run the test suite using [Mocha] which is required as a development dependency.

## Disclaimer

This mock server is not controlled or endorsed by [Copper.io](copperio) in any way. The implementation may differ and may even be outdated *right now*. This project was intended to help mock out the expected behaviour of the [PointDNS API](pointhq) according to [the API documentation](pointdnsdocs).

## Contribute

If you wish to contribute, pull requests are welcome. Keeping this project up to date with the API it mocks out is key to its usefulness. Please contribute!


[mocha]:http://visionmedia.github.io/mocha/
[copperio]:http://copper.io/
[pointhq]:https://pointhq.com/
[pointdnsdocs]:https://pointhq.com/api/docs