import { connectToDatabase } from "./mongodb";

export default async function handler(req, res) {
  const { db } = await connectToDatabase();

  if (req.method === "GET") {
    // Obtener usuarios desde MongoDB
    const usuarios = await db.collection("usuarios").find({}).toArray();
    return res.status(200).json(usuarios);
  }

  if (req.method === "POST") {
    // Crear usuario en MongoDB
    const nuevoUsuario = req.body;
    if (!nuevoUsuario.email || !nuevoUsuario.password || !nuevoUsuario.role) {
      return res.status(400).json({ message: "Faltan campos obligatorios" });
    }
    await db.collection("usuarios").insertOne(nuevoUsuario);
    return res.status(201).json({ message: "Usuario creado" });
  }

  res.status(405).json({ message: "Método no permitido" });
}