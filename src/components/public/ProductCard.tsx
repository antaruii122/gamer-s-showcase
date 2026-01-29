import { Product } from "@/types/catalog";
import { Package } from "lucide-react";

interface ProductCardProps {
  product: Product;
  isActive?: boolean;
}

const ProductCard = ({ product, isActive = false }: ProductCardProps) => {
  const specEntries = Object.entries(product.specs).slice(0, 4);

  return (
    <div
      className={`glass-card p-6 h-full flex flex-col border-gradient transition-all duration-500
        ${isActive ? 'glow-cyan scale-100 opacity-100 ring-2 ring-primary/50' : 'opacity-60 scale-95 hover:opacity-100 hover:scale-100'} 
        group hover:glow-cyan`}
    >
      {/* Image Container */}
      <div className="relative w-full aspect-square mb-4 rounded-lg overflow-hidden bg-muted/30 flex items-center justify-center">
        {product.image ? (
          <img
            src={product.image}
            alt={product.modelo}
            loading="lazy"
            className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-110"
          />
        ) : (
          <div className="flex flex-col items-center justify-center text-muted-foreground">
            <Package className="w-16 h-16 mb-2 opacity-50" />
            <span className="text-sm">Sin imagen</span>
          </div>
        )}

        {/* Glow overlay on hover */}
        <div className="absolute inset-0 bg-gradient-to-t from-primary/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      </div>

      {/* Product Info */}
      <div className="flex-1 flex flex-col">
        {/* Model Name */}
        <h3 className="text-xl font-bold text-foreground mb-2 line-clamp-2 group-hover:text-primary transition-colors duration-300">
          {product.modelo}
        </h3>

        {/* Description */}
        {product.descripcion && (
          <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
            {product.descripcion}
          </p>
        )}

        {/* Specs */}
        {specEntries.length > 0 && (
          <div className="space-y-1 mb-4 flex-1">
            {specEntries.map(([key, value]) => (
              <div key={key} className="flex justify-between text-sm">
                <span className="text-muted-foreground">{key}:</span>
                <span className="text-foreground font-medium">{value}</span>
              </div>
            ))}
          </div>
        )}

        {/* Price */}
        <div className="mt-auto pt-4 border-t border-border">
          <div className="flex items-baseline justify-between">
            <span className="text-sm text-muted-foreground uppercase tracking-wider">
              Precio FOB
            </span>
            <span className="price-tag">{product.precioFOB}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
