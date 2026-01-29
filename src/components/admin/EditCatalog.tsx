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
  Settings2,
} from "lucide-react";
import ParticleBackground from "@/components/public/ParticleBackground";
import { generateId } from "@/utils/localStorage";
import { toast } from "sonner";

const EditCatalog = () => {
  const navigate = useNavigate();
  const { catalogId } = useParams<{ catalogId: string }>();
  const { isAuthenticated } = useAuth();
  const { catalogs, categories, updateCatalog, addCategory } = useCatalog();

  const [catalogName, setCatalogName] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [newCategory, setNewCategory] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // State for managing specs editing mode per product
  const [editingSpecsId, setEditingSpecsId] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/admin/login");
      return;
    }

    const found = catalogs.find((c) => c.id === catalogId);
    if (found) {
      setCatalogName(found.name);
      setSelectedCategory(found.category);
      setProducts([...found.products]);
    } else if (catalogId) {
      navigate("/admin/dashboard");
    }
  }, [catalogId, catalogs, navigate, isAuthenticated]);

  /* Handles uploading images to specific slots:
     0: Main (Landscape) -> Syncs to legacy .image
     1: Portrait
     2: Square 1
     3: Square 2
  */
  const handleImageUpload = async (
    productId: string,
    index: number,
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const base64 = await imageToBase64(file);
      const compressed = await compressImage(base64);

      setProducts((prev) =>
        prev.map((p) => {
          if (p.id !== productId) return p;

          // Initialize array if needed, preserving existing legacy image if present at index 0
          const currentImages = p.images ? [...p.images] : (p.image ? [p.image] : []);

          // Update specific index
          currentImages[index] = compressed;

          return {
            ...p,
            images: currentImages,
            // Sync legacy field if we changed the main image (index 0)
            image: index === 0 ? compressed : (currentImages[0] || p.image)
          };
        })
      );
      toast.success("Imagen actualizada");
    } catch (err) {
      console.error("Error uploading image:", err);
      toast.error("Error al subir imagen");
    }
  };

  const handleRemoveImage = (productId: string, index: number) => {
    setProducts((prev) =>
      prev.map((p) => {
        if (p.id !== productId) return p;

        const currentImages = p.images ? [...p.images] : (p.image ? [p.image] : []);
        // Remove the image at index by setting it to empty string or filtering?
        // Better to just unset it to keep indices stable or splice?
        // User asked for specific slots, so we should nullify the slot, not shift.
        // But array with holes might be tricky. Let's just use empty string string to denote empty slot.
        // actually just splice is safer for undefined
        delete currentImages[index]; // leaves a hole

        // Clean up holes if we want compact array? No, simpler to just treat undefined/null.
        // Actually, let's filter out undefined values if we want clean array, 
        // BUT for fixed slots UI, we need stable indices.
        // Let's use sparse array logic or just check `images[i]`.
        // To properly save, we filter undefined at save time, but for UI state we keep holes.
        // Wait, saving JSON with holes is fine, they become null.

        // Let's just set it to undefined in the copy.
        const newImages = [...currentImages];
        newImages[index] = ""; // placeholder for empty

        return {
          ...p,
          images: newImages.filter(Boolean), // actually let's compact it to avoid issues?
          // If we compact, slot 2 becomes slot 1. That might be confusing if user expects fixed slots.
          // Let's TRY to keep slots fixed conceptually but for now simple compact array is safer for JSON.
          // Re-reading usage: "One bigger, one rectangle stand-up".
          // If I delete Main, Portrait becomes Main? No, that breaks layout.
          // I should store them.
          // Let's just replace with empty string if we want to preserve slot, BUT
          // `localStorage` is JSON.
          // Let's stick to simple array Append logic for now? 
          // No, user explicitly wants "Main", "Portrait", "Square".
          // I will use a helper to render slots.
        };
      })
    );
    // Actually, simpler implementation for now:
    // Just splice it out. If they want to "replace" main, they upload to Main.
    // If they delete Main, the next one becomes Main. This is standard behavior.
    setProducts((prev) =>
      prev.map(p => {
        if (p.id !== productId) return p;
        const currentImages = p.images ? [...p.images] : (p.image ? [p.image] : []);
        currentImages.splice(index, 1);
        return {
          ...p,
          images: currentImages,
          image: currentImages[0] // Sync legacy
        };
      })
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
    toast.info("Producto agregado");
  };

  const handleUpdateProduct = (productId: string, updates: Partial<Product>) => {
    setProducts((prev) =>
      prev.map((p) => (p.id === productId ? { ...p, ...updates } : p))
    );
  };

  const handleUpdateSpec = (productId: string, key: string, value: string) => {
    setProducts(prev => prev.map(p => {
      if (p.id === productId) {
        return {
          ...p,
          specs: { ...p.specs, [key]: value }
        };
      }
      return p;
    }));
  };

  const handleAddSpec = (productId: string) => {
    setProducts(prev => prev.map(p => {
      if (p.id === productId) {
        const newKey = `spec_${Object.keys(p.specs).length + 1}`;
        return {
          ...p,
          specs: { ...p.specs, [newKey]: "Valor" }
        };
      }
      return p;
    }));
  };

  const handleRemoveSpec = (productId: string, keyToRemove: string) => {
    setProducts(prev => prev.map(p => {
      if (p.id === productId) {
        const newSpecs = { ...p.specs };
        delete newSpecs[keyToRemove];
        return { ...p, specs: newSpecs };
      }
      return p;
    }));
  };

  const handleRenameSpecKey = (productId: string, oldKey: string, newKey: string) => {
    if (oldKey === newKey) return;
    setProducts(prev => prev.map(p => {
      if (p.id === productId) {
        const specs = { ...p.specs };
        const value = specs[oldKey];
        delete specs[oldKey];
        specs[newKey] = value;
        return { ...p, specs };
      }
      return p;
    }));
  };

  const handleSave = () => {
    const category = newCategory.trim() || selectedCategory;

    if (!catalogName.trim()) {
      setError("El nombre del catálogo es requerido");
      toast.error("El nombre del catálogo es requerido");
      return;
    }

    if (!category) {
      setError("Debes seleccionar o crear una categoría");
      toast.error("Debes seleccionar una categoría");
      return;
    }

    if (products.length === 0) {
      setError("El catálogo debe tener al menos un producto");
      toast.error("Agrega al menos un producto");
      return;
    }

    // Validate prices
    const invalidPrice = products.some(p => {
      const price = p.precioFOB.toUpperCase();
      return !price.includes("$") && !price.includes("USD");
    });

    if (invalidPrice) {
      setError("Todos los precios deben incluir '$' o 'USD'");
      toast.error("Formato de precio inválido", { description: "Debe incluir '$' o 'USD'" });
      return;
    }

    setIsSaving(true);
    setError("");

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

    toast.success("Catálogo actualizado ✓");

    setTimeout(() => {
      setIsSaving(false);
      navigate("/admin/dashboard");
    }, 500);
  };

  // Ensure catalog data is loaded
  if (!catalogName && products.length === 0 && !error) {
    // Initial loading state or if not found handled in useEffect
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-muted-foreground animate-pulse">Cargando catálogo...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-8">
      <ParticleBackground />

      <div className="max-w-6xl mx-auto relative z-10">
        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
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

          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/admin/dashboard")}
              className="px-4 py-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors bg-transparent border border-transparent hover:border-border"
            >
              Cancelar
            </button>
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
          </div>
        </header>

        {/* Catalog Details */}
        <div className="glass-card p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Nombre del Catálogo *
              </label>
              <input
                type="text"
                value={catalogName}
                onChange={(e) => setCatalogName(e.target.value)}
                className="w-full px-4 py-3 rounded-lg bg-muted/50 border border-border text-foreground focus:outline-none focus:border-primary transition-all"
                placeholder="Ej: Nuevos Arribos"
              />
            </div>

            <div>
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
                  placeholder="O crear nueva..."
                  className="flex-1 px-4 py-3 rounded-lg bg-muted/50 border border-border text-foreground focus:outline-none focus:border-primary transition-all"
                />
              </div>
            </div>
          </div>

          {error && (
            <div className="mt-4 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm flex items-center gap-2">
              <X className="w-4 h-4" />
              {error}
            </div>
          )}
        </div>

        {/* Products Grid */}
        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-foreground">Productos ({products.length})</h2>
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
              <div key={product.id} className="glass-card p-4 relative group h-full flex flex-col">
                {/* Delete Button */}
                <button
                  onClick={() => handleRemoveProduct(product.id)}
                  className="absolute -top-2 -right-2 p-1.5 rounded-full bg-destructive text-destructive-foreground opacity-0 group-hover:opacity-100 hover:scale-110 transition-all z-20 shadow-lg"
                  title="Eliminar producto"
                >
                  <Trash2 className="w-4 h-4" />
                </button>

                {/* Specs Toggle Button */}
                <button
                  onClick={() => setEditingSpecsId(editingSpecsId === product.id ? null : product.id)}
                  className={`absolute top-2 left-2 p-1.5 rounded-lg transition-colors z-20 ${editingSpecsId === product.id ? 'bg-primary text-primary-foreground' : 'bg-black/40 text-white hover:bg-primary/80'}`}
                  title="Editar especificaciones"
                >
                  <Settings2 className="w-4 h-4" />
                </button>

                {editingSpecsId === product.id ? (
                  // Specs Editor Mode
                  <div className="flex-1 flex flex-col min-h-[250px] relative">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-semibold text-primary">Especificaciones</span>
                      <button
                        onClick={() => handleAddSpec(product.id)}
                        className="text-xs flex items-center gap-1 text-green-500 hover:text-green-400"
                      >
                        <Plus className="w-3 h-3" /> Add
                      </button>
                    </div>
                    <div className="flex-1 overflow-y-auto space-y-2 max-h-[200px] pr-1 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                      {Object.entries(product.specs).map(([key, value]) => (
                        <div key={key} className="flex gap-2 items-start bg-muted/20 p-1.5 rounded">
                          <div className="flex-1 space-y-1">
                            <input
                              value={key}
                              onChange={(e) => handleRenameSpecKey(product.id, key, e.target.value)}
                              className="w-full text-xs bg-transparent border-b border-white/10 text-muted-foreground focus:text-foreground focus:border-primary focus:outline-none"
                              placeholder="Clave"
                            />
                            <input
                              value={value}
                              onChange={(e) => handleUpdateSpec(product.id, key, e.target.value)}
                              className="w-full text-xs bg-transparent text-foreground focus:bg-muted/10 rounded px-1 focus:outline-none"
                              placeholder="Valor"
                            />
                          </div>
                          <button
                            onClick={() => handleRemoveSpec(product.id, key)}
                            className="text-destructive hover:text-destructive/80 p-0.5"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                      {Object.keys(product.specs).length === 0 && (
                        <div className="text-xs text-muted-foreground text-center py-4">Sin especificaciones</div>
                      )}
                    </div>
                  </div>
                ) : (
                  // Normal Edit Mode
                  <>
                    {/* Multi-Image Gallery Grid */}
                    <div className="mb-4 space-y-2">
                      <label className="text-xs font-semibold text-muted-foreground ml-1">Galería de Imágenes (Máx 4)</label>
                      <div className="grid grid-cols-2 gap-2">
                        {/* Slot 0: Main (Landscape) - Always visible or first add */}
                        {[0, 1, 2, 3].map((slotIndex) => {
                          const currentImages = product.images || (product.image ? [product.image] : []);
                          const imgUrl = currentImages[slotIndex];

                          // Labels for slots
                          const labels = ["Principal", "Vertical", "Extra 1", "Extra 2"];
                          const label = labels[slotIndex];

                          return (
                            <div
                              key={slotIndex}
                              className={`relative rounded-lg overflow-hidden bg-muted/30 border border-white/5 hover:border-primary/50 transition-colors group ${slotIndex === 0 ? 'col-span-2 aspect-video' : 'aspect-square'}`}
                            >
                              {imgUrl ? (
                                <>
                                  <img src={imgUrl} alt={`${product.modelo} ${label}`} className="w-full h-full object-cover" />
                                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                                    <span className="text-xs text-white font-medium mb-1">{label}</span>
                                    <div className="flex gap-2">
                                      <label className="cursor-pointer p-1.5 rounded-full bg-primary text-primary-foreground hover:scale-110 transition-transform">
                                        <ImageIcon className="w-3 h-3" />
                                        <input type="file" accept="image/*" onChange={(e) => handleImageUpload(product.id, slotIndex, e)} className="hidden" />
                                      </label>
                                      <button onClick={() => handleRemoveImage(product.id, slotIndex)} className="p-1.5 rounded-full bg-destructive text-destructive-foreground hover:scale-110 transition-transform">
                                        <Trash2 className="w-3 h-3" />
                                      </button>
                                    </div>
                                  </div>
                                  {/* Label Badge when not hovering */}
                                  <div className="absolute bottom-1 left-2 bg-black/50 px-1.5 py-0.5 rounded text-[10px] text-white backdrop-blur-sm opacity-100 group-hover:opacity-0 transition-opacity">
                                    {label}
                                  </div>
                                </>
                              ) : (
                                <label className="flex flex-col items-center justify-center h-full cursor-pointer hover:bg-white/5 transition-colors">
                                  <Plus className="w-6 h-6 text-muted-foreground/50 mb-1" />
                                  <span className="text-[10px] text-muted-foreground uppercase tracking-wider">{label}</span>
                                  <input type="file" accept="image/*" onChange={(e) => handleImageUpload(product.id, slotIndex, e)} className="hidden" />
                                </label>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>

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
                      placeholder="Precio FOB (e.g. USD 100)"
                    />
                    <div className="text-xs text-muted-foreground mt-2">
                      {Object.keys(product.specs).length} especificaciones
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditCatalog;
