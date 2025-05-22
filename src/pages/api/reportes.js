import { connectToDatabase } from "./mongodb";

// API para reportes multiempresa (comisiones, servicios, ventas de productos)
export default async function handler(req, res) {
  const { db } = await connectToDatabase();

  if (req.method !== "GET") {
    return res.status(405).json({ error: "Método no permitido" });
  }

  const {
    empresaRUT,
    tipoInforme,      // "comisiones", "servicios", "ventas_productos"
    tipoVista,        // "resumen" o "detallado"
    profesional,
    ocupacion,
    fechaInicio,
    fechaFin,
    servicio,
    producto,
  } = req.query;

  if (!empresaRUT || !tipoInforme) {
    return res.status(400).json({ error: "Faltan parámetros obligatorios" });
  }

  // Construir filtro de fechas
  let filtroFecha = {};
  if (fechaInicio || fechaFin) {
    filtroFecha.fecha = {};
    if (fechaInicio) filtroFecha.fecha.$gte = new Date(fechaInicio);
    if (fechaFin) filtroFecha.fecha.$lte = new Date(fechaFin);
  }

  // --- Reporte de comisiones ---
  if (tipoInforme === "comisiones") {
    // Detallado: cada atención con servicios y comisiones
    if (tipoVista === "detallado") {
      const filtro = {
        empresaRUT,
        ...(profesional && { "servicios.profesional": profesional }),
        ...filtroFecha,
      };
      const atenciones = await db
        .collection("atenciones")
        .find(filtro)
        .sort({ fecha: -1 })
        .toArray();
      // Desglosar cada servicio de cada atención
      const detalle = [];
      atenciones.forEach((atencion) => {
        (atencion.servicios || []).forEach((serv) => {
          detalle.push({
            fecha: atencion.fecha,
            folio: atencion.folio,
            cliente: atencion.cliente,
            servicio: serv.servicio,
            profesional: serv.profesional,
            amount: serv.valor ?? 0,
            commission: serv.comision ?? 0,
          });
        });
      });
      return res.status(200).json(detalle);
    }
    // Resumen: total por profesional
    else {
      const filtro = {
        empresaRUT,
        ...filtroFecha,
      };
      const resumen = await db.collection("atenciones").aggregate([
        { $match: filtro },
        { $unwind: "$servicios" },
        ...(profesional ? [{ $match: { "servicios.profesional": profesional } }] : []),
        {
          $group: {
            _id: "$servicios.profesional",
            total: { $sum: "$servicios.valor" },
            commission: { $sum: "$servicios.comision" },
            count: { $sum: 1 },
          },
        },
        { $sort: { total: -1 } },
      ]).toArray();
      return res.status(200).json(resumen);
    }
  }

  // --- Reporte de servicios ---
  if (tipoInforme === "servicios") {
    const filtro = {
      empresaRUT,
      ...filtroFecha,
      ...(servicio && { "servicios.servicio": servicio }),
    };
    const servicios = await db.collection("atenciones").aggregate([
      { $match: filtro },
      { $unwind: "$servicios" },
      ...(servicio ? [{ $match: { "servicios.servicio": servicio } }] : []),
      {
        $group: {
          _id: "$servicios.servicio",
          total: { $sum: "$servicios.valor" },
          count: { $sum: 1 },
        },
      },
      { $sort: { total: -1 } },
    ]).toArray();
    return res.status(200).json(servicios);
  }

  // --- Reporte de ventas de productos ---
  if (tipoInforme === "ventas_productos") {
    const filtro = {
      empresaRUT,
      ...filtroFecha,
      ...(producto && { "productos.nombre": producto }),
    };
    const ventas = await db.collection("ventas").aggregate([
      { $match: filtro },
      { $unwind: "$productos" },
      ...(producto ? [{ $match: { "productos.nombre": producto } }] : []),
      {
        $group: {
          _id: "$productos.nombre",
          total: { $sum: "$productos.monto" },
          cantidad: { $sum: "$productos.cantidad" },
        },
      },
      { $sort: { total: -1 } },
    ]).toArray();
    return res.status(200).json(ventas);
  }

  // --- Si el tipo de informe no es válido ---
  return res.status(400).json({ error: "Tipo de informe no soportado" });
}