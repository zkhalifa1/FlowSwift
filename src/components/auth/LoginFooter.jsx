import { Link } from "react-router-dom";
import { HelpCircle, Shield, FileText } from "lucide-react";
import { colors } from "@/styles/colors";

export default function LoginFooter() {
  return (
    <div className="mt-8 space-y-4">
      <div className="flex items-center justify-center gap-6 text-xs">
        <Link
          to="/terms"
          className="flex items-center gap-1.5 transition-colors hover:opacity-80"
          style={{ color: colors.text.tertiary }}
        >
          <FileText className="h-3.5 w-3.5" />
          Terms of Service
        </Link>
        <div className="h-4 w-px" style={{ backgroundColor: colors.ui.borderLight }} />
        <Link
          to="/privacy"
          className="flex items-center gap-1.5 transition-colors hover:opacity-80"
          style={{ color: colors.text.tertiary }}
        >
          <Shield className="h-3.5 w-3.5" />
          Privacy Policy
        </Link>
        <div className="h-4 w-px" style={{ backgroundColor: colors.ui.borderLight }} />
        <Link
          to="/support"
          className="flex items-center gap-1.5 transition-colors hover:opacity-80"
          style={{ color: colors.text.tertiary }}
        >
          <HelpCircle className="h-3.5 w-3.5" />
          Support
        </Link>
      </div>

      <div className="text-center">
        <p className="text-xs" style={{ color: colors.text.tertiary }}>
          &copy; {new Date().getFullYear()} Your Company. All rights reserved.
        </p>
      </div>
    </div>
  );
}
