import { useState } from "react";
import { Product } from "@/types/catalog";
import { Package, FileText, Image as ImageIcon, ChevronDown, ChevronUp } from "lucide-react";
import ProductGallery from "./ProductGallery";

interface ProductCardProps {
  product: Product;
  isActive?: boolean;
}

const ProductCard = ({ product, isActive = false }: ProductCardProps) => {
  const [isDetailedView, setIsDetailedView] = useState(false);
  const images = product.images || (product.image ? [product.image] : []);

  // Format specs for display
  const specEntries = Object.entries(product.specs);
  const displaySpecs = isDetailedView ? specEntries : specEntries.slice(0, 3);

  return (
    <div
      className={`glass-card h-full flex flex-col border-gradient transition-all duration-500 relative overflow-hidden
        ${isActive ? 'glow-cyan scale-100 opacity-100 ring-2 ring-primary/50' : 'opacity-60 scale-95 hover:opacity-100 hover:scale-100'} 
        group hover:glow-cyan`}
    >
      {/* Price Badge - Always Visible */}
      <div className="absolute top-4 right-4 z-20">
        <div className="bg-primary/90 text-primary-foreground px-3 py-1 rounded-full font-bold shadow-[0_0_15px_rgba(34,211,238,0.5)] border border-primary/50 backdrop-blur-md">
          {product.precioFOB}
        </div>
      </div>

      <div className="p-6 flex-1 flex flex-col">
        {/* Title */}
        <h3 className="text-xl font-bold text-foreground mb-4 pr-24 line-clamp-2 md:h-[3.5rem] flex items-center">
          {product.modelo}
        </h3>

        {/* Content Area */}
        <div className="flex-1 flex flex-col">
          {!isDetailedView ? (
            // GALLERY VIEW
            <div className="animate-in fade-in zoom-in-95 duration-300 flex-1 flex flex-col">
              <div className="relative w-full mb-4 flex-1 min-h-[200px]">
                {images.length > 0 ? (
                  <ProductGallery images={images} title={product.modelo} />
                ) : (
                  <div className="w-full h-64 rounded-xl bg-muted/30 flex flex-col items-center justify-center text-muted-foreground border border-white/5">
                    <Package className="w-16 h-16 mb-2 opacity-50" />
                    <span className="text-sm">Sin imágenes</span>
                  </div>
                )}
              </div>
              {/* Short Specs Preview */}
              <div className="space-y-1 mb-2">
                {displaySpecs.map(([key, value]) => (
                  <div key={key} className="flex justify-between text-xs text-muted-foreground">
                    <span>{key}:</span>
                    <span className="text-foreground font-medium truncate ml-2 max-w-[60%]">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            // DETAILED VIEW (Minimized Images)
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-300 flex-1 flex flex-col h-full">
              {/* Mini Image Strip */}
              {images.length > 0 && (
                <div className="flex gap-2 overflow-x-auto pb-2 mb-4 scrollbar-hide">
                  {images.map((img, idx) => (
                    <img key={idx} src={img} className="h-16 w-16 object-cover rounded-lg border border-white/10 flex-shrink-0" alt="Thumbnail" />
                  ))}
                </div>
              )}

              {/* Scrollable Description & Specs */}
              <div className="flex-1 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-primary/20 scrollbar-track-transparent max-h-[400px]">
                {product.descripcion && (
                  <div className="mb-6 bg-muted/20 p-3 rounded-lg border border-white/5">
                    <h4 className="text-sm font-semibold text-primary mb-2 flex items-center gap-2">
                      <FileText className="w-4 h-4" /> Descripción
                    </h4>
                    <p className="text-sm text-foreground/90 leading-relaxed whitespace-pre-wrap">
                      {product.descripcion}
                    </p>
                  </div>
                )}

                <div className="space-y-4">
                  <h4 className="text-sm font-semibold text-primary mb-2 border-b border-primary/20 pb-1">Especificaciones Técnicas</h4>
                  <div className="grid grid-cols-1 gap-2">
                    {Object.entries(product.specs).map(([key, value]) => (
                      <div key={key} className="grid grid-cols-3 gap-2 text-sm p-2 rounded hover:bg-white/5 transition-colors items-center">
                        <span className="text-muted-foreground font-medium col-span-1">{key}</span>
                        <span className="text-foreground col-span-2 border-l border-white/10 pl-2">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Toggle Button Footer */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsDetailedView(!isDetailedView);
          }}
          className="mt-4 w-full py-2.5 rounded-lg bg-muted/40 hover:bg-primary/20 text-foreground font-medium transition-all flex items-center justify-center gap-2 border border-white/5 hover:border-primary/50 group/btn"
        >
          {!isDetailedView ? (
            <>
              <FileText className="w-4 h-4 text-primary group-hover/btn:scale-110 transition-transform" />
              <span>Ver Descripción Completa</span>
              <ChevronDown className="w-4 h-4 opacity-50" />
            </>
          ) : (
            <>
              <ImageIcon className="w-4 h-4 text-primary group-hover/btn:scale-110 transition-transform" />
              <span>Ver Galería</span>
              <ChevronUp className="w-4 h-4 opacity-50" />
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default ProductCard;
