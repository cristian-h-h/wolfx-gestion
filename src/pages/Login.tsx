import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  CardFooter
  
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

const LOCAL_EMAIL = "cyl.contadores@live.cl";
const LOCAL_PASSWORD = "localhost@1977";
const LOCAL_USER = {
  email: LOCAL_EMAIL,
  role: "superadmin",
  permissions: [
    "dashboard", "citas", "clientes", "servicios",
    "profesionales", "inventario", "reportes", "admin"
  ],
  empresaRUT: "00000000-0",
  empresa: { nombreFantasia: "WolfX Dev", rut: "00000000-0" }
};


export default function Login() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [isResetOpen, setIsResetOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [rut, setRut] = useState("");
  const [showUserFields, setShowUserFields] = useState(false);
  const [formData, setFormData] = useState({
    username: "",
    password: "",
  });

  // Simulación de validación de RUT de empresa
  const handleRutSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (rut.length >= 8) {
      setShowUserFields(true);
      toast.success("RUT válido, ingrese sus credenciales.");
    } else {
      toast.error("Ingrese un RUT válido de empresa.");
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Nuevo handleSubmit: login real multiempresa
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

     // --- ACCESO LOCAL SUPERADMIN ---
  if (
    formData.username === LOCAL_EMAIL &&
    formData.password === LOCAL_PASSWORD
  ) {
    localStorage.setItem("user", JSON.stringify(LOCAL_USER));
    toast.success("Acceso de superadmin local");
    navigate("/dashboard");
    setIsLoading(false);
    return;
  }

    try {
      const response = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.username,
          password: formData.password,
          empresaRUT: rut,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem("user", JSON.stringify(data.user));
        toast.success("Inicio de sesión exitoso");
        navigate("/dashboard");
      } else {
        toast.error(data.message || "Credenciales incorrectas");
      }
    } catch (err) {
      toast.error("Error de conexión con el servidor");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (resetEmail === "cyl.contadores@live.cl") {
      toast.success("Se ha enviado un enlace de recuperación a su correo electrónico");
      setIsResetOpen(false);
      setTimeout(() => {
        toast.info("Contraseña del administrador: Contador@2006");
      }, 2000);
    } else {
      toast.error("Correo no encontrado en el sistema");
    }
  };

  return (
    <div
      className="min-h-screen flex flex-col justify-center items-center p-4"
      style={{
        backgroundImage: "url('/wolfx-fondo.jpg')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      <style>
        {`
          @font-face {
            font-family: 'AmbiguityInline';
            src: url('/assets/fonts/AmbiguityInline.ttf') format('truetype');
            font-weight: normal;
            font-style: normal;
          }
          .wolfx-font {
            font-family: 'AmbiguityInline', sans-serif;
            letter-spacing: 0.1em;
          }
          .rainbow-text {
            background: linear-gradient(90deg, #ff005e, #ffbe00, #00ff94, #00cfff, #a259ff, #ff005e 80%);
            background-size: 200% auto;
            background-clip: text;
            -webkit-background-clip: text;
            color: transparent;
            -webkit-text-fill-color: transparent;
            animation: rainbow-move 3s linear infinite;
          }
          @keyframes rainbow-move {
            0% { background-position: 0% 50%; }
            100% { background-position: 100% 50%; }
          }
        `}
      </style>
      <div className="w-full max-w-2xl space-y-8 animate-fade-in">
        <div className="flex flex-col items-center">
          <img src="wolf-x-imagenes/Logo-wolfx.png" alt="WOLF X Logo" className="h-32 w-32 mb-2 rounded-full shadow-lg" />
          <h1 className="mt-4 text-6xl font-bold wolfx-font rainbow-text">
            WOLF X
          </h1>
          <p className="mt-2 text-2xl text-black text-center font-semibold drop-shadow-[0_2px_6px_rgba(255,255,255,0.7)]">
            Soluciones Integrales de gestion para salones<br />
            <span className="text-black drop-shadow-[0_2px_6px_rgba(255,255,255,0.7)]">
              Sistema de gestión multiempresa y multisucursal
            </span>
          </p>
        </div>
        
        <div className="flex flex-col md:flex-row gap-8 items-stretch relative">
          {/* Formulario */}
          <div className="flex-1">
            <Card className="backdrop-blur-lg bg-white/20 border-none shadow-2xl p-10">
              <CardHeader>
                <CardTitle className="text-center text-white">Iniciar sesión:</CardTitle>
              </CardHeader>
              <CardContent>
                {!showUserFields ? (
                  <form onSubmit={handleRutSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="rut" className="text-white">RUT de la empresa</Label>
                      <Input
                        id="rut"
                        name="rut"
                        value={rut}
                        onChange={e => setRut(e.target.value)}
                        placeholder="Ej: 76.123.456-7"
                        required
                      />
                    </div>
                    <div className="pt-2 flex gap-2">
                      <Button
                        type="submit"
                        className="w-full bg-salon-primary hover:bg-salon-secondary"
                      >
                        Continuar
                      </Button>
                    </div>
                  </form>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="username" className="text-white">Usuario</Label>
                      <Input
                        id="username"
                        name="username"
                        value={formData.username}
                        onChange={handleChange}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="password" className="text-white">Contraseña</Label>
                      <Input
                        id="password"
                        name="password"
                        type="password"
                        value={formData.password}
                        onChange={handleChange}
                        required
                      />
                    </div>
                    <div className="pt-2 flex gap-2">
                      <Button
                        type="submit"
                        className="w-full bg-salon-primary hover:bg-salon-secondary"
                        disabled={isLoading}
                      >
                        {isLoading ? "Iniciando sesión..." : "Iniciar sesión"}
                      </Button>
                    </div>
                  </form>
                )}
                <div className="mt-4 text-center">
                  <Dialog open={isResetOpen} onOpenChange={setIsResetOpen}>
                    <DialogTrigger asChild>
                      <Button variant="link" className="text-sm text-white hover:text-salon-secondary">
                        ¿Olvidaste tu contraseña?
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Recuperar contraseña</DialogTitle>
                      </DialogHeader>
                      <form onSubmit={handleResetPassword} className="space-y-4 py-4">
                        <div className="space-y-2">
                          <Label htmlFor="resetEmail">Correo electrónico</Label>
                          <Input 
                            id="resetEmail" 
                            value={resetEmail}
                            onChange={(e) => setResetEmail(e.target.value)}
                            placeholder="Ingrese su correo electrónico"
                            required
                          />
                        </div>
                        <div className="pt-2">
                          <Button
                            type="submit"
                            className="w-full bg-salon-primary hover:bg-salon-secondary"
                          >
                            Enviar enlace de recuperación
                          </Button>
                        </div>
                      </form>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardContent>
              <CardFooter className="flex flex-col space-y-2">
                <div className="text-center text-sm text-white/80">
                  <p>Credenciales de demostración:</p>
                  <p>Administrador: admin / admin</p>
                  <p>Usuario: usuario / usuario</p>
                  <p>Admin Principal: cyl.contadores@live.cl / Contador@2006</p>
                  <p>Contador: contador / contador</p>
                </div>
              </CardFooter>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}