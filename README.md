Mock PointDNS
=============

[![Build Status](https://travis-ci.org/Codesleuth/mock-pointdns.svg?branch=master)](https://travis-ci.org/Codesleuth/mock-pointdns)

Helps integrate with the PointDNS API through acceptance testing.

`npm start` will launch a sample app that shows how to configure and use this mock server.

`npm test` will run the test suite using [Mocha] which is required as a development dependency.

### Disclaimer

This mock server is not controlled or endorsed by [Copper.io](copperio) in any way. The implementation may differ and may even be outdated *right now*. This project was intended to help mock out the expected behaviour of the [PointDNS API](pointhq) according to [the API documentation](pointdnsdocs).

### Contribute

If you wish to contribute, pull requests are welcome. Keeping this project up to date with the API it mocks out is key to its usefulness. Please contribute!


[mocha]:http://visionmedia.github.io/mocha/
[copperio]:http://copper.io/
[pointhq]:https://pointhq.com/
[pointdnsdocs]:https://pointhq.com/api/docs