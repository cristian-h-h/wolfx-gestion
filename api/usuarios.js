import { connectToDatabase } from "./mongodb";
import bcrypt from "bcryptjs";

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

    // Validar campos obligatorios
    if (!nuevoUsuario.email || !nuevoUsuario.password || !nuevoUsuario.role) {
      return res.status(400).json({ message: "Faltan campos obligatorios" });
    }

    // Validar roles permitidos
    const rolesPermitidos = ["administrador", "contador", "usuario1", "usuario2", "usuario3"];
    if (!rolesPermitidos.includes(nuevoUsuario.role)) {
      return res.status(400).json({ message: "Rol no permitido" });
    }

    // Validar unicidad del email
    const exists = await db.collection("usuarios").findOne({ email: nuevoUsuario.email });
    if (exists) {
      return res.status(409).json({ message: "El email ya está registrado" });
    }

    // Hashear la contraseña antes de guardar
    const hashedPassword = await bcrypt.hash(nuevoUsuario.password, 10);
    nuevoUsuario.password = hashedPassword;

    await db.collection("usuarios").insertOne(nuevoUsuario);
    return res.status(201).json({ message: "Usuario creado" });
  }

  res.status(405).json({ message: "Método no permitido" });
}