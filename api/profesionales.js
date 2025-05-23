import { connectToDatabase } from "./mongodb";

// API para gestionar profesionales multiempresa
export default async function handler(req, res) {
  const { db } = await connectToDatabase();

  // --- GET: Listar profesionales ---
  // Permite filtrar por empresaRUT y búsqueda por nombre/categoría
  if (req.method === "GET") {
    const { empresaRUT, search, categoria } = req.query;
    if (!empresaRUT) {
      return res.status(400).json({ error: "Falta empresaRUT en la consulta" });
    }
    const filtro = { empresaRUT };
    if (search) {
      filtro.$or = [
        { nombre: { $regex: search, $options: "i" } },
        { categoria: { $regex: search, $options: "i" } },
      ];
    }
    if (categoria) {
      filtro.categoria = categoria;
    }
    const profesionales = await db
      .collection("profesionales")
      .find(filtro)
      .sort({ nombre: 1 })
      .limit(200)
      .toArray();
    return res.status(200).json(profesionales);
  }

  // --- POST: Agregar profesional ---
  if (req.method === "POST") {
    const { nombre, categoria, email, telefono, empresaRUT } = req.body;
    if (!nombre || !empresaRUT) {
      return res.status(400).json({ error: "Faltan campos obligatorios" });
    }
    const profesional = {
      nombre,
      categoria: categoria ?? "",
      email: email ?? "",
      telefono: telefono ?? "",
      empresaRUT,
      creadoEn: new Date(),
    };
    const result = await db.collection("profesionales").insertOne(profesional);
    return res.status(201).json({ message: "Profesional agregado", id: result.insertedId });
  }

  // --- PUT: Editar profesional ---
  if (req.method === "PUT") {
    const { id, nombre, categoria, email, telefono, empresaRUT } = req.body;
    if (!id || !empresaRUT) {
      return res.status(400).json({ error: "Faltan campos obligatorios" });
    }
    const { ObjectId } = require("mongodb");
    const result = await db.collection("profesionales").updateOne(
      { _id: new ObjectId(id), empresaRUT },
      { $set: { nombre, categoria, email, telefono, actualizadoEn: new Date() } }
    );
    if (result.matchedCount === 0) {
      return res.status(404).json({ error: "Profesional no encontrado" });
    }
    return res.status(200).json({ message: "Profesional actualizado" });
  }

  // --- DELETE: Eliminar profesional ---
  if (req.method === "DELETE") {
    const { id, empresaRUT } = req.body;
    if (!id || !empresaRUT) {
      return res.status(400).json({ error: "Faltan campos obligatorios" });
    }
    const { ObjectId } = require("mongodb");
    const result = await db.collection("profesionales").deleteOne({ _id: new ObjectId(id), empresaRUT });
    if (result.deletedCount === 0) {
      return res.status(404).json({ error: "Profesional no encontrado" });
    }
    return res.status(200).json({ message: "Profesional eliminado" });
  }

  // --- Método no permitido ---
  return res.status(405).json({ error: "Método no permitido" });
}