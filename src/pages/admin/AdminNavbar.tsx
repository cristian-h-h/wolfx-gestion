import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

export default function AdminNavbar() {
  const navigate = useNavigate();

  return (
    <nav className="w-full bg-white/90 shadow flex gap-2 px-4 py-2 items-center z-50">
      <Button variant="ghost" onClick={() => navigate("/wolfx-admin/panel")}>Panel</Button>
      <Button variant="ghost" onClick={() => navigate("/admin/empresas")}>Empresas</Button>
      <Button variant="ghost" onClick={() => navigate("/admin/usuarios")}>Usuarios</Button>
      <Button variant="ghost" onClick={() => navigate("/admin/perfiles")}>Perfiles</Button>
      <Button variant="ghost" onClick={() => navigate("/admin/registro-empresa")}>Registrar Empresa</Button>
      {/* Nuevo botón para cierre de acceso */}
      <Button
        variant="ghost"
        className="text-red-600 font-semibold"
        onClick={() => navigate("/admin/CerrarAcceso")}
      >
        Cerrar Acceso Empresa
      </Button>
    </nav>
  );
}