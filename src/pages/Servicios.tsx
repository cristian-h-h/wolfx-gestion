import { useEffect, useState } from "react";
import { Plus, Search, DollarSign, Edit, Trash2 } from "lucide-react";
import MainLayout from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

interface ServiceCategory {
  _id: string;
  name: string;
  empresaRUT: string;
}

interface Service {
  _id: string;
  nombre: string;
  precio: number;
  categoria: string;
}

export default function Servicios() {
  const [services, setServices] = useState<Service[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({
    nombre: "",
    precio: "",
    categoria: "",
  });
  const [loading, setLoading] = useState(true);

  // Categorías de servicios
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [categoryForm, setCategoryForm] = useState({ name: "" });
  const [editCategoryId, setEditCategoryId] = useState<string | null>(null);
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);

  const { toast } = useToast ? useToast() : { toast: () => {} };

  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const empresaRUT = user.empresaRUT;

  // Cargar servicios desde la API
  useEffect(() => {
    if (!empresaRUT) return;
    setLoading(true);
    fetch(`/api/servicios?empresaRUT=${empresaRUT}`)
      .then(res => {
        if (!res.ok) throw new Error("Error al obtener servicios");
        return res.json();
      })
      .then(data => {
        setServices(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [empresaRUT]);

  // Cargar categorías desde la API
  useEffect(() => {
    if (!empresaRUT) return;
    fetch(`/api/categorias-servicios?empresaRUT=${empresaRUT}`)
      .then(res => res.json())
      .then(data => setCategories(data))
      .catch(() => setCategories([]));
  }, [empresaRUT]);

  // CRUD Categoría
  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!empresaRUT || !categoryForm.name) return;
    const res = await fetch("/api/categorias-servicios", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: categoryForm.name, empresaRUT }),
    });
    if (res.ok) {
      const nueva = await res.json();
      setCategories(prev => [...prev, nueva]);
      setCategoryForm({ name: "" });
      setIsCategoryDialogOpen(false);
      toast && toast({ title: "Categoría creada" });
    }
  };

  const handleEditCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!empresaRUT || !editCategoryId || !categoryForm.name) return;
    const res = await fetch("/api/categorias-servicios", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: editCategoryId, name: categoryForm.name, empresaRUT }),
    });
    if (res.ok) {
      setCategories(prev =>
        prev.map(c => (c._id === editCategoryId ? { ...c, name: categoryForm.name } : c))
      );
      setEditCategoryId(null);
      setCategoryForm({ name: "" });
      setIsCategoryDialogOpen(false);
      toast && toast({ title: "Categoría actualizada" });
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (!empresaRUT) return;
    const res = await fetch("/api/categorias-servicios", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, empresaRUT }),
    });
    if (res.ok) {
      setCategories(prev => prev.filter(c => c._id !== id));
      toast && toast({ title: "Categoría eliminada" });
    }
  };

  // Filtrar servicios por término de búsqueda
  const filteredServices = services.filter(
    (service) =>
      service.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      service.categoria.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Formatear precio en pesos chilenos
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0
    }).format(price);
  };

  // Agregar servicio (POST)
  const handleAddService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!empresaRUT) return;
    const res = await fetch("/api/servicios", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nombre: form.nombre,
        precio: Number(form.precio),
        categoria: form.categoria,
        empresaRUT,
      }),
    });
    if (res.ok) {
      // Opcional: recargar servicios desde backend para obtener el _id generado
      fetch(`/api/servicios?empresaRUT=${empresaRUT}`)
        .then(res => res.json())
        .then(data => setServices(data));
      setForm({ nombre: "", precio: "", categoria: "" });
      setIsDialogOpen(false);
    }
  };

  // Editar servicio (PUT)
  const handleEditService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!empresaRUT || !editId) return;
    const res = await fetch("/api/servicios", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: editId,
        nombre: form.nombre,
        precio: Number(form.precio),
        categoria: form.categoria,
        empresaRUT,
      }),
    });
    if (res.ok) {
      setServices(prev =>
        prev.map(s =>
          s._id === editId
            ? { ...s, nombre: form.nombre, precio: Number(form.precio), categoria: form.categoria }
            : s
        )
      );
      setIsEditDialogOpen(false);
      setEditId(null);
      setForm({ nombre: "", precio: "", categoria: "" });
    }
  };

  // Eliminar servicio (DELETE)
  const handleDeleteService = async (id: string) => {
    if (!empresaRUT) return;
    const res = await fetch("/api/servicios", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, empresaRUT }),
    });
    if (res.ok) {
      setServices(prev => prev.filter(s => s._id !== id));
    }
  };

  // Abrir diálogo de edición y cargar datos
  const openEditDialog = (service: Service) => {
    setEditId(service._id);
    setForm({
      nombre: service.nombre,
      precio: service.precio.toString(),
      categoria: service.categoria,
    });
    setIsEditDialogOpen(true);
  };

  if (loading) return <div>Cargando servicios...</div>;

  return (
    <MainLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Gestión de Categorías de Servicios */}
        <div className="bg-[#f8f8fa] rounded-lg p-6 mb-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-bold">Categorías de Servicios</h2>
            <Button
              className="bg-salon-primary hover:bg-salon-secondary"
              onClick={() => {
                setEditCategoryId(null);
                setCategoryForm({ name: "" });
                setIsCategoryDialogOpen(true);
              }}
            >
              <Plus className="h-4 w-4 mr-2" /> Nueva Categoría
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => (
              <div key={cat._id} className="flex items-center bg-white/90 rounded px-3 py-1 shadow">
                <span className="mr-2">{cat.name}</span>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => {
                    setEditCategoryId(cat._id);
                    setCategoryForm({ name: cat.name });
                    setIsCategoryDialogOpen(true);
                  }}
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => handleDeleteCategory(cat._id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>

        {/* Diálogo para crear/editar categoría */}
        <Dialog open={isCategoryDialogOpen} onOpenChange={setIsCategoryDialogOpen}>
          <DialogContent className="sm:max-w-[400px]">
            <DialogHeader>
              <DialogTitle>
                {editCategoryId ? "Editar Categoría" : "Nueva Categoría"}
              </DialogTitle>
            </DialogHeader>
            <form
              className="space-y-4 py-4"
              onSubmit={editCategoryId ? handleEditCategory : handleAddCategory}
            >
              <div className="space-y-2">
                <Label htmlFor="category-name">Nombre de la categoría</Label>
                <Input
                  id="category-name"
                  value={categoryForm.name}
                  onChange={e => setCategoryForm({ name: e.target.value })}
                  required
                />
              </div>
              <div className="flex justify-end space-x-2 pt-4">
                <Button
                  variant="outline"
                  type="button"
                  onClick={() => setIsCategoryDialogOpen(false)}
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

        {/* Gestión de Servicios */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0 bg-[#f8f8fa] rounded-lg p-6">
          <h1 className="page-title mb-0">Gestión de Servicios</h1>
          {(user.role === "admin" || user.role === "superadmin") && (
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-salon-primary hover:bg-salon-secondary">
                  <Plus className="h-4 w-4 mr-2" /> Nuevo Servicio
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[550px]">
                <DialogHeader>
                  <DialogTitle>Agregar nuevo servicio</DialogTitle>
                </DialogHeader>
                <form className="space-y-4 py-4" onSubmit={handleAddService}>
                  <div className="space-y-2">
                    <Label htmlFor="name">Nombre del servicio</Label>
                    <Input
                      id="name"
                      placeholder="Ej: Corte de pelo"
                      value={form.nombre}
                      onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="category">Categoría</Label>
                    <Select
                      value={form.categoria}
                      onValueChange={value => setForm(f => ({ ...f, categoria: value }))}
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar categoría" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map(cat => (
                          <SelectItem key={cat._id} value={cat.name}>
                            {cat.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="price">Precio (CLP)</Label>
                    <div className="relative">
                      <DollarSign className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                      <Input
                        id="price"
                        type="number"
                        placeholder="10000"
                        className="pl-8"
                        value={form.precio}
                        onChange={e => setForm(f => ({ ...f, precio: e.target.value }))}
                        required
                      />
                    </div>
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
        </div>
        <div className="flex items-center bg-[#f8f8fa] rounded-lg shadow p-4">
          <div className="relative flex-grow">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
            <Input
              placeholder="Buscar por nombre o categoría..."
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
                <TableHead>Servicio</TableHead>
                <TableHead>Categoría</TableHead>
                <TableHead>Precio</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredServices.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-4">
                    No se encontraron servicios
                  </TableCell>
                </TableRow>
              ) : (
                filteredServices.map((service) => (
                  <TableRow key={service._id}>
                    <TableCell className="font-medium">{service.nombre}</TableCell>
                    <TableCell>{service.categoria}</TableCell>
                    <TableCell>{formatPrice(service.precio)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEditDialog(service)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDeleteService(service._id)}
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

        {/* Diálogo para editar servicio */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-[550px]">
            <DialogHeader>
              <DialogTitle>Editar servicio</DialogTitle>
            </DialogHeader>
            <form className="space-y-4 py-4" onSubmit={handleEditService}>
              <div className="space-y-2">
                <Label htmlFor="name-edit">Nombre del servicio</Label>
                <Input
                  id="name-edit"
                  value={form.nombre}
                  onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category-edit">Categoría</Label>
                <Select
                  value={form.categoria}
                  onValueChange={value => setForm(f => ({ ...f, categoria: value }))}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar categoría" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(cat => (
                      <SelectItem key={cat._id} value={cat.name}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="price-edit">Precio (CLP)</Label>
                <div className="relative">
                  <DollarSign className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                  <Input
                    id="price-edit"
                    type="number"
                    className="pl-8"
                    value={form.precio}
                    onChange={e => setForm(f => ({ ...f, precio: e.target.value }))}
                    required
                  />
                </div>
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
      </div>
    </MainLayout>
  );
}