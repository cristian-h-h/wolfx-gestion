import { connectToDatabase } from "./mongodb.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "supersecreto";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Método no permitido" });
  }

  // Recibimos empresaRUT además de email y password
  const { email, password, empresaRUT } = req.body;
  if (!email || !password || !empresaRUT) {
    return res.status(400).json({ message: "Email, contraseña y RUT de empresa requeridos" });
  }

  const { db } = await connectToDatabase();

  // Busca el usuario por email y empresaRUT
  const user = await db.collection("perfiles").findOne({ email, empresaRUT });
  console.log("Usuario encontrado:", user);

  if (!user) {
    return res.status(401).json({ message: "Usuario no encontrado para la empresa seleccionada" });
  }

  // Validación de contraseña (soporta bcrypt y texto plano solo para pruebas)
  let valid = false;
  if (user.password && user.password.startsWith("$2a$")) {
    valid = await bcrypt.compare(password, user.password);
  } else {
    valid = user.password === password;
  }

  if (!valid) {
    return res.status(401).json({ message: "Contraseña incorrecta" });
  }

  // Busca la empresa asociada al usuario (asegura que no haya espacios)
  const rutBuscado = (user.empresaRUT || "").trim();
  console.log("Buscando empresa con rut:", rutBuscado);
  const empresa = await db.collection("empresas").findOne({ rut: rutBuscado });
  console.log("Empresa encontrada:", empresa);

  // Solo incluye los campos necesarios de la empresa
  const empresaData = empresa
    ? {
        nombreFantasia: empresa.nombreFantasia,
        logo: empresa.logo,
        fechaProximoPago: empresa.fechaProximoPago,
        arriendoActivo: empresa.arriendoActivo
      }
    : {};

  // Mensaje de vencimiento
  let mensajeVencimiento = "";
  if (empresa && empresa.fechaProximoPago) {
    const hoy = new Date();
    const proximo = new Date(empresa.fechaProximoPago);
    const diff = Math.ceil((proximo - hoy) / (1000 * 60 * 60 * 24));
    if (diff <= 7 && diff >= 0) {
      mensajeVencimiento = `Próximo vencimiento: ${proximo.toLocaleDateString()}`;
    } else if (diff < 0) {
      mensajeVencimiento = `Arriendo vencido el: ${proximo.toLocaleDateString()}`;
    }
  }

  // No incluir la contraseña en el token ni en la respuesta
  const { password: _, ...userData } = user;

  // Genera el token JWT
  const token = jwt.sign(
    {
      id: user._id,
      email: user.email,
      role: user.role,
      empresaRUT: user.empresaRUT
    },
    JWT_SECRET,
    { expiresIn: "8h" }
  );

  // Log para depuración
  console.log("Usuario que se enviará:", {
    ...userData,
    permissions: userData.permissions || [],
    empresa: empresaData,
    mensajeVencimiento
  });

  // Incluye permisos, empresa y mensaje de vencimiento en la respuesta
  return res.status(200).json({
    token,
    user: {
      ...userData,
      permissions: userData.permissions || [],
      empresa: empresaData,
      mensajeVencimiento
    }
  });
}