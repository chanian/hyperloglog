HyperLogLog
==============

A simple HyperLogLog implementation for node.

Near-optimal, space efficient, high cardinality approximations for
large data sets and streaming datasets. This implementation relies on
murmur hash, to satisfy the constraint of uniformly mapping arbitrary
data inputs to the 32-bit binary domain. Lasly, I've implemented all
the additional correction heuristics as described in [1].

Example
-------
  ```javascript
  var HyperLogLog = require("hyperloglog");
  var hll = HyperLogLog();

  // Batch
  var myBigDataSet = [ ..... ]; // a large set of hashable items
  console.log(hll.addSet(myBigDataSet).cardinality());

  // Stream
  while(item = stream.next()) {
    hll.process(item);
    console.log(hll.process(item).cardinality());
  }
  ```

References
----------

  * [1] http://algo.inria.fr/flajolet/Publications/FlFuGaMe07.pdf
  * [2] http://www.aggregateknowledge.com/science/blog/hll.html
  * [3] https://github.com/aggregateknowledge/js-hll
