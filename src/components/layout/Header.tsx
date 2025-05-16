
import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Menu, X, LogIn, User, FileText } from "lucide-react";

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, signOut } = useAuth();
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMenuOpen(false);
  }, [location.pathname]);

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);
  
  return (
    <header className={`fixed top-0 w-full z-50 transition-all duration-300 ${scrolled ? "bg-background/80 backdrop-blur-md shadow-md" : "bg-transparent"}`}>
      <div className="container mx-auto flex justify-between items-center p-4">
        <Link to="/" className="flex items-center">
          <span className="font-bold text-xl">Renter's Mentor</span>
        </Link>
        
        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-6">
          <Link to="/" className="text-foreground/80 hover:text-foreground transition-colors">
            Home
          </Link>
          <Link to="/practice" className="text-foreground/80 hover:text-foreground transition-colors">
            Practice
          </Link>
          <Link to="/resources" className="text-foreground/80 hover:text-foreground transition-colors">
            Resources
          </Link>
          <Link to="/lease-analyzer" className="text-foreground/80 hover:text-foreground transition-colors flex items-center">
            <FileText className="h-4 w-4 mr-1" />
            Lease Analyzer
          </Link>
          <Link to="/faq" className="text-foreground/80 hover:text-foreground transition-colors">
            FAQ
          </Link>
          
          {user ? (
            <div className="flex items-center space-x-4">
              <Link to="/profile">
                <Button variant="outline" size="sm" className="flex items-center">
                  <User className="h-4 w-4 mr-2" />
                  Profile
                </Button>
              </Link>
              <Button variant="ghost" size="sm" onClick={signOut}>
                Sign Out
              </Button>
            </div>
          ) : (
            <Link to="/auth">
              <Button size="sm" className="flex items-center">
                <LogIn className="h-4 w-4 mr-2" />
                Sign In
              </Button>
            </Link>
          )}
        </nav>
        
        {/* Mobile Menu Button */}
        <button 
          className="block md:hidden"
          onClick={toggleMenu}
          aria-expanded={isMenuOpen}
          aria-label="Toggle navigation menu"
        >
          {isMenuOpen ? <X /> : <Menu />}
        </button>
      </div>
      
      {/* Mobile Navigation */}
      {isMenuOpen && (
        <div className="md:hidden bg-background border-t border-border/50 py-4">
          <div className="container flex flex-col space-y-4">
            <Link to="/" className="px-4 py-2 hover:bg-accent rounded-md transition-colors">
              Home
            </Link>
            <Link to="/practice" className="px-4 py-2 hover:bg-accent rounded-md transition-colors">
              Practice
            </Link>
            <Link to="/resources" className="px-4 py-2 hover:bg-accent rounded-md transition-colors">
              Resources
            </Link>
            <Link to="/lease-analyzer" className="px-4 py-2 hover:bg-accent rounded-md transition-colors flex items-center">
              <FileText className="h-4 w-4 mr-2" />
              Lease Analyzer
            </Link>
            <Link to="/faq" className="px-4 py-2 hover:bg-accent rounded-md transition-colors">
              FAQ
            </Link>
            
            {user ? (
              <>
                <Link to="/profile" className="px-4 py-2 hover:bg-accent rounded-md transition-colors flex items-center">
                  <User className="h-4 w-4 mr-2" />
                  Profile
                </Link>
                <Button variant="ghost" onClick={signOut} className="justify-start">
                  Sign Out
                </Button>
              </>
            ) : (
              <Link to="/auth" className="px-4 py-2 hover:bg-accent rounded-md transition-colors flex items-center">
                <LogIn className="h-4 w-4 mr-2" />
                Sign In
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
