import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import AdminNavbar from "./AdminNavbar"; // Asegúrate que la ruta sea correcta


export default function RegistroEmpresa() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    rut: "",
    razonSocial: "",
    nombreFantasia: "",
    direccion: "",
    adminNombre: "",
    adminTelefono: "",
    adminCorreo: "",
    clienteTelefono: "",
    logo: "",
  });
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, files } = e.target;
    if (name === "logo" && files && files[0]) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setForm((prev) => ({ ...prev, logo: ev.target?.result as string }));
        setLogoPreview(ev.target?.result as string);
      };
      reader.readAsDataURL(files[0]);
    } else {
      setForm((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !form.rut ||
      !form.razonSocial ||
      !form.nombreFantasia ||
      !form.direccion ||
      !form.adminNombre ||
      !form.adminTelefono ||
      !form.clienteTelefono ||
      !form.adminCorreo ||
      !form.logo
    ) {
      toast.error("Por favor, completa todos los campos.");
      return;
    }

    // Detecta el puerto actual para el fetch si no es 3000
    const apiUrl =
      window.location.port && window.location.port !== "3000"
        ? `${window.location.origin}/api/empresas`
        : "/api/empresas";

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    let data = {};
    try {
      data = await response.json();
    } catch {}

    if (response.ok) {
      toast.success("Empresa registrada correctamente.");
      setTimeout(() => {
        navigate("/wolfx-admin/panel");
      }, 1500);
    } else {
      toast.error(data.message || "Error al registrar empresa.");
    }
  };

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
      <Card className="w-full max-w-2xl p-8 bg-white/90 shadow-2xl mt-6">
        <CardHeader>
          <CardTitle className="text-center text-3xl font-bold mb-2">Registro de Nueva Empresa</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-5" onSubmit={handleSubmit}>
            <div>
              <Label htmlFor="rut">RUT</Label>
              <Input
                id="rut"
                name="rut"
                value={form.rut}
                onChange={handleChange}
                required
              />
            </div>
            <div>
              <Label htmlFor="razonSocial">Razón Social</Label>
              <Input
                id="razonSocial"
                name="razonSocial"
                value={form.razonSocial}
                onChange={handleChange}
                required
              />
            </div>
            <div>
              <Label htmlFor="nombreFantasia">Nombre de Fantasía</Label>
              <Input
                id="nombreFantasia"
                name="nombreFantasia"
                value={form.nombreFantasia}
                onChange={handleChange}
                required
              />
            </div>
            <div>
              <Label htmlFor="direccion">Dirección</Label>
              <Input
                id="direccion"
                name="direccion"
                value={form.direccion}
                onChange={handleChange}
                required
              />
            </div>
            <div>
              <Label htmlFor="adminNombre">Nombre y Apellido Administrador</Label>
              <Input
                id="adminNombre"
                name="adminNombre"
                value={form.adminNombre}
                onChange={handleChange}
                required
              />
            </div>
            <div>
              <Label htmlFor="adminTelefono">Teléfono Móvil Administrador</Label>
              <Input
                id="adminTelefono"
                name="adminTelefono"
                value={form.adminTelefono}
                onChange={handleChange}
                required
              />
            </div>
            <div>
              <Label htmlFor="clienteTelefono">Teléfono Atención Cliente</Label>
              <Input
                id="clienteTelefono"
                name="clienteTelefono"
                value={form.clienteTelefono}
                onChange={handleChange}
                required
              />
            </div>
            <div>
              <Label htmlFor="adminCorreo">Correo Electrónico Administrador</Label>
              <Input
                id="adminCorreo"
                name="adminCorreo"
                type="email"
                value={form.adminCorreo}
                onChange={handleChange}
                required
              />
            </div>
            <div>
              <Label htmlFor="logo">Logo de la Empresa</Label>
              <Input
                id="logo"
                name="logo"
                type="file"
                accept="image/*"
                onChange={handleChange}
                required
              />
              {logoPreview && (
                <img
                  src={logoPreview}
                  alt="Logo Preview"
                  className="h-24 mt-2 rounded shadow border"
                />
              )}
            </div>
            <div className="pt-4 flex justify-center">
              <Button
                type="submit"
                className="px-8 py-3 rounded-full bg-salon-primary hover:bg-salon-secondary text-white font-bold text-lg shadow-lg"
              >
                Registrar Empresa
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}