var express = require('express'),
    bodyParser = require('body-parser'),
    util = require('util'),
    debug = require('debug')('mock:pointdns');

var zones = [];

function addZone(zone, records) {
  var z = {
    "name": zone["name"],
    "group": zone["group"],
    "user-id": zone["user-id"],
    "ttl": zone["ttl"],
    records: []
  };

  records = records || [];
  records.forEach(function (record) {
    z.records.push({
      "name": record.name,
      "data": record.data,
      "aux": record.aux,
      "record_type": record["record_type"],
      "redirect_to": record.redirect_to,
      "ttl": record.ttl
    });
  });

  zones.push(z);
}

function cloneZone(zone) {
  var z = {
    name: zone.name,
    group: zone.group,
    "user-id": zone["user-id"],
    ttl: zone.ttl,
    records: []
  };

  zone.records.forEach(function (record) {
    z.records.push({
      name: record.name,
      data: record.data,
      aux: record.aux,
      record_type: record.record_type,
      redirect_to: record.redirect_to,
      ttl: record.ttl
    });
  });

  return zone;
}

function getZone(zone_id) {

  if (zone_id < 1 || zone_id > zones.length)
    throw new Error('zone_id out of range.');

  return cloneZone(zones[zone_id - 1]);
}

function getZones() {

  var zs = [];

  zones.forEach(function (zone) {
    zs.push(cloneZone(zone));
  });

  return zs;
}

function getRecord(zone_id, record_id) {

  if (zone_id < 1 || zone_id > zones.length)
    throw new Error('zone_id out of range.');

  var zone = zones[zone_id - 1];

  if (record_id < 1 || record_id > zone.records.length)
    throw new Error('record_id out of range.');

  var record = zone.records[record_id - 1];

  return {
    name: record.name,
    data: record.data,
    aux: record.aux,
    record_type: record.record_type,
    redirect_to: record.redirect_to,
    ttl: record.ttl
  };
}

function reset() {
  zones = [];
}


function createZoneResponse(zoneid, zone) {
  return {
    "zone": {
      "id": zoneid,
      "name": zone["name"] || "example.com",
      "group": zone["group"] || "Default Group",
      "user-id": zone["user-id"] || 3,
      "ttl": zone["ttl"] || 3600 
  }};
}

function createRecordResponse(zoneid, zone, recordid, record) {
  return {
    "zone_record": {
      "id": recordid,
      "name": util.format("%s.%s", record["name"] || "site", zone.name),
      "data": record["data"] || "1.2.3.4",
      "aux": record["aux"] || null,
      "record_type": record["record_type"] || "A",
      "redirect_to": record["redirect_to"] || null,
      "ttl": record["ttl"] || 3600,
      "zone_id": zoneid || 1
  }};
}


var app = express();
var zoneRouter = express.Router();

zoneRouter.get('/', function (req, res) {
  var response = [];
  for (var i = 0; i < zones.length; i++) {
    response.push(createZoneResponse(i + 1, zones[i]));
  };
  res.status(200).json(response).end();
});

zoneRouter.get('/:zone_id([0-9]+)', function (req, res) {
  var zone_id = parseInt(req.params.zone_id, 10),
      zone_index = zone_id - 1;

  if (zone_index < zones.length) {
    var response = createZoneResponse(zone_id, zones[zone_index]);
    return res.status(200).json(response).end();
  }

  res.send(404);
});

zoneRouter.delete('/:zone_id([0-9]+)', function (req, res) {
  var zone_id = parseInt(req.params.zone_id, 10),
      zone_index = zone_id - 1;

  if (zone_index < zones.length) {
    zones.splice(zone_index, 1);
    return res.status(200).json({ zone: { status: "OK" }}).end();
  }

  res.send(404);
});

zoneRouter.put('/:zone_id([0-9]+)', function (req, res) {
  var zone_id = parseInt(req.params.zone_id, 10),
      zone_index = zone_id - 1;

  if (zone_index < zones.length) {
    var zone = zones[zone_index];

    zone.group = req.body.zone.group;

    var response = createZoneResponse(zone_id, zone);
    return res.status(202).json(response).end();
  }

  res.send(404);
});

zoneRouter.get('/:zone_id([0-9]+)/records', function (req, res) {
  var zone_id = parseInt(req.params.zone_id, 10),
      zone_index = zone_id - 1;

  if (zone_index < zones.length) {
    var zone = zones[zone_index];

    var response = [];
    for (var i = 0; i < zone.records.length; i++) {
      response.push(createRecordResponse(zone_id, zone, i + 1, zone.records[i]));
    };
    return res.status(200).json(response).end();
  }

  res.send(404);
});

zoneRouter.put('/:zone_id([0-9]+)/record/:record_id([0-9]+)', function (req, res) {
  var zone_id = parseInt(req.params.zone_id, 10),
      zone_index = zone_id - 1,
      record_id = parseInt(req.params.record_id, 10),
      record_index = record_id - 1;

  if (zone_index < zones.length) {
    var zone = zones[zone_index];

    if (record_index < zone.records.length) {
      var record = zone.records[record_index];

      record.data = req.body.zone_record.data;

      var response = createRecordResponse(zone_id, zone, record_id, record);
      return res.status(202).json(response).end();
    }
  }

  res.send(404).end();
});


app.use(bodyParser.json());

app.use(function (req, res, next) {
  debug('%s %s', req.method, req.url);
  next();
});

app.use('/zones', zoneRouter);

app.use(function (req, res) {
  res.send(404).end();
});


module.exports.app = app;
module.exports.addZone = addZone;
module.exports.getZone = getZone;
module.exports.getZones = getZones;
module.exports.getRecord = getRecord;
module.exports.reset = reset;