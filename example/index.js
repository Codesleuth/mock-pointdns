var mockserver = require('../');

var ip = process.env.IP || '127.0.0.1',
    port = process.env.PORT || 3000;

var zone1 = {
  id: 29873,
  name: "somesite.com",
  group: "Default Group",
  "user-id": 141,
  ttl: 3600
};

var records = [{
  id: 12938,
  name: "some-host." + zone1,
  data: "10.11.12.13",
  aux: null,
  record_type: "A",
  redirect_to: null,
  ttl: 3600
},{
  id: 1231,
  name: "myhost." + zone1,
  data: "14.13.12.11",
  aux: null,
  record_type: "A",
  redirect_to: null,
  ttl: 3600
}];

var zone2 = {
  id: 12414,
  name: "othersite.com",
  group: "Default Group",
  "user-id": 141,
  ttl: 3600
};

var user = {
  username: 'test',
  password: 'test'
}

mockserver.addZone(zone1, records);
mockserver.addZone(zone2, []);
mockserver.addUser(user);

var server = mockserver.app.listen(port, ip, function () {
  console.log('Mock PointDNS server started on: http://%s:%s', ip, port);
  console.log('Tip: try hit http://%s:%s/zones/%d with user "%s" and password "%s"', ip, port, zone1.id, user.username, user.password);
});