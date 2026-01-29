import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { Catalog, CatalogState, DEFAULT_CATEGORIES } from "@/types/catalog";
import {
  getCatalogState,
  saveCatalogState,
  addCatalog as addCatalogToStorage,
  updateCatalog as updateCatalogInStorage,
  deleteCatalog as deleteCatalogFromStorage,
  addCategory as addCategoryToStorage,
  deleteCategory as deleteCategoryFromStorage,
  generateId,
} from "@/utils/localStorage";

interface CatalogContextType {
  catalogs: Catalog[];
  categories: string[];
  selectedCategory: string | null;
  setSelectedCategory: (category: string | null) => void;
  addCatalog: (catalog: Omit<Catalog, "id" | "createdAt" | "updatedAt">) => Catalog;
  updateCatalog: (catalogId: string, updates: Partial<Catalog>) => void;
  deleteCatalog: (catalogId: string) => void;
  addCategory: (category: string) => void;
  deleteCategory: (category: string) => void;
  getCatalogsByCategory: (category: string) => Catalog[];
  searchProducts: (query: string) => Catalog[];
  isLoading: boolean;
}

const CatalogContext = createContext<CatalogContextType | undefined>(undefined);

export const CatalogProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, setState] = useState<CatalogState>({
    categories: DEFAULT_CATEGORIES,
    catalogs: [],
  });
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const savedState = getCatalogState();
    setState(savedState);
    if (savedState.categories.length > 0) {
      setSelectedCategory(savedState.categories[0]);
    }
    setIsLoading(false);
  }, []);

  const addCatalog = (catalogData: Omit<Catalog, "id" | "createdAt" | "updatedAt">) => {
    const now = new Date().toISOString();
    const newCatalog: Catalog = {
      ...catalogData,
      id: generateId(),
      createdAt: now,
      updatedAt: now,
    };

    addCatalogToStorage(newCatalog);
    setState((prev) => ({
      ...prev,
      catalogs: [...prev.catalogs, newCatalog],
    }));

    return newCatalog;
  };

  const updateCatalog = (catalogId: string, updates: Partial<Catalog>) => {
    updateCatalogInStorage(catalogId, updates);
    setState((prev) => ({
      ...prev,
      catalogs: prev.catalogs.map((c) =>
        c.id === catalogId
          ? { ...c, ...updates, updatedAt: new Date().toISOString() }
          : c
      ),
    }));
  };

  const deleteCatalog = (catalogId: string) => {
    deleteCatalogFromStorage(catalogId);
    setState((prev) => ({
      ...prev,
      catalogs: prev.catalogs.filter((c) => c.id !== catalogId),
    }));
  };

  const addCategory = (category: string) => {
    if (!state.categories.includes(category)) {
      addCategoryToStorage(category);
      setState((prev) => ({
        ...prev,
        categories: [...prev.categories, category],
      }));
    }
  };

  const deleteCategory = (category: string) => {
    deleteCategoryFromStorage(category);
    setState((prev) => ({
      ...prev,
      categories: prev.categories.filter((c) => c !== category),
    }));
  };

  const getCatalogsByCategory = (category: string) => {
    return state.catalogs.filter((c) => c.category === category);
  };

  const searchProducts = (query: string): Catalog[] => {
    if (!query.trim()) return state.catalogs;

    const lowerQuery = query.toLowerCase();

    return state.catalogs.map((catalog) => ({
      ...catalog,
      products: catalog.products.filter((product) => {
        const modelMatch = product.modelo.toLowerCase().includes(lowerQuery);
        const descMatch = product.descripcion?.toLowerCase().includes(lowerQuery);
        const specsMatch = Object.values(product.specs).some((v) =>
          v.toLowerCase().includes(lowerQuery)
        );
        return modelMatch || descMatch || specsMatch;
      }),
    })).filter((catalog) => catalog.products.length > 0);
  };

  return (
    <CatalogContext.Provider
      value={{
        catalogs: state.catalogs,
        categories: state.categories,
        selectedCategory,
        setSelectedCategory,
        addCatalog,
        updateCatalog,
        deleteCatalog,
        addCategory,
        deleteCategory,
        getCatalogsByCategory,
        searchProducts,
        isLoading,
      }}
    >
      {children}
    </CatalogContext.Provider>
  );
};

export const useCatalog = () => {
  const context = useContext(CatalogContext);
  if (context === undefined) {
    throw new Error("useCatalog must be used within a CatalogProvider");
  }
  return context;
};
