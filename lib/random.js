var randomNumber = exports.number = function (min, max) {
  min = min || 0;
  max = max || Math.pow(2, 32);
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

var randomIpAddress = exports.ipAddress = function () {
  return randomNumber(1, 254) + '.' 
    + randomNumber(0, 254) + '.' 
    + randomNumber(0, 254) + '.' 
    + randomNumber(0, 254);
}

var randomChar = exports.char = function (min, max) {
  min = min || 'a';
  max = max || 'z';
  var n = randomNumber(min.charCodeAt(0), max.charCodeAt(0));
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
  return args[randomNumber(0, args.length - 1)];
}