import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { RxHamburgerMenu } from "react-icons/rx";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

export default function Layout({ children }: { children: React.ReactNode }) {
  const { toast } = useToast();
  const { data: user } = useQuery({
    queryKey: ["/api/user"],
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/logout");
    },
    onSuccess: () => {
      queryClient.setQueryData(["/api/user"], null);
      toast({
        title: "Выход выполнен",
        description: "Вы успешно вышли из аккаунта",
      });
    },
  });

  return (
    <div className="min-h-screen bg-[#F0FFF4]">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center">
          <div className="mr-4 flex">
            <Link href="/" className="mr-6 flex items-center space-x-2">
              <span className="font-bold text-xl">Biofood A8</span>
            </Link>
          </div>

          <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
            <nav className="flex items-center space-x-2">
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="outline" size="icon" className="md:hidden">
                    <RxHamburgerMenu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left">
                  <SheetHeader>
                    <SheetTitle>Меню</SheetTitle>
                  </SheetHeader>
                  <div className="flex flex-col space-y-4 mt-4">
                    <Link href="/menu">
                      <Button variant="ghost" className="w-full justify-start">
                        Меню
                      </Button>
                    </Link>
                    {user?.role === "kitchen_staff" && (
                      <>
                        <Link href="/kitchen">
                          <Button variant="ghost" className="w-full justify-start">
                            Кухня
                          </Button>
                        </Link>
                        <Link href="/analytics">
                          <Button variant="ghost" className="w-full justify-start">
                            Аналитика
                          </Button>
                        </Link>
                      </>
                    )}
                    {user && (
                      <Button
                        variant="ghost"
                        className="w-full justify-start"
                        onClick={() => logoutMutation.mutate()}
                      >
                        Выйти
                      </Button>
                    )}
                  </div>
                </SheetContent>
              </Sheet>

              <div className="hidden md:flex md:items-center md:space-x-2">
                <Link href="/menu">
                  <Button variant="ghost">Меню</Button>
                </Link>
                {user?.role === "kitchen_staff" && (
                  <>
                    <Link href="/kitchen">
                      <Button variant="ghost">Кухня</Button>
                    </Link>
                    <Link href="/analytics">
                      <Button variant="ghost">Аналитика</Button>
                    </Link>
                  </>
                )}
                {user && (
                  <Button
                    variant="ghost"
                    onClick={() => logoutMutation.mutate()}
                  >
                    Выйти
                  </Button>
                )}
              </div>
            </nav>
          </div>
        </div>
      </header>

      <main className="container py-6">{children}</main>
    </div>
  );
}