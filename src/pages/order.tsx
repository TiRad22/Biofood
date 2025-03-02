import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { apiRequest } from "@/lib/queryClient";
import { type MenuItem, type Order } from "@shared/schema";
import PaymentForm from "@/components/payment-form";
import { Loader2 } from "lucide-react";

interface OrderFormData {
  name: string;
  phone: string;
  email?: string;
  pickupTime: string;
  specialInstructions?: string;
  paymentMethod?: string;
}

interface CartItem {
  item: MenuItem;
  quantity: number;
  notes?: string;
}

export default function Order() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [formData, setFormData] = useState<OrderFormData>({
    name: "",
    phone: "",
    pickupTime: "10:00",
  });
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showPayment, setShowPayment] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<"pending" | "processing" | "completed">("pending");

  // Load cart data from sessionStorage on component mount
  useEffect(() => {
    const savedCart = sessionStorage.getItem('cartData');
    if (savedCart) {
      setCart(JSON.parse(savedCart));
    } else {
      setLocation("/menu");
    }
  }, [setLocation]);

  const orderMutation = useMutation({
    mutationFn: async () => {
      try {
        // Создаем пользователя
        const userResponse = await apiRequest("POST", "/api/users", {
          name: formData.name,
          phone: formData.phone,
          email: formData.email,
        });

        if (!userResponse.ok) {
          throw new Error("Failed to create user");
        }

        const userData = await userResponse.json();

        // Создаем заказ
        const orderResponse = await apiRequest("POST", "/api/orders", {
          userId: userData.id,
          items: cart.map(({ item, quantity, notes }) => ({
            menuItemId: item.id,
            quantity,
            notes: notes || "",
          })),
          total: cart.reduce(
            (sum, { item, quantity }) => sum + item.price * quantity,
            0
          ),
          pickupTime: formData.pickupTime,
          specialInstructions: formData.specialInstructions,
          paymentMethod: formData.paymentMethod,
        });

        if (!orderResponse.ok) {
          throw new Error("Failed to create order");
        }

        const orderData: Order = await orderResponse.json();
        return orderData;
      } catch (error) {
        console.error('Order creation error:', error);
        throw error;
      }
    },
    onSuccess: (data) => {
      sessionStorage.removeItem('cartData');
      setPaymentStatus("completed");
      toast({
        title: "Заказ успешно оформлен!",
        description: `Ваш заказ #${data.id} принят. Время получения: ${formData.pickupTime}`,
      });
      setTimeout(() => setLocation("/menu"), 2000);
    },
    onError: (error) => {
      console.error('Order mutation error:', error);
      setPaymentStatus("pending");
      toast({
        title: "Ошибка",
        description: "Не удалось оформить заказ. Пожалуйста, попробуйте снова.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.phone || !formData.pickupTime) {
      toast({
        title: "Ошибка",
        description: "Пожалуйста, заполните все обязательные поля.",
        variant: "destructive",
      });
      return;
    }

    // Validate pickup time is between 10:00 and 22:00
    const selectedTime = formData.pickupTime;
    if (selectedTime < "10:00" || selectedTime > "22:00") {
      toast({
        title: "Ошибка",
        description: "Время получения заказа должно быть между 10:00 и 22:00",
        variant: "destructive",
      });
      return;
    }

    setShowPayment(true);
  };

  const handlePayment = async (paymentData: {
    cardNumber: string;
    expiryDate: string;
    cvv: string;
    paymentMethod: string;
  }) => {
    setPaymentStatus("processing");
    setFormData({...formData, paymentMethod: paymentData.paymentMethod});
    try {
      await orderMutation.mutateAsync();
    } catch (error) {
      // Ошибка уже обработана в onError мутации
    }
  };

  if (cart.length === 0) {
    return null;
  }

  if (paymentStatus === "processing") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin mb-4" />
        <p className="text-lg">Обработка заказа...</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold">Оформление заказа</h1>

      <div className="bg-white rounded-lg p-6 shadow-sm">
        <h2 className="text-xl font-semibold mb-4">Ваш заказ</h2>
        {cart.map(({ item, quantity, notes }) => (
          <div key={item.id} className="py-2">
            <div className="flex justify-between">
              <span>
                {quantity}x {item.name}
              </span>
              <span>
                {(item.price * quantity).toLocaleString("ru-RU", {
                  style: "currency",
                  currency: "RUB",
                })}
              </span>
            </div>
            {notes && (
              <p className="text-sm text-muted-foreground mt-1">
                Комментарий: {notes}
              </p>
            )}
          </div>
        ))}
        <div className="border-t mt-4 pt-4">
          <div className="flex justify-between font-semibold">
            <span>Итого</span>
            <span>
              {cart
                .reduce(
                  (sum, { item, quantity }) => sum + item.price * quantity,
                  0
                )
                .toLocaleString("ru-RU", {
                  style: "currency",
                  currency: "RUB",
                })}
            </span>
          </div>
        </div>
      </div>

      {!showPayment ? (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Input
              placeholder="Имя *"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>
          <div>
            <Input
              placeholder="Телефон *"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />
          </div>
          <div>
            <Input
              type="email"
              placeholder="Email (необязательно)"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
          </div>
          <div>
            <Input
              type="time"
              min="10:00"
              max="22:00"
              required
              value={formData.pickupTime}
              onChange={(e) => setFormData({ ...formData, pickupTime: e.target.value })}
            />
            <p className="text-sm text-muted-foreground mt-1">
              Время работы кафе: с 10:00 до 22:00
            </p>
          </div>
          <div>
            <Textarea
              placeholder="Дополнительные инструкции (необязательно)"
              value={formData.specialInstructions}
              onChange={(e) =>
                setFormData({ ...formData, specialInstructions: e.target.value })
              }
            />
          </div>
          <Button
            type="submit"
            className="w-full"
          >
            Продолжить к оплате
          </Button>
        </form>
      ) : (
        <PaymentForm
          amount={cart.reduce(
            (sum, { item, quantity }) => sum + item.price * quantity,
            0
          )}
          onSubmit={handlePayment}
          isProcessing={paymentStatus === "processing"}
        />
      )}
    </div>
  );
}