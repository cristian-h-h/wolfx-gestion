import { format } from "date-fns";
import { Printer, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "@/hooks/use-toast";

interface Appointment {
  id: number;
  folio: string;
  date: Date;
  time: string;
  client: string;
  phone: string;
  service: string;
  professional: string;
  status: "pending" | "completed" | "cancelled";
  totalAmount?: number;
}

// Para uso real, expandir esta interfaz con más detalles
interface ServiceOrderDetailProps {
  appointment: Appointment;
}

// Ejemplo de servicios para mostrar detalles (en producción vendría de la BD)
const mockServiceDetails = [
  { id: 1, name: "Corte de pelo", professional: "Carolina Herrera", price: 12000 },
  { id: 2, name: "Peinado", professional: "Carolina Herrera", price: 15000 },
  { id: 3, name: "Tratamiento capilar", professional: "Juan Pérez", price: 18000 },
];

export default function ServiceOrderDetails({ appointment }: ServiceOrderDetailProps) {
  // Formatear precio en pesos chilenos
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0
    }).format(price);
  };

  const handlePrint = () => {
    // En producción: Implementar lógica de impresión
    toast(`Imprimiendo orden de servicio ${appointment.folio}.`);
  };

  const handleExportPDF = () => {
    // En producción: Implementar exportación a PDF
    toast(`Exportando orden de servicio ${appointment.folio} a PDF.`);
  };

  const handleExportExcel = () => {
    // En producción: Implementar exportación a Excel
    toast(`Exportando orden de servicio ${appointment.folio} a Excel.`);
  };

  const calculateTotal = () => {
    return mockServiceDetails.reduce((total, service) => total + service.price, 0);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-md">
        <div>
          <p className="text-sm text-gray-500">Número de Folio</p>
          <p className="font-medium">{appointment.folio}</p>
        </div>
        <div>
          <p className="text-sm text-gray-500">Fecha</p>
          <p className="font-medium">{format(appointment.date, "dd/MM/yyyy")} - {appointment.time}</p>
        </div>
        <div>
          <p className="text-sm text-gray-500">Cliente</p>
          <p className="font-medium">{appointment.client}</p>
        </div>
        <div>
          <p className="text-sm text-gray-500">Teléfono</p>
          <p className="font-medium">{appointment.phone}</p>
        </div>
        <div>
          <p className="text-sm text-gray-500">Estado</p>
          <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              appointment.status === "pending"
                ? "bg-yellow-100 text-yellow-800"
                : appointment.status === "completed"
                ? "bg-green-100 text-green-800"
                : "bg-red-100 text-red-800"
            }`}
          >
            {appointment.status === "pending"
              ? "Pendiente"
              : appointment.status === "completed"
              ? "Completada"
              : "Cancelada"}
          </span>
        </div>
      </div>

      <div className="border-t pt-4">
        <h3 className="font-medium text-lg mb-4">Detalle de Servicios</h3>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Servicio</TableHead>
                <TableHead>Profesional</TableHead>
                <TableHead className="text-right">Precio</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockServiceDetails.map((service) => (
                <TableRow key={service.id}>
                  <TableCell>{service.name}</TableCell>
                  <TableCell>{service.professional}</TableCell>
                  <TableCell className="text-right">{formatPrice(service.price)}</TableCell>
                </TableRow>
              ))}
              <TableRow>
                <TableCell colSpan={2} className="text-right font-medium">Total:</TableCell>
                <TableCell className="text-right font-bold">{formatPrice(calculateTotal())}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </div>

      <div className="flex flex-wrap justify-end gap-2 pt-4 border-t">
        <Button
          variant="outline"
          onClick={handlePrint}
          className="flex items-center gap-2"
        >
          <Printer className="h-4 w-4" /> Imprimir
        </Button>
        <Button
          variant="outline"
          onClick={handleExportPDF}
          className="flex items-center gap-2"
        >
          <FileText className="h-4 w-4" /> Exportar PDF
        </Button>
        <Button
          variant="outline"
          onClick={handleExportExcel}
          className="flex items-center gap-2"
        >
          <FileText className="h-4 w-4" /> Exportar Excel
        </Button>
      </div>
    </div>
  );
}
