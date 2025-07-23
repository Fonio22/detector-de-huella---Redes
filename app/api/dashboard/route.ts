// file: /app/api/dashboard/route.ts  (Next.js 13+ app dir)
// ó /pages/api/dashboard.ts si usas pages/

import { NextRequest, NextResponse } from "next/server";
import { RowDataPacket } from "mysql2";
import pool from "@/config/mysql";

export async function GET(request: NextRequest) {
  try {
    // Total de estudiantes
    const [[{ totalStudents }]] = await pool.query<RowDataPacket[]>(
      `SELECT COUNT(*) AS totalStudents FROM members;`
    );
    // Total de grupos
    const [[{ totalGroups }]] = await pool.query<RowDataPacket[]>(
      `SELECT COUNT(*) AS totalGroups FROM \`groups\`;`
    );
    // Total de registros de asistencia
    const [[{ totalRegisteredStudents }]] = await pool.query<RowDataPacket[]>(
      `SELECT COUNT(*) AS totalRegisteredStudents FROM assistance;`
    );
    // Asistencias por día de la semana actual (lunes=1…domingo=7)
    const [attendanceRows]: [RowDataPacket[], any] = await pool.query(
      `
      SELECT
        DAYOFWEEK(assistance_date) AS weekday, 
        COUNT(*) AS count
      FROM assistance
      WHERE WEEK(assistance_date, 1) = WEEK(CURDATE(), 1)
      GROUP BY weekday
      ORDER BY weekday;
      `
    );

    // Mapea 1→Lunes … 7→Domingo
    const dayNames = [
      "",
      "Lunes",
      "Martes",
      "Miércoles",
      "Jueves",
      "Viernes",
      "Sábado",
      "Domingo",
    ];
    const attendanceByDay = attendanceRows.map((r) => ({
      day: dayNames[r.weekday],
      count: r.count,
    }));

    return NextResponse.json(
      {
        isOK: true,
        totalStudents,
        totalGroups,
        totalRegisteredStudents,
        attendanceByDay,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error en GET /api/dashboard:", error);
    return NextResponse.json(
      {
        isOK: false,
        code: "internal_error",
        message: "Error interno al obtener el dashboard",
        error: error.message,
      },
      { status: 500 }
    );
  }
}
