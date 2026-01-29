export interface Product {
  id: string;
  modelo: string;
  precioFOB: string;
  descripcion?: string;
  specs: Record<string, string>;
  image?: string;
  images?: string[]; // Support for multiple images: [Main, Portrait, Square1, Square2...]
}

export interface Catalog {
  id: string;
  name: string;
  category: string;
  products: Product[];
  createdAt: string;
  updatedAt: string;
}

export interface AdminSession {
  loggedIn: boolean;
  expiry: string;
}

export interface CatalogState {
  categories: string[];
  catalogs: Catalog[];
}

export const DEFAULT_CATEGORIES = [
  "Gabinetes",
  "Teclados",
  "Ratones",
  "Monitores",
  "Auriculares",
  "Sillas Gaming",
  "Accesorios",
];

export const ADMIN_CREDENTIALS = {
  email: "rcgiroz@gmail.com",
  password: "Pepe1234$",
};
