
// Direct export of the toast function from Sonner
import { toast } from "sonner";

export { toast };

// Create a compatibility layer for components expecting useToast()
export function useToast() {
  return {
    toast,
    // For backward compatibility with toaster.tsx
    toasts: []
  };
}
