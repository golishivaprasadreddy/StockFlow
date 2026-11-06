import { productSchema } from "./product-validation.js";

export const PRODUCT_CSV_MAX_BYTES = 2 * 1024 * 1024;
export const PRODUCT_CSV_MAX_ROWS = 5000;

export const PRODUCT_CSV_HEADERS = [
  "name",
  "sku",
  "quantity_on_hand",
  "description",
  "cost_price",
  "selling_price",
  "low_stock_threshold",
];

const HEADER_ALIASES = new Map([
  ["product_name", "name"],
  ["quantity", "quantity_on_hand"],
  ["qty", "quantity_on_hand"],
  ["qty_on_hand", "quantity_on_hand"],
]);

export function normalizeCsvHeader(value) {
  const normalized = value
    .replace(/^\uFEFF/, "")
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");

  return HEADER_ALIASES.get(normalized) ?? normalized;
}

function detectCsvDelimiter(text) {
  const counts = new Map([
    [",", 0],
    [";", 0],
    ["\t", 0],
  ]);
  let quoted = false;

  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];

    if (character === '"') {
      if (quoted && text[index + 1] === '"') {
        index += 1;
      } else {
        quoted = !quoted;
      }
    } else if (!quoted && (character === "\r" || character === "\n")) {
      break;
    } else if (!quoted && counts.has(character)) {
      counts.set(character, counts.get(character) + 1);
    }
  }

  return [...counts].reduce(
    (best, current) => (current[1] > best[1] ? current : best),
    [",", 0],
  )[0];
}

export function parseCsvRecords(input) {
  if (typeof input !== "string" || input.length === 0) {
    throw new Error("The CSV file is empty.");
  }

  const text = input.charCodeAt(0) === 0xfeff ? input.slice(1) : input;
  const delimiter = detectCsvDelimiter(text);
  const records = [];
  let fields = [];
  let field = "";
  let quoted = false;
  let afterQuote = false;
  let line = 1;
  let recordLine = 1;

  function pushField() {
    fields.push(field);
    field = "";
    afterQuote = false;
  }

  function pushRecord() {
    pushField();
    if (fields.some((value) => value.trim() !== "")) {
      records.push({ line: recordLine, fields });
    }
    fields = [];
    recordLine = line + 1;
  }

  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];

    if (quoted) {
      if (character === '"') {
        if (text[index + 1] === '"') {
          field += '"';
          index += 1;
        } else {
          quoted = false;
          afterQuote = true;
        }
      } else if (character === "\r" || character === "\n") {
        if (character === "\r" && text[index + 1] === "\n") index += 1;
        field += "\n";
        line += 1;
      } else {
        field += character;
      }
      continue;
    }

    if (character === '"') {
      if (afterQuote) {
        throw new Error(`Unexpected quote on line ${line}.`);
      }
      if (field.trim() !== "") {
        throw new Error(`Unexpected quote on line ${line}.`);
      }
      field = "";
      quoted = true;
    } else if (character === delimiter) {
      pushField();
    } else if (character === "\r" || character === "\n") {
      if (character === "\r" && text[index + 1] === "\n") index += 1;
      pushRecord();
      line += 1;
      recordLine = line;
    } else if (afterQuote && character !== " " && character !== "\t") {
      throw new Error(`Unexpected character after quoted field on line ${line}.`);
    } else if (!afterQuote) {
      field += character;
    }
  }

  if (quoted) {
    throw new Error(`Unclosed quoted field starting before line ${line}.`);
  }

  if (fields.length > 0 || field.length > 0) pushRecord();
  if (records.length === 0) throw new Error("The CSV file has no rows.");

  return records;
}

export function parseProductsCsv(input) {
  const [headerRecord, ...dataRecords] = parseCsvRecords(input);
  const headers = headerRecord.fields.map(normalizeCsvHeader);
  const duplicateHeader = headers.find(
    (header, index) => headers.indexOf(header) !== index,
  );
  if (duplicateHeader) {
    throw new Error(`The CSV contains the "${duplicateHeader}" column more than once.`);
  }

  const unknownHeader = headers.find(
    (header) => header && !PRODUCT_CSV_HEADERS.includes(header),
  );
  if (unknownHeader) {
    throw new Error(`Unsupported CSV column: ${unknownHeader}.`);
  }

  for (const requiredHeader of ["name", "sku", "quantity_on_hand"]) {
    if (!headers.includes(requiredHeader)) {
      throw new Error(`The CSV is missing the required "${requiredHeader}" column.`);
    }
  }

  if (dataRecords.length > PRODUCT_CSV_MAX_ROWS) {
    throw new Error(`Import up to ${PRODUCT_CSV_MAX_ROWS} products at a time.`);
  }
  if (dataRecords.length === 0) {
    throw new Error("Add at least one product row after the header.");
  }

  const seenSkus = new Set();
  const products = [];
  const issues = [];

  for (const record of dataRecords) {
    if (record.fields.length > headers.length) {
      issues.push(`Line ${record.line}: has more values than the header.`);
      continue;
    }

    const raw = Object.fromEntries(
      headers.map((header, index) => [header, record.fields[index]?.trim() ?? ""]),
    );
    const parsed = productSchema.safeParse({
      name: raw.name,
      sku: raw.sku,
      description: raw.description ?? "",
      quantity_on_hand: raw.quantity_on_hand,
      cost_price: raw.cost_price ?? "",
      selling_price: raw.selling_price ?? "",
      low_stock_threshold: raw.low_stock_threshold ?? "",
    });

    if (!parsed.success) {
      issues.push(
        `Line ${record.line}: ${parsed.error.issues[0]?.message ?? "invalid product data"}.`,
      );
      continue;
    }

    const normalizedSku = parsed.data.sku.toLocaleLowerCase("en-US");
    if (seenSkus.has(normalizedSku)) {
      issues.push(`Line ${record.line}: SKU "${parsed.data.sku}" appears more than once.`);
      continue;
    }

    seenSkus.add(normalizedSku);
    products.push(parsed.data);
  }

  if (issues.length) {
    const summary = issues.slice(0, 3).join(" ");
    const remaining = issues.length - 3;
    throw new Error(
      `${summary}${remaining > 0 ? ` And ${remaining} more row${remaining === 1 ? "" : "s"} need attention.` : ""}`,
    );
  }

  return products;
}

function protectSpreadsheetText(value) {
  const text = value == null ? "" : String(value);
  return /^[\s]*[=+\-@]/.test(text) ? `'${text}` : text;
}

function quoteCsvField(value) {
  const text = String(value ?? "");
  return `"${text.replace(/"/g, '""')}"`;
}

export function serializeProductsCsv(products) {
  const header = PRODUCT_CSV_HEADERS.map(quoteCsvField).join(",");
  const rows = products.map((product) => {
    const values = [
      protectSpreadsheetText(product.name),
      protectSpreadsheetText(product.sku),
      product.quantity_on_hand,
      protectSpreadsheetText(product.description),
      product.cost_price,
      product.selling_price,
      product.low_stock_threshold,
    ];

    return values.map(quoteCsvField).join(",");
  });

  return `\uFEFF${[header, ...rows].join("\r\n")}\r\n`;
}
