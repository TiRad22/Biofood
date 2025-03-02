import { useState } from "react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { type MenuItem } from "@shared/schema";
import { useQuery } from "@tanstack/react-query";
import Auth from "@/pages/auth";

interface MenuItemCardProps {
  item: MenuItem;
  onAddToOrder: (item: MenuItem, notes?: string) => void;
}

export default function MenuItemCard({ item, onAddToOrder }: MenuItemCardProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isAuthDialogOpen, setIsAuthDialogOpen] = useState(false);
  const [notes, setNotes] = useState("");

  const { data: user } = useQuery({
    queryKey: ["/api/user"],
  });

  const formattedPrice = item.price.toLocaleString("ru-RU", {
    style: "currency",
    currency: "RUB",
  });

  const handleAddToOrder = () => {
    onAddToOrder(item, notes);
    setNotes("");
    setIsDialogOpen(false);
  };

  const handleClick = () => {
    if (!user) {
      setIsAuthDialogOpen(true);
    } else {
      setIsDialogOpen(true);
    }
  };

  return (
    <>
      <Card className="overflow-hidden">
        <div className="aspect-video relative">
          <img
            src={item.imageUrl}
            alt={item.name}
            className="object-cover w-full h-full"
          />
        </div>
        <CardContent className="p-4">
          <h3 className="font-semibold text-lg">{item.name}</h3>
          <p className="text-sm text-muted-foreground mt-1">{item.description}</p>
          <p className="text-lg font-medium mt-2">{formattedPrice}</p>
        </CardContent>
        <CardFooter className="p-4 pt-0">
          <Button
            className="w-full"
            onClick={handleClick}
            disabled={!item.available}
          >
            {item.available ? "Добавить в заказ" : "Нет в наличии"}
          </Button>
        </CardFooter>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Добавить комментарий к блюду</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Textarea
              placeholder="Например: без лука, острый соус отдельно"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Отмена
            </Button>
            <Button onClick={handleAddToOrder}>
              Добавить в заказ
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isAuthDialogOpen} onOpenChange={setIsAuthDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Для оформления заказа необходима регистрация</DialogTitle>
          </DialogHeader>
          <Auth onAuthSuccess={() => {
            setIsAuthDialogOpen(false);
            setIsDialogOpen(true);
          }} />
        </DialogContent>
      </Dialog>
    </>
  );
}