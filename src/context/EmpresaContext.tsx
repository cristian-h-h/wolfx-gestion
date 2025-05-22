// filepath: c:\Users\trabajo\corte-perfecto-gesti-main\src\context\EmpresaContext.tsx
import { createContext, useContext } from "react";

export interface Empresa {
  nombreFantasia?: string;
  logo?: string;
  [key: string]: any;
}

export const EmpresaContext = createContext<Empresa | null>(null);

export function useEmpresa() {
  return useContext(EmpresaContext);
}