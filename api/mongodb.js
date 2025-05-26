import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI;
const options = {};

let client;
let clientPromise;

if (!process.env.MONGODB_URI) {
  throw new Error("Please add your Mongo URI to .env");
}

if (process.env.NODE_ENV === "development") {
  // En desarrollo, usa una variable global para evitar múltiples conexiones
  if (!global._mongoClientPromise) {
    client = new MongoClient(uri, options);
    global._mongoClientPromise = (async () => {
      try {
        await client.connect();
        return client;
      } catch (error) {
        console.error("Failed to connect to MongoDB (development):", error);
        return Promise.reject(error);
      }
    })();
  }
  clientPromise = global._mongoClientPromise;
} else {
  // En producción, crea una nueva conexión cada vez
  client = new MongoClient(uri, options);
  clientPromise = (async () => {
    try {
      await client.connect();
      return client;
    } catch (error) {
      console.error("Failed to connect to MongoDB (production):", error);
      return Promise.reject(error);
    }
  })();
}

export async function connectToDatabase() {
  try {
    const client = await clientPromise;
    // Si tu URI incluye el nombre de la base de datos, puedes dejarlo así:
    const db = client.db();
    return { client, db };
  } catch (error) {
    console.error("Failed to get database connection from clientPromise:", error);
    throw new Error("Could not connect to database");
  }
}