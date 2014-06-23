var request = require('supertest'),
    random = require('./random'),
    config = require('../config').development,
    mockserver = require('../'),
    assert = require('assert'),
    uuid = require('node-uuid');


function createRandomUser() {
  return {
    username: random.string(20),
    apitoken: uuid.v4()
  }
}

function createRandomZone() {
  return {
    "name": random.string(10) + '.' + random.choice('com', 'co', 'co.uk'),
    "group": random.string(),
    "user-id": random.number(),
    "ttl": random.number()
  }
}

function createRandomZoneRecord() {
  return {
    "name": random.string(10),
    "data": random.ipAddress(),
    "aux": random.string(),
    "record_type": random.choice('A', 'CNAME', 'MX', 'TXT', 'NS', 'SRV', 'AAAA', 'SSHFP', 'PTR', 'ALIAS'),
    "redirect_to": random.string(),
    "ttl": random.number()
  }
}

function expectedZoneResponse(zoneid, zone) {
  return {
    "id": zoneid,
    "name": zone["name"],
    "group": zone["group"],
    "user-id": zone["user-id"],
    "ttl": zone["ttl"]
  };
}

function expectedRecordResponse(zoneid, zone, recordid, record) {
  return {
    "id": recordid,
    "name": record["name"] + '.' + zone["name"] + '.',
    "data": record["data"],
    "aux": record["aux"],
    "record_type": record["record_type"],
    "redirect_to": record["redirect_to"],
    "ttl": record["ttl"],
    "zone_id": zoneid
  };
}

before(function (done) {

  server = mockserver.app.listen(config.server.port, config.server.host, function () {
    serverurl = "http://" + config.server.host + ":" + config.server.port;
    done();
  });

});

after(function (done) {
  server.close(done);
});


describe('Mock PointHQ Server', function () {

  describe('GET /zones without authorization header', function () {

    var zone;

    before(function () {
      mockserver.reset();

      zone = createRandomZone();

      mockserver.addZone(zone);
    });

    it('should return 302 Found with Location set', function (done) {

      request(serverurl)
        .get('/zones')
        .expect(302)
        .expect('Location', 'https://sso.copper.io/api/v1/sessions/validate?service=https%3A%2F%2Fpointhq.com%2Fzones')
        .expect({})
        .end(done);

    });

  });

  describe('GET /zones with incorrect authorization header', function () {

    var zone;

    before(function () {
      mockserver.reset();

      zone = createRandomZone();
      user = createRandomUser();

      mockserver.addZone(zone);

      mockserver.addUser(createRandomUser());
      mockserver.addUser(user);
      mockserver.addUser(createRandomUser());
    });

    it('should return 403 Found with Location set', function (done) {

      request(serverurl)
        .get('/zones')
        .auth(user.username, uuid.v4())
        .expect(403)
        .expect({})
        .end(done);

    });

  });

  describe('GET /zones', function () {

    var zone1, zone2;

    before(function () {
      mockserver.reset();

      zone1 = createRandomZone();
      zone2 = createRandomZone();
      user = createRandomUser();

      mockserver.addZone(zone1);
      mockserver.addZone(zone2);
      mockserver.addUser(user);
    });

    it('should return both zones', function (done) {

      request(serverurl)
        .get('/zones')
        .auth(user.username, user.apitoken)
        .expect(200)
        .expect([{ zone: expectedZoneResponse(1, zone1) },{ zone: expectedZoneResponse(2, zone2) }])
        .end(done);

    });

  });

  describe('GET /zone/1', function () {

    var zone1, zone2;

    before(function () {
      mockserver.reset();

      zone1 = createRandomZone();
      zone2 = createRandomZone();
      user = createRandomUser();

      mockserver.addZone(zone1);
      mockserver.addZone(zone2);
      mockserver.addUser(user);
    });

    it('should return the first zone', function (done) {

      request(serverurl)
        .get('/zones/1')
        .auth(user.username, user.apitoken)
        .expect(200)
        .expect({ zone: expectedZoneResponse(1, zone1) })
        .end(done);

    });

  });

  describe('GET /zone/2', function () {

    var zone1, zone2;

    before(function () {
      mockserver.reset();

      zone1 = createRandomZone();
      zone2 = createRandomZone();
      user = createRandomUser();

      mockserver.addZone(zone1);
      mockserver.addZone(zone2);
      mockserver.addUser(user);
    });

    it('should return the second zone', function (done) {

      request(serverurl)
        .get('/zones/2')
        .auth(user.username, user.apitoken)
        .expect(200)
        .expect({ zone: expectedZoneResponse(2, zone2) })
        .end(done);

    });

  });

  describe('GET /zone/1/records', function () {

    var zone;
    var record1, record2;

    before(function () {
      mockserver.reset();

      zone = createRandomZone();
      record1 = createRandomZoneRecord(zone);
      record2 = createRandomZoneRecord(zone);
      user = createRandomUser();

      mockserver.addZone(zone, [record1, record2]);
      mockserver.addUser(user);
    });

    it('should return the first zone\'s records', function (done) {

      request(serverurl)
        .get('/zones/1/records')
        .auth(user.username, user.apitoken)
        .expect(200)
        .expect([{
          zone_record: expectedRecordResponse(1, zone, 1, record1)
        },{
          zone_record: expectedRecordResponse(1, zone, 2, record2)
        }])
        .end(done);

    });

  });

  describe('GET /zone/2/records', function () {

    var zone;
    var record1, record2;

    before(function () {
      mockserver.reset();

      zone = createRandomZone();
      record1 = createRandomZoneRecord(zone);
      record2 = createRandomZoneRecord(zone);
      user = createRandomUser();

      mockserver.addZone(createRandomZone());
      mockserver.addZone(zone, [record1, record2]);
      mockserver.addUser(user);
    });

    it('should return the second zone\'s records', function (done) {

      request(serverurl)
        .get('/zones/2/records')
        .auth(user.username, user.apitoken)
        .expect(200)
        .expect([{
          zone_record: expectedRecordResponse(2, zone, 1, record1)
        },{
          zone_record: expectedRecordResponse(2, zone, 2, record2)
        }])
        .end(done);

    });

  });

  describe('GET /zone/unknown_zone', function () {

    var user;

    before(function () {
      mockserver.reset();

      user = createRandomUser();

      mockserver.addUser(user);
    });

    it('should return 404', function (done) {

      request(serverurl)
        .get('/zone/unknown_zone')
        .auth(user.username, user.apitoken)
        .expect(404)
        .end(done);

    });

  });

  describe('GET /zone/1 when no zones exist', function () {

    var user;

    before(function () {
      mockserver.reset();

      user = createRandomUser();

      mockserver.addUser(user);
    });

    it('should return 404', function (done) {

      request(serverurl)
        .get('/zone/1')
        .auth(user.username, user.apitoken)
        .expect(404)
        .end(done);

    });

  });

  describe('GET /unknown_path', function () {

    var user;

    before(function () {
      mockserver.reset();

      user = createRandomUser();

      mockserver.addUser(user);
    });

    it('should return 404', function (done) {

      request(serverurl)
        .get('/unknown_path')
        .auth(user.username, user.apitoken)
        .expect(404)
        .end(done);

    });

  });

  describe('DELETE /zone/2', function () {

    var zone;

    before(function () {
      mockserver.reset();

      zone = createRandomZone();
      user = createRandomUser();

      mockserver.addZone(createRandomZone());
      mockserver.addZone(zone);
      mockserver.addUser(user);
    });

    it('should delete the second zone', function (done) {

      request(serverurl)
        .delete('/zones/2')
        .auth(user.username, user.apitoken)
        .expect(200)
        .expect({ zone: { status: "OK" }})
        .end(done);

    });

    it('should have deleted the zone from the server', function () {

      assert.equal(mockserver.getZones().length, 1);

    });

  });

  describe('PUT /zone/1', function () {

    var zone;
    var group;

    before(function () {
      mockserver.reset();

      group = "new group";

      zone = createRandomZone();
      user = createRandomUser();

      mockserver.addZone(zone);
      mockserver.addUser(user);

      zone.group = group;
    });

    it('should change the group of the first zone', function (done) {

      request(serverurl)
        .put('/zones/1')
        .auth(user.username, user.apitoken)
        .send({ zone: { group: group }})
        .expect(202)
        .expect({ zone: expectedZoneResponse(1, zone) })
        .end(done);

    });

    it('should have changed the group for the first zone', function () {

      assert.equal(mockserver.getZone(1).group, group);

    });

  });

  describe('PUT /zones/1/records/1', function () {

    var zone;
    var record;
    var ipAddress;

    before(function () {
      mockserver.reset();

      ipAddress = random.ipAddress();

      zone = createRandomZone();
      user = createRandomUser();
      record = createRandomZoneRecord(zone);
      
      mockserver.addZone(zone, [record]);
      mockserver.addUser(user);

      record.data = ipAddress;
    });

    it('should change the data of the first zone\'s first record', function (done) {

      request(serverurl)
        .put('/zones/1/records/1')
        .auth(user.username, user.apitoken)
        .send({ zone_record: { data: ipAddress }})
        .expect(202)
        .expect({ zone_record: expectedRecordResponse(1, zone, 1, record) })
        .end(done);

    });

    it('should have changed the data of the first zone\'s first record', function () {

      assert.equal(mockserver.getRecord(1, 1).data, ipAddress);

    });

  });

});