import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarIcon, Plus, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface Service {
  id: string;
  name: string;
  price: number;
  professional: string;
}

interface ServiceOrderFormProps {
  onComplete: () => void;
}

export default function ServiceOrderForm({ onComplete }: ServiceOrderFormProps) {
  const [date, setDate] = useState<Date>(new Date());
  const [client, setClient] = useState("");
  const [phone, setPhone] = useState("");
  const [folio, setFolio] = useState(""); // Changed from static to user input
  const [services, setServices] = useState<Service[]>([]);
  const [currentService, setCurrentService] = useState<string>("");
  const [currentProfessional, setCurrentProfessional] = useState<string>("");
  const [currentPrice, setCurrentPrice] = useState<string>("");

  // Ejemplo de servicios disponibles
  const availableServices = [
    { id: "1", name: "Corte de pelo", price: 12000 },
    { id: "2", name: "Coloración", price: 35000 },
    { id: "3", name: "Peinado", price: 15000 },
    { id: "4", name: "Maquillaje", price: 25000 },
    { id: "5", name: "Manicure", price: 10000 },
    { id: "6", name: "Corte de barba", price: 8000 },
  ];

  // Ejemplo de profesionales
  const professionals = [
    { id: "1", name: "Carolina Herrera", occupation: "Estilista" },
    { id: "2", name: "Juan Pérez", occupation: "Estilista" },
    { id: "3", name: "María Rodríguez", occupation: "Manicurista" },
    { id: "4", name: "Carlos Muñoz", occupation: "Barbero" },
  ];

  const handleAddService = () => {
    if (!currentService || !currentProfessional || !currentPrice) return;

    const selectedService = availableServices.find(s => s.id === currentService);
    const selectedProfessional = professionals.find(p => p.id === currentProfessional);

    if (!selectedService || !selectedProfessional) return;

    const newService = {
      id: Date.now().toString(),
      name: selectedService.name,
      price: parseFloat(currentPrice),
      professional: selectedProfessional.name,
    };

    setServices([...services, newService]);
    setCurrentService("");
    setCurrentProfessional("");
    setCurrentPrice("");
  };

  const handleRemoveService = (id: string) => {
    setServices(services.filter(service => service.id !== id));
  };

  const calculateTotal = () => {
    return services.reduce((total, service) => total + service.price, 0);
  };

  const handleServiceChange = (value: string) => {
    setCurrentService(value);
    const selectedService = availableServices.find(s => s.id === value);
    if (selectedService) {
      setCurrentPrice(selectedService.price.toString());
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // En producción: Guardar en base de datos
    console.log({
      folio,
      date,
      client,
      phone,
      services,
      total: calculateTotal(),
    });
    
    onComplete();
  };

  // Formatear precio en pesos chilenos
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0
    }).format(price);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="folio">N° de Folio</Label>
          <Input 
            id="folio" 
            value={folio} 
            onChange={(e) => setFolio(e.target.value)}
            placeholder="Ingrese el número de folio" 
            required
          />
        </div>

        <div className="space-y-2">
          <Label>Fecha</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-full justify-start text-left font-normal"
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {format(date, "PPP", { locale: es })}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={date}
                onSelect={(date) => date && setDate(date)}
                initialFocus
                locale={es}
                className={cn("p-3 pointer-events-auto")}
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      <div className="space-y-2 border-t pt-4">
        <h3 className="text-lg font-medium">Datos del Cliente</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="client">Nombre del Cliente</Label>
            <Input 
              id="client" 
              value={client} 
              onChange={(e) => setClient(e.target.value)} 
              placeholder="Ej: Ana María López" 
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Teléfono</Label>
            <Input 
              id="phone" 
              value={phone} 
              onChange={(e) => setPhone(e.target.value)} 
              placeholder="+56 9 XXXX XXXX" 
              required
            />
          </div>
        </div>
      </div>

      <div className="space-y-4 border-t pt-4">
        <h3 className="text-lg font-medium">Servicios</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="service">Servicio</Label>
            <Select value={currentService} onValueChange={handleServiceChange}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar servicio" />
              </SelectTrigger>
              <SelectContent>
                {availableServices.map(service => (
                  <SelectItem key={service.id} value={service.id}>{service.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="professional">Profesional</Label>
            <Select value={currentProfessional} onValueChange={setCurrentProfessional}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar profesional" />
              </SelectTrigger>
              <SelectContent>
                {professionals.map(prof => (
                  <SelectItem key={prof.id} value={prof.id}>
                    {prof.name} ({prof.occupation})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="price">Precio (CLP)</Label>
            <div className="flex">
              <Input 
                id="price" 
                value={currentPrice} 
                onChange={(e) => setCurrentPrice(e.target.value)} 
                type="number" 
                placeholder="Ej: 12000" 
                className="rounded-r-none"
              />
              <Button 
                type="button"
                onClick={handleAddService}
                className="rounded-l-none bg-salon-primary hover:bg-salon-secondary"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {services.length > 0 && (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Servicio</TableHead>
                  <TableHead>Profesional</TableHead>
                  <TableHead>Precio</TableHead>
                  <TableHead className="w-[80px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {services.map(service => (
                  <TableRow key={service.id}>
                    <TableCell>{service.name}</TableCell>
                    <TableCell>{service.professional}</TableCell>
                    <TableCell>{formatPrice(service.price)}</TableCell>
                    <TableCell>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveService(service.id)}
                        className="h-8 w-8 text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                <TableRow>
                  <TableCell colSpan={2} className="text-right font-medium">Total:</TableCell>
                  <TableCell className="font-bold">{formatPrice(calculateTotal())}</TableCell>
                  <TableCell></TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      <div className="flex justify-end space-x-2 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onComplete}
        >
          Cancelar
        </Button>
        <Button 
          type="submit" 
          className="bg-salon-primary hover:bg-salon-secondary"
          disabled={services.length === 0 || !client || !phone || !folio}
        >
          Guardar Orden
        </Button>
      </div>
    </form>
  );
}
