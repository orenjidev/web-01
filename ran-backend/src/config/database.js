const baseOptions = {
  options: {
    encrypt: false,
    trustServerCertificate: true,
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000,
  },
};

export const getDbBaseConfig = () => ({
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  server: process.env.DB_HOST,
  port: process.env.DB_PORT ? Number(process.env.DB_PORT) : undefined,
  ...baseOptions,
});

export const getDbConfig = (databaseName) => ({
  ...getDbBaseConfig(),
  database: databaseName,
});
