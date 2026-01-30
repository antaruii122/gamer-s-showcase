import * as XLSX from "xlsx";

// Defined to match Supabase 'products' table exactly
export interface ProductInsert {
  model: string; // text NOT NULL
  brand: string; // text NOT NULL
  price: number | null; // numeric nullable
  specs: Record<string, any>; // jsonb
  image_url: string | null; // text nullable
  active: boolean; // boolean default true
}

export interface ParseResult {
  products: ProductInsert[];
  errors: string[];
}

// Helper to clean price strings into numbers
const parsePrice = (value: any): number | null => {
  if (value === null || value === undefined || value === "") return null;

  if (typeof value === "number") return value;

  const str = String(value).trim();

  // Remove currency symbols and common non-numeric chars except . and ,
  // "USD 1,200.50" -> "1200.50"
  // "$ 500" -> "500"
  // "Consultar" -> "" -> null

  // 1. Remove text
  let cleaned = str.replace(/[^\d.,-]/g, "");

  if (!cleaned) return null;

  // 2. Normalize decimal separator
  // If both exist, assume last one is decimal
  if (cleaned.indexOf(".") !== -1 && cleaned.indexOf(",") !== -1) {
    if (cleaned.lastIndexOf(".") > cleaned.lastIndexOf(",")) {
      // 1,200.50 -> remove commas
      cleaned = cleaned.replace(/,/g, "");
    } else {
      // 1.200,50 -> remove dots, replace comma with dot
      cleaned = cleaned.replace(/\./g, "").replace(/,/g, ".");
    }
  } else if (cleaned.indexOf(",") !== -1) {
    // If only comma, assume it's decimal if it looks like one, or thousands?
    // Let's assume common Spanish/Euro format: 12,50 is 12.5. 1.200 is 1200
    // But safely, let's replace comma with dot.
    cleaned = cleaned.replace(/,/g, ".");
  }

  // 3. Parse
  const num = parseFloat(cleaned);
  return isNaN(num) ? null : num;
};

export const parseExcelFile = async (file: File): Promise<ParseResult> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });
        const sheetName = workbook.SheetNames[0]; // Read first sheet
        const worksheet = workbook.Sheets[sheetName];

        if (!worksheet) {
          resolve({ products: [], errors: ["No contents found in file."] });
          return;
        }

        // Convert to array of arrays (raw values)
        const rawRows: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

        if (rawRows.length < 2) {
          resolve({ products: [], errors: ["File is empty or missing headers."] });
          return;
        }

        const headers = rawRows[0].map((h: any) => String(h || "").trim());
        const products: ProductInsert[] = [];
        const errors: string[] = [];

        // Identify Main Columns (Case Insensitive)
        const modelIdx = headers.findIndex(h => /model|sku|código|item/i.test(h));
        const brandIdx = headers.findIndex(h => /brand|marca|fabricante/i.test(h));
        const priceIdx = headers.findIndex(h => /price|precio|costo|fob|usd/i.test(h));

        // Iterate rows skipping header
        for (let i = 1; i < rawRows.length; i++) {
          const row = rawRows[i];

          // Skip empty rows
          if (row.length === 0 || !row.some((cell: any) => cell !== undefined && cell !== "")) continue;

          // Required ID/Model check
          const modelVal = modelIdx !== -1 ? String(row[modelIdx] || "").trim() : "";
          if (!modelVal) {
            // Maybe log a warning or just skip lines without model?
            // errors.push(\`Row \${i + 1}: Missing Model/SKU\`);
            continue;
          }

          const brandVal = brandIdx !== -1 ? String(row[brandIdx] || "").trim() : "Generic";

          // Parse Price
          const rawPrice = priceIdx !== -1 ? row[priceIdx] : null;
          const priceVal = parsePrice(rawPrice);

          // Build JSONB Specs
          const specs: Record<string, any> = {};

          headers.forEach((header, colIdx) => {
            if (!header) return;
            // Skip mapped columns
            if (colIdx === modelIdx || colIdx === brandIdx || colIdx === priceIdx) return;

            const cellVal = row[colIdx];
            if (cellVal !== undefined && cellVal !== null && cellVal !== "") {
              // Add to specs
              specs[header] = cellVal;
            }
          });

          products.push({
            model: modelVal,
            brand: brandVal,
            price: priceVal,
            specs: specs,
            image_url: null, // Image handling is separate if needed, otherwise null
            active: true
          });
        }

        resolve({ products, errors });
      } catch (err) {
        reject(err);
      }
    };

    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsArrayBuffer(file);
  });
};
