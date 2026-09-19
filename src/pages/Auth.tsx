import { SpiralBinding, StickyNote } from "@/components/notebook";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { Label } from "@/components/ui/label";

import { useAuth } from "@/hooks/use-auth";
import logo from "@/assets/logo.svg";
import {
  ArrowRight,
  Loader2,
  Mail,
  MapPin,
  ShieldCheck,
  Store,
  UserRound,
} from "lucide-react";
import { Suspense, useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";

interface AuthProps {
  redirectAfterAuth?: string;
}

function resolveRedirectAfterAuth(
  returnTo: string | null,
  fallback = "/app",
) {
  if (returnTo?.startsWith("/") && !returnTo.startsWith("//")) {
    return returnTo;
  }
  return fallback;
}

function Auth({ redirectAfterAuth }: AuthProps = {}) {
  const { isLoading: authLoading, isAuthenticated, signIn } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirect = resolveRedirectAfterAuth(
    searchParams.get("returnTo"),
    redirectAfterAuth,
  );
  const [step, setStep] = useState<"signIn" | { email: string }>("signIn");
  const [otp, setOtp] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      navigate(redirect);
    }
  }, [authLoading, isAuthenticated, navigate, redirect]);

  const handleEmailSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      const formData = new FormData(event.currentTarget);
      await signIn("email-otp", formData);
      setStep({ email: formData.get("email") as string });
      setIsLoading(false);
    } catch (err) {
      console.error("Email sign-in error:", err);
      setError(
        err instanceof Error
          ? err.message
          : "تعذّر إرسال رمز التحقق، حاول مرة أخرى.",
      );
      setIsLoading(false);
    }
  };

  const handleOtpSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      const formData = new FormData(event.currentTarget);
      await signIn("email-otp", formData);
      navigate(redirect);
    } catch (err) {
      console.error("OTP verification error:", err);
      setError("رمز التحقق غير صحيح، حاول مرة أخرى.");
      setIsLoading(false);
      setOtp("");
    }
  };

  const handleGuestLogin = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await signIn("anonymous");
      navigate(redirect);
    } catch (err) {
      console.error("Guest login error:", err);
      setError(
        `تعذّر الدخول كزائر: ${
          err instanceof Error ? err.message : "خطأ غير معروف"
        }`,
      );
      setIsLoading(false);
    }
  };

  return (
    <div className="notebook-grain flex min-h-dvh flex-col bg-background">
      <div className="flex flex-1 items-center justify-center px-4 py-10">
        <div className="w-full max-w-[400px]">
          <div className="index-card overflow-hidden">
            <SpiralBinding className="pb-1 pt-3" count={9} />

            {step === "signIn" ? (
              <>
                <div className="px-6 pt-4 text-center">
                  <img
                    src={logo}
                    alt="خصم قريب"
                    width={56}
                    height={56}
                    className="mx-auto cursor-pointer rounded-xl border border-rule"
                    onClick={() => navigate("/")}
                  />
                  <h1 className="mt-3 font-display text-xl font-bold">
                    أهلًا بك في خصم قريب
                  </h1>
                  <p className="mt-2 text-[11px] leading-6 text-muted-foreground">
                    أدخل بريدك الإلكتروني وسنرسل لك رمز تحقق من 6 أرقام لتسجيل
                    الدخول أو إنشاء حساب جديد.
                  </p>
                </div>

                <form onSubmit={handleEmailSubmit} className="px-6 pt-4">
                  <Label htmlFor="email" className="text-[11px]">
                    البريد الإلكتروني
                  </Label>
                  <div className="mt-2 flex items-center gap-2">
                    <div className="relative flex-1">
                      <Mail className="absolute inset-y-0 end-3 my-auto size-4 text-muted-foreground" />
                      <Input
                        id="email"
                        name="email"
                        placeholder="name@example.com"
                        type="email"
                        className="bg-card pe-9"
                        disabled={isLoading}
                        required
                      />
                    </div>
                    <Button
                      type="submit"
                      variant="outline"
                      size="icon"
                      className="border-dashed"
                      disabled={isLoading}
                      aria-label="إرسال رمز التحقق"
                    >
                      {isLoading ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : (
                        <ArrowRight className="size-4 rotate-180" />
                      )}
                    </Button>
                  </div>

                  {error ? (
                    <p className="mt-2 text-[11px] text-destructive">{error}</p>
                  ) : null}

                  <div className="mt-4">
                    <div className="relative">
                      <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t border-dashed border-rule" />
                      </div>
                      <div className="relative flex justify-center">
                        <span className="bg-card px-2 text-[10px] text-muted-foreground">
                          أو
                        </span>
                      </div>
                    </div>

                    <Button
                      type="button"
                      variant="outline"
                      className="mt-4 w-full gap-2 border-dashed"
                      onClick={handleGuestLogin}
                      disabled={isLoading}
                    >
                      <UserRound className="size-4" />
                      متابعة كزائر (بدون بريد)
                    </Button>
                    <p className="mt-2 text-center text-[10px] leading-5 text-muted-foreground">
                      الزائر يستطيع تصفح العروض وإضافتها للمفضلة، ويمكنه لاحقًا
                      ربط بريده لإنشاء متجر.
                    </p>
                  </div>
                </form>
              </>
            ) : (
              <>
                <div className="px-6 pt-4 text-center">
                  <h1 className="font-display text-xl font-bold">
                    تحقق من بريدك
                  </h1>
                  <p className="mt-2 text-[11px] leading-6 text-muted-foreground">
                    أرسلنا رمزًا مكوّنًا من 6 أرقام إلى {step.email}
                  </p>
                </div>
                <form onSubmit={handleOtpSubmit} className="px-6 pt-4 pb-2">
                  <input type="hidden" name="email" value={step.email} />
                  <input type="hidden" name="code" value={otp} />

                  <div className="flex justify-center" dir="ltr">
                    <InputOTP
                      value={otp}
                      onChange={setOtp}
                      maxLength={6}
                      disabled={isLoading}
                      onKeyDown={(event) => {
                        if (
                          event.key === "Enter" &&
                          otp.length === 6 &&
                          !isLoading
                        ) {
                          const form = (event.target as HTMLElement).closest(
                            "form",
                          );
                          if (form) form.requestSubmit();
                        }
                      }}
                    >
                      <InputOTPGroup>
                        {Array.from({ length: 6 }).map((_, index) => (
                          <InputOTPSlot key={index} index={index} />
                        ))}
                      </InputOTPGroup>
                    </InputOTP>
                  </div>

                  {error ? (
                    <p className="mt-2 text-center text-[11px] text-destructive">
                      {error}
                    </p>
                  ) : null}

                  <p className="mt-4 text-center text-[11px] text-muted-foreground">
                    لم يصلك الرمز؟{" "}
                    <button
                      type="button"
                      className="underline decoration-dashed hover:text-primary"
                      onClick={() => setStep("signIn")}
                    >
                      أرسله مرة أخرى
                    </button>
                  </p>

                  <div className="mt-4 flex flex-col gap-2">
                    <Button
                      type="submit"
                      className="w-full gap-2"
                      disabled={isLoading || otp.length !== 6}
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="size-4 animate-spin" />
                          جارٍ التحقق…
                        </>
                      ) : (
                        <>
                          تأكيد الرمز
                          <ArrowRight className="size-4 rotate-180" />
                        </>
                      )}
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      className="w-full"
                      onClick={() => setStep("signIn")}
                      disabled={isLoading}
                    >
                      استخدام بريد آخر
                    </Button>
                  </div>
                </form>
              </>
            )}

            <div className="mt-4 flex justify-center pb-5">
              <StickyNote className="scale-95 rotate-[-0.8deg] text-[10px]">
                بتسجيل الدخول يمكنك حفظ المتاجر المفضلة وإضافة متجرك.
              </StickyNote>
            </div>

            <div className="border-t border-rule/70 bg-muted/40 px-6 py-3 text-center text-[10px] text-muted-foreground">
              محمي بواسطة{" "}
              <a
                href="https://freebuff.com"
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-primary"
              >
                freebuff.com
              </a>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-3 gap-2 text-center text-[10px] text-muted-foreground">
            {[
              { icon: MapPin, text: "عروض قريبة" },
              { icon: Store, text: "لوحة للتاجر" },
              { icon: ShieldCheck, text: "مراجعة الإدارة" },
            ].map((item) => (
              <div key={item.text} className="index-card px-2 py-3">
                <item.icon className="mx-auto size-4 text-primary" />
                <p className="mt-1.5">{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AuthPage(props: AuthProps) {
  return (
    <Suspense>
      <Auth {...props} />
    </Suspense>
  );
}
