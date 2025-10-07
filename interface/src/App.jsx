import { Routes, Route } from "react-router-dom";
import { TopBar } from "@/layouts/TopBar";
import routes from "@/routes.jsx";

function App() {
  return (
    <div className="min-h-screen flex flex-col bg-muted/40">
      <TopBar />
      <main className="flex-grow h-full flex">
        <Routes>
          {routes.map((route) => (
            <Route key={route.path} path={route.path} element={route.component} />
          ))}
        </Routes>
      </main>
    </div>
  );
}

export default App;