var request = require('supertest'),
    random = require('./random'),
    config = require('../config').development,
    mockserver = require('../');


function createRandomZone() {
  return {
    "name": random.string(10) + '.' + random.choice('com', 'co', 'co.uk'),
    "group": random.string(),
    "user-id": random.number(),
    "ttl": random.number()
  }
}

function createRandomZoneRecord(zone) {
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
    "name": record["name"] + '.' + zone["name"],
    "data": record["data"],
    "aux": record["aux"],
    "record_type": record["record_type"],
    "redirect_to": record["redirect_to"],
    "ttl": record["ttl"],
    "zone_id": zoneid
  };
}


describe('Mock PointHQ Server', function () {

  var server;
  var serverurl;
  var zone1, zone2;
  var zone1records, zone2records;

  before(function (done) {

    zone1 = createRandomZone();
    zone1records = [createRandomZoneRecord(zone1), createRandomZoneRecord(zone1)];
    mockserver.addZone(zone1, zone1records);

    zone2 = createRandomZone();
    zone2records = [createRandomZoneRecord(zone2), createRandomZoneRecord(zone2)];
    mockserver.addZone(zone2, zone2records);

    server = mockserver.app.listen(config.server.port, config.server.host, function () {
      serverurl = "http://" + config.server.host + ":" + config.server.port;
      done();
    });

  });

  after(function (done) {
    server.close(done);
  });

  describe('GET /zones', function () {

    it('should return both zones', function (done) {

      request(serverurl)
        .get('/zones')
        .expect(200)
        .expect([{ zone: expectedZoneResponse(1, zone1) },{ zone: expectedZoneResponse(2, zone2) }])
        .end(done);

    });

  });

  describe('GET /zone/1', function () {

    it('should return the first zone', function (done) {

      request(serverurl)
        .get('/zones/1')
        .expect(200)
        .expect({ zone: expectedZoneResponse(1, zone1) })
        .end(done);

    });

  });

  describe('GET /zone/2', function () {

    it('should return the second zone', function (done) {

      request(serverurl)
        .get('/zones/2')
        .expect(200)
        .expect({ zone: expectedZoneResponse(2, zone2) })
        .end(done);

    });

  });

  describe('GET /zone/1/records', function () {

    it('should return the first zone\'s records', function (done) {

      request(serverurl)
        .get('/zones/1/records')
        .expect(200)
        .expect([{
          zone_record: expectedZoneRecordResponse(1, zone1, 1, zone1records[0])
        },{
          zone_record: expectedZoneRecordResponse(1, zone1, 2, zone1records[1])
        }])
        .end(done);

    });

  });

  describe('GET /zone/2/records', function () {

    it('should return the second zone\'s records', function (done) {

      request(serverurl)
        .get('/zones/2/records')
        .expect(200)
        .expect([{
          zone_record: expectedZoneRecordResponse(2, zone2, 1, zone2records[0])
        },{
          zone_record: expectedZoneRecordResponse(2, zone2, 2, zone2records[1])
        }])
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

    it('should delete the second zone', function (done) {

      request(serverurl)
        .delete('/zones/2')
        .expect(200)
        .expect({ zone: { status: "OK" }})
        .end(done);

    });

    it('should have deleted the zone from the server', function (done) {

      request(serverurl)
        .get('/zones/2')
        .expect(404)
        .expect({})
        .end(done);

    });

  });

  describe('PUT /zone/1', function () {

    before(function () {
      zone1.group = "Other Group";
    });

    it('should change the group of the first zone', function (done) {

      request(serverurl)
        .put('/zones/1')
        .send({ zone: { group: zone1.group }})
        .expect(200)
        .expect({ zone: expectedZoneResponse(1, zone1) })
        .end(done);

    });

    it('should have changed the group for the first zone', function (done) {

      request(serverurl)
        .get('/zones/1')
        .expect(200)
        .expect({ zone: expectedZoneResponse(1, zone1) })
        .end(done);

    });

  });

});