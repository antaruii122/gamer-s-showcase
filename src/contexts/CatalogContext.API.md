# CatalogContext - Complete API Documentation

## Overview

The CatalogContext provides comprehensive state management for catalogs and categories with automatic localStorage persistence.

## State

```typescript
{
  catalogs: Catalog[];              // All catalogs
  categories: string[];             // Category names  
  selectedCategory: string | null;  // Currently selected category
  isLoading: boolean;               // Loading state
}
```

## Complete API

### Catalog Operations

- **addCatalog(catalog)** - Creates new catalog with auto-generated ID
- **updateCatalog(id, updates)** - Updates existing catalog
- **deleteCatalog(id)** - Removes catalog
- **getCatalogsByCategory(category)** - Filters catalogs by category
- **searchProducts(query)** - Full-text search across products

### Category Operations

- **addCategory(name)** - Adds new category (prevents duplicates)
- **deleteCategory(name)** - ⭐ **NEW** - Removes category

### localStorage

- **Key**: `gaming_catalog_state`
- **Auto-load**: On initialization
- **Auto-save**: On every update

## Usage

```tsx
import { useCatalog } from '@/contexts/CatalogContext';

const { catalogs, addCatalog, deleteCategory } = useCatalog();
```

## Enhancement

Added `deleteCategory` function to expose existing localStorage functionality in the context API.
