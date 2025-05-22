import MainLayout from "@/components/layout/MainLayout";
import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Edit, Trash2, Save, X, Plus } from "lucide-react";

// Simulación de clientes registrados (reemplaza por fetch real)
const clientesRegistrados = [
  { id: 1, nombre: "Ana Torres", telefono: "912345678", email: "ana@mail.com" },
  { id: 2, nombre: "Pedro Rojas", telefono: "987654321", email: "pedro@mail.com" },
  { id: 3, nombre: "Valeria Soto", telefono: "923456789", email: "valeria@mail.com" },
];

const servicios = [
  { id: 1, nombre: "Corte de pelo" },
  { id: 2, nombre: "Coloración" },
  { id: 3, nombre: "Manicure" },
  { id: 4, nombre: "Peinado" },
];

const profesionales = [
  { id: 1, nombre: "Carolina Herrera" },
  { id: 2, nombre: "Juan Pérez" },
  { id: 3, nombre: "Valentina Silva" },
];

type Atencion = {
  servicio: string;
  profesional: string;
  hora: string;
};

type CitaAgendada = {
  _id?: string;
  folio: string;
  cliente: string;
  telefono: string;
  fecha: Date;
  atenciones: Atencion[];
};

export default function AgendarCita() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    clienteId: "",
    cliente: "",
    telefono: "",
    email: "",
    fecha: new Date(),
  });
  const [atenciones, setAtenciones] = useState<Atencion[]>([
    { servicio: "", profesional: "", hora: "" }
  ]);
  const [success, setSuccess] = useState(false);
  const [folio, setFolio] = useState("");
  const [citasAgendadas, setCitasAgendadas] = useState<CitaAgendada[]>([]);
  const [editIdx, setEditIdx] = useState<number | null>(null);
  const [editForm, setEditForm] = useState({
    clienteId: "",
    cliente: "",
    telefono: "",
    email: "",
    fecha: new Date(),
  });
  const [editAtenciones, setEditAtenciones] = useState<Atencion[]>([]);
  const [editId, setEditId] = useState<string | null>(null);

  // Simulación de usuario logueado
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const empresaRUT = user.empresaRUT || "12345678-9";

  // --- GET: Cargar citas del día desde MongoDB ---
  useEffect(() => {
    const fetchCitas = async () => {
      const fecha = new Date();
      const fechaStr = fecha.toISOString().slice(0, 10);
      const res = await fetch(`/api/agenda?empresaRUT=${empresaRUT}&fecha=${fechaStr}`);
      if (res.ok) {
        const data = await res.json();
        // Convertir fecha a objeto Date
        setCitasAgendadas(
          data.map((c: any) => ({
            ...c,
            fecha: new Date(c.fecha),
          }))
        );
      }
    };
    fetchCitas();
  }, [empresaRUT]);

  // Maneja cambios en los campos del formulario principal
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  // Cuando seleccionas un cliente, rellena nombre, teléfono y email automáticamente
  const handleClienteSelect = (clienteId: string) => {
    const cliente = clientesRegistrados.find(c => c.id.toString() === clienteId);
    setForm((prev) => ({
      ...prev,
      clienteId,
      cliente: cliente ? cliente.nombre : "",
      telefono: cliente ? cliente.telefono : "",
      email: cliente ? cliente.email : "",
    }));
  };

  // Maneja cambios en las atenciones (servicio/profesional/hora)
  const handleAtencionChange = (idx: number, field: keyof Atencion, value: string) => {
    setAtenciones((prev) => {
      const updated = [...prev];
      updated[idx][field] = value;
      return updated;
    });
  };

  // Agrega una nueva atención
  const handleAgregarAtencion = () => {
    setAtenciones((prev) => [...prev, { servicio: "", profesional: "", hora: "" }]);
  };

  // Quita la última atención (si hay más de una)
  const handleQuitarAtencion = () => {
    if (atenciones.length > 1) {
      setAtenciones((prev) => prev.slice(0, -1));
    }
  };

  // Botón salir
  const handleSalir = () => {
    navigate(-1);
  };

  // --- POST: Agendar nueva cita ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const fechaStr = form.fecha.toISOString().slice(0, 10);
    const res = await fetch("/api/agenda", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        cliente: form.cliente,
        telefono: form.telefono,
        atenciones,
        empresaRUT,
        fecha: fechaStr,
      }),
    });
    if (res.ok) {
      const data = await res.json();
      setFolio(data.folio);
      // Refrescar citas del día
      const res2 = await fetch(`/api/agenda?empresaRUT=${empresaRUT}&fecha=${fechaStr}`);
      if (res2.ok) {
        const citas = await res2.json();
        setCitasAgendadas(
          citas.map((c: any) => ({
            ...c,
            fecha: new Date(c.fecha),
          }))
        );
      }
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
      setForm({
        clienteId: "",
        cliente: "",
        telefono: "",
        email: "",
        fecha: new Date(),
      });
      setAtenciones([{ servicio: "", profesional: "", hora: "" }]);
    }
  };

  // --- EDICIÓN ---
  // Iniciar edición de cita
  const handleEditCita = (idx: number) => {
    const cita = citasAgendadas[idx];
    setEditIdx(idx);
    setEditId(cita._id || null);
    setEditForm({
      clienteId: "",
      cliente: cita.cliente,
      telefono: cita.telefono,
      email: "",
      fecha: cita.fecha,
    });
    setEditAtenciones(cita.atenciones.map(a => ({ ...a })));
  };

  // Cambios en edición de atenciones
  const handleEditAtencionChange = (idx: number, field: keyof Atencion, value: string) => {
    setEditAtenciones((prev) => {
      const updated = [...prev];
      updated[idx][field] = value;
      return updated;
    });
  };

  // Agregar atención en edición
  const handleEditAgregarAtencion = () => {
    setEditAtenciones((prev) => [...prev, { servicio: "", profesional: "", hora: "" }]);
  };

  // Quitar atención en edición
  const handleEditQuitarAtencion = () => {
    if (editAtenciones.length > 1) {
      setEditAtenciones((prev) => prev.slice(0, -1));
    }
  };

  // --- PUT: Guardar cambios de edición ---
  const handleSaveEdit = async () => {
    if (editIdx === null || !editId) return;
    const fechaStr = editForm.fecha.toISOString().slice(0, 10);
    const res = await fetch("/api/agenda", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: editId,
        cliente: editForm.cliente,
        telefono: editForm.telefono,
        atenciones: editAtenciones,
        empresaRUT,
        fecha: fechaStr,
      }),
    });
    if (res.ok) {
      // Refrescar citas del día
      const res2 = await fetch(`/api/agenda?empresaRUT=${empresaRUT}&fecha=${fechaStr}`);
      if (res2.ok) {
        const citas = await res2.json();
        setCitasAgendadas(
          citas.map((c: any) => ({
            ...c,
            fecha: new Date(c.fecha),
          }))
        );
      }
      setEditIdx(null);
      setEditId(null);
      setEditForm({
        clienteId: "",
        cliente: "",
        telefono: "",
        email: "",
        fecha: new Date(),
      });
      setEditAtenciones([{ servicio: "", profesional: "", hora: "" }]);
    }
  };

  // Cancelar edición
  const handleCancelEdit = () => {
    setEditIdx(null);
    setEditId(null);
    setEditForm({
      clienteId: "",
      cliente: "",
      telefono: "",
      email: "",
      fecha: new Date(),
    });
    setEditAtenciones([{ servicio: "", profesional: "", hora: "" }]);
  };

  // --- DELETE: Eliminar cita ---
  const handleDeleteCita = async (idx: number) => {
    const cita = citasAgendadas[idx];
    if (!cita._id) return;
    if (window.confirm("¿Seguro que deseas eliminar esta cita?")) {
      const res = await fetch("/api/agenda", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: cita._id, empresaRUT }),
      });
      if (res.ok) {
        // Refrescar citas del día
        const fechaStr = new Date().toISOString().slice(0, 10);
        const res2 = await fetch(`/api/agenda?empresaRUT=${empresaRUT}&fecha=${fechaStr}`);
        if (res2.ok) {
          const citas = await res2.json();
          setCitasAgendadas(
            citas.map((c: any) => ({
              ...c,
              fecha: new Date(c.fecha),
            }))
          );
        }
      }
    }
  };

  // Filtrar citas del día en curso
  const citasHoy = citasAgendadas.filter(
    cita => cita.fecha.toDateString() === new Date().toDateString()
  );

  return (
    <MainLayout>
      <div className="min-h-screen flex flex-col justify-center items-center p-4">
        {/* Encabezado destacado */}
        <div className="bg-white/90 rounded-lg shadow-lg p-6 mb-6 max-w-lg w-full">
          <h1 className="text-2xl font-bold text-gray-900 text-center mb-2">Agendar una Cita</h1>
          <p className="text-gray-700 text-center">
            Selecciona el cliente, fecha y los servicios a agendar.
          </p>
        </div>
        <Card className="max-w-lg w-full shadow-lg bg-[#f8f8fa]">
          <CardContent>
            <form className="space-y-4" onSubmit={handleSubmit}>
              {/* Mostrar folio generado si existe */}
              {folio && (
                <div className="text-center text-blue-700 font-bold mb-2">
                  N° de Cita: {folio}
                </div>
              )}
              <div>
                <Label>Cliente</Label>
                <Select
                  value={form.clienteId}
                  onValueChange={handleClienteSelect}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un cliente" />
                  </SelectTrigger>
                  <SelectContent>
                    {[...clientesRegistrados]
                      .sort((a, b) => a.nombre.localeCompare(b.nombre))
                      .map((c) => (
                        <SelectItem key={c.id} value={c.id.toString()}>
                          {c.nombre} ({c.telefono})
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
              {form.cliente && (
                <div>
                  <Label>Nombre</Label>
                  <Input value={form.cliente} readOnly />
                </div>
              )}
              {form.telefono && (
                <div>
                  <Label>Teléfono</Label>
                  <Input value={form.telefono} readOnly />
                </div>
              )}
              {form.email && (
                <div>
                  <Label>Email</Label>
                  <Input value={form.email} readOnly />
                </div>
              )}

              <div>
                <Label>Fecha</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full text-left">
                      {form.fecha ? format(form.fecha, "PPP", { locale: es }) : "Seleccionar fecha"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={form.fecha}
                      onSelect={(date) => setForm(f => ({ ...f, fecha: date || new Date() }))}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div>
                <Label>Atenciones</Label>
                {atenciones.map((at, idx) => (
                  <div key={idx} className="flex gap-2 mb-2 flex-wrap">
                    <div className="flex-1 min-w-[120px]">
                      <Label>Servicio</Label>
                      <Select
                        value={at.servicio}
                        onValueChange={value => handleAtencionChange(idx, "servicio", value)}
                        required
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona un servicio" />
                        </SelectTrigger>
                        <SelectContent>
                          {servicios.map((s) => (
                            <SelectItem key={s.id} value={s.nombre}>
                              {s.nombre}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex-1 min-w-[120px]">
                      <Label>Profesional</Label>
                      <Select
                        value={at.profesional}
                        onValueChange={value => handleAtencionChange(idx, "profesional", value)}
                        required
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona un profesional" />
                        </SelectTrigger>
                        <SelectContent>
                          {profesionales.map((p) => (
                            <SelectItem key={p.id} value={p.nombre}>
                              {p.nombre}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex-1 min-w-[100px]">
                      <Label>Hora</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          type="time"
                          value={at.hora}
                          onChange={e => handleAtencionChange(idx, "hora", e.target.value)}
                          required
                          aria-label="Hora (formato 24 hrs)"
                        />
                        {/* Icono de reloj */}
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <span className="text-xs text-gray-500">Formato 24 hrs (ej: 14:00 para 2 de la tarde)</span>
                    </div>
                  </div>
                ))}
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleAgregarAtencion}
                  >
                    Agregar otra atención
                  </Button>
                  {atenciones.length > 1 && (
                    <Button
                      type="button"
                      variant="destructive"
                      onClick={handleQuitarAtencion}
                    >
                      Quitar última atención
                    </Button>
                  )}
                </div>
              </div>

              <div className="flex gap-2">
                <Button type="submit" className="w-full bg-salon-primary hover:bg-salon-secondary">
                  Agendar Cita
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={handleSalir}
                >
                  Salir
                </Button>
              </div>
              {success && (
                <div className="text-green-600 text-center mt-2">
                  ¡Cita agendada correctamente!
                </div>
              )}
            </form>

            {/* Agenda del día */}
            {citasHoy.length > 0 && (
              <div className="mt-8">
                <h2 className="text-lg font-bold mb-2 text-center">Agenda de Hoy</h2>
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm border">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="px-2 py-1 border">Folio</th>
                        <th className="px-2 py-1 border">Cliente</th>
                        <th className="px-2 py-1 border">Teléfono</th>
                        <th className="px-2 py-1 border">Servicio(s)</th>
                        <th className="px-2 py-1 border">Profesional(es)</th>
                        <th className="px-2 py-1 border">Hora(s)</th>
                        <th className="px-2 py-1 border text-center">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {citasHoy.map((cita, idx) => (
                        editIdx === idx ? (
                          <tr key={idx} className="bg-yellow-50">
                            <td className="border px-2 py-1">{cita.folio}</td>
                            <td className="border px-2 py-1">
                              <Input
                                value={editForm.cliente}
                                onChange={e => setEditForm(f => ({ ...f, cliente: e.target.value }))}
                              />
                            </td>
                            <td className="border px-2 py-1">
                              <Input
                                value={editForm.telefono}
                                onChange={e => setEditForm(f => ({ ...f, telefono: e.target.value }))}
                              />
                            </td>
                            <td className="border px-2 py-1">
                              {editAtenciones.map((a, i) => (
                                <div key={i} className="mb-1">
                                  <Select
                                    value={a.servicio}
                                    onValueChange={value => handleEditAtencionChange(i, "servicio", value)}
                                    required
                                  >
                                    <SelectTrigger>
                                      <SelectValue placeholder="Servicio" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {servicios.map((s) => (
                                        <SelectItem key={s.id} value={s.nombre}>
                                          {s.nombre}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                              ))}
                            </td>
                            <td className="border px-2 py-1">
                              {editAtenciones.map((a, i) => (
                                <div key={i} className="mb-1">
                                  <Select
                                    value={a.profesional}
                                    onValueChange={value => handleEditAtencionChange(i, "profesional", value)}
                                    required
                                  >
                                    <SelectTrigger>
                                      <SelectValue placeholder="Profesional" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {profesionales.map((p) => (
                                        <SelectItem key={p.id} value={p.nombre}>
                                          {p.nombre}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                              ))}
                            </td>
                            <td className="border px-2 py-1">
                              {editAtenciones.map((a, i) => (
                                <div key={i} className="mb-1 flex items-center gap-1">
                                  <Input
                                    type="time"
                                    value={a.hora}
                                    onChange={e => handleEditAtencionChange(i, "hora", e.target.value)}
                                    required
                                  />
                                </div>
                              ))}
                            </td>
                            <td className="border px-2 py-1 text-center">
                              <div className="flex gap-1 justify-center">
                                <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white" onClick={handleSaveEdit}>
                                  <Save className="h-4 w-4" />
                                </Button>
                                <Button size="sm" variant="outline" onClick={handleEditAgregarAtencion}>
                                  <Plus className="h-4 w-4" />
                                </Button>
                                {editAtenciones.length > 1 && (
                                  <Button size="sm" variant="destructive" onClick={handleEditQuitarAtencion}>
                                    <X className="h-4 w-4" />
                                  </Button>
                                )}
                                <Button size="sm" variant="outline" onClick={handleCancelEdit}>
                                  Cancelar
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ) : (
                          <tr key={idx}>
                            <td className="border px-2 py-1">{cita.folio}</td>
                            <td className="border px-2 py-1">{cita.cliente}</td>
                            <td className="border px-2 py-1">{cita.telefono}</td>
                            <td className="border px-2 py-1">
                              {cita.atenciones.map((a) => a.servicio).join(", ")}
                            </td>
                            <td className="border px-2 py-1">
                              {cita.atenciones.map((a) => a.profesional).join(", ")}
                            </td>
                            <td className="border px-2 py-1">
                              {cita.atenciones.map((a) => a.hora).join(", ")}
                            </td>
                            <td className="border px-2 py-1 text-center">
                              <div className="flex gap-1 justify-center">
                                <Button size="sm" variant="outline" onClick={() => handleEditCita(idx)}>
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button size="sm" variant="destructive" onClick={() => handleDeleteCita(idx)}>
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        )
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

          </CardContent>
          <CardFooter>
            <div className="text-xs text-gray-500 w-full text-center">
              Recibirá una confirmación por WhatsApp o llamada.
            </div>
          </CardFooter>
        </Card>
      </div>
    </MainLayout>
  );
}