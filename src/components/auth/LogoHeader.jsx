import { CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { colors } from "@/styles/colors";

export default function LogoHeader() {
  return (
    <CardHeader className="space-y-4 text-center pb-8">
      <div className="flex justify-center mb-2">
        <div
          className="w-16 h-16 rounded-xl flex items-center justify-center shadow-lg"
          style={{ backgroundColor: colors.primary.main }}
        >
          <span className="text-white font-bold text-2xl">FS</span>
        </div>
      </div>
      <div className="space-y-2">
        <CardTitle
          className="text-3xl font-bold tracking-tight"
          style={{ color: colors.text.primary }}
        >
          Welcome Back
        </CardTitle>
        <CardDescription
          className="text-base"
          style={{ color: colors.text.secondary }}
        >
          Sign in to your account to continue
        </CardDescription>
      </div>
    </CardHeader>
  );
}
