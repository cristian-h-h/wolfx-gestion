import { connectToDatabase } from "./mongodb";

// API para gestionar citas (agenda) multiempresa
export default async function handler(req, res) {
  const { db } = await connectToDatabase();

  // --- GET: Listar citas por fecha y empresa ---
  if (req.method === "GET") {
    const { empresaRUT, fecha } = req.query;
    if (!empresaRUT || !fecha) {
      return res.status(400).json({ error: "Faltan empresaRUT o fecha en la consulta" });
    }
    // Buscar citas del día (fecha en formato YYYY-MM-DD)
    const start = new Date(fecha + "T00:00:00.000Z");
    const end = new Date(fecha + "T23:59:59.999Z");
    const citas = await db
      .collection("citas")
      .find({
        empresaRUT,
        fecha: { $gte: start, $lte: end }
      })
      .sort({ fecha: 1 })
      .toArray();
    return res.status(200).json(citas);
  }

  // --- POST: Agendar nueva cita ---
  if (req.method === "POST") {
    const { cliente, telefono, atenciones, empresaRUT, fecha } = req.body;
    if (!cliente || !telefono || !atenciones || !empresaRUT || !fecha) {
      return res.status(400).json({ error: "Faltan campos obligatorios" });
    }
    // Generar folio único (puedes mejorar esto según tus reglas)
    const folio = "CITA-" + Date.now();
    const cita = {
      folio,
      cliente,
      telefono,
      atenciones, // [{ servicio, profesional, hora }]
      empresaRUT,
      fecha: new Date(fecha),
      creadaEn: new Date(),
    };
    const result = await db.collection("citas").insertOne(cita);
    return res.status(201).json({ message: "Cita agendada", folio, id: result.insertedId });
  }

  // --- Método no permitido ---
  return res.status(405).json({ error: "Método no permitido" });
}