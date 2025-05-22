import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Calendar, Users, Package, Scissors, BarChart2, Menu, X, Home } from "lucide-react";
import SalonLogo from "./SalonLogo";
import { useEmpresa } from "@/context/EmpresaContext";

interface NavItem {
  name: string;
  href: string;
  icon: React.ElementType;
  permission: string;
}

const navItems: NavItem[] = [
  { name: "Home", href: "/dashboard", icon: Home, permission: "dashboard" },
  { name: "Agendar Cita", href: "/agendar-cita", icon: Calendar, permission: "citas" }, // <-- NUEVO
  { name: "Registro Atencion", href: "/citas", icon: Calendar, permission: "citas" },
  { name: "Ingreso Clientes", href: "/clientes", icon: Users, permission: "clientes" },
  { name: "Control Inventario", href: "/inventario", icon: Package, permission: "inventario" },
  { name: "Ingreso Servicios", href: "/servicios", icon: Scissors, permission: "servicios" },
  { name: "Registro Profesionales", href: "/profesionales", icon: Users, permission: "profesionales" },
  { name: "Informes", href: "/reportes", icon: BarChart2, permission: "reportes" },
];

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [userPermissions, setUserPermissions] = useState<string[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const empresa = useEmpresa();

useEffect(() => {
  const userStr = localStorage.getItem("user");
if (userStr) {
  try {
    const user = JSON.parse(userStr);
    console.log("Usuario desde localStorage:", user); // <-- Agrega esto
    let perms = user.permissions || [];
      // Si los permisos son objetos, intenta extraer el campo 'nombre', si no, usa todo el objeto como string
      if (perms.length > 0 && typeof perms[0] === "object") {
       perms = perms
         .map((p: any) => typeof p.page === "string" ? p.page : null)
         .filter(Boolean); // Elimina nulos
     }
      setUserPermissions(perms);
      setIsAdmin(user.role === "admin");
    } catch (error) {
      console.error("Error parsing user data:", error);
      setUserPermissions([]);
      setIsAdmin(false);
      }
    }
  }, []);


  // Filtrar elementos de navegación según permisos
  console.log("Permisos del usuario:", userPermissions);

const filteredNavItems = navItems.filter(item =>
  userPermissions.some(p =>
    typeof p === "string" &&
    p.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").includes(item.permission)
  )
);

  // Verificar si el elemento está activo
  const isActive = (href: string) => {
    return location.pathname === href;
  };

  return (
    <nav className="bg-white shadow-sm border-b dark:bg-gray-900">
      <div className="salon-container">
        <div className="flex justify-between h-16">
          <div className="flex">
            <Link to="/dashboard" className="flex items-center shrink-0">
              <SalonLogo className="h-10 w-auto" />
              {/*<span className="ml-2 text-xl font-semibold text-gray-900 dark:text-white">
                {empresa?.nombreFantasia || "Nombre Empresa"}
              </span>*/}
            </Link>
          </div>

          {/* Desktop Nav */}
          <div className="hidden md:flex md:space-x-0.5">
            {filteredNavItems.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={`group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-all ${
                  isActive(item.href)
                    ? "text-salon-primary bg-salon-accent/50"
                    : "text-gray-700 hover:text-salon-primary hover:bg-salon-accent/50"
                }`}
              >
                <item.icon className={`h-5 w-5 mr-1.5 ${
                  isActive(item.href)
                    ? "text-salon-primary"
                    : "text-gray-500 group-hover:text-salon-primary"
                } transition-colors`} />
                {item.name}
              </Link>
            ))}
          </div>

          {/* Mobile menu button */}
          <div className="flex items-center md:hidden">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-label="Abrir menú"
            >
              {isMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="md:hidden border-t border-gray-200 dark:border-gray-700">
          <div className="pt-2 pb-3 space-y-1">
            {filteredNavItems.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={`flex items-center px-4 py-2 text-base font-medium transition-all ${
                  isActive(item.href)
                    ? "text-salon-primary bg-salon-accent/50"
                    : "text-gray-700 hover:text-salon-primary hover:bg-salon-accent/50"
                }`}
                onClick={() => setIsMenuOpen(false)}
              >
                <item.icon className={`h-5 w-5 mr-2 ${
                  isActive(item.href)
                    ? "text-salon-primary"
                    : "text-gray-500"
                }`} />
                {item.name}
              </Link>
            ))}
          </div>
        </div>
      )}
    </nav>
  );
}