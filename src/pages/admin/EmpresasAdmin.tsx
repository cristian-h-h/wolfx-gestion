import MainLayout from "@/components/layout/MainLayout";
import { useState, useEffect } from "react";
import AdminNavbar from "./AdminNavbar"; // Ajusta la ruta si tu navbar está en otro lugar

export default function EmpresasAdmin() {
  const [empresas, setEmpresas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Estado para mostrar detalles y edición
  const [empresaDetalle, setEmpresaDetalle] = useState<any | null>(null);
  const [empresaEditar, setEmpresaEditar] = useState<any | null>(null);

  // Estado para formulario de edición
  const [editForm, setEditForm] = useState<any>({});

  useEffect(() => {
    fetchEmpresas();
    // eslint-disable-next-line
  }, []);

  const fetchEmpresas = () => {
    setLoading(true);
    fetch("/api/empresas")
      .then((res) => res.json())
      .then((data) => {
        setEmpresas(data);
        setLoading(false);
      })
      .catch(() => {
        setEmpresas([]);
        setLoading(false);
      });
  };

  // Eliminar empresa
  const handleEliminar = async (empresa: any) => {
    if (!window.confirm(`¿Seguro que deseas eliminar la empresa "${empresa.nombreFantasia}"?`)) return;
    const response = await fetch("/api/empresas", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: empresa._id }),
    });
    if (response.ok) {
      fetchEmpresas();
      alert("Empresa eliminada correctamente.");
    } else {
      alert("Error al eliminar empresa.");
    }
  };

  // Guardar cambios de edición
  const handleEditarSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const response = await fetch("/api/empresas", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...editForm, id: empresaEditar._id }),
    });
    if (response.ok) {
      setEmpresaEditar(null);
      fetchEmpresas();
      alert("Empresa actualizada correctamente.");
    } else {
      alert("Error al actualizar empresa.");
    }
  };

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
        <h1 className="text-2xl font-bold mb-6 text-center">Empresas registradas</h1>
        <table className="w-full border bg-white/90 shadow-lg rounded-lg">
          <thead>
            <tr>
              <th className="p-2 border">Nombre Fantasía</th>
              <th className="p-2 border">Razón Social</th>
              <th className="p-2 border">Correo Admin</th>
              <th className="p-2 border">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={4} className="text-center p-4">Cargando...</td>
              </tr>
            ) : empresas.length === 0 ? (
              <tr>
                <td colSpan={4} className="text-center p-4">No hay empresas registradas.</td>
              </tr>
            ) : (
              empresas.map((empresa, idx) => (
                <tr key={idx} className="hover:bg-gray-100 transition">
                  <td className="p-2 border">{empresa.nombreFantasia}</td>
                  <td className="p-2 border">{empresa.razonSocial}</td>
                  <td className="p-2 border">{empresa.adminCorreo}</td>
                  <td className="p-2 border">
                    <button
                      className="text-green-600 hover:underline mr-2"
                      onClick={() => setEmpresaDetalle(empresa)}
                    >
                      Ver
                    </button>
                    <button
                      className="text-blue-600 hover:underline mr-2"
                      onClick={() => {
                        setEmpresaEditar(empresa);
                        setEditForm(empresa);
                      }}
                    >
                      Editar
                    </button>
                    <button
                      className="text-red-600 hover:underline"
                      onClick={() => handleEliminar(empresa)}
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* Modal para ver detalles */}
        {empresaDetalle && (
          <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-8 max-w-md w-full shadow-xl relative">
              <h2 className="text-2xl font-bold mb-6 text-center border-b pb-4">Detalle de Empresa</h2>
              <div className="space-y-4 mb-6">
                <div>
                  <span className="font-semibold">RUT:</span> {empresaDetalle.rut}
                </div>
                <div>
                  <span className="font-semibold">Razón Social:</span> {empresaDetalle.razonSocial}
                </div>
                <div>
                  <span className="font-semibold">Nombre Fantasía:</span> {empresaDetalle.nombreFantasia}
                </div>
                <div>
                  <span className="font-semibold">Dirección:</span> {empresaDetalle.direccion}
                </div>
                <div>
                  <span className="font-semibold">Admin Nombre:</span> {empresaDetalle.adminNombre}
                </div>
                <div>
                  <span className="font-semibold">Admin Teléfono:</span> {empresaDetalle.adminTelefono}
                </div>
                <div>
                  <span className="font-semibold">Admin Correo:</span> {empresaDetalle.adminCorreo}
                </div>
                <div>
                  <span className="font-semibold">Cliente Teléfono:</span> {empresaDetalle.clienteTelefono}
                </div>
                <div>
                  <span className="font-semibold">Logo:</span><br />
                  {empresaDetalle.logo && (
                    <img
                      src={empresaDetalle.logo}
                      alt="Logo"
                      style={{ maxWidth: 140, maxHeight: 140, marginTop: 8, borderRadius: 8, boxShadow: "0 2px 8px #0002" }}
                    />
                  )}
                </div>
              </div>
              <button
                className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 block mx-auto"
                onClick={() => setEmpresaDetalle(null)}
              >
                Cerrar
              </button>
            </div>
          </div>
        )}

        {/* Modal para editar */}
        {empresaEditar && (
          <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
            <form
              className="bg-white rounded-lg p-6 max-w-md w-full shadow-xl relative"
              onSubmit={handleEditarSubmit}
            >
              <h2 className="text-xl font-bold mb-4">Editar Empresa</h2>
              <div className="mb-4">
                <label className="block font-semibold mb-1">RUT</label>
                <input
                  className="border rounded w-full p-2"
                  value={editForm.rut || ""}
                  onChange={e => setEditForm({ ...editForm, rut: e.target.value })}
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block font-semibold mb-1">Razón Social</label>
                <input
                  className="border rounded w-full p-2"
                  value={editForm.razonSocial || ""}
                  onChange={e => setEditForm({ ...editForm, razonSocial: e.target.value })}
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block font-semibold mb-1">Nombre Fantasía</label>
                <input
                  className="border rounded w-full p-2"
                  value={editForm.nombreFantasia || ""}
                  onChange={e => setEditForm({ ...editForm, nombreFantasia: e.target.value })}
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block font-semibold mb-1">Dirección</label>
                <input
                  className="border rounded w-full p-2"
                  value={editForm.direccion || ""}
                  onChange={e => setEditForm({ ...editForm, direccion: e.target.value })}
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block font-semibold mb-1">Admin Nombre</label>
                <input
                  className="border rounded w-full p-2"
                  value={editForm.adminNombre || ""}
                  onChange={e => setEditForm({ ...editForm, adminNombre: e.target.value })}
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block font-semibold mb-1">Admin Teléfono</label>
                <input
                  className="border rounded w-full p-2"
                  value={editForm.adminTelefono || ""}
                  onChange={e => setEditForm({ ...editForm, adminTelefono: e.target.value })}
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block font-semibold mb-1">Admin Correo</label>
                <input
                  className="border rounded w-full p-2"
                  value={editForm.adminCorreo || ""}
                  onChange={e => setEditForm({ ...editForm, adminCorreo: e.target.value })}
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block font-semibold mb-1">Cliente Teléfono</label>
                <input
                  className="border rounded w-full p-2"
                  value={editForm.clienteTelefono || ""}
                  onChange={e => setEditForm({ ...editForm, clienteTelefono: e.target.value })}
                  required
                />
              </div>
              {/* Logo solo como texto o imagen, edición avanzada requiere manejo de archivos */}
              <div className="mb-4">
                <label className="block font-semibold mb-1">Logo (URL/Base64)</label>
                <input
                  className="border rounded w-full p-2"
                  value={editForm.logo || ""}
                  onChange={e => setEditForm({ ...editForm, logo: e.target.value })}
                />
                {editForm.logo && (
                  <img
                    src={editForm.logo}
                    alt="Logo"
                    style={{ maxWidth: 100, maxHeight: 100, marginTop: 8, borderRadius: 8 }}
                  />
                )}
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <button
                  type="button"
                  className="bg-gray-400 text-white px-4 py-2 rounded hover:bg-gray-500"
                  onClick={() => setEmpresaEditar(null)}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                >
                  Guardar
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </MainLayout>
  );
}