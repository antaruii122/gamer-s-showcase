import { useCatalog } from "@/contexts/CatalogContext";
import { cn } from "@/lib/utils";

const CategoryNav = () => {
  const { categories, selectedCategory, setSelectedCategory } = useCatalog();

  return (
    <nav className="w-full py-4 overflow-x-auto scrollbar-gaming">
      <div className="flex gap-3 justify-center flex-wrap px-4">
        {categories.map((category) => (
          <button
            key={category}
            onClick={() => setSelectedCategory(category)}
            className={cn(
              "category-chip",
              selectedCategory === category && "active"
            )}
          >
            {category}
          </button>
        ))}
      </div>
    </nav>
  );
};

export default CategoryNav;
