import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import AdminNavbar from "./AdminNavbar"; // Ajusta la ruta si tu navbar está en otro lugar

export default function AdminPanel() {
  const navigate = useNavigate();

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center p-4"
      style={{
        backgroundImage: "url('/wolf-x-imagenes/fondo-panel.jpg')",
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <AdminNavbar />
      <Card className="w-full max-w-xl p-8 bg-white/90 shadow-2xl mt-6">
        <CardHeader>
          <CardTitle className="text-center text-3xl font-bold mb-2">Panel de Administración</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4">
            <Button onClick={() => navigate("/admin/empresas")}>Empresas</Button>
            <Button onClick={() => navigate("/admin/usuarios")}>Usuarios</Button>
            <Button onClick={() => navigate("/admin/perfiles")}>Perfiles</Button>
            <Button onClick={() => navigate("/admin/registro-empresa")}>Registrar Nueva Empresa</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}