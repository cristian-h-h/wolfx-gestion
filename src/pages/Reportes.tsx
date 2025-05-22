import { useState, useRef } from "react";
import MainLayout from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "@/hooks/use-toast";
import { AccessDenied } from "@/components/comisiones/AccessDenied";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import * as XLSX from "xlsx";

// Definición de columnas disponibles para el informe detallado/personalizado
const allColumns = [
  { key: "professional", label: "Profesional" },
  { key: "occupation", label: "Ocupación" },
  { key: "date", label: "Fecha" },
  { key: "folio", label: "Folio" },
  { key: "client", label: "Cliente" },
  { key: "service", label: "Servicio" },
  { key: "amount", label: "Monto" },
  { key: "commission", label: "Comisión" },
];

// Tipos de informe
const tipoInformeOptions = [
  { value: "comisiones", label: "Comisiones" },
  { value: "servicios", label: "Servicios" },
  { value: "ventas_productos", label: "Venta Productos" },
];

export default function Reportes() {
  const [selectedMonth, setSelectedMonth] = useState<string>("");
  const [selectedYear, setSelectedYear] = useState<string>(new Date().getFullYear().toString());
  const [selectedProfessional, setSelectedProfessional] = useState<string>("all");
  const [selectedOccupation, setSelectedOccupation] = useState<string>("all");
  const [reportsGenerated, setReportsGenerated] = useState<boolean>(false);
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [reportType, setReportType] = useState<"resumen" | "detallado" | "personalizado">("resumen");
  const [selectedColumns, setSelectedColumns] = useState<string[]>(allColumns.map(c => c.key));
  const [tipoVista, setTipoVista] = useState<"resumen" | "detallado">("resumen");
  const [tipoInforme, setTipoInforme] = useState<string>("comisiones");
  const [modoServicios, setModoServicios] = useState<"servicio-profesional" | "profesional-servicio">("servicio-profesional");
  const printRef = useRef<HTMLDivElement>(null);

  // NUEVO: Estados para datos reales
  const [serviciosData, setServiciosData] = useState<any[]>([]);
  const [ventasProductosData, setVentasProductosData] = useState<any[]>([]);
  const [comisionesResumen, setComisionesResumen] = useState<any[]>([]);
  const [comisionesDetallado, setComisionesDetallado] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Control de acceso: solo admin, gerente y contador pueden ver reportes
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  if (!["admin", "gerente", "contador"].includes(user.role)) {
    return <AccessDenied />;
  }

  // Formatear precio en pesos chilenos
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0
    }).format(price);
  };

  // Maneja el cambio de selección de columnas
  const handleColumnToggle = (key: string) => {
    setSelectedColumns(cols =>
      cols.includes(key)
        ? cols.filter(col => col !== key)
        : [...cols, key]
    );
  };

  // FETCH: Obtener datos reales de reportes
  const fetchReportData = async () => {
    setLoading(true);
    const params = new URLSearchParams({
      empresaRUT: user.empresaRUT,
      tipoInforme,
      tipoVista,
      profesional: selectedProfessional !== "all" ? selectedProfessional : "",
      ocupacion: selectedOccupation !== "all" ? selectedOccupation : "",
      servicio: "", // puedes agregar si tienes selector de servicio
      producto: "", // puedes agregar si tienes selector de producto
      fechaInicio: startDate ? startDate.toISOString().slice(0, 10) : "",
      fechaFin: endDate ? endDate.toISOString().slice(0, 10) : "",
      mes: selectedMonth,
      anio: selectedYear,
      modoServicios,
    });
    const res = await fetch(`/api/reportes?${params.toString()}`);
    if (res.ok) {
      const data = await res.json();
      if (tipoInforme === "servicios") {
        setServiciosData(data);
      } else if (tipoInforme === "ventas_productos") {
        setVentasProductosData(data);
      } else if (tipoInforme === "comisiones") {
        if (tipoVista === "resumen") setComisionesResumen(data);
        else setComisionesDetallado(data);
      }
    } else {
      toast("No se pudo obtener el reporte.");
    }
    setLoading(false);
  };

  // MODIFICADO: generateReport para usar fetch
  const generateReport = async () => {
    if (startDate && endDate && startDate > endDate) {
      toast("La fecha de inicio no puede ser mayor que la fecha de término.");
      return;
    }
    await fetchReportData();
    setReportsGenerated(true);
    toast(
      startDate && endDate
        ? `Reporte generado desde ${startDate.toLocaleDateString()} hasta ${endDate.toLocaleDateString()}.`
        : `Reporte para ${selectedMonth}/${selectedYear} generado correctamente.`
    );
  };

  // Exportar a Excel
  const exportToExcel = () => {
    let data: any[] = [];
    if (tipoInforme === "servicios") {
      if (tipoVista === "resumen") {
        data = serviciosData.map(row => ({
          Servicio: row._id || row.servicio,
          "Cantidad total": row.count || row.cantidad,
          Total: row.total
        }));
      } else {
        data = serviciosData.map(row => ({
          Servicio: row.servicio,
          Profesional: row.profesional,
          Cantidad: row.cantidad,
          Total: row.total
        }));
      }
    } else if (tipoInforme === "ventas_productos") {
      data = ventasProductosData
        .sort((a, b) => (a._id || a.nombre).localeCompare(b._id || b.nombre))
        .map(row => ({
          Producto: row._id || row.nombre,
          Cantidad: row.cantidad,
          Total: row.total
        }));
    } else if (tipoInforme === "comisiones") {
      if (tipoVista === "resumen") {
        data = comisionesResumen.map(row => ({
          Profesional: row.professional,
          Ocupación: row.occupation,
          "Servicios realizados": row.serviceCount,
          "Monto total": row.totalAmount,
          "Comisión": row.commission
        }));
      } else {
        data = comisionesDetallado.map(row => {
          const obj: any = {};
          allColumns.filter(col => selectedColumns.includes(col.key)).forEach(col => {
            obj[col.label] = row[col.key];
          });
          return obj;
        });
      }
    }
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Reporte");
    XLSX.writeFile(wb, "reporte.xlsx");
  };

  // Imprimir solo el informe
  const handlePrint = () => {
    if (!printRef.current) return;
    const printContents = printRef.current.innerHTML;
    const originalContents = document.body.innerHTML;
    document.body.innerHTML = printContents;
    window.print();
    document.body.innerHTML = originalContents;
    window.location.reload();
  };

  const monthNames = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
  ];

  const yearOptions = [];
  const currentYear = new Date().getFullYear();
  for (let i = currentYear - 2; i <= currentYear; i++) {
    yearOptions.push(i.toString());
  }

  // Para comisiones: filtrado por ocupación
  const filteredReportData = comisionesResumen.filter(row =>
    selectedOccupation === "all" || row.occupation === selectedOccupation
  );

  // Para comisiones: detalle de profesional seleccionado
  const professionalDetailedData = comisionesDetallado.filter(row =>
    row.professional === comisionesResumen.find(p => p.id?.toString() === selectedProfessional)?.professional
  );

  // Para comisiones: todos los detalles para tabla personalizada
  const allDetailedData = comisionesDetallado.filter(row =>
    (selectedOccupation === "all" || row.occupation === selectedOccupation) &&
    (selectedProfessional === "all" || row.professional === comisionesResumen.find(p => p.id?.toString() === selectedProfessional)?.professional)
  );

  return (
    <MainLayout>
      <div className="space-y-6 animate-fade-in">
        <h1 className="page-title">Reportes</h1>
        <Card>
          <CardHeader>
            <CardTitle>Generar Reporte</CardTitle>
            <CardDescription>
              Seleccione el tipo de informe y los parámetros para generar el reporte.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
              {/* Selector de tipo de informe */}
              <div className="space-y-2">
                <Label htmlFor="tipoInforme">Tipo de informe</Label>
                <Select value={tipoInforme} onValueChange={setTipoInforme}>
                  <SelectTrigger id="tipoInforme">
                    <SelectValue placeholder="Tipo de informe" />
                  </SelectTrigger>
                  <SelectContent>
                    {tipoInformeOptions.map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {/* Selector de tipo de vista */}
              <div className="space-y-2">
                <Label htmlFor="tipoVista">Tipo de vista</Label>
                <Select value={tipoVista} onValueChange={v => setTipoVista(v as "resumen" | "detallado")}>
                  <SelectTrigger id="tipoVista">
                    <SelectValue placeholder="Tipo de vista" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="resumen">Resumen</SelectItem>
                    <SelectItem value="detallado">Detallado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {/* Si es Servicios, muestra modo de agrupación */}
              {tipoInforme === "servicios" && (
                <div className="space-y-2">
                  <Label htmlFor="modoServicios">Agrupar por</Label>
                  <Select value={modoServicios} onValueChange={v => setModoServicios(v as "servicio-profesional" | "profesional-servicio")}>
                    <SelectTrigger id="modoServicios">
                      <SelectValue placeholder="Agrupar por" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="servicio-profesional">Servicio - Profesional</SelectItem>
                      <SelectItem value="profesional-servicio">Profesional - Servicio</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
              {/* ...puedes dejar los filtros de fechas, profesional, ocupación, etc. */}
              <div className="space-y-2">
                <Label htmlFor="startDate">Fecha de inicio</Label>
                <DatePicker
                  selected={startDate}
                  onChange={(date: Date | null) => setStartDate(date)}
                  dateFormat="yyyy-MM-dd"
                  className="w-full border rounded px-2 py-1"
                  placeholderText="Selecciona fecha de inicio"
                  id="startDate"
                  maxDate={endDate || undefined}
                  showMonthDropdown
                  showYearDropdown
                  dropdownMode="select"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate">Fecha de término</Label>
                <DatePicker
                  selected={endDate}
                  onChange={(date: Date | null) => setEndDate(date)}
                  dateFormat="yyyy-MM-dd"
                  className="w-full border rounded px-2 py-1"
                  placeholderText="Selecciona fecha de término"
                  id="endDate"
                  minDate={startDate || undefined}
                  showMonthDropdown
                  showYearDropdown
                  dropdownMode="select"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="professional">Profesional (opcional)</Label>
                <Select value={selectedProfessional} onValueChange={setSelectedProfessional}>
                  <SelectTrigger id="professional">
                    <SelectValue placeholder="Todos los profesionales" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los profesionales</SelectItem>
                    <SelectItem value="1">Carolina Herrera</SelectItem>
                    <SelectItem value="2">Juan Pérez</SelectItem>
                    <SelectItem value="3">María Rodríguez</SelectItem>
                    <SelectItem value="4">Carlos Muñoz</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="occupation">Ocupación</Label>
                <Select value={selectedOccupation} onValueChange={setSelectedOccupation}>
                  <SelectTrigger id="occupation">
                    <SelectValue placeholder="Todas las ocupaciones" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas las ocupaciones</SelectItem>
                    <SelectItem value="manicurista">Manicurista</SelectItem>
                    <SelectItem value="peluquero">Peluquero/a</SelectItem>
                    <SelectItem value="estilista">Estilista</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="month">Mes</Label>
                <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                  <SelectTrigger id="month">
                    <SelectValue placeholder="Seleccionar mes" />
                  </SelectTrigger>
                  <SelectContent>
                    {monthNames.map((month, index) => (
                      <SelectItem key={index + 1} value={(index + 1).toString()}>
                        {month}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="year">Año</Label>
                <Select value={selectedYear} onValueChange={setSelectedYear}>
                  <SelectTrigger id="year">
                    <SelectValue placeholder="Seleccionar año" />
                  </SelectTrigger>
                  <SelectContent>
                    {yearOptions.map((year) => (
                      <SelectItem key={year} value={year}>{year}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            {/* Selector de columnas para Detallado y Personalizado */}
            {(reportType === "detallado" || reportType === "personalizado") && (
              <div className="mb-4 flex flex-wrap gap-4 items-center mt-6">
                <span className="font-semibold">Columnas a mostrar:</span>
                {allColumns.map(col => (
                  <label key={col.key} className="flex items-center gap-1">
                    <input
                      type="checkbox"
                      checked={selectedColumns.includes(col.key)}
                      onChange={() => handleColumnToggle(col.key)}
                    />
                    {col.label}
                  </label>
                ))}
              </div>
            )}
          </CardContent>
          <CardFooter className="flex justify-end">
            <Button 
              onClick={generateReport} 
              className="bg-salon-primary hover:bg-salon-secondary"
              disabled={
                (!startDate && !endDate && (!selectedMonth || !selectedYear)) || loading
              }
            >
              {loading ? "Generando..." : "Generar Reporte"}
            </Button>
          </CardFooter>
        </Card>

        {reportsGenerated && (
          <Card>
            <div ref={printRef}>
              <CardHeader>
                <CardTitle>
                  {tipoInforme === "servicios"
                    ? "Informe de Servicios"
                    : tipoInforme === "ventas_productos"
                    ? "Informe de Venta de Productos"
                    : "Informe de Comisiones"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {/* Servicios */}
                {tipoInforme === "servicios" && (
                  <>
                    {tipoVista === "resumen" ? (
                      <div className="rounded-md border">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Servicio</TableHead>
                              <TableHead className="text-right">Cantidad total</TableHead>
                              <TableHead className="text-right">Total</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {serviciosData.map((row, idx) => (
                              <TableRow key={idx}>
                                <TableCell>{row._id || row.servicio}</TableCell>
                                <TableCell className="text-right">{row.count || row.cantidad}</TableCell>
                                <TableCell className="text-right">{formatPrice(row.total)}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    ) : (
                      <div className="rounded-md border">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              {modoServicios === "servicio-profesional" ? (
                                <>
                                  <TableHead>Servicio</TableHead>
                                  <TableHead>Profesional</TableHead>
                                </>
                              ) : (
                                <>
                                  <TableHead>Profesional</TableHead>
                                  <TableHead>Servicio</TableHead>
                                </>
                              )}
                              <TableHead className="text-right">Cantidad</TableHead>
                              <TableHead className="text-right">Total</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {serviciosData.map((row, idx) => (
                              <TableRow key={idx}>
                                {modoServicios === "servicio-profesional" ? (
                                  <>
                                    <TableCell>{row.servicio}</TableCell>
                                    <TableCell>{row.profesional}</TableCell>
                                  </>
                                ) : (
                                  <>
                                    <TableCell>{row.profesional}</TableCell>
                                    <TableCell>{row.servicio}</TableCell>
                                  </>
                                )}
                                <TableCell className="text-right">{row.cantidad}</TableCell>
                                <TableCell className="text-right">{formatPrice(row.total)}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </>
                )}
                {/* Venta de productos */}
                {tipoInforme === "ventas_productos" && (
                  <>
                    {tipoVista === "resumen" ? (
                      <div className="rounded-md border">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Producto</TableHead>
                              <TableHead className="text-right">Cantidad total</TableHead>
                              <TableHead className="text-right">Total</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {ventasProductosData
                              .sort((a, b) => (a._id || a.nombre).localeCompare(b._id || b.nombre))
                              .map((row, idx) => (
                                <TableRow key={idx}>
                                  <TableCell>{row._id || row.nombre}</TableCell>
                                  <TableCell className="text-right">{row.cantidad}</TableCell>
                                  <TableCell className="text-right">{formatPrice(row.total)}</TableCell>
                                </TableRow>
                              ))}
                          </TableBody>
                        </Table>
                      </div>
                    ) : (
                      <div className="rounded-md border">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Producto</TableHead>
                              <TableHead className="text-right">Cantidad</TableHead>
                              <TableHead className="text-right">Total</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {ventasProductosData
                              .sort((a, b) => (a._id || a.nombre).localeCompare(b._id || b.nombre))
                              .map((row, idx) => (
                                <TableRow key={idx}>
                                  <TableCell>{row._id || row.nombre}</TableCell>
                                  <TableCell className="text-right">{row.cantidad}</TableCell>
                                  <TableCell className="text-right">{formatPrice(row.total)}</TableCell>
                                </TableRow>
                              ))}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </>
                )}
                {/* Comisiones */}
                {tipoInforme === "comisiones" && (
                  <>
                    {tipoVista === "resumen" ? (
                      selectedProfessional === "all" ? (
                        <div className="rounded-md border">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Profesional</TableHead>
                                <TableHead>Ocupación</TableHead>
                                <TableHead className="text-right">Servicios realizados</TableHead>
                                <TableHead className="text-right">Monto total</TableHead>
                                <TableHead className="text-right">Comisión (25%)</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {filteredReportData.map((row, idx) => (
                                <TableRow key={row.id || idx}>
                                  <TableCell className="font-medium">{row.professional}</TableCell>
                                  <TableCell>{row.occupation?.charAt(0).toUpperCase() + row.occupation?.slice(1)}</TableCell>
                                  <TableCell className="text-right">{row.serviceCount}</TableCell>
                                  <TableCell className="text-right">{formatPrice(row.totalAmount)}</TableCell>
                                  <TableCell className="text-right">{formatPrice(row.commission)}</TableCell>
                                </TableRow>
                              ))}
                              <TableRow>
                                <TableCell colSpan={2} className="text-right font-medium">Totales:</TableCell>
                                <TableCell className="text-right font-bold">
                                  {filteredReportData.reduce((sum, item) => sum + (item.serviceCount ?? 0), 0)}
                                </TableCell>
                                <TableCell className="text-right font-bold">
                                  {formatPrice(filteredReportData.reduce((sum, item) => sum + (item.totalAmount ?? 0), 0))}
                                </TableCell>
                                <TableCell className="text-right font-bold">
                                  {formatPrice(filteredReportData.reduce((sum, item) => sum + (item.commission ?? 0), 0))}
                                </TableCell>
                              </TableRow>
                            </TableBody>
                          </Table>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-md">
                            <div>
                              <p className="text-sm text-gray-500">Profesional</p>
                              <p className="font-medium">
                                {comisionesResumen.find(p => p.id?.toString() === selectedProfessional)?.professional}
                              </p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-500">Total de servicios</p>
                              <p className="font-medium">
                                {comisionesResumen.find(p => p.id?.toString() === selectedProfessional)?.serviceCount}
                              </p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-500">Comisión total</p>
                              <p className="font-medium">
                                {formatPrice(comisionesResumen.find(p => p.id?.toString() === selectedProfessional)?.commission || 0)}
                              </p>
                            </div>
                          </div>

                          <h3 className="font-medium text-lg">Detalle de servicios</h3>
                          <div className="rounded-md border">
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>Fecha</TableHead>
                                  <TableHead>Folio</TableHead>
                                  <TableHead>Cliente</TableHead>
                                  <TableHead>Servicio</TableHead>
                                  <TableHead className="text-right">Monto</TableHead>
                                  <TableHead className="text-right">Comisión</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {professionalDetailedData.map((row, idx) => (
                                  <TableRow key={row.id || idx}>
                                    <TableCell>{row.date}</TableCell>
                                    <TableCell>{row.folio}</TableCell>
                                    <TableCell>{row.client}</TableCell>
                                    <TableCell>{row.service}</TableCell>
                                    <TableCell className="text-right">{formatPrice(row.amount)}</TableCell>
                                    <TableCell className="text-right">{formatPrice(row.commission)}</TableCell>
                                  </TableRow>
                                ))}
                                <TableRow>
                                  <TableCell colSpan={4} className="text-right font-medium">Totales:</TableCell>
                                  <TableCell className="text-right font-bold">
                                    {formatPrice(professionalDetailedData.reduce((sum, item) => sum + (item.amount ?? 0), 0))}
                                  </TableCell>
                                  <TableCell className="text-right font-bold">
                                    {formatPrice(professionalDetailedData.reduce((sum, item) => sum + (item.commission ?? 0), 0))}
                                  </TableCell>
                                </TableRow>
                              </TableBody>
                            </Table>
                          </div>
                        </div>
                      )
                    ) : (
                      <div className="rounded-md border">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              {allColumns.filter(col => selectedColumns.includes(col.key)).map(col => (
                                <TableHead key={col.key}>{col.label}</TableHead>
                              ))}
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {allDetailedData.map((row, idx) => (
                              <TableRow key={idx}>
                                {allColumns.filter(col => selectedColumns.includes(col.key)).map(col => (
                                  <TableCell key={col.key}>
                                    {col.key === "amount" || col.key === "commission"
                                      ? formatPrice(row[col.key])
                                      : col.key === "occupation"
                                        ? row[col.key]?.charAt(0).toUpperCase() + row[col.key]?.slice(1)
                                        : row[col.key]}
                                  </TableCell>
                                ))}
                              </TableRow>
                            ))}
                            <TableRow>
                              <TableCell colSpan={selectedColumns.length - 2} className="text-right font-medium">Totales:</TableCell>
                              {selectedColumns.includes("amount") && (
                                <TableCell className="text-right font-bold">
                                  {formatPrice(allDetailedData.reduce((sum, item) => sum + (item.amount ?? 0), 0))}
                                </TableCell>
                              )}
                              {selectedColumns.includes("commission") && (
                                <TableCell className="text-right font-bold">
                                  {formatPrice(allDetailedData.reduce((sum, item) => sum + (item.commission ?? 0), 0))}
                                </TableCell>
                              )}
                            </TableRow>
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </div>
            <CardFooter className="flex gap-2 justify-end">
              <Button variant="outline" onClick={exportToExcel}>
                Exportar a Excel
              </Button>
              <Button variant="outline" onClick={handlePrint}>
                Imprimir
              </Button>
            </CardFooter>
          </Card>
        )}
      </div>
    </MainLayout>
  );
}