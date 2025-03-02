import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import OrderStatus from "@/components/order-status";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { type Order, type MenuItem, type OrderItem } from "@shared/schema";
import { Loader2 } from "lucide-react";

const statusFlow = {
  pending: "preparing",
  preparing: "ready",
  ready: "completed",
};

const statusTranslations = {
  pending: "Новый",
  preparing: "Готовится",
  ready: "Готов",
  completed: "Выполнен",
  cancelled: "Отменён",
};

export default function Kitchen() {
  const { toast } = useToast();

  const { data: orders = [], isLoading: ordersLoading, error: ordersError } = useQuery<Order[]>({
    queryKey: ["/api/orders"],
    refetchInterval: 5000, // Обновление каждые 5 секунд
  });

  const { data: menuItems = [], isLoading: menuLoading } = useQuery<MenuItem[]>({
    queryKey: ["/api/menu"],
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ orderId, status }: { orderId: number; status: string }) => {
      await apiRequest("PATCH", `/api/orders/${orderId}/status`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
    },
    onError: () => {
      toast({
        title: "Ошибка",
        description: "Не удалось обновить статус заказа",
        variant: "destructive",
      });
    },
  });

  if (ordersError) {
    return (
      <div className="text-center text-red-500">
        Ошибка при загрузке заказов. Пожалуйста, обновите страницу.
      </div>
    );
  }

  if (ordersLoading || menuLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const itemsMap = new Map(menuItems.map((item) => [item.id, item]));

  const activeOrders = orders.filter(
    (order) => !["completed", "cancelled"].includes(order.status)
  );

  const completedOrders = orders.filter(
    (order) => ["completed", "cancelled"].includes(order.status)
  );

  const handleUpdateStatus = (order: Order) => {
    const nextStatus = statusFlow[order.status as keyof typeof statusFlow];
    if (nextStatus) {
      updateStatusMutation.mutate({ orderId: order.id, status: nextStatus });
    }
  };

  const getNextStatusButton = (currentStatus: string) => {
    const nextStatus = statusFlow[currentStatus as keyof typeof statusFlow];
    if (!nextStatus) return null;

    const buttonText = {
      preparing: "Начать готовить",
      ready: "Готово к выдаче",
      completed: "Выдано",
    }[nextStatus];

    return buttonText;
  };

  const renderOrderCard = (order: Order) => {
    if (!order || !order.items) return null;

    const orderItems = order.items as OrderItem[];
    if (!Array.isArray(orderItems)) return null;

    return (
      <Card key={order.id} className="mb-4">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Заказ #{order.id}</CardTitle>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              Время получения: {order.pickupTime}
            </span>
            <OrderStatus order={order} />
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {orderItems.map((item) => {
              const menuItem = itemsMap.get(item.menuItemId);
              if (!menuItem) return null;

              return (
                <div key={item.menuItemId} className="flex justify-between">
                  <span>
                    {item.quantity}x {menuItem.name}
                  </span>
                  {item.notes && (
                    <span className="text-sm text-muted-foreground">
                      Примечание: {item.notes}
                    </span>
                  )}
                </div>
              );
            })}
            {order.specialInstructions && (
              <div className="mt-4 text-sm text-muted-foreground">
                <strong>Особые инструкции:</strong> {order.specialInstructions}
              </div>
            )}
          </div>
          {!["completed", "cancelled"].includes(order.status) && (
            <Button
              className="mt-4 w-full"
              onClick={() => handleUpdateStatus(order)}
              disabled={updateStatusMutation.isPending}
            >
              {getNextStatusButton(order.status)}
            </Button>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Панель управления кухней</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h2 className="text-xl font-semibold mb-4">Активные заказы</h2>
          {activeOrders.length === 0 ? (
            <p className="text-muted-foreground">Нет активных заказов</p>
          ) : (
            activeOrders.map(renderOrderCard)
          )}
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-4">Выполненные заказы</h2>
          {completedOrders.length === 0 ? (
            <p className="text-muted-foreground">Нет выполненных заказов</p>
          ) : (
            completedOrders.slice(0, 5).map(renderOrderCard)
          )}
        </div>
      </div>
    </div>
  );
}