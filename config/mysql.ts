import mysql, { PoolOptions } from "mysql2/promise";

const access: PoolOptions = {
  host: process.env.DB_MYSQL_HOST,
  user: process.env.DB_MYSQL_USER,
  password: process.env.DB_MYSQL_PASS,
  database: process.env.DB_MYSQL_DATABASE,
  port: Number(process.env.DB_MYSQL_PORT),
  waitForConnections: true,
  connectionLimit: 20,
};

const pool = mysql.createPool(access);

export default pool;
