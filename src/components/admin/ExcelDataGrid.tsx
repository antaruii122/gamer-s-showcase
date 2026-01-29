import { useMemo } from "react";
import { AgGridReact } from "ag-grid-react"; // React Data Grid Component
import "ag-grid-community/styles/ag-grid.css"; // Mandatory CSS
import "ag-grid-community/styles/ag-theme-quartz.css"; // Modern Theme
import { Product } from "@/types/catalog";
import { ColDef, ModuleRegistry, AllCommunityModule } from "ag-grid-community";

// Register all community features
ModuleRegistry.registerModules([AllCommunityModule]);

interface ExcelDataGridProps {
    products: Product[];
}

const ExcelDataGrid = ({ products }: ExcelDataGridProps) => {
    console.log("ExcelDataGrid: Received products:", products);

    // Row Data: The parsed products
    const rowData = useMemo(() => {
        const data = products.map((p) => {
            // Flatten specs into the main object for easier column mapping
            return {
                ...p,
                ...p.specs, // Spread specs so they appear as top-level keys
            };
        });
        console.log("ExcelDataGrid: Processed Row Data:", data);
        return data;
    }, [products]);

    // Column Definitions
    const columnDefs = useMemo<ColDef[]>(() => {
        if (products.length === 0) {
            console.warn("ExcelDataGrid: No products found.");
            return [];
        }

        // 1. Static Core Columns
        const coreCols: ColDef[] = [
            { field: "modelo", headerName: "Modelo", pinned: "left", filter: true, sortable: true, width: 200 },
            { field: "precioFOB", headerName: "Precio FOB", filter: true, sortable: true, width: 120 },
            { field: "descripcion", headerName: "Descripción", filter: true, sortable: true, width: 250 },
        ];

        // 2. Dynamic Spec Columns
        // Collect all unique keys from all products' specs
        const allSpecKeys = new Set<string>();
        products.forEach((p) => {
            if (p.specs) {
                Object.keys(p.specs).forEach((key) => allSpecKeys.add(key));
            }
        });

        const specCols: ColDef[] = Array.from(allSpecKeys).map((key) => ({
            field: key,
            headerName: key,
            filter: true,
            sortable: true,
            resizable: true,
            width: 150,
        }));

        const finalCols = [...coreCols, ...specCols];
        console.log("ExcelDataGrid: Generated Columns:", finalCols);
        return finalCols;
    }, [products]);

    // Default Column Config
    const defaultColDef = useMemo<ColDef>(() => {
        return {
            resizable: true,
            filter: true,
            sortable: true,
        };
    }, []);

    return (
        <div className="w-full h-[600px] glass-card overflow-hidden rounded-xl border border-white/10">
            {/* 
          Using Modern Ag-Grid Theme (Quartz)
      */}
            <div className="ag-theme-quartz-dark w-full h-full" style={{ fontSize: "14px", height: "100%", width: "100%" }}>
                <AgGridReact
                    rowData={rowData}
                    columnDefs={columnDefs}
                    defaultColDef={defaultColDef}
                    pagination={true}
                    paginationPageSize={20}
                />
            </div>
        </div>
    );
};

export default ExcelDataGrid;
