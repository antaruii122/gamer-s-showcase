import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useCatalog } from "@/contexts/CatalogContext";
import {
  Plus,
  LogOut,
  Trash2,
  Edit,
  Package,
  FolderOpen,
  Gamepad2,
} from "lucide-react";
import ParticleBackground from "@/components/public/ParticleBackground";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { logout, isAuthenticated } = useAuth();
  const { catalogs, categories, deleteCatalog } = useCatalog();
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  // Redirect if not authenticated
  if (!isAuthenticated) {
    navigate("/admin/login");
    return null;
  }

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const handleDelete = (catalogId: string) => {
    if (deleteConfirm === catalogId) {
      deleteCatalog(catalogId);
      setDeleteConfirm(null);
    } else {
      setDeleteConfirm(catalogId);
      // Reset after 3 seconds
      setTimeout(() => setDeleteConfirm(null), 3000);
    }
  };

  const getCatalogStats = () => {
    const totalProducts = catalogs.reduce(
      (sum, cat) => sum + cat.products.length,
      0
    );
    return {
      totalCatalogs: catalogs.length,
      totalProducts,
      totalCategories: categories.length,
    };
  };

  const stats = getCatalogStats();

  return (
    <div className="min-h-screen p-4 md:p-8">
      <ParticleBackground />

      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-gaming flex items-center justify-center glow-cyan">
              <Gamepad2 className="w-5 h-5 text-background" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                Panel de Administración
              </h1>
              <p className="text-sm text-muted-foreground">
                Gestiona tus catálogos de productos
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link to="/" className="btn-gaming rounded-lg text-sm">
              Ver Catálogo
            </Link>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive hover:text-destructive-foreground transition-all"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Cerrar Sesión</span>
            </button>
          </div>
        </header>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="glass-card p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center">
                <FolderOpen className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">
                  {stats.totalCatalogs}
                </p>
                <p className="text-sm text-muted-foreground">Catálogos</p>
              </div>
            </div>
          </div>

          <div className="glass-card p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-secondary/20 flex items-center justify-center">
                <Package className="w-6 h-6 text-secondary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">
                  {stats.totalProducts}
                </p>
                <p className="text-sm text-muted-foreground">Productos</p>
              </div>
            </div>
          </div>

          <div className="glass-card p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-accent/20 flex items-center justify-center">
                <span className="text-xl font-bold text-accent">#</span>
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">
                  {stats.totalCategories}
                </p>
                <p className="text-sm text-muted-foreground">Categorías</p>
              </div>
            </div>
          </div>
        </div>

        {/* Upload Button */}
        <div className="mb-6">
          <Link
            to="/admin/upload"
            className="inline-flex items-center gap-2 btn-gaming rounded-lg"
          >
            <Plus className="w-5 h-5" />
            Subir Nuevo Catálogo
          </Link>
        </div>

        {/* Catalogs List */}
        <div className="glass-card overflow-hidden">
          <div className="p-4 border-b border-border">
            <h2 className="text-lg font-semibold text-foreground">
              Mis Catálogos
            </h2>
          </div>

          {catalogs.length === 0 ? (
            <div className="p-12 text-center">
              <Package className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground mb-4">
                No tienes catálogos todavía
              </p>
              <Link
                to="/admin/upload"
                className="inline-flex items-center gap-2 btn-gaming-secondary rounded-lg"
              >
                <Plus className="w-4 h-4" />
                Subir tu primer catálogo
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {catalogs.map((catalog) => (
                <div
                  key={catalog.id}
                  className="p-4 flex items-center justify-between hover:bg-muted/30 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-foreground truncate">
                      {catalog.name}
                    </h3>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-xs px-2 py-1 rounded-full bg-primary/20 text-primary">
                        {catalog.category}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {catalog.products.length} productos
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 ml-4">
                    <Link
                      to={`/admin/edit/${catalog.id}`}
                      className="p-2 rounded-lg hover:bg-primary/20 text-muted-foreground hover:text-primary transition-colors"
                      title="Editar"
                    >
                      <Edit className="w-5 h-5" />
                    </Link>
                    <button
                      onClick={() => handleDelete(catalog.id)}
                      className={`p-2 rounded-lg transition-colors ${
                        deleteConfirm === catalog.id
                          ? "bg-destructive text-destructive-foreground"
                          : "hover:bg-destructive/20 text-muted-foreground hover:text-destructive"
                      }`}
                      title={
                        deleteConfirm === catalog.id
                          ? "Click de nuevo para confirmar"
                          : "Eliminar"
                      }
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
