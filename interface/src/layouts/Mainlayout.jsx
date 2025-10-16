import { Outlet } from "react-router-dom";
import { TopBar } from "@/layouts/TopBar";

export default function MainLayout() {
  return (
    <div className="h-screen w-screen flex flex-col bg-muted/40">
      <TopBar />
      <main className="flex-1 flex min-h-0">
        {/* O <Outlet> é o placeholder onde o React Router irá renderizar a página da rota atual (HomePage, ProdutosPage, etc.) */}
        <Outlet />
      </main>
    </div>
  );
}