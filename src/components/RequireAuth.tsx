import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { Loader2, LockKeyhole } from "lucide-react";
import type { ReactNode } from "react";
import { Navigate, useLocation, useNavigate } from "react-router";

/**
 * Wraps a route that requires a signed-in user.
 *
 * Signed-out visitors get the block stated on the page they landed on, and
 * sign-in returns them to it via `returnTo`. Pass `redirectImmediately` for a
 * route where the bounce really is the better experience (the in-app screens).
 */
export function RequireAuth({
  children,
  title = "سجّل الدخول للمتابعة",
  description = "هذا القسم متاح للمستخدمين المسجّلين فقط.",
  redirectImmediately = false,
}: {
  children: ReactNode;
  /** Headline on the blocked screen. */
  title?: string;
  /** Says what the visitor gets by signing in. */
  description?: string;
  /** Skip the explanation and go straight to `/auth`. */
  redirectImmediately?: boolean;
}) {
  const { isLoading, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </main>
    );
  }

  if (!isAuthenticated) {
    const returnTo = `${location.pathname}${location.search}`;
    const signInHref = `/auth?returnTo=${encodeURIComponent(returnTo)}`;

    if (redirectImmediately) {
      return <Navigate to={signInHref} replace />;
    }

    return (
      <main className="notebook-grain flex min-h-screen items-center justify-center bg-background p-6">
        <div className="index-card w-full max-w-md p-6 text-center">
          <div className="flex justify-center">
            <span className="sticky-note flex size-12 items-center justify-center rounded-full border border-dashed border-margin-line/50">
              <LockKeyhole className="size-5 text-highlight-foreground" />
            </span>
          </div>
          <h1 className="mt-4 font-display text-xl font-bold">{title}</h1>
          <p className="mt-2 text-[11px] leading-6 text-muted-foreground">
            {description}
          </p>
          <p className="mt-3 text-[11px] leading-6 text-muted-foreground">
            ستعود مباشرة إلى هذه الشاشة بعد تسجيل الدخول.
          </p>
          <div className="mt-5 flex flex-col gap-2">
            <Button className="w-full" onClick={() => navigate(signInHref)}>
              تسجيل الدخول
            </Button>
            <Button
              variant="ghost"
              className="w-full"
              onClick={() => navigate("/")}
            >
              العودة للصفحة الرئيسية
            </Button>
          </div>
        </div>
      </main>
    );
  }

  return children;
}
