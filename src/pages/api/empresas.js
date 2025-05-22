import { connectToDatabase } from "./mongodb";

export default async function handler(req, res) {
  const { db } = await connectToDatabase();
  console.log("Conexión a MongoDB exitosa"); // <-- Esto aparecerá en la terminal al hacer una petición

  if (req.method === "GET") {
    // Listar empresas
    const empresas = await db.collection("empresas").find({}).toArray();
    return res.status(200).json(empresas);
  }

  if (req.method === "POST") {
    // Crear empresa
    const empresa = req.body;
    if (
      !empresa.rut ||
      !empresa.razonSocial ||
      !empresa.nombreFantasia ||
      !empresa.direccion ||
      !empresa.adminNombre ||
      !empresa.adminTelefono ||
      !empresa.adminCorreo ||
      !empresa.clienteTelefono ||
      !empresa.logo
    ) {
      return res.status(400).json({ message: "Faltan campos obligatorios" });
    }
    await db.collection("empresas").insertOne(empresa);
    return res.status(201).json({ message: "Empresa creada" });
  }

  if (req.method === "PUT") {
    // Editar empresa
    const { id, ...rest } = req.body;
    if (!id) {
      return res.status(400).json({ message: "ID requerido para editar empresa" });
    }
    await db.collection("empresas").updateOne(
      { _id: id },
      { $set: rest }
    );
    return res.status(200).json({ message: "Empresa actualizada" });
  }

  if (req.method === "DELETE") {
    // Eliminar empresa
    const { id } = req.body;
    if (!id) {
      return res.status(400).json({ message: "ID requerido para eliminar empresa" });
    }
    await db.collection("empresas").deleteOne({ _id: id });
    return res.status(200).json({ message: "Empresa eliminada" });
  }

  res.status(405).json({ message: "Método no permitido" });
}