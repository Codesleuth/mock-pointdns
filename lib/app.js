var express = require('express'),
    bodyParser = require('body-parser'),
    util = require('util'),
    debug = require('debug')('mock:pointdns'),
    ZoneRepository = require('../lib/zoneRepository');

var zoneRepo = new ZoneRepository();
var users = [];
var apitoken = null;

function addUser(user) {
  var u = {
    username: user.username,
    password: user.password
  };

  users.push(u);
}

function setApiToken(token) {
  apitoken = token;
}

function reset() {
  zoneRepo.reset();
  users = [];
  apitoken = null;
}


function createZoneResponse(zone) {
  return {
    "zone": {
      "id": zone.id,
      "name": zone.name || "example.com",
      "group": zone.group || "Default Group",
      "user-id": zone["user-id"] || 3,
      "ttl": zone.ttl || 3600 
  }};
}

function createRecordResponse(zone, record) {
  return {
    "zone_record": {
      "id": record.id,
      "name": util.format("%s.%s.", record.name || "site", zone.name),
      "data": record.data || "1.2.3.4",
      "aux": record.aux || null,
      "record_type": record.record_type || "A",
      "redirect_to": record.redirect_to || null,
      "ttl": record.ttl || 3600,
      "zone_id": zone.id || 1
  }};
}

function authenticateUser(username, password) {
  var authenticated = false;

  users.forEach(function (user) {
    if (user.username == username && user.password == password) {
      authenticated = true;
      return true;
    }
  });

  return authenticated;
}

function authenticateToken(token) {
  return apitoken == token;
}

function authModule(req, res, next) {
  var auth = req.headers.authorization;

  if (auth === undefined) {
    if (req.url == '/') {
      return res
        .location('https://sso.copper.io/api/v1/sessions/validate?service=https%3A%2F%2Fpointhq.com%2Fzones')
        .send(302);
    }
    return res.send(404);
  }

  auth = auth.split(' ');
  if (auth.length == 2 && auth[0] == 'Basic') {
    var userpass = new Buffer(auth[1], 'base64').toString().split(':');

    if (userpass.length == 2) {
      if (authenticateToken(userpass[1]) || authenticateUser(userpass[0], userpass[1]))
        return next();
    }
  }

  res.send(403, 'Access denied');
}


var app = express();
var zoneRouter = express.Router();


zoneRouter.use(authModule);

zoneRouter.get('/', function (req, res) {
  var response = [];
  var zones = zoneRepo.getZones();

  for (var i = 0; i < zones.length; i++) {
    response.push(createZoneResponse(zones[i]));
  };
  res.status(200).json(response).end();
});

zoneRouter.get('/:zone_id([0-9]+)', function (req, res) {
  var zone_id = parseInt(req.params.zone_id, 10),
      zone = zoneRepo.getZone(zone_id);

  if (zone == null)
    return res.send(404).end();

  var response = createZoneResponse(zone);
  return res.status(200).json(response).end();
});

zoneRouter.delete('/:zone_id([0-9]+)', function (req, res) {
  var zone_id = parseInt(req.params.zone_id, 10),
      zone = zoneRepo.getZone(zone_id);

  if (zone == null)
    return res.send(404).end();

  zoneRepo.removeZone(zone.id);
  return res.status(200).json({ zone: { status: "OK" }}).end();
});

zoneRouter.put('/:zone_id([0-9]+)', function (req, res) {
  var zone_id = parseInt(req.params.zone_id, 10),
      zone = zoneRepo.getZone(zone_id);

  if (zone == null)
    return res.send(404).end();

  zone.group = req.body.zone.group;
  zoneRepo.updateZone(zone);

  var response = createZoneResponse(zone);
  return res.status(202).json(response).end();
});

zoneRouter.get('/:zone_id([0-9]+)/records', function (req, res) {
  var zone_id = parseInt(req.params.zone_id, 10),
      zone = zoneRepo.getZone(zone_id);

  if (zone == null)
    return res.send(404).end();

  var response = [];
  for (var i = 0; i < zone.records.length; i++) {
    response.push(createRecordResponse(zone, zone.records[i]));
  };
  return res.status(200).json(response).end();
});

zoneRouter.put('/:zone_id([0-9]+)/records/:record_id([0-9]+)', function (req, res) {
  var zone_id = parseInt(req.params.zone_id, 10),
      record_id = parseInt(req.params.record_id, 10);
  
  var zone = zoneRepo.getZone(zone_id);
  if (zone == null)
    return res.send(404).end();

  var record = zoneRepo.getRecord(zone.id, record_id);
  if (record == null)
    return res.send(404).end();

  record.data = req.body.zone_record.data;

  zoneRepo.updateRecord(zone.id, record);

  var response = createRecordResponse(zone, record);
  return res.status(202).json(response).end();
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

module.exports.addZone = function (zone, records) {
  zoneRepo.addZone(zone, records);
};
module.exports.getZone = function (id) {
  return zoneRepo.getZone(id);
};
module.exports.getZones = function () {
  return zoneRepo.getZones();
};
module.exports.getRecord = function (zoneId, recordId) {
  return zoneRepo.getRecord(zoneId, recordId);
};

module.exports.addUser = addUser;
module.exports.setApiToken = setApiToken;
module.exports.reset = reset;