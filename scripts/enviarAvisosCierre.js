import { connectToDatabase } from "../api/mongodb.js";
import nodemailer from "nodemailer";

const EMAIL_DESTINO = "cyl.contadores@live.cl";
const BASE_URL = "gestion-peluqueria.cl"; // Cambia por tu dominio real

async function main() {
  const { db } = await connectToDatabase();
  const hoy = new Date();

  const empresas = await db.collection("empresas").find({ arriendoActivo: true }).toArray();

  for (const empresa of empresas) {
    if (!empresa.fechaProximoPago) continue;
    const proximo = new Date(empresa.fechaProximoPago);
    const diff = Math.ceil((hoy - proximo) / (1000 * 60 * 60 * 24));
    if (diff > 3) {
      // Envía email
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: EMAIL_DESTINO,
          pass: "Flounder@2012", // Usa una contraseña de aplicación de Gmail
        },
      });

      await transporter.sendMail({
        from: `"WolfX Gestión" <${EMAIL_DESTINO}>`,
        to: EMAIL_DESTINO,
        subject: `Empresa con atraso: ${empresa.nombreFantasia}`,
        html: `
          <p>La empresa <b>${empresa.nombreFantasia}</b> (RUT: ${empresa.rut}) tiene más de 3 días de atraso.</p>
          <p>
            <a href="${BASE_URL}/cerrar-acceso?empresaRUT=${empresa.rut}">
              Cerrar acceso ahora
            </a>
          </p>
          <p>Recuerda ingresar la clave de cierre para confirmar.</p>
        `,
      });

      console.log(`Aviso enviado para empresa: ${empresa.nombreFantasia}`);
    }
  }
  console.log("Avisos enviados.");
}

main().catch(console.error);