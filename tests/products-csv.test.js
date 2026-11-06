import assert from "node:assert/strict";
import test from "node:test";
import {
  normalizeCsvHeader,
  parseCsvRecords,
  parseProductsCsv,
  PRODUCT_CSV_HEADERS,
  serializeProductsCsv,
} from "../src/lib/products-csv.js";

test("parses quoted fields, escaped quotes, commas, and embedded newlines", () => {
  const records = parseCsvRecords(
    'name,sku,quantity_on_hand,description\r\n' +
      '"Canvas, large",SKU-1,4,"Durable ""everyday"" bag\nwith lining"\r\n',
  );

  assert.deepEqual(records, [
    {
      line: 1,
      fields: ["name", "sku", "quantity_on_hand", "description"],
    },
    {
      line: 2,
      fields: [
        "Canvas, large",
        "SKU-1",
        "4",
        'Durable "everyday" bag\nwith lining',
      ],
    },
  ]);
});

test("skips empty rows and accepts a UTF-8 BOM", () => {
  assert.deepEqual(
    parseCsvRecords("\uFEFFname,sku\r\n\r\nWidget,W-1\r\n").map(
      (record) => record.fields,
    ),
    [
      ["name", "sku"],
      ["Widget", "W-1"],
    ],
  );
});

test("normalizes common product column labels", () => {
  assert.equal(normalizeCsvHeader("Product Name"), "name");
  assert.equal(normalizeCsvHeader("Quantity on Hand"), "quantity_on_hand");
  assert.equal(normalizeCsvHeader("qty"), "quantity_on_hand");
});

test("validates import rows and applies optional fields as null", () => {
  assert.deepEqual(
    parseProductsCsv(
      "Product Name,SKU,Quantity on Hand,Cost Price,Selling Price\n" +
        '"Canvas, large",SKU-1,4,2.50,9.99\n',
    ),
    [
      {
        name: "Canvas, large",
        sku: "SKU-1",
        quantity_on_hand: 4,
        description: null,
        cost_price: 2.5,
        selling_price: 9.99,
        low_stock_threshold: null,
      },
    ],
  );
});

test("imports tab- and semicolon-delimited product files", () => {
  const expected = [
    {
      name: "Canvas bag",
      sku: "SKU-1",
      quantity_on_hand: 4,
      description: null,
      cost_price: null,
      selling_price: null,
      low_stock_threshold: null,
    },
  ];

  assert.deepEqual(
    parseProductsCsv("name\tsku\tquantity_on_hand\nCanvas bag\tSKU-1\t4\n"),
    expected,
  );
  assert.deepEqual(
    parseProductsCsv("name;sku;quantity_on_hand\nCanvas bag;SKU-1;4\n"),
    expected,
  );
});

test("rejects missing headers, invalid rows, and duplicate SKUs before insertion", () => {
  assert.throws(() => parseProductsCsv("name,sku\nWidget,W-1\n"), /missing.*quantity_on_hand/);
  assert.throws(
    () => parseProductsCsv("name,sku,quantity_on_hand\nWidget,W-1,-1\n"),
    /Line 2: Quantity must be 0 or higher/,
  );
  assert.throws(
    () =>
      parseProductsCsv(
        "name,sku,quantity_on_hand\nWidget,W-1,1\nAnother,w-1,2\n",
      ),
    /Line 3: SKU "w-1" appears more than once/,
  );
});

test("rejects malformed quoted fields", () => {
  assert.throws(() => parseCsvRecords('name,sku\n"Widget,W-1'), /Unclosed quoted field/);
  assert.throws(() => parseCsvRecords('name,sku\nWi"dget,W-1'), /Unexpected quote/);
});

test("exports an import-compatible header and protects spreadsheet formulas", () => {
  const csv = serializeProductsCsv([
    {
      name: "=HYPERLINK(\"https://example.invalid\")",
      sku: "+SUM(1,1)",
      quantity_on_hand: 3,
      description: "@import",
      cost_price: null,
      selling_price: 12.5,
      low_stock_threshold: 2,
    },
  ]);

  const records = parseCsvRecords(csv);
  assert.deepEqual(records[0].fields, PRODUCT_CSV_HEADERS);
  assert.equal(records[1].fields[0], `'=HYPERLINK("https://example.invalid")`);
  assert.equal(records[1].fields[1], "'+SUM(1,1)");
  assert.equal(records[1].fields[2], "3");
  assert.equal(records[1].fields[3], "'@import");
  assert.equal(records[1].fields[4], "");
  assert.equal(records[1].fields[5], "12.5");
  assert.equal(records[1].fields[6], "2");
});
