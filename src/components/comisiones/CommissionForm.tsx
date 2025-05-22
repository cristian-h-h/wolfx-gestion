
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";

interface NewCommissionRule {
  serviceCategory: string;
  professionalId: string;
  percentage: string;
}

interface Professional {
  id: number;
  name: string;
  occupation: string;
}

interface CommissionRule {
  id: number;
  serviceCategory: string;
  professionalId: number;
  percentage: number;
}

interface CommissionFormProps {
  newRule: NewCommissionRule;
  onNewRuleChange: (field: string, value: string) => void;
  onAddRule: () => void;
  professionals: Professional[];
  serviceCategories: string[];
}

export const CommissionForm = ({
  newRule,
  onNewRuleChange,
  onAddRule,
  professionals,
  serviceCategories,
}: CommissionFormProps) => {
  return (
    <div className="p-4 border rounded-md bg-gray-50 dark:bg-gray-800">
      <h3 className="font-medium mb-4">Agregar nueva regla de comisión</h3>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Profesional
          </label>
          <Select 
            value={newRule.professionalId} 
            onValueChange={(value) => onNewRuleChange("professionalId", value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Seleccionar profesional" />
            </SelectTrigger>
            <SelectContent>
              {professionals.map((professional) => (
                <SelectItem key={professional.id} value={professional.id.toString()}>
                  {professional.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Categoría de servicio
          </label>
          <Select 
            value={newRule.serviceCategory} 
            onValueChange={(value) => onNewRuleChange("serviceCategory", value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Seleccionar categoría" />
            </SelectTrigger>
            <SelectContent>
              {serviceCategories.map((category) => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Porcentaje (%)
          </label>
          <div className="flex items-center">
            <Input
              type="number"
              value={newRule.percentage}
              onChange={(e) => onNewRuleChange("percentage", e.target.value)}
              className="w-full mr-1"
              min="0"
              max="100"
              placeholder="Ej: 30"
            />
            <span>%</span>
          </div>
        </div>
      </div>

      <div className="mt-4 flex justify-end">
        <Button
          onClick={onAddRule}
          className="bg-salon-primary hover:bg-salon-secondary"
        >
          Agregar regla
        </Button>
      </div>
    </div>
  );
};
