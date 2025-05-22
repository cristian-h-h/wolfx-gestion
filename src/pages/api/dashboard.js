import { connectToDatabase } from "./mongodb";

// API para dashboard multiempresa
export default async function handler(req, res) {
  const { db } = await connectToDatabase();

  if (req.method !== "GET") {
    return res.status(405).json({ error: "Método no permitido" });
  }

  const { empresaRUT } = req.query;
  if (!empresaRUT) {
    return res.status(400).json({ error: "Falta empresaRUT en la consulta" });
  }

  // KPIs generales
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
      fecha: { $gte: new Date(new Date().setHours(0,0,0,0)), $lt: new Date(new Date().setHours(23,59,59,999)) }
    }),
    db.collection("ventas").aggregate([
      { $match: { empresaRUT, fecha: { $gte: new Date(new Date().setHours(0,0,0,0)), $lt: new Date(new Date().setHours(23,59,59,999)) } } },
      { $group: { _id: null, total: { $sum: "$monto" } } }
    ]).toArray().then(r => r[0]?.total || 0),
    db.collection("ventas").aggregate([
      { $match: { empresaRUT, fecha: { $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1), $lt: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1) } } },
      { $group: { _id: null, total: { $sum: "$monto" } } }
    ]).toArray().then(r => r[0]?.total || 0),
    db.collection("perfiles").countDocuments({ empresaRUT, role: "profesional" }),
    // Top servicios vendidos
    db.collection("ventas").aggregate([
      { $match: { empresaRUT } },
      { $unwind: "$items" },
      { $group: { _id: "$items.servicio", value: { $sum: 1 } } },
      { $sort: { value: -1 } },
      { $limit: 5 }
    ]).toArray(),
    // Citas por día de la semana actual
    db.collection("citas").aggregate([
      { $match: { empresaRUT, fecha: { $gte: new Date(new Date().setDate(new Date().getDate() - new Date().getDay())), $lt: new Date(new Date().setDate(new Date().getDate() + (6 - new Date().getDay()))) } } },
      { $group: { _id: { $dayOfWeek: "$fecha" }, citas: { $sum: 1 } } }
    ]).toArray(),
    // Ventas por día de la semana actual
    db.collection("ventas").aggregate([
      { $match: { empresaRUT, fecha: { $gte: new Date(new Date().setDate(new Date().getDate() - new Date().getDay())), $lt: new Date(new Date().setDate(new Date().getDate() + (6 - new Date().getDay()))) } } },
      { $group: { _id: { $dayOfWeek: "$fecha" }, ventas: { $sum: "$monto" } } }
    ]).toArray(),
    // Ocupación de profesionales (ejemplo: cantidad de citas por profesional esta semana)
    db.collection("citas").aggregate([
      { $match: { empresaRUT, fecha: { $gte: new Date(new Date().setDate(new Date().getDate() - new Date().getDay())), $lt: new Date(new Date().setDate(new Date().getDate() + (6 - new Date().getDay()))) } } },
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
}