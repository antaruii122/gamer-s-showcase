import * as XLSX from "xlsx";
import { Product } from "@/types/catalog";
import { generateId } from "./localStorage";

export interface ParsedColumn {
  index: number;
  header: string;
  sampleValues: string[];
}

export interface ColumnMapping {
  modelo: number | null;
  precioFOB: number | null;
  descripcion: number | null;
  layout: "table" | "vertical";
  keyRowIndices?: Record<string, number>; // For vertical layout: map "Key Name" -> Row Index
}

export interface ParseResult {
  columns: ParsedColumn[];
  rows: any[][];
  images: { row: number; col: number; dataUrl: string }[];
}

// Extract text value from a cell
const getCellValue = (cell: any): string => {
  if (!cell) return "";
  if (cell.v !== undefined) return String(cell.v);
  if (cell.w !== undefined) return cell.w;
  return "";
};

// Parse Excel file and extract data
export const parseExcelFile = async (file: File): Promise<ParseResult> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array", cellStyles: true });

        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];

        if (!worksheet) {
          reject(new Error("No se encontró hoja de cálculo"));
          return;
        }

        // Get the range
        const range = XLSX.utils.decode_range(worksheet["!ref"] || "A1");

        // Extract all rows
        const rows: any[][] = [];
        for (let r = range.s.r; r <= range.e.r; r++) {
          const row: any[] = [];
          for (let c = range.s.c; c <= range.e.c; c++) {
            const cellAddress = XLSX.utils.encode_cell({ r, c });
            const cell = worksheet[cellAddress];
            row.push(getCellValue(cell));
          }
          rows.push(row);
        }

        // Build columns from first row (headers)
        const columns: ParsedColumn[] = [];
        if (rows.length > 0) {
          rows[0].forEach((header, index) => {
            const sampleValues: string[] = [];
            for (let i = 1; i < Math.min(4, rows.length); i++) {
              if (rows[i][index]) {
                sampleValues.push(String(rows[i][index]));
              }
            }
            columns.push({
              index,
              header: header || `Columna ${index + 1}`,
              sampleValues,
            });
          });
        }

        // Try to extract images (limited support)
        const images: { row: number; col: number; dataUrl: string }[] = [];

        resolve({ columns, rows, images });
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = () => reject(new Error("Error al leer archivo"));
    reader.readAsArrayBuffer(file);
  });
};

// Auto-detect column mapping and layout
export const autoDetectColumns = (columns: ParsedColumn[], rows: any[][]): ColumnMapping => {
  const mapping: ColumnMapping = {
    modelo: null,
    precioFOB: null,
    descripcion: null,
    layout: "table",
  };

  // 1. Try to detect Standard Table (Horizontal Headers in Row 0)
  let tableConfidence = 0;
  columns.forEach((col) => {
    const header = col.header.toLowerCase();
    if (header.includes("modelo") || header.includes("sku") || header.includes("item")) tableConfidence += 2;
    if (header.includes("precio") || header.includes("fob") || header.includes("price") || header.includes("usd")) tableConfidence += 2;
    if (header.includes("descrip") || header.includes("spec")) tableConfidence += 1;
  });

  // 2. Try to detect Vertical Spec Sheet (Keys in Column 0)
  let verticalConfidence = 0;
  const keyRowIndices: Record<string, number> = {};

  // Scan first column (Column A) for keys
  rows.forEach((row, rowIndex) => {
    const cellA = String(row[0] || "").toLowerCase().trim();
    if (!cellA) return;

    if (cellA.includes("modelo") || cellA === "model") {
      verticalConfidence += 2;
      keyRowIndices["modelo"] = rowIndex;
    }
    if (cellA.includes("color")) {
      verticalConfidence += 1;
      keyRowIndices["color"] = rowIndex;
    }
    if ((cellA.includes("precio") || cellA.includes("fob") || cellA.includes("cost")) && !cellA.includes("total")) {
      verticalConfidence += 2;
      keyRowIndices["precio"] = rowIndex; // Explicit price row
    }
    if (cellA.includes("panel") || cellA.includes("chasis") || cellA.includes("cpu") || cellA.includes("ram") || cellA.includes("peso")) {
      verticalConfidence += 1;
    }
  });

  // Decide Layout
  if (verticalConfidence > tableConfidence && verticalConfidence >= 2) {
    mapping.layout = "vertical";
    mapping.keyRowIndices = keyRowIndices;
    return mapping;
  }

  // Fallback to Standard Table detection logic
  columns.forEach((col) => {
    const header = col.header.toLowerCase();

    // Detect model column
    if (
      header.includes("modelo") ||
      header.includes("model") ||
      header.includes("sku") ||
      header.includes("código") ||
      header.includes("codigo") ||
      header.includes("id") ||
      header.includes("item") ||
      header.includes("part") ||
      header.includes("producto")
    ) {
      if (mapping.modelo === null) mapping.modelo = col.index;
    }

    // Detect price column
    if (
      header.includes("precio") ||
      header.includes("price") ||
      header.includes("fob") ||
      header.includes("usd") ||
      header.includes("cost") ||
      header.includes("valor") ||
      header.includes("$")
    ) {
      if (mapping.precioFOB === null) mapping.precioFOB = col.index;
    }

    // Detect description column
    if (
      header.includes("descrip") ||
      header.includes("nombre") ||
      header.includes("name") ||
      header.includes("detalle") ||
      header.includes("spec")
    ) {
      if (mapping.descripcion === null) mapping.descripcion = col.index;
    }
  });

  return mapping;
};

// Convert parsed data to products
export const convertToProducts = (
  rows: any[][],
  mapping: ColumnMapping
): Product[] => {
  const products: Product[] = [];

  if (mapping.layout === "vertical") {
    // === VERTICAL PARSING ===
    // Iterate COLS instead of ROWS. Usually data starts from Col 1 (B)
    // We assume row 0 might be a main header (e.g. "GAMER CASE"), so we might scan from Col B.

    // Find where the values start. Usually Column 1.
    // We support multi-column designs.
    const maxCols = rows.reduce((max, row) => Math.max(max, row.length), 0);
    const modeloRowIndex = mapping.keyRowIndices?.["modelo"] ?? -1;

    // Scan the whole sheet for a floating price if not found in keys
    let globalPrice = "";
    if (mapping.keyRowIndices?.["precio"] === undefined) {
      // Heuristic: Search bottom-right quadrant for money patterns
      for (let r = rows.length - 1; r >= 0; r--) {
        for (let c = rows[r].length - 1; c >= 0; c--) {
          const val = String(rows[r][c] || "");
          if (val.match(/(?:USD|US\$|\$)\s*[\d,.]+|[\d,.]+\s*(?:USD)/i)) {
            globalPrice = val;
            break;
          }
        }
        if (globalPrice) break;
      }
    }

    for (let c = 1; c < maxCols; c++) {
      // Check if this column has a "Modelo" value (if we found a modelo row)
      const modeloVal = modeloRowIndex >= 0 ? String(rows[modeloRowIndex][c] || "").trim() : "";

      // If no explicit modelo row, or cell is empty, maybe skip?
      // But some sheets might have Model in Header (Row 0) and specs below.
      // Let's rely on finding a value in the 'Modelo' row.
      if (modeloRowIndex >= 0 && !modeloVal) continue;

      // If we didn't find a "Modelo" row key, we can't really group products cleanly in vertical mode.
      if (modeloRowIndex === -1 && c === 1) {
        // Fallback: If no model key, maybe just use Col B as a single product?
        // Let's assume current column is a product.
      } else if (modeloRowIndex === -1) {
        continue;
      }

      const currentModelo = modeloVal || "Producto Sin Modelo";

      // Get Price
      let precioVal = globalPrice;
      if (mapping.keyRowIndices?.["precio"] !== undefined) {
        precioVal = String(rows[mapping.keyRowIndices["precio"]][c] || "");
      }

      // Build Specs
      const specs: Record<string, string> = {};
      rows.forEach((row, rIndex) => {
        // Skip Model and Price rows in specs
        if (rIndex === modeloRowIndex || rIndex === mapping.keyRowIndices?.["precio"]) return;

        const key = String(row[0] || "").trim();
        const outputVal = String(row[c] || "").trim();

        if (key && outputVal && key.length < 200) { // increased limit for long specs
          // Clean key
          const cleanKey = key.replace(":", "").trim();
          if (cleanKey) {
            specs[cleanKey] = outputVal;
          }
        }
      });

      products.push({
        id: generateId(),
        modelo: currentModelo,
        precioFOB: formatPrice(precioVal),
        specs,
        image: undefined,
      });
    }

  } else {
    // === TABLE PARSING (Legacy) ===
    // Skip header row
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];

      // Get mapped values
      const modelo = mapping.modelo !== null ? String(row[mapping.modelo] || "") : "";
      const precioFOB = mapping.precioFOB !== null ? String(row[mapping.precioFOB] || "") : "";
      const descripcion = mapping.descripcion !== null ? String(row[mapping.descripcion] || "") : undefined;

      // Skip rows without model
      if (!modelo.trim()) continue;

      // Build specs from remaining columns
      const specs: Record<string, string> = {};
      row.forEach((value, colIndex) => {
        if (
          colIndex !== mapping.modelo &&
          colIndex !== mapping.precioFOB &&
          colIndex !== mapping.descripcion &&
          value &&
          String(value).trim()
        ) {
          const header = rows[0][colIndex] || `Campo ${colIndex + 1}`;
          specs[header] = String(value);
        }
      });

      products.push({
        id: generateId(),
        modelo: modelo.trim(),
        precioFOB: formatPrice(precioFOB),
        descripcion: descripcion?.trim(),
        specs,
        image: undefined,
      });
    }
  }

  return products;
};

// Format price to consistent format
const formatPrice = (price: string): string => {
  if (!price) return "Consultar"; // Default empty price

  // Return as-is if it's already in the desired format
  if (price.startsWith("USD ")) return price;

  let cleaned = price.toString().trim();

  // Handle "USD 38.50" -> 38.50
  if (cleaned.toUpperCase().startsWith("USD")) {
    cleaned = cleaned.substring(3).trim();
  }

  // Remove currency symbols but keep dots/commas
  cleaned = cleaned.replace(/[^0-9.,-]/g, "");

  // Heuristic for separators
  if (cleaned.includes(".") && cleaned.includes(",")) {
    if (cleaned.lastIndexOf(".") > cleaned.lastIndexOf(",")) {
      cleaned = cleaned.replace(/,/g, "");
    } else {
      cleaned = cleaned.replace(/\./g, "").replace(/,/g, ".");
    }
  } else if (cleaned.includes(",")) {
    if ((cleaned.match(/,/g) || []).length > 1) {
      cleaned = cleaned.replace(/,/g, "");
    } else {
      cleaned = cleaned.replace(/,/g, ".");
    }
  } else if (cleaned.includes(".")) {
    if ((cleaned.match(/\./g) || []).length > 1) {
      cleaned = cleaned.replace(/\./g, "");
    }
  }

  const number = parseFloat(cleaned);

  if (isNaN(number)) return price; // Return original if parsing failed

  return `USD ${number.toFixed(2)}`;
};
// Convert image file to base64
export const imageToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

// Compress image to max 500KB
export const compressImage = async (
  dataUrl: string,
  maxSizeKB: number = 500
): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      let { width, height } = img;

      // Scale down if too large
      const maxDimension = 800;
      if (width > maxDimension || height > maxDimension) {
        const ratio = Math.min(maxDimension / width, maxDimension / height);
        width *= ratio;
        height *= ratio;
      }

      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext("2d");
      ctx?.drawImage(img, 0, 0, width, height);

      // Try different quality levels
      let quality = 0.9;
      let result = canvas.toDataURL("image/jpeg", quality);

      while (result.length > maxSizeKB * 1024 * 1.37 && quality > 0.1) {
        quality -= 0.1;
        result = canvas.toDataURL("image/jpeg", quality);
      }

      resolve(result);
    };
    img.src = dataUrl;
  });
};
