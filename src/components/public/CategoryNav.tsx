import { useCatalog } from "@/contexts/CatalogContext";

interface CategoryNavProps {
  activeCategory: string;
  onCategoryChange: (category: string) => void;
}

const CategoryNav = ({ activeCategory, onCategoryChange }: CategoryNavProps) => {
  const { categories } = useCatalog();

  return (
    <div className="w-full overflow-x-auto scrollbar-hide">
      <div className="flex flex-row gap-4 justify-center items-center px-4 py-6 min-w-max md:min-w-0">
        {categories.map((category) => {
          const isActive = activeCategory === category;

          return (
            <button
              key={category}
              onClick={() => onCategoryChange(category)}
              className={`
                font-rajdhani text-lg font-bold
                px-6 py-3 rounded-[24px]
                transition-all duration-300 ease-in-out
                whitespace-nowrap
                ${isActive
                  ? "bg-[#05d9e8] text-white shadow-[0_0_20px_#05d9e8]"
                  : "bg-white/10 text-gray-400 hover:bg-white/20"
                }
                hover:scale-105
                ${isActive ? "hover:shadow-[0_0_30px_#05d9e8]" : "hover:shadow-[0_0_10px_rgba(5,217,232,0.3)]"}
              `}
            >
              {category}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default CategoryNav;

