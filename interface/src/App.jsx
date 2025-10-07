import { Routes, Route } from "react-router-dom";
import { TopBar } from "@/layouts/TopBar";
import routes from "@/routes.jsx"; // Importe suas rotas

function App() {
  return (
    <div className="flex flex-col min-h-screen">
      <TopBar />
      <main className="flex-grow">
        {/* O Roteador vai aqui! */}
        <Routes>
          {routes.map((route) => (
            <Route
              key={route.path}
              path={route.path}
              element={route.component}
            />
          ))}
        </Routes>
      </main>
    </div>
  );
}

export default App;