import { Navigate, Outlet } from "react-router-dom";

const PrivateRoute = () => {
  // 1. Verifica se o token existe no localStorage
  const token = localStorage.getItem("sinapse_token");

  // 2. Se tiver token, renderiza as rotas filhas (<Outlet />)
  // 3. Se NÃO tiver token, redireciona para /login
  return token ? <Outlet /> : <Navigate to="/login" replace />;
};

export default PrivateRoute;