var request = require('supertest')
    util = require('util'),
    random = require('../lib/random'),
    config = require('../config').development,
    mockserver = require('../'),
    assert = require('assert'),
    uuid = require('node-uuid');


function createRandomUser() {
  return {
    username: random.string(20),
    password: random.string(50)
  }
}

function createRandomZone() {
  return {
    "id": random.number(1, 999),
    "name": random.string(10) + '.' + random.choice('com', 'co', 'co.uk'),
    "group": random.string(),
    "user-id": random.number(),
    "ttl": random.number()
  }
}

function createRandomZoneRecord() {
  return {
    "id": random.number(1, 999),
    "name": random.string(10),
    "data": random.ipAddress(),
    "aux": random.string(),
    "record_type": random.choice('A', 'CNAME', 'MX', 'TXT', 'NS', 'SRV', 'AAAA', 'SSHFP', 'PTR', 'ALIAS'),
    "redirect_to": random.string(),
    "ttl": random.number()
  }
}

function expectedZoneResponse(zone) {
  return {
    "id": zone.id,
    "name": zone.name,
    "group": zone.group,
    "user-id": zone["user-id"],
    "ttl": zone.ttl
  };
}

function expectedRecordResponse(zone, record) {
  return {
    "id": record.id,
    "name": record.name + '.' + zone.name + '.',
    "data": record.data,
    "aux": record.aux,
    "record_type": record.record_type,
    "redirect_to": record.redirect_to,
    "ttl": record.ttl,
    "zone_id": zone.id
  };
}

var server;
var serverUrl;

before(function (done) {

  server = mockserver.app.listen(config.server.port, config.server.host, function () {
    serverUrl = "http://" + config.server.host + ":" + config.server.port;
    done();
  });

});

after(function (done) {
  server.close(done);
});


describe('Unknown Routes', function () {

  describe('GET /unknown_path', function () {

    var user;

    before(function () {
      mockserver.reset();

      user = createRandomUser();

      mockserver.addUser(user);
    });

    it('should return 404', function (done) {

      request(serverUrl)
        .get('/unknown_path')
        .auth(user.username, user.password)
        .expect(404)
        .end(done);

    });

  });

});


describe('Authorization', function () {

  describe('GET /zones with missing Authorization header', function () {

    before(function () {
      mockserver.reset();
      mockserver.addZone(createRandomZone());
    });

    it('should return 302 Found with Location header', function (done) {

      request(serverUrl)
        .get('/zones')
        .expect(302)
        .expect('Location', 'https://sso.copper.io/api/v1/sessions/validate?service=https%3A%2F%2Fpointhq.com%2Fzones')
        .expect({})
        .end(done);

    });

  });

  describe('GET /zones/:id with missing Authorization header', function () {

    var zone;

    before(function () {
      mockserver.reset();

      zone = createRandomZone();

      mockserver.addZone(createRandomZone());
    });

    it('should return 404 Not Found', function (done) {

      request(serverUrl)
        .get('/zones/' + zone.id)
        .expect(404)
        .end(done);

    });

  });


  describe('with Username and Password', function () {

    describe('GET /zones with valid user', function () {

      var user;

      before(function () {
        mockserver.reset();

        user = createRandomUser();

        mockserver.addZone(createRandomZone());
        mockserver.addUser(createRandomUser());
        mockserver.addUser(user);
        mockserver.addUser(createRandomUser());
      });

      it('should return 200 OK', function (done) {

        request(serverUrl)
          .get('/zones')
          .auth(user.username, user.password)
          .expect(200)
          .end(done);

      });

    });

    describe('GET /zones with incorrect username', function () {

      var user;

      before(function () {
        mockserver.reset();

        user = createRandomUser();

        mockserver.addZone(createRandomZone());
        mockserver.addUser(createRandomUser());
        mockserver.addUser(user);
        mockserver.addUser(createRandomUser());
      });

      it('should return 403 Forbidden with \'Access Denied\' body', function (done) {

        request(serverUrl)
          .get('/zones')
          .auth(random.string(10), user.password)
          .expect(403)
          .expect({})
          .end(done);

      });

    });

    describe('GET /zones with incorrect password', function () {

      var user;

      before(function () {
        mockserver.reset();

        user = createRandomUser();

        mockserver.addZone(createRandomZone());
        mockserver.addUser(user);
      });

      it('should return 403 Forbidden', function (done) {

        request(serverUrl)
          .get('/zones')
          .auth(user.username, random.string(50))
          .expect(403)
          .expect('Access denied')
          .end(done);

      });

    });

  });

  describe('with API Token', function () {

    describe('GET /zones with API token', function () {

      var apitoken;

      before(function () {
        mockserver.reset();

        var user = createRandomUser();
        apitoken = user.password = uuid.v4();
        
        mockserver.addZone(createRandomZone());
        mockserver.addUser(user);
        mockserver.setApiToken(apitoken);
      });

      it('should return 200 OK', function (done) {

        request(serverUrl)
          .get('/zones')
          .auth('', apitoken)
          .expect(200)
          .end(done);

      });

    });

    describe('GET /zones with valid user and API token password', function () {

      var user;
      var apitoken;

      before(function () {
        mockserver.reset();

        user = createRandomUser();
        apitoken = uuid.v4();
        
        mockserver.addUser(user);
        mockserver.setApiToken(apitoken);
      });

      it('should return 200 OK', function (done) {

        request(serverUrl)
          .get('/zones')
          .auth(user.username, apitoken)
          .expect(200)
          .end(done);

      });

    });

    describe('GET /zones with invalid user and API token password', function () {

      var apitoken;

      before(function () {
        mockserver.reset();

        apitoken = uuid.v4();
        
        mockserver.setApiToken(apitoken);
      });

      it('should return 200 OK', function (done) {

        request(serverUrl)
          .get('/zones')
          .auth(random.string(), apitoken)
          .expect(200)
          .end(done);

      });

    });

  });

});


describe('Zones', function () {

  describe('GET /zones', function () {

    var zone1, zone2;
    var user;

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

      request(serverUrl)
        .get('/zones')
        .auth(user.username, user.password)
        .expect(200)
        .expect([{ zone: expectedZoneResponse(zone1) },{ zone: expectedZoneResponse(zone2) }])
        .end(done);

    });

  });

  describe('GET /zone/:id', function () {

    var zone1, zone2;
    var user;

    before(function () {
      mockserver.reset();

      zone1 = createRandomZone();
      zone2 = createRandomZone();
      user = createRandomUser();

      mockserver.addZone(zone1);
      mockserver.addZone(zone2);
      mockserver.addUser(user);
    });

    it('should return the second zone as expected', function (done) {

      request(serverUrl)
        .get('/zones/' + zone2.id)
        .auth(user.username, user.password)
        .expect(200)
        .expect({ zone: expectedZoneResponse(zone2) })
        .end(done);

    });

    it('should return the first zone as expected', function (done) {

      request(serverUrl)
        .get('/zones/' + zone1.id)
        .auth(user.username, user.password)
        .expect(200)
        .expect({ zone: expectedZoneResponse(zone1) })
        .end(done);

    });

  });

  describe('DELETE /zone/:id', function () {

    var zone;
    var user;

    before(function () {
      mockserver.reset();

      zone = createRandomZone();
      user = createRandomUser();

      mockserver.addZone(createRandomZone());
      mockserver.addZone(zone);
      mockserver.addUser(user);
    });

    it('should delete the second zone', function (done) {

      request(serverUrl)
        .delete(util.format('/zones/%d', zone.id))
        .auth(user.username, user.password)
        .expect(200)
        .expect({ zone: { status: "OK" }})
        .end(done);

    });

    it('should have deleted the zone from the server', function () {

      assert.equal(mockserver.getZones().length, 1);

    });

  });

  describe('PUT /zone/:id', function () {

    var zone;
    var group;
    var user;

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

      request(serverUrl)
        .put(util.format('/zones/%d', zone.id))
        .auth(user.username, user.password)
        .send({ zone: { group: group }})
        .expect(202)
        .expect({ zone: expectedZoneResponse(zone) })
        .end(done);

    });

    it('should have changed the group for the first zone', function () {

      var actualZone = mockserver.getZone(zone.id);
      assert.equal(actualZone.group, group);

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

      request(serverUrl)
        .get('/zone/unknown_zone')
        .auth(user.username, user.password)
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

      request(serverUrl)
        .get('/zone/1')
        .auth(user.username, user.password)
        .expect(404)
        .end(done);

    });

  });

});

describe('Zone Records', function () {

  describe('GET /zone/:id/records', function () {

    var zone;
    var record1, record2;
    var user;

    before(function () {
      mockserver.reset();

      zone = createRandomZone();
      record1 = createRandomZoneRecord(zone);
      record2 = createRandomZoneRecord(zone);
      user = createRandomUser();

      mockserver.addZone(createRandomZone());
      mockserver.addZone(zone, [record1, record2]);
      mockserver.addZone(createRandomZone());
      mockserver.addUser(user);
    });

    it('should return the zone\'s records', function (done) {

      request(serverUrl)
        .get(util.format('/zones/%d/records', zone.id))
        .auth(user.username, user.password)
        .expect(200)
        .expect([{
          zone_record: expectedRecordResponse(zone, record1)
        },{
          zone_record: expectedRecordResponse(zone, record2)
        }])
        .end(done);

    });

  });

  describe('PUT /zones/:id/records/:id', function () {

    var zone;
    var record;
    var ipAddress;
    var user;

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

      request(serverUrl)
        .put(util.format('/zones/%d/records/%d', zone.id, record.id))
        .auth(user.username, user.password)
        .send({ zone_record: { data: ipAddress }})
        .expect(202)
        .expect({ zone_record: expectedRecordResponse(zone, record) })
        .end(done);

    });

    it('should have changed the data of the first zone\'s first record', function () {
      
      var actualRecord = mockserver.getRecord(zone.id, record.id);
      assert.equal(actualRecord.data, ipAddress);

    });

  });

});