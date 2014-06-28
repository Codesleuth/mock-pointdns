// See: https://gist.github.com/jed/982883
function uuid(a){return a?(a^Math.random()*16>>a/4).toString(16):([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g,uuid)}

var randomNumber = exports.number = function (min, max) {
  min = min || 0;
  max = max || Number.MAX_VALUE - 1;
  return Math.random() * (max - min + 1) + min;
}

var randomInteger = exports.integer = function (min, max) {
  min = min || 0;
  max = max || 4294967296;
  return Math.floor(randomNumber(min, max));
}

var randomIpAddress = exports.ipAddress = function () {
  return randomInteger(1, 254) + '.' 
    + randomInteger(0, 254) + '.' 
    + randomInteger(0, 254) + '.' 
    + randomInteger(0, 254);
}

var randomChar = exports.char = function (min, max) {
  min = min || 'a';
  max = max || 'z';
  var n = randomInteger(min.charCodeAt(0), max.charCodeAt(0));
  return String.fromCharCode(n);
}

var randomString = exports.string = function (length, min, max) {
  length = length || 50;
  var result = "";
  for (var i = 0; i < length; i++) {
    result += randomChar(min, max);
  };
  return result;
}

var randomChoice = exports.choice = function () {
  var args = Array.prototype.slice.call(arguments);
  return args[randomInteger(0, args.length - 1)];
}

var randomRecordType = exports.recordType = function () {
  return randomChoice('A', 'CNAME', 'MX', 'TXT', 'NS', 'SRV', 'AAAA', 'SSHFP', 'PTR', 'ALIAS');
}

var randomZone = exports.zone = function () {
  return {
    "id": randomInteger(1),
    "name": randomString(10) + '.' + randomChoice('com', 'co', 'co.uk'),
    "group": randomString(),
    "user-id": randomInteger(),
    "ttl": randomInteger()
  }
}

var randomRecord = exports.record = function () {
  return {
    "id": randomInteger(1),
    "name": randomString(10),
    "data": randomIpAddress(),
    "aux": randomString(),
    "record_type": randomRecordType(),
    "redirect_to": randomString(),
    "ttl": random.number()
  }
}

var randomUser = exports.user = function () {
  return {
    username: randomString(20),
    password: randomString(50)
  }
}

var randomUuid = exports.uuid = function () {
  return uuid();
}