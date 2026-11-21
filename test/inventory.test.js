'use strict';

var test = require('node:test');
var assert = require('node:assert/strict');
var inventory = require('../lib/inventory');

test('inventory allows an order to consume all unreserved sellable stock', function () {
  var products = [{ id: 1, name: 'Widget', stock: 5, reserved: 2 }];

  assert.deepEqual(inventory.check(products, [{ id: 1, qty: 3 }]), { ok: true });
});

test('inventory check counts duplicate product lines before approving the order', function () {
  var products = [{ id: 1, name: 'Widget', stock: 5, reserved: 1 }];

  assert.equal(inventory.check(products, [
    { id: 1, qty: 3 },
    { id: 1, qty: 2 }
  ]).ok, false);
});

test('inventory cancellation release restores physical stock and keeps wholesale holds', function () {
  var products = [{ id: 1, name: 'Widget', stock: 2, reserved: 1 }];

  inventory.release(products, [{ id: 1, qty: 3 }]);

  assert.equal(products[0].stock, 5);
  assert.equal(products[0].reserved, 1);
});
