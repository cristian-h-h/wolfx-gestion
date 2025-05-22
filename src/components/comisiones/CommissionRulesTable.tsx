
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";

interface CommissionRule {
  id: number;
  serviceCategory: string;
  professionalId: number;
  percentage: number;
}

interface Professional {
  id: number;
  name: string;
  occupation: string;
}

interface CommissionRulesTableProps {
  rules: CommissionRule[];
  professionals: Professional[];
  isEditing: boolean;
  onPercentageChange: (id: number, value: string) => void;
}

export const CommissionRulesTable = ({
  rules,
  professionals,
  isEditing,
  onPercentageChange,
}: CommissionRulesTableProps) => {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Profesional</TableHead>
            <TableHead>Categoría de servicio</TableHead>
            <TableHead>Porcentaje (%)</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rules.length === 0 ? (
            <TableRow>
              <TableCell colSpan={3} className="text-center py-4">
                No se encontraron reglas de comisión
              </TableCell>
            </TableRow>
          ) : (
            rules.map((rule) => (
              <TableRow key={rule.id}>
                <TableCell>
                  {professionals.find(p => p.id === rule.professionalId)?.name || "Profesional desconocido"}
                </TableCell>
                <TableCell>{rule.serviceCategory}</TableCell>
                <TableCell>
                  {isEditing ? (
                    <div className="flex items-center">
                      <Input
                        type="number"
                        value={rule.percentage}
                        onChange={(e) => onPercentageChange(rule.id, e.target.value)}
                        className="w-20 mr-1"
                        min="0"
                        max="100"
                      />
                      <span>%</span>
                    </div>
                  ) : (
                    `${rule.percentage}%`
                  )}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
};
