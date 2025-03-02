import { useQuery } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface PopularItem {
  id: number;
  name: string;
  quantity: number;
  totalAmount: number;
}

interface TimeSlotData {
  timeSlot: string;
  orderCount: number;
}

export default function Analytics() {
  const { data: popularItems = [], isLoading: isLoadingPopular } = useQuery<PopularItem[]>({
    queryKey: ["/api/analytics/popular-items"],
  });

  const { data: timeSlots = [], isLoading: isLoadingTimeSlots } = useQuery<TimeSlotData[]>({
    queryKey: ["/api/analytics/time-slots"],
  });

  if (isLoadingPopular || isLoadingTimeSlots) {
    return <div>Загрузка...</div>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Аналитика</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Популярные блюда</CardTitle>
            <CardDescription>
              Топ блюд по количеству заказов
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={popularItems}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="quantity" fill="#2ECC71" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Загруженность по времени</CardTitle>
            <CardDescription>
              Количество заказов по временным слотам
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={timeSlots}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="timeSlot" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="orderCount" fill="#2ECC71" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Детальная статистика</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="divide-y">
            {popularItems.map((item) => (
              <div key={item.id} className="py-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-medium">{item.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      Количество заказов: {item.quantity}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">
                      {item.totalAmount.toLocaleString("ru-RU", {
                        style: "currency",
                        currency: "RUB",
                      })}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}