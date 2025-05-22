
import { toast, Toaster as SonnerToaster } from "sonner";

export function Toaster() {
  return <SonnerToaster position="bottom-right" closeButton />;
}

export { toast };
