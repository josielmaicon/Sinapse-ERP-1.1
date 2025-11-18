"use client"

import * as React from "react"
import { NavLink, useNavigate } from "react-router-dom";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
} from "@/components/ui/navigation-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Logo from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { CircleSlash, CircleDot, Settings } from "lucide-react";
import routes from "@/routes.jsx";
import { cn } from "@/lib/utils";

function useTheme() {
    const [theme, setTheme] = React.useState("light");

    React.useEffect(() => {
        // Checa o tema atual no HTML ou localStorage
        const isDark = document.documentElement.classList.contains("dark");
        setTheme(isDark ? "dark" : "light");
    }, []);

    const toggleTheme = () => {
        const root = document.documentElement;
        if (theme === "light") {
            root.classList.add("dark");
            setTheme("dark");
            localStorage.setItem("theme", "dark"); 
        } else {
            root.classList.remove("dark");
            setTheme("light");
            localStorage.setItem("theme", "light");
        }
    };

    return { theme, toggleTheme };
}

export function TopBar() {
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  return (
  <header className="w-full flex h-1/13 items-center justify-between px-4 md:px-6 ">
  <div className="flex items-center gap-2 pr-4">
    <Logo variant="icon" width="36px" height="33px"/>
  </div>

  {/* Centro - Menu alinhado à esquerda */}
  <div className="hidden md:flex flex-1 justify-start">
    <NavigationMenu>
      <NavigationMenuList className="justify-start">
        {routes
          .filter((route) => route.showInNav)
          .map((route) => (
            <NavLink
              key={route.path}
              to={route.path}
              className={({ isActive }) =>
                cn(
                  "group inline-flex h-9 w-max items-center justify-center gap-2 rounded-md px-4 py-2 text-[14px] font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:outline-none disabled:pointer-events-none disabled:opacity-50",
                  isActive && "text-accent-foreground"
                )
              }
            >
              {route.name}
            </NavLink>
          ))}
      </NavigationMenuList>
    </NavigationMenu>
  </div>

  <div className="flex items-center gap-4">
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-2 rounded-full">
          <span className="hidden text-[14px] font-medium sm:inline">
            Usuário Teste
          </span>
          <Avatar className="h-8 w-8">
            <AvatarImage src="https://github.com/shadcn.png" alt="Avatar" />
            <AvatarFallback>UT</AvatarFallback>
          </Avatar>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Minha Conta</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem>Perfil</DropdownMenuItem>
        <DropdownMenuItem>Faturamento</DropdownMenuItem>
        <DropdownMenuItem>Configurações</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem>Sair</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>

    <Button 
        variant="ghost" 
        size="icon" 
        onClick={toggleTheme}
        title={theme === "dark" ? "Mudar para Tema Claro" : "Mudar para Tema Escuro"}
        className="w-10 h-10"
    >
        {theme === "dark" ? (
            <CircleDot className="h-8 w-8 text-yellow-500 transition-all" />
        ) : (
            <CircleSlash className="h-8 w-8 text-slate-700 transition-all" />
        )}
        <span className="sr-only">Alternar Tema</span>
    </Button>

    {/* C. Configurações (Botão Final) */}
    <Button 
        variant="ghost" 
        size="icon" 
        onClick={() => navigate("/configuracoes")}
        title="Configurações do Sistema"
        className="w-10 h-10"
    >
        <Settings className="h-8 w-8 text-muted-foreground transition-transform hover:rotate-90" />
        <span className="sr-only">Configurações</span>
    </Button>
  </div>
</header>

  );
}