'use strict';

var test = require('node:test');
var assert = require('node:assert/strict');
var invoice = require('../lib/invoice');
var pricing = require('../lib/pricing');

test('invoice GST breakdown and total match the amounts billed for HSN items and a coupon', function () {
  // In-memory copy of the shape saved by the order route; no database access.
  var items = [
    { id: 1, name: 'Rice', sku: 'RICE', hsn: '1006', price: 640, qty: 1 },
    { id: 4, name: 'Sunflower oil', sku: 'OIL', hsn: '1512', price: 190, qty: 2 }
  ];
  var billed = pricing.computeTotals(items, 'SAVE10');
  var order = {
    id: 102,
    items: items,
    coupon: 'SAVE10',
    subtotal: billed.subtotal,
    discount: billed.discount,
    tax: billed.tax,
    total: billed.total
  };

  var figures = invoice.computeInvoiceFigures(order);

  assert.equal(figures.subtotal, billed.subtotal);
  assert.equal(figures.discount, billed.discount);
  assert.equal(figures.tax, billed.tax);
  assert.equal(figures.cgst, billed.cgst);
  assert.equal(figures.sgst, billed.sgst);
  assert.equal(figures.total, order.total);
  assert.deepEqual(figures.rows.map(function (row) {
    return { gstPercent: row.gstPercent, line: row.line, lineTax: row.lineTax };
  }), billed.lines.map(function (line) {
    return { gstPercent: line.gstPercent, line: line.gross, lineTax: line.tax };
  }));
});

test('invoice rendering shows the saved billed total without a reconciliation warning', function () {
  var items = [{ id: 1, name: 'Rice', sku: 'RICE', hsn: '1006', price: 100, qty: 1 }];
  var billed = pricing.computeTotals(items, '');
  var html = invoice.render({
    id: 103,
    date: '2026-11-21',
    items: items,
    coupon: '',
    subtotal: billed.subtotal,
    discount: billed.discount,
    tax: billed.tax,
    total: billed.total
  });

  assert.match(html, /Invoice Total<\/td><td class="r">₹105\.00/);
  assert.doesNotMatch(html, /Accountant Reconciliation Notice/);
});
