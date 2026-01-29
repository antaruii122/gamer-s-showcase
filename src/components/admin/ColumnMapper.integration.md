# Integration Example: ColumnMapper with UploadCatalog

This document shows how to integrate the ColumnMapper component with the existing UploadCatalog component.

## Option 1: Conditional Rendering in Mapping Step

Add ColumnMapper to the mapping step when auto-detection fails or user wants manual mapping.

### Step 1: Import ColumnMapper

```tsx
// At the top of UploadCatalog.tsx
import ColumnMapper from "./ColumnMapper";
```

### Step 2: Add State for Manual Mapping Mode

```tsx
const [useManualMapping, setUseManualMapping] = useState(false);
```

### Step 3: Update Mapping Step Render

```tsx
const renderMappingStep = () => {
  const isAutoDetected = columnMapping.modelo !== null || columnMapping.precioFOB !== null;

  // If manual mapping is enabled, show ColumnMapper
  if (useManualMapping && parseResult) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="glass-card p-8">
          <ColumnMapper
            data={parseResult.rows}
            columnNames={parseResult.columns.map(col => col.header)}
            onConfirm={(mapping) => {
              // Convert mapping to ColumnMapping format
              const newMapping: ColumnMapping = {
                modelo: null,
                precioFOB: null,
                descripcion: null,
              };

              // Find column indices based on mapping
              parseResult.columns.forEach((col) => {
                const fieldType = mapping[col.header];
                if (fieldType === "modelo") newMapping.modelo = col.index;
                if (fieldType === "precioFOB") newMapping.precioFOB = col.index;
                if (fieldType === "descripcion") newMapping.descripcion = col.index;
              });

              setColumnMapping(newMapping);
              setUseManualMapping(false); // Return to normal mapping view
            }}
          />
          
          <button
            onClick={() => setUseManualMapping(false)}
            className="mt-4 px-4 py-2 text-muted-foreground hover:text-foreground"
          >
            ← Volver a mapeo automático
          </button>
        </div>
      </div>
    );
  }

  // ... rest of existing mapping step code
};
```

### Step 4: Add "Manual Mapping" Button

In the existing mapping step, add a button to switch to manual mode:

```tsx
{/* After the auto-detection status message */}
{!isAutoDetected && (
  <div className="mb-6 p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-between">
    <span className="text-yellow-600 dark:text-yellow-400 text-sm">
      No se pudieron detectar las columnas automáticamente
    </span>
    <button
      onClick={() => setUseManualMapping(true)}
      className="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-sm font-medium"
    >
      Mapeo Manual
    </button>
  </div>
)}
```

## Option 2: Separate Step in Wizard

Add ColumnMapper as a separate step in the wizard flow.

### Update Step Type

```tsx
type Step = "upload" | "mapping" | "manual-mapping" | "images" | "review";
```

### Add to Progress Bar

```tsx
{["upload", "mapping", "manual-mapping", "images", "review"].map((step, i) => (
  // ... progress bar rendering
))}
```

### Create Manual Mapping Step

```tsx
const renderManualMappingStep = () => (
  <div className="max-w-6xl mx-auto">
    <div className="glass-card p-8">
      {parseResult && (
        <ColumnMapper
          data={parseResult.rows}
          columnNames={parseResult.columns.map(col => col.header)}
          onConfirm={(mapping) => {
            // Process mapping and move to next step
            handleManualMappingConfirm(mapping);
          }}
        />
      )}
    </div>
  </div>
);
```

## Complete Integration Example

Here's a minimal working example:

```tsx
import { useState } from "react";
import ColumnMapper from "./ColumnMapper";
import { parseExcelFile } from "@/utils/excelParser";

const ExcelUploadDemo = () => {
  const [parseResult, setParseResult] = useState(null);
  const [finalMapping, setFinalMapping] = useState(null);

  const handleFileUpload = async (file: File) => {
    const result = await parseExcelFile(file);
    setParseResult(result);
  };

  const handleMappingConfirm = (mapping: Record<string, string>) => {
    console.log("User mapping:", mapping);
    setFinalMapping(mapping);
    // Process the mapping and continue with your workflow
  };

  return (
    <div className="p-8">
      {!parseResult ? (
        <input
          type="file"
          accept=".xlsx,.xls,.csv"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFileUpload(file);
          }}
        />
      ) : (
        <ColumnMapper
          data={parseResult.rows}
          columnNames={parseResult.columns.map(col => col.header)}
          onConfirm={handleMappingConfirm}
        />
      )}

      {finalMapping && (
        <div className="mt-4 p-4 bg-green-100 rounded">
          <h3>Mapping Complete!</h3>
          <pre>{JSON.stringify(finalMapping, null, 2)}</pre>
        </div>
      )}
    </div>
  );
};
```

## Data Flow

1. **User uploads Excel file** → `parseExcelFile()` returns `ParseResult`
2. **Auto-detection fails** → Show ColumnMapper
3. **User selects field types** → Dropdowns update `mapping` state
4. **User clicks "Confirmar Mapeo"** → Validation runs
5. **Validation passes** → `onConfirm(mapping)` called with final mapping
6. **Parent component** → Converts mapping to appropriate format and continues workflow

## Props Interface

```typescript
interface ColumnMapperProps {
  data: any[];              // Raw Excel rows (array of objects)
  columnNames: string[];    // Column headers from Excel
  onConfirm: (mapping: Record<string, string>) => void;  // Callback with mapping
}
```

## Mapping Output Format

```typescript
{
  "Product Name": "modelo",
  "Price USD": "precioFOB",
  "Description": "descripcion",
  "RGB Color": "color",
  "Tech Specs": "especificaciones",
  "Internal ID": "ignorar"  // This will be filtered out
}
```
