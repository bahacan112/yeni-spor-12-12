"use client";

import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Payment } from "@/lib/types";
import { Search } from "lucide-react";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { DayPicker } from "react-day-picker";
import type { DateRange } from "react-day-picker";
import { useRouter, useSearchParams } from "next/navigation";
import "react-day-picker/style.css";

interface Props {
  payments: Payment[];
  tenantId: string;
  branchId?: string;
}

export default function PaymentsClient({ payments }: Props) {
  const [q, setQ] = useState("");
  const [method, setMethod] = useState("all");
  const [type, setType] = useState("all");
  const router = useRouter();
  const sp = useSearchParams();
  const fromParam = sp.get("from");
  const toParam = sp.get("to");
  const initialRange: DateRange | undefined =
    fromParam || toParam
      ? {
          from: fromParam ? new Date(fromParam) : new Date(),
          to: toParam ? new Date(toParam) : undefined,
        }
      : undefined;
  const [range, setRange] = useState<DateRange | undefined>(initialRange);

  const filtered = useMemo(() => {
    return payments.filter((p) => {
      const matchQ =
        q.trim().length === 0 ||
        (p.student?.fullName || "").toLowerCase().includes(q.toLowerCase());
      const matchMethod =
        method === "all" || (p.paymentMethod || "") === method;
      const matchType = type === "all" || (p.paymentType || "") === type;
      return matchQ && matchMethod && matchType;
    });
  }, [payments, q, method, type]);

  return (
    <div className="space-y-6 p-4 lg:p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Ödeme Geçmişi</h1>
          <p className="text-sm text-slate-400">Aidat ve diğer ödemeler</p>
        </div>
      </div>

      <Card className="border-slate-800 bg-slate-900">
        <CardContent className="p-4">
          <div className="flex flex-col gap-4 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                placeholder="Öğrenci adı ile ara"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                className="border-slate-700 bg-slate-800 pl-10 text-white placeholder:text-slate-500"
              />
            </div>
            <Select value={method} onValueChange={setMethod}>
              <SelectTrigger className="w-full border-slate-700 bg-slate-800 text-white sm:w-40">
                <SelectValue placeholder="Yöntem" />
              </SelectTrigger>
              <SelectContent className="border-slate-700 bg-slate-800">
                <SelectItem value="all" className="text-white">
                  Tümü
                </SelectItem>
                <SelectItem value="cash" className="text-white">
                  Nakit
                </SelectItem>
                <SelectItem value="credit_card" className="text-white">
                  Kart
                </SelectItem>
                <SelectItem value="bank_transfer" className="text-white">
                  Havale
                </SelectItem>
              </SelectContent>
            </Select>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger className="w-full border-slate-700 bg-slate-800 text-white sm:w-40">
                <SelectValue placeholder="Tür" />
              </SelectTrigger>
              <SelectContent className="border-slate-700 bg-slate-800">
                <SelectItem value="all" className="text-white">
                  Tümü
                </SelectItem>
                <SelectItem value="dues" className="text-white">
                  Aidat
                </SelectItem>
                <SelectItem value="product" className="text-white">
                  Ürün
                </SelectItem>
                <SelectItem value="registration" className="text-white">
                  Kayıt
                </SelectItem>
                <SelectItem value="other" className="text-white">
                  Diğer
                </SelectItem>
              </SelectContent>
            </Select>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="border-slate-700 text-slate-300 bg-transparent"
                >
                  Tarih Aralığı
                </Button>
              </PopoverTrigger>
              <PopoverContent className="bg-slate-900 border-slate-800">
                <DayPicker mode="range" selected={range} onSelect={setRange} />
                <div className="mt-2 flex justify-end">
                  <Button
                    className="bg-blue-600 hover:bg-blue-700"
                    onClick={() => {
                      const params = new URLSearchParams(sp.toString());
                      if (range?.from)
                        params.set("from", range.from.toISOString());
                      else params.delete("from");
                      if (range?.to) params.set("to", range.to.toISOString());
                      else params.delete("to");
                      router.push(
                        `/dashboard/payment-history?${params.toString()}`
                      );
                    }}
                  >
                    Uygula
                  </Button>
                </div>
              </PopoverContent>
            </Popover>
            <Button
              variant="outline"
              className="border-slate-700 text-slate-300 bg-transparent"
              onClick={() => {
                const rows = filtered.map((p) =>
                  [
                    p.paymentDate,
                    p.student?.fullName || "",
                    p.branchId || "",
                    p.amount,
                    p.paymentMethod || "",
                    p.paymentType,
                    p.referenceNo || "",
                    p.receivedBy || "",
                  ].join(",")
                );
                const csv = [
                  "Tarih,Öğrenci,Şube,Tutar,Yöntem,Tür,Referans,Alan",
                  ...rows,
                ].join("\n");
                const blob = new Blob([csv], {
                  type: "text/csv;charset=utf-8;",
                });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `odeme-gecmisi-${new Date().toISOString()}.csv`;
                a.click();
                URL.revokeObjectURL(url);
              }}
            >
              Dışa Aktar (CSV)
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="border-slate-800 bg-slate-900">
        <CardHeader>
          <CardTitle>Ödemeler</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tarih</TableHead>
                <TableHead>Öğrenci</TableHead>
                <TableHead>Şube</TableHead>
                <TableHead>Tutar</TableHead>
                <TableHead>Yöntem</TableHead>
                <TableHead>Tür</TableHead>
                <TableHead>Referans</TableHead>
                <TableHead>Alan</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((p) => (
                <TableRow key={p.id}>
                  <TableCell>
                    {p.paymentDate
                      ? new Date(p.paymentDate).toLocaleString("tr-TR")
                      : "-"}
                  </TableCell>
                  <TableCell>{p.student?.fullName || "-"}</TableCell>
                  <TableCell>{p.branchId || "-"}</TableCell>
                  <TableCell>
                    {Number(p.amount || 0).toLocaleString("tr-TR")} TL
                  </TableCell>
                  <TableCell>{p.paymentMethod || "-"}</TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className="text-white border-slate-700"
                    >
                      {p.paymentType}
                    </Badge>
                  </TableCell>
                  <TableCell>{p.referenceNo || "-"}</TableCell>
                  <TableCell>{p.receivedBy || "-"}</TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="text-slate-400">
                    Kayıt bulunamadı
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
