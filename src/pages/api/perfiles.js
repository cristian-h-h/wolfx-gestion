import { connectToDatabase } from "./mongodb";
import { ObjectId } from "mongodb";

export default async function handler(req, res) {
  const { db } = await connectToDatabase();

  if (req.method === "GET") {
    // Filtrar por empresaRUT si viene en la query
    const { empresaRUT } = req.query || {};
    const filtro = empresaRUT ? { empresaRUT } : {};
    const perfiles = await db.collection("perfiles").find(filtro).toArray();
    return res.status(200).json(perfiles);
  }

  if (req.method === "POST") {
    // Crear perfil
    const nuevoPerfil = req.body;
    await db.collection("perfiles").insertOne(nuevoPerfil);
    return res.status(201).json({ message: "Perfil creado" });
  }

  if (req.method === "PUT") {
    // Editar perfil
    const { id, ...rest } = req.body;
    if (!id) {
      return res.status(400).json({ message: "ID requerido para editar perfil" });
    }
    await db.collection("perfiles").updateOne(
      { _id: new ObjectId(id) },
      { $set: rest }
    );
    return res.status(200).json({ message: "Perfil actualizado" });
  }

  if (req.method === "DELETE") {
    // Eliminar perfil
    const { id } = req.body;
    if (!id) {
      return res.status(400).json({ message: "ID requerido para eliminar perfil" });
    }
    await db.collection("perfiles").deleteOne({ _id: new ObjectId(id) });
    return res.status(200).json({ message: "Perfil eliminado" });
  }

  res.status(405).json({ message: "Método no permitido" });
}