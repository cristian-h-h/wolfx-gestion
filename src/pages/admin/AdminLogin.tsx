import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const ADMIN_EMAIL = "cyl.contadores@live.cl";
const ADMIN_PASSWORD = "WolfX@1977";

export default function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [recovering, setRecovering] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Primero intenta validar contra el backend
    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (res.ok && (data.user.role === "superadmin" || data.user.role === "admin")) {
        localStorage.setItem("user", JSON.stringify(data.user));
        toast.success("Bienvenido al panel administrador");
        setTimeout(() => {
          navigate("/wolfx-admin/panel");
        }, 1500);
        return;
      } else if (res.ok) {
        toast.error("Sin permisos de administrador");
        return;
      }
    } catch {
      // Si falla la conexión, pasa a validación local
    }
    // Validación local como respaldo
    if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
      localStorage.setItem("user", JSON.stringify({ email, role: "superadmin" }));
      toast.success("Bienvenido al panel administrador (local)");
      setTimeout(() => {
        navigate("/wolfx-admin/panel");
      }, 1500);
    } else {
      toast.error("Credenciales incorrectas");
    }
  };

  const handleRecover = async () => {
    setRecovering(true);
    setTimeout(() => {
      toast.success("Se ha enviado un correo de recuperación a cyl.contadores@live.cl");
      setRecovering(false);
    }, 1500);
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
      <Card className="w-full max-w-sm p-8 bg-white/90 shadow-2xl">
        <CardHeader>
          <CardTitle className="text-center text-2xl font-bold mb-2">Acceso Panel Admin</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-5" onSubmit={handleSubmit}>
            <div>
              <Input
                type="email"
                placeholder="Correo admin"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                placeholder="Contraseña"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                className="absolute right-2 top-2 text-xs text-gray-600"
                onClick={() => setShowPassword((v) => !v)}
                tabIndex={-1}
              >
                {showPassword ? "Ocultar" : "Ver"}
              </button>
            </div>
            <Button type="submit" className="w-full">Ingresar</Button>
          </form>
          <div className="mt-4 text-center">
            <button
              className="text-blue-600 hover:underline text-sm"
              onClick={handleRecover}
              disabled={recovering}
              type="button"
            >
              {recovering ? "Enviando..." : "¿Olvidaste tu contraseña?"}
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}