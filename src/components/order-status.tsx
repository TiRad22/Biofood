import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { type Order } from "@shared/schema";
import { useState } from "react";
import PaymentForm from "./payment-form";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const statusColors = {
  pending: "bg-yellow-500",
  preparing: "bg-blue-500",
  ready: "bg-green-500",
  completed: "bg-gray-500",
  cancelled: "bg-red-500",
};

const statusTranslations = {
  pending: "Новый",
  preparing: "Готовится",
  ready: "Готов",
  completed: "Выполнен",
  cancelled: "Отменён",
};

interface OrderStatusProps {
  order: Order;
  className?: string;
  onPaymentComplete?: () => void;
}

export default function OrderStatus({ order, className, onPaymentComplete }: OrderStatusProps) {
  const [showPayment, setShowPayment] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const handlePayment = async (paymentData: any) => {
    setIsProcessing(true);
    try {
      const response = await fetch(`/api/orders/${order.id}/payment?type=full_payment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(paymentData),
      });

      if (!response.ok) throw new Error("Payment failed");

      onPaymentComplete?.();
      setShowPayment(false);
    } catch (error) {
      console.error("Payment error:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <>
      <div className="flex items-center gap-2">
        <Badge
          variant="secondary"
          className={`${statusColors[order.status as keyof typeof statusColors]} ${
            className || ""
          }`}
        >
          {statusTranslations[order.status as keyof typeof statusTranslations]}
        </Badge>

        {order.status === "ready" && order.paymentStatus === "partially_paid" && (
          <Button
            size="sm"
            onClick={() => setShowPayment(true)}
          >
            Оплатить остаток
          </Button>
        )}
      </div>

      <Dialog open={showPayment} onOpenChange={setShowPayment}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Оплата оставшейся суммы</DialogTitle>
          </DialogHeader>
          <PaymentForm
            amount={order.total}
            onSubmit={handlePayment}
            isProcessing={isProcessing}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}