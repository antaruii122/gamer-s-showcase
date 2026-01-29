import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useCatalog } from "@/contexts/CatalogContext";
import {
  parseExcelFile,
  autoDetectColumns,
  convertToProducts,
  imageToBase64,
  compressImage,
  ParseResult,
  ColumnMapping,
} from "@/utils/excelParser";
import { Product } from "@/types/catalog";
import {
  Upload,
  ArrowLeft,
  FileSpreadsheet,
  Check,
  Image as ImageIcon,
  X,
  Loader2,
} from "lucide-react";
import ParticleBackground from "@/components/public/ParticleBackground";
import { toast } from "sonner";

type Step = "upload" | "mapping" | "images" | "review";

const UploadCatalog = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { categories, addCatalog, addCategory } = useCatalog();

  const [currentStep, setCurrentStep] = useState<Step>("upload");
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [uploadedFileName, setUploadedFileName] = useState("");

  // Form state
  const [catalogName, setCatalogName] = useState("");
  const [selectedCategory, setSelectedCategory] = useState(categories[0] || "");
  const [newCategory, setNewCategory] = useState("");

  // Excel parsing state
  const [parseResult, setParseResult] = useState<ParseResult | null>(null);
  const [columnMapping, setColumnMapping] = useState<ColumnMapping>({
    modelo: null,
    precioFOB: null,
    descripcion: null,
  });

  // Products state
  const [products, setProducts] = useState<Product[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Redirect if not authenticated
  if (!isAuthenticated) {
    navigate("/admin/login");
    return null;
  }

  const handleFileUpload = async (file: File) => {
    setIsLoading(true);
    setError("");

    try {
      // Validate file type
      const validTypes = [
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", // .xlsx
        "application/vnd.ms-excel", // .xls
        "text/csv", // .csv
      ];
      const validExtensions = [".xlsx", ".xls", ".csv"];
      const fileExtension = file.name.toLowerCase().match(/\.[^.]+$/)?.[0];

      if (!validTypes.includes(file.type) && !validExtensions.includes(fileExtension || "")) {
        setError("Formato de archivo no válido. Solo se permiten archivos .xlsx, .xls y .csv");
        setIsLoading(false);
        return;
      }

      // Validate file size (10MB = 10 * 1024 * 1024 bytes)
      const maxSize = 10 * 1024 * 1024;
      if (file.size > maxSize) {
        setError("El archivo es demasiado grande. El tamaño máximo es 10MB");
        setIsLoading(false);
        return;
      }

      const result = await parseExcelFile(file);

      // Validate minimum columns
      if (result.columns.length < 2) {
        setError("El archivo debe tener al menos 2 columnas");
        setIsLoading(false);
        return;
      }

      setParseResult(result);
      setUploadedFileName(file.name);

      // Auto-detect columns
      const autoMapping = autoDetectColumns(result.columns);
      setColumnMapping(autoMapping);

      // Set catalog name from file name
      setCatalogName(file.name.replace(/\.(xlsx|xls|csv)$/i, ""));

      setCurrentStep("mapping");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al procesar archivo");
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileUpload(file);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const file = e.dataTransfer.files?.[0];
    if (file) handleFileUpload(file);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleMappingComplete = () => {
    if (!parseResult) return;

    if (columnMapping.modelo === null) {
      setError("Debes seleccionar la columna de Modelo");
      return;
    }

    const convertedProducts = convertToProducts(
      parseResult.rows,
      columnMapping
    );

    if (convertedProducts.length === 0) {
      setError("No se encontraron productos válidos");
      return;
    }

    setProducts(convertedProducts);
    setCurrentStep("images");
  };

  const handleImageUpload = async (
    productId: string,
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const base64 = await imageToBase64(file);
      const compressed = await compressImage(base64);

      setProducts((prev) =>
        prev.map((p) => (p.id === productId ? { ...p, image: compressed } : p))
      );
    } catch (err) {
      console.error("Error uploading image:", err);
    }
  };

  const handleRemoveImage = (productId: string) => {
    setProducts((prev) =>
      prev.map((p) => (p.id === productId ? { ...p, image: undefined } : p))
    );
  };

  const handleSaveCatalog = () => {
    const category = newCategory.trim() || selectedCategory;

    if (!catalogName.trim()) {
      setError("El nombre del catálogo es requerido");
      return;
    }

    if (!category) {
      setError("Debes seleccionar o crear una categoría");
      return;
    }

    // Validate products exist
    if (products.length === 0) {
      setError("No se encontraron productos en el archivo");
      return;
    }

    setIsSaving(true);
    setError("");

    try {
      // Add new category if needed
      if (newCategory.trim()) {
        addCategory(newCategory.trim());
      }

      // Save catalog to CatalogContext
      addCatalog({
        name: catalogName.trim(),
        category,
        products,
      });

      // Show success toast
      toast.success("Catálogo subido correctamente ✓", {
        description: `${products.length} productos agregados`,
        duration: 3000,
      });

      // Redirect to dashboard
      setTimeout(() => {
        navigate("/admin/dashboard");
      }, 500);
    } catch (err) {
      // Handle localStorage quota exceeded
      if (err instanceof Error && err.name === "QuotaExceededError") {
        setError("Almacenamiento lleno - Elimina catálogos antiguos");
        toast.error("Almacenamiento lleno", {
          description: "Elimina catálogos antiguos para liberar espacio",
        });
      } else {
        setError("Error al guardar el catálogo");
        toast.error("Error al guardar", {
          description: err instanceof Error ? err.message : "Error desconocido",
        });
      }
    } finally {
      setIsSaving(false);
    }
  };

  const renderUploadStep = () => (
    <div className="max-w-3xl mx-auto">
      <div className="glass-card p-8 border-gradient">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-primary/20 mb-4">
            <FileSpreadsheet className="w-10 h-10 text-primary" />
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-2">
            Subir Archivo Excel
          </h2>
          <p className="text-muted-foreground">
            Soportamos archivos .xlsx, .xls y .csv (máximo 10MB)
          </p>
        </div>

        {/* Category Selector */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-foreground mb-2">
            Categoría *
          </label>
          <div className="flex gap-2">
            <select
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value);
                setNewCategory("");
              }}
              className="flex-1 px-4 py-3 rounded-lg bg-muted/50 border border-border text-foreground focus:outline-none focus:border-primary transition-all"
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
            <input
              type="text"
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              placeholder="Agregar nueva categoría..."
              className="flex-1 px-4 py-3 rounded-lg bg-muted/50 border border-border text-foreground focus:outline-none focus:border-primary transition-all"
            />
          </div>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.xls,.csv"
          onChange={handleFileInputChange}
          className="hidden"
        />

        {/* Drag and Drop Zone */}
        <div
          onClick={() => fileInputRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          className="w-full h-[300px] border-2 border-dashed border-cyan-500/50 rounded-xl hover:border-cyan-500 hover:bg-cyan-500/5 transition-all cursor-pointer group flex items-center justify-center"
          style={{ minHeight: "300px" }}
        >
          {isLoading ? (
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="w-12 h-12 text-cyan-500 animate-spin" />
              <span className="text-muted-foreground">Procesando archivo...</span>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3 px-4">
              <Upload className="w-16 h-16 text-cyan-500/70 group-hover:text-cyan-500 transition-colors" />
              <span className="text-center text-muted-foreground group-hover:text-foreground transition-colors text-lg">
                Arrastra tu archivo Excel aquí o haz clic para seleccionar
              </span>
              <span className="text-sm text-muted-foreground">
                Formatos soportados: .xlsx, .xls, .csv
              </span>
            </div>
          )}
        </div>

        {error && (
          <div className="mt-4 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
            {error}
          </div>
        )}
      </div>
    </div>
  );

  const renderMappingStep = () => {
    // Check if columns were auto-detected successfully
    const isAutoDetected = columnMapping.modelo !== null || columnMapping.precioFOB !== null;

    return (
      <div className="max-w-4xl mx-auto">
        <div className="glass-card p-8">
          <h2 className="text-2xl font-bold text-foreground mb-6">
            Mapear Columnas
          </h2>

          {/* Catalog Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Nombre del Catálogo
              </label>
              <input
                type="text"
                value={catalogName}
                onChange={(e) => setCatalogName(e.target.value)}
                className="w-full px-4 py-3 rounded-lg bg-muted/50 border border-border text-foreground focus:outline-none focus:border-primary transition-all"
                placeholder="Ej: Gabinetes 2024"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Categoría
              </label>
              <div className="flex gap-2">
                <select
                  value={selectedCategory}
                  onChange={(e) => {
                    setSelectedCategory(e.target.value);
                    setNewCategory("");
                  }}
                  className="flex-1 px-4 py-3 rounded-lg bg-muted/50 border border-border text-foreground focus:outline-none focus:border-primary transition-all"
                >
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
                <input
                  type="text"
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  placeholder="O crear nueva..."
                  className="flex-1 px-4 py-3 rounded-lg bg-muted/50 border border-border text-foreground focus:outline-none focus:border-primary transition-all"
                />
              </div>
            </div>
          </div>

          {/* Auto-detection Status */}
          {isAutoDetected && (
            <div className="mb-6 p-4 rounded-lg bg-accent/10 border border-accent/20 flex items-center gap-3">
              <Check className="w-5 h-5 text-accent" />
              <span className="text-accent font-medium">
                Columnas detectadas correctamente ✓
              </span>
            </div>
          )}

          {/* Preview Table - First 5 Rows */}
          {parseResult && parseResult.rows.length > 0 && (
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-foreground mb-4">
                Vista Previa (Primeras 5 filas)
              </h3>
              <div className="overflow-x-auto rounded-lg border border-border">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50">
                    <tr>
                      {parseResult.columns.map((col) => (
                        <th
                          key={col.index}
                          className="px-4 py-3 text-left font-semibold text-foreground border-b border-border"
                        >
                          {col.header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {parseResult.rows.slice(1, 6).map((row, rowIndex) => (
                      <tr key={rowIndex} className="hover:bg-muted/30 transition-colors">
                        {row.map((cell, cellIndex) => (
                          <td
                            key={cellIndex}
                            className="px-4 py-3 text-muted-foreground border-b border-border/50"
                          >
                            {String(cell || "")}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Column Mapping */}
          <div className="space-y-4 mb-8">
            <h3 className="text-lg font-semibold text-foreground">
              Asignar Columnas
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Modelo */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Columna de Modelo *
                </label>
                <select
                  value={columnMapping.modelo ?? ""}
                  onChange={(e) =>
                    setColumnMapping({
                      ...columnMapping,
                      modelo: e.target.value ? Number(e.target.value) : null,
                    })
                  }
                  className="w-full px-4 py-3 rounded-lg bg-muted/50 border border-border text-foreground focus:outline-none focus:border-primary transition-all"
                >
                  <option value="">Seleccionar...</option>
                  {parseResult?.columns.map((col) => (
                    <option key={col.index} value={col.index}>
                      {col.header}
                    </option>
                  ))}
                </select>
              </div>

              {/* Precio FOB */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Columna de Precio FOB
                </label>
                <select
                  value={columnMapping.precioFOB ?? ""}
                  onChange={(e) =>
                    setColumnMapping({
                      ...columnMapping,
                      precioFOB: e.target.value ? Number(e.target.value) : null,
                    })
                  }
                  className="w-full px-4 py-3 rounded-lg bg-muted/50 border border-border text-foreground focus:outline-none focus:border-primary transition-all"
                >
                  <option value="">Seleccionar...</option>
                  {parseResult?.columns.map((col) => (
                    <option key={col.index} value={col.index}>
                      {col.header}
                    </option>
                  ))}
                </select>
              </div>

              {/* Descripción */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Columna de Descripción
                </label>
                <select
                  value={columnMapping.descripcion ?? ""}
                  onChange={(e) =>
                    setColumnMapping({
                      ...columnMapping,
                      descripcion: e.target.value ? Number(e.target.value) : null,
                    })
                  }
                  className="w-full px-4 py-3 rounded-lg bg-muted/50 border border-border text-foreground focus:outline-none focus:border-primary transition-all"
                >
                  <option value="">Seleccionar...</option>
                  {parseResult?.columns.map((col) => (
                    <option key={col.index} value={col.index}>
                      {col.header}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <p className="text-sm text-muted-foreground">
              Las columnas no asignadas se agregarán como especificaciones del producto.
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
              {error}
            </div>
          )}

          <div className="flex justify-between">
            <button
              onClick={() => setCurrentStep("upload")}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground transition-all"
            >
              <ArrowLeft className="w-4 h-4" />
              Atrás
            </button>
            <button onClick={handleMappingComplete} className="btn-gaming rounded-lg">
              Continuar
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderImagesStep = () => (
    <div className="max-w-6xl mx-auto">
      <div className="glass-card p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-foreground">
              Agregar Imágenes
            </h2>
            <p className="text-muted-foreground">
              {products.length} productos encontrados
            </p>
          </div>
          <button
            onClick={() => setCurrentStep("review")}
            className="btn-gaming rounded-lg"
          >
            Continuar sin Imágenes
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-8">
          {products.map((product) => (
            <div key={product.id} className="glass-card p-4">
              {/* Image Area */}
              <div className="relative aspect-square mb-3 rounded-lg overflow-hidden bg-muted/30">
                {product.image ? (
                  <>
                    <img
                      src={product.image}
                      alt={product.modelo}
                      className="w-full h-full object-contain"
                    />
                    <button
                      onClick={() => handleRemoveImage(product.id)}
                      className="absolute top-2 right-2 p-1.5 rounded-full bg-destructive text-destructive-foreground hover:scale-110 transition-transform"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </>
                ) : (
                  <label className="flex flex-col items-center justify-center h-full cursor-pointer hover:bg-muted/50 transition-colors">
                    <ImageIcon className="w-8 h-8 text-muted-foreground mb-2" />
                    <span className="text-xs text-muted-foreground">
                      Agregar imagen
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleImageUpload(product.id, e)}
                      className="hidden"
                    />
                  </label>
                )}
              </div>

              {/* Product Info */}
              <h3 className="font-semibold text-foreground truncate text-sm">
                {product.modelo}
              </h3>
              <p className="text-xs text-accent font-medium">{product.precioFOB}</p>
            </div>
          ))}
        </div>

        <div className="flex justify-between">
          <button
            onClick={() => setCurrentStep("mapping")}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            Atrás
          </button>
          <button
            onClick={() => setCurrentStep("review")}
            className="btn-gaming rounded-lg"
          >
            Revisar Catálogo
          </button>
        </div>
      </div>
    </div>
  );

  const renderReviewStep = () => (
    <div className="max-w-4xl mx-auto">
      <div className="glass-card p-8 border-gradient">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-accent/20 mb-4">
            <Check className="w-8 h-8 text-accent" />
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-2">
            Revisar y Guardar
          </h2>
        </div>

        <div className="space-y-4 mb-8">
          <div className="flex justify-between p-4 rounded-lg bg-muted/30">
            <span className="text-muted-foreground">Nombre:</span>
            <span className="font-semibold text-foreground">{catalogName}</span>
          </div>
          <div className="flex justify-between p-4 rounded-lg bg-muted/30">
            <span className="text-muted-foreground">Categoría:</span>
            <span className="font-semibold text-foreground">
              {newCategory.trim() || selectedCategory}
            </span>
          </div>
          <div className="flex justify-between p-4 rounded-lg bg-muted/30">
            <span className="text-muted-foreground">Total Productos:</span>
            <span className="font-semibold text-foreground">
              {products.length}
            </span>
          </div>
          <div className="flex justify-between p-4 rounded-lg bg-muted/30">
            <span className="text-muted-foreground">Con Imagen:</span>
            <span className="font-semibold text-foreground">
              {products.filter((p) => p.image).length}
            </span>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
            {error}
          </div>
        )}

        <div className="flex justify-between">
          <button
            onClick={() => setCurrentStep("images")}
            disabled={isSaving}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ArrowLeft className="w-4 h-4" />
            Atrás
          </button>
          <button
            onClick={handleSaveCatalog}
            disabled={isSaving}
            className="btn-gaming rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 inline animate-spin" />
                Guardando...
              </>
            ) : (
              <>
                <Check className="w-5 h-5 mr-2 inline" />
                Guardar Catálogo
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen p-4 md:p-8">
      <ParticleBackground />

      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <header className="flex items-center gap-4 mb-8">
          <button
            onClick={() => navigate("/admin/dashboard")}
            className="p-2 rounded-lg hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              Subir Nuevo Catálogo
            </h1>
            <p className="text-sm text-muted-foreground">
              Paso {currentStep === "upload" ? 1 : currentStep === "mapping" ? 2 : currentStep === "images" ? 3 : 4} de 4
            </p>
          </div>
        </header>

        {/* Progress Bar */}
        <div className="flex gap-2 mb-8">
          {["upload", "mapping", "images", "review"].map((step, i) => (
            <div
              key={step}
              className={`flex-1 h-2 rounded-full transition-all ${["upload", "mapping", "images", "review"].indexOf(currentStep) >= i
                ? "bg-primary glow-cyan"
                : "bg-muted"
                }`}
            />
          ))}
        </div>

        {/* Step Content */}
        {currentStep === "upload" && renderUploadStep()}
        {currentStep === "mapping" && renderMappingStep()}
        {currentStep === "images" && renderImagesStep()}
        {currentStep === "review" && renderReviewStep()}
      </div>
    </div>
  );
};

export default UploadCatalog;
