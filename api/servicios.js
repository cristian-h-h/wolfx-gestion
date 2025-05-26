import { connectToDatabase } from "./mongodb.js";

// API para gestionar servicios multiempresa
export default async function handler(req, res) {
  const { db } = await connectToDatabase();

  // --- GET: Listar servicios ---
  // Permite filtrar por empresaRUT y búsqueda por nombre/categoría
  if (req.method === "GET") {
    const { empresaRUT, search } = req.query;
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
    const servicios = await db
      .collection("servicios")
      .find(filtro)
      .sort({ nombre: 1 })
      .limit(200)
      .toArray();
    return res.status(200).json(servicios);
  }

  // --- POST: Agregar servicio ---
  if (req.method === "POST") {
    const { nombre, categoria, precio, empresaRUT } = req.body;
    if (!nombre || !precio || !empresaRUT) {
      return res.status(400).json({ error: "Faltan campos obligatorios" });
    }
    const servicio = {
      nombre,
      categoria: categoria ?? "",
      precio: Number(precio),
      empresaRUT,
      creadoEn: new Date(),
    };
    const result = await db.collection("servicios").insertOne(servicio);
    return res.status(201).json({ message: "Servicio agregado", id: result.insertedId });
  }

  // --- PUT: Editar servicio ---
  if (req.method === "PUT") {
    const { id, nombre, categoria, precio, empresaRUT } = req.body;
    if (!id || !empresaRUT) {
      return res.status(400).json({ error: "Faltan campos obligatorios" });
    }
    const { ObjectId } = require("mongodb");
    const result = await db.collection("servicios").updateOne(
      { _id: new ObjectId(id), empresaRUT },
      { $set: { nombre, categoria, precio: Number(precio), actualizadoEn: new Date() } }
    );
    if (result.matchedCount === 0) {
      return res.status(404).json({ error: "Servicio no encontrado" });
    }
    return res.status(200).json({ message: "Servicio actualizado" });
  }

  // --- DELETE: Eliminar servicio ---
  if (req.method === "DELETE") {
    const { id, empresaRUT } = req.body;
    if (!id || !empresaRUT) {
      return res.status(400).json({ error: "Faltan campos obligatorios" });
    }
    const { ObjectId } = require("mongodb");
    const result = await db.collection("servicios").deleteOne({ _id: new ObjectId(id), empresaRUT });
    if (result.deletedCount === 0) {
      return res.status(404).json({ error: "Servicio no encontrado" });
    }
    return res.status(200).json({ message: "Servicio eliminado" });
  }

  // --- Método no permitido ---
  return res.status(405).json({ error: "Método no permitido" });
}