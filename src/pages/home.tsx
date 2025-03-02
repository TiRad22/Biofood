import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function Home() {
  const [, setLocation] = useLocation();

  return (
    <div className="space-y-12">
      {/* Hero Section */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold tracking-tight">
          Добро пожаловать в кафе Biofood A8
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Свежая, здоровая и вкусная еда с заботой о вас. Закажите сейчас для самовывоза или обеда в кафе.
        </p>
        <Button 
          size="lg" 
          onClick={() => setLocation("/menu")}
          className="bg-[#2ECC71] hover:bg-[#27AE60] text-white"
        >
          Посмотреть меню и заказать
        </Button>
      </div>

      {/* Featured Items Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-[#2ECC71]/20">
          <CardContent className="p-0">
            <img
              src="https://images.unsplash.com/photo-1485963631004-f2f00b1d6606"
              alt="Свежая выпечка"
              className="w-full h-48 object-cover"
            />
            <div className="p-4">
              <h3 className="font-semibold text-lg">Свежая выпечка</h3>
              <p className="text-muted-foreground">
                Выпекается ежедневно из органических ингредиентов
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-[#2ECC71]/20">
          <CardContent className="p-0">
            <img
              src="https://images.unsplash.com/photo-1447078806655-40579c2520d6"
              alt="Премиум кофе"
              className="w-full h-48 object-cover"
            />
            <div className="p-4">
              <h3 className="font-semibold text-lg">Премиум кофе</h3>
              <p className="text-muted-foreground">
                Профессионально приготовленные напитки из местных обжаренных зёрен
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-[#2ECC71]/20">
          <CardContent className="p-0">
            <img
              src="https://images.unsplash.com/photo-1494390248081-4e521a5940db"
              alt="Здоровый завтрак"
              className="w-full h-48 object-cover"
            />
            <div className="p-4">
              <h3 className="font-semibold text-lg">Здоровый завтрак</h3>
              <p className="text-muted-foreground">
                Начните свой день правильно с нашими питательными блюдами
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Café Ambiance */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
        <div>
          <img
            src="https://images.unsplash.com/photo-1558596602-b09a835e8bc6"
            alt="Интерьер кафе"
            className="w-full h-[400px] object-cover rounded-lg"
          />
        </div>
        <div className="space-y-4">
          <h2 className="text-3xl font-bold">Идеальное место для каждого</h2>
          <p className="text-lg text-muted-foreground">
            Ищете ли вы тихий уголок для работы, место для непринужденной встречи
            или пространство, чтобы насладиться качественной едой с друзьями - 
            Biofood A8 создает идеальную атмосферу для любого случая.
          </p>
          <Button 
            variant="outline" 
            size="lg"
            onClick={() => setLocation("/menu")}
            className="border-[#2ECC71] text-[#2ECC71] hover:bg-[#2ECC71] hover:text-white"
          >
            Изучить меню
          </Button>
        </div>
      </div>
    </div>
  );
}