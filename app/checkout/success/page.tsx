"use client";
import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PaymentDetail {
  paymentId: string;
  planName?: string;
  amount?: number;
  paidAt?: string;
  tenantId?: string;
}

export default function SuccessPage() {
  const sp = useSearchParams();
  const router = useRouter();
  const paymentId = sp.get("paymentId") || "";
  const [data, setData] = useState<PaymentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;
    async function load() {
      if (!paymentId) {
        setError("paymentId eksik");
        setLoading(false);
        return;
      }
      try {
        const res = await fetch(
          `/api/checkout/payment-detail?paymentId=${encodeURIComponent(
            paymentId
          )}`,
          { cache: "no-store" }
        );
        const json = await res.json().catch(() => ({}));
        if (!res.ok) {
          setError(json.error || "Ödeme bilgisi alınamadı");
        } else {
          if (!ignore) setData(json as PaymentDetail);
        }
      } catch (e: any) {
        setError(e.message || "Sunucu hatası");
      } finally {
        setLoading(false);
      }
    }
    load();
    return () => {
      ignore = true;
    };
  }, [paymentId]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900">Ödeme Başarılı</h3>
          <p className="mt-2 text-gray-600">
            Satın aldığınız paket başarıyla aktifleştirildi.
          </p>
        </div>

        {loading ? (
          <div className="animate-pulse space-y-2">
            <div className="h-4 bg-gray-200 rounded w-3/4" />
            <div className="h-4 bg-gray-200 rounded w-1/2" />
          </div>
        ) : error ? (
          <div className="bg-red-50 text-red-700 rounded-lg p-3 mb-6 text-sm">
            {error}
          </div>
        ) : data ? (
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between">
              <span className="font-medium text-gray-900">Paket</span>
              <span className="text-gray-700">{data.planName || "-"}</span>
            </div>
            <div className="flex items-center justify-between mt-2">
              <span className="font-medium text-gray-900">Tutar</span>
              <span className="text-gray-700">
                {(data.amount ?? 0).toLocaleString("tr-TR")} TL
              </span>
            </div>
            <div className="flex items-center justify-between mt-2">
              <span className="font-medium text-gray-900">Ödeme Tarihi</span>
              <span className="text-gray-700">
                {data.paidAt
                  ? new Date(data.paidAt).toLocaleString("tr-TR")
                  : "-"}
              </span>
            </div>
          </div>
        ) : null}

        <div className="flex flex-col gap-3">
          <Button
            onClick={() => router.push("/dashboard/subscriptions")}
            className="w-full"
          >
            Dashboard'a Git
          </Button>
          <Button
            variant="secondary"
            onClick={() => router.push("/")}
            className="w-full"
          >
            Ana Sayfaya Git
          </Button>
        </div>
      </div>
    </div>
  );
}
