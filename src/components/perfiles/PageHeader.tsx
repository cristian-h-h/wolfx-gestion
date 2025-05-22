import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PageHeaderProps {
  onNewProfile: () => void;
  empresaNombre?: string;
  empresaRUT?: string;
}

export const PageHeader = ({ onNewProfile, empresaNombre, empresaRUT }: PageHeaderProps) => {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
      <div>
        <h1 className="mb-0 text-3xl font-bold text-white">
          Administración de Perfiles
          {(empresaNombre || empresaRUT) && (
            <span className="ml-2 text-lg text-gray-200 font-normal">
              {empresaNombre && <>({empresaNombre})</>}
              {empresaRUT && (
                <span className="ml-2 text-base text-gray-300">RUT: {empresaRUT}</span>
              )}
            </span>
          )}
        </h1>
        <p className="text-white text-lg mt-1">
          Crea y administra perfiles de usuario, asignando acceso y acciones permitidas por cada página del sistema.
          <br />
          <span className="text-base text-gray-200">
            Cada perfil está asociado a una empresa (identificada por su RUT). Solo puedes ver y administrar los perfiles de tu empresa.
          </span>
        </p>
      </div>
      <Button className="bg-salon-primary hover:bg-salon-secondary" onClick={onNewProfile}>
        <Plus className="h-4 w-4 mr-2" /> Nuevo Perfil
      </Button>
    </div>
  );
};
