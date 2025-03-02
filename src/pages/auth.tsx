import { useState } from "react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { apiRequest } from "@/lib/queryClient";
import { type InsertUser } from "@shared/schema";

interface AuthProps {
  onAuthSuccess?: () => void;
}

export default function Auth({ onAuthSuccess }: AuthProps) {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState<InsertUser>({
    name: "",
    phone: "",
    password: "",
    role: "customer",
  });

  const authMutation = useMutation({
    mutationFn: async (data: InsertUser) => {
      const endpoint = isLogin ? "/api/login" : "/api/register";
      const response = await apiRequest("POST", endpoint, data);
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: isLogin ? "Вход выполнен" : "Регистрация успешна",
        description: `Добро пожаловать, ${data.name}!`,
      });

      if (onAuthSuccess) {
        onAuthSuccess();
      } else if (data.role === "kitchen_staff") {
        setLocation("/kitchen");
      } else {
        setLocation("/menu");
      }
    },
    onError: () => {
      toast({
        title: "Ошибка",
        description: isLogin
          ? "Неверный телефон или пароль"
          : "Не удалось зарегистрироваться",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.phone || !formData.password || (!isLogin && !formData.name)) {
      toast({
        title: "Ошибка",
        description: "Пожалуйста, заполните все обязательные поля",
        variant: "destructive",
      });
      return;
    }
    authMutation.mutate(formData);
  };

  return (
    <div className="w-full">
      <form onSubmit={handleSubmit} className="space-y-4">
        {!isLogin && (
          <>
            <Input
              placeholder="Имя *"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
            />
            <Select
              value={formData.role}
              onValueChange={(value) =>
                setFormData({ ...formData, role: value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Выберите роль" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="customer">Посетитель</SelectItem>
                <SelectItem value="kitchen_staff">Работник кухни</SelectItem>
              </SelectContent>
            </Select>
          </>
        )}
        <Input
          placeholder="Телефон *"
          value={formData.phone}
          onChange={(e) =>
            setFormData({ ...formData, phone: e.target.value })
          }
        />
        <Input
          type="password"
          placeholder="Пароль *"
          value={formData.password}
          onChange={(e) =>
            setFormData({ ...formData, password: e.target.value })
          }
        />
        {!isLogin && (
          <Input
            type="email"
            placeholder="Email (необязательно)"
            value={formData.email}
            onChange={(e) =>
              setFormData({ ...formData, email: e.target.value })
            }
          />
        )}
        <div className="space-y-2">
          <Button
            type="submit"
            className="w-full"
            disabled={authMutation.isPending}
          >
            {authMutation.isPending
              ? "Загрузка..."
              : isLogin
              ? "Войти"
              : "Зарегистрироваться"}
          </Button>
          <Button
            type="button"
            variant="ghost"
            className="w-full"
            onClick={() => setIsLogin(!isLogin)}
          >
            {isLogin
              ? "Нет аккаунта? Зарегистрируйтесь"
              : "Уже есть аккаунт? Войдите"}
          </Button>
        </div>
      </form>
    </div>
  );
}