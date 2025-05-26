import { connectToDatabase } from "./mongodb.js";

// API REST para inventario multiempresa
export default async function handler(req, res) {
  const { db } = await connectToDatabase();

  // --- GET: Listar productos de una empresa ---
  if (req.method === "GET") {
    const { empresaRUT } = req.query;
    if (!empresaRUT) {
      return res.status(400).json({ error: "Falta empresaRUT en la consulta" });
    }
    const productos = await db
      .collection("productos")
      .find({ empresaRUT })
      .toArray();
    return res.status(200).json(productos);
  }

  // --- POST: Agregar producto ---
  if (req.method === "POST") {
    const { nombre, stock, descripcion, imagenProducto, empresaRUT } = req.body;
    if (!nombre || !empresaRUT) {
      return res.status(400).json({ error: "Faltan campos obligatorios" });
    }
    const producto = {
      nombre,
      stock: stock ?? 0,
      descripcion: descripcion ?? "",
      imagenProducto: imagenProducto ?? "",
      empresaRUT,
      creadoEn: new Date(),
    };
    const result = await db.collection("productos").insertOne(producto);
    return res.status(201).json({ message: "Producto agregado", id: result.insertedId });
  }

  // --- PATCH: Actualizar stock de un producto ---
  if (req.method === "PATCH") {
    const { id, cantidad, empresaRUT } = req.body;
    if (!id || typeof cantidad !== "number" || !empresaRUT) {
      return res.status(400).json({ error: "Faltan campos obligatorios" });
    }
    const { ObjectId } = require("mongodb");
    const result = await db.collection("productos").updateOne(
      { _id: new ObjectId(id), empresaRUT },
      { $inc: { stock: cantidad } }
    );
    if (result.matchedCount === 0) {
      return res.status(404).json({ error: "Producto no encontrado" });
    }
    return res.status(200).json({ message: "Stock actualizado" });
  }

  // --- DELETE: Eliminar producto ---
  if (req.method === "DELETE") {
    const { id, empresaRUT } = req.body;
    if (!id || !empresaRUT) {
      return res.status(400).json({ error: "Faltan campos obligatorios" });
    }
    const { ObjectId } = require("mongodb");
    const result = await db.collection("productos").deleteOne({ _id: new ObjectId(id), empresaRUT });
    if (result.deletedCount === 0) {
      return res.status(404).json({ error: "Producto no encontrado" });
    }
    return res.status(200).json({ message: "Producto eliminado" });
  }

  // --- Método no permitido ---
  return res.status(405).json({ error: "Método no permitido" });
}