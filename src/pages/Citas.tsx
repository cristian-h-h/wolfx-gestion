import { useEffect, useState, useRef } from "react";
import { Calendar as CalendarIcon, Plus, Search, Printer, Edit, Trash2 } from "lucide-react";
import MainLayout from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { es } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";
import * as XLSX from "xlsx";

// Utilidades para formatear/desformatear con separador de miles
function formatNumberCLP(value: string | number): string {
  const num = Number(String(value).replace(/\./g, "")) || 0;
  return num.toLocaleString("es-CL");
}
function parseNumberCLP(value: string): number {
  return Number(String(value).replace(/\./g, "")) || 0;
}

// Listado de servicios y profesionales (con precio base)
const serviciosBase = [
  { name: "Corte de pelo", price: 12000 },
  { name: "Coloración", price: 35000 },
  { name: "Peinado", price: 15000 },
  { name: "Maquillaje", price: 25000 },
  { name: "Manicure", price: 10000 },
  { name: "Corte de barba", price: 8000 },
  { name: "Pedicure", price: 12000 },
  { name: "Depilación", price: 9000 },
  { name: "Tratamiento capilar", price: 18000 }
];

const tiposDeServicios = serviciosBase.map(s => s.name);

const profesionales = [
  "Carolina Herrera",
  "Juan Pérez",
  "María Rodríguez",
  "Carlos Muñoz",
  "Valentina Silva"
];

type MaterialDetail = {
  nombre: string;
  valor: number;
};

type ServiceDetail = {
  servicio: string;
  profesional: string;
  valor: number;
  materiales: MaterialDetail[];
};

type PaymentMethod = {
  tipo: "Efectivo" | "Transferencia" | "Tarjeta";
  monto: number;
  numeroOperacion?: string;
};

interface Appointment {
  _id?: string;
  id?: number;
  folio: string;
  date: Date;
  time: string;
  client: string;
  phone: string;
  servicios: ServiceDetail[];
  totalAmount: number;
  paymentMethods: PaymentMethod[];
}

// Simulación de clientes registrados (en la práctica, esto vendría de tu backend)
const clientesRegistrados = [
  { id: 1, nombre: "Ana María López", telefono: "+56 9 1234 5678" },
  { id: 2, nombre: "Pedro Gómez", telefono: "+56 9 8765 4321" },
  { id: 3, nombre: "Valeria Soto", telefono: "+56 9 2468 1357" },
  { id: 4, nombre: "Roberto Sánchez", telefono: "+56 9 1357 2468" },
  { id: 5, nombre: "Sofía Guzmán", telefono: "+56 9 3698 5214" },
];

// Simulación de citas agendadas para cargar datos base (en la práctica, esto vendría de tu backend)
const citasAgendadas = [
  {
    folio: "F-001-2025",
    date: new Date(),
    time: "10:00",
    client: "Ana María López",
    phone: "+56 9 1234 5678",
    servicios: [
      { servicio: "Corte de pelo", profesional: "Carolina Herrera", valor: 12000, materiales: [] }
    ]
  },
  {
    folio: "F-002-2025",
    date: new Date(),
    time: "11:30",
    client: "Pedro Gómez",
    phone: "+56 9 8765 4321",
    servicios: [
      { servicio: "Coloración", profesional: "Juan Pérez", valor: 35000, materiales: [] }
    ]
  }
];

export default function Citas() {
  const { toast } = useToast();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);

  // --- Nuevo: Folio voucher y búsqueda de cita agendada ---
  const [folioVoucher, setFolioVoucher] = useState("");
  const [citaSeleccionada, setCitaSeleccionada] = useState<any | null>(null);

  // --- Cliente seleccionado (para clientes sin cita previa) ---
  const [clienteSeleccionado, setClienteSeleccionado] = useState<any | null>(null);

  // Formulario para agregar/editar
  const [form, setForm] = useState({
    date: new Date(),
    time: "",
    client: "",
    phone: "",
    servicios: [
      { servicio: "", profesional: "", valor: 0, materiales: [] as MaterialDetail[] }
    ] as ServiceDetail[],
    paymentMethods: [
      { tipo: "Efectivo" as PaymentMethod["tipo"], monto: 0, numeroOperacion: "" }
    ],
    totalAmount: 0,
  });

  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const empresaRUT = user.empresaRUT || "12345678-9";

  // --- GET: Cargar atenciones desde MongoDB ---
  useEffect(() => {
    const fetchAtenciones = async () => {
      const res = await fetch(`/api/atenciones?empresaRUT=${empresaRUT}`);
      if (res.ok) {
        const data = await res.json();
        setAppointments(
          data.map((a: any) => ({
            ...a,
            date: new Date(a.fecha),
            id: a._id,
            _id: a._id,
            totalAmount: a.total,
          }))
        );
      }
    };
    fetchAtenciones();
  }, [empresaRUT]);

  // Calcular fechas para los últimos 10 días (incluyendo hoy)
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tenDaysAgo = new Date(today);
  tenDaysAgo.setDate(today.getDate() - 9);

  // Filtro visual: últimos 10 días si no hay búsqueda, si hay búsqueda mostrar todo
const now = new Date();
const currentMonth = now.getMonth();
const currentYear = now.getFullYear();

const filteredAppointments = appointments.filter((a) => {
  const appointmentDate = new Date(a.date);
  if (searchTerm.trim() === "") {
    // Mostrar solo las atenciones del mes y año en curso
    return (
      appointmentDate.getMonth() === currentMonth &&
      appointmentDate.getFullYear() === currentYear
    );
  }
  // Si hay búsqueda, mostrar todos los que coincidan
  return (
    a.folio.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.client.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.servicios.some(s => s.servicio.toLowerCase().includes(searchTerm.toLowerCase())) ||
    a.servicios.some(s => s.profesional.toLowerCase().includes(searchTerm.toLowerCase()))
  );
});

  // Formatear precio en pesos chilenos
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0
    }).format(price);
  };

  // --- Servicios y materiales ---
  const handleAddService = () => {
    setForm((prev) => ({
      ...prev,
      servicios: [...prev.servicios, { servicio: "", profesional: "", valor: 0, materiales: [] }]
    }));
  };

  const handleRemoveService = (idx: number) => {
    setForm((prev) => ({
      ...prev,
      servicios: prev.servicios.filter((_, i) => i !== idx)
    }));
  };

  // Cambia el valor automáticamente al seleccionar un servicio, pero editable
  const handleServiceChange = (idx: number, field: keyof ServiceDetail, value: any) => {
    setForm((prev) => ({
      ...prev,
      servicios: prev.servicios.map((s, i) => {
        if (i !== idx) return s;
        if (field === "servicio") {
          const servicioObj = serviciosBase.find(serv => serv.name === value);
          return {
            ...s,
            servicio: value,
            valor: servicioObj ? servicioObj.price : 0,
          };
        }
        return { ...s, [field]: value };
      })
    }));
  };

  // --- Materiales ---
  const handleAddMaterial = (serviceIdx: number) => {
    setForm((prev) => ({
      ...prev,
      servicios: prev.servicios.map((s, i) =>
        i === serviceIdx
          ? { ...s, materiales: [...(s.materiales || []), { nombre: "", valor: 0 }] }
          : s
      )
    }));
  };

  const handleRemoveMaterial = (serviceIdx: number, matIdx: number) => {
    setForm((prev) => ({
      ...prev,
      servicios: prev.servicios.map((s, i) =>
        i === serviceIdx
          ? { ...s, materiales: s.materiales.filter((_, j) => j !== matIdx) }
          : s
      )
    }));
  };

  const handleMaterialChange = (serviceIdx: number, matIdx: number, field: keyof MaterialDetail, value: any) => {
    setForm((prev) => ({
      ...prev,
      servicios: prev.servicios.map((s, i) =>
        i === serviceIdx
          ? {
              ...s,
              materiales: s.materiales.map((m, j) =>
                j === matIdx ? { ...m, [field]: value } : m
              )
            }
          : s
      )
    }));
  };

  // --- Formas de pago con saldo pendiente ---
  const calcTotal = () =>
    form.servicios.reduce(
      (acc, s) =>
        acc +
        Number(s.valor) +
        (s.materiales ? s.materiales.reduce((matAcc, m) => matAcc + Number(m.valor), 0) : 0),
      0
    );

  const calcSaldoPendiente = () => {
    const totalPagado = form.paymentMethods.reduce((acc, p) => acc + Number(p.monto), 0);
    return Math.max(0, calcTotal() - totalPagado);
  };

  const handleAddPayment = () => {
    const saldoPendiente = calcSaldoPendiente();
    setForm((prev) => ({
      ...prev,
      paymentMethods: [
        ...prev.paymentMethods,
        { tipo: "Efectivo", monto: saldoPendiente, numeroOperacion: "" }
      ]
    }));
  };

  const handleRemovePayment = (idx: number) => {
    setForm((prev) => ({
      ...prev,
      paymentMethods: prev.paymentMethods.filter((_, i) => i !== idx)
    }));
  };

  const handlePaymentChange = (idx: number, field: keyof PaymentMethod, value: string | number) => {
    setForm((prev) => {
      let paymentMethods = prev.paymentMethods.map((p, i) =>
        i === idx ? { ...p, [field]: value } : p
      );
      // Si se edita el monto, y hay más formas de pago después, sugerir el saldo pendiente en la siguiente
      if (field === "monto") {
        const totalHastaIdx = paymentMethods
          .slice(0, idx + 1)
          .reduce((acc, p) => acc + Number(p.monto), 0);
        const saldoPendiente = Math.max(0, calcTotal() - totalHastaIdx);
        if (paymentMethods[idx + 1]) {
          paymentMethods[idx + 1].monto = saldoPendiente;
        }
      }
      return { ...prev, paymentMethods };
    });
  };

  // --- Forma de pago mayoritaria ---
  const getMainPayment = (payments: PaymentMethod[]) => {
    if (!payments.length) return "";
    const max = payments.reduce((prev, curr) => (curr.monto > prev.monto ? curr : prev), payments[0]);
    let label = max.tipo;
    if (max.tipo === "Tarjeta" && max.numeroOperacion) {
      label += ` (Op. ${max.numeroOperacion})`;
    }
    return label;
  };

  // --- Cargar datos desde cita agendada ---
  const handleBuscarCita = () => {
    const cita = citasAgendadas.find(c => c.folio === folioVoucher);
    if (cita) {
      setCitaSeleccionada(cita);
      setForm((prev) => ({
        ...prev,
        date: cita.date,
        time: cita.time,
        client: cita.client,
        phone: cita.phone,
        servicios: cita.servicios.map(s => ({
          ...s,
          materiales: []
        }))
      }));
      setClienteSeleccionado(null);
      toast("Cita agendada encontrada y cargada");
    } else {
      setCitaSeleccionada(null);
      toast("No se encontró una cita agendada con ese folio");
    }
  };

 // --- Seleccionar cliente desde registro (alfabético) ---
  const handleSelectCliente = (id: string) => {
    const cliente = clientesRegistrados.find(c => c.id.toString() === id);
    setClienteSeleccionado(cliente);
    setForm((prev) => ({
      ...prev,
      client: cliente ? cliente.nombre : "",
      phone: cliente ? cliente.telefono : "",
    }));
    setCitaSeleccionada(null);
  };

  // --- POST: Guardar atención ---
  const handleAddAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (calcSaldoPendiente() > 0) {
      toast("Debe cubrir el total antes de guardar");
      return;
    }
    const total = calcTotal();
    const res = await fetch("/api/atenciones", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        folio: folioVoucher || `F-00${appointments.length + 1}-2025`,
        cliente: form.client,
        telefono: form.phone,
        fecha: form.date,
        servicios: form.servicios,
        materiales: form.servicios.flatMap(s => s.materiales || []),
        pagos: form.paymentMethods,
        total,
        empresaRUT,
      }),
    });
    if (res.ok) {
      // Refrescar atenciones
      const res2 = await fetch(`/api/atenciones?empresaRUT=${empresaRUT}`);
      if (res2.ok) {
        const data = await res2.json();
        setAppointments(
          data.map((a: any) => ({
            ...a,
            date: new Date(a.fecha),
            id: a._id,
            _id: a._id,
            totalAmount: a.total,
          }))
        );
      }
      setForm({
        date: new Date(),
        time: "",
        client: "",
        phone: "",
        servicios: [{ servicio: "", profesional: "", valor: 0, materiales: [] }],
        paymentMethods: [{ tipo: "Efectivo", monto: 0, numeroOperacion: "" }],
        totalAmount: 0,
      });
      setFolioVoucher("");
      setCitaSeleccionada(null);
      setClienteSeleccionado(null);
      setIsDialogOpen(false);
      toast("Atención registrada correctamente");
    }
  };

  // --- PUT: Editar atención ---
  const handleEditAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (calcSaldoPendiente() > 0) {
      toast("Debe cubrir el total antes de guardar");
      return;
    }
    const total = calcTotal();
    if (!editId) return;
    const res = await fetch("/api/atenciones", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: editId,
        folio: folioVoucher,
        cliente: form.client,
        telefono: form.phone,
        fecha: form.date,
        servicios: form.servicios,
        materiales: form.servicios.flatMap(s => s.materiales || []),
        pagos: form.paymentMethods,
        total,
        empresaRUT,
      }),
    });
    if (res.ok) {
      // Refrescar atenciones
      const res2 = await fetch(`/api/atenciones?empresaRUT=${empresaRUT}`);
      if (res2.ok) {
        const data = await res2.json();
        setAppointments(
          data.map((a: any) => ({
            ...a,
            date: new Date(a.fecha),
            id: a._id,
            _id: a._id,
            totalAmount: a.total,
          }))
        );
      }
      setIsEditDialogOpen(false);
      setEditId(null);
      setForm({
        date: new Date(),
        time: "",
        client: "",
        phone: "",
        servicios: [{ servicio: "", profesional: "", valor: 0, materiales: [] }],
        paymentMethods: [{ tipo: "Efectivo", monto: 0, numeroOperacion: "" }],
        totalAmount: 0,
      });
      setFolioVoucher("");
      setCitaSeleccionada(null);
      setClienteSeleccionado(null);
      toast("Atención editada correctamente");
    }
  };

  // --- DELETE: Eliminar atención ---
  const handleDeleteAppointment = async (id: string | number | undefined) => {
    if (!id) return;
    if (!window.confirm("¿Seguro que deseas eliminar esta atención?")) return;
    const res = await fetch("/api/atenciones", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, empresaRUT }),
    });
    if (res.ok) {
      // Refrescar atenciones
      const res2 = await fetch(`/api/atenciones?empresaRUT=${empresaRUT}`);
      if (res2.ok) {
        const data = await res2.json();
        setAppointments(
          data.map((a: any) => ({
            ...a,
            date: new Date(a.fecha),
            id: a._id,
            _id: a._id,
            totalAmount: a.total,
          }))
        );
      }
      toast("Atención eliminada correctamente");
    }
  };

  // --- Editar: cargar datos ---
  const openEditDialog = (appointment: Appointment) => {
    setEditId(appointment._id || appointment.id?.toString() || "");
    setFolioVoucher(appointment.folio);
    setForm({
      date: appointment.date,
      time: appointment.time,
      client: appointment.client,
      phone: appointment.phone,
      servicios: appointment.servicios.map(s => ({
        ...s,
        materiales: s.materiales ? s.materiales.map(m => ({ ...m })) : []
      })),
      paymentMethods: appointment.paymentMethods.map(p => ({ ...p })),
      totalAmount: appointment.totalAmount,
    });
    setIsEditDialogOpen(true);
  };

  // --- UI ---
  const pastelCard = "bg-[#f8f8fa] shadow-lg";
  // --- INFORME DE CAJA: Estados y lógica ---
const [selectedDate, setSelectedDate] = useState<Date>(new Date());
const cajaRef = useRef<HTMLDivElement>(null);

const appointmentsOfDay = appointments.filter(a => {
  const d = new Date(a.date);
  return (
    d.getFullYear() === selectedDate.getFullYear() &&
    d.getMonth() === selectedDate.getMonth() &&
    d.getDate() === selectedDate.getDate()
  );
});

const resumenCategorias: Record<string, number> = {};
appointmentsOfDay.forEach(a => {
  a.servicios.forEach(s => {
    resumenCategorias[s.servicio] = (resumenCategorias[s.servicio] || 0) + Number(s.valor);
  });
});

const resumenPagos: Record<string, number> = {};
appointmentsOfDay.forEach(a => {
  a.paymentMethods.forEach(p => {
    resumenPagos[p.tipo] = (resumenPagos[p.tipo] || 0) + Number(p.monto);
  });
});

const totalDia = appointmentsOfDay.reduce((acc, a) => acc + Number(a.totalAmount), 0);

const handleExportExcel = () => {
  const wsData = [
      ["Empresa:", user.empresaNombre || "Nombre de la Empresa"],
  ["RUT:", user.empresaRUT || "12345678-9"],
  [],
  ["Resumen de Caja", format(selectedDate, "dd/MM/yyyy")],
    [],
    ["Resumen por Categoría de Servicio"],
    ["Categoría", "Monto"],
    ...Object.entries(resumenCategorias).map(([cat, monto]) => [cat, monto]),
    [],
    ["Resumen por Forma de Pago"],
    ["Forma de Pago", "Monto"],
    ...Object.entries(resumenPagos).map(([tipo, monto]) => [tipo, monto]),
    [],
    ["Total General", totalDia]
  ];
  const ws = XLSX.utils.aoa_to_sheet(wsData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Caja");
  XLSX.writeFile(wb, `informe_caja_${format(selectedDate, "yyyyMMdd")}.xlsx`);
};

const handlePrint = () => {
  if (!cajaRef.current) return;
  const printContents = cajaRef.current.innerHTML;
  const win = window.open("", "Print", "width=900,height=700");
  if (win) {
    win.document.write(`
      <html>
        <head>
          <title>Informe de Caja</title>
          <style>
            body { font-family: Inter, Arial, sans-serif; background: #f5f7fa; color: #222; }
            table { border-collapse: collapse; width: 100%; margin-bottom: 16px; }
            th, td { border: 1px solid #bbb; padding: 8px 12px; text-align: left; }
            th { background: #e0e7ef; }
            .total { font-weight: bold; background: #e0e7ef; }
            h2 { margin-top: 0; }
          </style>
        </head>
        <body>
          ${printContents}
        </body>
      </html>
    `);
    win.document.close();
    win.focus();
    setTimeout(() => win.print(), 300);
  }
};

  return (
    <MainLayout>
      <div className="space-y-6 animate-fade-in">


{/* INFORME DE CAJA */}
<section className="bg-[#e0f7fa] border border-[#00bcd4] shadow-xl rounded-lg p-6 mb-2">
  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
    <div className="flex items-center gap-2">
      <CalendarIcon className="h-5 w-5 text-[#00bcd4]" />
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className="font-semibold"
          >
            {selectedDate ? format(selectedDate, "PPP", { locale: es }) : "Seleccionar fecha"}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={(date) => setSelectedDate(date || new Date())}
            initialFocus
          />
        </PopoverContent>
      </Popover>
    </div>
    <div className="flex gap-2">
      <Button
        variant="outline"
        onClick={handleExportExcel}
        className="flex items-center gap-2"
        title="Exportar a Excel"
      >
        <span className="material-icons"></span> Exportar Excel
      </Button>
      <Button
        variant="outline"
        onClick={handlePrint}
        className="flex items-center gap-2"
        title="Imprimir informe"
      >
        <Printer className="h-4 w-4" /> Imprimir
      </Button>
    </div>
  </div>
  <div ref={cajaRef}>
    {/* Datos de la empresa */}
    <div className="flex items-center gap-4 mb-4">
      {user.empresaLogo && (
        <img
          src={user.empresaLogo}
          alt="Logo empresa"
          className="h-12 w-12 object-contain rounded bg-white border"
        />
      )}
      <div>
        <div className="font-bold text-lg">{user.empresaNombre || "Nombre de la Empresa"}</div>
        <div className="text-sm text-gray-700">RUT: {user.empresaRUT || "12345678-9"}</div>
      </div>
    </div>
    <h2 className="text-xl font-bold mb-2 text-[#0097a7]">Informe de Caja - {format(selectedDate, "dd/MM/yyyy")}</h2>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Resumen por categoría */}
      <div>
        <h3 className="font-semibold mb-2 text-[#00796b]">Ventas por Categoría de Servicio</h3>
        <table className="w-full border bg-white rounded shadow">
          <thead>
            <tr>
              <th className="p-2 border">Categoría</th>
              <th className="p-2 border text-right">Monto</th>
            </tr>
          </thead>
          <tbody>
            {Object.keys(resumenCategorias).length === 0 ? (
              <tr>
                <td colSpan={2} className="text-center p-3">Sin ventas</td>
              </tr>
            ) : (
              Object.entries(resumenCategorias).map(([cat, monto]) => (
                <tr key={cat}>
                  <td className="p-2 border">{cat}</td>
                  <td className="p-2 border text-right">{formatPrice(monto)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {/* Resumen por forma de pago */}
      <div>
        <h3 className="font-semibold mb-2 text-[#00796b]">Resumen por Forma de Pago</h3>
        <table className="w-full border bg-white rounded shadow">
          <thead>
            <tr>
              <th className="p-2 border">Forma de Pago</th>
              <th className="p-2 border text-right">Monto</th>
            </tr>
          </thead>
          <tbody>
            {Object.keys(resumenPagos).length === 0 ? (
              <tr>
                <td colSpan={2} className="text-center p-3">Sin pagos</td>
              </tr>
            ) : (
              Object.entries(resumenPagos).map(([tipo, monto]) => (
                <tr key={tipo}>
                  <td className="p-2 border">{tipo}</td>
                  <td className="p-2 border text-right">{formatPrice(monto)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
    <div className="mt-6 text-right text-lg font-bold text-[#006064]">
      Total del día: {formatPrice(totalDia)}
    </div>
  </div>
</section>
        

        {/* Encabezado destacado */}
        <div className="bg-white/90 rounded-lg shadow-lg p-6 mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <h1 className="page-title mb-0 text-gray-900">Registro de Atenciones</h1>
          {(user.role === "admin" || user.role === "recepcionista") && (
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-salon-primary hover:bg-salon-secondary">
                  <Plus className="h-4 w-4 mr-2" /> Nueva Atención
                </Button>
              </DialogTrigger>
              <DialogContent className={`sm:max-w-[700px] ${pastelCard}`}>
                <DialogHeader>
                  <DialogTitle>Registrar atención real</DialogTitle>
                </DialogHeader>
                <div className="max-h-[80vh] overflow-y-auto pr-2">
                  <form className="space-y-4 py-4" onSubmit={handleAddAppointment}>
                    <div className="space-y-2">
                      <Label>N° Folio Voucher</Label>
                      <div className="flex gap-2">
                        <Input
                          value={folioVoucher}
                          onChange={e => setFolioVoucher(e.target.value)}
                          placeholder="Ej: F-001-2025"
                          required
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={handleBuscarCita}
                          disabled={!folioVoucher}
                        >
                          Llamar cita
                        </Button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Cliente</Label>
                      <div className="flex gap-2">
                        <Input
                          value={form.client}
                          onChange={e => setForm(f => ({ ...f, client: e.target.value }))}
                          required
                          placeholder="Nombre cliente"
                          disabled={!!citaSeleccionada}
                        />
                        {!citaSeleccionada && (
                          <select
                            className="border rounded px-2 py-1 min-w-[180px]"
                            value={clienteSeleccionado?.id || ""}
                            onChange={e => handleSelectCliente(e.target.value)}
                          >
                            <option value="">Seleccionar cliente</option>
                            {[...clientesRegistrados]
                              .sort((a, b) => a.nombre.localeCompare(b.nombre))
                              .map((c) => (
                                <option key={c.id} value={c.id}>
                                  {c.nombre}
                                </option>
                              ))}
                          </select>
                        )}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Teléfono</Label>
                      <Input
                        value={form.phone}
                        onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                        required
                        placeholder="Teléfono"
                        disabled={!!citaSeleccionada}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Fecha</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-full justify-start text-left font-normal",
                              !form.date && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {form.date ? format(form.date, "PPP", { locale: es }) : "Seleccionar fecha"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={form.date}
                            onSelect={(date) => setForm(f => ({ ...f, date: date || new Date() }))}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                    <div className="space-y-2">
                      <Label>Hora</Label>
                      <Input
                        type="time"
                        value={form.time}
                        onChange={e => setForm(f => ({ ...f, time: e.target.value }))}
                        required
                        aria-label="Hora (formato 24 hrs)"
                      />
                      <span className="text-xs text-gray-500">Formato 24 hrs (ej: 14:00 para 2 de la tarde)</span>
                    </div>
                    <div>
                      <Label>Servicios prestados</Label>
                      {form.servicios.map((s, idx) => (
                        <div key={idx} className="flex flex-col gap-2 mb-4 border-b pb-2">
                          <div className="flex gap-2 flex-wrap items-end">
                            <div className="flex-1 min-w-[120px]">
                              <select
                                className="border rounded px-2 py-1 w-full"
                                value={s.servicio}
                                onChange={e => handleServiceChange(idx, "servicio", e.target.value)}
                                required
                              >
                                <option value="">Seleccionar servicio</option>
                                {tiposDeServicios.map(serv => (
                                  <option key={serv} value={serv}>{serv}</option>
                                ))}
                              </select>
                            </div>
                            <div className="flex-1 min-w-[120px]">
                              <select
                                className="border rounded px-2 py-1 w-full"
                                value={s.profesional}
                                onChange={e => handleServiceChange(idx, "profesional", e.target.value)}
                                required
                              >
                                <option value="">Seleccionar profesional</option>
                                {profesionales.map(prof => (
                                  <option key={prof} value={prof}>{prof}</option>
                                ))}
                              </select>
                            </div>
                            <div className="flex-1 min-w-[100px]">
                              <Input
                                type="text"
                                inputMode="numeric"
                                placeholder="Valor"
                                value={formatNumberCLP(s.valor)}
                                onChange={e => handleServiceChange(idx, "valor", parseNumberCLP(e.target.value))}
                                required
                              />
                            </div>
                            {form.servicios.length > 1 && (
                              <Button
                                type="button"
                                variant="destructive"
                                size="sm"
                                onClick={() => handleRemoveService(idx)}
                              >
                                Quitar
                              </Button>
                            )}
                          </div>
                          {/* Materiales */}
                          <div className="ml-2">
                            <Label className="text-xs font-bold" style={{ color: "#d32f2f" }}>
                              Materiales utilizados
                            </Label>
                            {s.materiales && s.materiales.length > 0 && s.materiales.map((m, matIdx) => (
                              <div key={matIdx} className="flex gap-2 items-end mt-1">
                                <Input
                                  placeholder="Material"
                                  value={m.nombre}
                                  onChange={e => handleMaterialChange(idx, matIdx, "nombre", e.target.value)}
                                  required
                                />
                                <Input
                                  type="text"
                                  inputMode="numeric"
                                  placeholder="Valor"
                                  value={formatNumberCLP(m.valor)}
                                  onChange={e => handleMaterialChange(idx, matIdx, "valor", parseNumberCLP(e.target.value))}
                                  required
                                />
                                <Button
                                  type="button"
                                  variant="destructive"
                                  size="sm"
                                  onClick={() => handleRemoveMaterial(idx, matIdx)}
                                >
                                  Quitar
                                </Button>
                              </div>
                            ))}
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="mt-1 font-bold"
                              style={{
                                background: "#ffeaea",
                                color: "#b71c1c",
                                borderColor: "#ffcdd2"
                              }}
                              onClick={() => handleAddMaterial(idx)}
                            >
                              Agregar material
                            </Button>
                          </div>
                        </div>
                      ))}
                      <Button type="button" variant="outline" size="sm" onClick={handleAddService}>
                        Agregar servicio
                      </Button>
                    </div>
                    <div>
                      <Label>Formas de pago</Label>
                      {form.paymentMethods.map((p, idx) => (
                        <div key={idx} className="flex gap-2 mb-2 flex-wrap items-end">
                          <div>
                            <select
                              className="border rounded px-2 py-1"
                              value={p.tipo}
                              onChange={e => handlePaymentChange(idx, "tipo", e.target.value as PaymentMethod["tipo"])}
                            >
                              <option value="Efectivo">Efectivo</option>
                              <option value="Transferencia">Transferencia</option>
                              <option value="Tarjeta">Tarjeta</option>
                            </select>
                          </div>
                          <div>
                            <Input
                              type="text"
                              inputMode="numeric"
                              placeholder="Monto"
                              value={formatNumberCLP(p.monto)}
                              min={0}
                              onChange={e => handlePaymentChange(idx, "monto", parseNumberCLP(e.target.value))}
                              required
                            />
                          </div>
                          {p.tipo === "Tarjeta" && (
                            <div>
                              <Input
                                placeholder="N° operación"
                                value={p.numeroOperacion || ""}
                                onChange={e => handlePaymentChange(idx, "numeroOperacion", e.target.value)}
                                required
                              />
                            </div>
                          )}
                          {form.paymentMethods.length > 1 && (
                            <Button
                              type="button"
                              variant="destructive"
                              size="sm"
                              onClick={() => handleRemovePayment(idx)}
                            >
                              Quitar
                            </Button>
                          )}
                        </div>
                      ))}
                      <Button type="button" variant="outline" size="sm" onClick={handleAddPayment}>
                        Agregar forma de pago
                      </Button>
                      <div className="mt-2 text-right font-semibold text-red-600">
                        Saldo pendiente: {formatPrice(calcSaldoPendiente())}
                      </div>
                    </div>
                    <div>
                      <Label>Monto total</Label>
                      <Input
                        type="text"
                        value={formatPrice(calcTotal())}
                        readOnly
                        className="bg-gray-100"
                      />
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
                        disabled={calcSaldoPendiente() > 0}
                        title={calcSaldoPendiente() > 0 ? "Debe cubrir el total antes de guardar" : ""}
                      >
                        Guardar
                      </Button>
                    </div>
                  </form>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>
        <div className={`flex items-center ${pastelCard} rounded-lg p-4`}>
          <div className="relative flex-grow">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
            <Input
              placeholder="Buscar por folio, cliente, servicio o profesional..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        <div className={`rounded-lg border overflow-x-auto ${pastelCard}`}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Folio</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead>Hora</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Teléfono</TableHead>
                <TableHead>Servicios</TableHead>
                <TableHead>Profesionales</TableHead>
                <TableHead>Materiales</TableHead>
                <TableHead>Monto</TableHead>
                <TableHead>Forma de pago principal</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAppointments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={11} className="text-center py-4">
                    No se encontraron atenciones
                  </TableCell>
                </TableRow>
              ) : (
                filteredAppointments.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell>{a.folio}</TableCell>
                    <TableCell>{format(a.date, "dd/MM/yyyy")}</TableCell>
                    <TableCell>{a.time}</TableCell>
                    <TableCell>{a.client}</TableCell>
                    <TableCell>{a.phone}</TableCell>
                    <TableCell>
                      {a.servicios.map((s, i) => (
                        <div key={i}>{s.servicio}</div>
                      ))}
                    </TableCell>
                    <TableCell>
                      {a.servicios.map((s, i) => (
                        <div key={i}>{s.profesional}</div>
                      ))}
                    </TableCell>
                    <TableCell>
                      {a.servicios.map((s, i) =>
                        s.materiales && s.materiales.length > 0 ? (
                          <div key={i}>
                            {s.materiales.map((m, j) => (
                              <div key={j}>
                                {m.nombre} ({formatPrice(m.valor)})
                              </div>
                            ))}
                          </div>
                        ) : null
                      )}
                    </TableCell>
                    <TableCell>{formatPrice(a.totalAmount)}</TableCell>
                    <TableCell>
                      <span className="font-semibold">
                        {getMainPayment(a.paymentMethods)}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.print()}
                        >
                          <Printer className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEditDialog(a)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDeleteAppointment(a.id)}
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

        {/* Diálogo para editar atención */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className={`sm:max-w-[700px] ${pastelCard}`}>
            <DialogHeader>
              <DialogTitle>Editar atención</DialogTitle>
            </DialogHeader>
            <div className="max-h-[80vh] overflow-y-auto pr-2">
              <form className="space-y-4 py-4" onSubmit={handleEditAppointment}>
                <div className="space-y-2">
                  <Label>N° Folio Voucher</Label>
                  <Input
                    value={folioVoucher}
                    onChange={e => setFolioVoucher(e.target.value)}
                    placeholder="Ej: F-001-2025"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Cliente</Label>
                  <Input
                    value={form.client}
                    onChange={e => setForm(f => ({ ...f, client: e.target.value }))}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Teléfono</Label>
                  <Input
                    value={form.phone}
                    onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Fecha</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !form.date && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {form.date ? format(form.date, "PPP", { locale: es }) : "Seleccionar fecha"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={form.date}
                        onSelect={(date) => setForm(f => ({ ...f, date: date || new Date() }))}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="space-y-2">
                  <Label>Hora</Label>
                  <Input
                    type="time"
                    value={form.time}
                    onChange={e => setForm(f => ({ ...f, time: e.target.value }))}
                    required
                    aria-label="Hora (formato 24 hrs)"
                  />
                  <span className="text-xs text-gray-500">Formato 24 hrs (ej: 14:00 para 2 de la tarde)</span>
                </div>
                <div>
                  <Label>Servicios prestados</Label>
                  {form.servicios.map((s, idx) => (
                    <div key={idx} className="flex flex-col gap-2 mb-4 border-b pb-2">
                      <div className="flex gap-2 flex-wrap items-end">
                        <div className="flex-1 min-w-[120px]">
                          <select
                            className="border rounded px-2 py-1 w-full"
                            value={s.servicio}
                            onChange={e => handleServiceChange(idx, "servicio", e.target.value)}
                            required
                          >
                            <option value="">Seleccionar servicio</option>
                            {tiposDeServicios.map(serv => (
                              <option key={serv} value={serv}>{serv}</option>
                            ))}
                          </select>
                        </div>
                        <div className="flex-1 min-w-[120px]">
                          <select
                            className="border rounded px-2 py-1 w-full"
                            value={s.profesional}
                            onChange={e => handleServiceChange(idx, "profesional", e.target.value)}
                            required
                          >
                            <option value="">Seleccionar profesional</option>
                            {profesionales.map(prof => (
                              <option key={prof} value={prof}>{prof}</option>
                            ))}
                          </select>
                        </div>
                        <div className="flex-1 min-w-[100px]">
                          <Input
                            type="text"
                            inputMode="numeric"
                            placeholder="Valor"
                            value={formatNumberCLP(s.valor)}
                            onChange={e => handleServiceChange(idx, "valor", parseNumberCLP(e.target.value))}
                            required
                          />
                        </div>
                        {form.servicios.length > 1 && (
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            onClick={() => handleRemoveService(idx)}
                          >
                            Quitar
                          </Button>
                        )}
                      </div>
                      {/* Materiales */}
                      <div className="ml-2">
                        <Label className="text-xs font-bold" style={{ color: "#d32f2f" }}>
                          Materiales utilizados
                        </Label>
                        {s.materiales && s.materiales.length > 0 && s.materiales.map((m, matIdx) => (
                          <div key={matIdx} className="flex gap-2 items-end mt-1">
                            <Input
                              placeholder="Material"
                              value={m.nombre}
                              onChange={e => handleMaterialChange(idx, matIdx, "nombre", e.target.value)}
                              required
                            />
                            <Input
                              type="text"
                              inputMode="numeric"
                              placeholder="Valor"
                              value={formatNumberCLP(m.valor)}
                              onChange={e => handleMaterialChange(idx, matIdx, "valor", parseNumberCLP(e.target.value))}
                              required
                            />
                            <Button
                              type="button"
                              variant="destructive"
                              size="sm"
                              onClick={() => handleRemoveMaterial(idx, matIdx)}
                            >
                              Quitar
                            </Button>
                          </div>
                        ))}
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="mt-1 font-bold"
                          style={{
                            background: "#ffeaea",
                            color: "#b71c1c",
                            borderColor: "#ffcdd2"
                          }}
                          onClick={() => handleAddMaterial(idx)}
                        >
                          Agregar material
                        </Button>
                      </div>
                    </div>
                  ))}
                  <Button type="button" variant="outline" size="sm" onClick={handleAddService}>
                    Agregar servicio
                  </Button>
                </div>
                <div>
                  <Label>Formas de pago</Label>
                  {form.paymentMethods.map((p, idx) => (
                    <div key={idx} className="flex gap-2 mb-2 flex-wrap items-end">
                      <div>
                        <select
                          className="border rounded px-2 py-1"
                          value={p.tipo}
                          onChange={e => handlePaymentChange(idx, "tipo", e.target.value as PaymentMethod["tipo"])}
                        >
                          <option value="Efectivo">Efectivo</option>
                          <option value="Transferencia">Transferencia</option>
                          <option value="Tarjeta">Tarjeta</option>
                        </select>
                      </div>
                      <div>
                        <Input
                          type="text"
                          inputMode="numeric"
                          placeholder="Monto"
                          value={formatNumberCLP(p.monto)}
                          min={0}
                          onChange={e => handlePaymentChange(idx, "monto", parseNumberCLP(e.target.value))}
                          required
                        />
                      </div>
                      {p.tipo === "Tarjeta" && (
                        <div>
                          <Input
                            placeholder="N° operación"
                            value={p.numeroOperacion || ""}
                            onChange={e => handlePaymentChange(idx, "numeroOperacion", e.target.value)}
                            required
                          />
                        </div>
                      )}
                      {form.paymentMethods.length > 1 && (
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          onClick={() => handleRemovePayment(idx)}
                        >
                          Quitar
                        </Button>
                      )}
                    </div>
                  ))}
                  <Button type="button" variant="outline" size="sm" onClick={handleAddPayment}>
                    Agregar forma de pago
                  </Button>
                  <div className="mt-2 text-right font-semibold text-red-600">
                    Saldo pendiente: {formatPrice(calcSaldoPendiente())}
                  </div>
                </div>
                <div>
                  <Label>Monto total</Label>
                  <Input
                    type="text"
                    value={formatPrice(calcTotal())}
                    readOnly
                    className="bg-gray-100"
                  />
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
                    disabled={calcSaldoPendiente() > 0}
                    title={calcSaldoPendiente() > 0 ? "Debe cubrir el total antes de guardar" : ""}
                  >
                    Guardar cambios
                  </Button>
                </div>
              </form>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
}
