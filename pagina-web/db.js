const fs = require("fs");
const path = require("path");

let envLoaded = false;
let pool = null;

function loadEnvFile() {
  if (envLoaded) return;
  envLoaded = true;
  const envPath = path.join(__dirname, ".env");
  if (!fs.existsSync(envPath)) return;
  const lines = fs.readFileSync(envPath, "utf8").split(/\r?\n/);
  lines.forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) return;
    const separatorIndex = trimmed.indexOf("=");
    if (separatorIndex <= 0) return;
    const key = trimmed.slice(0, separatorIndex).trim();
    const rawValue = trimmed.slice(separatorIndex + 1).trim();
    const value = rawValue.replace(/^"(.*)"$/, "$1").replace(/^'(.*)'$/, "$1");
    if (!(key in process.env)) process.env[key] = value;
  });
}

function getStorageMode() {
  loadEnvFile();
  return String(process.env.BEIM_STORAGE_MODE || "local").trim().toLowerCase() || "local";
}

function buildConnectionConfig() {
  loadEnvFile();
  if (process.env.DATABASE_URL) {
    return {
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.PGSSLMODE === "require" ? { rejectUnauthorized: false } : false,
    };
  }
  return {
    host: process.env.PGHOST || "127.0.0.1",
    port: Number(process.env.PGPORT || 5432),
    database: process.env.PGDATABASE || "beim_local",
    user: process.env.PGUSER || "postgres",
    password: process.env.PGPASSWORD || "postgres",
    ssl: process.env.PGSSLMODE === "require" ? { rejectUnauthorized: false } : false,
  };
}

async function getPool() {
  if (getStorageMode() !== "postgres") return null;
  if (pool) return pool;
  let pgModule;
  try {
    pgModule = await import("pg");
  } catch (error) {
    throw new Error('No se encontro el paquete "pg". Ejecuta "npm install" dentro de D:\\WEB\\beim.');
  }
  pool = new pgModule.Pool(buildConnectionConfig());
  return pool;
}

async function query(text, params = []) {
  const dbPool = await getPool();
  if (!dbPool) {
    throw new Error("PostgreSQL no esta activo para este proyecto.");
  }
  return dbPool.query(text, params);
}

async function withTransaction(run) {
  const dbPool = await getPool();
  if (!dbPool) {
    throw new Error("PostgreSQL no esta activo para este proyecto.");
  }
  const client = await dbPool.connect();
  try {
    await client.query("begin");
    const result = await run(client);
    await client.query("commit");
    return result;
  } catch (error) {
    await client.query("rollback");
    throw error;
  } finally {
    client.release();
  }
}

async function getDatabaseHealth() {
  const mode = getStorageMode();
  if (mode !== "postgres") {
    return {
      mode,
      status: "disabled",
      message: "La web sigue usando almacenamiento local mientras completas la migracion.",
    };
  }
  try {
    const dbPool = await getPool();
    await dbPool.query("select current_database() as database_name, now() as server_time");
    return {
      mode,
      status: "ok",
      message: "Conexion PostgreSQL lista.",
    };
  } catch (error) {
    return {
      mode,
      status: "error",
      message: error.message,
    };
  }
}

async function closeDatabase() {
  if (!pool) return;
  await pool.end();
  pool = null;
}

module.exports = {
  closeDatabase,
  getDatabaseHealth,
  getStorageMode,
  loadEnvFile,
  query,
  withTransaction,
};
