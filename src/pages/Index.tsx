import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const Index = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const userStr = localStorage.getItem("user");
    if (userStr) {
      // Si hay usuario autenticado, redirige al dashboard
      navigate("/dashboard");
    } else {
      // Si no, redirige al login
      navigate("/login");
    }
  }, [navigate]);

  return null;
};

export default Index;
