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

interface PaymentSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  student: Student
  due?: MonthlyDue | null
}

export function PaymentSheet({ open, onOpenChange, student, due }: PaymentSheetProps) {
  const [amount, setAmount] = useState(due ? String(due.amount - due.paidAmount) : "")
  const [paymentMethod, setPaymentMethod] = useState("cash")
  const [description, setDescription] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("tr-TR", {
      style: "currency",
      currency: "TRY",
      minimumFractionDigits: 0,
    }).format(value)
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000))
    setIsSubmitting(false)
    onOpenChange(false)
    // Reset form
    setAmount("")
    setPaymentMethod("cash")
    setDescription("")
  }

  const remainingAmount = due ? due.amount - due.paidAmount : 0

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

          {/* Amount */}
          <div className="space-y-2">
            <Label>Tutar (TL)</Label>
            <Input
              type="number"
              placeholder="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="text-lg"
            />
            {due && (
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="text-xs bg-transparent"
                  onClick={() => setAmount(String(remainingAmount))}
                >
                  Tamamı ({formatCurrency(remainingAmount)})
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="text-xs bg-transparent"
                  onClick={() => setAmount(String(remainingAmount / 2))}
                >
                  Yarısı ({formatCurrency(remainingAmount / 2)})
                </Button>
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
          <Button className="w-full" size="lg" onClick={handleSubmit} disabled={!amount || isSubmitting}>
            {isSubmitting ? "İşleniyor..." : `${formatCurrency(Number(amount) || 0)} Ödeme Al`}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
