import { connectToDatabase } from "./mongodb";

const CLAVE_CIERRE = process.env.CLAVE_CIERRE || "123456"; // Usa una clave segura en tu .env

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Método no permitido" });
  }

  const { empresaRUT, clave } = req.body;
  if (!empresaRUT || !clave) {
    return res.status(400).json({ message: "Faltan datos" });
  }
  if (clave !== CLAVE_CIERRE) {
    return res.status(401).json({ message: "Clave incorrecta" });
  }

  const { db } = await connectToDatabase();
  const result = await db.collection("empresas").updateOne(
    { rut: empresaRUT },
    { $set: { arriendoActivo: false } }
  );

  if (result.modifiedCount === 1) {
    return res.status(200).json({ message: "Acceso cerrado para la empresa" });
  } else {
    return res.status(404).json({ message: "Empresa no encontrada" });
  }
}