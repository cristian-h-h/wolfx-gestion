import { connectToDatabase } from "./mongodb.js";

export default async function handler(req, res) {
  try {
    const { db } = await connectToDatabase();
    if (req.method !== "GET") {
      return res.status(405).json({ error: "Método no permitido" });
    }
    const { empresaRUT } = req.query;
    if (!empresaRUT) {
      return res.status(400).json({ error: "Falta empresaRUT en la consulta" });
    }

    // Fechas optimizadas
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0,0,0,0);
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23,59,59,999);

    const [
      totalClientes,
      totalCitasHoy,
      totalVentasHoy,
      totalVentasMes,
      totalProfesionales,
      topServicios,
      citasSemana,
      ventasPorDia,
      ocupacionProfesionales
    ] = await Promise.all([
      db.collection("clientes").countDocuments({ empresaRUT }),
      db.collection("citas").countDocuments({
        empresaRUT,
        fecha: { $gte: startOfToday, $lt: endOfToday }
      }),
      db.collection("ventas").aggregate([
        { $match: { empresaRUT, fecha: { $gte: startOfToday, $lt: endOfToday } } },
        { $group: { _id: null, total: { $sum: "$monto" } } }
      ]).toArray().then(r => r[0]?.total || 0),
      db.collection("ventas").aggregate([
        { $match: { empresaRUT, fecha: { $gte: startOfMonth, $lt: now } } },
        { $group: { _id: null, total: { $sum: "$monto" } } }
      ]).toArray().then(r => r[0]?.total || 0),
      db.collection("perfiles").countDocuments({ empresaRUT, role: "profesional" }),
      db.collection("ventas").aggregate([
        { $match: { empresaRUT } },
        { $unwind: "$items" },
        { $group: { _id: "$items.servicio", value: { $sum: 1 } } },
        { $sort: { value: -1 } },
        { $limit: 5 }
      ]).toArray(),
      db.collection("citas").aggregate([
        { $match: { empresaRUT, fecha: { $gte: startOfWeek, $lt: endOfWeek } } },
        { $group: { _id: { $dayOfWeek: "$fecha" }, citas: { $sum: 1 } } }
      ]).toArray(),
      db.collection("ventas").aggregate([
        { $match: { empresaRUT, fecha: { $gte: startOfWeek, $lt: endOfWeek } } },
        { $group: { _id: { $dayOfWeek: "$fecha" }, ventas: { $sum: "$monto" } } }
      ]).toArray(),
      db.collection("citas").aggregate([
        { $match: { empresaRUT, fecha: { $gte: startOfWeek, $lt: endOfWeek } } },
        { $group: { _id: "$profesional", value: { $sum: 1 } } },
        { $sort: { value: -1 } }
      ]).toArray()
    ]);

    return res.status(200).json({
      totalClientes,
      totalCitasHoy,
      totalVentasHoy,
      totalVentasMes,
      totalProfesionales,
      topServicios,
      citasSemana,
      ventasPorDia,
      ocupacionProfesionales
    });
  } catch (error) {
    console.error("Error en dashboard:", error);
    return res.status(500).json({ error: "Error interno del servidor" });
  }
}