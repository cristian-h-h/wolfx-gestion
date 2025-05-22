
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Professional {
  id: number;
  name: string;
  occupation: string;
}

interface ProfessionalFilterProps {
  selectedProfessional: string;
  onProfessionalChange: (value: string) => void;
  professionals: Professional[];
}

export const ProfessionalFilter = ({
  selectedProfessional,
  onProfessionalChange,
  professionals,
}: ProfessionalFilterProps) => {
  return (
    <div className="w-full sm:w-64">
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Filtrar por profesional
      </label>
      <Select 
        value={selectedProfessional} 
        onValueChange={onProfessionalChange}
      >
        <SelectTrigger>
          <SelectValue placeholder="Seleccionar profesional" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos los profesionales</SelectItem>
          {professionals.map((professional) => (
            <SelectItem key={professional.id} value={professional.id.toString()}>
              {professional.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};
