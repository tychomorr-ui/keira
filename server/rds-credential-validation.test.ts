import mysql from "mysql2/promise";
import { describe, expect, it } from "vitest";

const rdsPassword = process.env.RDS_DATABASE_PASSWORD;
const shouldRunLiveRdsProbe = process.env.RUN_RDS_CONNECTION_TEST === "true";

describe("São Paulo RDS credential validation", () => {
  it.skipIf(!rdsPassword || !shouldRunLiveRdsProbe)("authenticates the protected admin credential with a minimal TLS health query", async () => {
    const connection = await mysql.createConnection({
      host: "portal-db-01.cpuusu0g0chs.sa-east-1.rds.amazonaws.com",
      port: 3306,
      user: "admin",
      password: rdsPassword,
      ssl: { rejectUnauthorized: false },
      connectTimeout: 10_000,
    });

    try {
      const [rows] = await connection.query<Array<{ ok: number }>>("SELECT 1 AS ok");
      expect(rows[0]?.ok).toBe(1);
    } finally {
      await connection.end();
    }
  }, 15_000);
});
