import { Link } from "react-router-dom";
import { Settings } from "lucide-react";

const Header = () => {
  return (
    <header className="w-full py-6 px-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-gaming flex items-center justify-center glow-cyan">
            <span className="text-xl font-bold text-background">G</span>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground tracking-tight">
              Gaming<span className="text-primary">Catalog</span>
            </h1>
            <p className="text-xs text-muted-foreground uppercase tracking-widest">
              Pro Edition
            </p>
          </div>
        </div>

        {/* Admin Link */}
        <Link
          to="/admin/login"
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground transition-all duration-300 group"
        >
          <Settings className="w-4 h-4 group-hover:rotate-90 transition-transform duration-500" />
          <span className="text-sm font-medium hidden sm:inline">Admin</span>
        </Link>
      </div>
    </header>
  );
};

export default Header;
