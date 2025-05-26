import { connectToDatabase } from "./mongodb.js";
import { ObjectId } from "mongodb";

export default async function handler(req, res) {
  const { db } = await connectToDatabase();

  try {
    if (req.method === "GET") {
      // Filtrar por empresaRUT si viene en la query
      const { empresaRUT } = req.query || {};
      if (!empresaRUT) {
        return res.status(400).json({ message: "empresaRUT es obligatorio" });
      }
      const perfiles = await db.collection("perfiles").find({ empresaRUT }).toArray();
      return res.status(200).json(perfiles);
    }

    if (req.method === "POST") {
      // Crear perfil
      const nuevoPerfil = req.body;

      // Validar campos obligatorios
      if (
        !nuevoPerfil.nombre ||
        !nuevoPerfil.email ||
        !nuevoPerfil.empresaRUT ||
        !nuevoPerfil.permisos
      ) {
        return res.status(400).json({ message: "Faltan campos obligatorios" });
      }

      // Evitar duplicados por email y empresaRUT
      const exists = await db.collection("perfiles").findOne({
        email: nuevoPerfil.email,
        empresaRUT: nuevoPerfil.empresaRUT,
      });
      if (exists) {
        return res.status(409).json({ message: "Ya existe un perfil con ese email para esta empresa." });
      }

      await db.collection("perfiles").insertOne(nuevoPerfil);
      return res.status(201).json({ message: "Perfil creado" });
    }

    if (req.method === "PUT") {
      // Editar perfil
      const { id, ...rest } = req.body;
      if (!id || !rest.empresaRUT) {
        return res.status(400).json({ message: "ID y empresaRUT son obligatorios para editar perfil" });
      }

      // Evitar duplicados al editar (si cambia el email)
      if (rest.email) {
        const exists = await db.collection("perfiles").findOne({
          _id: { $ne: new ObjectId(id) },
          email: rest.email,
          empresaRUT: rest.empresaRUT,
        });
        if (exists) {
          return res.status(409).json({ message: "Ya existe un perfil con ese email para esta empresa." });
        }
      }

      await db.collection("perfiles").updateOne(
        { _id: new ObjectId(id), empresaRUT: rest.empresaRUT },
        { $set: rest }
      );
      return res.status(200).json({ message: "Perfil actualizado" });
    }

    if (req.method === "DELETE") {
      // Eliminar perfil
      const { id, empresaRUT } = req.body;
      if (!id || !empresaRUT) {
        return res.status(400).json({ message: "ID y empresaRUT son obligatorios para eliminar perfil" });
      }
      await db.collection("perfiles").deleteOne({ _id: new ObjectId(id), empresaRUT });
      return res.status(200).json({ message: "Perfil eliminado" });
    }

    res.status(405).json({ message: "Método no permitido" });
  } catch (error) {
    res.status(500).json({ message: "Error en el servidor", error: error.message });
  }
}