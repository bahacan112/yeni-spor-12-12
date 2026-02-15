"use client";
import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PaymentErrorDetail {
  paymentId: string;
  status?: string;
  gatewayStatus?: string;
  errorCode?: string;
  errorMessage?: string;
  amount?: number;
  updatedAt?: string;
}

export default function ErrorPage() {
  const sp = useSearchParams();
  const router = useRouter();
  const paymentId = sp.get("paymentId") || "";
  const [data, setData] = useState<PaymentErrorDetail | null>(null);
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
          `/api/checkout/payment-error-detail?paymentId=${encodeURIComponent(
            paymentId
          )}`,
          { cache: "no-store" }
        );
        const json = await res.json().catch(() => ({}));
        if (!res.ok) {
          setError(json.error || "Hata bilgisi alınamadı");
        } else {
          if (!ignore) setData(json as PaymentErrorDetail);
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
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 mb-4">
            <XCircle className="w-8 h-8 text-red-600" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900">Ödeme Başarısız</h3>
          <p className="mt-2 text-gray-600">
            Ödeme işlemi tamamlanamadı. Lütfen aşağıdaki bilgileri kontrol edin.
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
          <div className="bg-gray-50 rounded-lg p-4 mb-6 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-medium text-gray-900">Durum</span>
              <span className="text-gray-700">
                {data.status || data.gatewayStatus || "-"}
              </span>
            </div>
            {data.errorCode && (
              <div className="flex items-center justify-between">
                <span className="font-medium text-gray-900">Kod</span>
                <span className="text-gray-700">{data.errorCode}</span>
              </div>
            )}
            {data.errorMessage && (
              <div className="flex items-center justify-between">
                <span className="font-medium text-gray-900">Mesaj</span>
                <span className="text-gray-700">{data.errorMessage}</span>
              </div>
            )}
            <div className="flex items-center justify-between">
              <span className="font-medium text-gray-900">Tutar</span>
              <span className="text-gray-700">
                {(data.amount ?? 0).toLocaleString("tr-TR")} TL
              </span>
            </div>
          </div>
        ) : null}

        <div className="flex flex-col gap-3">
          <Button
            onClick={() => router.push("/(landing)/pricing")}
            className="w-full"
          >
            Yeniden Dene
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
