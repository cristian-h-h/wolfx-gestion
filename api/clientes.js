import { connectToDatabase } from "./mongodb.js";

// API para gestionar clientes multiempresa
export default async function handler(req, res) {
  const { db } = await connectToDatabase();

  // --- GET: Listar clientes ---
  // Permite filtrar por empresaRUT, nombre, email o teléfono
  if (req.method === "GET") {
    const { empresaRUT, search } = req.query;
    if (!empresaRUT) {
      return res.status(400).json({ error: "Falta empresaRUT en la consulta" });
    }
    const filtro = { empresaRUT };
    if (search) {
      filtro.$or = [
        { nombre: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { telefono: { $regex: search, $options: "i" } },
      ];
    }
    const clientes = await db
      .collection("clientes")
      .find(filtro)
      .sort({ nombre: 1 })
      .limit(200)
      .toArray();
    return res.status(200).json(clientes);
  }

  // --- POST: Agregar cliente ---
  if (req.method === "POST") {
    const { nombre, email, telefono, empresaRUT } = req.body;
    if (!nombre || !email || !telefono || !empresaRUT) {
      return res.status(400).json({ error: "Faltan campos obligatorios" });
    }
    const cliente = {
      nombre,
      email,
      telefono,
      empresaRUT,
      creadoEn: new Date(),
    };
    const result = await db.collection("clientes").insertOne(cliente);
    return res.status(201).json({ message: "Cliente agregado", id: result.insertedId });
  }

  // --- PUT: Editar cliente ---
  if (req.method === "PUT") {
    const { id, nombre, email, telefono, empresaRUT } = req.body;
    if (!id || !empresaRUT) {
      return res.status(400).json({ error: "Faltan campos obligatorios" });
    }
    const { ObjectId } = require("mongodb");
    const result = await db.collection("clientes").updateOne(
      { _id: new ObjectId(id), empresaRUT },
      { $set: { nombre, email, telefono, actualizadoEn: new Date() } }
    );
    if (result.matchedCount === 0) {
      return res.status(404).json({ error: "Cliente no encontrado" });
    }
    return res.status(200).json({ message: "Cliente actualizado" });
  }

  // --- DELETE: Eliminar cliente ---
  if (req.method === "DELETE") {
    const { id, empresaRUT } = req.body;
    if (!id || !empresaRUT) {
      return res.status(400).json({ error: "Faltan campos obligatorios" });
    }
    const { ObjectId } = require("mongodb");
    const result = await db.collection("clientes").deleteOne({ _id: new ObjectId(id), empresaRUT });
    if (result.deletedCount === 0) {
      return res.status(404).json({ error: "Cliente no encontrado" });
    }
    return res.status(200).json({ message: "Cliente eliminado" });
  }

  // --- Método no permitido ---
  return res.status(405).json({ error: "Método no permitido" });
}