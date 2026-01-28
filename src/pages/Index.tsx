import { useState, useMemo } from "react";
import { useCatalog } from "@/contexts/CatalogContext";
import { Product } from "@/types/catalog";
import Header from "@/components/public/Header";
import ParticleBackground from "@/components/public/ParticleBackground";
import CategoryNav from "@/components/public/CategoryNav";
import ProductCarousel from "@/components/public/ProductCarousel";
import SearchBar from "@/components/public/SearchBar";

const Index = () => {
  const { catalogs, selectedCategory, isLoading } = useCatalog();
  const [searchQuery, setSearchQuery] = useState("");

  const filteredProducts = useMemo(() => {
    let products: Product[] = [];

    // Get products from selected category
    if (selectedCategory) {
      const categoryCatalogs = catalogs.filter(
        (c) => c.category === selectedCategory
      );
      products = categoryCatalogs.flatMap((c) => c.products);
    } else {
      products = catalogs.flatMap((c) => c.products);
    }

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      products = products.filter((product) => {
        const modelMatch = product.modelo.toLowerCase().includes(query);
        const descMatch = product.descripcion?.toLowerCase().includes(query);
        const specsMatch = Object.values(product.specs).some((v) =>
          v.toLowerCase().includes(query)
        );
        return modelMatch || descMatch || specsMatch;
      });
    }

    return products;
  }, [catalogs, selectedCategory, searchQuery]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <ParticleBackground />
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-muted-foreground">Cargando catálogo...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <ParticleBackground />

      {/* Header */}
      <Header />

      {/* Main Content */}
      <main className="flex-1 flex flex-col">
        {/* Category Navigation */}
        <CategoryNav />

        {/* Search Bar */}
        <div className="px-4 py-4">
          <SearchBar onSearch={setSearchQuery} />
        </div>

        {/* Product Carousel */}
        <div className="flex-1 px-4">
          {catalogs.length === 0 ? (
            <div className="flex items-center justify-center h-[400px]">
              <div className="glass-card p-8 text-center max-w-md">
                <div className="w-16 h-16 rounded-2xl bg-primary/20 flex items-center justify-center mx-auto mb-4">
                  <span className="text-3xl">🎮</span>
                </div>
                <h2 className="text-xl font-bold text-foreground mb-2">
                  ¡Bienvenido a Gaming Catalog Pro!
                </h2>
                <p className="text-muted-foreground mb-4">
                  Aún no hay productos en el catálogo. Los administradores
                  pueden subir catálogos desde Excel.
                </p>
                <a href="/admin/login" className="btn-gaming rounded-lg inline-block">
                  Acceder como Admin
                </a>
              </div>
            </div>
          ) : (
            <ProductCarousel products={filteredProducts} />
          )}
        </div>

        {/* Footer */}
        <footer className="py-6 text-center">
          <p className="text-sm text-muted-foreground">
            © 2024 Gaming Catalog Pro • Catálogo B2B de Hardware Gaming
          </p>
        </footer>
      </main>
    </div>
  );
};

export default Index;
