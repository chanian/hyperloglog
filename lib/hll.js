/**
 * HyperLogLog
 *
 * Based on: http://algo.inria.fr/flajolet/Publications/FlFuGaMe07.pdf
 */
var utils       = require('./utils.js');
var murmurhash  = require('murmurhash');

// As per (1)
function leftMostSetBitPosition (binaryString) {
  var position;
  for (position = 0; position < binaryString.length; position++) {
    if (binaryString.charAt(position) === '1') {
      return position + 1;
    }
  }
  return -Infinity;
}

// As per (2)
function calculateIndicator (registers) {
  var sum = 0
    , i;

  for (i = 0; i < registers.length; i++) {
    sum += Math.pow(2, -registers[i]);
  }
  return Math.pow(sum, -1);

}

// "as to correct a systematic multiplicative bias present" (3)
function alphaM (m) {
  if (m <= 64) {
   return ({
    16: 0.673,
    32: 0.697,
    64: 0.709
    })[m];
  } else {
   return 0.7213 / (1 + (1.079 * m));
  }
}

// Set all needed registers to 0
function initializeRegisters(registerBits) {
  var i;
  var registers = [];
  var size = Math.pow(2, registerBits);
  for (i = 0; i < size; i++) {
    registers[i] = 0;
  }
  return registers;
}

function countEmptyRegisters(registers) {
  var i, empty = 0;
  for (i = registers.length - 1; i >= 0; --i) {
    if (registers[i] == 0) {
      empty++;
    }
  }
  return empty;
}

/**
 * Initialize a HyperLogLog sketch
 *
 * (optional) registerBits - how many bits of addressable space to use for registers
 */
function HyperLogLog (registerBits) {
  this.registerBits = registerBits || 6;
  this.registers = initializeRegisters(registerBits);

  // Constants
  this.m = Math.pow(2, this.registerBits);
  this.alpha = alphaM(this.m);
}

/**
 * Accept a set of hashes, and do a batch update
 */
HyperLogLog.prototype.addSet = function (multiset) {
  var i, v, register, w, pw_w;
  // scan each element in the set
  for (i = 0; i < multiset.length; i++) {
    this.process(multiset[i]);
  }
  return this;
};

/**
 * Accept a single hashed item, update internal registers
 */
HyperLogLog.prototype.process = function (item) {
  var hash = murmurhash.v3(item).toString(2);
  while (hash.length != 32) { hash = '0' + hash; }

  // TODO: ensure this is n-bit safe
  var register       = parseInt(hash.substr(0, this.registerBits), 2)
    , w              = hash.substr(this.registerBits, hash.length - this.registerBits)
    , longestPattern = leftMostSetBitPosition(w);

  // update the register
  this.registers[register] = Math.max(this.registers[register], longestPattern);
  return this;
}

/**
 * Merge with anoter HyperLogLog sketch. Does not augment
 * the current sketch, merely returns a new HLL object
 * with the union of the two.
 *
 */
HyperLogLog.prototype.union = function (hll) {
  if (!this.registers || !hll.registers || this.registers.length !== hll.registers.length) {
    throw new Error('Incompatible sketchs for union operation.');
  }

  var union = []
    , registersA = this.registers
    , registersB = hll.registers
    , i
    , unionedHLL;

  for (i = 0; i < this.registers.length; i++) {
    union[i] = Math.max(registersA[i], registersB[i]);
  }

  unionedHLL = new HyperLogLog(this.registerBits);
  unionedHLL.registers = union;
  return unionedHLL;
}

/**
 * Calculate the estimate cardinality based on the current
 * state of the internal registers and based on HyperLogLog.
 *
 */
HyperLogLog.prototype.cardinality = function () {
  var indicator
    , emptyRegisters
    , estimate
    , estimate2;

  // calculate indicator function
  indicator = calculateIndicator(this.registers);

  // As per (3)
  estimate = this.alpha * (Math.pow(this.m, 2)) * indicator;

  // Adjustedments as per (Figure 3)
  countEmptyRegisters(this.registers);
  // small range correction
  if (estimate <= ((5/2) * this.m)) {
    emptyRegisters = countEmptyRegisters(this.registers);
    if (emptyRegisters > 0) {
      estimate2 = this.m * Math.log(this.m / emptyRegisters);
    } else {
      estimate2 = estimate;
    }

  // intermediate range
  } else if (estimate <= ((1/30) * Math.pow(2, 32))) {
    estimate2 = estimate;

  // large range correction
  } else {
    estimate2 = -Math.pow(2, 32) * Math.log(1 - (estimate/ (Math.pow(2, 32))));
  }
  return Math.floor(estimate2);
}

module.exports = HyperLogLog;
