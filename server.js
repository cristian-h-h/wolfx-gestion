import "dotenv/config";
import express from "express";
import cors from "cors";
import { MongoClient, ObjectId } from "mongodb";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const app = express();
const port = 3001;

app.use(cors());
app.use(express.json());

const uri = process.env.MONGODB_URI;
const JWT_SECRET = process.env.JWT_SECRET || "supersecreto";
const client = new MongoClient(uri);

async function connect() {
  if (!client.topology?.isConnected()) {
    await client.connect();
  }
  return client.db();
}

// --- AUTH (LOGIN) ---
app.post("/api/auth", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: "Email y contraseña requeridos" });
  }

  const db = await connect();
  const user = await db.collection("perfiles").findOne({ email });

  if (!user) {
    return res.status(401).json({ message: "Usuario no encontrado" });
  }

  let valid = false;
  if (user.password && user.password.startsWith("$2a$")) {
    valid = await bcrypt.compare(password, user.password);
  } else {
    valid = user.password === password;
  }

  if (!valid) {
    return res.status(401).json({ message: "Contraseña incorrecta" });
  }

  // --- Buscar la empresa asociada al usuario ---
  const rutBuscado = (user.empresaRUT || "").trim();
  const empresa = await db.collection("empresas").findOne({ rut: rutBuscado });
  const empresaData = empresa
    ? {
        nombreFantasia: empresa.nombreFantasia,
        logo: empresa.logo,
      }
    : {};

  const { password: _, ...userData } = user;

  const token = jwt.sign(
    { id: user._id, email: user.email, role: user.role, empresaRUT: user.empresaRUT },
    JWT_SECRET,
    { expiresIn: "8h" }
  );

console.log("Empresa encontrada:", empresa);
console.log("EmpresaData:", empresaData);
console.log("Usuario que se enviará:", {
  ...userData,
  empresa: empresaData
});

  return res.status(200).json({
    token,
    user: {
      ...userData,
      empresa: empresaData
    },
  });
});

// --- EMPRESAS ---

// GET empresas
app.get("/api/empresas", async (req, res) => {
  try {
    const db = await connect();
    const empresas = await db.collection("empresas").find({}).toArray();
    res.json(empresas);
  } catch (err) {
    res.status(500).json({ message: "Error al obtener empresas", error: err.message });
  }
});

// POST empresa
app.post("/api/empresas", async (req, res) => {
  try {
    const empresa = req.body;
    if (
      !empresa.rut ||
      !empresa.razonSocial ||
      !empresa.nombreFantasia ||
      !empresa.direccion ||
      !empresa.adminNombre ||
      !empresa.adminTelefono ||
      !empresa.adminCorreo ||
      !empresa.clienteTelefono ||
      !empresa.logo
    ) {
      return res.status(400).json({ message: "Faltan campos obligatorios" });
    }
    const db = await connect();
    await db.collection("empresas").insertOne(empresa);
    res.status(201).json({ message: "Empresa creada" });
  } catch (err) {
    res.status(500).json({ message: "Error al crear empresa", error: err.message });
  }
});

// PUT empresa (actualizar)
app.put("/api/empresas", async (req, res) => {
  try {
    const { id, ...rest } = req.body;
    if (!id) return res.status(400).json({ message: "ID requerido" });

    const db = await connect();
    const result = await db.collection("empresas").updateOne(
      { _id: new ObjectId(id) },
      { $set: rest }
    );
    if (result.modifiedCount === 1) {
      res.json({ message: "Empresa actualizada" });
    } else {
      res.status(404).json({ message: "Empresa no encontrada" });
    }
  } catch (err) {
    res.status(500).json({ message: "Error al actualizar empresa", error: err.message });
  }
});

// --- PERFILES ---

// GET perfiles (con filtro por empresaRUT)
app.get("/api/perfiles", async (req, res) => {
  try {
    const { empresaRUT } = req.query;
    const filtro = empresaRUT ? { empresaRUT } : {};
    const db = await connect();
    const perfiles = await db.collection("perfiles").find(filtro).toArray();
    res.json(perfiles);
  } catch (err) {
    res.status(500).json({ message: "Error al obtener perfiles", error: err.message });
  }
});

// POST perfil
app.post("/api/perfiles", async (req, res) => {
  try {
    const nuevoPerfil = req.body;
    const db = await connect();
    await db.collection("perfiles").insertOne(nuevoPerfil);
    res.status(201).json({ message: "Perfil creado" });
  } catch (err) {
    res.status(500).json({ message: "Error al crear perfil", error: err.message });
  }
});

// PUT perfil
app.put("/api/perfiles", async (req, res) => {
  try {
    const { id, ...rest } = req.body;
    if (!id) return res.status(400).json({ message: "ID requerido para editar perfil" });
    const db = await connect();
    await db.collection("perfiles").updateOne(
      { _id: new ObjectId(id) },
      { $set: rest }
    );
    res.json({ message: "Perfil actualizado" });
  } catch (err) {
    res.status(500).json({ message: "Error al actualizar perfil", error: err.message });
  }
});

// DELETE perfil
app.delete("/api/perfiles", async (req, res) => {
  try {
    const { id } = req.body;
    if (!id) return res.status(400).json({ message: "ID requerido para eliminar perfil" });
    const db = await connect();
    await db.collection("perfiles").deleteOne({ _id: new ObjectId(id) });
    res.json({ message: "Perfil eliminado" });
  } catch (err) {
    res.status(500).json({ message: "Error al eliminar perfil", error: err.message });
  }
});

app.listen(port, () => {
  console.log(`Backend API escuchando en http://localhost:${port}`);
});

// --- SERVICIOS ---

// GET servicios (con filtro por empresaRUT y búsqueda opcional)
app.get("/api/servicios", async (req, res) => {
  try {
    const { empresaRUT, search } = req.query;
    if (!empresaRUT) {
      return res.status(400).json({ error: "Falta empresaRUT en la consulta" });
    }
    const filtro = { empresaRUT };
    if (search) {
      filtro.$or = [
        { nombre: { $regex: search, $options: "i" } },
        { categoria: { $regex: search, $options: "i" } },
      ];
    }
    const db = await connect();
    const servicios = await db
      .collection("servicios")
      .find(filtro)
      .sort({ nombre: 1 })
      .limit(200)
      .toArray();
    res.status(200).json(servicios);
  } catch (err) {
    res.status(500).json({ message: "Error al obtener servicios", error: err.message });
  }
});

// POST servicio
app.post("/api/servicios", async (req, res) => {
  try {
    const { nombre, categoria, precio, empresaRUT } = req.body;
    if (!nombre || !precio || !empresaRUT) {
      return res.status(400).json({ error: "Faltan campos obligatorios" });
    }
    const servicio = {
      nombre,
      categoria: categoria ?? "",
      precio: Number(precio),
      empresaRUT,
      creadoEn: new Date(),
    };
    const db = await connect();
    await db.collection("servicios").insertOne(servicio);
    res.status(201).json({ message: "Servicio creado" });
  } catch (err) {
    res.status(500).json({ message: "Error al crear servicio", error: err.message });
  }
});

// PUT servicio
app.put("/api/servicios", async (req, res) => {
  try {
    const { id, nombre, categoria, precio, empresaRUT } = req.body;
    if (!id || !empresaRUT) {
      return res.status(400).json({ error: "Faltan campos obligatorios" });
    }
    const db = await connect();
    const result = await db.collection("servicios").updateOne(
      { _id: new ObjectId(id), empresaRUT },
      { $set: { nombre, categoria, precio: Number(precio), actualizadoEn: new Date() } }
    );
    if (result.matchedCount === 0) {
      return res.status(404).json({ error: "Servicio no encontrado" });
    }
    res.status(200).json({ message: "Servicio actualizado" });
  } catch (err) {
    res.status(500).json({ message: "Error al actualizar servicio", error: err.message });
  }
});

// DELETE servicio
app.delete("/api/servicios", async (req, res) => {
  try {
    const { id, empresaRUT } = req.body;
    if (!id || !empresaRUT) {
      return res.status(400).json({ error: "Faltan campos obligatorios" });
    }
    const db = await connect();
    const result = await db.collection("servicios").deleteOne({ _id: new ObjectId(id), empresaRUT });
    if (result.deletedCount === 0) {
      return res.status(404).json({ error: "Servicio no encontrado" });
    }
    res.status(200).json({ message: "Servicio eliminado" });
  } catch (err) {
    res.status(500).json({ message: "Error al eliminar servicio", error: err.message });
  }
});