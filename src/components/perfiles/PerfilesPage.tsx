import { useState } from "react";
import { PageHeader } from "@/components/perfiles/PageHeader";
import { SearchBar } from "@/components/perfiles/SearchBar";
import { ProfileForm, Profile, PermissionOption } from "@/components/perfiles/ProfileForm";
import { ProfileList } from "@/components/perfiles/ProfileList";
import MainLayout from "@/components/layout/MainLayout";

// Permisos agrupados por página y acciones permitidas
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

// Obtener empresaRUT y nombre desde el usuario autenticado (ejemplo)
const user = JSON.parse(localStorage.getItem("user") || "{}");
const empresaRUTActual = user.empresaRUT || "76.123.456-7"; // Ajusta según tu lógica de autenticación
const empresaNombre = user.empresaNombre || "Mi Empresa";

const initialProfiles: Profile[] = [
  {
    id: 1,
    empresaRUT: empresaRUTActual,
    name: "Administrador",
    email: "admin@salon.com",
    role: "admin",
    permissions: availablePermissions.map(p => ({ page: p.id, actions: p.actions })), // acceso total
    active: true,
  },
  {
    id: 2,
    empresaRUT: empresaRUTActual,
    name: "Recepcionista",
    email: "recepcion@salon.com",
    role: "recepcionista",
    permissions: [
      { page: "citas", actions: ["Ver", "Agregar", "Editar"] },
      { page: "clientes", actions: ["Ver"] }
    ],
    active: true,
  },
  {
    id: 3,
    empresaRUT: empresaRUTActual,
    name: "Contador",
    email: "contador@salon.com",
    role: "contador",
    permissions: [
      { page: "reportes", actions: ["Ver"] },
      { page: "boletas", actions: ["Ver"] }
    ],
    active: true,
  },
];

export default function PerfilesPage() {
  const [profiles, setProfiles] = useState<Profile[]>(initialProfiles);
  const [searchTerm, setSearchTerm] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProfile, setEditingProfile] = useState<Profile | null>(null);

  // Filtrar perfiles solo de la empresa actual (por RUT)
  const filteredProfiles = profiles.filter(p => p.empresaRUT === empresaRUTActual);

  const handleNewProfile = () => {
    setEditingProfile(null);
    setIsFormOpen(true);
  };

  const handleEditProfile = (profile: Profile) => {
    setEditingProfile(profile);
    setIsFormOpen(true);
  };

  const handleSaveProfile = (profileData: Partial<Profile>) => {
    if (editingProfile) {
      // Editar perfil existente
      setProfiles((prev) =>
        prev.map((p) =>
          p.id === editingProfile.id
            ? { ...p, ...profileData, id: editingProfile.id, empresaRUT: empresaRUTActual }
            : p
        )
      );
    } else {
      // Crear nuevo perfil
      setProfiles((prev) => [
        ...prev,
        {
          ...profileData,
          id: prev.length ? Math.max(...prev.map((p) => p.id)) + 1 : 1,
          empresaRUT: empresaRUTActual,
          active: true,
        } as Profile,
      ]);
    }
    setIsFormOpen(false);
  };

  return (
    <MainLayout>
      <div className="max-w-5xl mx-auto py-8 space-y-6">
        <PageHeader onNewProfile={handleNewProfile} empresaNombre={empresaNombre} empresaRUT={empresaRUTActual} />
        <SearchBar searchTerm={searchTerm} onSearchChange={setSearchTerm} />
        <ProfileList
          profiles={filteredProfiles}
          availablePermissions={availablePermissions}
          searchTerm={searchTerm}
          onEditProfile={handleEditProfile}
        />
        <ProfileForm
          isOpen={isFormOpen}
          onClose={() => setIsFormOpen(false)}
          editingProfile={editingProfile}
          availablePermissions={availablePermissions}
          onSave={handleSaveProfile}
        />
        <div className="mt-8">
          <h2 className="text-lg font-semibold mb-2">¿Cómo funcionan los permisos?</h2>
          <ul className="list-disc pl-6 text-gray-700 text-sm">
            <li>
              Cada opción representa una página del sistema. Puedes asignar acceso y acciones permitidas por página.
            </li>
            <li>
              Acciones disponibles: <b>Ver</b>, <b>Agregar</b>, <b>Editar</b>, <b>Eliminar</b>. No todas las páginas permiten todas las acciones.
            </li>
            <li>
              Ejemplo: Un perfil con acceso a "Gestión de Citas" y acciones "Ver, Agregar, Editar" podrá ver, crear y modificar citas, pero no eliminarlas.
            </li>
            <li>
              Solo puedes ver y administrar los perfiles de tu empresa (identificada por su RUT).
            </li>
          </ul>
        </div>
      </div>
    </MainLayout>
  );
}