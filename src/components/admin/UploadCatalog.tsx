import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useCatalog } from "@/contexts/CatalogContext";
import {
  parseExcelFile,
  imageToBase64,
  compressImage,
  processRows,
} from "@/utils/excelParser";
import { ProductInsert as Product } from "@/utils/excelParser";
import ColumnMapper from "./ColumnMapper";
import {
  Upload,
  ArrowLeft,
  FileSpreadsheet,
  Check,
  Image as ImageIcon,
  X,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import ExcelDataGrid from "./ExcelDataGrid";

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
  const [rawFileContent, setRawFileContent] = useState<{ headers: string[], rows: any[][] } | null>(null);

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

      // Check errors
      if (result.errors.length > 0 && result.products.length === 0) {
        if (result.rawRows && result.headers) {
          // Detection failed, go to mapping
          setRawFileContent({
            headers: result.headers,
            rows: result.rawRows
          });
          setCatalogName(file.name.replace(/\.(xlsx|xls|csv)$/i, ""));
          setUploadedFileName(file.name);
          setCurrentStep("mapping");
          toast.info("No se detectaron columnas automáticas. Por favor realiza el mapeo manual.");
          return;
        }

        setError(result.errors[0] || "Error al procesar archivo");
        setIsLoading(false);
        return;
      }

      if (result.products.length === 0) {
        setError("No se encontraron productos válidos en el archivo. Asegúrese de tener headers como 'Model', 'Brand', 'Price'.");
        setIsLoading(false);
        return;
      }

      setUploadedFileName(file.name);
      setProducts(result.products);

      // Set catalog name from file name
      setCatalogName(file.name.replace(/\.(xlsx|xls|csv)$/i, ""));

      // Go directly to review/images step
      setCurrentStep("images");

      toast.success(`${result.products.length} productos detectados correctamente`);
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

  /* New Loading State for individual product image uploads */
  const [uploadingImages, setUploadingImages] = useState<Record<string, boolean>>({});
  const [viewMode, setViewMode] = useState<"cards" | "grid">("cards");

  const handleImageUpload = async (
    productModel: string,
    file: File
  ) => {
    if (!file) return;

    // Validate type
    const validTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!validTypes.includes(file.type)) {
      toast.error("Formato no válido", { description: "Solo JPG, PNG o WEBP" });
      return;
    }

    // Validate size (2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Archivo muy grande", { description: "Máximo 2MB" });
      return;
    }

    setUploadingImages(prev => ({ ...prev, [productModel]: true }));

    try {
      const base64 = await imageToBase64(file);
      // Compress if larger than 500KB (approx check on base64 length)
      const compressed = base64.length > 500 * 1024 * 1.33 ? await compressImage(base64) : base64;

      setProducts((prev) =>
        prev.map((p) => (p.model === productModel ? { ...p, image_url: compressed } : p))
      );
      toast.success("Imagen actualizada");
    } catch (err) {
      console.error("Error uploading image:", err);
      toast.error("Error al procesar imagen");
    } finally {
      setUploadingImages(prev => ({ ...prev, [productModel]: false }));
    }
  };

  const handleImageDrop = (productModel: string, e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const file = e.dataTransfer.files?.[0];
    if (file) handleImageUpload(productModel, file);
  };

  const handleRemoveImage = (productModel: string) => {
    setProducts((prev) =>
      prev.map((p) => (p.model === productModel ? { ...p, image_url: null } : p))
    );
  };

  const handleMappingConfirm = (mapping: Record<string, string>) => {
    if (!rawFileContent) return;

    try {
      const { products: mappedProducts, errors } = processRows(
        rawFileContent.rows,
        rawFileContent.headers,
        mapping
      );

      if (mappedProducts.length === 0) {
        setError("No se pudieron extraer productos con esa configuración");
        return;
      }

      setProducts(mappedProducts);
      setCurrentStep("images");
      toast.success(`${mappedProducts.length} productos procesados correctamente`);
    } catch (err) {
      console.error("Mapping error:", err);
      setError("Error al procesar el mapeo");
    }
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

      addCatalog({
        name: catalogName.trim(),
        category,
        products: products as any,
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
          className="w-full h-[300px] border-2 border-dashed border-cyan-500/50 rounded-xl hover:border-cyan-500 hover:bg-cyan-500/50 transition-all cursor-pointer group flex items-center justify-center"
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


  const renderMappingStep = () => (
    <div className="max-w-5xl mx-auto">
      <div className="glass-card p-8 border-gradient">
        <ColumnMapper
          data={rawFileContent?.rows || []}
          columnNames={rawFileContent?.headers || []}
          onConfirm={handleMappingConfirm}
        />
        <div className="mt-6 flex justify-start">
          <button
            onClick={() => setCurrentStep("upload")}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );


  const renderImagesStep = () => (
    <div className="max-w-6xl mx-auto">
      <div className="glass-card p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-foreground">
              Revisar Productos e Imágenes
            </h2>
            <p className="text-muted-foreground">
              {products.length} productos detectados. Verifica los datos y agrega imágenes.
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setViewMode("cards")}
            className={`px-4 py-2 rounded-lg transition-all ${viewMode === "cards"
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground hover:text-foreground"
              }`}
          >
            Tarjetas
          </button>
          <button
            onClick={() => setViewMode("grid")}
            className={`px-4 py-2 rounded-lg transition-all ${viewMode === "grid"
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground hover:text-foreground"
              }`}
          >
            Tabla de Datos
          </button>
          <button
            onClick={() => setCurrentStep("review")}
            className="btn-gaming rounded-lg ml-2"
          >
            Continuar
          </button>
        </div>
      </div>

      {viewMode === "grid" ? (
        <div className="mb-8">
          <ExcelDataGrid products={products as any} />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-8">
          {products.map((product, idx) => (
            <div
              key={product.model || idx}
              className="glass-card p-4 relative group"
              onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
              onDrop={(e) => handleImageDrop(product.model, e)}
            >
              {/* Image Area */}
              <div className="relative aspect-square mb-3 rounded-lg overflow-hidden bg-muted/30 border-2 border-transparent hover:border-primary/50 transition-colors">
                {uploadingImages[product.model] ? (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 z-10">
                    <Loader2 className="w-8 h-8 text-primary animate-spin" />
                    <span className="text-xs text-white mt-2">Procesando...</span>
                  </div>
                ) : null}

                {product.image_url ? (
                  <>
                    <img
                      src={product.image_url}
                      alt={product.model}
                      className="w-full h-full object-contain"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <label className="cursor-pointer p-2 rounded-full bg-primary text-primary-foreground hover:scale-110 transition-transform" title="Cambiar imagen">
                        <ImageIcon className="w-4 h-4" />
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          onChange={(e) => e.target.files?.[0] && handleImageUpload(product.model, e.target.files[0])}
                          className="hidden"
                        />
                      </label>
                      <button
                        onClick={() => handleRemoveImage(product.model)}
                        className="p-2 rounded-full bg-destructive text-destructive-foreground hover:scale-110 transition-transform"
                        title="Eliminar imagen"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </>
                ) : (
                  <label className="flex flex-col items-center justify-center h-full cursor-pointer hover:bg-muted/50 transition-colors">
                    <ImageIcon className="w-8 h-8 text-muted-foreground mb-2 group-hover:text-primary transition-colors" />
                    <span className="text-xs text-muted-foreground group-hover:text-foreground">
                      Agregar imagen
                    </span>
                    <span className="text-[10px] text-muted-foreground/50 mt-1">
                      (o arrastra aquí)
                    </span>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={(e) => e.target.files?.[0] && handleImageUpload(product.model, e.target.files[0])}
                      className="hidden"
                    />
                  </label>
                )}
              </div>

              {/* Product Info */}
              <h3 className="font-semibold text-foreground truncate text-sm" title={product.model}>
                {product.model}
              </h3>
              <p className="text-xs text-accent font-medium">
                {product.price !== null ? `$${product.price}` : "Consultar"}
              </p>
            </div>
          ))}
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
        <button
          onClick={() => setCurrentStep("review")}
          className="btn-gaming rounded-lg"
        >
          Revisar Catálogo
        </button>
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
              {products.filter((p) => p.image_url).length}
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

      <div className="max-w-6xl mx-auto relative z-10">
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
              Paso {currentStep === "upload" ? 1 : currentStep === "mapping" ? 2 : currentStep === "images" ? 2 : 3} de 3
            </p>
          </div>
        </header>

        {/* Progress Bar */}
        <div className="flex gap-2 mb-8">
          {["upload", "mapping", "images", "review"].map((step, i) => {
            // Skip displaying mapping dot if we skipped it
            if (step === "mapping" && currentStep !== "mapping" && !rawFileContent) return null;

            return (
              <div
                key={step}
                className={`flex-1 h-2 rounded-full transition-all ${["upload", "mapping", "images", "review"].indexOf(currentStep) >= i
                    ? "bg-primary glow-cyan"
                    : "bg-muted"
                  }`}
              />
            );
          })}
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
