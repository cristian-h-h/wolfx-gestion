import { Check, X, Trash2 } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { type Profile, type PermissionOption } from "./ProfileForm";

interface ProfileListProps {
  profiles: Profile[];
  availablePermissions: PermissionOption[];
  searchTerm: string;
  onEditProfile: (profile: Profile) => void;
  onToggleStatus?: (profile: Profile) => void;
  onDeleteProfile?: (id: string | number) => void;
}

export const ProfileList = ({
  profiles,
  availablePermissions,
  searchTerm,
  onEditProfile,
  onToggleStatus,
  onDeleteProfile,
}: ProfileListProps) => {
  // Filtrar perfiles por término de búsqueda
  const filteredProfiles = profiles.filter(
    (profile) =>
      profile.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      profile.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Obtener el label de la página
  const getPageLabel = (pageId: string) =>
    availablePermissions.find((p) => p.id === pageId)?.label || pageId;

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nombre</TableHead>
            <TableHead>Correo electrónico</TableHead>
            <TableHead>Rol</TableHead>
            <TableHead>Permisos</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead>Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredProfiles.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center py-4">
                No se encontraron perfiles
              </TableCell>
            </TableRow>
          ) : (
            filteredProfiles.map((profile) => (
              <TableRow key={profile._id ?? profile.id}>
                <TableCell className="font-medium">{profile.name}</TableCell>
                <TableCell>{profile.email}</TableCell>
                <TableCell>
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                     profile.role === "admin" || profile.role === "superadmin"
                        ? "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300"
                        : "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300"
                    }`}
                  >
                    {profile.role === "admin"
                      ? "Administrador"
                      : profile.role === "superadmin"
                      ? "Superadmin"
                      : profile.role.charAt(0).toUpperCase() + profile.role.slice(1)}
                  </span>
                </TableCell>
                <TableCell>
                  <ul className="text-xs space-y-1">
                    {profile.permissions && profile.permissions.length > 0 ? (
                      profile.permissions.map((perm) => (
                        <li key={perm.page}>
                          <b>{getPageLabel(perm.page)}:</b>{" "}
                          {perm.actions.join(", ")}
                        </li>
                      ))
                    ) : (
                      <span className="text-gray-400 text-sm">Sin permisos</span>
                    )}
                  </ul>
                </TableCell>
                <TableCell>
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      profile.active
                        ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                        : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
                    }`}
                  >
                    {profile.active ? (
                      <>
                        <Check className="h-3 w-3 mr-1" />
                        Activo
                      </>
                    ) : (
                      <>
                        <X className="h-3 w-3 mr-1" />
                        Inactivo
                      </>
                    )}
                  </span>
                </TableCell>
                <TableCell>
                  <div className="flex space-x-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => onEditProfile(profile)}
                    >
                      Editar
                    </Button>
                    {profile.email !== "cyl.contador@live.cl" && (
                      <>
                        {onToggleStatus && (
                          <Button 
                            variant="outline" 
                            size="sm"
                            className={profile.active ? "text-red-500 border-red-200 hover:bg-red-50" : "text-green-500 border-green-200 hover:bg-green-50"}
                            onClick={() => onToggleStatus(profile)}
                          >
                            {profile.active ? "Desactivar" : "Activar"}
                          </Button>
                        )}
                        {onDeleteProfile && (
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => onDeleteProfile(profile._id ?? profile.id)}
                            title="Eliminar perfil"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
};
