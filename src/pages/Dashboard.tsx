import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Users, Scissors, FileText, Clock, PieChart as PieIcon } from "lucide-react";
import MainLayout from "@/components/layout/MainLayout";
import { useNavigate } from "react-router-dom";
import {
  BarChart,
  XAxis,
  YAxis,
  Bar,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { AccessDenied } from "@/components/comisiones/AccessDenied";

// --- INICIO INTEGRACIÓN API DASHBOARD ---
const COLORS = ["#9b87f5", "#f5a623", "#50e3c2", "#f55e87", "#f8e71c"];
const diasSemana = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

export default function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState<{ username: string; role: string; name: string } | null>(null);

  // Estados para la API
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Verificar si el usuario ha iniciado sesión
    const userStr = localStorage.getItem("user");
    if (!userStr) {
      navigate("/login");
      return;
    }
    setUser(JSON.parse(userStr));

    // Fetch API dashboard
    const empresaRUT = JSON.parse(userStr).empresaRUT;
    if (!empresaRUT) return;

    setLoading(true);
    fetch(`/api/dashboard?empresaRUT=${empresaRUT}`)
      .then(res => res.json())
      .then(data => {
        setDashboardData(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [navigate]);

  if (!user) return null;
  if (!["admin", "gerente"].includes(user.role)) return <AccessDenied />;
  if (loading) return <div>Cargando dashboard...</div>;

  // Formatear precios en CLP
  const formatPrice = (price: number) =>
    new Intl.NumberFormat("es-CL", {
      style: "currency",
      currency: "CLP",
      minimumFractionDigits: 0,
    }).format(price);

  // Fecha y hora actual
  const now = new Date();

  // Color pastel claro para todos los contenedores
  const pastelCard = "bg-[#f8f8fa] shadow-lg";

  // --- DATOS DESDE API O MOCK ---
  // KPIs
  const clientesTotales = dashboardData?.totalClientes ?? 248;
  const clientesNuevos = dashboardData?.clientesNuevos ?? 12;
  const ventasDia = dashboardData?.totalVentasHoy ?? 125000;
  const ventasMes = dashboardData?.totalVentasMes ?? 2150000;
  const citasHoy = dashboardData?.totalCitasHoy ?? 8;

  // KPIs por categoría (puedes adaptar si tu API entrega estos datos)
  const categorias = [
    {
      nombre: "Peluquería",
      atencionesHoy: dashboardData?.categorias?.peluqueria?.hoy ?? 5,
      atencionesSemana: dashboardData?.categorias?.peluqueria?.semana ?? 22,
      icon: Scissors,
    },
    {
      nombre: "Manicure",
      atencionesHoy: dashboardData?.categorias?.manicure?.hoy ?? 2,
      atencionesSemana: dashboardData?.categorias?.manicure?.semana ?? 8,
      icon: Users,
    },
    {
      nombre: "Depilación",
      atencionesHoy: dashboardData?.categorias?.depilacion?.hoy ?? 1,
      atencionesSemana: dashboardData?.categorias?.depilacion?.semana ?? 5,
      icon: FileText,
    },
    {
      nombre: "Coloración",
      atencionesHoy: dashboardData?.categorias?.coloracion?.hoy ?? 3,
      atencionesSemana: dashboardData?.categorias?.coloracion?.semana ?? 10,
      icon: Calendar,
    },
  ];

  // Gráficos y tablas
  const ventasMesAnterior = dashboardData?.ventasMesAnterior ?? [
    { dia: "01", ventas: 90000 },
    { dia: "05", ventas: 120000 },
    { dia: "10", ventas: 95000 },
    { dia: "15", ventas: 110000 },
    { dia: "20", ventas: 130000 },
    { dia: "25", ventas: 170000 },
    { dia: "30", ventas: 210000 },
  ];
  const ventasMesActual = dashboardData?.ventasMesActual ?? [
    { dia: "01", ventas: 100000 },
    { dia: "05", ventas: 130000 },
    { dia: "10", ventas: 115000 },
    { dia: "15", ventas: 140000 },
    { dia: "20", ventas: 150000 },
    { dia: "25", ventas: 180000 },
    { dia: "30", ventas: 220000 },
  ];
  const ventasAnio = dashboardData?.ventasAnio ?? [
    { mes: "Ene", ventas: 800000 },
    { mes: "Feb", ventas: 950000 },
    { mes: "Mar", ventas: 1100000 },
    { mes: "Abr", ventas: 1200000 },
    { mes: "May", ventas: 1250000 },
  ];
  const ventasPorDia = dashboardData?.ventasPorDia ?? [
    { dia: "Lun", ventas: 120000 },
    { dia: "Mar", ventas: 95000 },
    { dia: "Mié", ventas: 110000 },
    { dia: "Jue", ventas: 130000 },
    { dia: "Vie", ventas: 170000 },
    { dia: "Sáb", ventas: 210000 },
    { dia: "Dom", ventas: 80000 },
  ];
  const appointmentsData = dashboardData?.citasSemana ?? [
    { name: "Lun", citas: 4 },
    { name: "Mar", citas: 6 },
    { name: "Mié", citas: 5 },
    { name: "Jue", citas: 8 },
    { name: "Vie", citas: 10 },
    { name: "Sáb", citas: 12 },
    { name: "Dom", citas: 3 },
  ];
  const topServicesData = dashboardData?.topServicios ?? [
    { name: "Corte de pelo", value: 40 },
    { name: "Coloración", value: 25 },
    { name: "Peinado", value: 15 },
    { name: "Manicure", value: 10 },
    { name: "Depilación", value: 10 },
  ];
  const ocupacionProfesionales = dashboardData?.ocupacionProfesionales ?? [
    { name: "Carolina", value: 30 },
    { name: "Juan", value: 25 },
    { name: "María", value: 20 },
    { name: "Carlos", value: 15 },
    { name: "Valentina", value: 10 },
  ];

  // Si tu API entrega categorías de atenciones por semana, reemplaza aquí:
  const categoriasAtenciones = dashboardData?.categoriasAtenciones ?? [
    {
      nombre: "Peluquería",
      color: "#9b87f5",
      semanaAnterior: [3, 4, 2, 5, 6, 7, 2],
      estaSemana: [4, 5, 3, 6, 7, 8, 3],
    },
    {
      nombre: "Manicure",
      color: "#f5a623",
      semanaAnterior: [1, 2, 1, 2, 2, 3, 1],
      estaSemana: [2, 2, 2, 3, 3, 4, 2],
    },
    {
      nombre: "Depilación",
      color: "#50e3c2",
      semanaAnterior: [0, 1, 0, 1, 1, 1, 0],
      estaSemana: [1, 1, 1, 1, 2, 2, 1],
    },
    {
      nombre: "Coloración",
      color: "#f55e87",
      semanaAnterior: [1, 1, 1, 2, 2, 2, 1],
      estaSemana: [1, 2, 2, 2, 3, 3, 2],
    },
  ];

  // Suma total de ventas mes anterior y mes actual
  const totalVentasMesAnterior = ventasMesAnterior.reduce((acc, curr) => acc + curr.ventas, 0);
  const totalVentasMesActual = ventasMesActual.reduce((acc, curr) => acc + curr.ventas, 0);

  return (
    <MainLayout>
      <div className="bg-white/90 rounded-lg shadow-lg p-6 mb-4">
        {/* Encabezado de bienvenida con info a la derecha */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-2">
          <div>
            <h1 className="page-title">Bienvenido:</h1>
            <div className="text-xl font-semibold text-salon-primary mt-1">
              {user.name}
            </div>
          </div>
          <div className="mt-4 md:mt-0 text-right">
            <div className="text-2xl font-bold text-salon-primary">
              {now.toLocaleDateString("es-CL", { weekday: "long" }).toUpperCase()}
            </div>
            <div className="text-xl font-semibold text-salon-primary">
              {now.toLocaleDateString("es-CL", { day: "2-digit", month: "2-digit", year: "numeric" })}
            </div>
            <div className="text-2xl font-mono font-bold text-salon-primary">
              {now.toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
            </div>
          </div>
        </div>
        <p className="text-gray-700 mt-4">
          Panel de control del sistema de peluquería
        </p>

        {/* Tarjetas de KPIs por categoría */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {categorias.map((cat) => (
            <Card key={cat.nombre} className={pastelCard}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500 flex items-center">
                  <cat.icon className="h-4 w-4 mr-1" />
                  {cat.nombre}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xs font-semibold text-red-600">Atenciones hoy</div>
                <p className="text-4xl font-extrabold text-red-600">{cat.atencionesHoy}</p>
                <div className="text-xs text-gray-500 mt-2">Esta semana</div>
                <p className="text-lg font-semibold">{cat.atencionesSemana}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Tarjetas de KPIs generales */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Citas para hoy */}
          <Card className={pastelCard}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500 flex items-center">
                <Calendar className="h-4 w-4 mr-1" />
                Citas para hoy
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{citasHoy}</p>
              <p className="text-xs text-gray-500 mt-1">2 en espera</p>
            </CardContent>
          </Card>

          {/* Clientes registrados */}
          <Card className={pastelCard}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500 flex items-center">
                <Users className="h-4 w-4 mr-1" />
                Clientes registrados
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{clientesTotales}</p>
              <p className="text-xs text-green-600 mt-1">+{clientesNuevos} este mes</p>
            </CardContent>
          </Card>

          {/* Ventas del día y del mes */}
          <Card className={pastelCard}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500 flex items-center">
                <FileText className="h-4 w-4 mr-1" />
                Ventas del día
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold underline">{formatPrice(ventasDia)}</p>
              <p className="text-xs text-green-600 mt-1">+18% vs ayer</p>
              <div className="mt-2 text-xs text-gray-500">
                <span className="font-semibold">Mes:</span> {formatPrice(ventasMes)}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Gráficos de barras comparativos por categoría */}
        <div className="space-y-8">
          {categoriasAtenciones.map((cat) => (
            <div key={cat.nombre} className={`${pastelCard} rounded-lg p-4 mb-2`}>
              <h2 className="text-lg font-bold mb-2 flex items-center gap-2" style={{ color: cat.color }}>
                <span className="inline-block w-3 h-3 rounded-full" style={{ background: cat.color }}></span>
                {cat.nombre}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Semana anterior */}
                <div>
                  <div className="text-sm font-semibold mb-1 text-gray-500">Semana anterior</div>
                  <div className="h-[220px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={diasSemana.map((dia, i) => ({ dia, atenciones: cat.semanaAnterior[i] }))}
                      >
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="dia" />
                        <YAxis allowDecimals={false} />
                        <Tooltip />
                        <Bar dataKey="atenciones" fill={cat.color} radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                {/* Esta semana */}
                <div>
                  <div className="text-sm font-semibold mb-1 text-gray-500">Esta semana</div>
                  <div className="h-[220px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={diasSemana.map((dia, i) => ({ dia, atenciones: cat.estaSemana[i] }))}
                      >
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="dia" />
                        <YAxis allowDecimals={false} />
                        <Tooltip />
                        <Bar dataKey="atenciones" fill={cat.color} radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Gráficos de ventas: Mes anterior, Mes actual y Año en curso */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Ventas mes anterior */}
          <Card className={pastelCard}>
            <CardHeader>
              <CardTitle>Ventas mes anterior</CardTitle>
              <div className="text-lg font-bold text-salon-primary mt-1">
                {formatPrice(totalVentasMesAnterior)}
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-[220px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={ventasMesAnterior}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="dia" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="ventas" fill="#9b87f5" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Ventas mes actual */}
          <Card className={pastelCard}>
            <CardHeader>
              <CardTitle>Ventas mes en curso</CardTitle>
              <div className="text-lg font-bold text-salon-primary mt-1">
                {formatPrice(totalVentasMesActual)}
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-[220px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={ventasMesActual}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="dia" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="ventas" fill="#f5a623" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Ventas año en curso */}
          <Card className={pastelCard}>
            <CardHeader>
              <CardTitle>Total ventas año en curso</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[220px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={ventasAnio}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="mes" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="ventas" fill="#50e3c2" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Gráficos de indicadores */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Gráfico de barras: Citas de la semana */}
          <Card className={pastelCard}>
            <CardHeader>
              <CardTitle>Citas de la semana</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={appointmentsData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="citas" fill="#9b87f5" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Gráfico de torta: Servicios más vendidos */}
          <Card className={pastelCard}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieIcon className="h-5 w-5" /> Servicios más vendidos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={topServicesData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={90}
                      label
                    >
                      {topServicesData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Legend />
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Gráficos adicionales */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Gráfico de barras: Ventas por día */}
          <Card className={pastelCard}>
            <CardHeader>
              <CardTitle>Ventas por día</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={ventasPorDia}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="dia" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="ventas" fill="#f5a623" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Gráfico de torta: Ocupación de profesionales */}
          <Card className={pastelCard}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieIcon className="h-5 w-5" /> Ocupación de profesionales
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={ocupacionProfesionales}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={90}
                      label
                    >
                      {ocupacionProfesionales.map((entry, index) => (
                        <Cell key={`cell-ocupacion-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Legend />
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Próximas citas (listado simple) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className={pastelCard}>
            <CardHeader>
              <CardTitle>Próximas citas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[1, 2, 3, 4].map((_, index) => (
                  <div key={index} className="flex items-start space-x-4">
                    <div className="bg-salon-primary/10 p-2 rounded-md">
                      <Clock className="h-5 w-5 text-salon-primary" />
                    </div>
                    <div className="space-y-1">
                      <p className="font-medium">
                        Corte y peinado - María González
                      </p>
                      <p className="text-sm text-gray-500">
                        {now.toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })} - Estilista: Carolina Herrera
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}