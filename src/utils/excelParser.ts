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
  headers?: string[];
  rawRows?: any[][];
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

export const processRows = (
  rows: any[][],
  headers: string[],
  mapping?: Record<string, string>
): { products: ProductInsert[], errors: string[] } => {
  const products: ProductInsert[] = [];
  const errors: string[] = [];

  // Identify Main Columns (Case Insensitive) OR use mapping
  let modelIdx = -1;
  let brandIdx = -1;
  let priceIdx = -1;

  if (mapping) {
    // Inverse mapping to find which Header corresponds to "modelo"
    // mapping is { "HeaderName": "fieldKey" }
    modelIdx = headers.findIndex(h => mapping[h] === "modelo");
    brandIdx = headers.findIndex(h => mapping[h] === "brand" || mapping[h] === "marca"); // Adjust if mapping values differ
    priceIdx = headers.findIndex(h => mapping[h] === "precioFOB");
  } else {
    // Auto-detect
    modelIdx = headers.findIndex(h => /model|sku|código|item/i.test(h));
    brandIdx = headers.findIndex(h => /brand|marca|fabricante/i.test(h));
    priceIdx = headers.findIndex(h => /price|precio|costo|fob|usd/i.test(h));
  }

  // Iterate rows
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];

    // Skip empty rows
    if (row.length === 0 || !row.some((cell: any) => cell !== undefined && cell !== "")) continue;

    // Required ID/Model check
    const modelVal = modelIdx !== -1 ? String(row[modelIdx] || "").trim() : "";
    if (!modelVal) {
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

      // If manually ignoring
      if (mapping && mapping[header] === "ignorar") return;

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
      image_url: null,
      active: true
    });
  }

  return { products, errors };
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

        // Remove header row from data
        const dataRows = rawRows.slice(1);

        // Try Auto-detect first
        const { products, errors } = processRows(dataRows, headers);

        if (products.length > 0) {
          resolve({ products, errors });
        } else {
          // Return raw data for manual mapping
          resolve({
            products: [],
            errors: ["No se encontraron productos válidos. Por favor mapea las columnas."],
            headers,
            rawRows: dataRows
          });
        }

      } catch (err) {
        reject(err);
      }
    };

    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsArrayBuffer(file);
  });
};

export const imageToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
};

export const compressImage = async (base64: string): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = base64;
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        resolve(base64);
        return;
      }

      // Max width/height
      const MAX_WIDTH = 800;
      const MAX_HEIGHT = 800;
      let width = img.width;
      let height = img.height;

      if (width > height) {
        if (width > MAX_WIDTH) {
          height *= MAX_WIDTH / width;
          width = MAX_WIDTH;
        }
      } else {
        if (height > MAX_HEIGHT) {
          width *= MAX_HEIGHT / height;
          height = MAX_HEIGHT;
        }
      }

      canvas.width = width;
      canvas.height = height;
      ctx.drawImage(img, 0, 0, width, height);

      // Compress to jpeg 0.7
      resolve(canvas.toDataURL("image/jpeg", 0.7));
    };
  });
};

