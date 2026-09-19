import { Toaster } from "@/components/ui/sonner";
import { AppShell } from "@/components/app-shell";
import { RequireAuth } from "@/components/RequireAuth";
import { VlyToolbar } from "../vly-toolbar-readonly.tsx";
import { ConvexAuthProvider } from "@convex-dev/auth/react";
import { ConvexReactClient } from "convex/react";
import React, { StrictMode, useEffect, lazy, Suspense } from "react";
import { createRoot } from "react-dom/client";
import {
  HashRouter,
  Navigate,
  Route,
  Routes,
  useLocation,
} from "react-router";
import "./index.css";

// Lazy load route components for better code splitting
const Landing = lazy(() => import("./pages/Landing.tsx"));
const AuthPage = lazy(() => import("./pages/Auth.tsx"));
const NotFound = lazy(() => import("./pages/NotFound.tsx"));
const Nearby = lazy(() => import("./pages/app/Nearby.tsx"));
const Favorites = lazy(() => import("./pages/app/Favorites.tsx"));
const StoreDetail = lazy(() => import("./pages/app/StoreDetail.tsx"));
const Merchant = lazy(() => import("./pages/app/Merchant.tsx"));
const Admin = lazy(() => import("./pages/app/Admin.tsx"));
const Account = lazy(() => import("./pages/app/Account.tsx"));

// Simple loading fallback for route transitions
function RouteLoading() {
  return (
    <div className="notebook-grain flex min-h-dvh items-center justify-center bg-background">
      <div className="animate-pulse font-display text-sm text-muted-foreground">
        جارٍ تجهيز الدفتر…
      </div>
    </div>
  );
}

/**
 * Visible setup screen instead of a white page: shown when the app was built
 * without VITE_CONVEX_URL (e.g. a GitHub Pages deploy where the secret was
 * not set yet). Creating ConvexReactClient with an empty URL would throw and
 * leave a blank screen, so we gate on it and explain what to do.
 */
function MissingConfigGate() {
  return (
    <div className="notebook-grain flex min-h-dvh items-center justify-center bg-background p-6">
      <div className="index-card w-full max-w-lg p-6">
        <h1 className="font-display text-lg font-bold">إعداد مطلوب قبل التشغيل</h1>
        <p className="mt-2 text-[12px] leading-6 text-muted-foreground">
          التطبيق بُني بدون رابط قاعدة البيانات{" "}
          <code className="rounded bg-muted px-1 py-0.5 text-[11px]">
            VITE_CONVEX_URL
          </code>{" "}
          لذا لا يستطيع الاتصال بالخادم.
        </p>
        <ol className="mt-4 list-decimal space-y-2 ps-5 text-[12px] leading-6 text-foreground">
          <li>
            انسخ قيمة <span className="font-semibold">VITE_CONVEX_URL</span> من
            صفحة Keys / الإعدادات في مشروعك على Freebuff (تبدأ بـ
            <span dir="ltr" className="mx-1 text-[11px]">https://…convex.cloud</span>).
          </li>
          <li>
            في GitHub: المستودع → <span className="font-semibold">Settings</span> →
            Secrets and variables → Actions →
            <span className="font-semibold"> New repository secret</span> باسم
            <span dir="ltr" className="mx-1 text-[11px]">VITE_CONVEX_URL</span>
            والقيمة المنسوخة.
          </li>
          <li>
            في تبويب Actions اضغط على مهمة النشر ثم
            <span className="font-semibold"> Re-run all jobs</span> — أو اضغط
            أيقونة Push مرة أخرى.
          </li>
        </ol>
        <p className="mt-4 text-[11px] leading-6 text-muted-foreground">
          بعد اكتمال البناء الجديد سيعمل التطبيق مباشرة على هذا الرابط.
        </p>
      </div>
    </div>
  );
}

/** Silent error boundary — if VlyToolbar crashes it renders nothing instead of
 *  crashing the whole app (e.g. hook errors in the browser runtime). */
class ToolbarErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(err: Error) {
    console.warn("[VlyToolbar] Caught error, toolbar disabled:", err.message);
  }
  render() {
    return this.state.hasError ? null : this.props.children;
  }
}

/** Hard guard so runtime errors never leave the preview as a blank page. */
class RootErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; message: string; stack: string }
> {
  state = { hasError: false, message: "", stack: "" };
  static getDerivedStateFromError(error: Error) {
    return {
      hasError: true,
      message: error.message || "Unknown runtime error",
      stack: error.stack || "",
    };
  }
  componentDidCatch(err: Error) {
    console.error("[Preview] Root crash:", err);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-background p-6 text-foreground">
          <div className="max-w-lg text-center">
            <p className="text-sm font-semibold">
              حدث خطأ غير متوقع في التطبيق
            </p>
            <p className="mt-2 break-words text-xs text-muted-foreground">
              {this.state.message}
            </p>
            {this.state.stack && (
              <pre className="mt-3 max-h-40 overflow-auto rounded border border-border/60 p-2 text-left text-[10px] leading-4 text-muted-foreground/80">
                {this.state.stack}
              </pre>
            )}
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

function RouteSyncer() {
  const location = useLocation();
  useEffect(() => {
    window.parent.postMessage(
      { type: "iframe-route-change", path: location.pathname },
      "*",
    );
  }, [location.pathname]);

  useEffect(() => {
    function handleMessage(event: MessageEvent) {
      if (event.data?.type === "navigate") {
        if (event.data.direction === "back") window.history.back();
        if (event.data.direction === "forward") window.history.forward();
      }
    }
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  return null;
}

function App() {
  // Gate before creating the client: an empty URL makes ConvexReactClient throw.
  const convexUrl = import.meta.env.VITE_CONVEX_URL as string | undefined;
  if (!convexUrl) {
    return <MissingConfigGate />;
  }

  const convex = new ConvexReactClient(convexUrl);

  return (
    <ConvexAuthProvider client={convex}>
      {/* Hash routing works identically on the Freebuff preview, GitHub Pages
          sub-paths (/#/app) and inside Capacitor native shells — no server
          rewrite rules required. */}
      <HashRouter>
        <RouteSyncer />
        <Suspense fallback={<RouteLoading />}>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route
              path="/auth"
              element={<AuthPage redirectAfterAuth="/app" />}
            />

            <Route
              path="/app"
              element={
                <RequireAuth
                  title="سجّل الدخول لعرض الخصومات القريبة"
                  description="التطبيق يعرض عروض المتاجر المحيطة بك حسب موقعك، ويمنح التجار لوحة لإضافة خصوماتهم بالصور."
                  redirectImmediately
                >
                  <AppShell />
                </RequireAuth>
              }
            >
              <Route index element={<Nearby />} />
              <Route path="favorites" element={<Favorites />} />
              <Route path="store/:storeId" element={<StoreDetail />} />
              <Route path="merchant" element={<Merchant />} />
              <Route path="admin" element={<Admin />} />
              <Route path="account" element={<Account />} />
            </Route>

            <Route path="/dashboard" element={<Navigate to="/app" replace />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </HashRouter>
      <Toaster />
    </ConvexAuthProvider>
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <RootErrorBoundary>
      <ToolbarErrorBoundary>
        <VlyToolbar />
      </ToolbarErrorBoundary>
      <App />
    </RootErrorBoundary>
  </StrictMode>,
);
