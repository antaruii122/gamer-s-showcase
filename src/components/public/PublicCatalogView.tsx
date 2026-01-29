import { useState, useEffect } from "react";
import { useCatalog } from "@/contexts/CatalogContext";
import ParticleBackground from "./ParticleBackground";
import CategoryNav from "./CategoryNav";
import ProductCarousel from "./ProductCarousel";
import SearchBar from "./SearchBar";
import { Product } from "@/types/catalog";

const PublicCatalogView = () => {
    const { categories, getCatalogsByCategory, isLoading } = useCatalog();
    const [activeCategory, setActiveCategory] = useState<string>("");
    const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);

    // Initialize active category
    useEffect(() => {
        if (categories.length > 0 && !activeCategory) {
            setActiveCategory(categories[0]);
        }
    }, [categories, activeCategory]);

    const [searchQuery, setSearchQuery] = useState("");

    // Filter products when category or catalogs change
    useEffect(() => {
        if (activeCategory) {
            const catalogs = getCatalogsByCategory(activeCategory);
            let products = catalogs.flatMap((catalog) => catalog.products);

            // Apply search filter if query exists
            if (searchQuery.trim()) {
                const query = searchQuery.toLowerCase();
                products = products.filter(product => {
                    const modelMatch = product.modelo.toLowerCase().includes(query);
                    const specsMatch = Object.values(product.specs).some(value =>
                        value.toLowerCase().includes(query)
                    );
                    return modelMatch || specsMatch;
                });
            }

            setFilteredProducts(products);
        } else {
            setFilteredProducts([]);
        }
    }, [activeCategory, getCatalogsByCategory, searchQuery]);

    return (
        <div className="relative min-h-screen w-full overflow-x-hidden bg-[#0a0a0f] text-foreground flex flex-col">
            {/* Background */}
            <div className="fixed inset-0 z-0">
                <ParticleBackground />
            </div>

            {/* Content Container */}
            <div className="relative z-10 w-full max-w-[1400px] mx-auto flex-1 flex flex-col">

                {/* Header Section */}
                <header className="pt-10 pb-6 text-center px-4 md:px-10">
                    <h1 className="font-rajdhani font-bold text-4xl md:text-5xl lg:text-6xl text-primary text-glow-cyan mb-2 tracking-wide uppercase">
                        Gaming Catalog Pro
                    </h1>
                    <p className="text-muted-foreground text-lg md:text-xl font-light tracking-wider">
                        Catálogo de Productos Gaming
                    </p>
                </header>

                {/* Navigation */}
                <div className="mb-8 w-full sticky top-0 z-40 backdrop-blur-sm py-4">
                    <CategoryNav
                        activeCategory={activeCategory}
                        onCategoryChange={setActiveCategory}
                    />
                </div>

                {/* Search Bar */}
                <div className="w-full px-4 mb-4">
                    <SearchBar onSearch={setSearchQuery} />
                </div>

                {/* Main Content - Carousel */}
                <main className="flex-1 flex flex-col items-center justify-center w-full px-4 md:px-10 pb-20">
                    <div className="w-full">
                        <ProductCarousel
                            products={filteredProducts}
                            isLoading={isLoading}
                        />
                    </div>
                </main>

                {/* Footer info (Optional but nice for layout balance) */}
                <footer className="py-6 text-center text-muted-foreground/50 text-sm">
                    <p>© 2024 Gaming Catalog Pro. Todos los derechos reservados.</p>
                </footer>
            </div>
        </div>
    );
};

export default PublicCatalogView;
