import MainLayout from "@/components/layout/MainLayout";
import { useState, useEffect } from "react";
import AdminNavbar from "./AdminNavbar"; // Ajusta la ruta si tu navbar está en otro lugar

export default function UsuariosAdmin() {
  const [usuarios, setUsuarios] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Obtener los usuarios desde el backend
    fetch("/api/usuarios")
      .then((res) => res.json())
      .then((data) => {
        setUsuarios(data);
        setLoading(false);
      })
      .catch(() => {
        setUsuarios([]);
        setLoading(false);
      });
  }, []);

  return (
    <MainLayout>
      <AdminNavbar />
      <div
        className="max-w-3xl mx-auto py-10"
        style={{
          backgroundImage: "url('/wolf-x-imagenes/fondo-panel.jpg')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          borderRadius: "1rem",
        }}
      >
        <h1 className="text-2xl font-bold mb-6 text-center">Usuarios</h1>
        <table className="w-full border bg-white/90 shadow-lg rounded-lg">
          <thead>
            <tr>
              <th className="p-2 border">Nombre</th>
              <th className="p-2 border">Email</th>
              <th className="p-2 border">Perfil</th>
              <th className="p-2 border">Empresa</th>
              <th className="p-2 border">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className="text-center p-4">Cargando...</td>
              </tr>
            ) : usuarios.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center p-4">No hay usuarios registrados.</td>
              </tr>
            ) : (
              usuarios.map((usuario, idx) => (
                <tr key={idx} className="hover:bg-gray-100 transition">
                  <td className="p-2 border">{usuario.nombre || usuario.adminNombre || "-"}</td>
                  <td className="p-2 border">{usuario.email || usuario.adminCorreo || "-"}</td>
                  <td className="p-2 border">{usuario.perfil || usuario.role || "-"}</td>
                  <td className="p-2 border">{usuario.empresa || usuario.empresaRUT || "-"}</td>
                  <td className="p-2 border">
                    {/* Botones de ver/editar/eliminar */}
                    <button className="text-green-600 hover:underline mr-2">Ver</button>
                    <button className="text-blue-600 hover:underline mr-2">Editar</button>
                    <button className="text-red-600 hover:underline">Eliminar</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </MainLayout>
  );
}