var request = require('supertest'),
    random = require('./random'),
    config = require('../config').development,
    mockserver = require('../'),
    assert = require('assert');


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

function expectedZoneRecordResponse(zoneid, zone, recordid, record) {
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


describe('Mock PointHQ Server', function () {

  before(function (done) {

    server = mockserver.app.listen(config.server.port, config.server.host, function () {
      serverurl = "http://" + config.server.host + ":" + config.server.port;
      done();
    });

  });

  after(function (done) {
    server.close(done);
  });

  describe('GET /zones', function () {

    var zone1, zone2;

    before(function () {
      mockserver.reset();

      zone1 = createRandomZone();
      zone2 = createRandomZone();

      mockserver.addZone(zone1);
      mockserver.addZone(zone2);
    });

    it('should return both zones', function (done) {

      request(serverurl)
        .get('/zones')
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

      mockserver.addZone(zone1);
      mockserver.addZone(zone2);
    });

    it('should return the first zone', function (done) {

      request(serverurl)
        .get('/zones/1')
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

      mockserver.addZone(zone1);
      mockserver.addZone(zone2);
    });

    it('should return the second zone', function (done) {

      request(serverurl)
        .get('/zones/2')
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

      mockserver.addZone(zone, [record1, record2]);
    });

    it('should return the first zone\'s records', function (done) {

      request(serverurl)
        .get('/zones/1/records')
        .expect(200)
        .expect([{
          zone_record: expectedZoneRecordResponse(1, zone, 1, record1)
        },{
          zone_record: expectedZoneRecordResponse(1, zone, 2, record2)
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

      mockserver.addZone(createRandomZone());
      mockserver.addZone(zone, [record1, record2]);
    });

    it('should return the second zone\'s records', function (done) {

      request(serverurl)
        .get('/zones/2/records')
        .expect(200)
        .expect([{
          zone_record: expectedZoneRecordResponse(2, zone, 1, record1)
        },{
          zone_record: expectedZoneRecordResponse(2, zone, 2, record2)
        }])
        .end(done);

    });

  });

  describe('GET /zone/unknown_zone', function () {

    it('should return 404', function (done) {

      request(serverurl)
        .get('/zone/unknown_zone')
        .expect(404)
        .end(done);

    });

  });

  describe('GET /zone/1 when no zones exist', function () {

    it('should return 404', function (done) {

      request(serverurl)
        .get('/zone/1')
        .expect(404)
        .end(done);

    });

  });

  describe('GET /unknown_path', function () {

    it('should return 404', function (done) {

      request(serverurl)
        .get('/unknown_path')
        .expect(404)
        .end(done);

    });

  });

  describe('DELETE /zone/2', function () {

    var zone;

    before(function () {
      mockserver.reset();

      zone = createRandomZone();

      mockserver.addZone(createRandomZone());
      mockserver.addZone(zone);
    });

    it('should delete the second zone', function (done) {

      request(serverurl)
        .delete('/zones/2')
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
      mockserver.addZone(zone);

      zone.group = group;
    });

    it('should change the group of the first zone', function (done) {

      request(serverurl)
        .put('/zones/1')
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
      record = createRandomZoneRecord(zone);
      mockserver.addZone(zone, [record]);

      record.data = ipAddress;
    });

    it('should change the data of the first zone\'s first record', function (done) {

      request(serverurl)
        .put('/zones/1/records/1')
        .send({ zone_record: { data: ipAddress }})
        .expect(202)
        .expect({ zone_record: expectedZoneRecordResponse(1, zone, 1, record) })
        .end(done);

    });

    it('should have changed the data of the first zone\'s first record', function () {

      assert.equal(mockserver.getRecord(1, 1).data, ipAddress);

    });

  });

});