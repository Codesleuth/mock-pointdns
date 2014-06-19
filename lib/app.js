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

zoneRouter.get('/', function(req, res) {
  var response = [];
  for (var i = 0; i < zones.length; i++) {
    response.push(createZoneResponse(i + 1, zones[i]));
  };
  res.status(200).json(response).end();
});

zoneRouter.get('/:id(\\d+)', function(req, res) {
  var zoneid = parseInt(req.params.id, 10),
      zoneindex = zoneid - 1;

  if (zoneindex < zones.length) {
    var response = createZoneResponse(zoneid, zones[zoneindex]);
    return res.status(200).json(response).end();
  }

  res.send(404);
});

zoneRouter.delete('/:id(\\d+)', function(req, res) {
  var zoneid = parseInt(req.params.id, 10),
      zoneindex = zoneid - 1;

  if (zoneindex < zones.length) {
    zones.splice(zoneindex, 1);
    return res.status(200).json({ zone: { status: "OK" }}).end();
  }

  res.send(404);
});

zoneRouter.put('/:id(\\d+)', function(req, res) {
  var zoneid = parseInt(req.params.id, 10),
      zoneindex = zoneid - 1;

  if (zoneindex < zones.length) {
    var zone = zones[zoneindex];

    zone.group = req.body.zone.group;
    zones[zoneindex] = zone;

    var response = createZoneResponse(zoneid, zone);
    return res.status(200).json(response).end();
  }

  res.send(404);
});

zoneRouter.get('/:id(\\d+)/records', function(req, res) {
  var zoneid = parseInt(req.params.id, 10),
      zoneindex = zoneid - 1;

  if (zoneindex < zones.length) {
    var zone = zones[zoneindex];

    var response = [];
    for (var i = 0; i < zone.records.length; i++) {
      response.push(createRecordResponse(zoneid, zone, i + 1, zone.records[i]));
    };
    return res.status(200).json(response).end();
  }

  res.send(404);
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
module.exports.reset = reset;