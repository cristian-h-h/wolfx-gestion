import { connectToDatabase } from "./mongodb.js";

// API para registrar y gestionar atenciones (citas realizadas) multiempresa
export default async function handler(req, res) {
  const { db } = await connectToDatabase();

  // --- GET: Listar atenciones ---
  // Permite filtrar por empresaRUT, folio, cliente, servicio, profesional y rango de fechas
  if (req.method === "GET") {
    const { empresaRUT, folio, cliente, servicio, profesional, desde, hasta } = req.query;
    if (!empresaRUT) {
      return res.status(400).json({ error: "Falta empresaRUT en la consulta" });
    }
    const filtro = { empresaRUT };

    if (folio) filtro.folio = folio;
    if (cliente) filtro["cliente.nombre"] = { $regex: cliente, $options: "i" };
    if (servicio) filtro["servicios.servicio"] = { $regex: servicio, $options: "i" };
    if (profesional) filtro["servicios.profesional"] = { $regex: profesional, $options: "i" };
    if (desde || hasta) {
      filtro.fecha = {};
      if (desde) filtro.fecha.$gte = new Date(desde);
      if (hasta) filtro.fecha.$lte = new Date(hasta);
    }

    const atenciones = await db
      .collection("atenciones")
      .find(filtro)
      .sort({ fecha: -1 })
      .limit(100)
      .toArray();
    return res.status(200).json(atenciones);
  }

  // --- POST: Registrar nueva atención ---
  if (req.method === "POST") {
    const { folio, cliente, telefono, fecha, servicios, materiales, pagos, total, empresaRUT } = req.body;
    if (!folio || !cliente || !fecha || !servicios || !pagos || !empresaRUT) {
      return res.status(400).json({ error: "Faltan campos obligatorios" });
    }
    const atencion = {
      folio,
      cliente,
      telefono,
      fecha: new Date(fecha),
      servicios,    // [{ servicio, profesional, valor, materiales }]
      materiales,   // [{ nombre, valor }]
      pagos,        // [{ tipo, monto }]
      total,
      empresaRUT,
      creadaEn: new Date(),
    };
    const result = await db.collection("atenciones").insertOne(atencion);
    return res.status(201).json({ message: "Atención registrada", id: result.insertedId });
  }

  // --- PUT: Editar atención existente ---
  if (req.method === "PUT") {
    const { id, ...updates } = req.body;
    if (!id) {
      return res.status(400).json({ error: "Falta id de la atención" });
    }
    const { ObjectId } = require("mongodb");
    const result = await db.collection("atenciones").updateOne(
      { _id: new ObjectId(id) },
      { $set: { ...updates, actualizadaEn: new Date() } }
    );
    if (result.matchedCount === 0) {
      return res.status(404).json({ error: "Atención no encontrada" });
    }
    return res.status(200).json({ message: "Atención actualizada" });
  }

  // --- DELETE: Eliminar atención ---
  if (req.method === "DELETE") {
    const { id } = req.body;
    if (!id) {
      return res.status(400).json({ error: "Falta id de la atención" });
    }
    const { ObjectId } = require("mongodb");
    const result = await db.collection("atenciones").deleteOne({ _id: new ObjectId(id) });
    if (result.deletedCount === 0) {
      return res.status(404).json({ error: "Atención no encontrada" });
    }
    return res.status(200).json({ message: "Atención eliminada" });
  }

  // --- Método no permitido ---
  return res.status(405).json({ error: "Método no permitido" });
}