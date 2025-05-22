
import { Button } from "@/components/ui/button";
import { Save } from "lucide-react";

interface CommissionPageHeaderProps {
  isEditing: boolean;
  onSaveChanges: () => void;
  onStartEditing: () => void;
}

export const CommissionPageHeader = ({
  isEditing,
  onSaveChanges,
  onStartEditing,
}: CommissionPageHeaderProps) => {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
      <h1 className="page-title mb-0">Gestión de Comisiones</h1>
      {isEditing ? (
        <Button 
          onClick={onSaveChanges}
          className="bg-salon-primary hover:bg-salon-secondary"
        >
          <Save className="h-4 w-4 mr-2" /> Guardar cambios
        </Button>
      ) : (
        <Button 
          onClick={onStartEditing}
          variant="outline"
        >
          Editar comisiones
        </Button>
      )}
    </div>
  );
};
