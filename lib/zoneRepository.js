function cloneRecord(record) {
  return {
    id: record.id,
    name: record.name,
    data: record.data,
    aux: record.aux,
    record_type: record.record_type,
    redirect_to: record.redirect_to,
    ttl: record.ttl
  };
}

function cloneZone(zone) {
  var z = {
    id: zone.id,
    name: zone.name,
    group: zone.group,
    "user-id": zone["user-id"],
    ttl: zone.ttl,
    records: []
  };

  for (var recordId in zone.records) {
    var record = zone.records[recordId];
    z.records.push(cloneRecord(record));
  }

  return z;
}


function ZoneRepository() {
  this.zones = {};
}

ZoneRepository.prototype.addZone = function (zone, records) {
  if (this.zones["id#" + zone.id] !== undefined)
    throw new Error('Zone id already exists.');

  var z = {
    id: zone.id,
    name: zone.name,
    group: zone.group,
    "user-id": zone["user-id"],
    ttl: zone.ttl,
    records: {}
  };

  this.zones["id#" + z.id] = z;

  var self = this;

  records = records || [];
  records.forEach(function (record) {
    if (self.getRecord(zone.id, record.id) != null)
      throw new Error('Record id already exists.');

    z.records["id#" + record.id] = cloneRecord(record);
  });
};

ZoneRepository.prototype.count = function () {
  return Object.keys(this.zones).length;
};

ZoneRepository.prototype.getZone = function (id) {
  var zone = this.zones["id#" + id];
  if (zone === undefined)
    return null;

  return cloneZone(zone);
};

ZoneRepository.prototype.getZones = function () {
  var zones = [];

  for (var zoneId in this.zones) {
    var zone = this.zones[zoneId];
    zones.push(cloneZone(zone));
  }

  return zones;
};

ZoneRepository.prototype.getRecord = function (zoneId, recordId) {
  var zone = this.zones["id#" + zoneId];
  if (zone === undefined)
    return null;

  var record = zone.records["id#" + recordId];
  if (record === undefined)
    return null;

  return cloneRecord(record);
};

ZoneRepository.prototype.reset = function () {
  this.zones = {};
};

ZoneRepository.prototype.updateZone = function (zone) {
  var z = this.zones["id#" + zone.id];
  if (z === undefined)
    return;

  z.name = zone.name;
  z.group = zone.group;
  z["user-id"] = zone["user-id"];
  z.ttl = zone.ttl;
};

ZoneRepository.prototype.updateRecord = function (zoneId, record) {
  var zone = this.zones["id#" + zoneId];
  if (zone === undefined)
    return;

  var r = zone.records["id#" + record.id];
  if (r === undefined)
    return;

  r.name = record.name;
  r.data = record.data;
  r.aux = record.aux;
  r.record_type = record.record_type;
  r.redirect_to = record.redirect_to;
  r.ttl = record.ttl;
};

ZoneRepository.prototype.removeZone = function (zoneId) {
  if (this.zones["id#" + zoneId] !== undefined)
    delete this.zones["id#" + zoneId];
};

module.exports = function () {
  return new ZoneRepository();
};