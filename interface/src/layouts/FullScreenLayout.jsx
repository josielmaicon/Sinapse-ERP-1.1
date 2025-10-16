// src/layouts/FullScreenLayout.jsx

import { Outlet } from "react-router-dom";

export default function FullScreenLayout() {
  return (
    // Este layout simplesmente ocupa 100% do espaço e renderiza a página filha.
    <div className="w-full h-full">
      <Outlet />
    </div>
  );
}