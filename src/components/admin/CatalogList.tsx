import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Edit, Trash2, Package, Plus } from "lucide-react";
import { useCatalog } from "@/contexts/CatalogContext";
import ConfirmModal from "@/components/shared/ConfirmModal";
import { toast } from "sonner";

const CatalogList = () => {
    const { catalogs, deleteCatalog } = useCatalog();
    const navigate = useNavigate();

    // Date formatter
    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString("es-ES", {
            day: "numeric",
            month: "short",
            year: "numeric",
        });
    };

    if (catalogs.length === 0) {
        return (
            <div className="glass-card p-12 text-center flex flex-col items-center justify-center min-h-[400px]">
                <Package className="w-16 h-16 text-muted-foreground/50 mb-4" />
                <h3 className="text-xl font-bold text-foreground mb-2">
                    No hay catálogos
                </h3>
                <p className="text-muted-foreground mb-6">
                    Sube tu primer catálogo para comenzar
                </p>
                <Link
                    to="/admin/upload"
                    className="inline-flex items-center gap-2 btn-gaming rounded-lg"
                >
                    <Plus className="w-5 h-5" />
                    Subir Catálogo
                </Link>
            </div>
        );
    }

    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [catalogToDelete, setCatalogToDelete] = useState<string | null>(null);

    const handleDeleteClick = (catalogId: string) => {
        setCatalogToDelete(catalogId);
        setDeleteModalOpen(true);
    };

    const handleConfirmDelete = () => {
        if (catalogToDelete) {
            deleteCatalog(catalogToDelete);
            toast.success("Catálogo eliminado correctamente");
            setDeleteModalOpen(false);
            setCatalogToDelete(null);
        }
    };

    return (
        <>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {catalogs.map((catalog) => (
                    <div
                        key={catalog.id}
                        className="relative group flex flex-col p-6 rounded-xl transition-all duration-200 ease-out hover:-translate-y-1 hover:shadow-[0_0_20px_hsla(185,96%,46%,0.2)] bg-[#0f0f1a]/90 border border-border"
                    >
                        {/* Header: Category & Date */}
                        <div className="flex justify-between items-start mb-4">
                            <span className="font-bold text-lg text-primary uppercase tracking-wide">
                                {catalog.category}
                            </span>
                            <span className="text-xs text-muted-foreground bg-muted/30 px-2 py-1 rounded-full">
                                {formatDate(catalog.createdAt)}
                            </span>
                        </div>

                        {/* Catalog Name */}
                        <h3 className="text-xl font-semibold text-foreground mb-2 truncate">
                            {catalog.name}
                        </h3>

                        {/* Product Count */}
                        <div className="flex items-center gap-2 mb-6 text-muted-foreground">
                            <Package className="w-4 h-4" />
                            <span>{catalog.products.length} productos</span>
                        </div>

                        {/* Actions - Pushed to bottom */}
                        <div className="mt-auto grid grid-cols-2 gap-3">
                            <button
                                onClick={() => navigate(`/admin/edit/${catalog.id}`)}
                                className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-primary/10 text-primary border border-primary/50 hover:bg-primary hover:text-primary-foreground transition-all duration-200 font-medium"
                            >
                                <Edit className="w-4 h-4" />
                                Editar
                            </button>
                            <button
                                onClick={() => handleDeleteClick(catalog.id)}
                                className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-destructive/10 text-destructive border border-destructive/50 hover:bg-destructive hover:text-destructive-foreground transition-all duration-200 font-medium"
                            >
                                <Trash2 className="w-4 h-4" />
                                Eliminar
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            <ConfirmModal
                isOpen={deleteModalOpen}
                title="¿Eliminar catálogo?"
                message="Esta acción no se puede deshacer. El catálogo y todos sus productos serán eliminados permanentemente."
                onConfirm={handleConfirmDelete}
                onCancel={() => setDeleteModalOpen(false)}
            />
        </>
    );
};

export default CatalogList;
