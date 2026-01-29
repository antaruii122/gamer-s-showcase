import { useState } from "react";
import { Product } from "@/types/catalog";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { X, ZoomIn } from "lucide-react";

interface ProductGalleryProps {
    images: string[];
    title: string;
}

const ProductGallery = ({ images, title }: ProductGalleryProps) => {
    const [selectedImage, setSelectedImage] = useState<string | null>(null);

    // Filter out empty strings just in case
    const validImages = images.filter(Boolean);
    const count = validImages.length;

    if (count === 0) return null;

    // Render logic based on count
    const renderGrid = () => {
        if (count === 1) {
            return (
                <div
                    className="w-full h-64 md:h-80 lg:h-96 rounded-xl overflow-hidden cursor-pointer group relative"
                    onClick={() => setSelectedImage(validImages[0])}
                >
                    <img
                        src={validImages[0]}
                        alt={title}
                        className="w-full h-full object-contain bg-black/20 hover:scale-105 transition-transform duration-500"
                        loading="lazy"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                        <ZoomIn className="text-white w-8 h-8 drop-shadow-lg" />
                    </div>
                </div>
            );
        }

        if (count === 2) {
            return (
                <div className="grid grid-cols-2 gap-2 h-64 md:h-80">
                    {validImages.map((img, idx) => (
                        <div
                            key={idx}
                            className="relative rounded-xl overflow-hidden cursor-pointer group h-full"
                            onClick={() => setSelectedImage(img)}
                        >
                            <img
                                src={img}
                                alt={`${title} ${idx}`}
                                className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                                loading="lazy"
                            />
                        </div>
                    ))}
                </div>
            );
        }

        if (count === 3) {
            // 1 Large (Left) + 2 Stacked (Right)
            return (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2 h-[400px] md:h-[500px]">
                    <div
                        className="md:col-span-2 h-full rounded-xl overflow-hidden cursor-pointer group relative"
                        onClick={() => setSelectedImage(validImages[0])}
                    >
                        <img src={validImages[0]} alt="Main" className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" loading="lazy" />
                    </div>
                    <div className="flex flex-col gap-2 h-full">
                        {[1, 2].map(i => (
                            <div
                                key={i}
                                className="flex-1 rounded-xl overflow-hidden cursor-pointer group relative"
                                onClick={() => setSelectedImage(validImages[i])}
                            >
                                <img src={validImages[i]} alt="Detail" className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" loading="lazy" />
                            </div>
                        ))}
                    </div>
                </div>
            );
        }

        // 4+ Images (Bento: Main + Portrait + Squares)
        // Layout: 
        // [ Main (2x2) ] [ Portrait (1x2) ]
        // [ Sq1 (1x1) ]  [ Sq2 (1x1) ] --- wait, this leaves a hole if Portrait is 1x2.
        // Let's try responsive grid.
        return (
            <div className="grid grid-cols-2 md:grid-cols-4 grid-rows-2 gap-2 h-[300px] md:h-[400px] lg:h-[500px]">
                {/* Main Image: Big Square-ish or Landscape */}
                <div
                    className="col-span-2 row-span-2 rounded-xl overflow-hidden cursor-pointer group relative"
                    onClick={() => setSelectedImage(validImages[0])}
                >
                    <img src={validImages[0]} alt="Main" className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" loading="lazy" />
                </div>

                {/* Portrait: Tall (row-span-2?) or just top right? */}
                {/* If we want "Rectangle Stand-up", it implies verticality. */}
                <div
                    className="hidden md:block col-span-1 row-span-2 rounded-xl overflow-hidden cursor-pointer group relative"
                    onClick={() => setSelectedImage(validImages[1])}
                >
                    <img src={validImages[1]} alt="Portrait" className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" loading="lazy" />
                </div>

                {/* Mobile View for Portrait (just another square) is handled by col-span-1 logic above? No. */}
                {/* On mobile, maybe just 2x2 grid? */}

                {/* Squares */}
                <div className="col-span-1 md:col-span-1 md:row-span-1 rounded-xl overflow-hidden cursor-pointer group relative" onClick={() => setSelectedImage(validImages[2])}>
                    <img src={validImages[2]} alt="Square 1" className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" loading="lazy" />
                </div>
                <div className="col-span-1 md:col-span-1 md:row-span-1 rounded-xl overflow-hidden cursor-pointer group relative" onClick={() => setSelectedImage(validImages[3])}>
                    <img src={validImages[3]} alt="Square 2" className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" loading="lazy" />
                </div>
            </div>
        );
    };

    return (
        <>
            <div className="w-full">
                {renderGrid()}
            </div>

            {/* Lightbox Modal */}
            {selectedImage && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 animate-in fade-in duration-200"
                    onClick={() => setSelectedImage(null)}
                >
                    <button
                        className="absolute top-4 right-4 p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
                        onClick={() => setSelectedImage(null)}
                    >
                        <X className="w-8 h-8" />
                    </button>
                    <img
                        src={selectedImage}
                        alt="Fullscreen"
                        className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl scale-100 animate-in zoom-in-95 duration-200"
                    />
                </div>
            )}
        </>
    );
};

export default ProductGallery;
