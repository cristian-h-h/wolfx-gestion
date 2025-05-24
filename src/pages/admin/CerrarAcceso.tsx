import { useState, useEffect } from "react";
import AdminNavbar from "./AdminNavbar";

export default function CerrarAcceso() {
  const [empresaRUT, setEmpresaRUT] = useState("");
  const [clave, setClave] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [loading, setLoading] = useState(false);
  const [autorizado, setAutorizado] = useState(false);

  useEffect(() => {
    const userStr = localStorage.getItem("user");
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        if (user.role === "superadmin" || user.role === "admin") {
          setAutorizado(true);
        }
      } catch {}
    }
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const rut = params.get("empresaRUT");
    if (rut) setEmpresaRUT(rut);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMensaje("");
    try {
      const res = await fetch("/api/cerrar-acceso", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ empresaRUT, clave }),
      });
      const data = await res.json();
      if (res.ok) {
        setMensaje("Acceso cerrado correctamente para la empresa.");
      } else {
        setMensaje(data.message || "Error al cerrar acceso.");
      }
    } catch {
      setMensaje("Error de red.");
    }
    setLoading(false);
  };

  if (!autorizado) {
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
        <div className="w-full max-w-2xl p-8 bg-white/90 shadow-2xl mt-6 text-center">
          <h1 className="text-2xl font-bold mb-4 text-red-700">Acceso restringido</h1>
          <p className="text-red-600">Solo usuarios con permisos de superadmin o admin pueden acceder a esta página.</p>
        </div>
      </div>
    );
  }

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
      <div className="w-full max-w-2xl p-8 bg-white/90 shadow-2xl mt-6">
        <h1 className="text-center text-3xl font-bold mb-6">Cerrar Acceso Empresa</h1>
        <form className="space-y-5" onSubmit={handleSubmit}>
          <div>
            <label className="block mb-1 font-semibold">RUT Empresa</label>
            <input
              type="text"
              value={empresaRUT}
              onChange={(e) => setEmpresaRUT(e.target.value)}
              className="w-full border rounded px-3 py-2"
              required
              readOnly={!!empresaRUT}
            />
          </div>
          <div>
            <label className="block mb-1 font-semibold">Clave de cierre</label>
            <input
              type="password"
              value={clave}
              onChange={(e) => setClave(e.target.value)}
              className="w-full border rounded px-3 py-2"
              required
            />
          </div>
          <div className="pt-4 flex justify-center">
            <button
              type="submit"
              className="px-8 py-3 rounded-full bg-salon-primary hover:bg-salon-secondary text-white font-bold text-lg shadow-lg"
              disabled={loading}
            >
              {loading ? "Cerrando..." : "Cerrar Acceso"}
            </button>
          </div>
          {mensaje && (
            <div className="mt-4 text-center font-semibold text-red-700">{mensaje}</div>
          )}
        </form>
      </div>
    </div>
  );
}