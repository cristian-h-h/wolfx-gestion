import { useState } from "react";
import MainLayout from "@/components/layout/MainLayout";
import { toast } from "@/hooks/use-toast";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { AccessDenied } from "@/components/comisiones/AccessDenied";

interface CommissionRule {
  id: number;
  serviceCategory: string;
  professionalId: number;
  percentage: number;
}

const professionals = [
  { id: 1, name: "Carolina Herrera", occupation: "Estilista" },
  { id: 2, name: "Juan Pérez", occupation: "Estilista" },
  { id: 3, name: "María Rodríguez", occupation: "Manicurista" },
  { id: 4, name: "Carlos Muñoz", occupation: "Barbero" },
];

const serviceCategories = [
  "Peluquería",
  "Estética",
  "Manicure",
  "Pedicure",
  "Barbería",
  "Coloración"
];

const initialCommissionRules: CommissionRule[] = [
  { id: 1, serviceCategory: "Peluquería", professionalId: 1, percentage: 30 },
  { id: 2, serviceCategory: "Peluquería", professionalId: 2, percentage: 30 },
  { id: 3, serviceCategory: "Manicure", professionalId: 3, percentage: 40 },
  { id: 4, serviceCategory: "Barbería", professionalId: 4, percentage: 35 },
  { id: 5, serviceCategory: "Coloración", professionalId: 1, percentage: 25 },
];

export default function Comisiones() {
  const [commissionRules, setCommissionRules] = useState<CommissionRule[]>(initialCommissionRules);
  const [selectedProfessional, setSelectedProfessional] = useState<string>("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [form, setForm] = useState({
    serviceCategory: "",
    professionalId: "",
    percentage: "",
  });
  const [isEditing, setIsEditing] = useState(false);

  // Verificar si el usuario actual es administrador
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const isAdmin = user.role === "admin";

  // Filtrar reglas por profesional
  const filteredRules = selectedProfessional === "all"
    ? commissionRules
    : commissionRules.filter(rule => rule.professionalId === Number(selectedProfessional));

  const handlePercentageChange = (id: number, value: string) => {
    const percentage = parseInt(value, 10);
    if (isNaN(percentage) || percentage < 0 || percentage > 100) return;
    setCommissionRules(rules =>
      rules.map(rule =>
        rule.id === id ? { ...rule, percentage } : rule
      )
    );
  };

  const handleFormChange = (field: string, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const addNewRule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.serviceCategory || !form.professionalId || !form.percentage) {
      toast("Completa todos los campos requeridos.", { style: { backgroundColor: 'red', color: 'white' } });
      return;
    }
    const percentage = parseInt(form.percentage, 10);
    if (isNaN(percentage) || percentage < 0 || percentage > 100) {
      toast("El porcentaje debe ser un número entre 0 y 100", { style: { backgroundColor: 'red', color: 'white' } });
      return;
    }
    const professionalId = parseInt(form.professionalId, 10);
    const exists = commissionRules.find(
      rule => rule.serviceCategory === form.serviceCategory && rule.professionalId === professionalId
    );
    if (exists) {
      toast("Ya existe una regla para esta combinación de categoría y profesional", { style: { backgroundColor: 'red', color: 'white' } });
      return;
    }
    const newId = commissionRules.length > 0 ? Math.max(...commissionRules.map(r => r.id)) + 1 : 1;
    setCommissionRules([
      ...commissionRules,
      {
        id: newId,
        serviceCategory: form.serviceCategory,
        professionalId,
        percentage,
      },
    ]);
    setForm({ serviceCategory: "", professionalId: "", percentage: "" });
    setIsDialogOpen(false);
    toast("Regla de comisión creada correctamente");
  };

  const saveChanges = () => {
    setIsEditing(false);
    toast("Cambios guardados correctamente");
  };

  if (!isAdmin) {
    return <AccessDenied />;
  }

  return (
    <MainLayout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
          <h1 className="page-title mb-0">Reglas de Comisiones</h1>
          <div className="flex gap-2">
            <Button
              variant={isEditing ? "default" : "outline"}
              onClick={() => setIsEditing(!isEditing)}
            >
              {isEditing ? "Cancelar edición" : "Editar reglas"}
            </Button>
            {isEditing && (
              <Button className="bg-salon-primary hover:bg-salon-secondary" onClick={saveChanges}>
                Guardar cambios
              </Button>
            )}
            {isEditing && (
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-salon-primary hover:bg-salon-secondary">
                    Nueva Regla
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Agregar nueva regla de comisión</DialogTitle>
                  </DialogHeader>
                  <form className="space-y-4 py-4" onSubmit={addNewRule}>
                    <div className="space-y-2">
                      <Label htmlFor="serviceCategory">Categoría de servicio</Label>
                      <select
                        id="serviceCategory"
                        className="w-full border rounded px-2 py-1"
                        value={form.serviceCategory}
                        onChange={e => handleFormChange("serviceCategory", e.target.value)}
                        required
                      >
                        <option value="">Seleccionar categoría</option>
                        {serviceCategories.map(cat => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="professionalId">Profesional</Label>
                      <select
                        id="professionalId"
                        className="w-full border rounded px-2 py-1"
                        value={form.professionalId}
                        onChange={e => handleFormChange("professionalId", e.target.value)}
                        required
                      >
                        <option value="">Seleccionar profesional</option>
                        {professionals.map(prof => (
                          <option key={prof.id} value={prof.id}>{prof.name} ({prof.occupation})</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="percentage">Porcentaje (%)</Label>
                      <input
                        id="percentage"
                        type="number"
                        className="w-full border rounded px-2 py-1"
                        value={form.percentage}
                        onChange={e => handleFormChange("percentage", e.target.value)}
                        min={0}
                        max={100}
                        required
                      />
                    </div>
                    <div className="flex justify-end space-x-2 pt-4">
                      <Button variant="outline" type="button" onClick={() => setIsDialogOpen(false)}>
                        Cancelar
                      </Button>
                      <Button className="bg-salon-primary hover:bg-salon-secondary" type="submit">
                        Guardar
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-end">
          <div>
            <Label htmlFor="professionalFilter">Filtrar por profesional</Label>
            <select
              id="professionalFilter"
              className="border rounded px-2 py-1"
              value={selectedProfessional}
              onChange={e => setSelectedProfessional(e.target.value)}
            >
              <option value="all">Todos</option>
              {professionals.map(prof => (
                <option key={prof.id} value={prof.id}>{prof.name} ({prof.occupation})</option>
              ))}
            </select>
          </div>
        </div>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Categoría</TableHead>
                <TableHead>Profesional</TableHead>
                <TableHead>Porcentaje (%)</TableHead>
                {isEditing && <TableHead>Editar</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRules.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={isEditing ? 4 : 3} className="text-center py-4">
                    No hay reglas de comisión
                  </TableCell>
                </TableRow>
              ) : (
                filteredRules.map(rule => (
                  <TableRow key={rule.id}>
                    <TableCell>{rule.serviceCategory}</TableCell>
                    <TableCell>
                      {professionals.find(p => p.id === rule.professionalId)?.name || "—"}
                    </TableCell>
                    <TableCell>
                      {isEditing ? (
                        <input
                          type="number"
                          className="w-20 border rounded px-2 py-1"
                          value={rule.percentage}
                          min={0}
                          max={100}
                          onChange={e => handlePercentageChange(rule.id, e.target.value)}
                        />
                      ) : (
                        `${rule.percentage}%`
                      )}
                    </TableCell>
                    {isEditing && <TableCell></TableCell>}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </MainLayout>
  );
}
