import { NextRequest, NextResponse } from "next/server";
import { RowDataPacket } from "mysql2";
import pool from "@/config/mysql";

export async function GET(request: NextRequest) {
  try {
    // 1. Leer y validar date
    const dateParam = request.nextUrl.searchParams.get("date");
    if (!dateParam) {
      return NextResponse.json(
        {
          isOK: false,
          code: "missing_date",
          message: "Falta el parámetro 'date' (YYYY-MM-DD).",
        },
        { status: 400 }
      );
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateParam)) {
      return NextResponse.json(
        {
          isOK: false,
          code: "invalid_date",
          message: "El formato de 'date' debe ser YYYY-MM-DD.",
        },
        { status: 400 }
      );
    }

    // 2. Consulta con agregaciones
    const [rows]: [RowDataPacket[], any] = await pool.query(
      `
      SELECT
        g.id,
        g.name,
        g.description,
        g.created_at,
        g.updated_at,
        COUNT(DISTINCT gm.id)       AS studentCount,
        COUNT(DISTINCT a.id)        AS assistanceCount
      FROM \`groups\` AS g
      LEFT JOIN \`group_members\` AS gm
        ON gm.group_id = g.id
      LEFT JOIN \`assistance\` AS a
        ON a.group_id = g.id
       AND a.assistance_date = ?
      GROUP BY g.id
      ORDER BY g.id;
      `,
      [dateParam]
    );

    // 3. Responder
    return NextResponse.json(
      { isOK: true, date: dateParam, groups: rows },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error en GET /api/groups/attendance:", error);
    return NextResponse.json(
      {
        isOK: false,
        code: "internal_error",
        message: "Error interno al obtener los grupos con asistencia",
        error: error.message,
      },
      { status: 500 }
    );
  }
}
