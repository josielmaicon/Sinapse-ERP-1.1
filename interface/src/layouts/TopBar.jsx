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

// 1. Importe seu arquivo de rotas
import routes from "@/routes.jsx"; // Ajuste o caminho se necessário

// Importe a função 'cn' para gerenciar classes condicionalmente
import { cn } from "@/lib/utils";

export function TopBar() {
  return (
    <header className="w-full flex h-16 items-center justify-between border-b bg-background px-4 md:px-6">
      {/* Parte Esquerda: Logo/Nome da Empresa */}
      <div className="flex items-center gap-2">
        <span className="text-lg font-semibold">Sinápse</span>
      </div>

      {/* Parte Central: Navegação (AGORA VINDO DO SEU ARQUIVO DE ROTAS) */}
      <div className="hidden md:flex">
        <NavigationMenu>
          <NavigationMenuList>
            {/* 2. Filtre as rotas e depois mapeie, como no seu código antigo */}
            {routes
              .filter((route) => route.showInNav)
              .map((route) => (
                <NavLink key={route.path}>
                  <NavLink>
                    {/* 3. Use NavLink para o estilo de 'ativo' */}
                    <NavLink
                      to={route.path}
                      // A função no className nos dá o estado 'isActive'
                      className={({ isActive }) =>
                        cn(
                          "group inline-flex h-9 w-max items-center justify-center gap-2 rounded-md bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:outline-none disabled:pointer-events-none disabled:opacity-50",
                          // Se estiver ativo, aplique estas classes
                          isActive && "bg-accent text-accent-foreground"
                        )
                      }
                    >
                      <route.icon className="h-4 w-4" />
                      {route.name}
                    </NavLink>
                  </NavLink>
                </NavLink>
              ))}
          </NavigationMenuList>
        </NavigationMenu>
      </div>

      {/* Parte Direita: Dropdown do Usuário */}
      <div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 rounded-full">
              <span className="hidden text-sm font-medium sm:inline">
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