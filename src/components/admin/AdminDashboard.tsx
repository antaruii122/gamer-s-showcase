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
  Upload,
  Settings,
  Menu,
  X,
} from "lucide-react";
import esgamingLogo from "@/assets/esgaming-logo.png";

type NavItem = "catalogs" | "upload" | "settings";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const { catalogs, categories, deleteCatalog } = useCatalog();
  const [activeNav, setActiveNav] = useState<NavItem>("catalogs");
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

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

  const navItems = [
    { id: "catalogs" as NavItem, label: "Mis Catálogos", icon: FolderOpen },
    { id: "upload" as NavItem, label: "Subir Nuevo", icon: Upload },
    { id: "settings" as NavItem, label: "Configuración", icon: Settings },
  ];

  const handleNavClick = (id: NavItem) => {
    setActiveNav(id);
    setSidebarOpen(false);
    if (id === "upload") {
      navigate("/admin/upload");
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 h-full w-[250px] z-50
          bg-[#0f0f1a] border-r border-primary/20
          flex flex-col
          transition-transform duration-300 ease-out
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
          md:translate-x-0 md:static
        `}
      >
        {/* Logo */}
        <div className="p-6 border-b border-primary/20">
          <Link to="/" className="flex items-center gap-3">
            <img
              src={esgamingLogo}
              alt="ESGaming"
              className="h-8 w-auto brightness-0 invert"
            />
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4">
          <ul className="space-y-2">
            {navItems.map((item) => (
              <li key={item.id}>
                <button
                  onClick={() => handleNavClick(item.id)}
                  className={`
                    w-full flex items-center gap-3 px-4 py-3 rounded-lg
                    font-medium transition-all duration-200
                    ${
                      activeNav === item.id
                        ? "bg-primary/20 text-primary glow-cyan"
                        : "text-muted-foreground hover:bg-muted/30 hover:text-foreground"
                    }
                  `}
                >
                  <item.icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </button>
              </li>
            ))}
          </ul>
        </nav>

        {/* Logout Button */}
        <div className="p-4 border-t border-primary/20">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-destructive hover:bg-destructive/20 transition-all duration-200"
          >
            <LogOut className="w-5 h-5" />
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-h-screen md:ml-0">
        {/* Top Bar */}
        <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-md border-b border-border px-4 md:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {/* Mobile Menu Button */}
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="md:hidden p-2 rounded-lg hover:bg-muted/50 text-foreground transition-colors"
              >
                {sidebarOpen ? (
                  <X className="w-6 h-6" />
                ) : (
                  <Menu className="w-6 h-6" />
                )}
              </button>

              <div>
                <h1 className="text-xl md:text-2xl font-bold text-foreground">
                  Panel de Administración
                </h1>
                <p className="text-sm text-muted-foreground hidden md:block">
                  Gestiona tus catálogos de productos
                </p>
              </div>
            </div>

            {/* Top Right Actions */}
            <div className="flex items-center gap-3">
              <Link
                to="/"
                className="hidden sm:inline-flex btn-gaming rounded-lg text-sm"
              >
                Ver Catálogo
              </Link>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive hover:text-destructive-foreground transition-all duration-200"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Cerrar Sesión</span>
              </button>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 p-4 md:p-8">
          {activeNav === "catalogs" && (
            <div className="max-w-5xl mx-auto">
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
                      <p className="text-sm text-muted-foreground">
                        Categorías
                      </p>
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
                    <h3 className="text-xl font-bold text-foreground mb-2">
                      Catálogos vacíos
                    </h3>
                    <p className="text-muted-foreground mb-4">
                      Sube tu primer catálogo para comenzar
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
                        className="p-4 flex items-center justify-between hover:bg-muted/30 transition-colors duration-200"
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
                            className="p-2 rounded-lg hover:bg-primary/20 text-muted-foreground hover:text-primary transition-colors duration-200"
                            title="Editar"
                          >
                            <Edit className="w-5 h-5" />
                          </Link>
                          <button
                            onClick={() => handleDelete(catalog.id)}
                            className={`p-2 rounded-lg transition-colors duration-200 ${
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
          )}

          {activeNav === "settings" && (
            <div className="max-w-5xl mx-auto">
              <div className="glass-card p-12 text-center">
                <Settings className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4" />
                <h3 className="text-xl font-bold text-foreground mb-2">
                  Configuración
                </h3>
                <p className="text-muted-foreground">
                  Próximamente - Opciones de configuración del sistema
                </p>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;
