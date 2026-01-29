import { useRef } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { EffectCoverflow, Navigation, A11y } from "swiper/modules";
import { Swiper as SwiperType } from "swiper";
import { ChevronLeft, ChevronRight, PackageX, Loader2 } from "lucide-react";
import { Product } from "@/types/catalog";
import ProductCard from "./ProductCard";
import { Skeleton } from "@/components/ui/skeleton";

// Swiper styles
import "swiper/css";
import "swiper/css/effect-coverflow";
import "swiper/css/navigation";

interface ProductCarouselProps {
  products: Product[];
  isLoading?: boolean;
}

const ProductCarousel = ({ products, isLoading = false }: ProductCarouselProps) => {
  const swiperRef = useRef<SwiperType>();

  if (isLoading) {
    return (
      <div className="w-full h-[500px] flex items-center justify-center gap-4 overflow-hidden py-10">
        <div className="hidden md:block opacity-50 scale-75 transform -rotate-12">
          <Skeleton className="w-[300px] h-[400px] rounded-xl" />
        </div>
        <div className="z-10 relative">
          <Skeleton className="w-[350px] h-[450px] rounded-xl shadow-lg shadow-primary/20" />
          <div className="absolute inset-0 flex items-center justify-center">
            <Loader2 className="w-10 h-10 text-primary/50 animate-spin" />
          </div>
        </div>
        <div className="hidden md:block opacity-50 scale-75 transform rotate-12">
          <Skeleton className="w-[300px] h-[400px] rounded-xl" />
        </div>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="w-full h-[400px] flex flex-col items-center justify-center text-center p-8 border border-dashed border-muted rounded-xl bg-muted/10 mx-auto max-w-4xl my-10">
        <PackageX className="w-16 h-16 text-muted-foreground mb-4 opacity-50" />
        <h3 className="text-xl font-bold text-foreground mb-2">
          No se encontraron productos
        </h3>
        <p className="text-muted-foreground max-w-sm">
          No hay productos disponibles en esta categoría por el momento.
        </p>
      </div>
    );
  }

  return (
    <div className="relative w-full py-10 group/carousel">
      <Swiper
        onBeforeInit={(swiper) => {
          swiperRef.current = swiper;
        }}
        modules={[EffectCoverflow, Navigation, A11y]}
        effect="coverflow"
        grabCursor={true}
        centeredSlides={true}
        loop={true}
        speed={500}
        spaceBetween={30}
        slidesPerView="auto"
        coverflowEffect={{
          rotate: 40,
          stretch: 0,
          depth: 200,
          modifier: 1,
          slideShadows: true,
        }}
        breakpoints={{
          320: {
            slidesPerView: 1.5,
          },
          768: {
            slidesPerView: 2.5,
          },
          1024: {
            slidesPerView: 3,
          },
        }}
        className="w-full py-10 perspective-1000"
      >
        {products.map((product) => (
          <SwiperSlide
            key={product.id || product.modelo}
            // Using !h-auto to allow content to dictate height, but ensuring width constraint
            className="w-[280px] md:w-[350px] lg:w-[400px] !h-auto transition-transform duration-500"
          >
            {({ isActive }) => (
              <div className={`h-full transition-all duration-500 ${isActive ? 'scale-100 opacity-100' : 'scale-90 opacity-60'}`}>
                <ProductCard product={product} isActive={isActive} />
              </div>
            )}
          </SwiperSlide>
        ))}
      </Swiper>

      {/* Custom Navigation Buttons */}
      <button
        onClick={() => swiperRef.current?.slidePrev()}
        className="absolute left-4 top-1/2 -translate-y-1/2 z-50 p-3 rounded-full bg-background/80 backdrop-blur-sm border border-primary/50 text-primary opacity-0 group-hover/carousel:opacity-100 transition-all duration-300 hover:scale-110 hover:shadow-[0_0_20px_rgba(6,182,212,0.5)] disabled:opacity-50 disabled:cursor-not-allowed hidden md:block focus:outline-none focus:ring-2 focus:ring-primary"
        aria-label="Previous slide"
      >
        <ChevronLeft className="w-6 h-6" />
      </button>

      <button
        onClick={() => swiperRef.current?.slideNext()}
        className="absolute right-4 top-1/2 -translate-y-1/2 z-50 p-3 rounded-full bg-background/80 backdrop-blur-sm border border-primary/50 text-primary opacity-0 group-hover/carousel:opacity-100 transition-all duration-300 hover:scale-110 hover:shadow-[0_0_20px_rgba(6,182,212,0.5)] disabled:opacity-50 disabled:cursor-not-allowed hidden md:block focus:outline-none focus:ring-2 focus:ring-primary"
        aria-label="Next slide"
      >
        <ChevronRight className="w-6 h-6" />
      </button>
    </div>
  );
};

export default ProductCarousel;
