import { Outlet } from "react-router-dom";

export default function FullScreenLayout() {
  return (
    // h-screen garante 100vh direto na raiz do layout
    <div className="w-full h-screen flex flex-col">
      <Outlet />
    </div>
  );
}
