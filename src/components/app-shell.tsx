import logo from "@/assets/logo.svg";
import { Button } from "@/components/ui/button";
import { SpiralBinding } from "@/components/notebook";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";
import {
  Heart,
  MapPin,
  ShieldCheck,
  Store,
  UserRound,
} from "lucide-react";
import { NavLink, Outlet } from "react-router";

type Tab = {
  to: string;
  label: string;
  icon: typeof MapPin;
  end?: boolean;
  adminOnly?: boolean;
};

const TABS: Tab[] = [
  { to: "/app", label: "قريب مني", icon: MapPin, end: true },
  { to: "/app/favorites", label: "المفضلة", icon: Heart },
  { to: "/app/merchant", label: "متجري", icon: Store },
  { to: "/app/admin", label: "الإدارة", icon: ShieldCheck, adminOnly: true },
  { to: "/app/account", label: "حسابي", icon: UserRound },
];

function roleLabel(role: string | undefined, isAnonymous: boolean) {
  if (role === "admin") return "مشرف";
  if (role === "merchant") return "تاجر";
  if (isAnonymous) return "زائر";
  return "مستخدم";
}

/** هيكل التطبيق: إطار الجهاز، شريط علوي ورقي وشريط تنقل سفلي. */
export function AppShell() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const tabs = TABS.filter((tab) => !tab.adminOnly || isAdmin);

  return (
    <div className="notebook-grain min-h-dvh bg-background">
      <div
        className="mx-auto flex min-h-dvh w-full max-w-[440px] flex-col overflow-hidden bg-card/80 sm:my-4 sm:min-h-[calc(100dvh-2rem)] sm:rounded-[26px] sm:border sm:border-border/70"
        style={{
          boxShadow:
            "10px 12px 0 0 color-mix(in oklab, var(--paper-shadow) 26%, transparent)",
        }}
      >
        <header className="sticky top-0 z-30 border-b border-border/70 bg-card/95 backdrop-blur-sm">
          <SpiralBinding className="pt-2 pb-1" />
          <div className="flex items-center justify-between gap-2 px-4 pb-2">
            <div className="flex items-center gap-2">
              <img src={logo} alt="خصم قريب" className="size-8" />
              <div className="leading-tight">
                <p className="font-display text-base font-bold">خصم قريب</p>
                <p className="text-[10px] text-muted-foreground">
                  دفتر العروض حولك
                </p>
              </div>
            </div>
            {user ? (
              <span className="rounded-full border border-dashed border-margin-line/50 bg-highlight/60 px-2 py-0.5 text-[10px] font-bold text-highlight-foreground">
                {user.name ?? roleLabel(user.role, Boolean(user.isAnonymous))}
              </span>
            ) : null}
          </div>
        </header>

        <main className="notebook-page relative flex-1 overflow-x-hidden pb-6">
          <Outlet />
        </main>

        <nav className="sticky bottom-0 z-30 border-t border-border/70 bg-card/95 backdrop-blur-sm">
          <div className="flex items-stretch">
            {tabs.map((tab) => (
              <NavLink
                key={tab.to}
                to={tab.to}
                end={tab.end}
                className={({ isActive }) =>
                  cn(
                    "relative flex flex-1 flex-col items-center justify-center gap-1 py-2.5 text-[10px] transition-colors",
                    isActive
                      ? "text-primary"
                      : "text-muted-foreground hover:text-foreground",
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <span
                      className={cn(
                        "absolute top-0 h-[3px] w-8 rounded-full bg-primary transition-opacity",
                        isActive ? "opacity-100" : "opacity-0",
                      )}
                    />
                    <tab.icon
                      className="size-5"
                      strokeWidth={isActive ? 2.4 : 1.8}
                    />
                    <span className={isActive ? "font-bold" : undefined}>
                      {tab.label}
                    </span>
                  </>
                )}
              </NavLink>
            ))}
          </div>
        </nav>
      </div>
    </div>
  );
}

/** زر ثانوي بحجم أيقونة يُستخدم في الرؤوس. */
export function HeaderAction({
  children,
  onClick,
  label,
}: {
  children: React.ReactNode;
  onClick: () => void;
  label: string;
}) {
  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={onClick}
      className="shrink-0 gap-1.5 border-dashed bg-card/70"
    >
      {children}
      <span className="text-[11px]">{label}</span>
    </Button>
  );
}
