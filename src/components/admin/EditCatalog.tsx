import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useCatalog } from "@/contexts/CatalogContext";
import { Product, Catalog } from "@/types/catalog";
import { imageToBase64, compressImage } from "@/utils/excelParser";
import {
  ArrowLeft,
  Save,
  Trash2,
  Image as ImageIcon,
  X,
  Plus,
} from "lucide-react";
import ParticleBackground from "@/components/public/ParticleBackground";
import { generateId } from "@/utils/localStorage";

const EditCatalog = () => {
  const navigate = useNavigate();
  const { catalogId } = useParams<{ catalogId: string }>();
  const { isAuthenticated } = useAuth();
  const { catalogs, categories, updateCatalog, addCategory } = useCatalog();

  const [catalog, setCatalog] = useState<Catalog | null>(null);
  const [catalogName, setCatalogName] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [newCategory, setNewCategory] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/admin/login");
      return;
    }
    
    const found = catalogs.find((c) => c.id === catalogId);
    if (found) {
      setCatalog(found);
      setCatalogName(found.name);
      setSelectedCategory(found.category);
      setProducts([...found.products]);
    } else if (catalogId) {
      navigate("/admin/dashboard");
    }
  }, [catalogId, catalogs, navigate, isAuthenticated]);

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

  const handleRemoveProduct = (productId: string) => {
    setProducts((prev) => prev.filter((p) => p.id !== productId));
  };

  const handleAddProduct = () => {
    const newProduct: Product = {
      id: generateId(),
      modelo: "Nuevo Producto",
      precioFOB: "USD 0.00",
      specs: {},
    };
    setProducts((prev) => [...prev, newProduct]);
  };

  const handleUpdateProduct = (productId: string, updates: Partial<Product>) => {
    setProducts((prev) =>
      prev.map((p) => (p.id === productId ? { ...p, ...updates } : p))
    );
  };

  const handleSave = () => {
    const category = newCategory.trim() || selectedCategory;

    if (!catalogName.trim()) {
      setError("El nombre del catálogo es requerido");
      return;
    }

    if (!category) {
      setError("Debes seleccionar o crear una categoría");
      return;
    }

    setIsSaving(true);

    // Add new category if needed
    if (newCategory.trim()) {
      addCategory(newCategory.trim());
    }

    // Update catalog
    updateCatalog(catalogId!, {
      name: catalogName.trim(),
      category,
      products,
    });

    setTimeout(() => {
      setIsSaving(false);
      navigate("/admin/dashboard");
    }, 500);
  };

  if (!catalog) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-muted-foreground">Cargando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-8">
      <ParticleBackground />

      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <header className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate("/admin/dashboard")}
              className="p-2 rounded-lg hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                Editar Catálogo
              </h1>
              <p className="text-sm text-muted-foreground">
                {products.length} productos
              </p>
            </div>
          </div>

          <button
            onClick={handleSave}
            disabled={isSaving}
            className="btn-gaming rounded-lg flex items-center gap-2"
          >
            {isSaving ? (
              <span className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
            ) : (
              <Save className="w-5 h-5" />
            )}
            Guardar Cambios
          </button>
        </header>

        {/* Catalog Details */}
        <div className="glass-card p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Nombre del Catálogo
              </label>
              <input
                type="text"
                value={catalogName}
                onChange={(e) => setCatalogName(e.target.value)}
                className="w-full px-4 py-3 rounded-lg bg-muted/50 border border-border text-foreground focus:outline-none focus:border-primary transition-all"
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

          {error && (
            <div className="mt-4 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
              {error}
            </div>
          )}
        </div>

        {/* Products Grid */}
        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-foreground">Productos</h2>
            <button
              onClick={handleAddProduct}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground transition-all"
            >
              <Plus className="w-4 h-4" />
              Agregar Producto
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {products.map((product) => (
              <div key={product.id} className="glass-card p-4 relative group">
                {/* Delete Button */}
                <button
                  onClick={() => handleRemoveProduct(product.id)}
                  className="absolute -top-2 -right-2 p-1.5 rounded-full bg-destructive text-destructive-foreground opacity-0 group-hover:opacity-100 hover:scale-110 transition-all z-10"
                >
                  <Trash2 className="w-4 h-4" />
                </button>

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

                {/* Editable Fields */}
                <input
                  type="text"
                  value={product.modelo}
                  onChange={(e) =>
                    handleUpdateProduct(product.id, { modelo: e.target.value })
                  }
                  className="w-full px-2 py-1 rounded bg-muted/30 border border-transparent focus:border-primary text-foreground text-sm font-semibold mb-2 focus:outline-none"
                  placeholder="Modelo"
                />
                <input
                  type="text"
                  value={product.precioFOB}
                  onChange={(e) =>
                    handleUpdateProduct(product.id, { precioFOB: e.target.value })
                  }
                  className="w-full px-2 py-1 rounded bg-muted/30 border border-transparent focus:border-primary text-accent text-sm font-medium focus:outline-none"
                  placeholder="Precio FOB"
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditCatalog;
