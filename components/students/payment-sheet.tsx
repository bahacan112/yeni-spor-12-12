"use client"

import { useState } from "react"
import { CreditCard, Banknote, Building2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from "@/components/ui/sheet"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Textarea } from "@/components/ui/textarea"
import type { Student, MonthlyDue } from "@/lib/types"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"

interface PaymentSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  student: Student
  due?: MonthlyDue | null
}

export function PaymentSheet({ open, onOpenChange, student, due }: PaymentSheetProps) {
  const remainingAmount = due
    ? (due.computedAmount ?? due.amount ?? 0) - (due.paidAmount ?? 0)
    : 0

  const [amountType, setAmountType] = useState<"full" | "custom">(due ? "full" : "custom")
  const [amount, setAmount] = useState(
    due ? String(remainingAmount) : ""
  )
  const [paymentMethod, setPaymentMethod] = useState("cash")
  const [description, setDescription] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const supabase = createClient()

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("tr-TR", {
      style: "currency",
      currency: "TRY",
      minimumFractionDigits: 0,
    }).format(value)
  }

  const handleSubmit = async () => {
    // Determine the final amount based on selection
    const amt = amountType === "full" && due ? remainingAmount : Number(amount || 0)

    if (!amt || amt <= 0) {
      toast.error("Tutar geçersiz")
      return
    }
    if (!student?.tenantId) {
      toast.error("Tenant bulunamadı")
      return
    }
    const branchId = student.branchId || null
    if (!branchId) {
      toast.error("Şube zorunlu")
      return
    }
    setIsSubmitting(true)
    try {
      const paymentType = due ? "dues" : "other"
      const { error: pErr } = await supabase.from("payments").insert({
        tenant_id: student.tenantId,
        branch_id: branchId,
        student_id: student.id,
        monthly_due_id: due?.id || null,
        amount: amt,
        payment_type: paymentType,
        payment_method: paymentMethod,
        description: description || null,
        payment_date: new Date().toISOString().split("T")[0],
      })
      if (pErr) {
        throw pErr
      }
      if (due) {
        const newPaid = (due.paidAmount ?? 0) + amt
        const total = (due.computedAmount ?? due.amount ?? 0)
        const newStatus = newPaid >= total ? "paid" : "partial"
        const { error: dErr } = await supabase
          .from("monthly_dues")
          .update({
            paid_amount: newPaid,
            status: newStatus,
            paid_at: newStatus === "paid" ? new Date().toISOString() : null,
          })
          .eq("id", due.id)
        if (dErr && dErr.code !== "42P01") {
          throw dErr
        }
      }
      toast.success("Ödeme kaydedildi")
      onOpenChange(false)
      setAmount("")
      setPaymentMethod("cash")
      setDescription("")
      location.reload()
    } catch (e) {
      console.error(e)
      toast.error("Ödeme kaydedilemedi")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[85vh] rounded-t-xl">
        <SheetHeader>
          <SheetTitle>Ödeme Al</SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-6 overflow-auto">
          {/* Student Info */}
          <div className="rounded-lg bg-secondary/50 p-3">
            <p className="font-medium">{student.fullName}</p>
            {due && (
              <p className="text-sm text-muted-foreground">
                {new Date(due.dueMonth).toLocaleDateString("tr-TR", { month: "long", year: "numeric" })} Aidatı
              </p>
            )}
            {due && (
              <div className="mt-2 flex justify-between text-sm">
                <span className="text-muted-foreground">Kalan Tutar:</span>
                <span className="font-medium text-amber-500">{formatCurrency(remainingAmount)}</span>
              </div>
            )}
          </div>

          {/* Amount Selection */}
          <div className="space-y-4">
            <Label className="text-base">Ödenecek Tutar</Label>
            
            {due ? (
              <RadioGroup 
                value={amountType} 
                onValueChange={(val) => {
                  setAmountType(val as "full" | "custom")
                  if (val === "full") {
                    setAmount(String(remainingAmount))
                  } else {
                    setAmount("")
                  }
                }} 
                className="grid gap-3"
              >
                <div>
                  <RadioGroupItem value="full" id="amount-full" className="peer sr-only" />
                  <Label
                    htmlFor="amount-full"
                    className="flex flex-col items-start justify-between rounded-lg border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer gap-1"
                  >
                    <span className="font-semibold text-sm">Aylık Aidatın Tamamı</span>
                    <span className="text-xl font-bold text-primary">{formatCurrency(remainingAmount)}</span>
                  </Label>
                </div>
                <div>
                  <RadioGroupItem value="custom" id="amount-custom" className="peer sr-only" />
                  <Label
                    htmlFor="amount-custom"
                    className="flex flex-col items-start justify-between rounded-lg border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer gap-1"
                  >
                    <span className="font-semibold text-sm">Özel Tutar Belirle</span>
                    <span className="text-xs text-muted-foreground">Kısmi ödeme veya avans vb. durumlar için</span>
                  </Label>
                </div>
              </RadioGroup>
            ) : (
              // If there's no specific due attached, always ask for custom amount
              <div />
            )}

            {(amountType === "custom" || !due) && (
              <div className="space-y-2 pt-2 animate-in fade-in slide-in-from-top-2 duration-200">
                <Label>Tutar (TL)</Label>
                <Input
                  type="number"
                  placeholder="Örn: 500"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="text-lg h-12"
                  autoFocus
                />
              </div>
            )}
          </div>

          {/* Payment Method */}
          <div className="space-y-3">
            <Label>Ödeme Yöntemi</Label>
            <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod} className="grid grid-cols-3 gap-2">
              <div>
                <RadioGroupItem value="cash" id="cash" className="peer sr-only" />
                <Label
                  htmlFor="cash"
                  className="flex flex-col items-center justify-center rounded-lg border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                >
                  <Banknote className="mb-2 h-5 w-5" />
                  <span className="text-xs">Nakit</span>
                </Label>
              </div>
              <div>
                <RadioGroupItem value="credit_card" id="credit_card" className="peer sr-only" />
                <Label
                  htmlFor="credit_card"
                  className="flex flex-col items-center justify-center rounded-lg border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                >
                  <CreditCard className="mb-2 h-5 w-5" />
                  <span className="text-xs">Kart</span>
                </Label>
              </div>
              <div>
                <RadioGroupItem value="bank_transfer" id="bank_transfer" className="peer sr-only" />
                <Label
                  htmlFor="bank_transfer"
                  className="flex flex-col items-center justify-center rounded-lg border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                >
                  <Building2 className="mb-2 h-5 w-5" />
                  <span className="text-xs">Havale</span>
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label>Açıklama (Opsiyonel)</Label>
            <Textarea
              placeholder="Ödeme ile ilgili not ekleyin..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <SheetFooter className="mt-6">
          <Button className="w-full" size="lg" onClick={handleSubmit} disabled={(amountType === 'custom' && !amount) || isSubmitting}>
            {isSubmitting ? "İşleniyor..." : `${formatCurrency(amountType === 'full' && due ? remainingAmount : (Number(amount) || 0))} Ödeme Al`}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
