import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

interface SearchBarProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  placeholder?: string; // Permite personalizar el placeholder si se desea
}

export const SearchBar = ({ searchTerm, onSearchChange, placeholder }: SearchBarProps) => {
  return (
    <div className="flex items-center">
      <div className="relative flex-grow">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
        <Input
          placeholder={placeholder || "Buscar por nombre, email o rol..."}
          className="pl-8"
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          aria-label="Buscar perfiles"
          autoComplete="off" // Sugerencia: evitar autocompletado para mayor control
        />
      </div>
    </div>
  );
};
