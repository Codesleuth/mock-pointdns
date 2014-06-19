var mockserver = require('../');

var ip = process.env.IP || '127.0.0.1',
    port = process.env.PORT || 3000;

var zone1 = {
  name: "somesite.com",
  group: "Default Group",
  "user-id": 141,
  ttl: 3600
};

var records = [{
  name: "some-host." + zone1,
  data: "10.11.12.13",
  aux: null,
  record_type: "A",
  redirect_to: null,
  ttl: 3600
},{
  name: "myhost." + zone1,
  data: "14.13.12.11",
  aux: null,
  record_type: "A",
  redirect_to: null,
  ttl: 3600
}];

var zone2 = {
  name: "othersite.com",
  group: "Default Group",
  "user-id": 141,
  ttl: 3600
};

mockserver.addZone(zone1, records);
mockserver.addZone(zone2, []);

var server = mockserver.app.listen(port, ip, function () {
  console.log('Mock PointDNS server started on: http://%s:%s', ip, port);
  console.log('Tip: try browse to the /zones endpoint.')
});