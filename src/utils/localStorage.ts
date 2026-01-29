import { AdminSession, Catalog, CatalogState, DEFAULT_CATEGORIES } from "@/types/catalog";

const STORAGE_KEYS = {
  ADMIN_SESSION: "gaming_catalog_admin_session",
  CATALOG_STATE: "gaming_catalog_state",
};

// Admin Session
export const getAdminSession = (): AdminSession | null => {
  try {
    const session = localStorage.getItem(STORAGE_KEYS.ADMIN_SESSION);
    if (!session) return null;

    const parsed: AdminSession = JSON.parse(session);

    // Check if session is expired
    if (new Date(parsed.expiry) < new Date()) {
      clearAdminSession();
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
};

export const setAdminSession = (): void => {
  const expiry = new Date();
  expiry.setHours(expiry.getHours() + 24); // 24 hour session

  const session: AdminSession = {
    loggedIn: true,
    expiry: expiry.toISOString(),
  };

  localStorage.setItem(STORAGE_KEYS.ADMIN_SESSION, JSON.stringify(session));
};

export const clearAdminSession = (): void => {
  localStorage.removeItem(STORAGE_KEYS.ADMIN_SESSION);
};

// Catalog State
export const getCatalogState = (): CatalogState => {
  try {
    const state = localStorage.getItem(STORAGE_KEYS.CATALOG_STATE);
    if (!state) {
      return {
        categories: DEFAULT_CATEGORIES,
        catalogs: [],
      };
    }
    return JSON.parse(state);
  } catch {
    return {
      categories: DEFAULT_CATEGORIES,
      catalogs: [],
    };
  }
};



export const addCatalog = (catalog: Catalog): void => {
  const state = getCatalogState();
  state.catalogs.push(catalog);
  saveCatalogState(state);
};

export const updateCatalog = (catalogId: string, updates: Partial<Catalog>): void => {
  const state = getCatalogState();
  const index = state.catalogs.findIndex((c) => c.id === catalogId);
  if (index !== -1) {
    state.catalogs[index] = {
      ...state.catalogs[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    saveCatalogState(state);
  }
};

export const deleteCatalog = (catalogId: string): void => {
  const state = getCatalogState();
  state.catalogs = state.catalogs.filter((c) => c.id !== catalogId);
  saveCatalogState(state);
};

export const addCategory = (category: string): void => {
  const state = getCatalogState();
  if (!state.categories.includes(category)) {
    state.categories.push(category);
    saveCatalogState(state);
  }
};

export const deleteCategory = (category: string): void => {
  const state = getCatalogState();
  state.categories = state.categories.filter((c) => c !== category);
  saveCatalogState(state);
};

export const generateId = (): string => {
  return `cat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

export const getStorageUsage = () => {
  let total = 0;
  for (const key in localStorage) {
    if (localStorage.hasOwnProperty(key)) {
      total += (localStorage[key].length + key.length) * 2;
    }
  }
  // Convert to MB
  const usedMB = (total / 1024 / 1024).toFixed(2);
  const maxMB = 5; // Typical browser limit
  return {
    used: total,
    usedMB,
    maxMB,
    percent: Math.min((total / (5 * 1024 * 1024)) * 100, 100).toFixed(1)
  };
};

const handleStorageError = (e: unknown) => {
  if (e instanceof DOMException &&
    (e.name === 'QuotaExceededError' || e.name === 'NS_ERROR_DOM_QUOTA_REACHED')) {
    throw new Error("No hay suficiente espacio. Elimina catálogos antiguos.");
  }
  throw e;
};

export const saveCatalogState = (state: CatalogState): void => {
  try {
    localStorage.setItem(STORAGE_KEYS.CATALOG_STATE, JSON.stringify(state));
  } catch (e) {
    handleStorageError(e);
  }
};
