import { useEffect, useState } from "react";
import { Plus, Search, Edit, Trash2, X } from "lucide-react";
import MainLayout from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";

interface ProfessionalService {
  serviceId: string;
  commission: number;
}
interface Professional {
  _id?: string;
  internalCode: string;
  name: string;
  services: ProfessionalService[];
  phone: string;
  email: string;
  address: string;
  commune: string;
  active: boolean;
}

interface Category {
  _id: string;
  name: string;
}

export default function Profesionales() {
  const { toast } = useToast();
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [services, setServices] = useState<{ _id: string; name: string; category: string }[]>([]);

  const [newCategoryName, setNewCategoryName] = useState("");
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("professionals");
  const [loading, setLoading] = useState(true);
  const [catLoading, setCatLoading] = useState(true);

  const [form, setForm] = useState<Professional>({
    internalCode: "",
    name: "",
    services: [{ serviceId: "", commission: 25 }],
    phone: "",
    email: "",
    address: "",
    commune: "",
    active: true,
  });

  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const empresaRUT = user.empresaRUT;

  // --- GET: Cargar profesionales, categorías y servicios desde la API ---
  useEffect(() => {
    if (!empresaRUT) return;
    setLoading(true);
    fetch(`/api/profesionales?empresaRUT=${empresaRUT}`)
      .then(res => res.json())
      .then(data => {
        setProfessionals(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [empresaRUT]);

  useEffect(() => {
    if (!empresaRUT) return;
    setCatLoading(true);
    fetch(`/api/categorias-profesionales?empresaRUT=${empresaRUT}`)
      .then(res => res.json())
      .then(data => {
        setCategories(data);
        setCatLoading(false);
      })
      .catch(() => setCatLoading(false));
  }, [empresaRUT]);

  useEffect(() => {
    if (!empresaRUT) return;
    fetch(`/api/servicios?empresaRUT=${empresaRUT}`)
      .then(res => res.json())
      .then(data => setServices(data))
      .catch(() => setServices([]));
  }, [empresaRUT]);

  // Filtrar profesionales por término de búsqueda
  const filteredProfessionals = professionals.filter(
    (professional) =>
      professional.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      professional.services.some(srv => {
        const service = services.find(s => s._id === srv.serviceId);
        return service && service.name.toLowerCase().includes(searchTerm.toLowerCase());
      })
  );

  // --- Funciones auxiliares para servicios en el formulario ---
  const handleAddServiceToForm = () => {
    setForm(f => ({
      ...f,
      services: [...f.services, { serviceId: "", commission: 25 }],
    }));
  };

  const handleRemoveServiceFromForm = (idx: number) => {
    setForm(f => ({
      ...f,
      services: f.services.filter((_, i) => i !== idx),
    }));
  };

  const handleServiceChange = (idx: number, field: "serviceId" | "commission", value: string) => {
    setForm(f => ({
      ...f,
      services: f.services.map((srv, i) =>
        i === idx
          ? { ...srv, [field]: field === "commission" ? Number(value) : value }
          : srv
      ),
    }));
  };

  // --- POST: Agregar profesional ---
  const handleAddProfessional = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!empresaRUT) return;
    if (
      !form.internalCode ||
      !form.name ||
      !form.phone ||
      !form.email ||
      !form.address ||
      !form.commune
    ) {
      toast("Completa todos los campos del profesional.");
      return;
    }
    if (
      form.services.some(
        (srv) => !srv.serviceId || srv.commission < 0 || srv.commission > 100
      )
    ) {
      toast("Completa todos los servicios y porcentajes válidos.");
      return;
    }
    const res = await fetch("/api/profesionales", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        internalCode: form.internalCode,
        name: form.name,
        services: form.services,
        phone: form.phone,
        email: form.email,
        address: form.address,
        commune: form.commune,
        active: form.active,
        empresaRUT,
      }),
    });
    if (res.ok) {
      const nuevo = await res.json();
      setProfessionals(prev => [...prev, nuevo]);
      setForm({
        internalCode: "",
        name: "",
        services: [{ serviceId: "", commission: 25 }],
        phone: "",
        email: "",
        address: "",
        commune: "",
        active: true,
      });
      setIsDialogOpen(false);
      toast("Profesional agregado correctamente.");
    }
  };

  // --- PUT: Editar profesional ---
  const handleEditProfessional = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!empresaRUT || !editId) return;
    if (
      !form.internalCode ||
      !form.name ||
      !form.phone ||
      !form.email ||
      !form.address ||
      !form.commune
    ) {
      toast("Completa todos los campos del profesional.");
      return;
    }
    if (
      form.services.some(
        (srv) => !srv.serviceId || srv.commission < 0 || srv.commission > 100
      )
    ) {
      toast("Completa todos los servicios y porcentajes válidos.");
      return;
    }
    const res = await fetch("/api/profesionales", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: editId,
        internalCode: form.internalCode,
        name: form.name,
        services: form.services,
        phone: form.phone,
        email: form.email,
        address: form.address,
        commune: form.commune,
        active: form.active,
        empresaRUT,
      }),
    });
    if (res.ok) {
      setProfessionals(prev =>
        prev.map(p =>
          p._id === editId
            ? {
                ...p,
                internalCode: form.internalCode,
                name: form.name,
                services: form.services,
                phone: form.phone,
                email: form.email,
                address: form.address,
                commune: form.commune,
                active: form.active,
              }
            : p
        )
      );
      setIsEditDialogOpen(false);
      setEditId(null);
      setForm({
        internalCode: "",
        name: "",
        services: [{ serviceId: "", commission: 25 }],
        phone: "",
        email: "",
        address: "",
        commune: "",
        active: true,
      });
      toast("Profesional editado correctamente.");
    }
  };

  // --- DELETE: Eliminar profesional ---
  const handleDeleteProfessional = async (id: string) => {
    if (!empresaRUT) return;
    const res = await fetch("/api/profesionales", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, empresaRUT }),
    });
    if (res.ok) {
      setProfessionals(prev => prev.filter(p => p._id !== id));
      toast("Profesional eliminado correctamente.");
    }
  };

  // Abrir diálogo de edición y cargar datos
  const openEditDialog = (professional: Professional) => {
    setEditId(professional._id || null);
    setForm({
      internalCode: professional.internalCode,
      name: professional.name,
      services: professional.services.map(s => ({ ...s })),
      phone: professional.phone,
      email: professional.email,
      address: professional.address,
      commune: professional.commune,
      active: professional.active,
    });
    setIsEditDialogOpen(true);
  };

  // --- Categorías generales ---
  // GET, POST, PUT, DELETE para categorías
  const handleAddCategory = async () => {
    if (!empresaRUT || !newCategoryName.trim()) return;
    if (categories.some(c => c.name.toLowerCase() === newCategoryName.trim().toLowerCase())) {
      toast("La categoría ya existe.");
      return;
    }
    const res = await fetch("/api/categorias-profesionales", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newCategoryName.trim(), empresaRUT }),
    });
    if (res.ok) {
      const nueva = await res.json();
      setCategories(prev => [...prev, nueva]);
      setNewCategoryName("");
      toast(`La categoría "${nueva.name}" ha sido agregada exitosamente.`);
    }
  };

  const handleEditCategory = (category: Category) => {
    setEditingCategory(category);
    setNewCategoryName(category.name);
    setIsCategoryDialogOpen(true);
  };

  const handleUpdateCategory = async () => {
    if (!empresaRUT || !editingCategory || !newCategoryName.trim()) return;
    const res = await fetch("/api/categorias-profesionales", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: editingCategory._id, name: newCategoryName.trim(), empresaRUT }),
    });
    if (res.ok) {
      setCategories(categories.map(cat =>
        cat._id === editingCategory._id
          ? { ...cat, name: newCategoryName.trim() }
          : cat
      ));
      setIsCategoryDialogOpen(false);
      setEditingCategory(null);
      setNewCategoryName("");
      toast(`La categoría ha sido actualizada a "${newCategoryName}".`);
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (!empresaRUT) return;
    const res = await fetch("/api/categorias-profesionales", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, empresaRUT }),
    });
    if (res.ok) {
      const categoryToDelete = categories.find(c => c._id === id);
      setCategories(categories.filter(cat => cat._id !== id));
      toast(`La categoría "${categoryToDelete?.name}" ha sido eliminada.`);
    }
  };

  if (loading || catLoading) return <div>Cargando profesionales...</div>;

  return (
    <MainLayout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0 bg-[#f8f8fa] rounded-lg p-6">
          <h1 className="page-title mb-0">Gestión de Profesionales</h1>
          {(user.role === "admin" || user.role === "superadmin") && (
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-salon-primary hover:bg-salon-secondary">
                  <Plus className="h-4 w-4 mr-2" /> Nuevo Profesional
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                  <DialogTitle>Agregar nuevo profesional</DialogTitle>
                </DialogHeader>
                <form className="space-y-4 py-4" onSubmit={handleAddProfessional}>
                  <div className="space-y-2">
                    <Label htmlFor="internalCode">Código Interno</Label>
                    <Input
                      id="internalCode"
                      placeholder="Ej: P006"
                      value={form.internalCode}
                      onChange={e => setForm(f => ({ ...f, internalCode: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="name">Nombre completo</Label>
                    <Input
                      id="name"
                      placeholder="Ej: Ana María López"
                      value={form.name}
                      onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                      required
                    />
                  </div>
                  {/* Selección de servicios y porcentaje */}
                  <div className="space-y-2">
                    <Label>Servicios y % comisión</Label>
                    {form.services.map((srv, idx) => (
                      <div key={idx} className="flex gap-2 items-center mb-2">
                        <Select
                          value={srv.serviceId}
                          onValueChange={value => handleServiceChange(idx, "serviceId", value)}
                          required
                        >
                          <SelectTrigger className="w-56">
                            <SelectValue placeholder="Servicio" />
                          </SelectTrigger>
                          <SelectContent>
                            {services.map(service => (
                              <SelectItem key={service._id} value={service._id}>
                                {service.name} ({service.category})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Input
                          type="number"
                          min={0}
                          max={100}
                          className="w-24"
                          value={srv.commission}
                          onChange={e => handleServiceChange(idx, "commission", e.target.value)}
                          placeholder="% comisión"
                          required
                        />
                        {form.services.length > 1 && (
                          <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            onClick={() => handleRemoveServiceFromForm(idx)}
                            title="Eliminar servicio"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={handleAddServiceToForm}
                      className="mt-1"
                    >
                      <Plus className="h-4 w-4 mr-1" /> Agregar servicio
                    </Button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">Correo electrónico</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="profesional@ejemplo.com"
                        value={form.email}
                        onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Teléfono</Label>
                      <Input
                        id="phone"
                        placeholder="+56 9 XXXX XXXX"
                        value={form.phone}
                        onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="address">Dirección</Label>
                      <Input
                        id="address"
                        placeholder="Ej: Av. Providencia 1234"
                        value={form.address}
                        onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="commune">Comuna</Label>
                      <Input
                        id="commune"
                        placeholder="Ej: Providencia"
                        value={form.commune}
                        onChange={e => setForm(f => ({ ...f, commune: e.target.value }))}
                        required
                      />
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      id="active"
                      type="checkbox"
                      checked={form.active}
                      onChange={e => setForm(f => ({ ...f, active: e.target.checked }))}
                    />
                    <Label htmlFor="active" className="cursor-pointer">Activo</Label>
                  </div>
                  <div className="flex justify-end space-x-2 pt-4">
                    <Button
                      variant="outline"
                      type="button"
                      onClick={() => setIsDialogOpen(false)}
                    >
                      Cancelar
                    </Button>
                    <Button
                      className="bg-salon-primary hover:bg-salon-secondary"
                      type="submit"
                    >
                      Guardar
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          )}
          {/* Diálogo para editar profesional */}
          {(user.role === "admin" || user.role === "superadmin") && (
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
              <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                  <DialogTitle>Editar profesional</DialogTitle>
                </DialogHeader>
                <form className="space-y-4 py-4" onSubmit={handleEditProfessional}>
                  <div className="space-y-2">
                    <Label htmlFor="internalCode-edit">Código Interno</Label>
                    <Input
                      id="internalCode-edit"
                      value={form.internalCode}
                      onChange={e => setForm(f => ({ ...f, internalCode: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="name-edit">Nombre completo</Label>
                    <Input
                      id="name-edit"
                      value={form.name}
                      onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                      required
                    />
                  </div>
                  {/* Selección de servicios y porcentaje */}
                  <div className="space-y-2">
                    <Label>Servicios y % comisión</Label>
                    {form.services.map((srv, idx) => (
                      <div key={idx} className="flex gap-2 items-center mb-2">
                        <Select
                          value={srv.serviceId}
                          onValueChange={value => handleServiceChange(idx, "serviceId", value)}
                          required
                        >
                          <SelectTrigger className="w-56">
                            <SelectValue placeholder="Servicio" />
                          </SelectTrigger>
                          <SelectContent>
                            {services.map(service => (
                              <SelectItem key={service._id} value={service._id}>
                                {service.name} ({service.category})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Input
                          type="number"
                          min={0}
                          max={100}
                          className="w-24"
                          value={srv.commission}
                          onChange={e => handleServiceChange(idx, "commission", e.target.value)}
                          placeholder="% comisión"
                          required
                        />
                        {form.services.length > 1 && (
                          <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            onClick={() => handleRemoveServiceFromForm(idx)}
                            title="Eliminar servicio"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={handleAddServiceToForm}
                      className="mt-1"
                    >
                      <Plus className="h-4 w-4 mr-1" /> Agregar servicio
                    </Button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="email-edit">Correo electrónico</Label>
                      <Input
                        id="email-edit"
                        type="email"
                        value={form.email}
                        onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone-edit">Teléfono</Label>
                      <Input
                        id="phone-edit"
                        value={form.phone}
                        onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="address-edit">Dirección</Label>
                      <Input
                        id="address-edit"
                        value={form.address}
                        onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="commune-edit">Comuna</Label>
                      <Input
                        id="commune-edit"
                        value={form.commune}
                        onChange={e => setForm(f => ({ ...f, commune: e.target.value }))}
                        required
                      />
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      id="active-edit"
                      type="checkbox"
                      checked={form.active}
                      onChange={e => setForm(f => ({ ...f, active: e.target.checked }))}
                    />
                    <Label htmlFor="active-edit" className="cursor-pointer">Activo</Label>
                  </div>
                  <div className="flex justify-end space-x-2 pt-4">
                    <Button
                      variant="outline"
                      type="button"
                      onClick={() => setIsEditDialogOpen(false)}
                    >
                      Cancelar
                    </Button>
                    <Button
                      className="bg-salon-primary hover:bg-salon-secondary"
                      type="submit"
                    >
                      Guardar cambios
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="mb-4 bg-[#f8f8fa] rounded-lg shadow p-2">
            <TabsTrigger value="professionals">Profesionales</TabsTrigger>
            <TabsTrigger value="categories">Categorías</TabsTrigger>
          </TabsList>

          <TabsContent value="professionals" className="space-y-4">
            <div className="flex items-center bg-[#f8f8fa] rounded-lg shadow p-4">
              <div className="relative flex-grow">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                <Input
                  placeholder="Buscar por nombre o servicio..."
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            <div className="rounded-md border bg-[#f8f8fa] shadow">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Código</TableHead>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Servicios y % comisión</TableHead>
                    <TableHead>Teléfono</TableHead>
                    <TableHead>Correo electrónico</TableHead>
                    <TableHead>Dirección</TableHead>
                    <TableHead>Comuna</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProfessionals.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-4">
                        No se encontraron profesionales
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredProfessionals.map((professional) => (
                      <TableRow key={professional._id}>
                        <TableCell className="font-medium">{professional.internalCode}</TableCell>
                        <TableCell className="font-medium">{professional.name}</TableCell>
                        <TableCell>
                          <ul>
                            {professional.services.map((srv, idx) => {
                              const service = services.find(s => s._id === srv.serviceId);
                              return (
                                <li key={idx}>
                                  {service ? `${service.name} (${service.category})` : "Servicio eliminado"}{" "}
                                  <span className="text-xs text-gray-500">({srv.commission}%)</span>
                                </li>
                              );
                            })}
                          </ul>
                        </TableCell>
                        <TableCell>{professional.phone}</TableCell>
                        <TableCell>{professional.email}</TableCell>
                        <TableCell>{professional.address}</TableCell>
                        <TableCell>{professional.commune}</TableCell>
                        <TableCell>
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              professional.active
                                ? "bg-green-100 text-green-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {professional.active ? "Activo" : "Inactivo"}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openEditDialog(professional)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleDeleteProfessional(professional._id!)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          <TabsContent value="categories">
            <div className="space-y-4">
              <div className="flex items-center gap-2 bg-[#f8f8fa] rounded-lg shadow p-4">
                <Input
                  placeholder="Nueva categoría..."
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  className="max-w-xs"
                />
                <Button
                  onClick={handleAddCategory}
                  className="bg-salon-primary hover:bg-salon-secondary"
                >
                  Agregar
                </Button>
              </div>

              <div className="rounded-md border bg-[#f8f8fa] shadow">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nombre de la categoría</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {categories.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={2} className="text-center py-4">
                          No hay categorías definidas
                        </TableCell>
                      </TableRow>
                    ) : (
                      categories.map((category) => (
                        <TableRow key={category._id}>
                          <TableCell className="font-medium">{category.name}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="outline"
                                size="icon"
                                onClick={() => handleEditCategory(category)}
                                className="h-8 w-8"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="icon"
                                onClick={() => handleDeleteCategory(category._id)}
                                className="h-8 w-8 text-red-500 hover:text-red-700"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>

            <Dialog open={isCategoryDialogOpen} onOpenChange={setIsCategoryDialogOpen}>
              <DialogContent className="sm:max-w-[400px]">
                <DialogHeader>
                  <DialogTitle>Editar categoría</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="categoryName">Nombre de la categoría</Label>
                    <Input
                      id="categoryName"
                      value={newCategoryName}
                      onChange={(e) => setNewCategoryName(e.target.value)}
                    />
                  </div>
                  <div className="flex justify-end space-x-2 pt-4">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setIsCategoryDialogOpen(false);
                        setEditingCategory(null);
                        setNewCategoryName("");
                      }}
                    >
                      Cancelar
                    </Button>
                    <Button
                      className="bg-salon-primary hover:bg-salon-secondary"
                      onClick={handleUpdateCategory}
                    >
                      Actualizar
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}