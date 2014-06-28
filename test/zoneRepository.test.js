var ZoneRepository = require('../lib/zoneRepository'),
    random = require('../lib/random'),
    assert = require('assert');
    

describe('Zone Repository', function () {

  describe('#addZone with zone', function () {

    var repo;
    var expectedZone;

    before(function () {
      repo = new ZoneRepository();

      expectedZone = {
        id: random.integer(1, 9999),
        name: random.string(),
        group: random.string(),
        "user-id": random.integer(1, 999),
        ttl: random.integer(1, 5000),
        records: [{
          name: random.string()
        }],
        garbage: random.string()
      }

      repo.addZone(expectedZone);
    });

    it('should have added a zone', function () {
      assert.equal(repo.count(), 1);
    });

    it('should have set the zone properties', function () {
      var actualZone = repo.getZone(expectedZone.id);

      assert.equal(actualZone.id, expectedZone.id);
      assert.equal(actualZone.name, expectedZone.name);
      assert.equal(actualZone.group, expectedZone.group);
      assert.equal(actualZone["user-id"], expectedZone["user-id"]);
      assert.equal(actualZone.ttl, expectedZone.ttl);
    });

    it('should have not set the non-zone properties', function () {
      var actualZone = repo.getZone(expectedZone.id);

      assert.equal(actualZone.records.length, 0);
      assert.equal(actualZone.garbage, undefined);
    });

  });

  describe('#count with multiple zones', function () {

    var repo;
    var expectedCount;

    before(function () {
      repo = new ZoneRepository();

      expectedCount = random.integer(0, 100);

      for (var i = 0; i < expectedCount; i++) {
        var zone = random.zone();
        zone.id = i;
        repo.addZone(zone);
      };
    });

    it('should have the expected count of zones', function () {
      assert.equal(repo.count(), expectedCount);
    });

  });

  describe('#getZones', function () {

    var repo;
    var expectedCount;
    var expectedZones;
    var actualZones;

    before(function () {
      repo = new ZoneRepository();

      expectedCount = random.integer(0, 100);
      expectedZones = [];

      for (var i = 0; i < expectedCount; i++) {
        var zone = random.zone();
        zone.id = i;
        zone.records = [];
        repo.addZone(zone);
        expectedZones.push(zone);
      }

      actualZones = repo.getZones();
    });

    it('should get the expected count of zones', function () {
      assert.equal(actualZones.length, expectedCount);
    });

    it('should have the expected zones', function () {
      assert.deepEqual(actualZones, expectedZones);
    });

  });

  describe('#reset', function () {

    var repo;

    before(function () {
      repo = new ZoneRepository();

      var createNum = random.integer(0, 100);

      for (var i = 0; i < createNum; i++) {
        var zone = random.zone();
        zone.id = i;
        repo.addZone(zone);
      };

      repo.reset();
    });

    it('should have zero zones', function () {
      assert.equal(repo.count(), 0);
    });

  });

  describe('#addZone with same zone id', function () {

    var repo;
    var zone;

    before(function () {
      repo = new ZoneRepository();
      zone = random.zone();
      repo.addZone(zone);
    });

    it('should throw an exception when a zone of the same id is added', function () {
      assert.throws(function () {
        repo.addZone(zone);
      }, Error);
    });

  });

  describe('#addZone with zone and records', function () {

    var repo;
    var expectedFirstRecord;
    var expectedSecondRecord;
    var expectedZone;

    before(function () {
      repo = new ZoneRepository();

      expectedFirstRecord = random.record();
      expectedFirstRecord.asdasdjkadkj = "this should be ignored";

      expectedSecondRecord = random.record();
      expectedSecondRecord.garbage = "this should also be ignored";

      expectedZone = random.zone();

      repo.addZone(expectedZone, [expectedFirstRecord, expectedSecondRecord]);
    });

    it('should have added a zone with two records', function () {
      assert.equal(repo.count(), 1);

      var actualZone = repo.getZone(expectedZone.id);
      assert.equal(actualZone.records.length, 2);
    });

    it('should have set the record properties', function () {
      var actualFirstRecord = repo.getRecord(expectedZone.id, expectedFirstRecord.id);

      assert.equal(actualFirstRecord.id, expectedFirstRecord.id);
      assert.equal(actualFirstRecord.name, expectedFirstRecord.name);
      assert.equal(actualFirstRecord.data, expectedFirstRecord.data);
      assert.equal(actualFirstRecord.aux, expectedFirstRecord.aux);
      assert.equal(actualFirstRecord.record_type, expectedFirstRecord.record_type);
      assert.equal(actualFirstRecord.redirect_to, expectedFirstRecord.redirect_to);
      assert.equal(actualFirstRecord.ttl, expectedFirstRecord.ttl);

      var actualSecondRecord = repo.getRecord(expectedZone.id, expectedSecondRecord.id);

      assert.equal(actualSecondRecord.id, expectedSecondRecord.id);
      assert.equal(actualSecondRecord.name, expectedSecondRecord.name);
      assert.equal(actualSecondRecord.data, expectedSecondRecord.data);
      assert.equal(actualSecondRecord.aux, expectedSecondRecord.aux);
      assert.equal(actualSecondRecord.record_type, expectedSecondRecord.record_type);
      assert.equal(actualSecondRecord.redirect_to, expectedSecondRecord.redirect_to);
      assert.equal(actualSecondRecord.ttl, expectedSecondRecord.ttl);
    });

    it('should have not set the non-record properties', function () {
      var actualFirstRecord = repo.getRecord(expectedZone.id, expectedFirstRecord.id);
      assert.equal(actualFirstRecord.asdasdjkadkj, undefined);

      var actualSecondRecord = repo.getRecord(expectedZone.id, expectedSecondRecord.id);
      assert.equal(actualSecondRecord.garbage, undefined);
    });

  });

  describe('#addZone with same record id', function () {

    var repo;
    var zone;
    var record;

    before(function () {
      repo = new ZoneRepository();
      zone = random.zone();
      record = random.record();
    });

    it('should throw an exception when a record of the same id is added to the same zone', function () {
      assert.throws(function () {
        repo.addZone(zone, [record, record]);
      }, Error);
    });

  });

  describe('#updateZone with new zone properties', function () {

    var repo;
    var zone;

    before(function () {
      repo = new ZoneRepository();

      zone = random.zone();
      repo.addZone(zone);

      zone.name = random.string();
      zone.group = random.string();
      zone["user-id"] = random.integer(1, 999);
      zone.ttl = random.integer(1, 5000);

      repo.updateZone(zone);
    });

    it('should have updated the zone', function () {
      var actualZone = repo.getZone(zone.id);

      assert.equal(actualZone.id, zone.id);
      assert.equal(actualZone.name, zone.name);
      assert.equal(actualZone.group, zone.group);
      assert.equal(actualZone["user-id"], zone["user-id"]);
      assert.equal(actualZone.ttl, zone.ttl);
    });

  });

  describe('#updateRecord with new record properties', function () {

    var repo;
    var zone;
    var record;

    before(function () {
      repo = new ZoneRepository();

      zone = random.zone();
      record = random.record();
      repo.addZone(zone, [record]);

      record.data = random.ipAddress();

      repo.updateRecord(zone.id, record);
    });

    it('should have updated the record', function () {
      var actualRecord = repo.getRecord(zone.id, record.id);

      assert.equal(actualRecord.id, record.id);
      assert.equal(actualRecord.name, record.name);
      assert.equal(actualRecord.data, record.data);
      assert.equal(actualRecord.aux, record.aux);
      assert.equal(actualRecord.record_type, record.record_type);
      assert.equal(actualRecord.redirect_to, record.redirect_to);
      assert.equal(actualRecord.ttl, record.ttl);
    });

  });

  describe('#removeZone', function () {

    var repo;
    var zone;
    var record;

    before(function () {
      repo = new ZoneRepository();

      zone = random.zone();
      repo.addZone(zone);
      repo.removeZone(zone.id);
    });

    it('should contain no zones', function () {
      assert.equal(repo.getZones(), 0);
    });

  });

});