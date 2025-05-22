import { useEffect, useState } from "react";
import { Plus, Search, Edit, Trash2 } from "lucide-react";
import MainLayout from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

interface Client {
  _id: string;
  nombre: string;
  email: string;
  telefono: string;
  ultimaVisita?: string | null;
  visitas?: number;
}

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
const PAGE_SIZE = 20;

export default function Clientes() {
  const [clients, setClients] = useState<Client[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ nombre: "", email: "", telefono: "" });
  const [selectedLetter, setSelectedLetter] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const empresaRUT = user.empresaRUT;

  // --- GET: Cargar clientes desde la API ---
  useEffect(() => {
    if (!empresaRUT) return;
    setLoading(true);
    fetch(`/api/clientes?empresaRUT=${empresaRUT}`)
      .then(res => res.json())
      .then(data => {
        setClients(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [empresaRUT]);

  // Ordenar y filtrar clientes
  let filteredClients = clients
    .filter(
      (client) =>
        client.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.telefono.includes(searchTerm)
    )
    .sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));

  // Filtro por letra
  if (selectedLetter) {
    filteredClients = filteredClients.filter((client) =>
      client.nombre.toUpperCase().startsWith(selectedLetter)
    );
  }

  // Paginación
  const totalPages = Math.ceil(filteredClients.length / PAGE_SIZE);
  const paginatedClients = filteredClients.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  // Resetear página al cambiar filtro
  const handleLetterClick = (letter: string) => {
    setSelectedLetter(letter);
    setCurrentPage(1);
  };
  const handleClearLetter = () => {
    setSelectedLetter(null);
    setCurrentPage(1);
  };

  // --- POST: Agregar cliente ---
  const handleAddClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!empresaRUT) return;
    const res = await fetch("/api/clientes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nombre: form.nombre,
        email: form.email,
        telefono: form.telefono,
        empresaRUT,
      }),
    });
    if (res.ok) {
      const nuevo = await res.json();
      setClients(prev => [...prev, nuevo]);
      setForm({ nombre: "", email: "", telefono: "" });
      setIsDialogOpen(false);
    }
  };

  // --- PUT: Editar cliente ---
  const handleEditClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!empresaRUT || !editId) return;
    const res = await fetch("/api/clientes", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: editId,
        nombre: form.nombre,
        email: form.email,
        telefono: form.telefono,
        empresaRUT,
      }),
    });
    if (res.ok) {
      setClients(prev =>
        prev.map(c =>
          c._id === editId
            ? { ...c, nombre: form.nombre, email: form.email, telefono: form.telefono }
            : c
        )
      );
      setIsEditDialogOpen(false);
      setEditId(null);
      setForm({ nombre: "", email: "", telefono: "" });
    }
  };

  // --- DELETE: Eliminar cliente ---
  const handleDeleteClient = async (id: string) => {
    if (!empresaRUT) return;
    const res = await fetch("/api/clientes", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, empresaRUT }),
    });
    if (res.ok) {
      setClients(prev => prev.filter(c => c._id !== id));
    }
  };

  // Abrir diálogo de edición y cargar datos
  const openEditDialog = (client: Client) => {
    setEditId(client._id);
    setForm({
      nombre: client.nombre,
      email: client.email,
      telefono: client.telefono,
    });
    setIsEditDialogOpen(true);
  };

  // Cambiar de página
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  if (loading) return <div>Cargando clientes...</div>;

  return (
    <MainLayout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0 bg-[#f8f8fa] rounded-lg p-6">
          <h1 className="page-title mb-0">Gestión de Clientes</h1>
          {(user.role === "admin" || user.role === "recepcionista") && (
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-salon-primary hover:bg-salon-secondary">
                  <Plus className="h-4 w-4 mr-2" /> Nuevo Cliente
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[550px]">
                <DialogHeader>
                  <DialogTitle>Agregar nuevo cliente</DialogTitle>
                </DialogHeader>
                <form className="space-y-4 py-4" onSubmit={handleAddClient}>
                  <div className="space-y-2">
                    <Label htmlFor="name">Nombre completo</Label>
                    <Input
                      id="name"
                      placeholder="Ej: Ana María López"
                      value={form.nombre}
                      onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">Correo electrónico</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="cliente@ejemplo.com"
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
                        value={form.telefono}
                        onChange={e => setForm(f => ({ ...f, telefono: e.target.value }))}
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
              placeholder="Buscar por nombre, email o teléfono..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>
        </div>
        {/* Filtro por letra */}
        <div className="flex flex-wrap gap-1 justify-center mb-2">
          <Button
            size="sm"
            variant={selectedLetter === null ? "default" : "outline"}
            className="px-2 py-1"
            onClick={handleClearLetter}
          >
            Todos
          </Button>
          {ALPHABET.map((letter) => (
            <Button
              key={letter}
              size="sm"
              variant={selectedLetter === letter ? "default" : "outline"}
              className="px-2 py-1"
              onClick={() => handleLetterClick(letter)}
            >
              {letter}
            </Button>
          ))}
        </div>
        <div className="rounded-md border bg-[#f8f8fa] shadow">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Correo electrónico</TableHead>
                <TableHead>Teléfono</TableHead>
                <TableHead>Última visita</TableHead>
                <TableHead>Visitas totales</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedClients.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-4">
                    No se encontraron clientes
                  </TableCell>
                </TableRow>
              ) : (
                paginatedClients.map((client) => (
                  <TableRow key={client._id}>
                    <TableCell className="font-medium">{client.nombre}</TableCell>
                    <TableCell>{client.email}</TableCell>
                    <TableCell>{client.telefono}</TableCell>
                    <TableCell>
                      {client.ultimaVisita
                        ? new Date(client.ultimaVisita).toLocaleDateString()
                        : "Nunca"}
                    </TableCell>
                    <TableCell>{client.visitas ?? 0}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEditDialog(client)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDeleteClient(client._id)}
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
        {/* Paginación */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-1 mt-4 flex-wrap">
            {Array.from({ length: totalPages }, (_, i) => (
              <Button
                key={i + 1}
                size="sm"
                variant={currentPage === i + 1 ? "default" : "outline"}
                className="px-3 py-1"
                onClick={() => handlePageChange(i + 1)}
              >
                {i + 1}
              </Button>
            ))}
          </div>
        )}
        {/* Diálogo para editar cliente */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-[550px]">
            <DialogHeader>
              <DialogTitle>Editar cliente</DialogTitle>
            </DialogHeader>
            <form className="space-y-4 py-4" onSubmit={handleEditClient}>
              <div className="space-y-2">
                <Label htmlFor="name-edit">Nombre completo</Label>
                <Input
                  id="name-edit"
                  value={form.nombre}
                  onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))}
                  required
                />
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
                    value={form.telefono}
                    onChange={e => setForm(f => ({ ...f, telefono: e.target.value }))}
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
