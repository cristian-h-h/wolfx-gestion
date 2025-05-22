import { useState, useEffect } from "react";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

// Define types
export interface Profile {
  id: number;
  empresaRUT: string;
  name: string;
  email: string;
  role: string;
  permissions: { page: string; actions: string[] }[];
  active: boolean;
  password?: string;
}

export interface PermissionOption {
  id: string;
  label: string;
  actions: string[];
}

interface ProfileFormProps {
  isOpen: boolean;
  onClose: () => void;
  editingProfile: Profile | null;
  availablePermissions: PermissionOption[];
  onSave: (profile: Partial<Profile>) => void;
  empresaRUT?: string;
  showPasswordFields?: boolean;
}

export const ProfileForm = ({
  isOpen,
  onClose,
  editingProfile,
  availablePermissions,
  onSave,
  empresaRUT,
  showPasswordFields,
}: ProfileFormProps) => {
  // Obtener empresaRUT del usuario autenticado o prop
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const empresaRUTActual = empresaRUT || user.empresaRUT || "76.123.456-7";

  const [form, setForm] = useState<Partial<Profile>>({
    empresaRUT: empresaRUTActual,
    name: "",
    email: "",
    role: "user",
    permissions: [],
    active: true,
    password: "",
  });

  // Para manejo de contraseñas visibles y repetidas
  const [password, setPassword] = useState("");
  const [repeatPassword, setRepeatPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");

  useEffect(() => {
    if (editingProfile) {
      setForm({
        ...editingProfile,
        password: "",
      });
      setPassword("");
      setRepeatPassword("");
      setPasswordError("");
    } else {
      setForm({
        empresaRUT: empresaRUTActual,
        name: "",
        email: "",
        role: "user",
        permissions: [],
        active: true,
        password: "",
      });
      setPassword("");
      setRepeatPassword("");
      setPasswordError("");
    }
  }, [editingProfile, isOpen, empresaRUTActual]);

  // Manejo de permisos por página y acción
  const handlePermissionChange = (page: string, action: string, checked: boolean) => {
    setForm((prev) => {
      const permissions = prev.permissions ? [...prev.permissions] : [];
      const pagePerm = permissions.find((p: any) => p.page === page);
      if (pagePerm) {
        let newActions = checked
          ? [...pagePerm.actions, action]
          : pagePerm.actions.filter((a: string) => a !== action);
        if (newActions.length === 0) {
          // Si no quedan acciones, eliminar la página
          return {
            ...prev,
            permissions: permissions.filter((p: any) => p.page !== page),
          };
        }
        return {
          ...prev,
          permissions: permissions.map((p: any) =>
            p.page === page ? { ...p, actions: newActions } : p
          ),
        };
      } else if (checked) {
        // Agregar nueva página con la acción
        return {
          ...prev,
          permissions: [...permissions, { page, actions: [action] }],
        };
      }
      return prev;
    });
  };

  const isChecked = (page: string, action: string) =>
    form.permissions &&
    Array.isArray(form.permissions) &&
    form.permissions.find((p: any) => p.page === page)?.actions.includes(action);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email) {
      toast("Completa todos los campos requeridos.");
      return;
    }

    // Si es creación, validar contraseñas
    if (!editingProfile && showPasswordFields) {
      if (!password || !repeatPassword) {
        setPasswordError("Debes ingresar y repetir la contraseña.");
        return;
      }
      if (password !== repeatPassword) {
        setPasswordError("Las contraseñas no coinciden.");
        return;
      }
      setPasswordError("");
    }

    // Si es edición, no actualizar password si está vacío
    if (editingProfile) {
      onSave({
        ...editingProfile,
        ...form,
        empresaRUT: empresaRUTActual,
        password: password ? password : undefined,
      });
      toast(`Perfil de ${form.name} actualizado correctamente`);
    } else {
      const newProfile: Partial<Profile> = {
        ...form,
        empresaRUT: empresaRUTActual,
        password,
      };
      onSave(newProfile);
      toast(`Perfil de ${form.name} creado correctamente`);
    }
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{editingProfile ? "Editar perfil" : "Nuevo perfil"}</DialogTitle>
        </DialogHeader>
        <form
         className="space-y-4 py-4 flex flex-col max-h-[70vh] overflow-y-auto"
          onSubmit={handleSubmit}
          >
          <div className="space-y-2">
            <Label htmlFor="name">Nombre</Label>
            <Input
              id="name"
              name="name"
              value={form.name || ""}
              onChange={handleChange}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Correo electrónico</Label>
            <Input
              id="email"
              name="email"
              type="email"
              value={form.email || ""}
              onChange={handleChange}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="role">Rol</Label>
            <select
              id="role"
              name="role"
              className="w-full border rounded px-2 py-1"
              value={form.role}
              onChange={handleChange}
            >
              <option value="user">Usuario</option>
              <option value="admin">Administrador</option>
              <option value="recepcionista">Recepcionista</option>
              <option value="contador">Contador</option>
            </select>
          </div>
          {/* Campos de contraseña solo al crear */}
          {!editingProfile && showPasswordFields && (
            <>
              <div className="space-y-2">
                <Label htmlFor="password">Contraseña</Label>
                <Input
                  id="password"
                  name="password"
                  type="text"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="repeatPassword">Re-Ingrese contraseña</Label>
                <Input
                  id="repeatPassword"
                  name="repeatPassword"
                  type="text"
                  value={repeatPassword}
                  onChange={e => setRepeatPassword(e.target.value)}
                  required
                />
              </div>
              {passwordError && <div className="text-red-500 mb-2">{passwordError}</div>}
            </>
          )}
          <div>
            <Label>Permisos por página y acción</Label>
            <div className="overflow-x-auto">
              <table className="min-w-full text-xs border mt-2">
                <thead>
                  <tr>
                    <th className="p-2 border">Página</th>
                    {["Ver", "Agregar", "Editar", "Eliminar"].map((action) => (
                      <th key={action} className="p-2 border">{action}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {availablePermissions.map((perm) => (
                    <tr key={perm.id}>
                      <td className="p-2 border">{perm.label}</td>
                      {["Ver", "Agregar", "Editar", "Eliminar"].map((action) => (
                        <td key={action} className="p-2 border text-center">
                          {perm.actions.includes(action) ? (
                            <Checkbox
                              checked={!!isChecked(perm.id, action)}
                              onCheckedChange={(checked) =>
                                handlePermissionChange(perm.id, action, !!checked)
                              }
                            />
                          ) : (
                            <span className="text-gray-300">—</span>
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <input
              id="active"
              name="active"
              type="checkbox"
              checked={!!form.active}
              onChange={handleChange}
            />
            <Label htmlFor="active" className="cursor-pointer">Activo</Label>
          </div>
          <div className="flex justify-end space-x-2 pt-4 bg-white/80 sticky bottom-0 z-10 pb-2">
          <Button variant="outline" type="button" onClick={onClose}>
            Cancelar
          </Button>
          <Button className="bg-salon-primary hover:bg-salon-secondary" type="submit">
            {editingProfile ? "Actualizar" : "Crear perfil"}
          </Button>
        </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
