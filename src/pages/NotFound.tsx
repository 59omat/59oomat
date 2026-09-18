import { Button } from "@/components/ui/button";
import { SpiralBinding } from "@/components/notebook";
import { motion } from "framer-motion";
import { useNavigate } from "react-router";

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <motion.main
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="notebook-grain flex min-h-screen items-center justify-center bg-background p-6"
    >
      <div className="w-full max-w-sm">
        <div className="index-card overflow-hidden">
          <SpiralBinding className="pb-1 pt-3" count={8} />
          <div className="notebook-page px-6 py-8 text-center">
            <p className="font-display text-5xl font-bold">٤٠٤</p>
            <h1 className="mt-3 font-display text-lg font-bold">
              هذه الصفحة غير موجودة
            </h1>
            <p className="mt-2 text-[11px] leading-6 text-muted-foreground">
              يبدو أن الرابط الذي فتحته غير صحيح أو أن الصفحة نُقلت من الدفتر.
            </p>
            <div className="mt-5 flex flex-col gap-2">
              <Button onClick={() => navigate("/app")}>
                العودة إلى الخصومات القريبة
              </Button>
              <Button variant="ghost" onClick={() => navigate("/")}>
                الصفحة الرئيسية
              </Button>
            </div>
          </div>
        </div>
      </div>
    </motion.main>
  );
}
