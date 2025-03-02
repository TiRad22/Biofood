import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { type MenuItem } from "@shared/schema";
import MenuItemCard from "@/components/menu-item-card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface CartItem {
  item: MenuItem;
  quantity: number;
  notes?: string;
}

export default function Menu() {
  const [, navigate] = useLocation();
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [cart, setCart] = useState<CartItem[]>([]);

  const { data: menuItems = [], isLoading } = useQuery<MenuItem[]>({
    queryKey: ["/api/menu"],
  });

  if (isLoading) {
    return <div>Загрузка...</div>;
  }

  const categories = ["all", ...Array.from(new Set(menuItems.map((item) => item.category)))];
  const filteredItems = selectedCategory === "all"
    ? menuItems
    : menuItems.filter((item) => item.category === selectedCategory);

  const handleAddToOrder = (item: MenuItem, notes?: string) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.item.id === item.id);
      if (existing) {
        return prev.map((i) =>
          i.item.id === item.id ? { ...i, quantity: i.quantity + 1, notes } : i
        );
      }
      return [...prev, { item, quantity: 1, notes }];
    });
  };

  const cartTotal = cart.reduce(
    (sum, { item, quantity }) => sum + item.price * quantity,
    0
  );

  const handleContinueToOrder = () => {
    sessionStorage.setItem('cartData', JSON.stringify(cart));
    navigate('/order');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Меню</h1>
        <Select
          value={selectedCategory}
          onValueChange={(value) => setSelectedCategory(value)}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Категория" />
          </SelectTrigger>
          <SelectContent>
            {categories.map((category) => (
              <SelectItem key={category} value={category}>
                {category === "all" ? "Все" : 
                  category.charAt(0).toUpperCase() + category.slice(1)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredItems.map((item) => (
          <MenuItemCard key={item.id} item={item} onAddToOrder={handleAddToOrder} />
        ))}
      </div>

      {cart.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-background border-t p-4">
          <div className="container flex items-center justify-between">
            <div>
              <span className="text-lg font-medium">
                {cart.reduce((sum, { quantity }) => sum + quantity, 0)} позиций
              </span>
              <span className="text-lg font-medium ml-4">
                {cartTotal.toLocaleString("ru-RU", {
                  style: "currency",
                  currency: "RUB",
                })}
              </span>
            </div>
            <Button onClick={handleContinueToOrder}>
              Продолжить к оформлению
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}