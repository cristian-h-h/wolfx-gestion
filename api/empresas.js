import { connectToDatabase } from "./mongodb";
import { ObjectId } from "mongodb";

export default async function handler(req, res) {
  const { db } = await connectToDatabase();

  try {
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

      // Evitar duplicados por RUT
      const exists = await db.collection("empresas").findOne({ rut: empresa.rut });
      if (exists) {
        return res.status(409).json({ message: "Ya existe una empresa con ese RUT." });
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
        { _id: new ObjectId(id) },
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
      await db.collection("empresas").deleteOne({ _id: new ObjectId(id) });
      return res.status(200).json({ message: "Empresa eliminada" });
    }

    res.status(405).json({ message: "Método no permitido" });
  } catch (error) {
    console.error(error); // <-- agrega esto
    res.status(500).json({ message: "Error en la operación", error: error.message });
  }
}