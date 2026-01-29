import { useState } from "react";
import { Check, AlertCircle } from "lucide-react";

interface ColumnMapperProps {
    data: any[];
    columnNames: string[];
    onConfirm: (mapping: Record<string, string>) => void;
}

const FIELD_OPTIONS = [
    { value: "", label: "Seleccionar..." },
    { value: "modelo", label: "Modelo" },
    { value: "precioFOB", label: "Precio FOB" },
    { value: "descripcion", label: "Descripción" },
    { value: "color", label: "Color" },
    { value: "especificaciones", label: "Especificaciones" },
    { value: "ignorar", label: "Ignorar" },
];

const ColumnMapper = ({ data, columnNames, onConfirm }: ColumnMapperProps) => {
    const [mapping, setMapping] = useState<Record<string, string>>({});
    const [error, setError] = useState("");

    const handleMappingChange = (columnName: string, fieldType: string) => {
        setMapping((prev) => ({
            ...prev,
            [columnName]: fieldType,
        }));
        setError(""); // Clear error when user makes changes
    };

    const handleConfirm = () => {
        // Validate: At least "Modelo" OR "Precio FOB" must be mapped
        const hasMappedModelo = Object.values(mapping).includes("modelo");
        const hasMappedPrecio = Object.values(mapping).includes("precioFOB");

        if (!hasMappedModelo && !hasMappedPrecio) {
            setError("Debes mapear al menos Modelo o Precio");
            return;
        }

        // Filter out ignored columns and empty mappings
        const finalMapping: Record<string, string> = {};
        Object.entries(mapping).forEach(([col, field]) => {
            if (field && field !== "ignorar") {
                finalMapping[col] = field;
            }
        });

        onConfirm(finalMapping);
    };

    // Get first 3 data rows (excluding header if present)
    const previewRows = data.slice(0, 3);

    return (
        <div className="w-full">
            <div className="mb-6">
                <h3 className="text-xl font-bold text-foreground mb-2">
                    Mapeo Manual de Columnas
                </h3>
                <p className="text-muted-foreground text-sm">
                    Selecciona el tipo de dato para cada columna de tu archivo Excel
                </p>
            </div>

            {/* Responsive Table Container */}
            <div className="overflow-x-auto rounded-lg border border-border mb-6">
                <table className="w-full text-sm">
                    {/* Column Headers with Dropdowns */}
                    <thead className="bg-gradient-to-r from-cyan-900/30 to-cyan-800/30 border-b-2 border-cyan-500/50">
                        <tr>
                            {columnNames.map((colName, index) => (
                                <th key={index} className="px-4 py-4 min-w-[200px]">
                                    <div className="flex flex-col gap-2">
                                        <span className="text-cyan-400 font-semibold text-xs uppercase tracking-wider">
                                            {colName}
                                        </span>
                                        <select
                                            value={mapping[colName] || ""}
                                            onChange={(e) => handleMappingChange(colName, e.target.value)}
                                            className="w-full px-3 py-2 rounded-lg bg-muted/80 border border-cyan-500/30 text-foreground text-sm focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all"
                                        >
                                            {FIELD_OPTIONS.map((option) => (
                                                <option key={option.value} value={option.value}>
                                                    {option.label}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </th>
                            ))}
                        </tr>
                    </thead>

                    {/* Preview Data Rows */}
                    <tbody className="bg-muted/20">
                        {previewRows.map((row, rowIndex) => (
                            <tr
                                key={rowIndex}
                                className="border-b border-border/50 hover:bg-muted/40 transition-colors"
                            >
                                {columnNames.map((colName, colIndex) => (
                                    <td
                                        key={colIndex}
                                        className="px-4 py-3 text-muted-foreground"
                                    >
                                        {row[colName] !== undefined && row[colName] !== null
                                            ? String(row[colName])
                                            : "-"}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Error Message */}
            {error && (
                <div className="mb-4 p-4 rounded-lg bg-destructive/10 border border-destructive/20 flex items-center gap-3">
                    <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0" />
                    <span className="text-destructive text-sm font-medium">{error}</span>
                </div>
            )}

            {/* Confirm Button */}
            <div className="flex justify-end">
                <button
                    onClick={handleConfirm}
                    className="flex items-center gap-2 px-6 py-3 rounded-lg bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400 text-white font-semibold shadow-lg shadow-cyan-500/30 hover:shadow-cyan-500/50 transition-all transform hover:scale-105"
                >
                    <Check className="w-5 h-5" />
                    Confirmar Mapeo
                </button>
            </div>
        </div>
    );
};

export default ColumnMapper;
