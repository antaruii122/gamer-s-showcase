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

// Auto-detect column mapping based on common Spanish headers
export const autoDetectColumns = (columns: ParsedColumn[]): ColumnMapping => {
  const mapping: ColumnMapping = {
    modelo: null,
    precioFOB: null,
    descripcion: null,
  };

  columns.forEach((col) => {
    const header = col.header.toLowerCase();
    
    // Detect model column
    if (
      header.includes("modelo") ||
      header.includes("model") ||
      header.includes("sku") ||
      header.includes("código") ||
      header.includes("codigo")
    ) {
      if (mapping.modelo === null) mapping.modelo = col.index;
    }
    
    // Detect price column
    if (
      header.includes("precio") ||
      header.includes("price") ||
      header.includes("fob") ||
      header.includes("usd") ||
      header.includes("$")
    ) {
      if (mapping.precioFOB === null) mapping.precioFOB = col.index;
    }
    
    // Detect description column
    if (
      header.includes("descrip") ||
      header.includes("nombre") ||
      header.includes("name") ||
      header.includes("detalle")
    ) {
      if (mapping.descripcion === null) mapping.descripcion = col.index;
    }
  });

  return mapping;
};

// Convert parsed data to products
export const convertToProducts = (
  rows: any[][],
  mapping: ColumnMapping,
  images: { row: number; col: number; dataUrl: string }[]
): Product[] => {
  const products: Product[] = [];
  
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
    
    // Find image for this row
    const rowImage = images.find((img) => img.row === i);
    
    products.push({
      id: generateId(),
      modelo: modelo.trim(),
      precioFOB: formatPrice(precioFOB),
      descripcion: descripcion?.trim(),
      specs,
      image: rowImage?.dataUrl,
    });
  }
  
  return products;
};

// Format price to consistent format
const formatPrice = (price: string): string => {
  const cleaned = price.replace(/[^0-9.,]/g, "");
  const number = parseFloat(cleaned.replace(",", "."));
  
  if (isNaN(number)) return price;
  
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
