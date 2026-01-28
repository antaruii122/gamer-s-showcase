import { useEffect, useRef } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { EffectCoverflow, Pagination, Navigation, Autoplay } from "swiper/modules";
import { Product } from "@/types/catalog";
import ProductCard from "./ProductCard";

import "swiper/css";
import "swiper/css/effect-coverflow";
import "swiper/css/pagination";
import "swiper/css/navigation";

interface ProductCarouselProps {
  products: Product[];
}

const ProductCarousel = ({ products }: ProductCarouselProps) => {
  const swiperRef = useRef<any>(null);

  useEffect(() => {
    // Reset to first slide when products change
    if (swiperRef.current?.swiper) {
      swiperRef.current.swiper.slideTo(0);
    }
  }, [products]);

  if (products.length === 0) {
    return (
      <div className="flex items-center justify-center h-[500px]">
        <div className="glass-card p-8 text-center">
          <p className="text-xl text-muted-foreground">
            No se encontraron productos
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            Intenta con otra categoría o término de búsqueda
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full py-8">
      <Swiper
        ref={swiperRef}
        effect="coverflow"
        grabCursor={true}
        centeredSlides={true}
        slidesPerView="auto"
        loop={products.length > 3}
        coverflowEffect={{
          rotate: 0,
          stretch: 0,
          depth: 200,
          modifier: 1.5,
          slideShadows: true,
        }}
        pagination={{
          clickable: true,
        }}
        navigation={true}
        autoplay={{
          delay: 5000,
          disableOnInteraction: true,
        }}
        modules={[EffectCoverflow, Pagination, Navigation, Autoplay]}
        className="w-full !pb-12"
        breakpoints={{
          320: {
            slidesPerView: 1,
            spaceBetween: 20,
          },
          640: {
            slidesPerView: 1.5,
            spaceBetween: 30,
          },
          1024: {
            slidesPerView: 2.5,
            spaceBetween: 40,
          },
          1280: {
            slidesPerView: 3,
            spaceBetween: 50,
          },
        }}
      >
        {products.map((product, index) => (
          <SwiperSlide
            key={product.id || index}
            className="!w-[300px] md:!w-[350px] lg:!w-[380px]"
          >
            <ProductCard product={product} />
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
};

export default ProductCarousel;
