import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import { colors } from "@/styles/colors";

export default function Navbar() {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
      setMobileMenuOpen(false);
    }
  };

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md"
      style={{
        backgroundColor: 'rgba(245, 243, 240, 0.95)',
        borderBottom: `1px solid ${colors.ui.borderLight}`,
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center space-x-2 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: colors.primary.main }}
            >
              <span className="text-white font-bold text-xl">FS</span>
            </div>
            <span className="font-bold text-xl" style={{ color: colors.text.primary }}>
              Flow Swift
            </span>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <button
              onClick={() => scrollToSection("pricing")}
              className="transition-colors text-sm font-medium"
              style={{ color: colors.text.secondary }}
              onMouseEnter={(e) => e.currentTarget.style.color = colors.text.primary}
              onMouseLeave={(e) => e.currentTarget.style.color = colors.text.secondary}
            >
              Pricing
            </button>
            <button
              onClick={() => scrollToSection("contact")}
              className="transition-colors text-sm font-medium"
              style={{ color: colors.text.secondary }}
              onMouseEnter={(e) => e.currentTarget.style.color = colors.text.primary}
              onMouseLeave={(e) => e.currentTarget.style.color = colors.text.secondary}
            >
              Contact Us
            </button>
            <div className="flex items-center space-x-3">
              <Button
                variant="ghost"
                onClick={() => navigate("/login")}
                className="transition-colors"
                style={{ color: colors.text.secondary }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = colors.text.primary;
                  e.currentTarget.style.backgroundColor = colors.background.hover;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = colors.text.secondary;
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                Login
              </Button>
              <Button
                onClick={() => navigate("/register")}
                className="text-white shadow-lg"
                style={{
                  backgroundColor: colors.primary.main,
                  boxShadow: `0 4px 12px ${colors.primary.main}40`,
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = colors.primary.hover}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = colors.primary.main}
              >
                Sign Up
              </Button>
            </div>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg transition-colors"
            style={{ color: colors.text.primary }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = colors.background.hover}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div
          className="md:hidden"
          style={{
            backgroundColor: colors.background.white,
            borderTop: `1px solid ${colors.ui.borderLight}`,
          }}
        >
          <div className="px-4 py-4 space-y-3">
            <button
              onClick={() => scrollToSection("pricing")}
              className="block w-full text-left transition-colors py-2 text-sm font-medium"
              style={{ color: colors.text.secondary }}
              onMouseEnter={(e) => e.currentTarget.style.color = colors.text.primary}
              onMouseLeave={(e) => e.currentTarget.style.color = colors.text.secondary}
            >
              Pricing
            </button>
            <button
              onClick={() => scrollToSection("contact")}
              className="block w-full text-left transition-colors py-2 text-sm font-medium"
              style={{ color: colors.text.secondary }}
              onMouseEnter={(e) => e.currentTarget.style.color = colors.text.primary}
              onMouseLeave={(e) => e.currentTarget.style.color = colors.text.secondary}
            >
              Contact Us
            </button>
            <div className="pt-3 space-y-2">
              <Button
                variant="outline"
                onClick={() => navigate("/login")}
                className="w-full"
                style={{
                  backgroundColor: colors.background.hover,
                  borderColor: colors.ui.borderLight,
                  color: colors.text.primary,
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = colors.ui.borderSubtle}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = colors.background.hover}
              >
                Login
              </Button>
              <Button
                onClick={() => navigate("/register")}
                className="w-full text-white"
                style={{ backgroundColor: colors.primary.main }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = colors.primary.hover}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = colors.primary.main}
              >
                Sign Up
              </Button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
