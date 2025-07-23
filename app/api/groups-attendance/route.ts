// File: /app/api/groups-attendance/route.ts
import { NextRequest, NextResponse } from "next/server";
import { RowDataPacket } from "mysql2";
import pool from "@/config/mysql";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get("date");
    if (!date) {
      return NextResponse.json(
        {
          isOK: false,
          code: "missing_date",
          message: "Debe indicar la fecha como ?date=YYYY-MM-DD",
        },
        { status: 400 }
      );
    }

    const [rows]: [RowDataPacket[], any] = await pool.query(
      `
      SELECT
        g.id,
        g.name,
        g.description,
        COALESCE(m.membersCount, 0)    AS totalStudents,
        COALESCE(a.presentCount, 0)    AS presentCount
      FROM \`groups\` AS g

      -- Total de miembros por grupo
      LEFT JOIN (
        SELECT
          group_id,
          COUNT(*) AS membersCount
        FROM \`group_members\`
        GROUP BY group_id
      ) AS m
        ON m.group_id = g.id

      -- Total de asistencias en la fecha dada
      LEFT JOIN (
        SELECT
          group_id,
          COUNT(*) AS presentCount
        FROM \`assistance\`
        WHERE assistance_date = ?
        GROUP BY group_id
      ) AS a
        ON a.group_id = g.id

      ORDER BY g.name;
      `,
      [date]
    );

    return NextResponse.json(
      { isOK: true, date, groups: rows },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error en GET /api/groups-attendance:", error);
    return NextResponse.json(
      {
        isOK: false,
        code: "internal_error",
        message: "Error al obtener asistencia por grupo",
        error: error.message,
      },
      { status: 500 }
    );
  }
}
