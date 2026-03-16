import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { FcGoogle } from "react-icons/fc";
import { colors } from "@/styles/colors";

export default function AuthProviders({ onGoogleSignIn }) {
  return (
    <>
      <Button
        variant="outline"
        onClick={onGoogleSignIn}
        type="button"
        className="w-full h-11 flex items-center justify-center gap-3 font-medium transition-all shadow-sm hover:shadow"
        style={{
          backgroundColor: colors.background.white,
          color: colors.text.primary,
          borderColor: colors.ui.borderLight,
        }}
      >
        <FcGoogle size={20} />
        Continue with Google
      </Button>

      <div className="flex items-center my-6">
        <Separator className="flex-1" style={{ backgroundColor: colors.ui.borderLight }} />
        <span
          className="px-4 text-xs font-medium uppercase tracking-wider"
          style={{ color: colors.text.tertiary }}
        >
          Or continue with email
        </span>
        <Separator className="flex-1" style={{ backgroundColor: colors.ui.borderLight }} />
      </div>
    </>
  );
}
