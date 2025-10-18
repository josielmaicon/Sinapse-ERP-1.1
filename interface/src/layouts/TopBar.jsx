import { NavLink } from "react-router-dom";
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

// 1. Importe seu arquivo de rotas
import routes from "@/routes.jsx"; // Ajuste o caminho se necessário

// Importe a função 'cn' para gerenciar classes condicionalmente
import { cn } from "@/lib/utils";

export function TopBar() {
  return (
<header className="w-full flex h-20 items-center justify-between px-4 md:px-6 ">
  {/* Esquerda */}
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

  {/* Direita */}
  <div>
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
  </div>
</header>

  );
}