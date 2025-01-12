// Copyright 2012 the V8 project authors. All rights reserved.
// Redistribution and use in source and binary forms, with or without
// modification, are permitted provided that the following conditions are
// met:
//
//     * Redistributions of source code must retain the above copyright
//       notice, this list of conditions and the following disclaimer.
//     * Redistributions in binary form must reproduce the above
//       copyright notice, this list of conditions and the following
//       disclaimer in the documentation and/or other materials provided
//       with the distribution.
//     * Neither the name of Google Inc. nor the names of its
//       contributors may be used to endorse or promote products derived
//       from this software without specific prior written permission.
//
// THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
// "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
// LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR
// A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT
// OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
// SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
// LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
// DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
// THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
// (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
// OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.

// Flags: --harmony-collections --harmony-iteration
// Flags: --expose-gc --allow-natives-syntax


// Test valid getter and setter calls on Sets and WeakSets
function TestValidSetCalls(m) {
  assertDoesNotThrow(function () { m.add(new Object) });
  assertDoesNotThrow(function () { m.has(new Object) });
  assertDoesNotThrow(function () { m.delete(new Object) });
}
TestValidSetCalls(new Set);
TestValidSetCalls(new WeakSet);


// Test valid getter and setter calls on Maps and WeakMaps
function TestValidMapCalls(m) {
  assertDoesNotThrow(function () { m.get(new Object) });
  assertDoesNotThrow(function () { m.set(new Object) });
  assertDoesNotThrow(function () { m.has(new Object) });
  assertDoesNotThrow(function () { m.delete(new Object) });
}
TestValidMapCalls(new Map);
TestValidMapCalls(new WeakMap);


// Test invalid getter and setter calls for WeakMap only
function TestInvalidCalls(m) {
  assertThrows(function () { m.get(undefined) }, TypeError);
  assertThrows(function () { m.set(undefined, 0) }, TypeError);
  assertThrows(function () { m.get(null) }, TypeError);
  assertThrows(function () { m.set(null, 0) }, TypeError);
  assertThrows(function () { m.get(0) }, TypeError);
  assertThrows(function () { m.set(0, 0) }, TypeError);
  assertThrows(function () { m.get('a-key') }, TypeError);
  assertThrows(function () { m.set('a-key', 0) }, TypeError);
}
TestInvalidCalls(new WeakMap);


// Test expected behavior for Sets and WeakSets
function TestSet(set, key) {
  assertFalse(set.has(key));
  assertSame(undefined, set.add(key));
  assertTrue(set.has(key));
  assertTrue(set.delete(key));
  assertFalse(set.has(key));
  assertFalse(set.delete(key));
  assertFalse(set.has(key));
}
function TestSetBehavior(set) {
  for (var i = 0; i < 20; i++) {
    TestSet(set, new Object);
    TestSet(set, i);
    TestSet(set, i / 100);
    TestSet(set, 'key-' + i);
  }
  var keys = [ +0, -0, +Infinity, -Infinity, true, false, null, undefined ];
  for (var i = 0; i < keys.length; i++) {
    TestSet(set, keys[i]);
  }
}
TestSetBehavior(new Set);
TestSet(new WeakSet, new Object);


// Test expected mapping behavior for Maps and WeakMaps
function TestMapping(map, key, value) {
  assertSame(undefined, map.set(key, value));
  assertSame(value, map.get(key));
}
function TestMapBehavior1(m) {
  TestMapping(m, new Object, 23);
  TestMapping(m, new Object, 'the-value');
  TestMapping(m, new Object, new Object);
}
TestMapBehavior1(new Map);
TestMapBehavior1(new WeakMap);


// Test expected mapping behavior for Maps only
function TestMapBehavior2(m) {
  for (var i = 0; i < 20; i++) {
    TestMapping(m, i, new Object);
    TestMapping(m, i / 10, new Object);
    TestMapping(m, 'key-' + i, new Object);
  }
  var keys = [ +0, -0, +Infinity, -Infinity, true, false, null, undefined ];
  for (var i = 0; i < keys.length; i++) {
    TestMapping(m, keys[i], new Object);
  }
}
TestMapBehavior2(new Map);


// Test expected querying behavior of Maps and WeakMaps
function TestQuery(m) {
  var key = new Object;
  var values = [ 'x', 0, +Infinity, -Infinity, true, false, null, undefined ];
  for (var i = 0; i < values.length; i++) {
    TestMapping(m, key, values[i]);
    assertTrue(m.has(key));
    assertFalse(m.has(new Object));
  }
}
TestQuery(new Map);
TestQuery(new WeakMap);


// Test expected deletion behavior of Maps and WeakMaps
function TestDelete(m) {
  var key = new Object;
  TestMapping(m, key, 'to-be-deleted');
  assertTrue(m.delete(key));
  assertFalse(m.delete(key));
  assertFalse(m.delete(new Object));
  assertSame(m.get(key), undefined);
}
TestDelete(new Map);
TestDelete(new WeakMap);


// Test GC of Maps and WeakMaps with entry
function TestGC1(m) {
  var key = new Object;
  m.set(key, 'not-collected');
  gc();
  assertSame('not-collected', m.get(key));
}
TestGC1(new Map);
TestGC1(new WeakMap);


// Test GC of Maps and WeakMaps with chained entries
function TestGC2(m) {
  var head = new Object;
  for (key = head, i = 0; i < 10; i++, key = m.get(key)) {
    m.set(key, new Object);
  }
  gc();
  var count = 0;
  for (key = head; key != undefined; key = m.get(key)) {
    count++;
  }
  assertEquals(11, count);
}
TestGC2(new Map);
TestGC2(new WeakMap);


// Test property attribute [[Enumerable]]
function TestEnumerable(func) {
  function props(x) {
    var array = [];
    for (var p in x) array.push(p);
    return array.sort();
  }
  assertArrayEquals([], props(func));
  assertArrayEquals([], props(func.prototype));
  assertArrayEquals([], props(new func()));
}
TestEnumerable(Set);
TestEnumerable(Map);
TestEnumerable(WeakMap);
TestEnumerable(WeakSet);


// Test arbitrary properties on Maps and WeakMaps
function TestArbitrary(m) {
  function TestProperty(map, property, value) {
    map[property] = value;
    assertEquals(value, map[property]);
  }
  for (var i = 0; i < 20; i++) {
    TestProperty(m, i, 'val' + i);
    TestProperty(m, 'foo' + i, 'bar' + i);
  }
  TestMapping(m, new Object, 'foobar');
}
TestArbitrary(new Map);
TestArbitrary(new WeakMap);


// Test direct constructor call
assertThrows(function() { Set(); }, TypeError);
assertThrows(function() { Map(); }, TypeError);
assertThrows(function() { WeakMap(); }, TypeError);
assertThrows(function() { WeakSet(); }, TypeError);


// Test whether NaN values as keys are treated correctly.
var s = new Set;
assertFalse(s.has(NaN));
assertFalse(s.has(NaN + 1));
assertFalse(s.has(23));
s.add(NaN);
assertTrue(s.has(NaN));
assertTrue(s.has(NaN + 1));
assertFalse(s.has(23));
var m = new Map;
assertFalse(m.has(NaN));
assertFalse(m.has(NaN + 1));
assertFalse(m.has(23));
m.set(NaN, 'a-value');
assertTrue(m.has(NaN));
assertTrue(m.has(NaN + 1));
assertFalse(m.has(23));


// Test some common JavaScript idioms for Sets
var s = new Set;
assertTrue(s instanceof Set);
assertTrue(Set.prototype.add instanceof Function)
assertTrue(Set.prototype.has instanceof Function)
assertTrue(Set.prototype.delete instanceof Function)
assertTrue(Set.prototype.clear instanceof Function)


// Test some common JavaScript idioms for Maps
var m = new Map;
assertTrue(m instanceof Map);
assertTrue(Map.prototype.set instanceof Function)
assertTrue(Map.prototype.get instanceof Function)
assertTrue(Map.prototype.has instanceof Function)
assertTrue(Map.prototype.delete instanceof Function)
assertTrue(Map.prototype.clear instanceof Function)


// Test some common JavaScript idioms for WeakMaps
var m = new WeakMap;
assertTrue(m instanceof WeakMap);
assertTrue(WeakMap.prototype.set instanceof Function)
assertTrue(WeakMap.prototype.get instanceof Function)
assertTrue(WeakMap.prototype.has instanceof Function)
assertTrue(WeakMap.prototype.delete instanceof Function)
assertTrue(WeakMap.prototype.clear instanceof Function)


// Test some common JavaScript idioms for WeakSets
var s = new WeakSet;
assertTrue(s instanceof WeakSet);
assertTrue(WeakSet.prototype.add instanceof Function)
assertTrue(WeakSet.prototype.has instanceof Function)
assertTrue(WeakSet.prototype.delete instanceof Function)
assertTrue(WeakSet.prototype.clear instanceof Function)


// Test class of instance and prototype.
assertEquals("Set", %_ClassOf(new Set))
assertEquals("Object", %_ClassOf(Set.prototype))
assertEquals("Map", %_ClassOf(new Map))
assertEquals("Object", %_ClassOf(Map.prototype))
assertEquals("WeakMap", %_ClassOf(new WeakMap))
assertEquals("Object", %_ClassOf(WeakMap.prototype))
assertEquals("WeakSet", %_ClassOf(new WeakSet))
assertEquals("Object", %_ClassOf(WeakMap.prototype))


// Test name of constructor.
assertEquals("Set", Set.name);
assertEquals("Map", Map.name);
assertEquals("WeakMap", WeakMap.name);
assertEquals("WeakSet", WeakSet.name);


// Test prototype property of Set, Map, WeakMap and WeakSet.
// TODO(2793): Should all be non-writable, and the extra flag removed.
function TestPrototype(C, writable) {
  assertTrue(C.prototype instanceof Object);
  assertEquals({
    value: {},
    writable: writable,
    enumerable: false,
    configurable: false
  }, Object.getOwnPropertyDescriptor(C, "prototype"));
}
TestPrototype(Set, true);
TestPrototype(Map, true);
TestPrototype(WeakMap, false);
TestPrototype(WeakSet, false);


// Test constructor property of the Set, Map, WeakMap and WeakSet prototype.
function TestConstructor(C) {
  assertFalse(C === Object.prototype.constructor);
  assertSame(C, C.prototype.constructor);
  assertSame(C, (new C).__proto__.constructor);
}
TestConstructor(Set);
TestConstructor(Map);
TestConstructor(WeakMap);
TestConstructor(WeakSet);


// Test the Set, Map, WeakMap and WeakSet global properties themselves.
function TestDescriptor(global, C) {
  assertEquals({
    value: C,
    writable: true,
    enumerable: false,
    configurable: true
  }, Object.getOwnPropertyDescriptor(global, C.name));
}
TestDescriptor(this, Set);
TestDescriptor(this, Map);
TestDescriptor(this, WeakMap);
TestDescriptor(this, WeakSet);


// Regression test for WeakMap prototype.
assertTrue(WeakMap.prototype.constructor === WeakMap)
assertTrue(Object.getPrototypeOf(WeakMap.prototype) === Object.prototype)


// Regression test for issue 1617: The prototype of the WeakMap constructor
// needs to be unique (i.e. different from the one of the Object constructor).
assertFalse(WeakMap.prototype === Object.prototype);
var o = Object.create({});
assertFalse("get" in o);
assertFalse("set" in o);
assertEquals(undefined, o.get);
assertEquals(undefined, o.set);
var o = Object.create({}, { myValue: {
  value: 10,
  enumerable: false,
  configurable: true,
  writable: true
}});
assertEquals(10, o.myValue);


// Regression test for issue 1884: Invoking any of the methods for Harmony
// maps, sets, or weak maps, with a wrong type of receiver should be throwing
// a proper TypeError.
var alwaysBogus = [ undefined, null, true, "x", 23, {} ];
var bogusReceiversTestSet = [
  { proto: Set.prototype,
    funcs: [ 'add', 'has', 'delete' ],
    receivers: alwaysBogus.concat([ new Map, new WeakMap, new WeakSet ]),
  },
  { proto: Map.prototype,
    funcs: [ 'get', 'set', 'has', 'delete' ],
    receivers: alwaysBogus.concat([ new Set, new WeakMap, new WeakSet ]),
  },
  { proto: WeakMap.prototype,
    funcs: [ 'get', 'set', 'has', 'delete' ],
    receivers: alwaysBogus.concat([ new Set, new Map, new WeakSet ]),
  },
  { proto: WeakSet.prototype,
    funcs: [ 'add', 'has', 'delete' ],
    receivers: alwaysBogus.concat([ new Set, new Map, new WeakMap ]),
  },
];
function TestBogusReceivers(testSet) {
  for (var i = 0; i < testSet.length; i++) {
    var proto = testSet[i].proto;
    var funcs = testSet[i].funcs;
    var receivers = testSet[i].receivers;
    for (var j = 0; j < funcs.length; j++) {
      var func = proto[funcs[j]];
      for (var k = 0; k < receivers.length; k++) {
        assertThrows(function () { func.call(receivers[k], {}) }, TypeError);
      }
    }
  }
}
TestBogusReceivers(bogusReceiversTestSet);


// Stress Test
// There is a proposed stress-test available at the es-discuss mailing list
// which cannot be reasonably automated.  Check it out by hand if you like:
// https://mail.mozilla.org/pipermail/es-discuss/2011-May/014096.html


// Set and Map size getters
var setSizeDescriptor = Object.getOwnPropertyDescriptor(Set.prototype, 'size');
assertEquals(undefined, setSizeDescriptor.value);
assertEquals(undefined, setSizeDescriptor.set);
assertTrue(setSizeDescriptor.get instanceof Function);
assertEquals(undefined, setSizeDescriptor.get.prototype);
assertFalse(setSizeDescriptor.enumerable);
assertTrue(setSizeDescriptor.configurable);

var s = new Set();
assertFalse(s.hasOwnProperty('size'));
for (var i = 0; i < 10; i++) {
  assertEquals(i, s.size);
  s.add(i);
}
for (var i = 9; i >= 0; i--) {
  s.delete(i);
  assertEquals(i, s.size);
}


var mapSizeDescriptor = Object.getOwnPropertyDescriptor(Map.prototype, 'size');
assertEquals(undefined, mapSizeDescriptor.value);
assertEquals(undefined, mapSizeDescriptor.set);
assertTrue(mapSizeDescriptor.get instanceof Function);
assertEquals(undefined, mapSizeDescriptor.get.prototype);
assertFalse(mapSizeDescriptor.enumerable);
assertTrue(mapSizeDescriptor.configurable);

var m = new Map();
assertFalse(m.hasOwnProperty('size'));
for (var i = 0; i < 10; i++) {
  assertEquals(i, m.size);
  m.set(i, i);
}
for (var i = 9; i >= 0; i--) {
  m.delete(i);
  assertEquals(i, m.size);
}


// Test Set clear
(function() {
  var s = new Set();
  s.add(42);
  assertTrue(s.has(42));
  assertEquals(1, s.size);
  s.clear();
  assertFalse(s.has(42));
  assertEquals(0, s.size);
})();


// Test Map clear
(function() {
  var m = new Map();
  m.set(42, true);
  assertTrue(m.has(42));
  assertEquals(1, m.size);
  m.clear();
  assertFalse(m.has(42));
  assertEquals(0, m.size);
})();


// Test WeakMap clear
(function() {
  var k = new Object();
  var w = new WeakMap();
  w.set(k, 23);
  assertTrue(w.has(k));
  assertEquals(23, w.get(k));
  w.clear();
  assertFalse(w.has(k));
  assertEquals(undefined, w.get(k));
})();


// Test WeakSet clear
(function() {
  var k = new Object();
  var w = new WeakSet();
  w.add(k);
  assertTrue(w.has(k));
  w.clear();
  assertFalse(w.has(k));
})();


(function TestMinusZeroSet() {
  var m = new Set();
  m.add(0);
  m.add(-0);
  assertEquals(1, m.size);
  assertTrue(m.has(0));
  assertTrue(m.has(-0));
})();


(function TestMinusZeroMap() {
  var m = new Map();
  m.set(0, 'plus');
  m.set(-0, 'minus');
  assertEquals(1, m.size);
  assertTrue(m.has(0));
  assertTrue(m.has(-0));
  assertEquals('minus', m.get(0));
  assertEquals('minus', m.get(-0));
})();


(function TestSetForEachInvalidTypes() {
  assertThrows(function() {
    Set.prototype.set.forEach.call({});
  }, TypeError);

  var set = new Set();
  assertThrows(function() {
    set.forEach({});
  }, TypeError);
})();


(function TestSetForEach() {
  var set = new Set();
  set.add('a');
  set.add('b');
  set.add('c');

  var buffer = '';
  var receiver = {};
  set.forEach(function(v, k, s) {
    assertSame(v, k);
    assertSame(set, s);
    assertSame(this, receiver);
    buffer += v;
    if (v === 'a') {
      set.delete('b');
      set.add('d');
      set.add('e');
      set.add('f');
    } else if (v === 'c') {
      set.add('b');
      set.delete('e');
    }
  }, receiver);

  assertEquals('acdfb', buffer);
})();


(function TestSetForEachAddAtEnd() {
  var set = new Set();
  set.add('a');
  set.add('b');

  var buffer = '';
  set.forEach(function(v) {
    buffer += v;
    if (v === 'b') {
      set.add('c');
    }
  });

  assertEquals('abc', buffer);
})();


(function TestSetForEachDeleteNext() {
  var set = new Set();
  set.add('a');
  set.add('b');
  set.add('c');

  var buffer = '';
  set.forEach(function(v) {
    buffer += v;
    if (v === 'b') {
      set.delete('c');
    }
  });

  assertEquals('ab', buffer);
})();


(function TestSetForEachDeleteVisitedAndAddAgain() {
  var set = new Set();
  set.add('a');
  set.add('b');
  set.add('c');

  var buffer = '';
  set.forEach(function(v) {
    buffer += v;
    if (v === 'b') {
      set.delete('a');
    } else if (v === 'c') {
      set.add('a');
    }
  });

  assertEquals('abca', buffer);
})();


(function TestSetForEachClear() {
  var set = new Set();
  set.add('a');
  set.add('b');
  set.add('c');

  var buffer = '';
  set.forEach(function(v) {
    buffer += v;
    if (v === 'a') {
      set.clear();
      set.add('d');
      set.add('e');
    }
  });

  assertEquals('ade', buffer);
})();


(function TestSetForEachNested() {
  var set = new Set();
  set.add('a');
  set.add('b');
  set.add('c');

  var buffer = '';
  set.forEach(function(v) {
    buffer += v;
    set.forEach(function(v) {
      buffer += v;
      if (v === 'a') {
        set.delete('b');
      }
    });
  });

  assertEquals('aaccac', buffer);
})();


(function TestSetForEachEarlyExit() {
  var set = new Set();
  set.add('a');
  set.add('b');
  set.add('c');

  var buffer = '';
  var ex = {};
  try {
    set.forEach(function(v) {
      buffer += v;
      throw ex;
    });
  } catch (e) {
    assertEquals(ex, e);
  }
  assertEquals('a', buffer);
})();


(function TestSetForEachGC() {
  var set = new Set();
  for (var i = 0; i < 100; i++) {
    set.add(i);
  }

  var accumulated = 0;
  set.forEach(function(v) {
    accumulated += v;
    if (v % 10 === 0) {
      gc();
    }
  });
  assertEquals(4950, accumulated);
})();

(function TestMapForEachInvalidTypes() {
  assertThrows(function() {
    Map.prototype.map.forEach.call({});
  }, TypeError);

  var map = new Map();
  assertThrows(function() {
    map.forEach({});
  }, TypeError);
})();


(function TestMapForEach() {
  var map = new Map();
  map.set(0, 'a');
  map.set(1, 'b');
  map.set(2, 'c');

  var buffer = [];
  var receiver = {};
  map.forEach(function(v, k, m) {
    assertEquals(map, m);
    assertEquals(this, receiver);
    buffer.push(k, v);
    if (k === 0) {
      map.delete(1);
      map.set(3, 'd');
      map.set(4, 'e');
      map.set(5, 'f');
    } else if (k === 2) {
      map.set(1, 'B');
      map.delete(4);
    }
  }, receiver);

  assertArrayEquals([0, 'a', 2, 'c', 3, 'd', 5, 'f', 1, 'B'], buffer);
})();


(function TestMapForEachAddAtEnd() {
  var map = new Map();
  map.set(0, 'a');
  map.set(1, 'b');

  var buffer = [];
  map.forEach(function(v, k) {
    buffer.push(k, v);
    if (k === 1) {
      map.set(2, 'c');
    }
  });

  assertArrayEquals([0, 'a', 1, 'b', 2, 'c'], buffer);
})();


(function TestMapForEachDeleteNext() {
  var map = new Map();
  map.set(0, 'a');
  map.set(1, 'b');
  map.set(2, 'c');

  var buffer = [];
  map.forEach(function(v, k) {
    buffer.push(k, v);
    if (k === 1) {
      map.delete(2);
    }
  });

  assertArrayEquals([0, 'a', 1, 'b'], buffer);
})();


(function TestSetForEachDeleteVisitedAndAddAgain() {
  var map = new Map();
  map.set(0, 'a');
  map.set(1, 'b');
  map.set(2, 'c');

  var buffer = [];
  map.forEach(function(v, k) {
    buffer.push(k, v);
    if (k === 1) {
      map.delete(0);
    } else if (k === 2) {
      map.set(0, 'a');
    }
  });

  assertArrayEquals([0, 'a', 1, 'b', 2, 'c', 0, 'a'], buffer);
})();


(function TestMapForEachClear() {
  var map = new Map();
  map.set(0, 'a');
  map.set(1, 'b');
  map.set(2, 'c');

  var buffer = [];
  map.forEach(function(v, k) {
    buffer.push(k, v);
    if (k === 0) {
      map.clear();
      map.set(3, 'd');
      map.set(4, 'e');
    }
  });

  assertArrayEquals([0, 'a', 3, 'd', 4, 'e'], buffer);
})();


(function TestMapForEachNested() {
  var map = new Map();
  map.set(0, 'a');
  map.set(1, 'b');
  map.set(2, 'c');

  var buffer = [];
  map.forEach(function(v, k) {
    buffer.push(k, v);
    map.forEach(function(v, k) {
      buffer.push(k, v);
      if (k === 0) {
        map.delete(1);
      }
    });
  });

  assertArrayEquals([0, 'a', 0, 'a', 2, 'c', 2, 'c', 0, 'a', 2, 'c'], buffer);
})();


(function TestMapForEachEarlyExit() {
  var map = new Map();
  map.set(0, 'a');
  map.set(1, 'b');
  map.set(2, 'c');

  var buffer = [];
  var ex = {};
  try {
    map.forEach(function(v, k) {
      buffer.push(k, v);
      throw ex;
    });
  } catch (e) {
    assertEquals(ex, e);
  }
  assertArrayEquals([0, 'a'], buffer);
})();


(function TestMapForEachGC() {
  var map = new Map();
  for (var i = 0; i < 100; i++) {
    map.set(i, i);
  }

  var accumulated = 0;
  map.forEach(function(v) {
    accumulated += v;
    if (v % 10 === 0) {
      gc();
    }
  });
  assertEquals(4950, accumulated);
})();


(function TestMapForEachAllRemovedTransition() {
  var map = new Map;
  map.set(0, 0);

  var buffer = [];
  map.forEach(function(v) {
    buffer.push(v);
    if (v === 0) {
      for (var i = 1; i < 4; i++) {
        map.set(i, i);
      }
    }

    if (v === 3) {
      for (var i = 0; i < 4; i++) {
        map.delete(i);
      }
      for (var i = 4; i < 8; i++) {
        map.set(i, i);
      }
    }
  });

  assertArrayEquals([0, 1, 2, 3, 4, 5, 6, 7], buffer);
})();


(function TestMapForEachClearTransition() {
  var map = new Map;
  map.set(0, 0);

  var i = 0;
  var buffer = [];
  map.forEach(function(v) {
    buffer.push(v);
    if (++i < 5) {
      for (var j = 0; j < 5; j++) {
        map.clear();
        map.set(i, i);
      }
    }
  });

  assertArrayEquals([0, 1, 2, 3, 4], buffer);
})();


(function TestMapForEachNestedNonTrivialTransition() {
  var map = new Map;
  map.set(0, 0);
  map.set(1, 1);
  map.set(2, 2);
  map.set(3, 3);
  map.delete(0);

  var i = 0;
  var buffer = [];
  map.forEach(function(v) {
    if (++i > 10) return;

    buffer.push(v);

    if (v == 3) {
      map.delete(1);
      for (var j = 4; j < 10; j++) {
        map.set(j, j);
      }
      for (var j = 4; j < 10; j += 2) {
        map.delete(j);
      }
      map.delete(2);

      for (var j = 10; j < 20; j++) {
        map.set(j, j);
      }
      for (var j = 10; j < 20; j += 2) {
        map.delete(j);
      }

      map.delete(3);
    }
  });

  assertArrayEquals([1, 2, 3, 5, 7, 9, 11, 13, 15, 17], buffer);
})();


(function TestMapForEachAllRemovedTransitionNoClear() {
  var map = new Map;
  map.set(0, 0);

  var buffer = [];
  map.forEach(function(v) {
    buffer.push(v);
    if (v === 0) {
      for (var i = 1; i < 8; i++) {
        map.set(i, i);
      }
    }

    if (v === 4) {
      for (var i = 0; i < 8; i++) {
        map.delete(i);
      }
    }
  });

  assertArrayEquals([0, 1, 2, 3, 4], buffer);
})();


(function TestMapForEachNoMoreElementsAfterTransition() {
  var map = new Map;
  map.set(0, 0);

  var buffer = [];
  map.forEach(function(v) {
    buffer.push(v);
    if (v === 0) {
      for (var i = 1; i < 16; i++) {
        map.set(i, i);
      }
    }

    if (v === 4) {
      for (var i = 5; i < 16; i++) {
        map.delete(i);
      }
    }
  });

  assertArrayEquals([0, 1, 2, 3, 4], buffer);
})();


(function TestSetConstructor() {
  var s = new Set(null);
  assertEquals(s.size, 0);

  s = new Set(undefined);
  assertEquals(s.size, 0);

  // No @@iterator
  assertThrows(function() {
    new Set({});
  }, TypeError);

  // @@iterator not callable
  assertThrows(function() {
    var object = {};
    object[Symbol.iterator] = 42;
    new Set(object);
  }, TypeError);

  // @@iterator result not object
  assertThrows(function() {
    var object = {};
    object[Symbol.iterator] = function() {
      return 42;
    };
    new Set(object);
  }, TypeError);

  var s2 = new Set();
  s2.add('a');
  s2.add('b');
  s2.add('c');
  s = new Set(s2.values());
  assertEquals(s.size, 3);
  assertTrue(s.has('a'));
  assertTrue(s.has('b'));
  assertTrue(s.has('c'));
})();


(function TestSetConstructorAddNotCallable() {
  var originalSetPrototypeAdd = Set.prototype.add;
  assertThrows(function() {
    Set.prototype.add = 42;
    new Set([1, 2].values());
  }, TypeError);
  Set.prototype.add = originalSetPrototypeAdd;
})();


(function TestSetConstructorGetAddOnce() {
  var originalSetPrototypeAdd = Set.prototype.add;
  var getAddCount = 0;
  Object.defineProperty(Set.prototype, 'add', {
    get: function() {
      getAddCount++;
      return function() {};
    }
  });
  var s = new Set([1, 2].values());
  assertEquals(getAddCount, 1);
  assertEquals(s.size, 0);
  Object.defineProperty(Set.prototype, 'add', {
    value: originalSetPrototypeAdd,
    writable: true
  });
})();


(function TestSetConstructorAddReplaced() {
  var originalSetPrototypeAdd = Set.prototype.add;
  var addCount = 0;
  Set.prototype.add = function(value) {
    addCount++;
    originalSetPrototypeAdd.call(this, value);
    Set.prototype.add = null;
  };
  var s = new Set([1, 2].values());
  assertEquals(addCount, 2);
  assertEquals(s.size, 2);
  Set.prototype.add = originalSetPrototypeAdd;
})();


(function TestSetConstructorOrderOfDoneValue() {
  var valueCount = 0, doneCount = 0;
  var iterator = {
    next: function() {
      return {
        get value() {
          valueCount++;
        },
        get done() {
          doneCount++;
          throw new Error();
        }
      };
    }
  };
  iterator[Symbol.iterator] = function() {
    return this;
  };
  assertThrows(function() {
    new Set(iterator);
  });
  assertEquals(doneCount, 1);
  assertEquals(valueCount, 0);
})();


(function TestSetConstructorNextNotAnObject() {
  var iterator = {
    next: function() {
      return 'abc';
    }
  };
  iterator[Symbol.iterator] = function() {
    return this;
  };
  assertThrows(function() {
    new Set(iterator);
  }, TypeError);
})();


(function TestMapConstructor() {
  var m = new Map(null);
  assertEquals(m.size, 0);

  m = new Map(undefined);
  assertEquals(m.size, 0);

  // No @@iterator
  assertThrows(function() {
    new Map({});
  }, TypeError);

  // @@iterator not callable
  assertThrows(function() {
    var object = {};
    object[Symbol.iterator] = 42;
    new Map(object);
  }, TypeError);

  // @@iterator result not object
  assertThrows(function() {
    var object = {};
    object[Symbol.iterator] = function() {
      return 42;
    };
    new Map(object);
  }, TypeError);

  var m2 = new Map();
  m2.set(0, 'a');
  m2.set(1, 'b');
  m2.set(2, 'c');
  m = new Map(m2.entries());
  assertEquals(m.size, 3);
  assertEquals(m.get(0), 'a');
  assertEquals(m.get(1), 'b');
  assertEquals(m.get(2), 'c');
})();


(function TestMapConstructorSetNotCallable() {
  var originalMapPrototypeSet = Map.prototype.set;
  assertThrows(function() {
    Map.prototype.set = 42;
    new Map([1, 2].entries());
  }, TypeError);
  Map.prototype.set = originalMapPrototypeSet;
})();


(function TestMapConstructorGetAddOnce() {
  var originalMapPrototypeSet = Map.prototype.set;
  var getSetCount = 0;
  Object.defineProperty(Map.prototype, 'set', {
    get: function() {
      getSetCount++;
      return function() {};
    }
  });
  var m = new Map([1, 2].entries());
  assertEquals(getSetCount, 1);
  assertEquals(m.size, 0);
  Object.defineProperty(Map.prototype, 'set', {
    value: originalMapPrototypeSet,
    writable: true
  });
})();


(function TestMapConstructorSetReplaced() {
  var originalMapPrototypeSet = Map.prototype.set;
  var setCount = 0;
  Map.prototype.set = function(key, value) {
    setCount++;
    originalMapPrototypeSet.call(this, key, value);
    Map.prototype.set = null;
  };
  var m = new Map([1, 2].entries());
  assertEquals(setCount, 2);
  assertEquals(m.size, 2);
  Map.prototype.set = originalMapPrototypeSet;
})();


(function TestMapConstructorOrderOfDoneValue() {
  var valueCount = 0, doneCount = 0;
  function FakeError() {}
  var iterator = {
    next: function() {
      return {
        get value() {
          valueCount++;
        },
        get done() {
          doneCount++;
          throw new FakeError();
        }
      };
    }
  };
  iterator[Symbol.iterator] = function() {
    return this;
  };
  assertThrows(function() {
    new Map(iterator);
  }, FakeError);
  assertEquals(doneCount, 1);
  assertEquals(valueCount, 0);
})();


(function TestMapConstructorNextNotAnObject() {
  var iterator = {
    next: function() {
      return 'abc';
    }
  };
  iterator[Symbol.iterator] = function() {
    return this;
  };
  assertThrows(function() {
    new Map(iterator);
  }, TypeError);
})();


(function TestMapConstructorIteratorNotObjectValues() {
  assertThrows(function() {
    new Map([1, 2].values());
  }, TypeError);
})();
