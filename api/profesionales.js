import { connectToDatabase } from "./mongodb";

// API para gestionar profesionales multiempresa
export default async function handler(req, res) {
  const { db } = await connectToDatabase();

  // --- GET: Listar profesionales ---
  // Permite filtrar por empresaRUT y búsqueda por nombre o servicio
  if (req.method === "GET") {
    const { empresaRUT, search } = req.query;
    if (!empresaRUT) {
      return res.status(400).json({ error: "Falta empresaRUT en la consulta" });
    }
    const filtro = { empresaRUT };
    if (search) {
      filtro.$or = [
        { name: { $regex: search, $options: "i" } },
        { "services.serviceId": { $regex: search, $options: "i" } },
      ];
    }
    const profesionales = await db
      .collection("profesionales")
      .find(filtro)
      .sort({ name: 1 })
      .limit(200)
      .toArray();
    return res.status(200).json(profesionales);
  }

  // --- POST: Agregar profesional ---
  if (req.method === "POST") {
    const {
      internalCode,
      name,
      services,
      phone,
      email,
      address,
      commune,
      active,
      empresaRUT,
    } = req.body;

    if (!name || !empresaRUT || !internalCode) {
      return res.status(400).json({ error: "Faltan campos obligatorios" });
    }
    if (!Array.isArray(services) || services.length === 0) {
      return res.status(400).json({ error: "Debes asignar al menos un servicio" });
    }

    const profesional = {
      internalCode,
      name,
      services,
      phone: phone ?? "",
      email: email ?? "",
      address: address ?? "",
      commune: commune ?? "",
      active: active !== undefined ? !!active : true,
      empresaRUT,
      creadoEn: new Date(),
      actualizadoEn: new Date(),
    };

    const result = await db.collection("profesionales").insertOne(profesional);
    return res.status(201).json({ message: "Profesional agregado", id: result.insertedId });
  }

  // --- PUT: Editar profesional ---
  if (req.method === "PUT") {
    const {
      id,
      internalCode,
      name,
      services,
      phone,
      email,
      address,
      commune,
      active,
      empresaRUT,
    } = req.body;

    if (!id || !empresaRUT || !internalCode) {
      return res.status(400).json({ error: "Faltan campos obligatorios" });
    }
    if (!Array.isArray(services) || services.length === 0) {
      return res.status(400).json({ error: "Debes asignar al menos un servicio" });
    }

    const { ObjectId } = require("mongodb");
    const result = await db.collection("profesionales").updateOne(
      { _id: new ObjectId(id), empresaRUT },
      {
        $set: {
          internalCode,
          name,
          services,
          phone: phone ?? "",
          email: email ?? "",
          address: address ?? "",
          commune: commune ?? "",
          active: active !== undefined ? !!active : true,
          actualizadoEn: new Date(),
        },
      }
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