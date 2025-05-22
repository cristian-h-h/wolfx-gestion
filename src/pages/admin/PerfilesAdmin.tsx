import { useState, useEffect } from "react";
import MainLayout from "@/components/layout/MainLayout";
import { AccessDenied } from "@/components/comisiones/AccessDenied";
import { PageHeader } from "@/components/perfiles/PageHeader";
import { SearchBar } from "@/components/perfiles/SearchBar";
import { ProfileList } from "@/components/perfiles/ProfileList";
import { ProfileForm, type Profile, type PermissionOption } from "@/components/perfiles/ProfileForm";
import AdminNavbar from "./AdminNavbar";
import { toast } from "sonner";

// Opciones de permisos mejoradas
const availablePermissions: PermissionOption[] = [
  { id: "dashboard", label: "Dashboard", actions: ["Ver"] },
  { id: "citas", label: "Gestión de Citas", actions: ["Ver", "Agregar", "Editar", "Eliminar"] },
  { id: "clientes", label: "Gestión de Clientes", actions: ["Ver", "Agregar", "Editar", "Eliminar"] },
  { id: "servicios", label: "Gestión de Servicios", actions: ["Ver", "Agregar", "Editar", "Eliminar"] },
  { id: "profesionales", label: "Gestión de Profesionales", actions: ["Ver", "Agregar", "Editar", "Eliminar"] },
  { id: "inventario", label: "Inventario", actions: ["Ver", "Agregar", "Editar", "Eliminar"] },
  { id: "boletas", label: "Boletas", actions: ["Ver", "Agregar", "Editar", "Eliminar"] },
  { id: "reportes", label: "Reportes", actions: ["Ver"] },
  { id: "perfiles", label: "Administración de Perfiles", actions: ["Ver", "Agregar", "Editar", "Eliminar"] },
];

const checkIsAdmin = () => {
  const userStr = localStorage.getItem("user");
  if (!userStr) return false;
  const user = JSON.parse(userStr);
  return user.role === "admin" || user.role === "superadmin";
};

export default function PerfilesAdmin() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProfile, setEditingProfile] = useState<Profile | null>(null);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Estado para empresas y empresa seleccionada
  const [empresas, setEmpresas] = useState<any[]>([]);
  const [empresaSeleccionada, setEmpresaSeleccionada] = useState<string>("");

  const isAdmin = checkIsAdmin();

  // Obtener empresas al cargar
  useEffect(() => {
    fetch("/api/empresas")
      .then(res => res.json())
      .then(data => setEmpresas(data))
      .catch(() => setEmpresas([]));
  }, []);

  // Obtener perfiles desde el backend (solo si hay empresa seleccionada)
  const fetchProfiles = async () => {
    if (!empresaSeleccionada) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/perfiles?empresaRUT=${empresaSeleccionada}`);
      if (!res.ok) throw new Error("Error al obtener perfiles");
      const data = await res.json();
      setProfiles(data);
    } catch (err: any) {
      setProfiles([]);
      setError(err.message || "Error desconocido");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (empresaSeleccionada) {
      fetchProfiles();
    }
  }, [empresaSeleccionada]);

  const handleOpenNewProfileDialog = () => {
    setEditingProfile(null);
    setIsDialogOpen(true);
  };

  const handleEditProfile = (profile: Profile) => {
    setEditingProfile(profile);
    setIsDialogOpen(true);
  };

  // Guardar perfil (crear o editar)
  const handleSaveProfile = async (profileData: Partial<Profile>) => {
    let response;
    try {
      if (profileData.id) {
        // Editar perfil existente
        response = await fetch("/api/perfiles", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...profileData, empresaRUT: empresaSeleccionada }),
        });
      } else {
        // Crear nuevo perfil
        response = await fetch("/api/perfiles", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...profileData,
            empresaRUT: empresaSeleccionada,
            active: profileData.active ?? true,
          }),
        });
      }
      if (response.ok) {
        toast.success("Perfil guardado correctamente");
        fetchProfiles();
      } else {
        toast.error("Error al guardar perfil");
      }
    } catch {
      toast.error("Error de red al guardar perfil");
    }
    setIsDialogOpen(false);
    setEditingProfile(null);
  };

  if (!isAdmin) {
    return <AccessDenied />;
  }

  return (
    <MainLayout>
      <AdminNavbar />
      <div
        className="space-y-6 animate-fade-in min-h-screen text-white"
        style={{
          backgroundImage: "url('/wolf-x-imagenes/fondo-panel.jpg')",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        {/* Selector de empresa */}
        <div className="mb-6 max-w-xl mx-auto">
          <label className="block mb-2 text-2xl font-bold text-white">Selecciona la empresa</label>
          <select
            className="w-full p-3 rounded bg-gray-800 text-white text-lg"
            value={empresaSeleccionada}
            onChange={e => setEmpresaSeleccionada(e.target.value)}
          >
            <option value="">-- Selecciona una empresa --</option>
            {empresas.map((empresa) => (
              <option key={empresa._id} value={empresa.rut}>
                {empresa.nombreFantasia} ({empresa.rut})
              </option>
            ))}
          </select>
        </div>

        {/* Solo mostrar el resto si hay empresa seleccionada */}
{empresaSeleccionada ? (
  <div className="bg-black text-white rounded-xl p-6 shadow-lg">
    <PageHeader onNewProfile={handleOpenNewProfileDialog} />
    <SearchBar searchTerm={searchTerm} onSearchChange={setSearchTerm} />
    {loading ? (
      <div className="text-center py-8 text-white text-xl">Cargando perfiles...</div>
    ) : error ? (
      <div className="text-center py-8 text-red-300 text-xl">{error}</div>
    ) : (
      <ProfileList
        profiles={profiles}
        availablePermissions={availablePermissions}
        searchTerm={searchTerm}
        onEditProfile={handleEditProfile}
      />
    )}
    <ProfileForm
      isOpen={isDialogOpen}
      onClose={() => setIsDialogOpen(false)}
      editingProfile={editingProfile}
      availablePermissions={availablePermissions}
      onSave={handleSaveProfile}
      empresaRUT={empresaSeleccionada}
      showPasswordFields
    />
    <div className="mt-8">
      <h2 className="text-2xl font-bold mb-4">¿Cómo funcionan los permisos?</h2>
      <ul className="list-disc pl-6 text-white text-lg">
        <li>
          Cada opción representa una página del sistema. Puedes asignar acceso y acciones permitidas por página.
        </li>
        <li>
          Acciones disponibles: <b>Ver</b>, <b>Agregar</b>, <b>Editar</b>, <b>Eliminar</b>. No todas las páginas permiten todas las acciones.
        </li>
        <li>
          Ejemplo: Un perfil con acceso a "Gestión de Citas" y acciones "Ver, Agregar, Editar" podrá ver, crear y modificar citas, pero no eliminarlas.
            </li>
           </ul>
          </div>
         </div>
       ) : (
          <div className="text-center text-white text-2xl mt-8">
            Debes seleccionar una empresa para administrar sus perfiles.
          </div>
        )}
      </div>
    </MainLayout>
  );
}
