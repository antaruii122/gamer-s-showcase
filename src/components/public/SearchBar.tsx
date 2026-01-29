import { useState, useEffect } from "react";
import { Search, X } from "lucide-react";
import { useDebounce } from "@/hooks/useDebounce";

interface SearchBarProps {
  onSearch: (query: string) => void;
}

const SearchBar = ({ onSearch }: SearchBarProps) => {
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounce(query, 300);

  useEffect(() => {
    onSearch(debouncedQuery);
  }, [debouncedQuery, onSearch]);

  const handleClear = () => {
    setQuery("");
    onSearch(""); // Clear immediately without debounce
  };

  return (
    <div className="relative w-[90%] md:w-[400px] h-12 mx-auto mb-8 group">
      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
        <Search className="h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors duration-200" />
      </div>

      <input
        type="text"
        className="block w-full h-full pl-11 pr-11 text-base
          bg-background/80 border border-primary/30 rounded-full
          text-foreground placeholder:text-muted-foreground/70
          focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20
          focus:shadow-[0_0_15px_rgba(6,182,212,0.2)]
          transition-all duration-200 ease-in-out
          backdrop-blur-sm"
        placeholder="Buscar producto..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />

      {query && (
        <button
          onClick={handleClear}
          className="absolute inset-y-0 right-0 pr-4 flex items-center cursor-pointer
            text-muted-foreground hover:text-secondary hover:scale-110
            transition-all duration-200"
          aria-label="Clear search"
        >
          <X className="h-5 w-5" />
        </button>
      )}

      {/* Decorative border glow effect */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-r from-primary/20 to-secondary/20 rounded-full blur-md opacity-0 group-focus-within:opacity-100 transition-opacity duration-300 pointer-events-none" />
    </div>
  );
};

export default SearchBar;
