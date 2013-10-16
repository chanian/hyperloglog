var HyperLogLog = require('./lib/hll.js');
var utils       = require('./lib/utils.js');

// Generate a buncha data
var inputSet = [], x;
for (x = 0; x < 10000; x++) {
  inputSet.push(Math.random().toString());
}

for (x = 0 ; x < 10; x++) {
  inputSet = utils.insertDups(inputSet);
}

var registerBits = 6;
var cardinality = utils.cardinality(inputSet);
var hllSketch = new HyperLogLog(registerBits);
var hll;

hllSketch.addSet(inputSet);
hll = hllSketch.cardinality();

var actualErr = Math.floor(10000 * (Math.abs(cardinality - hll) / cardinality)) / 100;
var projectedError = Math.floor(100 * (10.4 / (Math.pow(Math.pow(2, registerBits), 0.5)))) / 100;

console.log("Set Size: ", inputSet.length);
console.log("True cardinality: ", cardinality);
console.log("HyperLogLog: ", hll);
console.log("Projected Error: % %s", projectedError);
console.log("Actual Error: % %s", actualErr);
console.log("Register Size: %s KB", (32 * Math.pow(2, registerBits))/ (8 * 1024));

