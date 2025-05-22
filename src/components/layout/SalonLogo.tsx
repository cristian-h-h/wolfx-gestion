import { cn } from "@/lib/utils";
import { useEmpresa } from "@/context/EmpresaContext";

interface SalonLogoProps {
  className?: string;
}

export default function SalonLogo({ className }: SalonLogoProps) {
  const empresa = useEmpresa();
  const logo = empresa?.logo || "/default-logo.png";
  const nombreFantasia = empresa?.nombreFantasia || "Nombre Empresa";

  return (
    <div className={cn("flex items-center justify-center", className)}>
      <img 
        src={logo}
        alt={nombreFantasia}
        className="h-full max-h-10"
        style={{ objectFit: "contain" }}
      />
      <span className="ml-3 font-bold text-lg">{nombreFantasia}</span>
    </div>
  );
}
