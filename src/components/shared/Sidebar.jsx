import React from "react";
import { Settings, HelpCircle, LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/authContext/index.jsx";
import { colors } from "@/styles/colors";

/**
 * Sidebar component inspired by Heidi's navigation
 * Professional, warm design with construction/reporting aesthetic
 */
export default function Sidebar() {
  const navigate = useNavigate();
  const { currentUser, logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  // Get user initials for avatar
  const getUserInitials = () => {
    if (!currentUser?.email) return "U";
    const email = currentUser.email;
    const parts = email.split("@")[0].split(".");
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return email.substring(0, 2).toUpperCase();
  };

  return (
    <div
      className="h-full flex flex-col"
      style={{
        backgroundColor: colors.sidebar.dark,
        width: '220px',
        padding: '24px 16px',
      }}
    >
      {/* User Profile Section */}
      <div className="mb-8">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold text-sm"
            style={{ backgroundColor: colors.primary.main }}
          >
            {getUserInitials()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-white text-sm font-medium truncate">
              {currentUser?.email?.split("@")[0] || "User"}
            </div>
            <div className="text-gray-400 text-xs truncate">
              {currentUser?.email || ""}
            </div>
          </div>
        </div>
      </div>

      {/* Action Items */}
      <div className="space-y-1">
        {/* Settings Button */}
        <button
          onClick={() => {}}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-300 hover:text-white transition-all"
          style={{
            backgroundColor: 'transparent',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = colors.sidebar.hover;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
          }}
        >
          <Settings className="w-5 h-5" />
          <span className="text-sm font-medium">Settings</span>
        </button>

        {/* Help Button */}
        <button
          onClick={() => {}}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-300 hover:text-white transition-all"
          style={{
            backgroundColor: 'transparent',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = colors.sidebar.hover;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
          }}
        >
          <HelpCircle className="w-5 h-5" />
          <span className="text-sm font-medium">Help</span>
        </button>

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-red-300 hover:text-red-200 transition-all"
          style={{
            backgroundColor: 'transparent',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = colors.sidebar.hover;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
          }}
        >
          <LogOut className="w-5 h-5" />
          <span className="text-sm font-medium">Logout</span>
        </button>
      </div>
    </div>
  );
}
