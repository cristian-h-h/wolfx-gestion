
import MainLayout from "@/components/layout/MainLayout";

export const AccessDenied = () => {
  return (
    <MainLayout>
      <div className="flex flex-col items-center justify-center h-full py-20">
        <h1 className="text-2xl font-bold mb-4">Acceso denegado</h1>
        <p className="text-gray-600">No tienes permiso para acceder a esta página.</p>
      </div>
    </MainLayout>
  );
};
