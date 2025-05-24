import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";

// Páginas
import Home from "./pages/home";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import AgendarCita from "./pages/AgendarCita";
import Citas from "./pages/Citas";
import Clientes from "./pages/Clientes";
import Servicios from "./pages/Servicios";
import Profesionales from "./pages/Profesionales";
import Reportes from "./pages/Reportes";
import Inventario from "./pages/Inventario";
import NotFound from "./pages/NotFound";

// Panel de administración
import AdminLogin from "./pages/admin/AdminLogin";
import AdminPanel from "./pages/admin/AdminPanel";
import EmpresasAdmin from "./pages/admin/EmpresasAdmin";
import UsuariosAdmin from "./pages/admin/UsuariosAdmin";
import PerfilesAdmin from "./pages/admin/PerfilesAdmin";
import RegistroEmpresa from "./pages/admin/RegistroEmpresa";
import CerrarAcceso from "./pages/admin/CerrarAcceso";

// Contexto de empresa
import { EmpresaContext } from "./context/EmpresaContext";

const queryClient = new QueryClient();

// Componente para rutas protegidas con permiso específico
const ProtectedRoute = ({
  children,
  requiredPermission,
}: {
  children: React.ReactNode;
  requiredPermission?: string;
}) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [hasPermission, setHasPermission] = useState<boolean>(true);

  useEffect(() => {
    const userStr = localStorage.getItem("user");
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        setIsAuthenticated(true);

        // Verificar permiso específico si se requiere
        if (requiredPermission) {
          // Permite acceso a admin siempre, aunque no tenga el permiso explícito
          if (user.role === "admin" || user.role === "superadmin") {
            setHasPermission(true);
          } else {
            // Permisos puede ser [{ nombre, acciones }], así que revisamos por nombre
            const userPermissions = user.permissions || [];
            const hasPage = userPermissions.some(
              (perm: any) =>
                (typeof perm === "string" && perm === requiredPermission) ||
                (typeof perm === "object" && perm.nombre === requiredPermission)
            );
            setHasPermission(hasPage);
          }
        }
      } catch (error) {
        console.error("Error parsing user data:", error);
        setIsAuthenticated(false);
      }
    } else {
      setIsAuthenticated(false);
    }
  }, [requiredPermission]);

  // Mientras se verifica la autenticación
  if (isAuthenticated === null) {
    return <div className="min-h-screen flex items-center justify-center">Cargando...</div>;
  }

  // Si no está autenticado, redirigir a login
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Si no tiene permiso, mostrar página de acceso denegado
  if (requiredPermission && !hasPermission) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <h1 className="text-2xl font-bold mb-4">Acceso denegado</h1>
        <p className="text-gray-600 mb-4">No tienes permiso para acceder a esta página.</p>
        <button
          onClick={() => window.history.back()}
          className="px-4 py-2 bg-salon-primary text-white rounded-md hover:bg-salon-secondary transition-colors"
        >
          Volver
        </button>
      </div>
    );
  }

  return <>{children}</>;
};

const App = () => {
  // Obtener el usuario logueado desde localStorage
  const userStr = localStorage.getItem("user");
  const user = userStr ? JSON.parse(userStr) : null;

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        {/* Provee el objeto empresa completo al contexto */}
        <EmpresaContext.Provider value={user?.empresa || {}}>
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />

              {/* Rutas protegidas */}
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute requiredPermission="dashboard">
                    <Dashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/agendar-cita"
                element={
                  <ProtectedRoute requiredPermission="citas">
                    <AgendarCita />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/citas"
                element={
                  <ProtectedRoute requiredPermission="citas">
                    <Citas />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/clientes"
                element={
                  <ProtectedRoute requiredPermission="clientes">
                    <Clientes />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/servicios"
                element={
                  <ProtectedRoute requiredPermission="servicios">
                    <Servicios />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/profesionales"
                element={
                  <ProtectedRoute requiredPermission="profesionales">
                    <Profesionales />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/inventario"
                element={
                  <ProtectedRoute requiredPermission="inventario">
                    <Inventario />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/reportes"
                element={
                  <ProtectedRoute requiredPermission="reportes">
                    <Reportes />
                  </ProtectedRoute>
                }
              />

              {/* Panel de administración */}
              <Route path="/wolfx-admin" element={<AdminLogin />} />
              <Route path="/wolfx-admin/panel" element={<AdminPanel />} />
              <Route
                path="/admin/empresas"
                element={
                  <ProtectedRoute requiredPermission="admin">
                    <EmpresasAdmin />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/usuarios"
                element={
                  <ProtectedRoute requiredPermission="admin">
                    <UsuariosAdmin />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/registro-empresa"
                element={
                  <ProtectedRoute requiredPermission="admin">
                    <RegistroEmpresa />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/perfiles"
                element={
                  <ProtectedRoute requiredPermission="admin">
                    <PerfilesAdmin />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/CerrarAcceso"
                element={
                  <ProtectedRoute requiredPermission="admin">
                    <CerrarAcceso />
                  </ProtectedRoute>
                }
              />

              {/* Ruta 404 */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </EmpresaContext.Provider>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;