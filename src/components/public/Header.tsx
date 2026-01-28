import { Link } from "react-router-dom";
import { Settings } from "lucide-react";
import esgamingLogo from "@/assets/esgaming-logo.png";

const Header = () => {
  return (
    <header className="w-full py-6 px-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center">
          <img 
            src={esgamingLogo} 
            alt="ESGaming" 
            className="h-10 w-auto brightness-0 invert"
          />
        </Link>

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
