import { NextRequest, NextResponse } from "next/server";
import { RowDataPacket } from "mysql2";
import pool from "@/config/mysql";

export async function GET(request: NextRequest) {
  try {
    // 1. Leer todos los grupos junto con el conteo de miembros
    const [rows]: [RowDataPacket[], any] = await pool.query(
      `
      SELECT 
        g.id,
        g.name,
        g.description,
        g.created_at,
        g.updated_at,
        COUNT(gm.id) AS studentCount
      FROM \`groups\` AS g
      LEFT JOIN \`group_members\` AS gm
        ON gm.group_id = g.id
      GROUP BY g.id
      ORDER BY g.id;
      `
    );

    // 2. Devolver JSON con la lista de grupos y su conteo de estudiantes
    return NextResponse.json({ isOK: true, groups: rows }, { status: 200 });
  } catch (error: any) {
    console.error("Error en GET /api/groups:", error);
    return NextResponse.json(
      {
        isOK: false,
        code: "internal_error",
        message: "Error interno al obtener los grupos",
        error: error.message,
      },
      { status: 500 }
    );
  }
}
